from typing import List, Dict, Any

class RepositoryGraph:
    def __init__(self):
        self.nodes = {}
        self.edges = []

    def add_node(self, node_id: str, label: str, properties: Dict[str, Any]):
        self.nodes[node_id] = {"label": label, "properties": properties}

    def add_edge(self, source_id: str, target_id: str, relationship: str):
        # Prevent duplicate edges
        edge = {"source": source_id, "target": target_id, "relationship": relationship}
        if edge not in self.edges:
            self.edges.append(edge)

    def build_from_chunks(self, chunks: List[Dict[str, Any]]):
        """
        Track relationships:
        * module -> imports
        * route -> middleware
        * service -> database
        * component -> API
        """
        for chunk in chunks:
            node_id = chunk.get('file_path')
            if not node_id:
                continue
            if node_id not in self.nodes:
                self.add_node(node_id, chunk.get('chunk_type', 'source_code'), chunk)
            
            # Simulated edge detection based on tags or simple string matching
            tags = chunk.get('tags', [])
            if 'database' in tags or 'db' in tags:
                self.add_edge(node_id, "database_layer", "CONNECTS_TO")
            if 'api' in tags or 'route' in tags:
                self.add_edge(node_id, "api_layer", "SERVES")

            # Parse imports from code content
            content = chunk.get('content', '')
            import_keywords = ["import ", "from ", "require(", "include "]
            for line in content.split('\n'):
                if any(kw in line for kw in import_keywords):
                    for other_chunk in chunks:
                        other_id = other_chunk.get('file_path')
                        if not other_id or other_id == node_id:
                            continue
                        # check if the file base name (e.g. auth from auth.py) is in the import line
                        other_base = other_id.replace('\\', '/').split('/')[-1].split('.')[0]
                        if len(other_base) > 2 and other_base in line:
                            self.add_edge(node_id, other_id, "imports")

    def get_related_nodes(self, node_id: str) -> List[str]:
        related = set()
        for edge in self.edges:
            if edge["source"] == node_id:
                related.add(edge["target"])
            elif edge["target"] == node_id:
                related.add(edge["source"])
        return list(related)

