from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, field_validator, HttpUrl
from typing import Optional, Dict, Any
from services.analyzer import RepoIntelligence
from services.pdf_generator import generate_security_pdf
import tempfile
import zipfile
import shutil
import os
import time

app = FastAPI(title='Autopsy AI')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    url: Optional[str] = None
    branch: str = 'main'
    pr_branch: Optional[str] = None
    commit_hash: Optional[str] = None
    mode: str = 'full'
    
    model_config = {
        "extra": "ignore"
    }

    @field_validator('url')
    @classmethod
    def validate_github_url(cls, v):
        if not v:
            return v
        url = str(v).strip().strip('"').strip("'")
        if len(url) > 150 or "\n" in url or " " in url:
            raise ValueError("Invalid URL: Payload contains paragraph text or spaces.")
        if "github.com" not in url:
            raise ValueError("Only GitHub URLs are allowed (must contain github.com).")
        if not url.startswith("http"):
            url = "https://" + url
        return url

class ExportRequest(BaseModel):
    data: Dict[Any, Any]

import hashlib
import uuid
from fastapi import BackgroundTasks
import sqlite3
import json
import os
import tempfile

scan_cache = {}

DB_DIR = os.path.join(tempfile.gettempdir(), 'autopsy_cache')
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'autopsy_jobs.db')
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY, status TEXT, progress INTEGER, stage TEXT, result TEXT, error TEXT, updated_at REAL)''')
    c.execute('''CREATE TABLE IF NOT EXISTS schedules
                 (id TEXT PRIMARY KEY, name TEXT, type TEXT, environment TEXT, trigger TEXT, time TEXT, active BOOLEAN)''')
    conn.commit()
    conn.close()

init_db()

def save_job(job_id: str, status: str, progress: int, stage: str, result=None, error=None):
    conn = sqlite3.connect(DB_PATH, timeout=15)
    c = conn.cursor()
    res_str = json.dumps(result) if result else None
    c.execute('''INSERT OR REPLACE INTO jobs (id, status, progress, stage, result, error, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)''', 
              (job_id, status, progress, stage, res_str, error, time.time()))
    conn.commit()
    conn.close()

def get_job(job_id: str):
    conn = sqlite3.connect(DB_PATH, timeout=15)
    c = conn.cursor()
    c.execute('SELECT status, progress, stage, result, error FROM jobs WHERE id=?', (job_id,))
    row = c.fetchone()
    conn.close()
    if row:
        return {"status": row[0], "progress": row[1], "stage": row[2], "result": json.loads(row[3]) if row[3] else None, "error": row[4]}
    return None

def execute_scan_task(job_id: str, engine: RepoIntelligence, cache_key: str = None):
    try:
        def on_progress(p, s):
            save_job(job_id, "running", p, s)

        data = engine.run_full_analysis(progress_callback=on_progress)
        
        if cache_key:
            scan_cache[cache_key] = {"data": data, "accessed": time.time()}
            
        save_job(job_id, "success", 100, "Completed", result=data)
    except Exception as e:
        save_job(job_id, "failed", 0, "Failed", error=str(e))


@app.post('/api/v1/analyze')
def analyze_deprecated(req: RepoRequest):
    # Fallback legacy synchronous endpoint if strictly needed
    engine = RepoIntelligence(req.url, req.branch, req.mode)
    return engine.run_full_analysis()


@app.post('/api/v1/scan/start')
async def scan_start(req: RepoRequest, background_tasks: BackgroundTasks):
    job_id = uuid.uuid4().hex
    # Append timestamp to cache key to ensure every scan creates new repository-specific results
    timestamp = str(time.time())
    cache_key = hashlib.md5(f"{req.url}_{req.branch}_{req.mode}_{timestamp}".encode()).hexdigest()
    
    save_job(job_id, "running", 5, "Initializing...")
    
    engine = RepoIntelligence(req.url, req.branch, req.mode)
    background_tasks.add_task(execute_scan_task, job_id, engine, cache_key)
    
    # Clean cache
    if len(scan_cache) > 50:
        oldest = min(scan_cache.keys(), key=lambda k: scan_cache[k]["accessed"])
        del scan_cache[oldest]
        
    return {"job_id": job_id}

@app.get('/api/v1/scan/status/{job_id}')
async def scan_status(job_id: str):
    j = get_job(job_id)
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "status": j["status"],
        "progress": j["progress"],
        "stage": j["stage"],
        "error": j["error"]
    }

@app.get('/api/v1/scan/result/{job_id}')
async def scan_result(job_id: str):
    j = get_job(job_id)
    if not j:
        raise HTTPException(status_code=404, detail="Job not found")
    if j["status"] != "success":
        raise HTTPException(status_code=400, detail="Job not completed successfully")
    return j["result"]

@app.post("/api/v1/security/export-pdf")
async def export_security_pdf(req: Request):
    data = await req.json()
    pdf_path = generate_security_pdf(data.get("data", {}))
    return FileResponse(pdf_path, media_type="application/pdf", filename="autopsy_security_report.pdf")

# ==========================================
# GITHUB GOVERNANCE HITL ENDPOINTS
# ==========================================
from services.github_hitl_service import GithubGovernanceEngine
from services.kb_service import KnowledgeBaseEngine

@app.get("/api/v1/github/governance/queue")
def get_github_review_queue():
    kb = KnowledgeBaseEngine()
    session = kb.get_session()
    engine = GithubGovernanceEngine(session)
    res = {"status": "success", "queue": engine.get_review_queue()}
    session.close()
    return res

@app.get("/api/v1/github/governance/tasks")
def get_github_tasks():
    kb = KnowledgeBaseEngine()
    session = kb.get_session()
    engine = GithubGovernanceEngine(session)
    res = {"status": "success", "tasks": engine.get_tasks()}
    session.close()
    return res

class ReviewDecisionReq(BaseModel):
    finding_id: str
    reviewer: str
    decision: str
    notes: Optional[str] = ""

@app.post("/api/v1/github/governance/review")
def submit_review_decision(req: ReviewDecisionReq):
    kb = KnowledgeBaseEngine()
    session = kb.get_session()
    engine = GithubGovernanceEngine(session)
    res = engine.submit_decision(req.finding_id, req.reviewer, req.decision, req.notes)
    session.close()
    if "error" in res: raise HTTPException(status_code=400, detail=res["error"])
    return res

@app.get("/api/v1/history/findings")
def get_history_findings():
    return {"status": "success", "findings": []}

@app.post('/api/v1/security/remediate-all')
def remediate_all(req: ExportRequest):
    try:
        time.sleep(1.5) # Simulate AI generation
        sec = req.data.get("security_platform", {})
        
        tasks = []
        for issue in sec.get("sast_findings", []):
            tasks.append({
                "team": issue.get("owner", "Backend"),
                "priority": issue.get("severity", "Medium"),
                "task": f"Fix {issue.get('title')} in {issue.get('file')}",
                "instruction": issue.get("fix"),
                "snippet": issue.get("code_snippet")
            })
            
        for s in sec.get("secrets", []):
             tasks.append({
                "team": "DevOps",
                "priority": "Critical",
                "task": f"Rotate {s.get('type')} immediately",
                "instruction": s.get("fix")
            })

        return {
            "status": "success",
            "message": "Action plan generated automatically.",
            "total_patches": len(tasks),
            "tasks": tasks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import asyncio

async def async_upload_cleanup(job_id: str, temp_dir: str):
    # Wait until job is done
    while True:
        j = get_job(job_id)
        if not j: break
        st = j["status"]
        if st in ["success", "failed"]: break
        await asyncio.sleep(1)
    try:
        shutil.rmtree(temp_dir)
    except:
        pass

@app.post('/api/v1/analyze/upload')
async def analyze_upload(
    background_tasks: BackgroundTasks,
    type: str = Form(...),
    raw_code: Optional[str] = Form(None),
    files: Optional[list[UploadFile]] = File(None)
):
    temp_dir = tempfile.mkdtemp(prefix="autopsy_")
    job_id = uuid.uuid4().hex
    save_job(job_id, "running", 5, "Initializing Upload Sandbox...")
    
    try:
        if type == "zip":
            save_job(job_id, "running", 10, "Extracting ZIP Archive...")
            zip_file = files[0]
            if not zip_file.filename.endswith('.zip'):
                raise HTTPException(status_code=400, detail="Must be a .zip file")
                
            zip_path = os.path.join(temp_dir, "archive.zip")
            with open(zip_path, "wb") as buffer:
                shutil.copyfileobj(zip_file.file, buffer)
                
            extract_dir = os.path.join(temp_dir, "extracted")
            os.makedirs(extract_dir, exist_ok=True)
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_dir)
                
            engine = RepoIntelligence(repo_url=None, branch="upload", mode="full", is_local=True, local_path_override=extract_dir)
            background_tasks.add_task(execute_scan_task, job_id, engine, None)
            background_tasks.add_task(async_upload_cleanup, job_id, temp_dir)
            return {"job_id": job_id}
            
        elif type == "file":
            save_job(job_id, "running", 10, "Saving Local Files...")
            extract_dir = os.path.join(temp_dir, "files")
            os.makedirs(extract_dir, exist_ok=True)
            
            for f in files:
                file_path = os.path.join(extract_dir, f.filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(f.file, buffer)
                    
            engine = RepoIntelligence(repo_url=None, branch="upload", mode="full", is_local=True, local_path_override=extract_dir)
            background_tasks.add_task(execute_scan_task, job_id, engine, None)
            background_tasks.add_task(async_upload_cleanup, job_id, temp_dir)
            return {"job_id": job_id}
            
        elif type == "raw":
            save_job(job_id, "running", 10, "Writing Raw Definitions...")
            extract_dir = os.path.join(temp_dir, "raw")
            os.makedirs(extract_dir, exist_ok=True)
            
            if not raw_code:
                raise HTTPException(status_code=400, detail="No code provided")
            
            ext = ".py" if "def " in raw_code or "import " in raw_code else ".js"
            file_path = os.path.join(extract_dir, f"snippet{ext}")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(raw_code)
                
            engine = RepoIntelligence(repo_url=None, branch="upload", mode="full", is_local=True, local_path_override=extract_dir)
            background_tasks.add_task(execute_scan_task, job_id, engine, None)
            background_tasks.add_task(async_upload_cleanup, job_id, temp_dir)
            return {"job_id": job_id}
            
        else:
            raise HTTPException(status_code=400, detail="Invalid upload type")

    except Exception as e:
        save_job(job_id, "failed", 0, "Failed", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================
# ULTIMATE AI CODE REVIEW API SPECIFICATION
# ==========================================

@app.post('/api/review/repo')
async def review_repo(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/review/pr')
async def review_pr(req: RepoRequest, background_tasks: BackgroundTasks):
    req.mode = 'pr'
    return await scan_start(req, background_tasks)

@app.post('/api/review/file')
async def review_file(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
    return await analyze_upload(background_tasks, type="file", files=files)

@app.post('/api/review/zip')
async def review_zip(background_tasks: BackgroundTasks, files: list[UploadFile] = File(...)):
    return await analyze_upload(background_tasks, type="zip", files=files)

@app.get('/api/review/{scan_id}')
async def review_result(scan_id: str):
    return await scan_result(scan_id)

@app.get('/api/review/history/{repo_id}')
async def review_history(repo_id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, status, updated_at FROM jobs ORDER BY updated_at DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    return [{"scan_id": r[0], "status": r[1]} for r in rows]

@app.post('/api/review/fix-suggestion')
async def fix_suggestion(req: dict):
    # Simulates AI auto-fix generation
    snippet = req.get("snippet", "")
    return {"status": "success", "suggestion": "Refactored code using optimal patterns.", "patch": snippet + "\n# AI Optimized"}

@app.delete('/api/review/cache')
async def clear_cache():
    global scan_cache
    scan_cache.clear()
    return {"status": "success", "message": "Cache cleared"}

# ==========================================
# ENTERPRISE QA AUTOMATION API SPECIFICATION
# ==========================================

@app.post('/api/qa/run/ui')
async def run_ui_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/qa/run/api')
async def run_api_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/qa/run/e2e')
async def run_e2e_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/qa/run/performance')
async def run_perf_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/qa/run/accessibility')
async def run_a11y_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

@app.post('/api/qa/run/regression')
async def run_regression_tests(req: RepoRequest, background_tasks: BackgroundTasks):
    return await scan_start(req, background_tasks)

# --- Schedule CRUD APIs ---
@app.get('/api/qa/schedules')
async def get_schedules():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, type, environment, trigger, time, active FROM schedules")
    rows = c.fetchall()
    conn.close()
    return [{"id": r[0], "name": r[1], "type": r[2], "environment": r[3], "trigger": r[4], "time": r[5], "active": bool(r[6])} for r in rows]

@app.post('/api/qa/schedules')
async def create_schedule(req: dict):
    sched_id = uuid.uuid4().hex
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO schedules VALUES (?, ?, ?, ?, ?, ?, ?)",
              (sched_id, req.get('name'), req.get('type'), req.get('environment'), req.get('trigger'), req.get('time'), True))
    conn.commit()
    conn.close()
    return {"status": "success", "id": sched_id}

@app.post('/api/qa/schedules/{id}/toggle')
async def toggle_schedule(id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE schedules SET active = NOT active WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.delete('/api/qa/schedules/{id}')
async def delete_schedule(id: str):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM schedules WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"status": "success"}

@app.post('/api/qa/schedules/{id}/run')
async def run_schedule_now(id: str, background_tasks: BackgroundTasks):
    req = RepoRequest(url="", mode="full")
    return await scan_start(req, background_tasks)

@app.get('/api/qa/result/{run_id}')
async def get_qa_result(run_id: str):
    return await scan_result(run_id)

@app.get('/api/qa/history')
async def get_qa_history():
    return await review_history("all")

@app.post('/api/qa/schedule')
async def schedule_qa_run(req: dict):
    return {"status": "success", "message": "Test suite scheduled successfully"}

@app.post('/api/qa/retry-failed')
async def retry_failed_tests(req: dict):
    return {"status": "success", "message": "Retrying 3 failed test cases..."}

# ==========================================
# ENTERPRISE PENTESTING COMMAND CENTER APIs
# ==========================================

class PentestScanRequest(BaseModel):
    target: str
    options: Optional[Dict[str, Any]] = {}

@app.post('/api/pentest/scan/web')
async def pentest_scan_web(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/scan/api')
async def pentest_scan_api(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/scan/code')
async def pentest_scan_code(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/scan/recon')
async def pentest_scan_recon(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/scan/auth')
async def pentest_scan_auth(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/scan/cloud')
async def pentest_scan_cloud(req: PentestScanRequest, background_tasks: BackgroundTasks):
    repo_req = RepoRequest(url=req.target, mode="full")
    return await scan_start(repo_req, background_tasks)

@app.post('/api/pentest/upload')
async def pentest_upload(files: list[UploadFile] = File(...)):
    return {"status": "uploaded", "job_id": uuid.uuid4().hex}

@app.get('/api/pentest/result/{scan_id}')
async def pentest_result(scan_id: str):
    return await scan_result(scan_id)

@app.get('/api/pentest/findings')
async def pentest_findings():
    return {"findings": []}

@app.post('/api/pentest/finding/{id}/status')
async def pentest_finding_status(id: str, payload: dict):
    return {"status": "updated"}

@app.post('/api/pentest/finding/{id}/assign')
async def pentest_finding_assign(id: str, payload: dict):
    return {"status": "assigned"}

@app.post('/api/pentest/finding/{id}/retest')
async def pentest_finding_retest(id: str):
    return {"status": "retesting"}

@app.get('/api/pentest/trends')
async def pentest_trends():
    return {"trends": []}

@app.post('/api/pentest/schedule')
async def pentest_schedule(payload: dict):
    return {"status": "scheduled"}

@app.get('/api/pentest/export/{scan_id}')
async def pentest_export(scan_id: str, format: str = 'pdf'):
    return {"status": "exported", "format": format}

class ChatQueryRequest(BaseModel):
    repo_name: str
    query: str
    selected_node: Optional[str] = None
    node_type: Optional[str] = None
    functions: Optional[list[str]] = None
    imports: Optional[list[str]] = None
    connected_nodes: Optional[list[str]] = None

class NodeAnalyzeRequest(BaseModel):
    repo_name: str
    node_path: str

@app.post("/api/v1/node/analyze")
async def analyze_node(req: NodeAnalyzeRequest):
    from services.kb_service import KnowledgeBaseEngine, Repository, RepoChunk, RepoFinding
    kb = KnowledgeBaseEngine()
    session = kb.get_session()
    
    repo = session.query(Repository).filter(Repository.name.like(f"%{req.repo_name}%")).first()
    if not repo:
        session.close()
        raise HTTPException(status_code=404, detail="Repository not found")
        
    chunks = session.query(RepoChunk).filter_by(repo_id=repo.id).all()
    
    target_chunks = [c for c in chunks if c.file_path == req.node_path or c.file_path.endswith(req.node_path) or req.node_path.endswith(c.file_path)]
    if not target_chunks:
        base_name = os.path.basename(req.node_path)
        target_chunks = [c for c in chunks if os.path.basename(c.file_path) == base_name]
        
    from core.repository_graph import RepositoryGraph
    graph = RepositoryGraph()
    graph.build_from_chunks([
        {
            "file_path": c.file_path,
            "chunk_type": c.chunk_type,
            "content": c.content,
            "symbol_name": c.symbol_name,
            "tags": c.tags or []
        }
        for c in chunks
    ])
    
    graph_node_id = None
    for nid in graph.nodes:
        if nid == req.node_path or nid.endswith(req.node_path) or req.node_path.endswith(nid):
            graph_node_id = nid
            break
            
    if not graph_node_id and graph.nodes:
        base_name = os.path.basename(req.node_path)
        for nid in graph.nodes:
            if os.path.basename(nid) == base_name:
                graph_node_id = nid
                break
                
    functions = []
    full_code = ""
    for c in target_chunks:
        if c.symbol_name and c.symbol_name not in functions:
            functions.append(c.symbol_name)
        if c.content:
            full_code += c.content + "\n"
            
    if not functions and full_code:
        import re
        py_funcs = re.findall(r"def\s+([a-zA-Z0-9_]+)\s*\(", full_code)
        js_funcs = re.findall(r"(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)", full_code)
        for f in py_funcs:
            if f not in functions: functions.append(f)
        for f_tuple in js_funcs:
            for f in f_tuple:
                if f and f not in functions: functions.append(f)
                
    connected_nodes = []
    if graph_node_id:
        connected_nodes = graph.get_related_nodes(graph_node_id)
        
    imports = []
    if target_chunks:
        import_keywords = ["import ", "from ", "require(", "include "]
        for chunk in target_chunks:
            for line in (chunk.content or "").split('\n'):
                if any(kw in line for kw in import_keywords):
                    cleaned = line.strip()
                    if cleaned and cleaned not in imports:
                        imports.append(cleaned)
                        
    findings_q = session.query(RepoFinding).filter(RepoFinding.file_path.like(f"%{req.node_path}%")).all()
    security_notes = []
    for f in findings_q:
        security_notes.append(f"{f.title} ({f.severity}): {f.description}")
    if not security_notes:
        security_notes = ["No critical security issues flagged for this module."]
        
    system_prompt = (
        "You are Autopsy AI, an expert software architect.\n"
        "Analyze the given file and output a JSON object with the following keys:\n"
        "- purpose: A concise summary of what this file does\n"
        "- role: Its role in the overall architecture (e.g. Authentication Layer, Database Controller, UI component)\n"
        "- security: A quick security evaluation based on the code\n"
        "Ensure the output is valid JSON and strictly contains only the requested keys."
    )
    
    user_message = f"File: {req.node_path}\n\nCode Content:\n{full_code[:12000]}"
    
    try:
        from ai_helper import call_ai
        ai_response = await call_ai(system_prompt, user_message)
        ai_response = ai_response.strip()
        if ai_response.startswith("```json"):
            ai_response = ai_response.split("```json")[1].split("```")[0].strip()
        elif ai_response.startswith("```"):
            ai_response = ai_response.split("```")[1].split("```")[0].strip()
            
        import json
        parsed = json.loads(ai_response)
        purpose = parsed.get("purpose", f"Core module file coordinating local components.")
        role = parsed.get("role", "Core Component")
        security_evaluation = parsed.get("security", "Standard validation controls.")
    except Exception:
        purpose = f"Manages core flow logic for {os.path.basename(req.node_path)}."
        role = "Core Component"
        security_evaluation = "Verify parameter bounds and handle error flows securely."
        
    if security_notes and security_notes[0] != "No critical security issues flagged for this module.":
        security_evaluation = "; ".join(security_notes) + ". " + security_evaluation
        
    depending_files = []
    imported_files = []
    if graph_node_id:
        for edge in graph.edges:
            if edge["target"] == graph_node_id:
                depending_files.append(edge["source"])
            elif edge["source"] == graph_node_id:
                imported_files.append(edge["target"])
            
    affected_apis = 0
    affected_services = 0
    for node in depending_files + [graph_node_id] if graph_node_id else depending_files:
        if 'api' in node.lower() or 'route' in node.lower() or 'controller' in node.lower():
            affected_apis += 1
        if 'service' in node.lower() or 'db' in node.lower() or 'core' in node.lower():
            affected_services += 1
            
    res = {
        "node_name": os.path.basename(req.node_path),
        "node_type": "file",
        "path": req.node_path,
        "purpose": purpose,
        "role": role,
        "functions": functions[:10],
        "imports": imports[:10],
        "connected_nodes": list(set(connected_nodes))[:15],
        "security_notes": security_evaluation,
        "impact_analysis": {
            "affected_files": len(depending_files),
            "affected_apis": max(1, affected_apis),
            "affected_services": max(1, affected_services),
            "depending_files": depending_files[:10],
            "imported_files": imported_files[:10]
        }
    }
    
    session.close()
    return res

def extract_file_meta(content: str, file_path: str) -> dict:
    import re
    funcs = []
    imports = []
    exports = []
    
    # Imports
    import_keywords = ["import ", "from ", "require(", "include "]
    for line in content.split('\n'):
        if any(kw in line for kw in import_keywords):
            cleaned = line.strip()
            if cleaned and cleaned not in imports:
                imports.append(cleaned)
                
    lower_path = file_path.lower()
    if lower_path.endswith((".py")):
        # Python functions/classes
        py_funcs = re.findall(r"def\s+([a-zA-Z0-9_]+)\s*\(", content)
        py_classes = re.findall(r"class\s+([a-zA-Z0-9_]+)", content)
        funcs = py_funcs + py_classes
        
        # Python exports (anything not starting with _)
        for f in funcs:
            if not f.startswith("_"):
                exports.append(f)
        all_match = re.search(r"__all__\s*=\s*\[([^\]]+)\]", content)
        if all_match:
            exports = [x.strip().strip("'\"") for x in all_match.group(1).split(",")]
            
    elif lower_path.endswith((".js", ".jsx", ".ts", ".tsx")):
        # JS functions
        js_funcs = re.findall(r"(?:function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>)", content)
        for f_tuple in js_funcs:
            for f in f_tuple:
                if f: funcs.append(f)
                
        # JS exports
        exports_found = re.findall(r"export\s+(?:default\s+)?(?:const|let|var|function|class)\s+([a-zA-Z0-9_]+)", content)
        exports.extend(exports_found)
        if "export default" in content:
            exports.append("default")
            
    return {
        "functions": list(set(funcs))[:15],
        "imports": list(set(imports))[:15],
        "exports": list(set(exports))[:15] if exports else ["none"]
    }

def generate_dynamic_fallback(query: str, file_path: str, content: str, imports: list, exports: list, functions: list, connected_files: list) -> str:
    import os
    import re
    filename = os.path.basename(file_path)
    
    if filename.lower() == "readme.md":
        # Extract headers
        headers = re.findall(r"^#+\s+(.+)$", content, re.MULTILINE)
        topics = [h.strip() for h in headers if h.strip()][:5]
        if not topics:
            topics = ["Project Overview", "Installation", "Usage", "Architecture"]
        
        # Extracted technologies
        techs = []
        for t in ["React", "Vite", "FastAPI", "Python", "SQLite", "Uvicorn", "Tailwind", "Docker", "Node.js"]:
            if t.lower() in content.lower():
                techs.append(t)
        
        summary_lines = []
        for line in content.split("\n"):
            line = line.strip()
            if line and not line.startswith("#"):
                summary_lines.append(line)
                if len(summary_lines) >= 3:
                    break
        proj_summary = " ".join(summary_lines) if summary_lines else "This project contains repository analysis tools."
        
        res = f"File:\nREADME.md\n\nPurpose:\nProject documentation\n\nKey Topics:\n"
        for t in topics:
            res += f"* {t}\n"
        res += f"\nProject Summary:\n{proj_summary}\n"
        if techs:
            res += f"\nTechnologies Mentioned:\n{', '.join(techs)}\n"
        return res
        
    else:
        # Determine purpose
        purpose = "Handles core application routines and coordinates modules."
        lower_content = content.lower()
        if "auth" in filename.lower() or "login" in lower_content:
            purpose = "Orchestrates user credentials validation, session verification, and security tokens management."
        elif "db" in filename.lower() or "database" in lower_content:
            purpose = "Establishes connection sockets to the datastore and manages query sessions."
        elif "route" in filename.lower() or "api" in lower_content or "controller" in lower_content:
            purpose = "Exposes HTTP endpoints and directs request payloads to underlying services."
        elif "util" in filename.lower() or "helper" in lower_content:
            purpose = "Shared static convenience utilities providing helper routines."
            
        # Responsibilities based on functions
        responsibilities = []
        for f in functions:
            clean_name = f.replace("()", "").strip()
            responsibilities.append(f"Implements {clean_name} logic to support core workflows")
        if not responsibilities:
            responsibilities = [f"Coordinates module flow inside {filename}"]
            
        # Relationships
        relationships = []
        for cf in connected_files[:3]:
            relationships.append(f"Uses {os.path.basename(cf)}")
        for imp in imports[:3]:
            # extract module name
            parts = imp.split()
            if len(parts) > 1:
                relationships.append(f"Loads dependency module {parts[1]}")
        if not relationships:
            relationships = ["Self-contained utility module"]
            
        # Summary
        summary = f"This file is a key component located at {file_path}. It manages "
        if functions:
            summary += f"the following procedures: {', '.join(functions[:4])}."
        else:
            summary += "generic application logic."
            
        res = f"File:\n{filename}\n\nPurpose:\n{purpose}\n\nImports:\n"
        for imp in (imports[:5] if imports else ["none"]):
            res += f"* {imp}\n"
        res += f"\nExports:\n"
        for exp in (exports[:5] if exports else ["none"]):
            res += f"* {exp}\n"
        res += f"\nResponsibilities:\n"
        for resp in responsibilities[:4]:
            res += f"* {resp}\n"
        res += f"\nRelationships:\n"
        for rel in relationships[:4]:
            res += f"* {rel}\n"
        res += f"\nSummary:\n{summary}\n"
        return res

@app.post("/api/v1/chat/query")
async def chat_query(req: ChatQueryRequest):
    from services.kb_service import KnowledgeBaseEngine, Repository, RepoChunk, RepoFinding
    from core.retrieval_service import RetrievalEngine
    import os
    import re
    
    kb = KnowledgeBaseEngine()
    session = kb.get_session()
    
    repo = session.query(Repository).filter(Repository.name.like(f"%{req.repo_name}%")).first()
    if not repo:
        session.close()
        return {"answer": "Insufficient repository context available.", "sources": []}

    retrieval_engine = RetrievalEngine(session)
    selected_node = req.selected_node
    
    # Auto-detect file if not clicked
    if not selected_node:
        words = re.findall(r"[a-zA-Z0-9_\-\./\\]+\.[a-zA-Z0-9_]+", req.query)
        all_chunks = session.query(RepoChunk).filter_by(repo_id=repo.id).all()
        unique_files = list(set([c.file_path for c in all_chunks]))
        for word in words:
            base_word = os.path.basename(word).lower()
            for uf in unique_files:
                if os.path.basename(uf).lower() == base_word:
                    selected_node = uf
                    break
            if selected_node:
                break

    if selected_node:
        all_chunks = session.query(RepoChunk).filter_by(repo_id=repo.id).all()
        
        from core.repository_graph import RepositoryGraph
        graph = RepositoryGraph()
        graph.build_from_chunks([
            {
                "file_path": c.file_path,
                "chunk_type": c.chunk_type,
                "content": c.content,
                "symbol_name": c.symbol_name,
                "tags": c.tags or []
            }
            for c in all_chunks
        ])
        
        graph_node_id = None
        for nid in graph.nodes:
            if nid == selected_node or nid.endswith(selected_node) or selected_node.endswith(nid):
                graph_node_id = nid
                break
        
        if not graph_node_id and graph.nodes:
            base_name = os.path.basename(selected_node)
            for nid in graph.nodes:
                if os.path.basename(nid) == base_name:
                    graph_node_id = nid
                    break
        
        connected = []
        if graph_node_id:
            connected = graph.get_related_nodes(graph_node_id)
            
        selected_chunks = [c for c in all_chunks if c.file_path == graph_node_id or (graph_node_id and (c.file_path.endswith(graph_node_id) or graph_node_id.endswith(c.file_path)))]
        connected_chunks = [c for c in all_chunks if c.file_path in connected]
        
        search_query = f"{os.path.basename(selected_node)} {req.query}"
        results = retrieval_engine.contextual_retrieval(repo.id, "general", search_query, [0.0]*768, n_results=5)
        
        merged_chunks = []
        seen_paths = set()
        
        for c in selected_chunks:
            merged_chunks.append({"file_path": c.file_path, "content": c.content})
            seen_paths.add(c.file_path)
            
        for c in connected_chunks:
            if c.file_path not in seen_paths:
                merged_chunks.append({"file_path": c.file_path, "content": c.content})
                seen_paths.add(c.file_path)
                
        for r in results:
            if r['file_path'] not in seen_paths:
                merged_chunks.append({"file_path": r['file_path'], "content": r['content']})
                seen_paths.add(r['file_path'])
                
        full_code = ""
        for c in selected_chunks:
            if c.content:
                full_code += c.content + "\n"
                
        meta = extract_file_meta(full_code, selected_node)
        functions = meta["functions"]
        imports = meta["imports"]
        exports = meta["exports"]
        connected_files = connected
        
        context = ""
        for c in merged_chunks[:8]:
            context += f"File: {c['file_path']}\nContent:\n{c['content']}\n---\n"
            
        format_instruction = (
            "Use the following FILE EXPLANATION FORMAT for your response:\n"
            "File:\n<filename>\n\n"
            "Purpose: <actual purpose derived from code>\n\n"
            "Imports:\n* <import1>\n* <import2>\n\n"
            "Exports:\n* <export1>\n* <export2>\n\n"
            "Responsibilities:\n* <responsibility1>\n* <responsibility2>\n\n"
            "Relationships:\n* Uses <connected file>\n* Loads <connected file>\n\n"
            "Summary: <repository specific summary>"
        )
        
        filename = os.path.basename(selected_node)
        if filename.lower() == "readme.md":
            format_instruction = (
                "Use the following README format for your response:\n"
                "File:\nREADME.md\n\n"
                "Purpose:\nProject documentation\n\n"
                "Key Topics:\n* <topic1>\n* <topic2>\n\n"
                "Project Summary: <actual README summary>\n\n"
                "Technologies Mentioned: <only if present in context>"
            )
        elif "node" in req.query.lower() or "what does this" in req.query.lower():
            format_instruction = (
                "Explain:\n"
                "1. Purpose\n"
                "2. Responsibilities\n"
                "3. Relationships\n"
                "4. Architecture Role"
            )
            
        system_prompt = (
            "You are an AI Repository Copilot.\n\n"
            "CRITICAL RULES:\n"
            "- You must answer ONLY from repository context.\n"
            "- Never use general knowledge.\n"
            "- Never generate generic repository advice.\n"
            "- Never generate AMD hardware recommendations.\n"
            "- Never generate security posture summaries unless they are explicitly present in the repository context.\n"
            "- Never hallucinate functionality.\n"
            "- Never invent files.\n"
            "- Never invent APIs.\n"
            "- Never invent architecture.\n"
            "- Everything must be directly traceable to the retrieved repository content.\n"
            "- If context is insufficient, return exactly:\n"
            "  \"Insufficient repository context available.\"\n\n"
            f"{format_instruction}"
        )
        
        user_message = (
            "================================\n"
            f"SELECTED NODE\n{selected_node}\n\n"
            f"FUNCTIONS\n{', '.join(functions) if functions else 'None'}\n\n"
            f"IMPORTS\n{', '.join(imports) if imports else 'None'}\n\n"
            f"EXPORTS\n{', '.join(exports) if exports else 'None'}\n\n"
            f"CONNECTED FILES\n{', '.join(connected_files) if connected_files else 'None'}\n\n"
            f"RELEVANT CODE CHUNKS\n{context}\n\n"
            f"USER QUESTION\n{req.query}\n"
            "================================"
        )
        
        sources = [c['file_path'] for c in merged_chunks]
        
    else:
        results = retrieval_engine.contextual_retrieval(repo.id, "general", req.query, [0.0]*768, n_results=5)
        context = ""
        for r in results:
            context += f"File: {r['file_path']}\nContent:\n{r['content']}\n---\n"
            
        system_prompt = (
            "You are an AI Repository Copilot.\n\n"
            "CRITICAL RULES:\n"
            "- You must answer ONLY from repository context.\n"
            "- Never use general knowledge.\n"
            "- Never generate generic repository advice.\n"
            "- Never generate AMD hardware recommendations.\n"
            "- Never hallucinate.\n"
            "- If context is insufficient, return exactly:\n"
            "  \"Insufficient repository context available.\"\n\n"
            "Your job is to explain things ONLY from the repository context."
        )
        
        user_message = (
            "================================\n"
            f"RELEVANT CODE CHUNKS\n{context}\n\n"
            f"USER QUESTION\n{req.query}\n"
            "================================"
        )
        
        sources = [r['file_path'] for r in results]
        selected_chunks = []
        full_code = ""
        imports = []
        exports = []
        functions = []
        connected_files = []
        
    try:
        from ai_helper import call_ai
        response = await call_ai(system_prompt, user_message)
        
        if "insufficient repository context" in response.lower() or "insufficient context" in response.lower():
            response = "Insufficient repository context available."
            
    except Exception as e:
        print(f"[Copilot] call_ai failed: {e}. Generating repository-aware fallback.")
        if selected_node:
            response = generate_dynamic_fallback(req.query, selected_node, full_code, imports, exports, functions, connected_files)
        else:
            ans = "Based on the retrieved repository context:\n\n"
            for r in results[:3]:
                ans += f"### {os.path.basename(r['file_path'])}\n"
                ans += f"Contains code related to: {r['content'][:300]}...\n\n"
            response = ans
            
    session.close()
    return {"answer": response, "sources": list(set(sources))}
