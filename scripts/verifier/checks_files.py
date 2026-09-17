"""File-level checks: existence, JSON/YAML validity, task checkboxes."""
import json

from .core import EVAL_REQUIRED_KEYS, ROOT, SEED_REPOS, load_yaml_minimal, report


def check_files_exist(spec: str, files: list) -> None:
    for f in files:
        p = ROOT / f
        report(f"{spec}:exists:{f}", p.exists(), "" if p.exists() else "missing")


def check_json_valid(path_rel: str) -> None:
    p = ROOT / path_rel
    if not p.exists():
        return
    try:
        data = json.loads(p.read_text())
        report(f"json-valid:{path_rel}", True,
               f"keys={list(data.keys())[:6]}" if isinstance(data, dict)
               else f"type={type(data).__name__}")
        if path_rel.startswith("flows/") and isinstance(data, dict) and data.get("_placeholder"):
            report(f"real-export:{path_rel}", False,
                   "still placeholder — overwrite with Cloud export")
        elif path_rel.startswith("flows/"):
            report(f"real-export:{path_rel}", True, "")
        if path_rel.endswith("output.schema.json") and isinstance(data, dict):
            req = set(data.get("required", []))
            need = {"repo", "issue_type", "severity", "confidence",
                    "duplicate_of", "labels", "draft_reply", "needs_human"}
            report("schema:has-required-fields", need <= req,
                   f"missing={sorted(need - req)}" if need > req else "ok")
    except Exception as e:
        report(f"json-valid:{path_rel}", False, str(e)[:160])


def check_yaml_valid(path_rel: str) -> None:
    p = ROOT / path_rel
    if not p.exists():
        return
    data = load_yaml_minimal(p)
    if data is None:
        text = p.read_text()
        ok = len(text.strip()) > 0
        report(f"yaml-nonempty:{path_rel}", ok,
               "pyyaml missing, text-only check" if ok else "empty")
        return
    report(f"yaml-valid:{path_rel}", True, f"type={type(data).__name__}")
    if path_rel.endswith("repos.yaml") and isinstance(data, list):
        ids = [r.get("id") for r in data if isinstance(r, dict)]
        missing = [r for r in SEED_REPOS if r not in ids]
        report("repos:has-4-seeds", not missing,
               f"missing={missing}" if missing else f"found={len(ids)}")
        bad = [r.get("id") for r in data if isinstance(r, dict)
               and not all(k in r for k in ("id", "kb_id", "labels", "channel", "tone"))]
        report("repos:row-shape", not bad,
               f"bad-rows={bad}" if bad else "ok")


def check_tasks(path_rel: str, strict: bool) -> None:
    p = ROOT / path_rel
    if not p.exists():
        return
    unchecked = checked = 0
    for line in p.read_text().splitlines():
        s = line.strip()
        if s.startswith("- [ ]"):
            unchecked += 1
        elif s.lower().startswith("- [x]"):
            checked += 1
    total = unchecked + checked
    report(f"tasks-count:{path_rel}", total > 0, f"{checked}/{total} ticked")
    if strict:
        report(f"tasks-all-done:{path_rel}", unchecked == 0,
               f"{unchecked} remaining" if unchecked else "all ticked")
