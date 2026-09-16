# 004 — Web UI (Vercel)

## 1. Title

Demo the Agent as a mini Gravity marketplace.

## 2. Problem

Hiring demo needs a URL, not just Cloud screenshots. Reviewer pastes issue link, picks repo, sees verdict.

## 3. Non-goals

- No auth v1 (public demo, rate-limited). Auth is 006-future.
- No direct LLM calls from browser; all via Activepieces.

## 4. Functional requirements

- FR-1: `/chat`: repo dropdown (from `repos.yaml`) + issue URL input → `POST /api/run-agent` → shows type/severity/confidence/labels/draft + approve button.
- FR-2: `/runs`: reads Tables `runs`, shows latency, confidence, approval state, simulated earnings (`runs × 0.2127`).
- FR-3: `/repos/new`: form that appends a `repos.yaml`-compatible draft (no auto-provision in v1).
- FR-4: All Activepieces/LLM keys server-only; client gets `missing_config` error shape when absent.
- FR-5: Rate limit 10 req/min/IP, Zod-validate `repo` + `issue_url`.

## 5. Contracts

- App lives in `apps/web` (scaffolded in D5). API shape: `POST /api/run-agent {repo, issue_url} → {run_id, output}`.
