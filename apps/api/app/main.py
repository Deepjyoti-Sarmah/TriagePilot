"""TriagePilot API — standalone Python backend (spec 008).
Run: uvicorn app.main:app --port 8000  (from apps/api/)
"""
import os
import time
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError

load_dotenv()  # apps/api/.env (git-ignored) for local runs

from .contracts import RunMeta, RunRequest, RunResponse
from .providers.activepieces import ProviderError
from .providers.base import TriageInput
from .providers.registry import resolve_provider

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


def _parse_repo(ref: str) -> str | None:
    """Accept owner/name or any github.com URL containing it."""
    import re

    ref = (ref or "").strip().strip("/")
    m = re.search(r"github\.com/([^/]+/[^/]+)", ref)
    if m:
        return m.group(1)
    if re.fullmatch(r"[^/\s]+/[^/\s]+", ref):
        return ref
    return None


@app.get("/api/repo-issues")
def repo_issues(repo: str = "", state: str = "open", per_page: int = 15):
    """List issues for triage tracking (spec 009). PAT-gated like providers."""
    import httpx

    token = os.environ.get("GITHUB_PAT", "")
    if not token:
        return JSONResponse(
            {"error": "not_wired",
             "message": "Issue listing needs GITHUB_PAT."},
            status_code=501,
        )
    full = _parse_repo(repo)
    if not full:
        return JSONResponse(
            {"error": "invalid_input",
             "message": "repo must be owner/name or a github.com repo URL."},
            status_code=400,
        )
    per_page = max(1, min(per_page, 30))
    try:
        res = httpx.get(
            f"https://api.github.com/repos/{full}/issues",
            params={"state": state if state in ("open", "closed", "all") else "open",
                    "per_page": per_page, "sort": "updated", "direction": "desc"},
            headers={"Accept": "application/vnd.github+json",
                     "Authorization": f"Bearer {token}"},
            timeout=25,
        )
    except httpx.HTTPError as e:
        return JSONResponse({"error": "provider_error",
                             "message": f"GitHub unreachable: {e}."},
                            status_code=502)
    if res.status_code >= 400:
        return JSONResponse({"error": "provider_error",
                             "message": f"GitHub returned {res.status_code}."},
                            status_code=502)
    items = []
    for it in res.json():
        labels = it.get("labels") or []
        items.append({
            "number": it.get("number"),
            "title": it.get("title") or "",
            "state": it.get("state") or "",
            "labels": [l.get("name") if isinstance(l, dict) else str(l)
                       for l in labels],
            "updated_at": it.get("updated_at") or "",
            "html_url": it.get("html_url") or "",
            "is_pull_request": bool(it.get("pull_request")),
            "body": (it.get("body") or "")[:1500],
        })
    return {"repo": full, "count": len(items), "issues": items}


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
    # Open-repo UX (spec 009): any public repo works on open paths.
    # The activepieces provider enforces the onboarded-repo scope itself.
    try:
        provider = resolve_provider()
    except ProviderError as e:
        return JSONResponse({"error": e.code, "message": str(e)}, status_code=e.status)

    try:
        res = provider.triage(TriageInput(repo=parsed.repo, issue_url=parsed.issue_url,
                                          title=parsed.title, body=parsed.body))
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
