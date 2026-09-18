# 003 tasks — Flows

## Live now (programmatic, 2026-09-19)

- [x] `mcp-maintainer-entry` built + ENABLED in Cloud via public API
      (`scripts/cloud/build_flows.py`): Catch Webhook trigger (auth none,
      `/sync` returns response) -> Code step (GitHub issue fetch + dedupe
      search + OpenRouter classify) -> Return Response. Live call returns
      structured agent JSON (bug/P1/conf 0.95, #15626). Export:
      `flows/mcp-maintainer-entry.json`.
- [x] `webhook-github-intake` built + ENABLED; the Code step normalizes
      GitHub `issues` events; tested live with a real issue payload
      (#15616) -> bug/P1. Export: `flows/webhook-github-intake.json`.
- [x] No auto-post: flows only return triage JSON. The approval gate
      (human before any GitHub/Slack write) is therefore structural — there
      is no write step to gate.
- [x] Secrets stay in Cloud project Variables (`{{variables.*}}`); the
      committed exports contain references, never values.
- [x] `daily-digest` built + ENABLED with an `every_day` schedule trigger
      (09:00 Asia/Kolkata) and a Code step that pulls recent open issues per
      repo and asks the model for a 3-6 bullet digest. Export:
      `flows/daily-digest.json`.
- [ ] `daily-digest` posts to the test channel — blocked: needs a
      Slack/Discord webhook secret + UI connection.
- [ ] `mcp-maintainer-entry` MCP Trigger added — blocked: MCP-server routes
      return 403 for API keys (UI/OAuth only, verified). The webhook trigger
      is the backend's programmatic path (`AP_FLOW_WEBHOOK_URL`).
- [ ] Duplicate webhook test: same `repo:issue_id` twice -> single post —
      N/A until a write step exists; the triage flow is idempotent by
      construction (read-only).

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
