# Activepieces-ai — Multi-Repo Maintainer Agent

AI-agent-first showcase for Activepieces: one ReAct-style agent
(OpenRouter `deepseek/deepseek-v4-flash-0731:free`, `maxSteps: 12`) triages
GitHub issues for N repos, with human approval before any post.
Gravity-style demo on Vercel.

Start here: `PLAN.md` → `specs/README.md` → `specs/001-maintainer-agent/spec.md`.

## What is live right now (2026-09-19)

- **Cloud flow endpoint (real):** `mcp-maintainer-entry` is built, published
  and ENABLED in Activepieces Cloud. A Catch Webhook trigger (`/sync`) runs a
  Code step that fetches the GitHub issue, runs a dedupe search, and calls
  OpenRouter, then returns the structured verdict. Live: #15626 →
  `bug / P1 / conf 0.95` with tools `[github.get_issue, openrouter.chat]`.
- **Second flow:** `webhook-github-intake` accepts GitHub `issues` events and
  normalizes them before the same triage step. Live: #15616 → `bug / P1`.
- **Backend switch:** set `AP_FLOW_WEBHOOK_URL` and the `activepieces`
  provider routes through the live flow; without it the app falls back to the
  keyless mock. Live verdict through FastAPI verified end-to-end.
- Builders: `scripts/cloud/build_flows.py` (publish/exports) and
  `scripts/cloud/mcp_entry_code.js` (the tool-using step). Secrets live in
  Cloud project **Variables** and are referenced as `{{variables.*}}`; the
  committed exports never contain values.

Still UI-only (public API refuses): the Cloud **Agent** entity
(`GET /v1/agents` → 402 `FEATURE_DISABLED`) and the MCP server routes
(→ 403). `scripts/cloud/build_flows.py` documents this and uses flow
webhooks as the firewall-friendly path instead.

## Quickstart

```bash
# 1. Check what is correct so far (no keys needed)
python3 scripts/verify.py
python3 scripts/verify.py --spec 001-maintainer-agent
python3 scripts/verify.py --strict   # full gate before publish

# 2. One-command runtime proof (no keys needed, forces mock)
bash scripts/smoke.sh 3210

# 3. Work a spec: implement its tasks.md, re-run verifier, update specs/status.yaml
```

## Live calls (keys in `apps/api/.env`, git-ignored)

```bash
# rebuild/publish the Cloud flows and print their URLs
python3 scripts/cloud/build_flows.py --all

# run one verdict through the live Cloud flow, via the backend
cd apps/api
TRIAGE_PROVIDER=activepieces python3 -m uvicorn app.main:app --port 8000
curl -s -X POST localhost:8000/api/run-agent -H 'Content-Type: application/json' \
  -d '{"repo":"activepieces/activepieces","issue_url":"https://github.com/activepieces/activepieces/issues/15626"}'

# live accuracy sweep through the agent path (spec 005)
python3 scripts/eval_sweep.py --provider activepieces --n 12 --out sweep-003.json
```

## What runs without keys vs what is blocked

| Runs keyless now | Blocked on Cloud UI / secrets |
|---|---|
| `verify.py` structural gates + eval counts | Cloud **Agent entity** + MCP server (UI/OAuth only) |
| `eval_report.py` 80-row distribution | `daily-digest` Slack post + schedule trigger |
| Web app in MOCK mode: `/chat /runs /repos/new` | Vercel preview URL |
| `smoke.sh` full runtime asserts (forced mock) | KB upload/embeddings |
| 2 live Cloud flows rebuilt from source |  |

Keyed work starts the day secrets land (`.env.example` lists them).
Demo path: `DEMO.md`.

## Layout

- `PLAN.md` — master plan + build order + secrets list
- `specs/` — 001 agent, 002 multi-repo, 003 flows, 004 web, 005 evals, 006 keyless,
  007 provider backend, 008 python backend + `_system/` (how-to + verification)
- `scripts/verify.py` — the checker. Exit 0 = pass.
- `scripts/cloud/` — programmatic Cloud flow builder + tool-using Code step
- `flows/` — Cloud exports (real; secrets are `{{variables.*}}` references)
- `tables/schema.sql` — Tables DDL source of truth
- `knowledge/SOURCES.md` — KB upload tracker
- `apps/web` — Next.js console (thin proxy to Python when `TRIAGE_API_URL` set,
  live Cloud flow when `AP_FLOW_WEBHOOK_URL` set, local mock otherwise)
- `apps/api` — FastAPI backend: provider registry, contracts, `/health` + `/api/run-agent`
- `.env.example` — keys you provide later (never commit real values)
