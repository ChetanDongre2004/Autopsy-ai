"""
Standardized API Response Schema — Phase 14.
Every API endpoint wraps its output in this format.
"""

from pydantic import BaseModel
from typing import Any, Optional, List


class APIResponse(BaseModel):
    """Standard API response wrapper for all Autopsy AI endpoints."""
    success: bool = True
    message: str = ""
    data: Any = None
    errors: List[str] = []

    @classmethod
    def ok(cls, data: Any = None, message: str = ""):
        return cls(success=True, message=message, data=data)

    @classmethod
    def error(cls, message: str = "An error occurred", errors: List[str] = None):
        return cls(success=False, message=message, errors=errors or [message])
