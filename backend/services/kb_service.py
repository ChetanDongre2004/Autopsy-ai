import os
import time
import json
import uuid
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import create_engine, Column, String, Float, Integer, Text, ForeignKey, JSON, Boolean, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
# pyrefly: ignore [missing-import]
from pgvector.sqlalchemy import Vector
import tempfile

Base = declarative_base()

class Repository(Base):
    __tablename__ = 'repositories'
    id = Column(String, primary_key=True)
    url = Column(String, unique=True)
    owner = Column(String)
    name = Column(String)
    default_branch = Column(String)
    fingerprint = Column(String)

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

class RepoChunk(Base):
    __tablename__ = 'repo_chunks'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    file_path = Column(String)
    content = Column(Text)
    chunk_type = Column(String)
    symbol_name = Column(String)
    language = Column(String)
    tags = Column(JSON)

class RepoEmbedding(Base):
    __tablename__ = 'repo_embeddings'
    id = Column(String, primary_key=True)
    chunk_id = Column(String, ForeignKey('repo_chunks.id'))
    repo_id = Column(String, ForeignKey('repositories.id'))
    embedding_profile = Column(String)  # source_code, docs, security
    embedding = Column(Vector(768))

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

class RepoGraphNode(Base):
    __tablename__ = 'repo_graph_nodes'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    label = Column(String)
    properties = Column(JSON)

class RepoGraphEdge(Base):
    __tablename__ = 'repo_graph_edges'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    source_id = Column(String, ForeignKey('repo_graph_nodes.id'))
    target_id = Column(String, ForeignKey('repo_graph_nodes.id'))
    relationship = Column(String)

class HistoricalFinding(Base):
    __tablename__ = 'historical_findings'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    finding_id = Column(String)
    status = Column(String)  # open, resolved, reopened
    updated_at = Column(Float)

class RetrievalLog(Base):
    __tablename__ = 'retrieval_logs'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    task_type = Column(String)
    query = Column(String)
    retrieved_chunk_ids = Column(JSON)
    timestamp = Column(Float)

class QAFlakyMemory(Base):
    __tablename__ = 'qa_flaky_memory'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    test_name = Column(String)
    suite = Column(String)
    flake_rate = Column(Float)
    root_cause = Column(Text)
    history = Column(JSON)

class QAHistoricalFailures(Base):
    __tablename__ = 'qa_historical_failures'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    test_name = Column(String)
    error_msg = Column(Text)
    ai_hypothesis = Column(Text)
    suggested_fix = Column(Text)
    timestamp = Column(Float)

class QAReleaseScores(Base):
    __tablename__ = 'qa_release_scores'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    scan_id = Column(String, ForeignKey('repo_scans.id'))
    score = Column(Integer)
    decision = Column(String)
    block_reasons = Column(JSON)
    timestamp = Column(Float)

class QAGeneratedTests(Base):
    __tablename__ = 'qa_generated_tests'
    id = Column(String, primary_key=True)
    repo_id = Column(String, ForeignKey('repositories.id'))
    test_name = Column(String)
    suite = Column(String)
    code_snippet = Column(Text)

# =====================================================================
# GitHub HITL Governance Models
# =====================================================================

class GithubFinding(Base):
    __tablename__ = 'github_findings'
    id = Column(String, primary_key=True)
    repository_id = Column(String, index=True)
    branch = Column(String)
    module = Column(String, default="github_intelligence")
    finding_type = Column(String)
    title = Column(String)
    severity = Column(String)
    confidence_score = Column(Float)
    business_impact = Column(String)
    architecture_impact = Column(String)
    affected_files = Column(String)
    affected_modules = Column(String)
    evidence = Column(String)
    ai_reasoning = Column(String)
    remediation = Column(String)
    status = Column(String, default="PENDING_REVIEW")
    reviewer = Column(String)
    assigned_team = Column(String)
    created_at = Column(Float)

class GithubReviewDecision(Base):
    __tablename__ = 'github_review_decisions'
    id = Column(String, primary_key=True)
    finding_id = Column(String, index=True)
    decision = Column(String)
    reviewer = Column(String)
    notes = Column(String)
    timestamp = Column(Float)

class GithubReviewerNote(Base):
    __tablename__ = 'github_reviewer_notes'
    id = Column(String, primary_key=True)
    finding_id = Column(String, index=True)
    reviewer = Column(String)
    note = Column(String)
    timestamp = Column(Float)

class GithubTask(Base):
    __tablename__ = 'github_tasks'
    id = Column(String, primary_key=True)
    finding_id = Column(String, index=True)
    assigned_team = Column(String)
    eta = Column(Float)
    status = Column(String, default="OPEN")
    retest_status = Column(String)
    created_at = Column(Float)

class GithubFalsePositive(Base):
    __tablename__ = 'github_false_positive_memory'
    id = Column(String, primary_key=True)
    repository_id = Column(String, index=True)
    finding_type = Column(String)
    rejection_reason = Column(String)
    architecture_preference = Column(String)
    created_at = Column(Float)

class GithubSLATracking(Base):
    __tablename__ = 'github_sla_tracking'
    id = Column(String, primary_key=True)
    finding_id = Column(String, index=True)
    severity = Column(String)
    deadline = Column(Float)
    breached = Column(Boolean, default=False)
    escalated = Column(Boolean, default=False)

class GithubAuditLog(Base):
    __tablename__ = 'github_audit_logs'
    id = Column(String, primary_key=True)
    finding_id = Column(String, index=True)
    action = Column(String)
    actor = Column(String)
    details = Column(String)
    timestamp = Column(Float)

