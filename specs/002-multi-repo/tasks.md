# 002 tasks — Multi-repo

- [x] `contracts/repos.yaml` has 4 seed repos with `kb_id, labels, channel, tone` (verify.py: row-shape ok)
- [x] Tables `repos` + `issues_memory` + `runs` + `digests` created in Cloud via API 2026-09-19 (ids: RMxkLTTUA4P9m2GZt9JfX, dx1TNRzbIQZMkOjOaZQk9, 9hXFonVZdQWfmPKiGdx4i, Qf05zQYb8eOR5iiULCfgy); column seeding via UI/first-flow in 003 (no public REST for fields)
- [x] KB source-doc links listed in `knowledge/SOURCES.md` (1 section per repo; upload itself needs Cloud)
- [ ] Negative test: unknown repo rejected before agent call (1 proof run saved) — web layer proven (`unknown_repo` 400 in mock); agent-level proof needs keys
- [ ] Memory isolation test: VibeCode issue never returns Activepieces memory (1 proof run) — needs keys
