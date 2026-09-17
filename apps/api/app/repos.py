"""Repo registry. Source of truth: specs/002-multi-repo/contracts/repos.yaml.
Falls back to the hardcoded seed list when the file is unreachable
(e.g. container deploys without the repo mounted).
"""
from pathlib import Path

import yaml

_FALLBACK = [
    "activepieces/activepieces",
    "Deepjyoti-Sarmah/VibeCode",
    "Deepjyoti-Sarmah/Invoice-Cart",
    "Deepjyoti-Sarmah/symbolgraph",
]


def load_known_repos() -> set[str]:
    here = Path(__file__).resolve()
    for _ in range(6):  # walk up toward repo root
        candidate = here / "specs" / "002-multi-repo" / "contracts" / "repos.yaml"
        if candidate.exists():
            try:
                data = yaml.safe_load(candidate.read_text())
                ids = {r.get("id") for r in data if isinstance(r, dict) and r.get("id")}
                if ids:
                    return ids
            except Exception:
                break
        here = here.parent
    return set(_FALLBACK)


KNOWN_REPOS = load_known_repos()
