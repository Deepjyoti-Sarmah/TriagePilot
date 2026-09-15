# 001 — Maintainer Agent core

## 1. Title

Triage any GitHub issue with a ReAct agent (gpt-4o + per-repo KB).

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
