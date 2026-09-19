# 003 tasks — Flows

## Live now (programmatic, 2026-09-20)

- [x] `mcp-maintainer-entry` built + ENABLED in Cloud via public API
      (`scripts/cloud/build_flows.py`): Catch Webhook trigger (auth none,
      `/sync` returns response) -> Code step (GitHub issue fetch + dedupe
      search + OpenRouter classify with a free-model fallback chain) ->
      Return Response (respond-and-continue) -> Tables "Log run". Live call
      returns structured agent JSON (bug/P1/conf 0.90, #15626). Export:
      `flows/mcp-maintainer-entry.json`.
- [x] `webhook-github-intake` built + ENABLED; the Code step normalizes
      GitHub `issues` events; tested live with a real issue payload
      (#15616) -> bug/P1. Export: `flows/webhook-github-intake.json`.
- [x] No auto-post: flows only return triage JSON. The approval gate
      (human before any GitHub/Slack write) is therefore structural — there
      is no write step to gate.
- [x] Secrets stay in Cloud project Variables (`{{variables.*}}`); the
      committed exports contain references, never values.
- [x] Every triage run appends one cost/audit row to the Cloud `runs` table
      via a `@activepieces/piece-tables` "Create Record(s)" step
      (`continueOnFailure: true`, after the response so it never delays the
      caller). Fields: repo, issue, verdict, provider, model, mode, latency,
      tools_used. The `/runs` page reads this table live.
- [x] `daily-digest` built + ENABLED with an `every_day` schedule trigger
      (09:00 Asia/Kolkata) and a Code step that pulls recent open issues per
      repo and asks the model for a 3-6 bullet digest. Export:
      `flows/daily-digest.json`.
- [ ] `daily-digest` posts to the test channel — blocked: needs a
      Slack/Discord webhook secret + UI connection.
- [x] MCP Tool trigger added as a sibling flow `mcp-tool-triage` (piece
      `@activepieces/piece-mcp` trigger `mcp_tool`, toolName
      `triage_github_issue`, `Wait for Response` on, reply via
      `Reply to MCP Client`). Activepieces allows one trigger per flow, so
      the webhook flow and the MCP flow are separate. Built/published via the
      same public API; connecting a client is the only remaining UI step.
      Export: `flows/mcp-tool-triage.json`.
      Note: the MCP *server config* routes (`/v1/mcp-server`) still return
      403 for API keys — that part is UI/OAuth only.
- [ ] Duplicate webhook test: same `repo:issue_id` twice -> single external
      post — the flow makes no GitHub/Slack write, so there is nothing to
      double-post; it does append one audit row per call to `runs` (expected
      for a log). Full idempotency would need a find-record + branch step.

## Verified building blocks (2026-09-19, live API)

- Tables `repos/issues_memory/runs/digests` created in Cloud (see 002 tasks for ids).
- Dedupe recall proven with `GITHUB_PAT`: search
  `repo:activepieces/activepieces is:issue IMPORT_FLOW piece-upgrade`
  returns #15623 top-1 — the exact query shape the dedupe-check flow
  will use (distinctive body terms -> candidate set).
- Note: search API requires `is:issue`/`is:pr` qualifier (422 otherwise).
- Public API capabilities mapped: flows/tables/variables/app-connections
  are scriptable; `/v1/agents` -> 402 FEATURE_DISABLED; MCP-server routes
  -> 403. See `specs/003-flows/live-verification.json`.
