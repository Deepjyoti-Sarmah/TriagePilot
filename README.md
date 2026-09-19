# TriagePilot — maintainer agent console for every GitHub repo

Paste any issue link, get back **type, severity, labels, duplicate check, and a draft maintainer reply** — in seconds, as UI or JSON. A human approves everything; the machine does the sorting.

**Try it in 30 seconds:** open `/chat`, paste `https://github.com/activepieces/activepieces/issues/15626`, hit Run. Or pick a live demo on the landing page — real open issues from Next.js, Bun, TypeScript.

## How it works

```
You ── repo/issue link ──▶ Next.js console ──▶ FastAPI backend ──┬──▶ mock (keyless demo)
                                                             ├──▶ direct LLM: OpenRouter / OpenAI (classify-only)
                                                             └──▶ Activepieces Cloud flow (full agent: tools + memory + KB)
```

- **Console** (`apps/web`): triage one issue (`/chat`), track a whole backlog (`/track`), audit log (`/runs`), onboard repos (`/repos/new`)
- **Backend** (`apps/api`, FastAPI): provider registry — swap models with `TRIAGE_PROVIDER` / `TRIAGE_MODEL`, never a rewrite. Every run stamped `{provider, model, mode, latency_ms}`
- **Activepieces Cloud**: 4 flows (webhook intake, MCP entry, MCP tool, daily digest) + 4 tables (memory, runs log). Webhook path is the programmatic entry; MCP trigger serves Cursor/Claude
- **Evals that matter**: 80 labeled rows, accuracy gate 0.8 — passed twice live (0.800 direct, 0.909 flow). Artifacts in `specs/001-maintainer-agent/evals/`

## Deploy on Vercel (10 minutes)

1. Push this repo to GitHub, import in Vercel (framework preset: Next.js, root directory: `apps/web`)
2. Add environment variables (all server-only, never exposed to the browser):

| Variable | Required | What |
|---|---|---|
| `OPENROUTER_API_KEY` | for live verdicts | OpenRouter key — free models work |
| `TRIAGE_PROVIDER` | no (default `mock`) | `mock` · `openrouter` · `openai` · `activepieces` |
| `TRIAGE_MODEL` | no | e.g. `qwen/qwen3.8-27b:free` |
| `GITHUB_PAT` | for `/track` listing | fine-grained token, Issues: read |
| `AP_FLOW_WEBHOOK_URL` | for Cloud agent path | webhook URL of `mcp-maintainer-entry` flow |
| `AP_API_KEY` | for live `/runs` | Cloud API key, reads the runs table |
| `TRIAGE_API_URL` | no | point the web app at a separate Python backend; unset = local TS providers |

3. Deploy. With no keys set the app runs in **mock mode** (deterministic demo verdicts, clearly badged) — add keys to go live incrementally.

The Python backend deploys anywhere uvicorn runs (Railway/Fly/VPS): `cd apps/api && pip install -r requirements.txt && uvicorn app.main:app --port 8000`, then set `TRIAGE_API_URL` on Vercel.

## Local development (no keys needed)

```bash
python3 scripts/verify.py        # 86 structural gates
bash scripts/smoke.sh 3210       # boots both stacks, 17 runtime asserts
python3 scripts/eval_report.py   # eval distribution
cd apps/web && npm run dev       # console on :3000
cd apps/api && uvicorn app.main:app --port 8000
```

Spec-driven: every feature starts in `specs/` (`PLAN.md` → `specs/README.md`). Nothing is "done" until `verify.py` says so — see `specs/_system/verification.md`. Full demo script: `DEMO.md`.

## Layout

- `PLAN.md` — master plan + build order
- `specs/` — 001 agent → 009 tracker, each with spec + tasks + contracts; `status.yaml` tracks progress
- `scripts/` — `verify.py` (gates), `smoke.sh` (runtime proof), `eval_sweep.py` (live accuracy), `cloud/` (flow builder)
- `flows/` — exported Cloud flow definitions
- `tables/schema.sql` — Cloud table schemas
- `.env.example` — all keys, values never committed
