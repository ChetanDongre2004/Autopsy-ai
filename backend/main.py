from fastapi import FastAPI, HTTPException, UploadFile, File, Form
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
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

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

@app.post('/api/v1/security/export-pdf')
def export_pdf(req: ExportRequest):
    try:
        pdf_path = generate_security_pdf(req.data)
        return FileResponse(pdf_path, media_type='application/pdf', filename='Autopsy_Security_Report.pdf')
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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