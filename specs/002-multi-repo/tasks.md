# 002 tasks — Multi-repo

- [x] `contracts/repos.yaml` has 4 seed repos with `kb_id, labels, channel, tone` (verify.py: row-shape ok)
- [ ] Tables `repos` + `issues_memory(repo, github_id)` created in Cloud (schemas in `tables/schema.sql`) — needs keys
- [x] KB source-doc links listed in `knowledge/SOURCES.md` (1 section per repo; upload itself needs Cloud)
- [ ] Negative test: unknown repo rejected before agent call (1 proof run saved) — web layer proven (`unknown_repo` 400 in mock); agent-level proof needs keys
- [ ] Memory isolation test: VibeCode issue never returns Activepieces memory (1 proof run) — needs keys
