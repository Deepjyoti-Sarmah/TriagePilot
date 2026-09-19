import type { TriageInput, TriageProvider, TriageResult } from "./types";
import { TriageOutput } from "../schema";

/**
 * Full ReAct agent path: POSTs to the Cloud MCP-entry flow's webhook URL
 * (spec 003 `mcp-maintainer-entry`, returnsResponse:true), which runs the
 * agent step with tools + KB + approvals and returns structured JSON.
 *
 * Auth note (verified 2026-09-19): the MCP server at /mcp is OAuth-only
 * ("No API keys to manage") — no static token exists. Webhook triggers
 * are the firewall-friendly path: set AP_FLOW_WEBHOOK_URL after creating
 * the flow in Cloud. Until then: fail closed (501).
 */
export const activepiecesProvider: TriageProvider = {
  name: "activepieces",
  model: process.env.TRIAGE_MODEL || "nvidia/nemotron-3-super-120b-a12b:free",
  async triage(input: TriageInput): Promise<TriageResult> {
    const t0 = Date.now();
    const webhook = (process.env.AP_FLOW_WEBHOOK_URL || "").replace(/\/$/, "");
    if (!webhook) {
      throw Object.assign(
        new Error("Activepieces provider needs AP_FLOW_WEBHOOK_URL (flow webhook from spec 003)."),
        { status: 501, code: "not_wired" }
      );
    }
    const body = JSON.stringify({
      repo: input.repo,
      issue_url: input.issue_url,
      model: (this as TriageProvider).model,
      title: input.title,
      body: input.body,
    });
    // One retry on empty bodies: cold engine runs occasionally return {}
    // before the run completes. Bounded to 2 attempts (agent runs cost).
    let data: unknown = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) {
        throw Object.assign(
          new Error(`MCP-entry flow returned ${res.status}.`),
          { status: 502, code: "provider_error" }
        );
      }
      data = await res.json().catch(() => null);
      const out = (data as { output?: unknown } | null)?.output ?? data;
      if (out && Object.keys(out as object).length > 0) break;
      data = null;
      if (attempt === 1) await new Promise((r) => setTimeout(r, 15000));
    }
    const parsed = TriageOutput.safeParse(
      (data as { output?: unknown } | null)?.output ?? data
    );
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
