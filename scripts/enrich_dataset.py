#!/usr/bin/env python3
"""enrich_dataset.py — one-off migration: give every synthetic-edge row an
inline `title` + `body` so direct-path evals classify content, not 404s.
Run: python3 scripts/enrich_dataset.py  (idempotent: skips rows that have them)
"""
import json
from pathlib import Path

DS = Path(__file__).resolve().parent.parent / "specs/001-maintainer-agent/evals/dataset.jsonl"

# Hand-written bodies where the note is meta, not content.
HAND = {
    "syn-spam-1": ("MAKE MONEY FAST with crypto!!!",
                   "Double your BTC in 24 hours, guaranteed returns!!! "
                   "Send 0.01 BTC to bc1qEXAMPLE and get 0.02 back instantly. "
                   "Limited offer!!! http://example-promo.invalid"),
    "syn-empty-1": ("asdf",
                    ""),
    "syn-dup-e2b": ("E2B sandbox timeout on npm install (same as reported)",
                    "Hitting the same E2B timeout during npm install on larger apps. "
                    "Looks identical to the earlier timeout report — linking here instead of opening fresh."),
    "syn-dup-gst": ("GST slab wrong — same as earlier report",
                    "Same GST 18%-as-28% line-item bug as reported before. "
                    "Reproduces on my account too, adding a +1 rather than details."),
    "syn-dup-install": ("uv sync fails on 3.9 too",
                       "Same tree-sitter wheel failure on Python 3.9 as the earlier install report. "
                       "Confirming it reproduces on macOS as well."),
}

TYPE_TAIL = {
    "bug": " Reproduced twice on a clean checkout; blocks daily use.",
    "feature": " Happy to test a preview build and report back.",
    "question": " Checked the docs first but could not find this covered.",
    "docs": " Will open a PR once the intended behavior is confirmed.",
    "spam": "",
    "duplicate": "",
    "piece-request": " No workaround exists today; this gates adoption for us.",
}


def title_from_note(note: str, slug: str) -> str:
    words = slug.replace("syn-", "").replace("-", " ")
    base = note.strip().rstrip(".")
    if len(base) > 90:
        base = base[:87].rsplit(" ", 1)[0]
    return base[0].upper() + base[1:] if base else words


def main() -> None:
    rows = [json.loads(l) for l in DS.read_text().splitlines() if l.strip()]
    changed = 0
    for r in rows:
        if r.get("source") != "synthetic-edge" or "title" in r:
            continue
        slug = r["issue_url"].split("template=")[-1]
        if slug in HAND:
            title, body = HAND[slug]
        else:
            title = title_from_note(r.get("note", ""), slug)
            body = (r.get("note", "") + TYPE_TAIL.get(r["expected_type"], "")).strip()
        r["title"], r["body"] = title, body
        changed += 1
    # HAND keys are per-repo ambiguous (syn-spam-1 exists in 4 repos with
    # different notes) — same spam shape everywhere is intended.
    DS.write_text("\n".join(json.dumps(r) for r in rows) + "\n")
    print(f"enriched {changed} rows; total {len(rows)}")


if __name__ == "__main__":
    main()
