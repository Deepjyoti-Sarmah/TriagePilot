import { NextRequest, NextResponse } from "next/server";

/** Proxy to Python (spec 008 pattern); direct GitHub call when solo. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const repo = q.get("repo") ?? "";
  const qs = new URLSearchParams({
    repo,
    state: q.get("state") ?? "open",
    per_page: q.get("per_page") ?? "15",
  });

  const apiBase = (process.env.TRIAGE_API_URL || "").replace(/\/$/, "");
  if (apiBase) {
    try {
      const upstream = await fetch(`${apiBase}/api/repo-issues?${qs}`, {
        cache: "no-store",
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

  // Solo path: same contract, direct GitHub call, PAT-gated like Python.
  const token = process.env.GITHUB_PAT || "";
  if (!token) {
    return NextResponse.json(
      { error: "not_wired", message: "Issue listing needs GITHUB_PAT." },
      { status: 501 }
    );
  }
  const m =
    repo.match(/github\.com\/([^/]+\/[^/]+)/) ||
    (/^[^/\s]+\/[^/\s]+$/.test(repo.trim()) ? [null, repo.trim()] : null);
  if (!m) {
    return NextResponse.json(
      {
        error: "invalid_input",
        message: "repo must be owner/name or a github.com repo URL.",
      },
      { status: 400 }
    );
  }
  const res = await fetch(
    `https://api.github.com/repos/${m[1]}/issues?${new URLSearchParams({
      state: "open",
      per_page: "15",
      sort: "updated",
      direction: "desc",
    })}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );
  if (!res.ok) {
    return NextResponse.json(
      { error: "provider_error", message: `GitHub returned ${res.status}.` },
      { status: 502 }
    );
  }
  const items = (await res.json()) as Array<Record<string, unknown>>;
  return NextResponse.json({
    repo: m[1],
    count: items.length,
    issues: items.map((it) => ({
      number: it.number,
      title: it.title ?? "",
      state: it.state ?? "",
      labels: ((it.labels as Array<{ name?: string }>) ?? []).map((l) =>
        typeof l === "string" ? l : (l.name ?? "")
      ),
      updated_at: it.updated_at ?? "",
      html_url: it.html_url ?? "",
      is_pull_request: Boolean(it.pull_request),
      body: String(it.body ?? "").slice(0, 1500),
    })),
  });
}
