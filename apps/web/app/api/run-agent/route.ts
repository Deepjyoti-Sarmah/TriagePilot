import { NextRequest, NextResponse } from "next/server";
import { RunAgentInput, TriageOutput, MISSING_CONFIG } from "@/lib/schema";
import { isKnownRepo } from "@/lib/repos";
import { resolveProvider } from "@/lib/providers";

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

  // Split backend (spec 008): forward to Python when configured,
  // otherwise serve the local TS registry (Vercel solo-deploy safe).
  const apiBase = (process.env.TRIAGE_API_URL || "").replace(/\/$/, "");
  if (apiBase) {
    try {
      const upstream = await fetch(`${apiBase}/api/run-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await upstream.json().catch(() => ({
        error: "provider_error",
        message: "Backend returned non-JSON.",
      }));
      return NextResponse.json(data, { status: upstream.status });
    } catch {
      return NextResponse.json(
        { error: "provider_error", message: "Backend unreachable." },
        { status: 502 }
      );
    }
  }

  if (!isKnownRepo(repo)) {
    return NextResponse.json(
      {
        error: "unknown_repo",
        message: `Repo not in registry. Known: activepieces/activepieces + 3 seed repos.`,
      },
      { status: 400 }
    );
  }

  let provider;
  try {
    provider = resolveProvider();
  } catch (e) {
    const err = e as Error & { status?: number; code?: string };
    return NextResponse.json(
      { error: err.code ?? "unknown_provider", message: err.message },
      { status: err.status ?? 400 }
    );
  }

  try {
    const { output, meta } = await provider.triage({
      repo,
      issue_url,
      title: parsed.data.title,
      body: parsed.data.body,
    });
    const checked = TriageOutput.parse(output);
    return NextResponse.json({
      ...(meta.mode === "mock" ? MISSING_CONFIG : {}),
      mode: meta.mode,
      run_id: `${meta.provider}-${Date.now()}`,
      output: checked,
      meta,
    });
  } catch (e) {
    const err = e as Error & { status?: number; code?: string };
    return NextResponse.json(
      {
        error: err.code ?? "provider_error",
        message: err.message,
        meta: { provider: provider.name, model: provider.model },
      },
      { status: err.status ?? 502 }
    );
  }
}
