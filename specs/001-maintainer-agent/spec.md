# 001 — Maintainer Agent core

## 1. Title

Triage any GitHub issue with a ReAct agent (OpenRouter free model + per-repo KB).

## 0. Model decision (2026-09-19, verified)

- Provider: **OpenRouter** (first-class in Activepieces since 0.74.0:
  Platform Admin → AI Center → OpenRouter, usable in Agents).
- Model: **`qwen/qwen3.8-27b:free`** — verified on the OpenRouter models API:
  $0 in/out, 262K context, plenty for 12 tool steps + KB chunks.
- Why free-first: evals + demo run at $0; paid fallback only if the
  accuracy gate fails.
- Known limits: free-tier rate caps (~tens of req/min, daily quotas) → run
  the 80-row eval sweep in small batches; tool-calling is weaker than
  `gpt-4o`, so the **type-accuracy > 0.8 gate stays** and every run logs
  `provider/model` — a miss is a finding, not a surprise.
- Fallback: `gpt-4o` via OpenAI provider if the gate fails twice.
  KB embeddings need an embedding-compatible provider (OpenAI/Google/
  Azure/OpenRouter); confirm OpenRouter embeddings or keep one OpenAI
  key just for embeddings at D2.

## 2. Problem

Maintainers of `activepieces/activepieces` (428 issues) and your own repos repeat the same sorting: bug vs feature vs docs vs spam vs duplicate, severity, labels, first reply. Deterministic flows break on varied wording.

## 3. Non-goals

- No auto-posting to GitHub without approval.
- No private-repo OAuth in this spec (PAT only; OAuth is 006-future).
- No fine-tuning; prompt + tools + KB only.

## 4. Functional requirements

- FR-1: Given `{repo, issue_title, issue_body}`, agent returns valid `output.schema.json` within 60s p95.
- FR-2: Agent may call GitHub search, KB search, Tables `issues_memory`, sub-flows, webSearch in any order, up to `maxSteps: 12`.
- FR-3: If `confidence < 0.7` OR `severity == P0` OR `issue_type == spam`, then `needs_human == true`.
- FR-4: `dedupe-check` runs before labeling; `duplicate_of` set when similarity ≥ 0.85.
- FR-5: Draft reply uses repo tone from `repos.yaml`, no invented links, no secrets.

## 5. Contracts

- `contracts/output.schema.json` — strict output shape.
- `agent.prompt.md` — system brief (versioned here, pasted into Cloud).
- `tools.matrix.md` — which tools + predefined-input policy.
- `evals/dataset.jsonl` — ≥20 labeled issues per seed repo.

## 6. Open questions

- [ ] P0 definition for Activepieces? (e.g. auth breakage + >5 reports in 24h)
- [ ] Maintainer tone: concise + link to docs required?
- [ ] Label allow-list locked? (suggest yes for v1)
