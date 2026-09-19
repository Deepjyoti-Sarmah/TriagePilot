"""Direct classify-only providers (OpenAI-compatible chat completions).
Mirrors apps/web/lib/providers/direct.ts: same prompt source, same 0.8 gate.
"""
import json
import os
import time
from pathlib import Path

import httpx

from .base import ProviderResult, TriageInput, timed
from .activepieces import ProviderError
from ..contracts import TriageOutput

FALLBACK_PROMPT = (
    "You triage ONE GitHub issue for repo {{repo}}. No tools. Decide from title+URL alone. "
    'Return JSON ONLY: {"issue_type":"bug|piece-request|feature|docs|question|spam|duplicate",'
    '"severity":"P0|P1|P2|P3","confidence":0.0-1.0,"duplicate_of":null,"labels":[],'
    '"draft_reply":"3-6 lines","needs_human":true|false}. '
    "Unsure → confidence ≤ 0.6, needs_human true. Never invent URLs or numbers."
)

PRESETS = {
    "openrouter": {
        "base": "https://openrouter.ai/api/v1",
        "key_env": "OPENROUTER_API_KEY",
        "model": "nvidia/nemotron-3-super-120b-a12b:free",
        "headers": {"HTTP-Referer": "https://github.com/Deepjyoti-Sarmah",
                    "X-Title": "TriagePilot"},
    },
    "openai": {
        "base": "https://api.openai.com/v1",
        "key_env": "OPENAI_API_KEY",
        "model": "gpt-4o-mini",
        "headers": {},
    },
}


def load_prompt(repo: str) -> str:
    here = Path(__file__).resolve()
    for _ in range(7):  # walk up toward repo root
        candidate = (here / "specs" / "007-provider-backend"
                     / "contracts" / "direct.prompt.md")
        if candidate.exists():
            try:
                return candidate.read_text().replace("{{repo}}", repo)
            except OSError:
                break
        here = here.parent
    return FALLBACK_PROMPT.replace("{{repo}}", repo)


def _extract_json(text: str):
    """Parse model output leniently: raw JSON, else the largest {...} block.
    Reasoning models often wrap JSON in thinking traces — extract, don't reject.
    """
    import re as _re

    try:
        return json.loads(text)
    except Exception:
        pass
    for m in _re.finditer(r"\{.*\}", text, _re.DOTALL):
        try:
            return json.loads(m.group(0))
        except Exception:
            continue
    return None


def _issue_context(inp: "TriageInput") -> str:
    """Inline row content wins (synthetic evals); otherwise fetch GitHub."""
    if inp.title is not None or inp.body is not None:
        title = (inp.title or "").strip()
        body = (inp.body or "").strip()[:3000]
        return f"Title: {title}\nBody: {body or '(empty)'}"
    return _github_issue_text(inp.repo, inp.issue_url)


def _github_issue_text(repo: str, issue_url: str) -> str:
    """Fetch public title+body so the model classifies content, not URLs.
    Unauthenticated: 60 req/hr. GITHUB_PAT (optional): 5000/hr.
    Never fails the run — returns a note when unavailable.
    """
    import re as _re

    m = _re.search(r"github\.com/([^/]+/[^/]+)/(?:issues|pull)/(\d+)", issue_url)
    if not m:
        return "(could not parse issue reference from URL)"
    owner_repo, num = m.group(1), m.group(2)
    headers = {"Accept": "application/vnd.github+json"}
    token = os.environ.get("GITHUB_PAT", "")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        res = httpx.get(
            f"https://api.github.com/repos/{owner_repo}/issues/{num}",
            headers=headers, timeout=20,
        )
        if res.status_code >= 400:
            return f"(GitHub API returned {res.status_code} for this issue)"
        data = res.json()
        title = (data.get("title") or "").strip()
        body = (data.get("body") or "").strip()[:3000]
        return f"Title: {title}\nBody: {body or '(empty)'}"
    except Exception as e:
        return f"(issue context unavailable: {type(e).__name__})"


def _hold(repo: str, reason: str) -> TriageOutput:
    return TriageOutput(
        repo=repo, issue_type="question", severity="P3", confidence=0.4,
        labels=["question"], needs_human=True,
        draft_reply=f"Direct classify-only path could not verify this issue ({reason}). Routed to a human maintainer.",
    )


def make_direct(name: str):
    preset = PRESETS[name]

    class DirectProvider:
        def triage(self, inp: TriageInput) -> ProviderResult:
            t0 = time.time()
            model = os.environ.get("TRIAGE_MODEL", preset["model"])
            api_key = os.environ.get(preset["key_env"], "")
            if not api_key:
                raise ProviderError(
                    f"Direct {name} path needs {preset['key_env']}.",
                    status=501, code="not_wired",
                )
            try:
                res = httpx.post(
                    f"{preset['base']}/chat/completions",
                    headers={"Content-Type": "application/json",
                              "Authorization": f"Bearer {api_key}",
                              **preset["headers"]},
                    json={"model": model,
                           "messages": [
                               {"role": "system", "content": load_prompt(inp.repo)},
                               {"role": "user",
                                "content": f"Repo: {inp.repo}\nURL: {inp.issue_url}\n"
                                           f"{_issue_context(inp)}"},
                           ],
                           "temperature": 0.2,
                           "response_format": {"type": "json_object"}},
                    timeout=60,
                )
            except httpx.HTTPError as e:
                raise ProviderError(f"Direct {name} call failed: {e}.") from e
            if res.status_code >= 400:
                raise ProviderError(f"Direct {name} call failed with {res.status_code}.")
            try:
                text = (res.json()["choices"][0]["message"]["content"] or "")
                parsed = _extract_json(text)
                # repo is routing context, never model output: inject server-side.
                if isinstance(parsed, dict):
                    parsed["repo"] = inp.repo
                output = TriageOutput.model_validate(parsed)
            except Exception:
                return timed(name, model, "live-classify", t0,
                             _hold(inp.repo, "model output broke the contract"))
            output = output.model_copy(update={
                "duplicate_of": None,  # no search tool on the direct path
                "needs_human": output.needs_human or output.confidence < 0.8,
            })
            return timed(name, model, "live-classify", t0, output)

    DirectProvider.__name__ = f"{name.title()}Provider"
    inst = DirectProvider()
    inst.name = name  # type: ignore[attr-defined]
    inst.model = os.environ.get("TRIAGE_MODEL", preset["model"])  # type: ignore[attr-defined]
    return inst


openrouter_provider = make_direct("openrouter")
openai_provider = make_direct("openai")
