# tools.matrix.md

| Tool | Type | Predefined inputs | Agent decides | Notes / guardrail |
|------|------|-------------------|---------------|-------------------|
| github-get-issue | PIECE | repo = {{repo}} (locked) | issue_number | read-only |
| github-search-issues | PIECE | repo = {{repo}} (locked) | query, labels | used for dedupe, max 3 calls |
| github-add-labels | PIECE | repo = {{repo}} (locked) | labels[] from allow-list only | REQUIRES approval step after agent |
| kb_{{repo}} | KNOWLEDGE_BASE | — | query | per-repo docs, cosine 768-dim |
| issues_memory lookup | Tables with-agents | repo filter locked | fingerprint query | memory, never cross-repo |
| draft-reply-flow | FLOW | repo, tone locked | issue context | child run, returns draft |
| dedupe-check-flow | FLOW | repo locked | candidates | returns duplicate_of + score |
| slack-post / discord-send | PIECE | channel locked per repo | message body | REQUIRES approval step |
| webSearch | built-in | — | query | external API refs only |

Policies: `AGENT_DECIDE` for content fields, `CHOOSE_YOURSELF` never for repo/channel (locked), `LEAVE_EMPTY` for resolved IDs the agent must fill.
