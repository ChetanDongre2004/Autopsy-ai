import ast
import json
from typing import List, Dict, Any

class ChunkingService:
    def __init__(self):
        pass

    def parse_and_chunk(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        """
        Intelligent AST-based and structural parsing.
        Avoids fixed-size chunking.
        """
        chunks = []
        ext = file_path.split('.')[-1].lower() if '.' in file_path else ''
        
        # Determine language/type
        if ext == 'py':
            chunks.extend(self._chunk_python(file_path, content))
        elif ext in ['js', 'ts', 'jsx', 'tsx']:
            chunks.extend(self._chunk_javascript(file_path, content))
        elif ext in ['md', 'txt']:
            chunks.extend(self._chunk_markdown(file_path, content))
        elif ext in ['json', 'yaml', 'yml', 'toml'] or 'Dockerfile' in file_path:
            chunks.extend(self._chunk_config(file_path, content))
        else:
            # Fallback semantic chunking
            chunks.append({
                "file_path": file_path,
                "content": content[:2000],  # Fallback size
                "chunk_type": "generic",
                "symbol_name": "entire_file"
            })
            
        # Add metadata for every chunk
        for chunk in chunks:
            chunk['language'] = ext
            chunk['tags'] = self._extract_tags(chunk['content'])
            
        return chunks

    def _chunk_python(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        chunks = []
        try:
            tree = ast.parse(content)
            for node in tree.body:
                if isinstance(node, ast.FunctionDef) or isinstance(node, ast.AsyncFunctionDef):
                    chunks.append({
                        "file_path": file_path,
                        "content": ast.get_source_segment(content, node) or content,
                        "chunk_type": "function",
                        "symbol_name": node.name
                    })
                elif isinstance(node, ast.ClassDef):
                    chunks.append({
                        "file_path": file_path,
                        "content": ast.get_source_segment(content, node) or content,
                        "chunk_type": "class",
                        "symbol_name": node.name
                    })
                elif isinstance(node, (ast.Import, ast.ImportFrom)):
                    # Collect imports
                    pass
            if not chunks:
                chunks.append({"file_path": file_path, "content": content, "chunk_type": "module", "symbol_name": "module"})
        except Exception:
            chunks.append({"file_path": file_path, "content": content, "chunk_type": "code", "symbol_name": "module"})
        return chunks

    def _chunk_javascript(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        # Regex or simpler AST logic for JS/TS
        # In a real enterprise app, we'd use a JS parser or tree-sitter. 
        # For now, logical block separation based on keywords.
        chunks = []
        if 'function' in content or 'class ' in content or 'const ' in content:
             chunks.append({
                "file_path": file_path,
                "content": content,
                "chunk_type": "component" if 'React' in content or file_path.endswith('x') else "module",
                "symbol_name": "js_module"
             })
        else:
             chunks.append({"file_path": file_path, "content": content, "chunk_type": "script", "symbol_name": "script"})
        return chunks

    def _chunk_markdown(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        chunks = []
        sections = content.split('\n## ')
        for i, sec in enumerate(sections):
            prefix = "## " if i > 0 else ""
            chunks.append({
                "file_path": file_path,
                "content": prefix + sec,
                "chunk_type": "documentation",
                "symbol_name": f"section_{i}"
            })
        return chunks

    def _chunk_config(self, file_path: str, content: str) -> List[Dict[str, Any]]:
        return [{
            "file_path": file_path,
            "content": content,
            "chunk_type": "configuration",
            "symbol_name": "config_root"
        }]

    def _extract_tags(self, content: str) -> List[str]:
        tags = []
        content_lower = content.lower()
        if 'auth' in content_lower or 'password' in content_lower: tags.append('auth')
        if 'db' in content_lower or 'sql' in content_lower: tags.append('database')
        if 'api' in content_lower or 'fetch' in content_lower: tags.append('api')
        return tags
