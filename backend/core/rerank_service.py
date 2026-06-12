"""
Real Reranking Service using cross-encoder models.
Replaces the no-op placeholder with actual semantic reranking.
"""

import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Global singleton for cross-encoder model
_rerank_model = None


def _get_rerank_model():
    """Lazy-load the cross-encoder model as a singleton."""
    global _rerank_model
    if _rerank_model is None:
        try:
            from sentence_transformers import CrossEncoder
            logger.info("[RerankService] Loading cross-encoder: cross-encoder/ms-marco-MiniLM-L-6-v2")
            _rerank_model = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")
            logger.info("[RerankService] Cross-encoder loaded successfully.")
        except ImportError:
            logger.warning(
                "[RerankService] sentence-transformers not installed. "
                "Falling back to basic relevance scoring."
            )
            return None
        except Exception as e:
            logger.warning(f"[RerankService] Failed to load cross-encoder: {e}. Using fallback.")
            return None
    return _rerank_model


class RerankService:
    """Production reranking service using cross-encoder models."""

    def __init__(self):
        self._model = _get_rerank_model()

    def rerank(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_n: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Rerank documents based on semantic relevance to the query.
        
        Uses a cross-encoder model for precise query-document scoring.
        Falls back to keyword-based scoring if the model is unavailable.
        
        Args:
            query: The search query string.
            documents: List of document dicts, each must have a 'content' key.
            top_n: Number of top results to return.
            
        Returns:
            Reranked list of documents, limited to top_n.
        """
        if not documents:
            return []

        if not query or not query.strip():
            return documents[:top_n]

        if self._model is not None:
            return self._rerank_with_crossencoder(query, documents, top_n)
        else:
            return self._rerank_with_keywords(query, documents, top_n)

    def _rerank_with_crossencoder(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_n: int
    ) -> List[Dict[str, Any]]:
        """Rerank using cross-encoder model for high-precision scoring."""
        try:
            # Build query-document pairs
            pairs = []
            for doc in documents:
                content = doc.get("content", "")
                # Truncate to avoid exceeding model max length
                truncated = content[:512] if content else ""
                pairs.append((query, truncated))

            # Get relevance scores
            scores = self._model.predict(pairs)

            # Pair scores with documents and sort
            scored_docs = list(zip(scores, documents))
            scored_docs.sort(key=lambda x: x[0], reverse=True)

            # Add rerank score to each document
            result = []
            for score, doc in scored_docs[:top_n]:
                doc_copy = doc.copy()
                doc_copy["rerank_score"] = float(score)
                result.append(doc_copy)

            return result

        except Exception as e:
            logger.error(f"[RerankService] Cross-encoder reranking failed: {e}. Using fallback.")
            return self._rerank_with_keywords(query, documents, top_n)

    def _rerank_with_keywords(
        self,
        query: str,
        documents: List[Dict[str, Any]],
        top_n: int
    ) -> List[Dict[str, Any]]:
        """Fallback keyword-based reranking when cross-encoder is unavailable."""
        query_words = [w.lower() for w in query.split() if len(w) > 2]
        
        scored_docs = []
        for doc in documents:
            content = (doc.get("content", "") or "").lower()
            file_path = (doc.get("file_path", "") or "").lower()
            
            score = 0.0
            for word in query_words:
                # Content matches
                count = content.count(word)
                score += count * 0.5
                # File path matches (weighted higher)
                if word in file_path:
                    score += 3.0
                # Exact phrase bonus
                if word in content[:200]:
                    score += 1.0  # Boost matches near the beginning
            
            scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        
        result = []
        for score, doc in scored_docs[:top_n]:
            doc_copy = doc.copy()
            doc_copy["rerank_score"] = float(score)
            result.append(doc_copy)
        
        return result
