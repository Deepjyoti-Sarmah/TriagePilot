#!/usr/bin/env python3
"""eval_report.py — offline distribution report for the eval dataset.
No API keys, no LLM calls. Run: python3 scripts/eval_report.py
"""
import json
from collections import Counter
from pathlib import Path

DS = Path(__file__).resolve().parent.parent / "specs/001-maintainer-agent/evals/dataset.jsonl"

rows = [json.loads(l) for l in DS.read_text().splitlines() if l.strip()]
print(f"total rows: {len(rows)}")
for repo in sorted({r["repo"] for r in rows}):
    sub = [r for r in rows if r["repo"] == repo]
    types = Counter(r["expected_type"] for r in sub)
    sevs = Counter(r["expected_severity"] for r in sub)
    srcs = Counter(r.get("source", "?") for r in sub)
    dups = sum(1 for r in sub if r["is_duplicate"])
    print(f"\n{repo} (n={len(sub)}, duplicates={dups})")
    print(f"  type:     {dict(types)}")
    print(f"  severity: {dict(sevs)}")
    print(f"  source:   {dict(srcs)}")
edge = sum(1 for r in rows if r.get("source") == "synthetic-edge" and r["expected_type"] in ("spam", "duplicate"))
print(f"\nedge cases (spam/duplicate synthetic): {edge}")
