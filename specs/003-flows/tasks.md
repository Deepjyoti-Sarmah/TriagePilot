# 003 tasks — Flows

- [ ] `webhook-github-intake` built in Cloud, test with 1 real issue, export to `flows/webhook-github-intake.json`
- [ ] `daily-digest` built, manual run posts to test channel, export to `flows/daily-digest.json`
- [ ] `mcp-maintainer-entry` built with MCP Trigger + `returnsResponse:true`, called once from curl/Vercel, export to `flows/mcp-maintainer-entry.json`
- [ ] Approval step present before any GitHub/Slack write (screenshot or export proves it)
- [ ] Duplicate webhook test: same `repo:issue_id` twice → single post (proof run id saved)
