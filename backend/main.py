from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.analyzer import RepoIntelligence

app = FastAPI(title='Autopsy AI')
app.add_middleware(CORSMiddleware, allow_origins=['*'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

from typing import Optional

class RepoRequest(BaseModel):
    url: str
    branch: str = 'main'
    pr_branch: Optional[str] = None
    commit_hash: Optional[str] = None
    mode: str = 'full'
    
@app.post('/api/v1/analyze')
def analyze(req: RepoRequest):
    try:
        engine = RepoIntelligence(req.url, req.branch, req.mode)
        engine.clone_repo()
        data = engine.run_full_analysis()
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))