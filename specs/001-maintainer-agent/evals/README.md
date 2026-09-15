# evals/dataset.jsonl — labeling notes

80 rows, 20 per seed repo. Required keys per row: `repo, issue_url, expected_type, expected_severity, is_duplicate` (checked by `scripts/verify.py`).

## `source` field (honesty marker, extra key)

- `github` — real issue/PR number and title verified against the GitHub API on 2026-09-19. Activepieces rows are live open issues; VibeCode/symbolgraph trackers hold PRs only, so those rows point at real PRs.
- `synthetic-edge` — plausible row written by hand. Used where the tracker is empty (Invoice-Cart has 0 issues) and for edge cases every repo needs: spam, empty body, duplicate pair, how-to question, docs gap.

Duplicate rows carry `duplicate_of` (real issue number, or `0` = dup of another synthetic row in this file, see `note`).

## Refreshing

Replace synthetic rows with real issues as trackers fill up. Keep ≥20/repo and ≥1 spam + ≥1 duplicate per repo — `verify.py --strict` enforces the count.
