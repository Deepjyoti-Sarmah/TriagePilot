# 007 — Provider-agnostic triage backend

## 1. Title

Swap LLM providers by env var, never by rewrite.

## 2. Problem

`001` picked OpenRouter free-first with a `gpt-4o` fallback, but the code
had one hard path (mock → future Cloud). A provider change meant code
change. The backend must treat providers as plugins.

## 3. Non-goals

- No new UX. Same API shape, plus a `meta` block.
- No prompt-tuning per provider in v1 (one classify prompt, validated output).

## 4. Functional requirements

- FR-1: `POST /api/run-agent` resolves its provider from `TRIAGE_PROVIDER`
  (`mock | activepieces | openrouter | openai`, default: `mock` when no
  keys, `activepieces` when `AP_*` present and unset).
- FR-2: Every provider implements `triage({repo, issue_url}) →
  {output: TriageOutput, meta: {provider, model, mode, latency_ms}}`.
- FR-3: Every response carries `meta.provider/model/mode`; `runs` log and
  `Tables.runs` store them (see `tables/schema.sql`).
- FR-4: `activepieces` = full ReAct agent (tools, KB, approvals) via the
  MCP-entry flow **webhook URL** (`AP_FLOW_WEBHOOK_URL`). Verified
  2026-09-19: the MCP server is OAuth-only (API key → 401), so the
  webhook trigger is the programmatic path. `openrouter`/`openai` =
  **classify-only** direct calls (no tools): same JSON contract,
  `needs_human: true` forced when confidence < 0.8 or output fails
  schema validation.
- FR-5: Classify prompt is versioned at
  `specs/007-provider-backend/contracts/direct.prompt.md`; the code loads
  it at request time with an inline fallback (single source = spec file).
- FR-6: Unknown `TRIAGE_PROVIDER` value → 400 `unknown_provider`
  (fail loud, never silent-fallback to mock when keys exist).

## 5. Contracts

- `apps/web/lib/providers/*.ts` — `types, mock, activepieces, direct, index`.
- `specs/007-provider-backend/contracts/direct.prompt.md`.
- `.env.example` documents `TRIAGE_PROVIDER / TRIAGE_MODEL / OPENROUTER_API_KEY`.
