# 005 tasks — Evals + guardrails

- [ ] `evals/dataset.jsonl` reaches 20 rows per seed repo (starter 5 allowed before D6)
- [ ] `thresholds.yaml` created: `type_accuracy_min: 0.8, conf_gate: 0.7, dedupe_threshold: 0.85`
- [ ] `verify.py --strict` passes (counts + schema + secret scan)
- [ ] Live guardrail proof: 1 low-conf run + 1 duplicate-webhook run saved with run ids
- [ ] Cost column present in `runs` (tokens + latency logged)
