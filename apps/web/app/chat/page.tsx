"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { REPOS } from "@/lib/repos";
import {
  Eyebrow,
  Card,
  Pill,
  Meter,
  Field,
  inputCls,
  PrimaryButton,
} from "@/components/ui";

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

const EXAMPLES = [
  ["activepieces/activepieces", "15626", "subflow INTERNAL_ERROR"],
  ["activepieces/activepieces", "15623", "template import 500"],
  ["Deepjyoti-Sarmah/VibeCode", "new?template=syn-clerk-loop", "Clerk loop"],
];

function severityTone(s: string): "bad" | "warn" | "neutral" {
  if (s === "P0" || s === "P1") return "bad";
  if (s === "P2") return "warn";
  return "neutral";
}

function TriageConsole() {
  const params = useSearchParams();
  const initialRepo = params.get("repo") ?? REPOS[0].id;
  const [repo, setRepo] = useState(
    REPOS.some((r) => r.id === initialRepo) ? initialRepo : REPOS[0].id
  );
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

  return (
    <div className="grid gap-5 pt-10 lg:grid-cols-[380px_1fr]">
      {/* console */}
      <div>
        <Eyebrow>Triage console</Eyebrow>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
          Run a verdict
        </h1>
        <Card className="mt-5 space-y-4 p-5">
          <Field label="Repository">
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
          </Field>
          <Field label="Issue URL">
            <input
              value={issueUrl}
              onChange={(e) => setIssueUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/issues/123"
              className={`${inputCls} font-mono text-[13px]`}
              spellCheck={false}
            />
          </Field>
          <PrimaryButton onClick={run} disabled={loading}>
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0c1005]/30 border-t-[#0c1005]" />
                Agent reasoning…
              </>
            ) : (
              "Run triage →"
            )}
          </PrimaryButton>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
              Try one
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(([r, n, label]) => (
                <button
                  key={`${r}#${n}`}
                  onClick={() => {
                    setRepo(r);
                    setIssueUrl(`https://github.com/${r}/issues/${n}`);
                  }}
                  className="rounded-full border border-line bg-white/[0.02] px-3 py-1 font-mono text-xs text-slate-400 transition hover:border-lime/40 hover:text-lime"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* verdict */}
      <div className="pt-0 lg:pt-[76px]">
        {verdict?.mode === "mock" && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
            MOCK mode — deterministic demo output in the exact live shape.
          </div>
        )}
        {verdict?.error && !out && (
          <Card className="p-6">
            <strong className="font-mono">{verdict.error}</strong>
            <p className="mt-1 text-slate-400">{verdict.message}</p>
          </Card>
        )}
        {!verdict && (
          <Card className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
            <div className="font-display text-6xl text-slate-700">?</div>
            <p className="mt-3 max-w-xs text-slate-500">
              Your verdict report lands here — type, severity, labels, duplicate
              check and a draft reply.
            </p>
          </Card>
        )}
        {out && (
          <Card className="reveal overflow-hidden p-0">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-raised/60 p-5">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
                  Triage report
                </p>
                <p className="mt-1 font-mono text-[13px] text-slate-300">
                  {verdict?.run_id}
                </p>
              </div>
              <span
                className={`stamp text-lg ${
                  out.severity === "P0" || out.severity === "P1"
                    ? "text-red-300"
                    : out.severity === "P2"
                      ? "text-amber-300"
                      : "text-slate-300"
                }`}
              >
                {out.severity}
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="lime">{out.issue_type}</Pill>
                {out.labels.map((l) => (
                  <Pill key={l}>{l}</Pill>
                ))}
                {out.needs_human ? (
                  <Pill tone="warn">needs human</Pill>
                ) : (
                  <Pill tone="ok">auto-ok</Pill>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Confidence
                  </p>
                  <div className="mt-1.5">
                    <Meter value={out.confidence} />
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Duplicate of
                  </p>
                  <p className="mt-1.5 font-mono text-sm text-slate-200">
                    {out.duplicate_of !== null ? `#${out.duplicate_of}` : "— none —"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    Gate
                  </p>
                  <p className="mt-1.5 font-mono text-sm text-slate-200">
                    {out.needs_human ? "approval required" : "auto-postable"}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border-l-2 border-lime bg-lime/[0.04] p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
                  Draft reply
                </p>
                <p className="mt-1.5 leading-relaxed text-slate-200">
                  {out.draft_reply}
                </p>
              </div>
              {out.needs_human && !approved ? (
                <PrimaryButton onClick={() => setApproved(true)}>
                  Approve reply ✓
                </PrimaryButton>
              ) : null}
              {approved && (
                <p className="text-sm text-slate-400">
                  Approved in demo. Live approval posts through the Cloud flow —
                  nothing self-posts, ever.
                </p>
              )}
              {!out.needs_human && (
                <p className="text-sm text-slate-500">
                  High-confidence verdict. In production this still logs to{" "}
                  <code className="font-mono text-[13px]">runs</code> for audit.
                </p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-slate-500">Loading console…</div>}>
      <TriageConsole />
    </Suspense>
  );
}
