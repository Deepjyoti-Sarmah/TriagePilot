# 008 — Separate Python backend (FastAPI)

## 1. Title

Move the triage backend out of Next.js into a standalone Python service.

## 2. Problem

`007` isolated providers behind an interface, but they still run inside
the Next.js server. A separate backend gives: independent deploy/scale,
Python-native eval/ML libs later (torch, sentence-transformers for local
embeddings), and a cleaner hiring story (polyglot service boundary).

## 3. Non-goals

- No behavior change. Same contract, same mock outputs, same gates.
- No DB in v1 (memory + Tables-in-Cloud later). No auth in v1 (localhost
  trust + rate limit, same as the Next route today).

## 4. Functional requirements

- FR-1: `apps/api` FastAPI service: `GET /health`, `POST /api/run-agent`
  with request/response shapes byte-compatible with the Next route
  (`output` validated against `output.schema.json`, plus `meta`).
- FR-2: Provider registry mirrored in Python: `mock | activepieces |
  openrouter | openai`, selected by `TRIAGE_PROVIDER` (same name, same
  defaults: mock w/o keys, activepieces w/ `AP_*`).
- FR-3: Contract parity is machine-checked: `verify.py` asserts the
  Python response models carry every `required` field of
  `output.schema.json` and every provider module exposes `triage()`.
- FR-4: Next.js route becomes a thin proxy: if `TRIAGE_API_URL` is set,
  forward `{repo, issue_url}` and return the backend response verbatim;
  else serve the local TS mock (Vercel solo-deploy keeps working).
- FR-5: Rate limit 10 req/min/IP preserved in Python (in-memory v1).
- FR-6: `smoke.sh` boots both services and asserts the same 10 checks
  against each (web 3210, api 8000).

## 5. Contracts

- `apps/api/app/{main,contracts,providers/*}.py`, `apps/api/requirements.txt`.
- `verify.py`: `providers-py` + `contract-parity` checks.
