"""Provider + contract checks (specs 007, 008)."""
import json
import re

from .core import ROOT, report


def check_providers() -> None:
    """Every lib/providers/*.ts must export a triage provider (spec 007)."""
    base = ROOT / "apps/web/lib/providers"
    if not base.exists():
        report("providers:dir", False, "lib/providers missing")
        return
    files = sorted(p for p in base.glob("*.ts") if p.name not in ("types.ts", "index.ts"))
    if not files:
        report("providers:any", False, "no provider implementations")
        return
    for p in files:
        text = p.read_text()
        ok = ("TriageProvider" in text
              and bool(re.search(r"\btriage\b", text))
              and (bool(re.search(r'\bname:\s*"', text))
                   or bool(re.search(r"export const \w+[Pp]rovider", text))))
        report(f"providers:{p.stem}", ok,
               "exports TriageProvider with triage()" if ok
               else "missing TriageProvider/triage/name")


def check_providers_py() -> None:
    """Every apps/api/app/providers/*.py must expose triage (spec 008)."""
    base = ROOT / "apps/api/app/providers"
    if not base.exists():
        report("providers-py:dir", False, "apps/api providers missing")
        return
    files = sorted(p for p in base.glob("*.py")
                   if p.name not in ("__init__.py", "base.py", "registry.py"))
    if not files:
        report("providers-py:any", False, "no provider implementations")
        return
    for p in files:
        text = p.read_text()
        ok = ("def triage" in text
              and "Provider" in text
              and p.name in ("mock.py", "activepieces.py", "direct.py"))
        report(f"providers-py:{p.stem}", ok,
               "exposes triage()" if ok else "missing triage implementation")


def check_contract_parity() -> None:
    """Python contracts must cover every required field of output.schema.json."""
    schema_path = ROOT / "specs/001-maintainer-agent/contracts/output.schema.json"
    contracts_path = ROOT / "apps/api/app/contracts.py"
    if not schema_path.exists() or not contracts_path.exists():
        report("contract-parity:files", False, "schema or contracts.py missing")
        return
    required = set(json.loads(schema_path.read_text()).get("required", []))
    text = contracts_path.read_text()
    missing = sorted(r for r in required if r not in text)
    report("contract-parity:fields", not missing,
           f"{len(required)} required fields covered" if not missing else f"missing={missing}")
