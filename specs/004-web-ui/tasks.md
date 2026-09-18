# 004 tasks — Web UI

- [x] `apps/web` scaffolded (Next.js + Zod + Tailwind), `.env.example` lists
      all keys, no secrets committed (`next build` green 2026-09-19)
- [x] `/chat` validates + renders structured output; mock path proven at
      runtime (bug/P1 for #15626) and the `activepieces` provider is the
      default as soon as `AP_FLOW_WEBHOOK_URL` is set
- [x] Repo switch: the mock registry holds 4 repos; the live flow accepts all
      4 (repo allow-list enforced in the Code step + both backends)
- [x] `/runs` reads Tables `runs` (or mock fallback with `missing_config`
      banner when keys absent) — mock fallback proven at runtime
- [x] Rate limit + input validation live (proven at runtime: `unknown_repo`
      400, 10 req/min/IP then 429)
- [ ] Deployed to Vercel preview, URL pasted into `specs/status.yaml` notes
      — blocked: needs a Vercel account/token
