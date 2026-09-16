"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  CopyButton,
} from "@/components/ui";
import {
  loadRecent,
  saveRecent,
  type RecentRun,
} from "@/lib/history";

type Output = {
  issue_type: string;
  severity: string;
  confidence: number;
  duplicate_of: number | null;
  labels: string[];
  draft_reply: string;
  needs_human: boolean;
};

type Verdict = {
  mode?: string;
  error?: string;
  run_id?: string;
  message?: string;
  output?: Output;
};

const EXAMPLES = [
  ["activepieces/activepieces", "15626", "AP#15626"],
  ["activepieces/activepieces", "15623", "AP#15623"],
  ["Deepjyoti-Sarmah/VibeCode", "new?template=syn-clerk-loop", "VC clerk loop"],
];

function sevTone(s: string): "bad" | "warn" | "neutral" {
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
  const [tab, setTab] = useState<"verdict" | "json">("verdict");
  const [approved, setApproved] = useState(false);
  const [recent, setRecent] = useState<RecentRun[]>([]);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  // "/" focuses input, "⌘/Ctrl+Enter" runs, Esc blurs.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        urlRef.current?.focus();
        urlRef.current?.select();
      } else if (e.key === "Escape" && typing) {
        (e.target as HTMLElement).blur();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repo, issueUrl, loading]);

  async function run() {
    if (loading) return;
    setLoading(true);
    setApproved(false);
    setTab("verdict");
    setVerdict(null);
    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo, issue_url: issueUrl }),
      });
      const data: Verdict = await res.json();
      setVerdict(data);
      if (data.output) {
        setRecent(
          saveRecent({
            run_id: data.run_id ?? `local-${Date.now()}`,
            repo,
            issue_url: issueUrl,
            issue_type: data.output.issue_type,
            severity: data.output.severity,
            confidence: data.output.confidence,
            ts: Date.now(),
          })
        );
      }
    } catch {
      setVerdict({ error: "network_error", message: "Request failed." });
    } finally {
      setLoading(false);
    }
  }

  const out = verdict?.output;
  const rawJson = verdict ? JSON.stringify(verdict, null, 2) : "";

  return (
    <div className="grid gap-6 pt-8 lg:grid-cols-[340px_minmax(0,1fr)_220px]">
      {/* input */}
      <div>
        <Eyebrow>Triage</Eyebrow>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New run</h1>
        <Card className="mt-4 space-y-4 p-4">
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
          <Field
            label="Issue URL"
            hint={
              <>
                <span className="kbd">/</span> to focus
              </>
            }
          >
            <input
              ref={urlRef}
              value={issueUrl}
              onChange={(e) => setIssueUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void run();
              }}
              placeholder="https://github.com/owner/repo/issues/123"
              className={`${inputCls} font-mono text-[13px]`}
              spellCheck={false}
            />
          </Field>
          <PrimaryButton onClick={run} disabled={loading}>
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
                Running…
              </>
            ) : (
              <>
                Run triage <span className="kbd !border-zinc-700">⌘↵</span>
              </>
            )}
          </PrimaryButton>
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-600">
              Examples
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map(([r, n, label]) => (
                <button
                  key={`${r}#${n}`}
                  onClick={() => {
                    setRepo(r);
                    setIssueUrl(`https://github.com/${r}/issues/${n}`);
                  }}
                  className="rounded-md border border-line px-2 py-1 font-mono text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* result */}
      <div className="min-w-0">
        <div className="flex h-[52px] items-end justify-between">
          <Eyebrow>Result</Eyebrow>
          {out && (
            <div className="flex rounded-md border border-line p-0.5 text-xs">
              {(["verdict", "json"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded px-2.5 py-1 font-mono transition ${
                    tab === t
                      ? "bg-white/10 text-white"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {t === "json" ? "raw JSON" : "verdict"}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          {verdict?.mode === "mock" && (
            <div className="mb-3 rounded-md border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-[13px] text-amber-200/90">
              MOCK feed — same shape the live agent returns.
            </div>
          )}
          {verdict?.error && !out && (
            <Card className="p-4">
              <strong className="font-mono text-sm">{verdict.error}</strong>
              <p className="mt-1 text-sm text-zinc-400">{verdict.message}</p>
            </Card>
          )}
          {!verdict && (
            <Card className="border-dashed p-8 text-center">
              <p className="font-mono text-sm text-zinc-600">
                No run yet — paste a URL and hit <span className="kbd">⌘↵</span>
              </p>
            </Card>
          )}
          {out && tab === "verdict" && (
            <Card className="reveal p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold">{out.issue_type}</span>
                <Pill tone={sevTone(out.severity)}>{out.severity}</Pill>
                {out.labels.map((l) => (
                  <Pill key={l}>{l}</Pill>
                ))}
                <span className="ml-auto">
                  {out.needs_human ? (
                    <Pill tone="warn">needs human</Pill>
                  ) : (
                    <Pill tone="ok">auto-ok</Pill>
                  )}
                </span>
              </div>
              <div className="mt-3 grid gap-2.5 border-t border-line pt-3 sm:grid-cols-3">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                    Confidence
                  </p>
                  <div className="mt-1">
                    <Meter value={out.confidence} />
                  </div>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                    Duplicate of
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {out.duplicate_of !== null ? `#${out.duplicate_of}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                    Run
                  </p>
                  <p className="mt-1 truncate font-mono text-sm text-zinc-400">
                    {verdict?.run_id}
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">
                    Draft reply
                  </p>
                  <CopyButton text={out.draft_reply} />
                </div>
                <p className="text-sm leading-relaxed text-zinc-200">
                  {out.draft_reply}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
                {out.needs_human && !approved ? (
                  <PrimaryButton onClick={() => setApproved(true)}>
                    Approve reply
                  </PrimaryButton>
                ) : null}
                {approved && <Pill tone="ok">approved ✓</Pill>}
                <span className="text-xs text-zinc-600">
                  {approved
                    ? "Live post goes via the Cloud flow."
                    : "Nothing self-posts, ever."}
                </span>
              </div>
            </Card>
          )}
          {out && tab === "json" && (
            <div className="reveal overflow-hidden rounded-lg border border-line bg-black">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
                <span className="font-mono text-[11px] text-zinc-600">
                  POST /api/run-agent → 200
                </span>
                <CopyButton text={rawJson} label="Copy JSON" />
              </div>
              <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed text-zinc-200">
                {rawJson}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* recent */}
      <div className="hidden lg:block">
        <div className="flex h-[52px] items-end">
          <Eyebrow>Recent</Eyebrow>
        </div>
        <div className="mt-4 space-y-1.5">
          {recent.length === 0 && (
            <p className="text-[13px] text-zinc-600">
              This browser&apos;s last 10 runs land here.
            </p>
          )}
          {recent.map((r) => (
            <button
              key={r.run_id}
              onClick={() => {
                setRepo(r.repo);
                setIssueUrl(r.issue_url);
                urlRef.current?.focus();
              }}
              className="block w-full rounded-md border border-transparent px-2.5 py-2 text-left transition hover:border-line hover:bg-white/[0.03]"
              title={r.issue_url}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-zinc-300">
                  {r.repo.split("/")[1] ?? r.repo} · {r.issue_type}
                </span>
                <span
                  className={`font-mono text-[11px] ${
                    r.severity === "P0" || r.severity === "P1"
                      ? "text-red-300"
                      : "text-zinc-500"
                  }`}
                >
                  {r.severity}
                </span>
              </div>
              <div className="mt-0.5 truncate font-mono text-[11px] text-zinc-600">
                {r.issue_url.replace("https://github.com/", "")}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="pt-8 text-sm text-zinc-600">Loading…</div>}>
      <TriageConsole />
    </Suspense>
  );
}