class KnowledgeBaseEngine:
    def __init__(self, db_url: str = None):
        self.vector_available = False
        if not db_url:
            db_url = os.environ.get('DATABASE_URL', '')
            
        try:
            if db_url and db_url.startswith('postgres'):
                self.engine = create_engine(db_url)
                # Try creating pgvector extension
                with self.engine.connect() as conn:
                    conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
                self.vector_available = True
            else:
                # Fallback to sqlite without vector
                db_dir = os.path.join(tempfile.gettempdir(), 'autopsy_kb')
                os.makedirs(db_dir, exist_ok=True)
                db_path = os.path.join(db_dir, 'intelligence_v2.db')
                self.engine = create_engine(f'sqlite:///{db_path}')
                
            try:
                # Remove RepoEmbedding from Base metadata for sqlite
                if 'repo_embeddings' in Base.metadata.tables:
                    Base.metadata.remove(Base.metadata.tables['repo_embeddings'])
                Base.metadata.create_all(self.engine)
            except Exception:
                pass
            
            # Ensure new columns exist for SQLite fallback if upgrading from older version
            with self.engine.connect() as conn:
                for stmt in [
                    "ALTER TABLE repositories ADD COLUMN fingerprint VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN symbol_name VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN language VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN tags JSON"
                ]:
                    try:
                        conn.execute(text(stmt))
                    except Exception:
                        pass
                try:
                    conn.commit()
                except Exception:
                    pass

            self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)
        except Exception as e:
            logging.error(f"Database initialization error: {e}")
            # Absolute fallback
            db_dir = os.path.join(tempfile.gettempdir(), 'autopsy_kb')
            os.makedirs(db_dir, exist_ok=True)
            self.engine = create_engine(f'sqlite:///{os.path.join(db_dir, "fallback_v2.db")}')
            
            try:
                # Remove RepoEmbedding from Base metadata for sqlite
                if 'repo_embeddings' in Base.metadata.tables:
                    Base.metadata.remove(Base.metadata.tables['repo_embeddings'])
                Base.metadata.create_all(self.engine)
            except Exception:
                pass
                
            # Ensure new columns exist for SQLite fallback if upgrading from older version
            with self.engine.connect() as conn:
                for stmt in [
                    "ALTER TABLE repositories ADD COLUMN fingerprint VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN symbol_name VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN language VARCHAR",
                    "ALTER TABLE repo_chunks ADD COLUMN tags JSON"
                ]:
                    try:
                        conn.execute(text(stmt))
                    except Exception:
                        pass
                try:
                    conn.commit()
                except Exception:
                    pass
                        
            self.Session = sessionmaker(bind=self.engine, expire_on_commit=False)

    def get_session(self):
        return self.Session()

    def get_or_create_repo(self, url: str, owner: str, name: str, branch: str, fingerprint: str = None) -> Repository:
        session = self.get_session()
        try:
            repo = session.query(Repository).filter_by(url=url).first()
            if not repo:
                repo = Repository(id=uuid.uuid4().hex, url=url, owner=owner, name=name, default_branch=branch, fingerprint=fingerprint)
                session.add(repo)
                session.commit()
            elif fingerprint and repo.fingerprint != fingerprint:
                repo.fingerprint = fingerprint
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
            session.commit()
        finally:
            session.close()

    def index_chunks(self, repo_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]] = None):
        session = self.get_session()
        try:
            session.query(RepoChunk).filter_by(repo_id=repo_id).delete()
            if self.vector_available:
                session.query(RepoEmbedding).filter_by(repo_id=repo_id).delete()
            
            for i, c in enumerate(chunks):
                chunk_id = uuid.uuid4().hex
                chunk = RepoChunk(
                    id=chunk_id, repo_id=repo_id, file_path=c.get('file_path'), 
                    content=c.get('content'), chunk_type=c.get('chunk_type'),
                    symbol_name=c.get('symbol_name'), language=c.get('language'),
                    tags=c.get('tags', [])
                )
                session.add(chunk)
                
                if self.vector_available and embeddings and i < len(embeddings):
                    emb = RepoEmbedding(
                        id=uuid.uuid4().hex, chunk_id=chunk_id, repo_id=repo_id,
                        embedding_profile="source_code", embedding=embeddings[i]
                    )
                    session.add(emb)
            
            session.commit()
            return len(chunks)
        finally:
            session.close()

    def get_repo_history(self, repo_id: str):
        session = self.get_session()
        try:
            scans = session.query(RepoScan).filter_by(repo_id=repo_id).order_by(RepoScan.created_at.desc()).all()
            if not scans: return None
            
            previous = scans[1] if len(scans) > 1 else scans[0]
            current = scans[0]
            
            trend = "stable"
            if current.score > previous.score: trend = "improving"
            elif current.score < previous.score: trend = "degrading"
            
            return {
                "previous_score": previous.score,
                "current_score": current.score,
                "trend": trend,
                "new_issues": 0,
                "fixed_issues": 0
            }
        finally:
            session.close()

    def log_retrieval(self, repo_id: str, task_type: str, query: str, retrieved_ids: List[str]):
        session = self.get_session()
        try:
            log = RetrievalLog(
                id=uuid.uuid4().hex, repo_id=repo_id, task_type=task_type,
                query=query, retrieved_chunk_ids=retrieved_ids, timestamp=time.time()
            )
            session.add(log)
            session.commit()
        finally:
            session.close()
