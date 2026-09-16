# specs/ — how to use this folder

Each numbered folder is one independent spec. Work top-down: `001 → 005`.

```
specs/
  _system/
    how-to-write-spec.md   # template for new specs
    verification.md        # Definition of Done + verify levels
  001-maintainer-agent/
    spec.md                # agent job, non-goals, FRs
    agent.prompt.md        # system brief (the actual prompt)
    tools.matrix.md        # PIECE / KB / FLOW / webSearch matrix
    tasks.md               # build checkboxes
    contracts/output.schema.json
    evals/dataset.jsonl    # 20/repo, filled during D6
  002-multi-repo/
    spec.md
    tasks.md
    contracts/repos.yaml   # repo registry (source of truth)
  003-flows/
    spec.md
    tasks.md               # exports land in /flows/*.json
  004-web-ui/
    spec.md
    tasks.md               # app lands in /apps/web
  005-evals-guardrails/
    spec.md
    tasks.md
  006-keyless-hardening/
    spec.md                # proof without keys: smoke, sync, CI, demo
    tasks.md
  007-provider-backend/
    spec.md                # env-selected providers, meta on every run
    tasks.md
    contracts/direct.prompt.md
  status.yaml              # progress tracker (single file)
```

## Rules

1. One spec = one concern. Don't mix agent prompt edits into web UI spec.
2. `spec.md` describes WHAT/WHY, never secrets. `tasks.md` is checkboxes `- [ ]`.
3. Contracts (`*.json`, `*.yaml`) are machine-checked by `scripts/verify.py`.
4. To add spec `006-...`: copy `_system/how-to-write-spec.md` template, add row to `status.yaml` + `PLAN.md` table.
5. Status values only: `pending | in_progress | done | verified`. Only `verified` (after `verify.py` passes) counts.
