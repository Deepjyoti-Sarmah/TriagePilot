"""Provider interface. Mirrors apps/web/lib/providers/types.ts."""

import time
from dataclasses import dataclass
from typing import Protocol

from ..contracts import TriageOutput


@dataclass
class TriageInput:
    repo: str
    issue_url: str
    # Inline content (synthetic eval rows). Skips the GitHub fetch when set.
    title: str | None = None
    body: str | None = None


@dataclass
class ProviderResult:
    output: TriageOutput
    provider: str
    model: str
    mode: str
    latency_ms: int


class TriageProvider(Protocol):
    name: str
    model: str

    def triage(self, inp: TriageInput) -> ProviderResult: ...


def timed(
    provider_name: str, model: str, mode: str, t0: float, output: TriageOutput
) -> ProviderResult:
    return ProviderResult(
        output=output,
        provider=provider_name,
        model=model,
        mode=mode,
        latency_ms=int((time.time() - t0) * 1000),
    )
