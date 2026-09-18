import type { TriageOutput } from "../schema";

export type TriageInput = {
  repo: string;
  issue_url: string;
  /** Inline content (synthetic eval rows). Skips the GitHub fetch when set. */
  title?: string;
  body?: string;
};

export type RunMeta = {
  provider: string;
  model: string;
  /** mock | live-agent | live-classify */
  mode: "mock" | "live-agent" | "live-classify";
  latency_ms: number;
};

export type TriageResult = {
  output: TriageOutput;
  meta: RunMeta;
};

/** Every backend provider implements this. Swap by env, never by rewrite. */
export interface TriageProvider {
  /** stable id, also the TRIAGE_PROVIDER value + meta.provider */
  readonly name: string;
  /** model id for meta + logging, e.g. "qwen/qwen3.8-27b:free" */
  readonly model: string;
  triage(input: TriageInput): Promise<TriageResult>;
}
