# 004 tasks — Web UI

- [x] `apps/web` scaffolded (Next.js + Zod + Tailwind), `.env.example` lists
      all keys, no secrets committed (`next build` green 2026-09-19)
- [x] `/chat` validates + renders structured output; mock path proven at
      runtime (bug/P1 for #15626) and the `activepieces` provider is the
      default as soon as `AP_FLOW_WEBHOOK_URL` is set
- [x] Open-repo UX 2026-09-20: repo field is free-text with seed suggestions
      (no allow-list); `/chat` accepts `?repo=` + `?issue=owner/name#num`
      deep-links; registry gates the Cloud-agent provider only
- [x] Landing shows 5 verified live demos (real open issues: AP×2, Next.js,
      Bun, TypeScript) with one-click Run + GitHub link-outs
- [x] README rewritten user-first (30s demo, env table, Vercel steps);
      DEMO.md matches current behavior
- [x] `/runs` reads Tables `runs` (or mock fallback with `missing_config`
      banner when keys absent) — mock fallback proven at runtime
- [x] Rate limit + input validation live (proven at runtime: `invalid_input`
      400, 10 req/min/IP then 429)
- [ ] Deployed to Vercel preview, URL pasted into `specs/status.yaml` notes
      — blocked: needs a Vercel account/token
