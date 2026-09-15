# 002 tasks — Multi-repo

- [ ] `contracts/repos.yaml` has 4 seed repos with `kb_id, labels, channel, tone`
- [ ] Tables `repos` + `issues_memory(repo, github_id)` created in Cloud (schemas in `tables/schema.sql`)
- [ ] KB source-doc links listed in `knowledge/SOURCES.md` (1 section per repo)
- [ ] Negative test: unknown repo rejected before agent call (1 proof run saved)
- [ ] Memory isolation test: VibeCode issue never returns Activepieces memory (1 proof run)
