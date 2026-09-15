import { z } from "zod";

// Mirrors specs/001-maintainer-agent/contracts/output.schema.json
export const TriageOutput = z.object({
  repo: z.string(),
  issue_type: z.enum([
    "bug",
    "piece-request",
    "feature",
    "docs",
    "question",
    "spam",
    "duplicate",
  ]),
  severity: z.enum(["P0", "P1", "P2", "P3"]),
  confidence: z.number().min(0).max(1),
  duplicate_of: z.number().nullable(),
  labels: z.array(z.string()),
  draft_reply: z.string().min(10).max(2000),
  needs_human: z.boolean(),
});

export type TriageOutput = z.infer<typeof TriageOutput>;

export const RunAgentInput = z.object({
  repo: z.string().min(1).max(120),
  issue_url: z.string().url().max(500),
});

export const MISSING_CONFIG = {
  error: "missing_config",
  message:
    "Activepieces keys not configured. Running in MOCK mode with deterministic demo output.",
} as const;
