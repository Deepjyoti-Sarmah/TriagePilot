#!/usr/bin/env python3
"""eval_sweep.py — first live accuracy number (spec 005).
Runs a stratified 12-row subset of evals/dataset.jsonl through the live
direct provider and scores expected_type vs verdict against the 0.8 gate.

Usage: python3 scripts/eval_sweep.py [--n 12] [--seed 7] [--out NAME]
Needs OPENROUTER_API_KEY (apps/api/.env is loaded). Throttle-safe:
10s between calls, 90s backoff on 429 up to 3 retries per row.
Exit 0 = sweep complete (gate pass/fail is reported, not fatal).
"""
import argparse
import json
import os
import random
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "apps" / "api"))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(ROOT / "apps" / "api" / ".env")

os.environ.setdefault("TRIAGE_PROVIDER", "openrouter")
os.environ.setdefault("TRIAGE_MODEL", "deepseek/deepseek-v4-flash-0731:free")

from app.providers.registry import resolve_provider  # noqa: E402
from app.providers.base import TriageInput  # noqa: E402
from app.providers.activepieces import ProviderError  # noqa: E402

# type -> count: mirrors dataset mix, guarantees edge coverage
STRATA = {"bug": 5, "piece-request": 1, "feature": 1, "question": 1,
          "docs": 1, "spam": 2, "duplicate": 1}


def load_dataset():
    rows = []
    path = ROOT / "specs/001-maintainer-agent/evals/dataset.jsonl"
    for line in path.read_text().splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def stratify(rows, seed):
    rng = random.Random(seed)
    picked = []
    for t, n in STRATA.items():
        pool = [r for r in rows if r["expected_type"] == t]
        # prefer real github rows, then fill with synthetic
        pool.sort(key=lambda r: (0 if r.get("source") == "github" else 1,
                                 r["issue_url"]))
        # shuffle within preference bands for variety, deterministic
        github = [r for r in pool if r.get("source") == "github"]
        synth = [r for r in pool if r.get("source") != "github"]
        rng.shuffle(github)
        rng.shuffle(synth)
        ordered = sorted(github + synth,
                         key=lambda r: (0 if r.get("source") == "github" else 1,
                                        rng.random()))
        picked.extend(ordered[:n])
    return picked


def run_row(provider, row, pause=10):
    last_err = "no attempt"
    for attempt in range(4):
        try:
            t0 = time.time()
            res = provider.triage(
                TriageInput(repo=row["repo"], issue_url=row["issue_url"],
                            title=row.get("title"), body=row.get("body")))
            return {"verdict": res.output.model_dump(), "meta": {
                "provider": res.provider, "model": res.model,
                "latency_ms": res.latency_ms}, "attempts": attempt + 1,
                "elapsed_s": round(time.time() - t0, 1)}
        except ProviderError as e:
            last_err = f"{e.code}: {e}"
            # 429 = free-pool throttle; 408 = Cloud /sync webhook's 30s ceiling.
            if ("429" in str(e) or "408" in str(e)) and attempt < 3:
                wait = 90 if "429" in str(e) else 15
                print(f"  transient ({e.code}), backing off {wait}s "
                      f"(attempt {attempt + 1})…", flush=True)
                time.sleep(wait)
                continue
            break
        time.sleep(pause)
    return {"error": last_err, "attempts": attempt + 1}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=12)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default="sweep-001.json")
    ap.add_argument("--provider", default=os.environ.get("TRIAGE_PROVIDER", "openrouter"),
                    help="openrouter (direct) | activepieces (live Cloud flow)")
    args = ap.parse_args()
    os.environ["TRIAGE_PROVIDER"] = args.provider
    provider = resolve_provider()

    rows = load_dataset()
    sample = stratify(rows, args.seed)[:args.n]
    print(f"sample: {len(sample)} rows " +
          f"{[(r['repo'].split('/')[-1], r['expected_type']) for r in sample]}")

    results = []
    for i, row in enumerate(sample, 1):
        print(f"[{i}/{len(sample)}] {row['repo']} {row['issue_url'][-40:]} …",
              flush=True)
        out = run_row(provider, row)
        rec = {"expected_type": row["expected_type"],
               "expected_severity": row["expected_severity"],
               "is_duplicate": row["is_duplicate"],
               "repo": row["repo"], "issue_url": row["issue_url"],
               "source": row.get("source"), **out}
        if "verdict" in out:
            rec["correct"] = out["verdict"]["issue_type"] == row["expected_type"]
            print(f"  → {out['verdict']['issue_type']} "
                  f"(want {row['expected_type']}) "
                  f"{'✓' if rec['correct'] else '✗'} "
                  f"conf={out['verdict']['confidence']} "
                  f"{out['meta']['latency_ms']}ms", flush=True)
        else:
            rec["correct"] = False
            print(f"  → ERROR {out['error']}", flush=True)
        results.append(rec)
        time.sleep(10)

    scored = [r for r in results if "verdict" in r]
    acc = sum(r["correct"] for r in scored) / len(scored) if scored else 0.0
    artifact = {
        "model": os.environ["TRIAGE_MODEL"],
        "provider": args.provider,
        "seed": args.seed,
        "gate": 0.8,
        "accuracy": round(acc, 3),
        "gate_pass": acc >= 0.8,
        "scored": len(scored),
        "total": len(results),
        "rows": results,
    }
    out_path = (ROOT / "specs/001-maintainer-agent/evals" / args.out)
    out_path.write_text(json.dumps(artifact, indent=2))
    print(f"\naccuracy: {acc:.3f} ({sum(r['correct'] for r in scored)}/{len(scored)}) "
          f"gate 0.8 → {'PASS' if acc >= 0.8 else 'FAIL'}")
    try:
        shown = out_path.relative_to(ROOT)
    except ValueError:
        shown = out_path
    print(f"artifact: {shown}")


if __name__ == "__main__":
    main()
