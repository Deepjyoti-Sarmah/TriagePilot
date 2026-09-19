# 005 tasks — Evals + guardrails

- [x] `evals/dataset.jsonl` reaches 20 rows per seed repo (80 total,
  2026-09-19: 15 github-verified AP + real PRs elsewhere, rest
  synthetic-edge, see evals/README.md)
- [x] `thresholds.yaml` created: `type_accuracy_min: 0.8, conf_gate: 0.7,
  dedupe_threshold: 0.85`
- [x] First live sweep 2026-09-19 (`scripts/eval_sweep.py`, DeepSeek free,
  12 rows): strict 0.750 (9/12) vs gate 0.8 → FAIL stands; 7/7 on
  resolvable rows, 3 misses are synthetic URLs that 404 (model correctly
  held for human). Artifact `evals/sweep-001.json`.
- [x] Methodology fix: synthetic rows get inline `title`/`body` so
  direct-path evals are fair; re-run sweep
- [x] Re-sweep 2026-09-19 (`sweep-002.json`, direct path): **0.800 (8/10)
  vs gate 0.8 → PASS (boundary)**. 2 rows 503'd (free-pool), excluded.
- [x] **Live agent-path sweep 2026-09-19** (`sweep-003.json`, provider
  `activepieces`, 12 rows through the Cloud flow): **0.909 (10/11) vs
  gate 0.8 → PASS**. 1 row hit the Cloud `/sync` 30s ceiling (408,
  excluded); 1 miss is the single-report duplicate → bug (dedupe is the
  flow's hard case; candidates were surfaced but not matched).
- [x] **Live agent-path re-sweep 2026-09-20** (`sweep-004.json`,
  `nvidia/nemotron-3-super-120b-a12b:free` + fallback chain, 12/12 scored):
  **0.833 (10/12) vs gate 0.8 → PASS**. Misses: a piece-request read as
  feature, and the single-report duplicate → bug (known structural hard case).
- [x] Live low-confidence guardrail proof: unresolvable issue URL →
  conf 0.4, `needs_human: true` — artifact `live-lowconf-001.json`
- [x] Inline title/body forwarded through the `activepieces` provider so
  synthetic eval rows never depend on a live GitHub fetch
- [ ] Live duplicate-webhook / idempotency proof for external posts (same
  `repo:issue_id` twice → single post) — the flow has no GitHub/Slack write
  to double-post; it logs one audit row per call by design. A stricter
  idempotency key would need a find-record + branch guard.
- [x] Cost column present in `runs` (latency + provider/model + mode +
  tools_used): the Cloud `runs` table was seeded with fields via
  `build_flows.py --seed-tables`, the triage flows append a row per run, and
  `/runs` reads it live (`specs/002-multi-repo/tasks.md`)
- [ ] `verify.py --strict` passes — blocked only by the UI-only tasks
  (001 Cloud Agent entity, 004 Vercel) and the KB/memory task in 002; plain
  `verify.py` is 80/80 and CI runs that
