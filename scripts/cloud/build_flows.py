#!/usr/bin/env python3
"""Build + publish the Cloud flows from source (spec 003).

Why this exists
---------------
The public Activepieces API exposes flow CRUD but NOT the Agents feature
(GET /v1/agents -> 402 FEATURE_DISABLED) and the MCP-server routes reject
API keys (403). So the Cloud Agent step can only be created from the UI.
This builder publishes the next-best thing programmatically: a tool-using
Cloud flow (Catch Webhook -> Code -> Return Response) whose Code step
fetches the GitHub issue, runs a dedupe search, and calls OpenRouter with
the versioned triage prompt. The backend's activepieces provider calls it
through AP_FLOW_WEBHOOK_URL (spec 007 FR-4).

Secrets live in project Variables and are referenced as
{{variables.NAME}} placeholders; they never appear in the flow JSON on disk.

Usage:
  python3 scripts/cloud/build_flows.py mcp-maintainer-entry
  python3 scripts/cloud/build_flows.py --all
  python3 scripts/cloud/build_flows.py --list
"""
from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = "https://cloud.activepieces.com/api/v1"
UA = "TriagePilot-FlowBuilder/1.0 (+https://github.com/Deepjyoti-Sarmah)"


def load_env() -> None:
    for path in (ROOT / "apps" / "api" / ".env", ROOT / ".env"):
        if not path.exists():
            continue
        for line in path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip())


