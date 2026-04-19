from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
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

class ExportRequest(BaseModel):
    data: Dict[Any, Any]

import hashlib
import uuid
from fastapi import BackgroundTasks
import sqlite3
import json
import os

scan_cache = {}

DB_DIR = '.autopsy_cache'
os.makedirs(DB_DIR, exist_ok=True)
DB_PATH = os.path.join(DB_DIR, 'autopsy_jobs.db')
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY, status TEXT, progress INTEGER, stage TEXT, result TEXT, error TEXT, updated_at REAL)''')
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
    cache_key = hashlib.md5(f"{req.url}_{req.branch}_{req.mode}".encode()).hexdigest()
    
    if cache_key in scan_cache:
        data = scan_cache[cache_key]["data"]
        scan_cache[cache_key]["accessed"] = time.time()
        save_job(job_id, "success", 100, "Completed via Cache", result=data)
        return {"job_id": job_id}

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
            
            file_path = os.path.join(extract_dir, "snippet.js")
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