# 005 tasks — Evals + guardrails

- [x] `evals/dataset.jsonl` reaches 20 rows per seed repo (80 total, 2026-09-19: 15 github-verified AP + real PRs elsewhere, rest synthetic-edge, see evals/README.md)
- [x] `thresholds.yaml` created: `type_accuracy_min: 0.8, conf_gate: 0.7, dedupe_threshold: 0.85`
- [ ] `verify.py --strict` passes (counts + schema + secret scan)
- [ ] Live guardrail proof: 1 low-conf run + 1 duplicate-webhook run saved with run ids
- [ ] Cost column present in `runs` (tokens + latency logged)