def api(method: str, path: str, body: dict | None = None) -> tuple[int, object, str]:
    key = os.environ["AP_API_KEY"]
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(
        BASE + path, method=method, data=data,
        headers={"Authorization": "Bearer " + key,
                 "Content-Type": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw.strip() else None), raw
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            parsed = json.loads(raw)
        except Exception:
            parsed = None
        return exc.code, parsed, raw


def upsert_variable(name: str, value: str) -> str:
    pid = os.environ["AP_PROJECT_ID"]
    status, data, _ = api("GET", f"/variables?projectId={pid}&name={name}")
    if status == 200 and isinstance(data, dict):
        items = data.get("data") or []
        if items:
            vid = items[0]["id"]
            api("POST", f"/variables/{vid}", {"value": value})
            return f"updated {name}"
    status, data, raw = api("POST", "/variables",
                            {"projectId": pid, "name": name, "value": value})
    if status not in (200, 201):
        raise SystemExit(f"variable {name} failed: {status} {raw[:200]}")
    return f"created {name}"


def set_env_var(rel_path: str, key: str, value: str) -> None:
    """Keep the git-ignored local env files pointed at the live webhook."""
    path = ROOT / rel_path
    if not path.exists():
        return
    lines = path.read_text().splitlines()
    out, found = [], False
    for line in lines:
        if line.startswith(key + "="):
            out.append(f"{key}={value}")
            found = True
        else:
            out.append(line)
    if not found:
        out.append(f"{key}={value}")
    path.write_text("\n".join(out) + "\n")


def delete_flow(flow_id: str) -> None:
    api("DELETE", f"/flows/{flow_id}")


def find_flows(name: str) -> list:
    pid = os.environ["AP_PROJECT_ID"]
    status, data, _ = api("GET", f"/flows?projectId={pid}&limit=100")
    if status != 200 or not isinstance(data, dict):
        return []
    out = []
    for f in data.get("data") or []:
        display = f.get("displayName") or (f.get("version") or {}).get("displayName")
        if display == name:
            out.append(f.get("id"))
    return out


def find_flow(name: str):
    found = find_flows(name)
    return found[0] if found else None


def create_flow(name: str) -> str:
    pid = os.environ["AP_PROJECT_ID"]
    status, data, raw = api("POST", "/flows",
                            {"displayName": name, "projectId": pid})
    if status not in (200, 201):
        raise SystemExit(f"create {name} failed: {status} {raw[:300]}")
    return data["id"]


def publish(flow_id: str, status_value: str = "ENABLED") -> None:
    status, data, raw = api("POST", f"/flows/{flow_id}",
                            {"type": "LOCK_AND_PUBLISH",
                             "request": {"status": status_value}})
    if status not in (200, 201):
        raise SystemExit(f"publish failed: {status} {raw[:300]}")


def set_piece_trigger(flow_id: str, piece: str, version: str,
                     trigger_name: str, trigger_input: dict) -> None:
    trigger = {
        "name": "trigger", "valid": True, "displayName": trigger_name,
        "type": "PIECE_TRIGGER",
        "settings": {
            "pieceName": piece,
            "pieceVersion": version,
            "triggerName": trigger_name,
            "input": trigger_input,
            "propertySettings": {},
        },
    }
    status, _, raw = api("POST", f"/flows/{flow_id}",
                         {"type": "UPDATE_TRIGGER", "request": trigger})
    if status not in (200, 201):
        raise SystemExit(f"trigger failed: {status} {raw[:300]}")


def set_webhook_trigger(flow_id: str) -> None:
    set_piece_trigger(flow_id, "@activepieces/piece-webhook", "0.1.41",
                      "catch_webhook", {"authType": "none"})


def add_code_step(flow_id: str, parent: str, name: str, js: str,
                  step_input: dict) -> None:
    action = {
        "name": name, "valid": True, "displayName": "Triage (tools)",
        "type": "CODE",
        "settings": {
            "sourceCode": {"packageJson": json.dumps({"dependencies": {}}), "code": js},
            "input": step_input,
            "errorHandlingOptions": {
                "continueOnFailure": {"value": False},
                "retryOnFailure": {"value": False},
            },
        },
    }
    status, _, raw = api("POST", f"/flows/{flow_id}",
                         {"type": "ADD_ACTION",
                          "request": {"parentStep": parent,
                                      "stepLocationRelativeToParent": "AFTER",
                                      "action": action}})
    if status not in (200, 201):
        raise SystemExit(f"code step failed: {status} {raw[:300]}")


def add_mcp_reply_step(flow_id: str, parent: str, response_expr: str) -> None:
    action = {
        "name": "reply", "valid": True, "displayName": "Reply to MCP Client",
        "type": "PIECE",
        "settings": {
            "pieceName": "@activepieces/piece-mcp",
            "pieceVersion": "0.0.21",
            "actionName": "reply_to_mcp_client",
            # DynamicProperties prop "response" contains one field also named
            # "response" (see the piece source), so the value nests once.
            "input": {"mode": "advanced",
                      "response": {"response": response_expr},
                      "respond": "stop"},
            "propertySettings": {"response": {"type": "MANUAL"}},
        },
    }
    status, _, raw = api("POST", f"/flows/{flow_id}",
                         {"type": "ADD_ACTION",
                          "request": {"parentStep": parent,
                                      "stepLocationRelativeToParent": "AFTER",
                                      "action": action}})
    if status not in (200, 201):
        raise SystemExit(f"mcp reply step failed: {status} {raw[:300]}")


def add_return_step(flow_id: str, parent: str, body_expr: str) -> None:
    action = {
        "name": "return_response", "valid": True, "displayName": "Return Response",
        "type": "PIECE",
        "settings": {
            "pieceName": "@activepieces/piece-webhook",
            "pieceVersion": "0.1.41",
            "actionName": "return_response",
            "input": {"responseType": "json", "respond": "stop",
                      "fields": {"status": 200, "headers": {}, "body": body_expr}},
            "propertySettings": {},
        },
    }
    status, _, raw = api("POST", f"/flows/{flow_id}",
                         {"type": "ADD_ACTION",
                          "request": {"parentStep": parent,
                                      "stepLocationRelativeToParent": "AFTER",
                                      "action": action}})
    if status not in (200, 201):
        raise SystemExit(f"return step failed: {status} {raw[:300]}")


def sanitize(obj) -> str:
    """Exports reference variables ({{variables.*}}), never values. As
    defence in depth, redact any loaded secret value that slipped in."""
    text = json.dumps(obj, indent=2)
    for env in ("OPENROUTER_API_KEY", "GITHUB_PAT", "AP_API_KEY",
                "OPENAI_API_KEY"):
        value = os.environ.get(env, "")
        if value:
            text = text.replace(value, env + "_REDACTED")
    return text


def build(flow_name: str, spec: dict) -> dict:
    defaults = spec.get("defaults", {})
    for var, env in spec["vars"].items():
        value = os.environ.get(env, "") or defaults.get(var, "")
        if value:
            upsert_variable(var, value)

    for stale in find_flows(flow_name):
        delete_flow(stale)
    flow_id = create_flow(flow_name)

    trig = spec.get("trigger")
    if trig:
        set_piece_trigger(flow_id, trig["piece"], trig["version"],
                          trig["name"], trig.get("input", {}))
    else:
        set_webhook_trigger(flow_id)

    js = (ROOT / spec["code"]).read_text()
    # Context v2 path syntax: step references expose {output: ...}; the raw
    # webhook request is at trigger.output.body (verified live 2026-09-19).
    step_input = spec.get("step_input", {
        "payload": "{{trigger.output.body}}",
        "model": "{{variables.TRIAGE_MODEL}}",
        "github_pat": "{{variables.GITHUB_PAT}}",
        "openrouter_key": "{{variables.OPENROUTER_API_KEY}}",
    })
    add_code_step(flow_id, "trigger", "triage", js, step_input)
    if spec.get("reply") == "mcp":
        add_mcp_reply_step(flow_id, "triage", "{{triage.output}}")
    elif spec.get("return_response", True):
        add_return_step(flow_id, "triage", "{{triage.output}}")
    publish(flow_id)

    status, flow, raw = api("GET", f"/flows/{flow_id}")
    if status != 200:
        raise SystemExit(f"export failed: {status} {raw[:200]}")
    out = ROOT / "flows" / f"{flow_name}.json"
    out.write_text(sanitize(flow))
    result = {"flow": flow_name, "flow_id": flow_id,
              "status": flow.get("status"),
              "export": str(out.relative_to(ROOT))}
    if spec.get("trigger") is None:
        url = f"https://cloud.activepieces.com/api/v1/webhooks/{flow_id}/sync"
        result["url"] = url
        (ROOT / "flows" / f"{flow_name}.url").write_text(url + "\n")
        if flow_name == "mcp-maintainer-entry":
            set_env_var("apps/api/.env", "AP_FLOW_WEBHOOK_URL", url)
            set_env_var("apps/web/.env.local", "AP_FLOW_WEBHOOK_URL", url)
    return result


FLOWS = {
    "mcp-maintainer-entry": {
        "code": "scripts/cloud/mcp_entry_code.js",
        "vars": {"TRIAGE_MODEL": "TRIAGE_MODEL",
                 "GITHUB_PAT": "GITHUB_PAT",
                 "OPENROUTER_API_KEY": "OPENROUTER_API_KEY"},
        "defaults": {"TRIAGE_MODEL": "deepseek/deepseek-v4-flash-0731:free"},
    },
    # Same tool-using triage code; the Code step also normalizes GitHub
    # "issues" event payloads, so this is the issues.opened intake path.
    "webhook-github-intake": {
        "code": "scripts/cloud/mcp_entry_code.js",
        "vars": {"TRIAGE_MODEL": "TRIAGE_MODEL",
                 "GITHUB_PAT": "GITHUB_PAT",
                 "OPENROUTER_API_KEY": "OPENROUTER_API_KEY"},
        "defaults": {"TRIAGE_MODEL": "deepseek/deepseek-v4-flash-0731:free"},
    },
    # MCP Tool: same triage code exposed to MCP clients (Claude/Cursor/...)
    # through the hosted MCP server. One trigger per flow in Activepieces, so
    # this is a sibling of the webhook flow, not the same flow.
    "mcp-tool-triage": {
        "code": "scripts/cloud/mcp_entry_code.js",
        "vars": {"TRIAGE_MODEL": "TRIAGE_MODEL",
                 "GITHUB_PAT": "GITHUB_PAT",
                 "OPENROUTER_API_KEY": "OPENROUTER_API_KEY"},
        "defaults": {"TRIAGE_MODEL": "deepseek/deepseek-v4-flash-0731:free"},
        "trigger": {
            "piece": "@activepieces/piece-mcp", "version": "0.0.21",
            "name": "mcp_tool",
            "input": {
                "toolName": "triage_github_issue",
                "toolDescription": ("Triage a GitHub issue for a registered repo. "
                                    "Returns issue_type, severity, confidence, "
                                    "duplicate_of, labels, draft_reply, needs_human."),
                "inputSchema": [
                    {"name": "repo", "type": "Text", "required": True,
                     "description": "owner/name, one of the 4 seed repos"},
                    {"name": "issue_url", "type": "Text", "required": True,
                     "description": "full GitHub issue or PR URL"},
                ],
                "returnsResponse": True,
            },
        },
        "step_input": {
            "payload": "{{trigger.output}}",
            "model": "{{variables.TRIAGE_MODEL}}",
            "github_pat": "{{variables.GITHUB_PAT}}",
            "openrouter_key": "{{variables.OPENROUTER_API_KEY}}",
        },
        "reply": "mcp",
        "return_response": False,
    },
    # Daily digest: schedule trigger + Code step that pulls recent open
    # issues per repo and asks the model to summarize. Slack/Discord post is
    # intentionally not included (needs a webhook secret + UI connection).
    "daily-digest": {
        "code": "scripts/cloud/digest_code.js",
        "vars": {"TRIAGE_MODEL": "TRIAGE_MODEL",
                 "GITHUB_PAT": "GITHUB_PAT",
                 "OPENROUTER_API_KEY": "OPENROUTER_API_KEY"},
        "defaults": {"TRIAGE_MODEL": "deepseek/deepseek-v4-flash-0731:free"},
        "trigger": {"piece": "@activepieces/piece-schedule", "version": "0.1.22",
                    "name": "every_day",
                    "input": {"hour_of_the_day": 9, "timezone": "Asia/Kolkata",
                              "run_on_weekends": True}},
        "step_input": {
            "model": "{{variables.TRIAGE_MODEL}}",
            "github_pat": "{{variables.GITHUB_PAT}}",
            "openrouter_key": "{{variables.OPENROUTER_API_KEY}}",
        },
        "return_response": False,
    },
}


def main() -> None:
    load_env()
    ap = argparse.ArgumentParser()
    ap.add_argument("flow", nargs="?")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--list", action="store_true")
    args = ap.parse_args()
    if args.list:
        print(json.dumps(sorted(FLOWS), indent=2))
        return
    names = list(FLOWS) if args.all else [args.flow]
    if not names or names == [None]:
        ap.error("pass a flow name or --all")
    out = []
    for name in names:
        spec = FLOWS.get(name)
        if not spec:
            raise SystemExit(f"unknown flow {name}; known: {sorted(FLOWS)}")
        out.append(build(name, spec))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
