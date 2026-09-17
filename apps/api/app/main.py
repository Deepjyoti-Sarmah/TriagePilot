"""TriagePilot API — standalone Python backend (spec 008).
Run: uvicorn app.main:app --port 8000  (from apps/api/)
"""
import time
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from .contracts import RunMeta, RunRequest, RunResponse
from .providers.activepieces import ProviderError
from .providers.base import TriageInput
from .providers.registry import resolve_provider
from .repos import KNOWN_REPOS

MISSING_CONFIG = {
    "error": "missing_config",
    "message": "Activepieces keys not configured. Running in MOCK mode with deterministic demo output.",
}

# Demo-only in-memory rate limit: 10 req/min/IP (same as the Next route).
_LIMIT, _WINDOW = 10, 60.0
_hits: dict[str, dict] = {}

app = FastAPI(title="TriagePilot API", version="0.1.0")


def _client_ip(req: Request) -> str:
    fwd = req.headers.get("x-forwarded-for", "")
    return fwd.split(",")[0].strip() if fwd else (req.client.host if req.client else "unknown")


def _limited(ip: str) -> bool:
    now = time.time()
    cur = _hits.get(ip)
    if not cur or now > cur["reset"]:
        _hits[ip] = {"count": 1, "reset": now + _WINDOW}
        return False
    cur["count"] += 1
    return cur["count"] > _LIMIT


@app.get("/health")
def health():
    return {"ok": True, "service": "triagepilot-api"}


@app.post("/api/run-agent")
def run_agent(body: dict, req: Request):
    if _limited(_client_ip(req)):
        return JSONResponse(
            {"error": "rate_limited", "message": "10 requests/min/IP in demo."},
            status_code=429,
        )
    try:
        parsed = RunRequest.model_validate(body)
    except ValidationError as e:
        return JSONResponse(
            {"error": "invalid_input", "details": e.errors()},
            status_code=400,
        )
    if not parsed.issue_url.startswith(("http://", "https://")):
        return JSONResponse(
            {"error": "invalid_input", "details": "issue_url must be a URL."},
            status_code=400,
        )
    if parsed.repo not in KNOWN_REPOS:
        return JSONResponse(
            {"error": "unknown_repo",
             "message": "Repo not in registry. Known: activepieces/activepieces + 3 seed repos."},
            status_code=400,
        )
    try:
        provider = resolve_provider()
    except ProviderError as e:
        return JSONResponse({"error": e.code, "message": str(e)}, status_code=e.status)

    try:
        res = provider.triage(TriageInput(repo=parsed.repo, issue_url=parsed.issue_url))
    except ProviderError as e:
        return JSONResponse(
            {"error": e.code, "message": str(e),
             "meta": {"provider": provider.name, "model": provider.model}},
            status_code=e.status,
        )
    payload = RunResponse(
        run_id=f"{res.provider}-{int(time.time() * 1000)}",
        output=res.output,
        meta=RunMeta(provider=res.provider, model=res.model,
                     mode=res.mode, latency_ms=res.latency_ms),  # type: ignore[arg-type]
        mode=res.mode,
        **(MISSING_CONFIG if res.mode == "mock" else {}),
    )
    return JSONResponse(payload.model_dump())
