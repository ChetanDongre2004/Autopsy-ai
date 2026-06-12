"""
Authentication Router — Phase 9 + Phase 15.
Handles /api/v1/auth/* endpoints.
"""

from fastapi import APIRouter, HTTPException, Request
from schemas.api_response import APIResponse
from schemas.auth_schema import RegisterRequest, LoginRequest, RefreshRequest
from services.auth_service import auth_service

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/register")
async def register(req: RegisterRequest):
    result = auth_service.register(req.username, req.email, req.password, req.role)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return APIResponse.ok(data=result, message="User registered successfully")


@router.post("/login")
async def login(req: LoginRequest):
    result = auth_service.login(req.username, req.password)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return APIResponse.ok(data=result, message="Login successful")


@router.post("/refresh")
async def refresh(req: RefreshRequest):
    result = auth_service.refresh(req.refresh_token)
    if "error" in result:
        raise HTTPException(status_code=401, detail=result["error"])
    return APIResponse.ok(data=result, message="Token refreshed")


@router.post("/logout")
async def logout(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
        auth_service.logout(token)
    return APIResponse.ok(message="Logged out successfully")


@router.get("/me")
async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing authorization token")
    
    token = auth_header[7:]
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return APIResponse.ok(data={
        "id": payload["sub"],
        "username": payload["username"],
        "role": payload["role"]
    })
