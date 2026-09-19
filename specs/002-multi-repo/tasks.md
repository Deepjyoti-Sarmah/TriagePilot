# 002 tasks — Multi-repo

- [x] `contracts/repos.yaml` has 4 seed repos with `kb_id, labels, channel, tone` (verify.py: row-shape ok)
- [x] Tables `repos` + `issues_memory` + `runs` + `digests` created in Cloud via API
      2026-09-19. `runs` was rebuilt with full cost/audit fields on 2026-09-20 via
      `python3 scripts/cloud/build_flows.py --seed-tables`
      (id lXtUJFNQlOLJN8y9ITzzu, externalId Z7UuWHC2pfjUGqDRkh0yf).
- [x] KB source-doc links listed in `knowledge/SOURCES.md` (1 section per repo; upload itself needs Cloud UI)
- [x] Negative test: unknown repo rejected before any model/tool call — proof
      saved in `live-negative-001.json` (backend 400 + Cloud flow
      `unknown_repo`, latency_ms 0 so no model was reached)
- [x] Memory/audit logging: every triage run appends one row to the Cloud
      `runs` table (repo, issue, verdict, provider, model, mode, latency,
      tools_used) and `/runs` reads it live
- [ ] Memory isolation test: VibeCode issue never returns Activepieces memory
      (1 proof run) — blocked: needs the per-repo Knowledge Bases uploaded in
      the Cloud UI (the tool-using flow has no memory/KB tool yet)
