from typing import List, Dict, Any
from .hybrid_search import HybridSearch
from .rerank_service import RerankService

class RetrievalEngine:
    def __init__(self, db_session):
        self.session = db_session
        self.hybrid_search = HybridSearch(db_session)
        self.rerank_service = RerankService()

    def contextual_retrieval(self, repo_id: str, task_type: str, query: str, query_vector: List[float], n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieval must depend on task type.
        """
        filters = {}
        if task_type == 'architecture analysis':
            filters['tags'] = ['architecture', 'module']
        elif task_type == 'testing posture':
            filters['tags'] = ['test', 'coverage']
        elif task_type == 'security':
            filters['tags'] = ['auth', 'security', 'database']

        # 1. Hybrid Search
        results = self.hybrid_search.search(repo_id, query, query_vector, n_results=n_results*2, filters=filters)
        
        # 2. Re-ranking Layer
        reranked_results = self.rerank_service.rerank(query, results, top_n=n_results)
        
        return reranked_results
