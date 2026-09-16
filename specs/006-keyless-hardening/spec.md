# 006 — Keyless hardening (proof without keys)

## 1. Title

Prove everything provable before any API key exists.

## 2. Problem

Half the repo is Cloud-blocked. Without a keyless gate, "done" is a feeling.
This spec collects every check that runs with zero secrets: runtime smoke,
contract sync, CI, and the demo script.

## 3. Non-goals

- No live Cloud/Vercel calls. Anything needing a key stays in its own spec.
- No new product features; this spec is scaffolding + proof.

## 4. Functional requirements

- FR-1: Given a fresh clone + `npm install`, `bash scripts/smoke.sh`
  builds, boots, and asserts all routes/APIs, exiting 0 on green.
- FR-2: `apps/web/lib/repos.ts` registry ids always equal
  `specs/002-multi-repo/contracts/repos.yaml` ids (`verify.py` fails on drift).
- FR-3: `.github/workflows/ci.yml` runs `verify.py` + `next build` +
  smoke on push/PR (YAML must parse; Actions run when pushed).
- FR-4: `DEMO.md` demos the whole product keyless in ≤5 minutes.
- FR-5: Root `README.md` states the keyless/blocked matrix so a
  reviewer knows exactly what runs without keys.

## 5. Contracts

- `scripts/smoke.sh` (executable), `scripts/verify.py` (registry-sync check),
  `.github/workflows/ci.yml`, `DEMO.md`.
