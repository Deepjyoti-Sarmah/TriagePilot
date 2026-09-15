# Activepieces-ai — Multi-Repo Maintainer Agent

AI-agent-first showcase for Activepieces: one ReAct agent (`gpt-4o`, `maxSteps: 12`) triages GitHub issues for N repos, with human approval before any post. Gravity-style demo on Vercel.

Start here: `PLAN.md` → `specs/README.md` → `specs/001-maintainer-agent/spec.md`.

## Quickstart

```bash
# 1. Check what is correct so far (no keys needed)
python3 scripts/verify.py
python3 scripts/verify.py --spec 001-maintainer-agent
python3 scripts/verify.py --strict   # full gate before publish

# 2. Work a spec: implement its tasks.md, re-run verifier, update specs/status.yaml
```

## Layout

- `PLAN.md` — master plan + build order + secrets list (you provide keys later)
- `specs/` — 001 agent, 002 multi-repo, 003 flows, 004 web, 005 evals + `_system/` (how-to + verification)
- `scripts/verify.py` — the checker. Exit 0 = pass.
- `flows/` — Cloud exports (placeholders until D4)
- `tables/schema.sql` — Tables DDL source of truth
- `knowledge/SOURCES.md` — KB upload tracker
- `apps/web` — Next.js (scaffolded D5)
- `.env.example` — keys you will provide later (never commit real values)
