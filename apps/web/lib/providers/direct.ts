import { readFileSync } from "fs";
import { join } from "path";
import type { TriageInput, TriageProvider, TriageResult } from "./types";
import { TriageOutput } from "../schema";

// Single source of truth: specs/007-provider-backend/contracts/direct.prompt.md
// (inline fallback keeps Vercel/prod working where specs/ is not deployed).
const FALLBACK_PROMPT = `You triage ONE GitHub issue for repo {{repo}}. No tools. Decide from title+URL alone.
Return JSON ONLY: {"issue_type":"bug|piece-request|feature|docs|question|spam|duplicate","severity":"P0|P1|P2|P3","confidence":0.0-1.0,"duplicate_of":null,"labels":[],"draft_reply":"3-6 lines","needs_human":true|false}.
Unsure → confidence ≤ 0.6, needs_human true. Never invent URLs or numbers.`;

function loadPrompt(repo: string): string {
  try {
    const p = join(
      process.cwd(),
      "..",
      "specs",
      "007-provider-backend",
      "contracts",
      "direct.prompt.md"
    );
    return readFileSync(p, "utf8").replaceAll("{{repo}}", repo);
  } catch {
    return FALLBACK_PROMPT.replaceAll("{{repo}}", repo);
  }
}

type DirectName = "openrouter" | "openai";

const PRESETS: Record<DirectName, { baseUrl: string; keyEnv: string; defaultModel: string }> = {
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    defaultModel: "nvidia/nemotron-3-super-120b-a12b:free",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    defaultModel: "gpt-4o-mini",
  },
};

/** Parse leniently: raw JSON, else the largest {...} block.
 *  Reasoning models wrap JSON in thinking traces — extract, don't reject. */
function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    /* fall through to extraction */
  }
  const matches = text.match(/\{[\s\S]*\}/g) ?? [];
  for (const m of matches) {
    try {
      return JSON.parse(m);
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

function holdForHuman(repo: string, reason: string) {
  return {
    repo,
    issue_type: "question" as const,
    severity: "P3" as const,
    confidence: 0.4,
    duplicate_of: null,
    labels: ["question"] as string[],
    draft_reply: `Direct classify-only path could not verify this issue (${reason}). Routed to a human maintainer.`,
    needs_human: true as const,
  };
}

/** Public title+body so the model classifies content, not the URL.
 *  Inline row content wins (synthetic evals); otherwise fetch GitHub.
 *  Never fails the run — returns a note when unavailable. */
async function issueContext(input: TriageInput): Promise<string> {
  if (input.title !== undefined || input.body !== undefined) {
    const title = (input.title ?? "").trim();
    const body = (input.body ?? "").trim().slice(0, 3000);
    return `Title: ${title}\nBody: ${body || "(empty)"}`;
  }
  return githubIssueText(input.issue_url);
}

/** Public title+body so the model classifies content, not the URL.
 *  Never fails the run — returns a note when unavailable. */
async function githubIssueText(issueUrl: string): Promise<string> {
  const m = issueUrl.match(/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/);
  if (!m) return "(could not parse issue reference from URL)";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (process.env.GITHUB_PAT) {
    headers.Authorization = `Bearer ${process.env.GITHUB_PAT}`;
  }
  try {
    const res = await fetch(
      `https://api.github.com/repos/${m[1]}/issues/${m[2]}`,
      { headers }
    );
    if (!res.ok) return `(GitHub API returned ${res.status} for this issue)`;
    const data = await res.json().catch(() => null);
    const title = String(data?.title ?? "").trim();
    const body = String(data?.body ?? "").trim().slice(0, 3000);
    return `Title: ${title}\nBody: ${body || "(empty)"}`;
  } catch {
    return "(issue context unavailable)";
  }
}

function makeDirect(name: DirectName): TriageProvider {
  const preset = PRESETS[name];
  return {
    name,
    model: process.env.TRIAGE_MODEL || preset.defaultModel,
    async triage(input: TriageInput): Promise<TriageResult> {
      const t0 = Date.now();
      const provider = this as TriageProvider;
      const apiKey = process.env[preset.keyEnv];
      if (!apiKey) {
        throw Object.assign(
          new Error(`Direct ${name} path needs ${preset.keyEnv}.`),
          { status: 501, code: "not_wired" }
        );
      }
      const res = await fetch(`${preset.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(name === "openrouter"
            ? {
                "HTTP-Referer": "https://github.com/Deepjyoti-Sarmah",
                "X-Title": "TriagePilot",
              }
            : {}),
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: "system", content: loadPrompt(input.repo) },
            {
              role: "user",
              content:
                `Repo: ${input.repo}\nURL: ${input.issue_url}\n` +
                (await issueContext(input)),
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) {
        throw Object.assign(
          new Error(`Direct ${name} call failed with ${res.status}.`),
          { status: 502, code: "provider_error" }
        );
      }
      const data = await res.json().catch(() => null);
      const text: string = data?.choices?.[0]?.message?.content ?? "";
      let parsedJson: unknown = null;
      try {
        parsedJson = extractJson(text);
      } catch {
        parsedJson = null;
      }
      // Classify-only contract: force human review below the direct gate (0.8).
      // repo is routing context, never model output: inject server-side.
      const withRepo =
        parsedJson && typeof parsedJson === "object"
          ? { ...parsedJson, repo: input.repo }
          : parsedJson;
      const checked = TriageOutput.safeParse(withRepo);
      const output = checked.success
        ? {
            ...checked.data,
            duplicate_of: null,
            needs_human: checked.data.needs_human || checked.data.confidence < 0.8,
          }
        : holdForHuman(input.repo, "model output broke the contract");
      return {
        output,
        meta: {
          provider: name,
          model: provider.model,
          mode: "live-classify",
          latency_ms: Date.now() - t0,
        },
      };
    },
  };
}

export const openrouterProvider: TriageProvider = makeDirect("openrouter");
export const openaiProvider: TriageProvider = makeDirect("openai");
