# 005 — Evals + guardrails

## 1. Title

Prove correctness, not vibes.

## 2. Problem

Agent demos lie without labeled evals + enforced gates. We need precision numbers + no-secret + no-double-post guarantees.

## 3. Non-goals

- No LLM-as-judge in v1 (exact/allow-list matching only).

## 4. Functional requirements

- FR-1: `dataset.jsonl` ≥20 rows/repo with `repo, issue_url, expected_type, expected_severity, is_duplicate`.
- FR-2: Offline gate: type accuracy >0.8 on flagship repo before Cloud publish.
- FR-3: Runtime gates: `conf<0.7→needs_human`, `P0→needs_human`, `spam→needs_human`, idempotency enforced.
- FR-4: Secret scan passes on every verify (no `sk-|ghp_|xox|AP_API` literals).
- FR-5: Cost logged per run (`tokens`, `latency_ms`) to `runs`.

## 5. Contracts

- `specs/001-maintainer-agent/evals/dataset.jsonl` + `specs/005-evals-guardrails/thresholds.yaml` (to be created in D6).
