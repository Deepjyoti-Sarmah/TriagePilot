"""Full-agent path via the Cloud MCP-entry flow (spec 003). Fails closed (501)
until AP_* keys exist — same contract as the TS provider.
"""
import os
import time

import httpx

from .base import ProviderResult, TriageInput, timed
from ..contracts import TriageOutput

NAME = "activepieces"


class ProviderError(Exception):
    def __init__(self, message: str, status: int = 502, code: str = "provider_error"):
        super().__init__(message)
        self.status = status
        self.code = code


class ActivepiecesProvider:
    name = NAME
    model = os.environ.get("TRIAGE_MODEL", "qwen/qwen3.8-27b:free")

    def triage(self, inp: TriageInput) -> ProviderResult:
        t0 = time.time()
        api_key = os.environ.get("AP_API_KEY", "")
        project = os.environ.get("AP_PROJECT_ID", "")
        base = os.environ.get("AP_MCP_URL", "").rstrip("/")
        if not (api_key and project and base):
            raise ProviderError(
                "Activepieces provider needs AP_API_KEY, AP_PROJECT_ID, AP_MCP_URL.",
                status=501, code="not_wired",
            )
        try:
            res = httpx.post(
                f"{base}/maintainer-entry",
                headers={"Content-Type": "application/json", "Authorization": f"Bearer {api_key}"},
                json={"projectId": project, "repo": inp.repo,
                      "issue_url": inp.issue_url, "model": self.model},
                timeout=90,
            )
        except httpx.HTTPError as e:
            raise ProviderError(f"MCP-entry flow unreachable: {e}.") from e
        if res.status_code >= 400:
            raise ProviderError(f"MCP-entry flow returned {res.status_code}.")
        try:
            payload = res.json()
        except ValueError as e:
            raise ProviderError("MCP-entry flow returned non-JSON.") from e
        try:
            output = TriageOutput.model_validate(payload.get("output", payload))
        except Exception as e:
            raise ProviderError("Agent returned output outside the contract.") from e
        return timed(NAME, self.model, "live-agent", t0, output)
