# _system — verification

## Definition of Done (every spec)

A spec is `verified` iff ALL hold:

1. **Files exist** — every path listed in `specs/status.yaml` → `files:` exists.
2. **Contracts valid** — `*.json` parses + matches its schema; `*.yaml` parses.
3. **Tasks complete** — every `- [ ]` in that spec's `tasks.md` is `- [x]` (checked by script, with manual review for quality).
4. **Eval coverage** (for 001/005) — `evals/dataset.jsonl` has ≥20 lines per seed repo, each with required keys.
5. **No secrets** — no `sk-`, `ghp_`, `xox`, `AP_API` literals in `specs/`, `flows/`, `apps/` (script greps).
6. **Manual gate** — human ran the live check in `tasks.md` (e.g. triaged 1 real issue) and ticked it.

## Verify levels

`python3 scripts/verify.py [--spec 001-maintainer-agent] [--strict]`

| Level | What it does |
|-------|--------------|
| default | 1+2+3+5 (fast, no LLM calls) |
| `--strict` | + 4 (eval counts + schema field checks) |
| manual | human does the live Cloud/Vercel click-through in tasks.md |

Exit code `0` = pass, `1` = fail with per-check `PASS/FAIL` lines.

## Workflow

```
implement tasks → python3 scripts/verify.py --spec <name>
  → fix FAILs → tick tasks → verify again
  → update specs/status.yaml: done → verified (only after pass)
```

## Adding a new check

1. Add check function in `scripts/verify.py` (`check_*`).
2. Document it here.
3. Reference it from the relevant spec's `tasks.md`.
