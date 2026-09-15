# 004 tasks — Web UI

- [x] `apps/web` scaffolded (Next.js + Zod + Tailwind), `.env.example` lists all keys, no secrets committed (`next build` green 2026-09-19)
- [ ] `/chat` calls MCP-entry flow with 1 Activepieces issue, renders structured output (needs keys; mock path proven at runtime: bug/P1 for #15626)
- [ ] Repo switch test: same UI triages 1 VibeCode issue (needs keys for live; mock registry holds 4 repos)
- [x] `/runs` reads Tables `runs` (or mock fallback with `missing_config` banner when keys absent) — mock fallback proven at runtime (HTTP 200 + banner)
- [x] Rate limit + input validation live (proven at runtime: `unknown_repo` 400, 10 req/min/IP then 429)
- [ ] Deployed to Vercel preview, URL pasted into `specs/status.yaml` notes
