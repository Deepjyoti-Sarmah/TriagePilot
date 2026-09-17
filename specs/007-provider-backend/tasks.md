# 007 tasks — Provider-agnostic backend

- [x] `lib/providers/` implements `types, mock, activepieces, direct, index`; route uses registry only (no provider logic in route)
- [x] Every response carries `meta {provider, model, mode, latency_ms}`; unknown `TRIAGE_PROVIDER` → 400 `unknown_provider` (proven live: bogus → 400)
- [x] Classify prompt versioned in `contracts/direct.prompt.md`, loaded at request time with inline fallback
- [x] `.env.example` (root + web) documents `TRIAGE_PROVIDER / TRIAGE_MODEL / OPENROUTER_API_KEY`
- [x] `tables/schema.sql` `runs` gains `provider, model` columns; `005` tasks note provider in cost log
- [x] `verify.py` fails if any `lib/providers/*.ts` lacks a `triage` export; `smoke.sh` asserts `meta.provider` (10/10 green incl. rebuild-on-stale)
- [x] Live hardening 2026-09-19: GitHub title+body context fetch, lenient JSON extraction, server-side `repo` injection (artifact `evals/sample-run-direct-001.json`)
