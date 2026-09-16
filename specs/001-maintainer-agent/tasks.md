# 001 tasks — Maintainer Agent core

> Tick `- [x]` only after live check. Verifier counts boxes + checks files.

## Prompt + contracts

- [ ] `agent.prompt.md` drafted and pasted into Cloud agent (v1)
- [x] `contracts/output.schema.json` validates 3 sample outputs (run `verify.py`)
- [ ] `tools.matrix.md` reviewed: no tool has write access without approval note

## Cloud agent setup

- [ ] Agent created in Cloud project, provider OpenRouter, model `qwen/qwen3.8-27b:free`, `maxSteps: 12`, `webSearch: on`
- [ ] `structuredOutput` set from `output.schema.json`
- [ ] Live test: triaged 1 real Activepieces issue in `agent-test-step`, output saved to `evals/sample-run-001.json`
- [ ] Low-confidence case (`conf < 0.7`) correctly sets `needs_human: true` (1 proof run)

## Evals seed

- [x] `evals/dataset.jsonl` has ≥5 starter rows (full 20/repo lands in spec 005, but format locked here) — done: 80 rows, see evals/README.md
- [ ] Each row has keys: `repo, issue_url, expected_type, expected_severity, is_duplicate`
