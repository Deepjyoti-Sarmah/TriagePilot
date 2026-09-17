"""Shared state: repo root, constants, result collector."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
SECRET_PATTERNS = [r"sk-[A-Za-z0-9]{8,}", r"ghp_[A-Za-z0-9]{8,}",
                   r"xox[bap]-[A-Za-z0-9-]{8,}", r"AP_API_KEY\s*=\s*\S+"]
SCAN_DIRS = ["specs", "flows", "tables", "scripts", "knowledge"]
EVAL_REQUIRED_KEYS = {"repo", "issue_url", "expected_type",
                      "expected_severity", "is_duplicate"}
SEED_REPOS = ["activepieces/activepieces", "Deepjyoti-Sarmah/VibeCode",
              "Deepjyoti-Sarmah/Invoice-Cart", "Deepjyoti-Sarmah/symbolgraph"]

results: list = []


def report(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f" — {detail}" if detail else ""))


def load_yaml_minimal(path: Path):
    try:
        import yaml  # type: ignore
        return yaml.safe_load(path.read_text())
    except ImportError:
        return None  # fallback: text checks only
