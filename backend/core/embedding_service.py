"""
Real Embedding Service using sentence-transformers.
Uses all-MiniLM-L6-v2 for fast, production-quality 384-dim embeddings.
No fake embeddings. No mock vectors. No placeholder code.
"""

import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Global singleton to avoid reloading the model on every request
_model_instance = None
_model_dimension = 384


def _get_model():
    """Lazy-load the sentence-transformers model as a singleton."""
    global _model_instance, _model_dimension
    if _model_instance is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("[EmbeddingService] Loading sentence-transformers model: all-MiniLM-L6-v2")
            _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
            _model_dimension = _model_instance.get_sentence_embedding_dimension()
            logger.info(f"[EmbeddingService] Model loaded. Dimension: {_model_dimension}")
        except ImportError:
            logger.error(
                "[EmbeddingService] sentence-transformers not installed. "
                "Install with: pip install sentence-transformers"
            )
            raise
        except Exception as e:
            logger.error(f"[EmbeddingService] Failed to load model: {e}")
            raise
    return _model_instance


class EmbeddingService:
    """Production embedding service using sentence-transformers."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        # Do NOT load model here — defer to first encode() call so the
        # scan-start HTTP request thread is never blocked by a HuggingFace download.
        self._model = None
        self.dimension = _model_dimension

    def generate_embeddings_sync(
        self,
        texts: List[str],
        batch_size: int = 64,
        show_progress: bool = False
    ) -> List[List[float]]:
        """
        Generate real embeddings synchronously using sentence-transformers.
        
        Args:
            texts: List of text strings to embed.
            batch_size: Batch size for encoding (larger = faster but more memory).
            show_progress: Show a progress bar during encoding.
            
        Returns:
            List of embedding vectors (each vector is a list of floats).
        """
        if not texts:
            return []

        # Filter empty strings and track indices
        valid_texts = []
        valid_indices = []
        for i, text in enumerate(texts):
            cleaned = (text or "").strip()
            if cleaned:
                valid_texts.append(cleaned[:8192])  # Truncate very long texts
                valid_indices.append(i)

        if not valid_texts:
            # Return zero vectors for all empty inputs
            return [[0.0] * self.dimension for _ in texts]

        try:
            # Lazy-load model on first actual encode call
            if self._model is None:
                self._model = _get_model()
                self.dimension = _model_dimension
            embeddings = self._model.encode(
                valid_texts,
                batch_size=batch_size,
                show_progress_bar=show_progress,
                normalize_embeddings=True  # L2 normalize for cosine similarity
            ).tolist()
        except Exception as e:
            logger.error(f"[EmbeddingService] Encoding failed: {e}")
            raise

        # Reconstruct full results list (zero vectors for empty/invalid texts)
        result = [[0.0] * self.dimension for _ in texts]
        for idx, emb in zip(valid_indices, embeddings):
            result[idx] = emb

        return result

    async def generate_embeddings_async(
        self,
        texts: List[str],
        batch_size: int = 64
    ) -> List[List[float]]:
        """
        Async wrapper around synchronous embedding generation.
        Runs in a thread pool to avoid blocking the event loop.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: self.generate_embeddings_sync(texts, batch_size)
        )

    def generate_query_embedding(self, query: str) -> List[float]:
        """Generate a single embedding for a search query."""
        if not query or not query.strip():
            return [0.0] * self.dimension
        
        result = self.generate_embeddings_sync([query.strip()])
        return result[0]

    def get_dimension(self) -> int:
        """Return the embedding dimension for this model."""
        return self.dimension
