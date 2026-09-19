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
    model = os.environ.get("TRIAGE_MODEL", "qwen/qwen3.8-27b:free")

    def triage(self, inp: TriageInput) -> ProviderResult:
        from ..repos import KNOWN_REPOS

        t0 = time.time()
        if inp.repo not in KNOWN_REPOS:
            raise ProviderError(
                "Repo not onboarded to the Cloud agent (memory/KB cover "
                "4 seed repos). Use mock/openrouter/openai for any public repo.",
                status=400, code="unknown_repo",
            )
        webhook = os.environ.get("AP_FLOW_WEBHOOK_URL", "").rstrip("/")
        if not webhook:
            raise ProviderError(
                "Activepieces provider needs AP_FLOW_WEBHOOK_URL "
                "(flow webhook from spec 003).",
                status=501, code="not_wired",
            )
        payload: dict = {}
        # One retry on empty bodies: cold engine runs occasionally return {}
        # before the run completes. Bounded to 2 attempts (agent runs cost).
        for attempt in (1, 2):
            try:
                res = httpx.post(
                    webhook,
                    headers={"Content-Type": "application/json"},
                    json={"repo": inp.repo, "issue_url": inp.issue_url,
                          "model": self.model,
                          "title": inp.title, "body": inp.body},
                    timeout=120,
                )
            except httpx.HTTPError as e:
                raise ProviderError(f"Flow webhook unreachable: {e}.") from e
            if res.status_code >= 400:
                raise ProviderError(f"MCP-entry flow returned {res.status_code}.")
            try:
                payload = res.json()
            except ValueError as e:
                raise ProviderError("MCP-entry flow returned non-JSON.") from e
            if payload.get("output") or (
                isinstance(payload, dict) and payload.get("issue_type")
            ):
                break
            time.sleep(15)
        try:
            output = TriageOutput.model_validate(payload.get("output", payload))
        except Exception as e:
            raise ProviderError("Agent returned output outside the contract.") from e
        return timed(NAME, self.model, "live-agent", t0, output)
