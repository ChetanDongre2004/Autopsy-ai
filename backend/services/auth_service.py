"""
JWT Authentication Service — Phase 9.
Provides registration, login, token generation, refresh, and role-based access control.
Uses bcrypt for password hashing and PyJWT for token management.
"""

import os
import time
import uuid
import hashlib
import hmac
import json
import logging
from typing import Optional, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", hashlib.sha256(b"autopsy-ai-default-secret-change-in-production").hexdigest())
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = 3600       # 1 hour
REFRESH_TOKEN_EXPIRE = 604800    # 7 days

# In-memory user store (will be replaced with MySQL in Phase 7)
# Format: {username: {id, username, email, password_hash, role, created_at}}
_users_store: Dict[str, Dict[str, Any]] = {}

# Token blacklist for revocation
_token_blacklist: set = set()


def _hash_password(password: str) -> str:
    """Hash password using PBKDF2-HMAC-SHA256."""
    salt = os.urandom(32)
    key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return (salt + key).hex()


def _verify_password(stored_hash: str, password: str) -> bool:
    """Verify password against stored PBKDF2 hash."""
    stored_bytes = bytes.fromhex(stored_hash)
    salt = stored_bytes[:32]
    stored_key = stored_bytes[32:]
    new_key = hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000)
    return hmac.compare_digest(stored_key, new_key)


def _base64url_encode(data: bytes) -> str:
    """Base64url encode without padding."""
    import base64
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()


def _base64url_decode(s: str) -> bytes:
    """Base64url decode with padding restoration."""
    import base64
    padding = 4 - len(s) % 4
    if padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s)


def _create_jwt(payload: dict, secret: str = JWT_SECRET) -> str:
    """Create a JWT token without external dependencies."""
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode())
    payload_b64 = _base64url_encode(json.dumps(payload, separators=(',', ':')).encode())
    
    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
    signature_b64 = _base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def _decode_jwt(token: str, secret: str = JWT_SECRET) -> Optional[dict]:
    """Decode and verify a JWT token."""
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        signing_input = f"{header_b64}.{payload_b64}"
        expected_signature = hmac.new(secret.encode(), signing_input.encode(), hashlib.sha256).digest()
        actual_signature = _base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_signature, actual_signature):
            return None
        
        # Decode payload
        payload = json.loads(_base64url_decode(payload_b64))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
        
        return payload
    except Exception as e:
        logger.warning(f"[Auth] JWT decode failed: {e}")
        return None


class AuthService:
    """Authentication service with JWT tokens and RBAC."""

    VALID_ROLES = {"admin", "reviewer", "user"}

    def register(self, username: str, email: str, password: str, role: str = "user") -> Dict[str, Any]:
        """Register a new user."""
        if username in _users_store:
            return {"error": "Username already exists"}
        
        # Check email uniqueness
        for u in _users_store.values():
            if u["email"] == email:
                return {"error": "Email already registered"}
        
        if role not in self.VALID_ROLES:
            role = "user"
        
        user_id = uuid.uuid4().hex
        _users_store[username] = {
            "id": user_id,
            "username": username,
            "email": email,
            "password_hash": _hash_password(password),
            "role": role,
            "created_at": time.time()
        }
        
        logger.info(f"[Auth] User registered: {username} (role: {role})")
        return {"success": True, "user_id": user_id, "username": username, "role": role}

    def login(self, username: str, password: str) -> Dict[str, Any]:
        """Authenticate user and return JWT tokens."""
        user = _users_store.get(username)
        if not user:
            return {"error": "Invalid credentials"}
        
        if not _verify_password(user["password_hash"], password):
            return {"error": "Invalid credentials"}
        
        now = time.time()
        
        # Access token
        access_payload = {
            "sub": user["id"],
            "username": user["username"],
            "role": user["role"],
            "type": "access",
            "iat": int(now),
            "exp": int(now + ACCESS_TOKEN_EXPIRE)
        }
        access_token = _create_jwt(access_payload)
        
        # Refresh token
        refresh_payload = {
            "sub": user["id"],
            "username": user["username"],
            "type": "refresh",
            "iat": int(now),
            "exp": int(now + REFRESH_TOKEN_EXPIRE)
        }
        refresh_token = _create_jwt(refresh_payload)
        
        logger.info(f"[Auth] User logged in: {username}")
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE,
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "role": user["role"]
            }
        }

    def refresh(self, refresh_token: str) -> Dict[str, Any]:
        """Generate new access token from refresh token."""
        if refresh_token in _token_blacklist:
            return {"error": "Token has been revoked"}
        
        payload = _decode_jwt(refresh_token)
        if not payload:
            return {"error": "Invalid or expired refresh token"}
        
        if payload.get("type") != "refresh":
            return {"error": "Invalid token type"}
        
        username = payload.get("username")
        user = _users_store.get(username)
        if not user:
            return {"error": "User not found"}
        
        now = time.time()
        access_payload = {
            "sub": user["id"],
            "username": user["username"],
            "role": user["role"],
            "type": "access",
            "iat": int(now),
            "exp": int(now + ACCESS_TOKEN_EXPIRE)
        }
        new_access_token = _create_jwt(access_payload)
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE
        }

    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify an access token and return the payload."""
        if token in _token_blacklist:
            return None
        
        payload = _decode_jwt(token)
        if not payload:
            return None
        
        if payload.get("type") != "access":
            return None
        
        return payload

    def logout(self, token: str):
        """Revoke a token by adding it to the blacklist."""
        _token_blacklist.add(token)

    def require_role(self, token: str, required_role: str) -> bool:
        """Check if the token's user has the required role."""
        payload = self.verify_token(token)
        if not payload:
            return False
        
        user_role = payload.get("role", "user")
        
        # Role hierarchy: admin > reviewer > user
        role_hierarchy = {"admin": 3, "reviewer": 2, "user": 1}
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level


# Singleton
auth_service = AuthService()

# Create default admin user on startup
if "admin" not in _users_store:
    auth_service.register("admin", "admin@autopsy.ai", os.getenv("ADMIN_PASSWORD", "admin123!"), "admin")
