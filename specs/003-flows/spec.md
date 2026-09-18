# 003 — Flows wrapping the Agent

## 1. Title

Trigger the Agent from webhook, schedule, and MCP with approval gates.

## 2. Problem

Agent alone can't receive GitHub events, run daily, or be called as a Gravity-style tool. Flows are the thin glue.

## 3. Non-goals

- No business logic in flows (all reasoning in Agent). Flows only route + gate + log.

## 4. Functional requirements

- FR-1: `webhook-github-intake`: `issues.opened|edited` → validate repo in registry → Agent step → write `runs` → branch approval.
- FR-2: `daily-digest`: schedule 09:00 IST → Agent summarizes top-10 urgent from `runs` → Slack post → write `digests`.
- FR-3: `mcp-maintainer-entry`: MCP Trigger, `returnsResponse:true` → Agent step → return structured JSON (called by Vercel + Cursor/Claude).
  ALSO expose a Webhook trigger on the same flow and paste its URL into
  `AP_FLOW_WEBHOOK_URL` — the backend's programmatic path (MCP is
  OAuth-only, verified 2026-09-19).
- FR-4: Idempotency key = `{repo}:{github_issue_id}`; duplicate webhook does not double-post.
- FR-5: Exports committed to `flows/*.json` after each Cloud change.

## 5. Contracts

- `flows/webhook-github-intake.json`, `flows/daily-digest.json`, `flows/mcp-maintainer-entry.json` (Cloud exports).

## Verified building blocks (2026-09-19, live API)

- Tables `repos/issues_memory/runs/digests` created in Cloud (see 002 tasks for ids).
- Dedupe recall proven with `GITHUB_PAT`: search
  `repo:activepieces/activepieces is:issue IMPORT_FLOW piece-upgrade`
  returns #15623 top-1 — the exact query shape the dedupe-check flow
  will use (distinctive body terms → candidate set).
- Note: search API requires `is:issue`/`is:pr` qualifier (422 otherwise).
