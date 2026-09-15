"use client";

import { useState } from "react";
import { REPOS } from "@/lib/repos";

type Verdict = {
  mode?: string;
  error?: string;
  run_id?: string;
  message?: string;
  output?: {
    issue_type: string;
    severity: string;
    confidence: number;
    duplicate_of: number | null;
    labels: string[];
    draft_reply: string;
    needs_human: boolean;
  };
};

function Pill({
  tone,
  children,
}: {
  tone?: "ok" | "warn" | "bad";
  children: React.ReactNode;
}) {
  const colors =
    tone === "ok"
      ? "bg-emerald-950 text-emerald-300"
      : tone === "warn"
        ? "bg-amber-950 text-amber-300"
        : tone === "bad"
          ? "bg-red-950 text-red-300"
          : "bg-slate-800 text-slate-200";
  return (
    <span
      className={`mr-2 inline-block rounded-full px-3 py-0.5 text-[13px] ${colors}`}
    >
      {children}
    </span>
  );
}

export default function ChatPage() {
  const [repo, setRepo] = useState(REPOS[0].id);
  const [issueUrl, setIssueUrl] = useState(
    "https://github.com/activepieces/activepieces/issues/15626"
  );
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [approved, setApproved] = useState(false);

  async function run() {
    setLoading(true);
    setApproved(false);
    setVerdict(null);
    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, issue_url: issueUrl }),
      });
      setVerdict(await res.json());
    } catch {
      setVerdict({ error: "network_error", message: "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  const out = verdict?.output;
  const inputCls =
    "min-w-56 flex-1 rounded-lg border border-line bg-[#0e1220] px-3 py-2.5 text-slate-100";

  return (
    <div>
      <h1 className="text-2xl font-bold">Chat — triage an issue</h1>
      <div className="mt-4 rounded-xl border border-line bg-panel p-5">
        <div className="flex flex-wrap gap-2.5">
          <select
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            className={inputCls}
          >
            {REPOS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          <input
            value={issueUrl}
            onChange={(e) => setIssueUrl(e.target.value)}
            placeholder="https://github.com/owner/repo/issues/123"
            className={inputCls}
          />
          <button
            onClick={run}
            disabled={loading}
            className="rounded-lg bg-blue-400 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading ? "Running…" : "Run triage"}
          </button>
        </div>
      </div>

      {verdict?.mode === "mock" && (
        <div className="mt-3 rounded-lg bg-amber-950 px-4 py-2.5 text-sm text-amber-300">
          MOCK mode — keys not configured. Shape matches the live agent output.
        </div>
      )}
      {verdict?.error && !out && (
        <div className="mt-3 rounded-xl border border-line bg-panel p-5">
          <strong>{verdict.error}</strong>
          <p className="text-slate-400">{verdict.message}</p>
        </div>
      )}
      {out && (
        <div className="mt-3 rounded-xl border border-line bg-panel p-5">
          <div className="mb-2.5">
            <Pill>{out.issue_type}</Pill>
            <Pill tone={out.severity === "P0" || out.severity === "P1" ? "bad" : undefined}>
              {out.severity}
            </Pill>
            <Pill>conf {out.confidence.toFixed(2)}</Pill>
            {out.needs_human ? (
              <Pill tone="warn">needs human</Pill>
            ) : (
              <Pill tone="ok">auto-ok</Pill>
            )}
          </div>
          <p>
            <strong>Labels:</strong> {out.labels.join(", ") || "—"}
          </p>
          {out.duplicate_of !== null && (
            <p>
              <strong>Duplicate of:</strong> #{out.duplicate_of}
            </p>
          )}
          <p className="mt-2">
            <strong>Draft reply:</strong>
          </p>
          <p className="text-slate-300">{out.draft_reply}</p>
          {out.needs_human && !approved ? (
            <button
              onClick={() => setApproved(true)}
              className="mt-3 rounded-lg bg-blue-400 px-4 py-2 font-bold text-slate-950"
            >
              Approve (demo — no post without Cloud)
            </button>
          ) : null}
          {approved && (
            <p className="mt-3 text-sm text-slate-400">
              Approved in demo. Live approval posts via the Cloud flow.
            </p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-slate-400">
              run_id: {verdict?.run_id}
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-line bg-[#0e1220] p-3 text-[13px]">
              {JSON.stringify(verdict, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
