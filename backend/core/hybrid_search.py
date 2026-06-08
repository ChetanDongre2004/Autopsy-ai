from typing import List, Dict, Any
from services.kb_service import RepoChunk

class HybridSearch:
    def __init__(self, db_session):
        self.session = db_session

    def search(self, repo_id: str, query: str, query_vector: List[float], n_results: int = 5, filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Implements Hybrid Search combining:
        A. Semantic Vector Search (fallback to keyword search on SQLite)
        B. Keyword/BM25 Search
        C. Metadata Filtering
        D. Repository-aware Ranking
        """
        if not query or not repo_id:
            return []
            
        query_words = [w.lower() for w in query.split() if len(w) > 2]
        if not query_words:
            query_words = [query.lower()]

        try:
            chunks = self.session.query(RepoChunk).filter_by(repo_id=repo_id).all()
            scored_chunks = []
            for c in chunks:
                score = 0
                content_lower = (c.content or "").lower()
                file_lower = (c.file_path or "").lower()
                
                # Filter matching
                if filters and 'tags' in filters:
                    chunk_type = (c.chunk_type or "").lower()
                    if not any(tag.lower() in chunk_type for tag in filters['tags']):
                        continue

                for w in query_words:
                    if w in content_lower:
                        score += 1
                        # give extra points for exact matches or multiple occurrences
                        score += content_lower.count(w) * 0.1
                    if w in file_lower:
                        score += 3.0  # weight file path match heavily

                if score > 0:
                    scored_chunks.append((score, c))

            scored_chunks.sort(key=lambda x: x[0], reverse=True)
            
            results = []
            for score, c in scored_chunks[:n_results]:
                results.append({
                    "chunk_id": c.id,
                    "file_path": c.file_path,
                    "content": c.content,
                    "score": score,
                    "tags": c.tags
                })
            return results
        except Exception as e:
            print(f"[HybridSearch] Error during search: {e}")
            return []


