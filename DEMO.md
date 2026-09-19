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

## 2. One-click live demos (90s)

Landing page → **Live demos** → Run on any card (real open issues from
Activepieces, Next.js, Bun, TypeScript). Each deep-links into `/chat`
prefilled — hit Run, get the verdict + raw JSON tab.

Or file manually: `/chat` → any `owner/name` → paste any issue URL → Run.
No registry, no config: any public repo works on open paths.

## 3. Break it on purpose (45s)

- Garbage repo (`nope/repo`) → still triages on open paths (mock heuristics on the URL); the Cloud-agent provider alone rejects non-onboarded repos.
- Bad URL → `invalid_input` 400.
- `/repos/new` → type an id, watch the YAML preview, Copy.
- `/track` → paste any repo → issue list → per-row Triage → titles open on GitHub.

## 4. Read the log (30s)

`/runs` → filter by severity `P1`, by repo. Mock banner explains the
`missing_config` fallback.

## 5. Show the specs (45s)

`specs/status.yaml` — what is `verified` vs blocked on keys.
`specs/001-maintainer-agent/evals/dataset.jsonl` — 15 rows verified
against the live GitHub API, rest marked `synthetic-edge`.

## 6. One-command proof (60s)

```bash
bash scripts/smoke.sh 3210   # web + FastAPI, 17 asserts, exit 0
```

Split-stack manual run:

```bash
# terminal 1 — python backend
cd apps/api && uvicorn app.main:app --port 8000
# terminal 2 — web against it
cd apps/web && TRIAGE_API_URL=http://localhost:8000 npm run dev
```

Total: under 5 minutes.

## 7. Optional: show the live Cloud flow (keys in `apps/api/.env`)

```bash
python3 scripts/cloud/build_flows.py --all      # publish + export + print URLs
curl -s -X POST "$(cat flows/mcp-maintainer-entry.url)" \
  -H 'Content-Type: application/json' \
  -d '{"repo":"activepieces/activepieces","issue_url":"https://github.com/activepieces/activepieces/issues/15626"}'
# → {"output":{"issue_type":"bug","severity":"P1","confidence":0.95,...},
#    "meta":{"tools_used":["github.get_issue","openrouter.chat"],...}}
```

The `activepieces` backend provider is selected automatically when
`AP_FLOW_WEBHOOK_URL` is set; `TRIAGE_PROVIDER=mock` forces the keyless demo.
Remaining Cloud-UI-only work (Agent entity, MCP trigger, KB upload, Vercel)
is tracked in `specs/001`–`005` tasks.
