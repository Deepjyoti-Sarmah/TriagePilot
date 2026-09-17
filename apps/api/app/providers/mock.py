"""Deterministic mock provider. Must agree with apps/web/lib/providers/mock.ts
on the probe URLs (checked implicitly by smoke asserting bug/P1 on #15626).
"""
import re
import time

from .base import ProviderResult, TriageInput, timed
from ..contracts import TriageOutput

NAME = "mock"
MODEL = "mock/deterministic-v1"

_KNOWN = {
    "activepieces/activepieces#15626": dict(
        issue_type="bug", severity="P1", confidence=0.9,
        labels=["bug", "area/flows"],
        draft_reply="Thanks — the subflow INTERNAL_ERROR losing the parent response is a real bug and is being tracked. A maintainer will confirm priority.",
    ),
    "activepieces/activepieces#15623": dict(
        issue_type="bug", severity="P1", confidence=0.9,
        labels=["bug"],
        draft_reply="Thanks — template import 500s on piece-upgrade audit is a known cloud issue under investigation.",
    ),
    "activepieces/activepieces#15627": dict(
        issue_type="bug", severity="P2", confidence=0.85,
        labels=["bug", "docs"],
        draft_reply="Thanks — Chat-to-automation is listed on pricing but missing in Cloud. A maintainer will clarify availability.",
    ),
}


def _has(url: str, *pats: str) -> bool:
    return any(re.search(p, url) for p in pats)


def mock_triage(repo: str, issue_url: str) -> TriageOutput:
    m = re.search(r"github\.com/([^/]+/[^/]+)/(?:issues|pull)/(\d+)", issue_url)
    if m and f"{m.group(1)}#{m.group(2)}" in _KNOWN:
        k = _KNOWN[f"{m.group(1)}#{m.group(2)}"]
        return TriageOutput(repo=repo, duplicate_of=None, needs_human=True, **k)

    url = issue_url.lower()
    if _has(url, r"spam", r"loan", r"airdrop", r"crypto", r"money-fast"):
        return TriageOutput(repo=repo, issue_type="spam", severity="P3",
                             confidence=0.15, labels=["spam"], needs_human=True,
                             draft_reply="Flagged as spam for maintainer review. No action taken automatically.")
    if _has(url, r"syn-dup", r"duplicate"):
        return TriageOutput(repo=repo, issue_type="duplicate", severity="P2",
                             confidence=0.82, duplicate_of=0, labels=["duplicate"],
                             needs_human=True,
                             draft_reply="Looks like a re-report of an existing issue. A maintainer will link the original thread.")
    if _has(url, r"500", r"crash", r"segfault", r"fails", r"broken", r"timeout",
            r"error", r"e2big", r"pkce"):
        sev = "P1" if _has(url, r"500", r"crash", r"segfault", r"e2big") else "P2"
        return TriageOutput(repo=repo, issue_type="bug", severity=sev,
                             confidence=0.86, labels=["bug"], needs_human=True,
                             draft_reply="Thanks for the report — the failure is reproducible from your description. A maintainer will confirm severity and track the fix.")
    if _has(url, r"how", r"question", r"\?", r"custom-domain", r"voided"):
        return TriageOutput(repo=repo, issue_type="question", severity="P3",
                             confidence=0.88, labels=["question"], needs_human=False,
                             draft_reply="Good question — this is covered in the docs. A maintainer will confirm and link the exact section.")
    if _has(url, r"docs", r"readme", r"document"):
        return TriageOutput(repo=repo, issue_type="docs", severity="P3",
                             confidence=0.9, labels=["docs"], needs_human=False,
                             draft_reply="Agreed, this gap in the docs is real. A maintainer will queue a docs update.")
    return TriageOutput(repo=repo, issue_type="question", severity="P3",
                         confidence=0.55, labels=["question"], needs_human=True,
                         draft_reply="Could not classify confidently; routed to a human maintainer.")


class MockProvider:
    name = NAME
    model = MODEL

    def triage(self, inp: TriageInput) -> ProviderResult:
        t0 = time.time()
        return timed(NAME, MODEL, "mock", t0, mock_triage(inp.repo, inp.issue_url))
