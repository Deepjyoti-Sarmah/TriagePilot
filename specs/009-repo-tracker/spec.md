# 009 — Repo tracker (/track)

## 1. Title

Paste a repo URL, see every open issue categorized, click through to GitHub.

## 2. Problem

`/chat` triages one pasted issue at a time. Maintainers think in backlogs:
what's open, what's urgent, what deserves the next click. No view shows that.

## 3. Non-goals

- No write actions (no labeling/closing from the UI). Read + classify only.
- No pagination past 30 issues in v1 (GitHub list caps `per_page=30`).
- No background sync; the list is fetched on demand (fresh > cached here).

## 4. Functional requirements

- FR-1: `GET /api/repo-issues?repo=owner/name` (Python) lists open
  issues: number, title, state, labels, updated_at, html_url. Needs
  `GITHUB_PAT`; without it → 501 `not_wired` (same fail-closed pattern).
- FR-2: Next.js `app/api/repo-issues/route.ts` proxies when
  `TRIAGE_API_URL` set, else calls GitHub directly server-side with the
  same PAT rule (Vercel solo-deploy keeps working).
- FR-3: `/track` page: repo input → table (number, title link-out to
  GitHub in new tab, labels, updated) → per-row **Triage** button runs
  `/api/run-agent` with inline title/body and renders the category pill
  + severity inline. **Categorize-all** classifies visible rows
  sequentially with progress; stops cleanly on 429.
- FR-4: Issue titles link to `html_url` (new tab). Nothing ever POSTs to
  GitHub from this view.
- FR-5: `smoke.sh` asserts `/track` 200 + repo-issues 501-without-PAT
  shape (CI-safe: no secrets needed).

## 5. Contracts

- `apps/api/app/main.py` (+`GET /api/repo-issues`), `apps/web/app/api/repo-issues/route.ts`,
  `apps/web/app/track/page.tsx` (+ small components if >200 lines).
