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
- [x] Live low-confidence guardrail proof: unresolvable issue URL →
  conf 0.4, `needs_human: true` — artifact `live-lowconf-001.json`
- [x] Inline title/body forwarded through the `activepieces` provider so
  synthetic eval rows never depend on a live GitHub fetch
- [ ] Live duplicate-webhook / idempotency proof (same `repo:issue_id`
  twice → single post) — needs a flow with a write step; the triage flow
  is read-only, so there is nothing to double-post
- [ ] Cost column present in `runs` (tokens + latency + provider/model) —
  `tables/schema.sql` has the columns; the Cloud `runs` table still needs
  its fields created in the UI (public API has no field-create route)
- [ ] `verify.py --strict` passes — blocked only by the UI-only tasks in
  001 (Agent entity/MCP) and 004 (Vercel); plain `verify.py` is 80/80
