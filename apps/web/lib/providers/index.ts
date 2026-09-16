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
  return Boolean(
    process.env.AP_API_KEY &&
      process.env.AP_PROJECT_ID &&
      process.env.AP_MCP_URL
  );
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
