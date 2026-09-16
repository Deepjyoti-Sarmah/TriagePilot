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

function callsign(repo: string, url: string) {
  const m = url.match(/github\.com\/([^/]+\/[^/]+)\/(issues|pull)\/([^\/?#]+)/);
  const short = m ? m[1].split("/")[1] ?? m[1] : repo;
  const num = m ? m[3].toUpperCase().slice(0, 14) : "???";
  const prefix = repo.startsWith("activepieces/")
    ? "AP"
    : short.slice(0, 2).toUpperCase();
  return `${prefix} · ${num}`;
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
    <div className="pt-10">
      <Eyebrow>Strip bay · file an issue</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
        Print a strip
      </h1>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[360px_1fr]">
      {/* console */}
      <div>
        <Card className="space-y-4 p-5">
          <Field label="Sector / repository">
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
          <Field label="Issue URL (callsign)">
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
                Tower reasoning…
              </>
            ) : (
              "File the strip →"
            )}
          </PrimaryButton>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
              On scope now
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
      <div>
        {verdict?.mode === "mock" && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
            MOCK feed — deterministic demo strips in the exact live shape.
          </div>
        )}
        {verdict?.error && !out && (
          <Card className="p-6">
            <strong className="font-mono">{verdict.error}</strong>
            <p className="mt-1 text-slate-400">{verdict.message}</p>
          </Card>
        )}
        {!verdict && (
          <div className="rounded-2xl border border-dashed border-line p-8 text-center">
            <div className="strip-paper mx-auto flex max-w-sm -rotate-1 items-stretch rounded-sm opacity-60">
              <div className="strip-holes w-3 shrink-0" aria-hidden />
              <div className="flex-1 px-4 py-6 text-center font-mono text-xs text-black/50">
                EMPTY HOLDER — FILE A STRIP TO BEGIN
              </div>
              <div className="strip-holes w-3 shrink-0" aria-hidden />
            </div>
            <p className="mx-auto mt-4 max-w-xs text-sm text-slate-500">
              The verdict strip prints here — callsign, stamp, confidence and a
              draft reply.
            </p>
          </div>
        )}
        {out && (
          <div className="reveal">
            {/* printed strip */}
            <div className="strip-paper flex items-stretch overflow-hidden rounded-md shadow-[0_24px_70px_-24px_rgb(0_0_0/0.9)]">
              <div className="strip-holes w-3.5 shrink-0 opacity-80" aria-hidden />
              <div className="min-w-0 flex-1 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-black/50">
                      Triage strip · {verdict?.run_id}
                    </p>
                    <p className="mt-0.5 font-mono text-xl font-bold tracking-tight">
                      {callsign(repo, issueUrl)}
                    </p>
                  </div>
                  <span
                    className={`stamp text-xl ${
                      out.severity === "P0" || out.severity === "P1"
                        ? "text-red-800"
                        : out.severity === "P2"
                          ? "text-amber-700"
                          : "text-black/70"
                    }`}
                  >
                    {out.severity} {out.issue_type.toUpperCase()}
                  </span>
                </div>
                <div className="tear-x my-3" />
                <div className="grid grid-cols-1 gap-2 font-mono text-xs min-[480px]:grid-cols-3 min-[480px]:gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/50">
                      Confidence
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {Math.round(out.confidence * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/50">
                      Duplicate
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {out.duplicate_of !== null ? `#${out.duplicate_of}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-black/50">
                      Gate
                    </p>
                    <p className="mt-1 text-sm font-bold">
                      {out.needs_human ? "HOLD" : "CLEAR"}
                    </p>
                  </div>
                </div>
                <div className="tear-x my-3" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-black/50">
                  Labels · {out.labels.join(" · ") || "—"}
                </p>
                <p className="mt-2 border-l-[3px] border-black/70 pl-3 text-[15px] leading-relaxed">
                  {out.draft_reply}
                </p>
              </div>
              <div className="strip-holes w-3.5 shrink-0 opacity-80" aria-hidden />
            </div>

            {/* controller actions */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {out.needs_human && !approved ? (
                <PrimaryButton onClick={() => setApproved(true)}>
                  Stamp approved ✓
                </PrimaryButton>
              ) : null}
              {approved && (
                <Pill tone="ok">approved — live post goes via Cloud flow</Pill>
              )}
              {!out.needs_human && (
                <span className="text-sm text-slate-500">
                  High-confidence strip. Still logged to{" "}
                  <code className="font-mono text-[13px]">runs</code> for audit.
                </span>
              )}
              <span className="font-mono text-xs text-slate-600">
                <Meter value={out.confidence} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="pt-10 text-slate-500">Loading bay…</div>}>
      <TriageConsole />
    </Suspense>
  );
}
