"""Domain checks: evals dataset, repo sync, secrets."""
import json
import re

from .core import (EVAL_REQUIRED_KEYS, ROOT, SCAN_DIRS, SECRET_PATTERNS,
                   SEED_REPOS, load_yaml_minimal, report)


def check_evals(strict: bool) -> None:
    p = ROOT / "specs/001-maintainer-agent/evals/dataset.jsonl"
    if not p.exists():
        report("evals:exists", False, "missing dataset.jsonl")
        return
    counts: dict = {}
    bad_lines = n = 0
    for line in p.read_text().splitlines():
        if not line.strip():
            continue
        n += 1
        try:
            row = json.loads(line)
        except Exception:
            bad_lines += 1
            continue
        if not EVAL_REQUIRED_KEYS <= set(row.keys()):
            bad_lines += 1
            continue
        counts[row.get("repo", "?")] = counts.get(row.get("repo", "?"), 0) + 1
    report("evals:parse", bad_lines == 0,
           f"{n} rows, bad={bad_lines}" if bad_lines else f"{n} rows ok")
    if strict:
        thin = [r for r in SEED_REPOS if counts.get(r, 0) < 20]
        report("evals:20-per-repo", not thin,
               f"thin={[(r, counts.get(r, 0)) for r in thin]}" if thin else f"{counts}")


def check_repo_sync() -> None:
    """apps/web/lib/repos.ts ids must equal repos.yaml ids (spec 002 <-> 004)."""
    ts_path = ROOT / "apps/web/lib/repos.ts"
    yaml_path = ROOT / "specs/002-multi-repo/contracts/repos.yaml"
    if not ts_path.exists() or not yaml_path.exists():
        report("repos:sync", False, "repos.ts or repos.yaml missing")
        return
    ts_ids = set(re.findall(r'id:\s*"([^"]+)"', ts_path.read_text()))
    data = load_yaml_minimal(yaml_path)
    if not isinstance(data, list):
        report("repos:sync", False, "repos.yaml unreadable (need pyyaml)")
        return
    yaml_ids = {r.get("id") for r in data if isinstance(r, dict)}
    if ts_ids == yaml_ids:
        report("repos:sync", True, f"{len(yaml_ids)} repos match")
    else:
        report("repos:sync", False,
               f"ts-only={sorted(ts_ids - yaml_ids)} yaml-only={sorted(yaml_ids - ts_ids)}")


def check_secrets() -> None:
    hits = []
    for d in SCAN_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_dir() or p.suffix in (".png", ".jpg"):
                continue
            if p.name in ("verify.py",) or "verifier" in p.parts:
                continue  # patterns live here by design
            try:
                text = p.read_text(errors="ignore")
            except Exception:
                continue
            for pat in SECRET_PATTERNS:
                if re.search(pat, text):
                    hits.append(f"{p.relative_to(ROOT)}:{pat[:12]}")
                    break
    report("secrets:clean", not hits,
           f"hits={hits[:4]}" if hits else "no literals found")
