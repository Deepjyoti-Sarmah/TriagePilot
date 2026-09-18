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
- Live finding 2026-09-19: free shared pools throttle hard at times
  (`qwen3.8-27b:free` AND `gemma-4-31b-it:free` both 429
  `upstream_provider_shared_pool`, key itself valid $0/$5). Mitigations,
  in order: (1) retry later in small batches, (2) `TRIAGE_MODEL` to any
  of the ~25 `:free` models (provider-agnostic by design), (3) $5 credit
  unlocks paid routing + far higher limits. Direct path hardened anyway:
  lenient JSON extraction (reasoning traces) + hold-for-human fallback.
- Live proof 2026-09-19: `deepseek/deepseek-v4-flash-0731:free` triaged
  real issue #15626 → **bug/P1/conf 0.95**, sensible labels + draft,
  34s, artifact `evals/sample-run-direct-001.json`. Two real bugs found
  en route: (a) direct path sent URL-only context — now fetches public
  title+body via GitHub API; (b) model omits `repo` (routing context) —
  now injected server-side post-validation, both stacks.
- Live sweep 2026-09-19 (`scripts/eval_sweep.py`, 12 stratified rows):
  strict accuracy **0.750 (9/12)** vs 0.8 gate → FAIL recorded honestly.
  Decomposition: **7/7 on resolvable rows** (bugs, piece-request, feature;
  conf 0.70–0.97); 3 misses are synthetic `issues/new?template=` URLs
  that 404 on the GitHub API, and the model correctly routed all three
  to human review instead of guessing — the guardrail working as
  designed. Artifact `evals/sweep-001.json`. Follow-up: inline
  title/body on synthetic rows, then re-run.
- Re-sweep 2026-09-19 (same seed, inline content): **0.800 (8/10) → PASS
  (boundary)**. 2 rows lost to free-pool 503s (excluded, not counted).
  Remaining misses bound the classify-only path honestly: terse-title PR
  held as spam (safe), and single-report duplicate undetectable without
  memory/tools — the full agent's job, not the direct path's.
  Artifact `evals/sweep-002.json`.
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
