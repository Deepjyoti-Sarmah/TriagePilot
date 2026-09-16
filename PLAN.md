# PLAN — Multi-Repo Maintainer Agent (Activepieces AI Agent)

> Flagship: `activepieces/activepieces` triage. Agent-first, not flow-first.
> Stack: Activepieces Cloud (Agent + Flows + Tables + KB + MCP) + Vercel Next.js + OpenRouter `qwen/qwen3.8-27b:free` ($0).
> Method: spec-driven. Every build step maps to a file in `specs/`. Nothing is "done" until `scripts/verify.py` says so.

## 1. What we are building (simple)

An AI junior maintainer. Input: `repo + GitHub issue URL`. Output: `{type, severity, labels, duplicate_of, draft_reply, needs_human}` in ~20s, with human approval before any post.

Seed repos (proves multi-repo):
1. `activepieces/activepieces` (flagship — job showcase)
2. `Deepjyoti-Sarmah/VibeCode`
3. `Deepjyoti-Sarmah/Invoice-Cart`
4. `Deepjyoti-Sarmah/symbolgraph`

Mini-marketplace wrapper (Gravity-like): Vercel `/chat` → routes to the one Agent via MCP-trigger flow → logs run + simulated `21.27%` earnings to Tables.

## 2. Why agent, not flow

Flow draws steps once. Agent figures out steps each run (ReAct loop, `maxSteps: 12`):

* Flow only does: `trigger → Agent step (@activepieces/piece-agent) → approval branch → post`.
* Agent decides tools per run: GitHub pieces, Knowledge Base (per-repo docs), Tables `issues_memory`, sub-flows (`draft-reply`, `dedupe-check`), `webSearch`.

## 3. Architecture

```
Vercel /chat {repo, issue_url} → POST /api/run-agent
  → Cloud flow `mcp-maintainer-entry` [MCP Trigger, returnsResponse:true]
    → Agent Step [openrouter/qwen3.8-27b:free, maxSteps 12, structuredOutput]
    → Branch needs_human? → Approval → Slack/Discord post
  → Tables: repos, issues_memory, runs, digests
MCP Server ON (Discovery + Tables read-only first)
```

## 4. Spec map (where everything lives)

| Spec | Folder | Question it answers |
|------|--------|---------------------|
| 001 agent core | `specs/001-maintainer-agent/` | prompt, tools, output schema, evals |
| 002 multi-repo | `specs/002-multi-repo/` | repos.yaml, KB per repo, memory isolation |
| 003 flows | `specs/003-flows/` | 3 flows wrapping the Agent |
| 004 web UI | `specs/004-web-ui/` | /chat /runs /repos/new |
| 005 evals + guardrails | `specs/005-evals-guardrails/` | precision >0.8, conf gate, idempotency |
| 006 keyless hardening | `specs/006-keyless-hardening/` | smoke, sync gates, CI, demo without keys |
| 007 provider backend | `specs/007-provider-backend/` | env-selected providers, meta on every run |
| system | `specs/_system/` | how to write a spec + Definition of Done |

Each spec folder has: `spec.md` (what/why) + `tasks.md` (checkboxes) + `contracts/` or `evals/` as needed.
Progress: `specs/status.yaml`. Verification: `specs/_system/verification.md` + `scripts/verify.py`.

## 5. Build order (1 week, Cloud + Vercel)

- [ ] D1 — Specs + Cloud project + Tables schemas + MCP ON (`001`, `002`)
- [ ] D2 — Knowledge Bases per repo (`002`)
- [ ] D3 — Agent create + tools matrix + test 10 issues (`001`)
- [ ] D4 — 3 flows, export JSON to `flows/` (`003`)
- [ ] D5 — Next.js `/chat /runs /repos/new`, deploy Vercel (`004`)
- [ ] D6 — Eval harness 20/repo, guardrails (`005`)
- [ ] D7 — README + DEMO + Loom (triage live + repo switch)

## 6. Secrets (you provide later — nothing hard-coded)

Needed in Cloud dashboard + Vercel env (server-only), never in client:
`AP_API_KEY`, `OPENROUTER_API_KEY` (free tier OK), `GITHUB_PAT (repo scope)`, `SLACK_WEBHOOK_URL`, `DISCORD_WEBHOOK_URL`, `AP_PROJECT_ID`, `AP_MCP_URL`.

Placeholders live in `.env.example` (to be created in D1/D5). App refuses to run without them, with a clear error.

## 7. How "done" is decided

1. Implement tasks in `specs/XXX/tasks.md`.
2. Run `python3 scripts/verify.py` (checks files exist, JSON/YAML valid, schema matches, eval coverage).
3. Update `specs/status.yaml`: `pending → in_progress → done → verified`.
4. Only `verified` counts as done. See `specs/_system/verification.md`.

## 8. Next actions

1. Fill `specs/001-maintainer-agent/spec.md` open questions (tone, P0 definition).
2. Add your 4 repos' docs links to `specs/002-multi-repo/spec.md`.
3. Provide secrets when ready → D1 Cloud setup.
