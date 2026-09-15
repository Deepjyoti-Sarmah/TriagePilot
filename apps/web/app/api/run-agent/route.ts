import { NextRequest, NextResponse } from "next/server";
import { RunAgentInput, TriageOutput, MISSING_CONFIG } from "@/lib/schema";
import { isKnownRepo } from "@/lib/repos";
import { mockTriage } from "@/lib/mock";

// Demo-only in-memory rate limit: 10 req/min/IP. Replace with Redis/Upstash in prod.
const hits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 10;
const WINDOW_MS = 60_000;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = hits.get(ip);
  if (!cur || now > cur.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.count += 1;
  return cur.count > LIMIT;
}

function isConfigured(): boolean {
  return Boolean(
    process.env.AP_API_KEY &&
      process.env.AP_PROJECT_ID &&
      process.env.AP_MCP_URL
  );
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "rate_limited", message: "10 requests/min/IP in demo." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = RunAgentInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { repo, issue_url } = parsed.data;

  if (!isKnownRepo(repo)) {
    return NextResponse.json(
      {
        error: "unknown_repo",
        message: `Repo not in registry. Known: activepieces/activepieces + 3 seed repos.`,
      },
      { status: 400 }
    );
  }

  // Live path (D4, needs keys): POST to the MCP-entry flow, return structured JSON.
  // Until keys exist we serve deterministic mock output in the exact same shape.
  if (!isConfigured()) {
    const output = TriageOutput.parse(mockTriage(repo, issue_url));
    return NextResponse.json({
      ...MISSING_CONFIG,
      mode: "mock",
      run_id: `mock-${Date.now()}`,
      output,
    });
  }

  // Placeholder for the live call — fails closed, never leaks keys to client.
  return NextResponse.json(
    { error: "not_wired", message: "Live MCP-entry call lands in D4." },
    { status: 501 }
  );
}
