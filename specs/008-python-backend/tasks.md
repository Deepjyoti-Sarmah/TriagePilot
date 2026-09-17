# 008 tasks — Python backend split

- [x] FastAPI app boots keyless: `/health` 200, mock triage matches TS mock verdicts on 3 probe URLs (smoke: bug/P1 on #15626)
- [x] Registry parity: same 4 provider names, same env selection + defaults as `lib/providers/index.ts`
- [x] Contract parity: `verify.py` asserts Python models cover all `output.schema.json` required fields (8/8)
- [x] Next route proxies when `TRIAGE_API_URL` set, local mock otherwise (both paths smoke-tested)
- [x] Rate limit + `unknown_repo`/`invalid_input`/`unknown_provider` behaviors identical on both services (429/400s asserted; fixed `base.py` bad relative import found by smoke)
- [x] `smoke.sh` asserts both stacks (14/14 green); `requirements.txt` pinned; README/DEMO updated
