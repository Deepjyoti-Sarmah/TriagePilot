# 006 tasks — Keyless hardening

- [x] `scripts/smoke.sh` passes locally: build + 4 routes 200 + mock shape + `unknown_repo` 400 + `invalid_input` 400 + rate-limit 429 (10/10 green 2026-09-19)
- [x] Registry-sync check in `verify.py` passes (`repos.ts` ids == `repos.yaml` ids)
- [x] `.github/workflows/ci.yml` created and parses as valid YAML (Actions run on push)
- [x] `DEMO.md` written: 5-minute keyless demo path, every step runnable now
- [x] Root `README.md` documents the keyless/blocked matrix
