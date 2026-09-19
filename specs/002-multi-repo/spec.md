# 002 — Multi-repo support

## 1. Title

Run one agent template across N repos with isolated memory + docs.

## 2. Problem

One-repo demo doesn't prove marketplace value. Each repo has different docs, labels, tone, channels. Cross-repo memory leakage would be a correctness + trust bug.

## 3. Non-goals

- No auto-discovery of new repos (manual `repos.yaml` + `/repos/new` form only).
- No per-repo fine-tune.

## 4. Functional requirements

- FR-1: `repos.yaml` scopes the **Cloud agent only** (memory/KB exist per
  seed repo). Open paths (mock/direct) accept any public repo — a new user
  pastes a link and it works, no onboarding. The `activepieces` provider
  rejects non-onboarded repos itself with `unknown_repo` (no agent call).
- FR-2: Agent loads `kb_{repo}`, `tone`, `labels allow-list`, `channel` from `repos.yaml` only.
- FR-3: `issues_memory` queries always filter `repo == input.repo`.
- FR-4: Adding a repo = 1 YAML row + 1 KB upload + 20 eval rows, no code change.

## 5. Contracts

- `contracts/repos.yaml` — registry, source of truth.

## 6. Open questions

- [ ] Who approves per repo? (same Slack channel or per-repo?)
