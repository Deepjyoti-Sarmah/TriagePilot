"""Pydantic contracts. Must cover every `required` field of
specs/001-maintainer-agent/contracts/output.schema.json (checked by verify.py).
"""
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, Field


class IssueType(str, Enum):
    bug = "bug"
    piece_request = "piece-request"
    feature = "feature"
    docs = "docs"
    question = "question"
    spam = "spam"
    duplicate = "duplicate"


class Severity(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"


class TriageOutput(BaseModel):
    repo: str
    issue_type: IssueType
    severity: Severity
    confidence: float = Field(ge=0, le=1)
    duplicate_of: Optional[int] = None
    labels: list[str] = []
    draft_reply: str = Field(min_length=10, max_length=2000)
    needs_human: bool


class RunMeta(BaseModel):
    provider: str
    model: str
    mode: Literal["mock", "live-agent", "live-classify"]
    latency_ms: int


class RunRequest(BaseModel):
    repo: str = Field(min_length=1, max_length=120)
    issue_url: str = Field(min_length=1, max_length=500)
    title: Optional[str] = Field(default=None, max_length=200)
    body: Optional[str] = Field(default=None, max_length=4000)


class RunResponse(BaseModel):
    run_id: str
    output: TriageOutput
    meta: RunMeta
    mode: str
    error: Optional[str] = None
    message: Optional[str] = None
