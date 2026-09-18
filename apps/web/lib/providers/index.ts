import type { TriageProvider } from "./types";
import { mockProvider } from "./mock";
import { activepiecesProvider } from "./activepieces";
import { openrouterProvider, openaiProvider } from "./direct";

const REGISTRY: Record<string, TriageProvider> = {
  mock: mockProvider,
  activepieces: activepiecesProvider,
  openrouter: openrouterProvider,
  openai: openaiProvider,
};

export const PROVIDER_NAMES = Object.keys(REGISTRY);

function apConfigured(): boolean {
  // Webhook is the only live requirement (OAuth MCP has no static token).
  return Boolean(process.env.AP_FLOW_WEBHOOK_URL);
}

/** Resolve provider from TRIAGE_PROVIDER, with safe documented defaults. */
export function resolveProvider(): TriageProvider {
  const raw = (process.env.TRIAGE_PROVIDER || "").trim().toLowerCase();
  if (!raw) return apConfigured() ? activepiecesProvider : mockProvider;
  const found = REGISTRY[raw];
  if (!found) {
    throw Object.assign(
      new Error(
        `Unknown TRIAGE_PROVIDER "${raw}". Known: ${PROVIDER_NAMES.join(", ")}.`
      ),
      { status: 400, code: "unknown_provider" }
    );
  }
  return found;
}
