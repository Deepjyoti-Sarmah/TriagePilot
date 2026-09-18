# 005 tasks — Evals + guardrails

- [x] `evals/dataset.jsonl` reaches 20 rows per seed repo (80 total, 2026-09-19: 15 github-verified AP + real PRs elsewhere, rest synthetic-edge, see evals/README.md)
- [x] `thresholds.yaml` created: `type_accuracy_min: 0.8, conf_gate: 0.7, dedupe_threshold: 0.85`
- [x] First live sweep 2026-09-19 (`scripts/eval_sweep.py`, DeepSeek free, 12 rows): strict 0.750 (9/12) vs gate 0.8 → FAIL stands; 7/7 on resolvable rows, 3 misses are synthetic URLs that 404 (model correctly held for human). Artifact `evals/sweep-001.json`.
- [ ] Methodology fix: synthetic rows get inline `title`/`body` so direct-path evals are fair; re-run sweep
- [ ] `verify.py --strict` passes (counts + schema + secret scan)
- [ ] `verify.py --strict` passes (counts + schema + secret scan)
- [ ] Live guardrail proof: 1 low-conf run + 1 duplicate-webhook run saved with run ids
- [ ] Cost column present in `runs` (tokens + latency + provider/model per spec 007)
