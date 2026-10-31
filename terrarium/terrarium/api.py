from __future__ import annotations

import hmac
import os
import time
from pathlib import Path
from threading import Lock
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .engine import analyze_repository

ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_ROOT = Path(os.getenv('TERRARIUM_WORKSPACE_ROOT', str(ROOT))).resolve()
API_TOKEN = os.getenv('TERRARIUM_API_TOKEN', '')
PUBLIC_MODE = os.getenv('TERRARIUM_ALLOW_REPOSITORIES', '0') != '1'
_ANALYSIS_LOCK = Lock()
_RATE_LOCK = Lock()
_LAST_RUN: dict[str, float] = {}
_COOLDOWN_SECONDS = max(0, int(os.getenv('TERRARIUM_DEMO_COOLDOWN_SECONDS', '20')))

app = FastAPI(title='Terrarium', version='0.2.0', description='Mutation-validated change intelligence')
origins = [s.strip() for s in os.getenv('TERRARIUM_ALLOWED_ORIGINS', '').split(',') if s.strip()]
if origins:
    app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=False,
                       allow_methods=['GET', 'POST', 'OPTIONS'],
                       allow_headers=['Content-Type', 'Authorization'])
app.mount('/static', StaticFiles(directory=ROOT / 'static'), name='static')


class AnalyzeRequest(BaseModel):
    repository_path: str = Field(default='sample_repo', min_length=1, max_length=500)
    changed_files: list[str] = Field(default_factory=lambda: ['src/pricing.py'], min_length=1, max_length=20)
    max_mutations: int = Field(default=6, ge=1, le=20)


def require_token(authorization: str | None = Header(default=None)):
    if API_TOKEN:
        token = authorization[7:] if authorization and authorization.startswith('Bearer ') else ''
        if not hmac.compare_digest(token, API_TOKEN):
            raise HTTPException(status_code=401, detail='Authorization required')


@app.get('/')
def index():
    return FileResponse(ROOT / 'templates' / 'index.html')


@app.get('/api/health')
def health():
    return {'status': 'ok', 'service': 'terrarium', 'version': '0.2.0',
            'mode': 'public-demo' if PUBLIC_MODE else 'trusted-workspace',
            'gemma_configured': bool(os.getenv('GEMMA_API_KEY') or os.getenv('GOOGLE_API_KEY'))}


@app.get('/api/demo')
def demo():
    return {'repository': 'terrarium-sample', 'path': 'sample_repo',
            'changed_files': ['src/pricing.py'],
            'description': 'A reproducible case where reflection hides a test dependency.'}


def _resolve_repository(path: str) -> Path:
    if PUBLIC_MODE:
        if path != 'sample_repo':
            raise HTTPException(403, 'Public demo accepts only the bundled sample repository')
        # Workspaces cannot redirect the public sample with symlinks.
        candidate = (ROOT / 'sample_repo').resolve()
        if not candidate.is_relative_to(ROOT):
            raise HTTPException(503, 'Invalid sample repository configuration')
    else:
        if not API_TOKEN:
            raise HTTPException(503, 'Trusted-workspace mode requires an API token')
        candidate = (WORKSPACE_ROOT / path).resolve()
        if not candidate.is_relative_to(WORKSPACE_ROOT):
            raise HTTPException(400, 'Repository must stay within the workspace')
    if not candidate.is_dir():
        raise HTTPException(404, 'Repository directory not found')
    return candidate


@app.post('/api/analyze', dependencies=[Depends(require_token)])
def analyze(request: AnalyzeRequest, http_request: Request) -> dict[str, Any]:
    candidate = _resolve_repository(request.repository_path)
    if PUBLIC_MODE and (request.changed_files != ['src/pricing.py'] or request.max_mutations > 6):
        raise HTTPException(400, 'Public demo is restricted to its verified sample experiment')
    # Safe single-worker demo throttle. Use an edge proxy/WAF for distributed rate limiting.
    if not _ANALYSIS_LOCK.acquire(blocking=False):
        raise HTTPException(429, 'An experiment is running; retry shortly', headers={'Retry-After': '5'})
    try:
        if PUBLIC_MODE and _COOLDOWN_SECONDS:
            now = time.monotonic()
            # Shared throttle avoids trusting spoofable forwarded IP headers.
            with _RATE_LOCK:
                last = _LAST_RUN.get('global', -float('inf'))
                remaining = _COOLDOWN_SECONDS - (now - last)
                if remaining > 0:
                    raise HTTPException(429, 'Demo cooldown active', headers={'Retry-After': str(max(1, int(remaining) + 1))})
                _LAST_RUN['global'] = now
        report = analyze_repository(candidate, request.changed_files, request.max_mutations)
        return report.to_dict()
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    except HTTPException:
        raise
    except Exception:
        # Do not reveal filesystem paths, subprocess output, or private data to callers.
        raise HTTPException(500, 'Experiment failed. See server logs for diagnostics.') from None
    finally:
        _ANALYSIS_LOCK.release()
