"""
Hybrid Search Service combining ChromaDB vector search with keyword BM25.
Replaces pure keyword-only search with real vector similarity + keyword fusion.
"""

import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

# Global ChromaDB client singleton
_chroma_client = None
_chroma_collection = None


def _get_chroma_collection():
    """Lazy-initialize persistent ChromaDB collection."""
    global _chroma_client, _chroma_collection
    if _chroma_collection is None:
        try:
            import chromadb
            persist_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "chroma")
            os.makedirs(persist_dir, exist_ok=True)
            _chroma_client = chromadb.PersistentClient(path=persist_dir)
            _chroma_collection = _chroma_client.get_or_create_collection(
                name="code_chunks",
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"[HybridSearch] ChromaDB initialized at {persist_dir}. "
                        f"Collection has {_chroma_collection.count()} documents.")
        except ImportError:
            logger.warning("[HybridSearch] chromadb not installed. Using keyword-only search.")
            return None
        except Exception as e:
            logger.warning(f"[HybridSearch] ChromaDB init failed: {e}. Using keyword-only search.")
            return None
    return _chroma_collection


class HybridSearch:
    """
    Hybrid search combining:
    A. ChromaDB vector similarity search
    B. Keyword/BM25 search from SQLite/MySQL
    C. Metadata filtering
    D. Score fusion (Reciprocal Rank Fusion)
    """

    def __init__(self, db_session):
        self.session = db_session
        self.chroma_collection = _get_chroma_collection()

    def index_chunks(
        self,
        repo_id: str,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ):
        """
        Index chunks into ChromaDB for vector search.
        Call this after generating embeddings during repository ingestion.
        """
        if self.chroma_collection is None:
            return

        if not chunks or not embeddings:
            return

        try:
            # Remove old documents for this repo
            existing = self.chroma_collection.get(
                where={"repo_id": repo_id}
            )
            if existing and existing["ids"]:
                self.chroma_collection.delete(ids=existing["ids"])

            # Prepare batch data
            ids = []
            documents = []
            metadatas = []
            valid_embeddings = []

            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                chunk_id = f"{repo_id}_{i}"
                content = chunk.get("content", "")
                if not content or not content.strip():
                    continue

                ids.append(chunk_id)
                documents.append(content[:8000])  # ChromaDB document limit
                metadatas.append({
                    "repo_id": repo_id,
                    "file_path": chunk.get("file_path", ""),
                    "chunk_type": chunk.get("chunk_type", "generic"),
                    "language": chunk.get("language", ""),
                    "symbol_name": chunk.get("symbol_name", ""),
                    "tags": ",".join(chunk.get("tags", []))
                })
                valid_embeddings.append(embedding)

            if ids:
                # Batch insert (ChromaDB handles batching internally)
                batch_size = 500
                for start in range(0, len(ids), batch_size):
                    end = start + batch_size
                    self.chroma_collection.add(
                        ids=ids[start:end],
                        documents=documents[start:end],
                        metadatas=metadatas[start:end],
                        embeddings=valid_embeddings[start:end]
                    )

                logger.info(f"[HybridSearch] Indexed {len(ids)} chunks for repo {repo_id} into ChromaDB.")

        except Exception as e:
            logger.error(f"[HybridSearch] Failed to index chunks in ChromaDB: {e}")

    def search(
        self,
        repo_id: str,
        query: str,
        query_vector: List[float],
        n_results: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Execute hybrid search combining vector and keyword approaches.
        
        Args:
            repo_id: Repository identifier.
            query: Text query string.
            query_vector: Query embedding vector.
            n_results: Number of results to return.
            filters: Optional metadata filters (e.g., {'tags': ['auth', 'security']}).
            
        Returns:
            Fused and ranked list of matching documents.
        """
        if not query or not repo_id:
            return []

        # A. Vector search via ChromaDB
        vector_results = self._vector_search(repo_id, query_vector, n_results * 2, filters)

        # B. Keyword search via SQL database
        keyword_results = self._keyword_search(repo_id, query, n_results * 2, filters)

        # C. Reciprocal Rank Fusion
        fused = self._reciprocal_rank_fusion(vector_results, keyword_results, k=60)

        return fused[:n_results]

    def _vector_search(
        self,
        repo_id: str,
        query_vector: List[float],
        n_results: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search ChromaDB with embedding vector."""
        if self.chroma_collection is None:
            return []

        # Skip if query vector is all zeros (no real embedding available)
        if not query_vector or all(v == 0.0 for v in query_vector):
            return []

        try:
            where_filter = {"repo_id": repo_id}

            results = self.chroma_collection.query(
                query_embeddings=[query_vector],
                n_results=min(n_results, 20),
                where=where_filter,
                include=["documents", "metadatas", "distances"]
            )

            if not results or not results["ids"] or not results["ids"][0]:
                return []

            search_results = []
            for i, doc_id in enumerate(results["ids"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 1.0
                similarity = 1.0 - distance  # cosine distance to similarity

                # Apply tag filtering if specified
                if filters and "tags" in filters:
                    chunk_tags = (metadata.get("tags", "") or "").lower()
                    if not any(tag.lower() in chunk_tags for tag in filters["tags"]):
                        continue

                search_results.append({
                    "chunk_id": doc_id,
                    "file_path": metadata.get("file_path", ""),
                    "content": results["documents"][0][i] if results["documents"] else "",
                    "score": float(similarity),
                    "tags": metadata.get("tags", "").split(",") if metadata.get("tags") else [],
                    "source": "vector"
                })

            return search_results

        except Exception as e:
            logger.error(f"[HybridSearch] ChromaDB vector search failed: {e}")
            return []

    def _keyword_search(
        self,
        repo_id: str,
        query: str,
        n_results: int,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Keyword-based BM25-style search from SQL database."""
        from services.kb_service import RepoChunk

        query_words = [w.lower() for w in query.split() if len(w) > 2]
        if not query_words:
            query_words = [query.lower()]

        try:
            chunks = self.session.query(RepoChunk).filter_by(repo_id=repo_id).all()
            scored_chunks = []

            for c in chunks:
                score = 0.0
                content_lower = (c.content or "").lower()
                file_lower = (c.file_path or "").lower()

                # Apply tag filtering
                if filters and "tags" in filters:
                    chunk_tags = c.tags or []
                    chunk_type = (c.chunk_type or "").lower()
                    tag_match = any(
                        tag.lower() in chunk_type or tag.lower() in str(chunk_tags).lower()
                        for tag in filters["tags"]
                    )
                    if not tag_match:
                        continue

                for w in query_words:
                    if w in content_lower:
                        score += 1.0
                        score += content_lower.count(w) * 0.1
                    if w in file_lower:
                        score += 3.0

                if score > 0:
                    scored_chunks.append((score, c))

            scored_chunks.sort(key=lambda x: x[0], reverse=True)

            results = []
            for score, c in scored_chunks[:n_results]:
                results.append({
                    "chunk_id": c.id,
                    "file_path": c.file_path,
                    "content": c.content,
                    "score": float(score),
                    "tags": c.tags or [],
                    "source": "keyword"
                })

            return results

        except Exception as e:
            logger.error(f"[HybridSearch] Keyword search failed: {e}")
            return []

    def _reciprocal_rank_fusion(
        self,
        vector_results: List[Dict[str, Any]],
        keyword_results: List[Dict[str, Any]],
        k: int = 60
    ) -> List[Dict[str, Any]]:
        """
        Reciprocal Rank Fusion (RRF) to combine vector and keyword results.
        RRF score = sum(1 / (k + rank)) across all result lists.
        """
        scores = {}  # file_path -> (rrf_score, best_doc)

        for rank, doc in enumerate(vector_results):
            key = doc.get("file_path", doc.get("chunk_id", str(rank)))
            rrf_score = 1.0 / (k + rank + 1)
            if key in scores:
                scores[key] = (scores[key][0] + rrf_score, scores[key][1])
            else:
                scores[key] = (rrf_score, doc)

        for rank, doc in enumerate(keyword_results):
            key = doc.get("file_path", doc.get("chunk_id", str(rank)))
            rrf_score = 1.0 / (k + rank + 1)
            if key in scores:
                scores[key] = (scores[key][0] + rrf_score, scores[key][1])
            else:
                scores[key] = (rrf_score, doc)

        # Sort by fused RRF score
        fused = sorted(scores.values(), key=lambda x: x[0], reverse=True)

        results = []
        for rrf_score, doc in fused:
            doc_copy = doc.copy()
            doc_copy["rrf_score"] = float(rrf_score)
            results.append(doc_copy)

        return results
