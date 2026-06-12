"""
Health & Observability Router — Phase 11.
Provides health check, metrics, and system status endpoints.
"""

import time
import os
import platform
import logging
from fastapi import APIRouter
from schemas.api_response import APIResponse

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Health & Observability"])

# Metrics store
_metrics = {
    "requests_total": 0,
    "errors_total": 0,
    "scan_count": 0,
    "embedding_latency_ms": [],
    "retrieval_latency_ms": [],
    "api_latency_ms": [],
    "startup_time": time.time()
}


def record_metric(name: str, value: float):
    """Record a metric value."""
    if name in _metrics and isinstance(_metrics[name], list):
        _metrics[name].append(value)
        # Keep only last 1000 entries
        if len(_metrics[name]) > 1000:
            _metrics[name] = _metrics[name][-500:]
    elif name in _metrics and isinstance(_metrics[name], (int, float)):
        _metrics[name] += value


def get_avg_metric(name: str) -> float:
    """Get average of a list metric."""
    values = _metrics.get(name, [])
    if not values or not isinstance(values, list):
        return 0.0
    return sum(values) / len(values)


@router.get("/health")
async def health_check():
    """System health check endpoint."""
    health = {
        "status": "healthy",
        "uptime_seconds": round(time.time() - _metrics["startup_time"], 1),
        "python_version": platform.python_version(),
        "system": platform.system(),
    }

    # Check ChromaDB
    try:
        from core.hybrid_search import _get_chroma_collection
        collection = _get_chroma_collection()
        health["chromadb"] = {
            "status": "connected",
            "documents": collection.count() if collection else 0
        }
    except Exception:
        health["chromadb"] = {"status": "disconnected"}

    # Check embedding model
    try:
        from core.embedding_service import _get_model
        model = _get_model()
        health["embedding_model"] = {
            "status": "loaded",
            "model": "all-MiniLM-L6-v2"
        }
    except Exception:
        health["embedding_model"] = {"status": "not_loaded"}

    # Check AI provider
    try:
        from ai_helper import get_runtime_ai_config
        ai_config = get_runtime_ai_config()
        health["ai_provider"] = {
            "provider": ai_config["provider"],
            "configured": ai_config["api_key_configured"],
            "model": ai_config["model"]
        }
    except Exception:
        health["ai_provider"] = {"status": "not_configured"}

    return health


@router.get("/metrics")
async def get_metrics():
    """Prometheus-compatible metrics endpoint."""
    lines = []
    lines.append(f"# HELP autopsy_requests_total Total API requests")
    lines.append(f"# TYPE autopsy_requests_total counter")
    lines.append(f"autopsy_requests_total {_metrics['requests_total']}")
    
    lines.append(f"# HELP autopsy_errors_total Total API errors")
    lines.append(f"# TYPE autopsy_errors_total counter")
    lines.append(f"autopsy_errors_total {_metrics['errors_total']}")
    
    lines.append(f"# HELP autopsy_scans_total Total scans completed")
    lines.append(f"# TYPE autopsy_scans_total counter")
    lines.append(f"autopsy_scans_total {_metrics['scan_count']}")
    
    avg_embed = get_avg_metric("embedding_latency_ms")
    lines.append(f"# HELP autopsy_embedding_latency_avg Average embedding latency (ms)")
    lines.append(f"# TYPE autopsy_embedding_latency_avg gauge")
    lines.append(f"autopsy_embedding_latency_avg {avg_embed:.1f}")
    
    avg_retrieval = get_avg_metric("retrieval_latency_ms")
    lines.append(f"# HELP autopsy_retrieval_latency_avg Average retrieval latency (ms)")
    lines.append(f"# TYPE autopsy_retrieval_latency_avg gauge")
    lines.append(f"autopsy_retrieval_latency_avg {avg_retrieval:.1f}")
    
    avg_api = get_avg_metric("api_latency_ms")
    lines.append(f"# HELP autopsy_api_latency_avg Average API latency (ms)")
    lines.append(f"# TYPE autopsy_api_latency_avg gauge")
    lines.append(f"autopsy_api_latency_avg {avg_api:.1f}")
    
    uptime = time.time() - _metrics["startup_time"]
    lines.append(f"# HELP autopsy_uptime_seconds Server uptime")
    lines.append(f"# TYPE autopsy_uptime_seconds gauge")
    lines.append(f"autopsy_uptime_seconds {uptime:.0f}")
    
    return "\n".join(lines) + "\n"


@router.get("/api/v1/system/status")
async def system_status():
    """Detailed system status for the frontend dashboard."""
    return APIResponse.ok(data={
        "uptime_seconds": round(time.time() - _metrics["startup_time"], 1),
        "total_requests": _metrics["requests_total"],
        "total_errors": _metrics["errors_total"],
        "total_scans": _metrics["scan_count"],
        "avg_embedding_latency_ms": round(get_avg_metric("embedding_latency_ms"), 1),
        "avg_retrieval_latency_ms": round(get_avg_metric("retrieval_latency_ms"), 1),
        "avg_api_latency_ms": round(get_avg_metric("api_latency_ms"), 1),
    })
