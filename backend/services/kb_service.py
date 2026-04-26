import os
import time
import json
import uuid
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, String, Float, Integer, Text, ForeignKey, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import tempfile
import hashlib

# Vector Engine (Try importing Chroma, fallback if not available)
try:
    import chromadb
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

Base = declarative_base()

class Repository(Base):
    __tablename__ = 'repositories'
    id = Column(String, primary_key=True)
    url = Column(String, unique=True)
    owner = Column(String)
    name = Column(String)
    default_branch = Column(String)

class RepoScan(Base):
    __tablename__ = 'repo_scans'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    branch = Column(String)
    commit_sha = Column(String)
    score = Column(Integer)
    created_at = Column(Float)
    kpis = Column(JSON)
    tech_stack = Column(JSON)

class RepoFinding(Base):
    __tablename__ = 'repo_findings'
    id = Column(String, primary_key=True)
    scan_id = Column(String, ForeignKey('repo_scans.id'))
    title = Column(String)
    file_path = Column(String)
    severity = Column(String)
    owner_team = Column(String)
    category = Column(String)
    description = Column(Text)
    fix = Column(Text)
    code_snippet = Column(Text)
    effort = Column(String)

class KBChunk(Base):
    __tablename__ = 'kb_chunks'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    file_path = Column(String)
    content = Column(Text)
    chunk_type = Column(String)

class RepoTrend(Base):
    __tablename__ = 'repo_trends'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    score = Column(Integer)
    created_at = Column(Float)

class KnowledgeBaseEngine:
    def __init__(self, db_dir: str = None):
        if not db_dir:
            db_dir = os.path.join(tempfile.gettempdir(), 'autopsy_kb')
        os.makedirs(db_dir, exist_ok=True)
        
        # SQLite
        db_path = os.path.join(db_dir, 'intelligence.db')
        self.engine = create_engine(f'sqlite:///{db_path}')
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        
        # ChromaDB Vector DB
        self.vector_available = CHROMA_AVAILABLE
        if self.vector_available:
            try:
                self.chroma_client = chromadb.PersistentClient(path=os.path.join(db_dir, 'chroma_db'))
                self.collection = self.chroma_client.get_or_create_collection(name="repo_chunks")
            except Exception as e:
                print(f"Warning: ChromaDB initialization failed: {e}")
                self.vector_available = False
        
        # Fallback in-memory vector mock
        self.mock_vectors = []

    def get_session(self):
        return self.Session()

    def get_or_create_repo(self, url: str, owner: str, name: str, branch: str) -> Repository:
        session = self.get_session()
        try:
            repo = session.query(Repository).filter_by(url=url).first()
            if not repo:
                repo = Repository(id=uuid.uuid4().hex, url=url, owner=owner, name=name, default_branch=branch)
                session.add(repo)
                session.commit()
            return repo
        finally:
            session.close()

    def save_scan(self, scan_id: str, repo_id: str, branch: str, commit_sha: str, score: int, kpis: dict, tech_stack: dict):
        session = self.get_session()
        try:
            scan = RepoScan(id=scan_id, repo_id=repo_id, branch=branch, commit_sha=commit_sha, score=score, 
                            created_at=time.time(), kpis=kpis, tech_stack=tech_stack)
            session.add(scan)
            
            trend = RepoTrend(id=uuid.uuid4().hex, repo_id=repo_id, score=score, created_at=time.time())
            session.add(trend)
            session.commit()
        finally:
            session.close()

    def save_finding(self, scan_id: str, title: str, file_path: str, severity: str, owner_team: str, category: str, description: str, fix: str, code_snippet: str, effort: str):
        session = self.get_session()
        try:
            f = RepoFinding(id=uuid.uuid4().hex, scan_id=scan_id, title=title, file_path=file_path, severity=severity, owner_team=owner_team, category=category, description=description, fix=fix, code_snippet=code_snippet, effort=effort)
            session.add(f)
            session.commit()
        finally:
            session.close()

    def index_chunks(self, repo_id: str, chunks: List[Dict[str, str]]):
        session = self.get_session()
        try:
            # Delete old chunks for this repo
            session.query(KBChunk).filter_by(repo_id=repo_id).delete()
            
            if self.vector_available:
                try:
                    # Delete old vectors
                    res = self.collection.get(where={"repo_id": repo_id})
                    if res['ids']:
                        self.collection.delete(ids=res['ids'])
                except Exception: pass
            else:
                self.mock_vectors = [v for v in self.mock_vectors if v['repo_id'] != repo_id]

            docs = []
            metadatas = []
            ids = []
            
            for c in chunks:
                chunk_id = uuid.uuid4().hex
                kbc = KBChunk(id=chunk_id, repo_id=repo_id, file_path=c['file_path'], content=c['content'], chunk_type=c['type'])
                session.add(kbc)
                
                docs.append(c['content'])
                metadatas.append({"repo_id": repo_id, "file_path": c['file_path'], "type": c['type']})
                ids.append(chunk_id)

                if not self.vector_available:
                    self.mock_vectors.append({"id": chunk_id, "repo_id": repo_id, "content": c['content'], "metadata": metadatas[-1]})

            session.commit()
            
            if self.vector_available and docs:
                try:
                    self.collection.add(documents=docs, metadatas=metadatas, ids=ids)
                except Exception as e:
                    print(f"Failed to add to Chroma: {e}")
                    
            return len(chunks)
        finally:
            session.close()

    def retrieve_context(self, repo_id: str, query: str, n_results=5) -> List[Dict]:
        if self.vector_available:
            try:
                results = self.collection.query(query_texts=[query], n_results=n_results, where={"repo_id": repo_id})
                if not results['documents'] or not results['documents'][0]:
                    return []
                return [{"content": doc, "metadata": meta} for doc, meta in zip(results['documents'][0], results['metadatas'][0])]
            except Exception:
                return []
        else:
            # Simple keyword matching mock retrieval
            matches = []
            q_words = query.lower().split()
            for v in self.mock_vectors:
                if v['repo_id'] == repo_id:
                    content_lower = v['content'].lower()
                    score = sum(1 for w in q_words if w in content_lower)
                    if score > 0:
                        matches.append((score, v))
            matches.sort(key=lambda x: x[0], reverse=True)
            return [{"content": m[1]['content'], "metadata": m[1]['metadata']} for m in matches[:n_results]]

    def get_repo_history(self, repo_id: str):
        session = self.get_session()
        try:
            scans = session.query(RepoScan).filter_by(repo_id=repo_id).order_by(RepoScan.created_at.desc()).all()
            if not scans: return None
            
            previous = scans[1] if len(scans) > 1 else scans[0]
            current = scans[0]
            
            # Simple trend analysis
            trend = "stable"
            if current.score > previous.score: trend = "improving"
            elif current.score < previous.score: trend = "degrading"
            
            return {
                "previous_score": previous.score,
                "current_score": current.score,
                "trend": trend,
                "new_issues": 0, # To be computed if needed
                "fixed_issues": 0
            }
        finally:
            session.close()
