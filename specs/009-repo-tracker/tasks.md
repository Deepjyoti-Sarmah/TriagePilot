# 009 tasks — Repo tracker

- [x] Python `GET /api/repo-issues` lists repo issues (PAT-gated 501); contract shape asserted in smoke (live-shape green)
- [x] Next proxy route mirrors it (TRIAGE_API_URL or direct GitHub call)
- [x] `/track` page: repo input, issue table, GitHub link-outs, per-row triage, categorize-all with progress (split: page + track-table, ≤200 lines each)
- [x] `smoke.sh` covers `/track` 200 + repo-issues behavior (17/17 green); verify green; commit
