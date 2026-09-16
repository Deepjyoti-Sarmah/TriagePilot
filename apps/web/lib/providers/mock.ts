import type { TriageOutput } from "../schema";
import type { TriageInput, TriageProvider, TriageResult } from "./types";

// Known real issues (verified against GitHub API) so flagship demo URLs
// resolve correctly even though the mock only sees the URL string.
const KNOWN: Record<string, TriageOutput> = {
  "activepieces/activepieces#15626": {
    repo: "activepieces/activepieces",
    issue_type: "bug",
    severity: "P1",
    confidence: 0.9,
    duplicate_of: null,
    labels: ["bug", "area/flows"],
    draft_reply:
      "Thanks — the subflow INTERNAL_ERROR losing the parent response is a real bug and is being tracked. A maintainer will confirm priority.",
    needs_human: true,
  },
  "activepieces/activepieces#15623": {
    repo: "activepieces/activepieces",
    issue_type: "bug",
    severity: "P1",
    confidence: 0.9,
    duplicate_of: null,
    labels: ["bug"],
    draft_reply:
      "Thanks — template import 500s on piece-upgrade audit is a known cloud issue under investigation.",
    needs_human: true,
  },
  "activepieces/activepieces#15627": {
    repo: "activepieces/activepieces",
    issue_type: "bug",
    severity: "P2",
    confidence: 0.85,
    duplicate_of: null,
    labels: ["bug", "docs"],
    draft_reply:
      "Thanks — Chat-to-automation is listed on pricing but missing in Cloud. A maintainer will clarify availability.",
    needs_human: true,
  },
};

export function mockTriage(repo: string, issueUrl: string): TriageOutput {
  const m = issueUrl.match(/github\.com\/([^/]+\/[^/]+)\/(issues|pull)\/(\d+)/);
  if (m) {
    const hit = KNOWN[`${m[1]}#${m[3]}`];
    if (hit) return { ...hit, repo };
  }
  const url = issueUrl.toLowerCase();

  if (/spam|loan|airdrop|crypto|money-fast/.test(url)) {
    return {
      repo,
      issue_type: "spam",
      severity: "P3",
      confidence: 0.15,
      duplicate_of: null,
      labels: ["spam"],
      draft_reply:
        "This looks like spam and has been flagged for a maintainer to review. No action taken automatically.",
      needs_human: true,
    };
  }
  if (/syn-dup|duplicate/.test(url)) {
    return {
      repo,
      issue_type: "duplicate",
      severity: "P2",
      confidence: 0.82,
      duplicate_of: 0,
      labels: ["duplicate"],
      draft_reply:
        "Thanks — this looks like a re-report of an existing issue. A maintainer will link the original thread.",
      needs_human: true,
    };
  }
  if (/500|crash|segfault|fails|broken|timeout|error|e2big|pkce/.test(url)) {
    return {
      repo,
      issue_type: "bug",
      severity: /500|crash|segfault|e2big/.test(url) ? "P1" : "P2",
      confidence: 0.86,
      duplicate_of: null,
      labels: ["bug"],
      draft_reply:
        "Thanks for the report — we can reproduce the failure from your description. A maintainer will confirm severity and track the fix.",
      needs_human: true,
    };
  }
  if (/how|question|\?|custom-domain|voided/.test(url)) {
    return {
      repo,
      issue_type: "question",
      severity: "P3",
      confidence: 0.88,
      duplicate_of: null,
      labels: ["question"],
      draft_reply:
        "Good question — this is covered in the docs. A maintainer will confirm and link the exact section.",
      needs_human: false,
    };
  }
  if (/docs|readme|document/.test(url)) {
    return {
      repo,
      issue_type: "docs",
      severity: "P3",
      confidence: 0.9,
      duplicate_of: null,
      labels: ["docs"],
      draft_reply:
        "Agreed, this gap in the docs is real. A maintainer will queue a docs update.",
      needs_human: false,
    };
  }
  return {
    repo,
    issue_type: "question",
    severity: "P3",
    confidence: 0.55,
    duplicate_of: null,
    labels: ["question"],
    draft_reply:
      "Mock triage could not classify this URL confidently, so it is routed to a human maintainer.",
    needs_human: true,
  };
}

/** Deterministic, keyless. The default until keys land. */
export const mockProvider: TriageProvider = {
  name: "mock",
  model: "mock/deterministic-v1",
  async triage(input: TriageInput): Promise<TriageResult> {
    const t0 = Date.now();
    const output = mockTriage(input.repo, input.issue_url);
    return {
      output,
      meta: {
        provider: "mock",
        model: this.model,
        mode: "mock",
        latency_ms: Date.now() - t0,
      },
    };
  },
};
