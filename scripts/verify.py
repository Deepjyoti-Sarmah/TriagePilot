#!/usr/bin/env python3
"""verify.py — checks what is done is correct. No LLM calls, no secrets needed.
Usage: python3 scripts/verify.py [--spec 001-maintainer-agent] [--strict]
Exit 0 = pass, 1 = fail. See specs/_system/verification.md.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SECRET_PATTERNS = [r"sk-[A-Za-z0-9]{8,}", r"ghp_[A-Za-z0-9]{8,}", r"xox[bap]-[A-Za-z0-9-]{8,}", r"AP_API_KEY\s*=\s*\S+"]
SCAN_DIRS = ["specs", "flows", "tables", "scripts", "knowledge"]
EVAL_REQUIRED_KEYS = {"repo", "issue_url", "expected_type", "expected_severity", "is_duplicate"}
SEED_REPOS = ["activepieces/activepieces", "Deepjyoti-Sarmah/VibeCode",
              "Deepjyoti-Sarmah/Invoice-Cart", "Deepjyoti-Sarmah/symbolgraph"]

results = []
def report(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))

def load_yaml_minimal(path: Path):
    try:
        import yaml  # type: ignore
        return yaml.safe_load(path.read_text())
    except ImportError:
        return None  # fallback: text checks only

def check_files_exist(spec, files):
    for f in files:
        p = ROOT / f
        report(f"{spec}:exists:{f}", p.exists(), "" if p.exists() else "missing")

def check_json_valid(path_rel):
    p = ROOT / path_rel
    if not p.exists():
        return
    try:
        data = json.loads(p.read_text())
        report(f"json-valid:{path_rel}", True, f"keys={list(data.keys())[:6]}" if isinstance(data, dict) else f"type={type(data).__name__}")
        # placeholder detection for flows
        if path_rel.startswith("flows/") and isinstance(data, dict) and data.get("_placeholder"):
            report(f"real-export:{path_rel}", False, "still placeholder — overwrite with Cloud export")
        elif path_rel.startswith("flows/"):
            report(f"real-export:{path_rel}", True, "")
        # output schema shape
        if path_rel.endswith("output.schema.json") and isinstance(data, dict):
            req = set(data.get("required", []))
            need = {"repo", "issue_type", "severity", "confidence", "duplicate_of", "labels", "draft_reply", "needs_human"}
            report("schema:has-required-fields", need <= req, f"missing={sorted(need - req)}" if need > req else "ok")
    except Exception as e:
        report(f"json-valid:{path_rel}", False, str(e)[:160])

def check_yaml_valid(path_rel):
    p = ROOT / path_rel
    if not p.exists():
        return
    data = load_yaml_minimal(p)
    if data is None:
        text = p.read_text()
        ok = len(text.strip()) > 0
        report(f"yaml-nonempty:{path_rel}", ok, "pyyaml missing, text-only check" if ok else "empty")
        return
    report(f"yaml-valid:{path_rel}", True, f"type={type(data).__name__}")
    if path_rel.endswith("repos.yaml") and isinstance(data, list):
        ids = [r.get("id") for r in data if isinstance(r, dict)]
        missing = [r for r in SEED_REPOS if r not in ids]
        report("repos:has-4-seeds", not missing, f"missing={missing}" if missing else f"found={len(ids)}")
        bad = [r.get("id") for r in data if isinstance(r, dict) and not all(k in r for k in ("id", "kb_id", "labels", "channel", "tone"))]
        report("repos:row-shape", not bad, f"bad-rows={bad}" if bad else "ok")

def check_tasks(path_rel, strict):
    p = ROOT / path_rel
    if not p.exists():
        return
    text = p.read_text()
    unchecked = checked = 0
    for line in text.splitlines():
        s = line.strip()
        if s.startswith("- [ ]"):
            unchecked += 1
        elif s.lower().startswith("- [x]"):
            checked += 1
    total = unchecked + checked
    report(f"tasks-count:{path_rel}", total > 0, f"{checked}/{total} ticked")
    if strict:
        report(f"tasks-all-done:{path_rel}", unchecked == 0, f"{unchecked} remaining" if unchecked else "all ticked")

def check_evals(strict):
    p = ROOT / "specs/001-maintainer-agent/evals/dataset.jsonl"
    if not p.exists():
        report("evals:exists", False, "missing dataset.jsonl")
        return
    counts = {}
    bad_lines = 0
    n = 0
    for i, line in enumerate(p.read_text().splitlines(), 1):
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
    report("evals:parse", bad_lines == 0, f"{n} rows, bad={bad_lines}" if bad_lines else f"{n} rows ok")
    if strict:
        thin = [r for r in SEED_REPOS if counts.get(r, 0) < 20]
        report("evals:20-per-repo", not thin, f"thin={[(r, counts.get(r, 0)) for r in thin]}" if thin else f"{counts}")

def check_secrets():
    hits = []
    for d in SCAN_DIRS:
        base = ROOT / d
        if not base.exists():
            continue
        for p in base.rglob("*"):
            if p.is_dir() or p.suffix in (".png", ".jpg") or p.name == "verify.py":
                continue
            try:
                text = p.read_text(errors="ignore")
            except Exception:
                continue
            for pat in SECRET_PATTERNS:
                if re.search(pat, text):
                    # allow the placeholder line in .env.example? .env.example not scanned (not in SCAN_DIRS). verify.py itself excluded.
                    hits.append(f"{p.relative_to(ROOT)}:{pat[:12]}")
                    break
    report("secrets:clean", not hits, f"hits={hits[:4]}" if hits else "no literals found")

def check_repo_sync():
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

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", default=None, help="only check one spec key, e.g. 001-maintainer-agent")
    ap.add_argument("--strict", action="store_true", help="also enforce tasks-all-done + eval coverage")
    args = ap.parse_args()

    status_path = ROOT / "specs/status.yaml"
    if not status_path.exists():
        report("status.yaml:exists", False, "missing")
        sys.exit(1)
    data = load_yaml_minimal(status_path)
    specs = data.get("specs", {}) if isinstance(data, dict) else {}
    if not specs:
        # fallback: check known files directly
        report("status.yaml:parse", False, "pyyaml missing or empty — install pyyaml for full checks")
        check_json_valid("specs/001-maintainer-agent/contracts/output.schema.json")
        check_yaml_valid("specs/002-multi-repo/contracts/repos.yaml")
        check_secrets()
    else:
        keys = [args.spec] if args.spec else list(specs.keys())
        for key in keys:
            entry = specs.get(key, {})
            files = entry.get("files", [])
            check_files_exist(key, files)
            for f in files:
                if f.endswith(".json"):
                    check_json_valid(f)
                if f.endswith((".yaml", ".yml")):
                    check_yaml_valid(f)
            # tasks.md for this spec
            check_tasks(f"specs/{key}/tasks.md", args.strict)
        check_evals(args.strict)
        check_repo_sync()
        check_secrets()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed.")
    if failed:
        print("Next: fix FAIL lines above, tick tasks.md, re-run. See specs/_system/verification.md.")
        sys.exit(1)
    print("All green for this level." + (" (strict)" if args.strict else " (run --strict before publish)"))

if __name__ == "__main__":
    main()
