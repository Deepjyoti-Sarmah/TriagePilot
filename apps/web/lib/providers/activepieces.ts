import type { TriageInput, TriageProvider, TriageResult } from "./types";
import { TriageOutput } from "../schema";

/**
 * Full ReAct agent path: POSTs to the Cloud MCP-entry flow
 * (spec 003 `mcp-maintainer-entry`), which runs the agent step with
 * tools + KB + approvals and returns structured JSON.
 * Lands in D4 once AP_* keys exist. Until then: fail closed (501).
 */
export const activepiecesProvider: TriageProvider = {
  name: "activepieces",
  model: process.env.TRIAGE_MODEL || "qwen/qwen3.8-27b:free",
  async triage(input: TriageInput): Promise<TriageResult> {
    const t0 = Date.now();
    const base = (process.env.AP_MCP_URL || "").replace(/\/$/, "");
    if (!process.env.AP_API_KEY || !process.env.AP_PROJECT_ID || !base) {
      throw Object.assign(
        new Error("Activepieces provider needs AP_API_KEY, AP_PROJECT_ID, AP_MCP_URL."),
        { status: 501, code: "not_wired" }
      );
    }
    const res = await fetch(`${base}/maintainer-entry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AP_API_KEY}`,
      },
      body: JSON.stringify({
        projectId: process.env.AP_PROJECT_ID,
        repo: input.repo,
        issue_url: input.issue_url,
        model: (this as TriageProvider).model,
      }),
    });
    if (!res.ok) {
      throw Object.assign(
        new Error(`MCP-entry flow returned ${res.status}.`),
        { status: 502, code: "provider_error" }
      );
    }
    const data = await res.json().catch(() => null);
    const parsed = TriageOutput.safeParse(data?.output ?? data);
    if (!parsed.success) {
      throw Object.assign(
        new Error("Agent returned output outside the contract."),
        { status: 502, code: "provider_error" }
      );
    }
    return {
      output: parsed.data,
      meta: {
        provider: "activepieces",
        model: (this as TriageProvider).model,
        mode: "live-agent",
        latency_ms: Date.now() - t0,
      },
    };
  },
};
