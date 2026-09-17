# DEMO — 5-minute keyless walkthrough

No API keys needed. Everything below runs on this machine.

## 0. Prove the repo (30s)

```bash
python3 scripts/verify.py            # fast gates
python3 scripts/eval_report.py       # 80 rows, 20 per repo
```

## 1. Boot the console (60s)

```bash
cd apps/web && npm install && npm run build && npm run start -- -p 3115
# open http://localhost:3115
```

## 2. File a strip (60s)

`/chat` → repo `activepieces/activepieces` → paste
`https://github.com/activepieces/activepieces/issues/15626` → Run.
Expect `bug / P1 / conf 0.90 / needs human`, draft reply, Approve button.
Switch to **raw JSON** tab → Copy JSON.

## 3. Break it on purpose (45s)

- Repo `nope/repo` → `unknown_repo` 400, no LLM call.
- Bad URL → `invalid_input` 400.
- `/repos/new` → type an id, watch the YAML preview, Copy.

## 4. Read the log (30s)

`/runs` → filter by severity `P1`, by repo. Mock banner explains the
`missing_config` fallback.

## 5. Show the specs (45s)

`specs/status.yaml` — what is `verified` vs blocked on keys.
`specs/001-maintainer-agent/evals/dataset.jsonl` — 15 rows verified
against the live GitHub API, rest marked `synthetic-edge`.

## 6. One-command proof (60s)

```bash
bash scripts/smoke.sh 3210   # web build + boot + 10 asserts, then FastAPI :8000 + 4 asserts
```

Split-stack manual run:

```bash
# terminal 1 — python backend
cd apps/api && uvicorn app.main:app --port 8000
# terminal 2 — web against it
cd apps/web && TRIAGE_API_URL=http://localhost:8000 npm run dev
```

Total: under 5 minutes. Live Cloud/Vercel wiring is tracked in
`specs/001`–`005` tasks and starts the day keys land.
