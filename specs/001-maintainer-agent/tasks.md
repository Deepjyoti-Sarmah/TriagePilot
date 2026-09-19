# 001 tasks — Maintainer Agent core

> Tick `- [x]` only after a live check. Verifier counts boxes + checks files.
> 2026-09-19: the public Agents API returns 402 FEATURE_DISABLED, so the
> tool-using "agent" is implemented as a Cloud flow Code step
> (`scripts/cloud/mcp_entry_code.js`), called by the `activepieces` provider.

## Prompt + contracts

- [x] `agent.prompt.md` drafted (v1) and mirrored into the flow Code step
- [x] `contracts/output.schema.json` validates 3 sample outputs (run `verify.py`)
- [x] `tools.matrix.md` reviewed: no tool has write access without approval note
- [x] Flow returns the strict contract; server-side validation clamps enums,
      injects `repo`, forces `needs_human` below the gate and on P0/spam

## Live agent path (flow-backed)

- [x] Tool-using triage live: #15626 → **bug/P1/conf 0.90** with the current
      default model, tools `[github.get_issue, openrouter.chat:<model>]` —
      artifacts `evals/sample-run-001.json` + `evals/sweep-003.json`
- [x] Second live run through the same flow for a second repo/issue class
- [x] Low-confidence guardrail: unresolvable issue URL → conf 0.4,
      `needs_human: true` — artifact
      `../005-evals-guardrails/live-lowconf-001.json`
- [x] Per-run model fallback chain in the flow (free pools rotate; a model can
      flip to paid overnight)
- [x] Every run appends a cost/audit row to the Cloud `runs` table
      (provider/model/mode/latency/tools_used)
- [x] MCP Tool trigger published as sibling flow `mcp-tool-triage`
      (`triage_github_issue`) — scriptable via the public API
- [ ] Cloud Agent ENTITY created in the UI (provider OpenRouter, model
      `nvidia/nemotron-3-super-120b-a12b:free`, `maxSteps: 12`, webSearch on) —
      blocked: `/v1/agents` → 402 FEATURE_DISABLED via API key

## Evals seed

- [x] `evals/dataset.jsonl` has ≥5 starter rows (full 20/repo in spec 005) — 80 rows
- [x] Each row has keys: `repo, issue_url, expected_type, expected_severity, is_duplicate`
