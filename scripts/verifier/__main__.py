"""verify.py — checks what is done is correct. No LLM calls, no secrets needed.
Usage: python3 scripts/verify.py [--spec 001-maintainer-agent] [--strict]
Exit 0 = pass, 1 = fail. See specs/_system/verification.md.
"""
import argparse
import sys

from .checks_domain import check_evals, check_repo_sync, check_secrets
from .checks_files import (check_files_exist, check_json_valid,
                           check_tasks, check_yaml_valid)
from .checks_providers import (check_contract_parity, check_providers,
                               check_providers_py)
from .core import load_yaml_minimal, report, results
from .core import ROOT  # noqa: E402,F401  (re-export for tooling)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--spec", default=None,
                    help="only check one spec key, e.g. 001-maintainer-agent")
    ap.add_argument("--strict", action="store_true",
                    help="also enforce tasks-all-done + eval coverage")
    args = ap.parse_args()

    status_path = ROOT / "specs/status.yaml"
    if not status_path.exists():
        report("status.yaml:exists", False, "missing")
        sys.exit(1)
    data = load_yaml_minimal(status_path)
    specs = data.get("specs", {}) if isinstance(data, dict) else {}
    if not specs:
        report("status.yaml:parse", False,
               "pyyaml missing or empty — install pyyaml for full checks")
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
            check_tasks(f"specs/{key}/tasks.md", args.strict)
        check_evals(args.strict)
        check_repo_sync()
        check_providers()
        check_providers_py()
        check_contract_parity()
        check_secrets()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed.")
    if failed:
        print("Next: fix FAIL lines above, tick tasks.md, re-run. "
              "See specs/_system/verification.md.")
        sys.exit(1)
    print("All green for this level."
          + (" (strict)" if args.strict else " (run --strict before publish)"))


if __name__ == "__main__":
    main()
