"""Full-agent path via the Cloud MCP-entry flow webhook (spec 003).

Auth note (verified 2026-09-19): the MCP server at /mcp is OAuth-only —
no static token exists, and the API key is rejected there (401). Flow
webhook triggers are the firewall-friendly path: set AP_FLOW_WEBHOOK_URL
after creating the flow in Cloud. Until then: fail closed (501).
"""
import os
import time

import httpx

from .base import ProviderResult, TriageInput, timed
from ..contracts import TriageOutput

NAME = "activepieces"


class ProviderError(Exception):
    def __init__(self, message: str, status: int = 500, code: str = "provider_error"):
        super().__init__(message)
        self.status = status
        self.code = code


class ActivepiecesProvider:
    name = NAME
    model = os.environ.get("TRIAGE_MODEL", "deepseek/deepseek-v4-flash-0731:free")

    def triage(self, inp: TriageInput) -> ProviderResult:
        t0 = time.time()
        webhook = os.environ.get("AP_FLOW_WEBHOOK_URL", "").rstrip("/")
        if not webhook:
            raise ProviderError(
                "Activepieces provider needs AP_FLOW_WEBHOOK_URL "
                "(flow webhook from spec 003).",
                status=501, code="not_wired",
            )
        try:
            res = httpx.post(
                webhook,
                headers={"Content-Type": "application/json"},
                json={"repo": inp.repo, "issue_url": inp.issue_url,
                      "model": self.model,
                      "title": inp.title, "body": inp.body},
                timeout=90,
            )
        except httpx.HTTPError as e:
            raise ProviderError(f"Flow webhook unreachable: {e}.") from e
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
