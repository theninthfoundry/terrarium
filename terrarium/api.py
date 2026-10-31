from __future__ import annotations

import hmac
import os
from threading import Lock
from pathlib import Path
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .engine import analyze_repository

ROOT = Path(__file__).resolve().parents[1]
SAMPLE_ROOT = ROOT / "sample_repo"
WORKSPACE_ROOT = Path(os.getenv("TERRARIUM_WORKSPACE_ROOT", str(ROOT))).resolve()
API_TOKEN = os.getenv("TERRARIUM_API_TOKEN", "")
_ANALYSIS_LOCK = Lock()

app = FastAPI(title="Terrarium", version="0.1.0", description="Mutation-validated software change intelligence")
_allowed_origins = [origin.strip() for origin in os.getenv("TERRARIUM_ALLOWED_ORIGINS", "").split(",") if origin.strip()]
if _allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_allowed_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
    )
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


class AnalyzeRequest(BaseModel):
    repository_path: str = Field(default="sample_repo", max_length=500)
    changed_files: list[str] = Field(default_factory=lambda: ["src/pricing.py"], max_length=20)
    max_mutations: int = Field(default=6, ge=1, le=20)


def require_token(authorization: str | None = Header(default=None)):
    if API_TOKEN:
        supplied = authorization.removeprefix("Bearer ") if authorization else ""
        if not hmac.compare_digest(supplied, API_TOKEN):
            raise HTTPException(status_code=401, detail="A valid Terrarium API token is required")


@app.get("/")
def index():
    return FileResponse(ROOT / "templates" / "index.html")


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "terrarium", "version": "0.1.0"}


@app.get("/api/demo")
def demo():
    return {"repository": "terrarium-sample", "path": "sample_repo", "changed_files": ["src/pricing.py"], "description": "A small checkout/pricing service with a deliberately untested discount boundary."}


@app.post("/api/analyze", dependencies=[Depends(require_token)])
def analyze(request: AnalyzeRequest) -> dict[str, Any]:
    if os.getenv("TERRARIUM_ALLOW_REPOSITORIES", "0") != "1" and request.repository_path != "sample_repo":
        raise HTTPException(status_code=403, detail="This deployment is in public demo mode. Configure TERRARIUM_ALLOW_REPOSITORIES=1 and an API token for private workspaces.")
    if os.getenv("TERRARIUM_ALLOW_REPOSITORIES", "0") == "1" and not API_TOKEN:
        raise HTTPException(status_code=503, detail="Private repository analysis requires TERRARIUM_API_TOKEN")
    requested = Path(request.repository_path)
    candidate = (WORKSPACE_ROOT / requested).resolve() if not requested.is_absolute() else requested.resolve()
    try:
        candidate.relative_to(WORKSPACE_ROOT)
    except ValueError:
        raise HTTPException(status_code=400, detail="Repository must be inside TERRARIUM_WORKSPACE_ROOT")
    if not candidate.is_dir():
        raise HTTPException(status_code=404, detail="Repository directory was not found")
    if not _ANALYSIS_LOCK.acquire(blocking=False):
        raise HTTPException(status_code=409, detail="Another experiment is running. Try again when it finishes.")
    try:
        report = analyze_repository(candidate, request.changed_files, request.max_mutations)
        return report.to_dict()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed safely: {type(exc).__name__}: {exc}")
    finally:
        _ANALYSIS_LOCK.release()
