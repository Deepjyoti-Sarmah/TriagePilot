"use client";

import { Card, Pill, Meter, CopyButton, PrimaryButton } from "@/components/ui";
import type { Verdict } from "@/lib/triage";

function sevTone(s: string): "bad" | "warn" | "neutral" {
  if (s === "P0" || s === "P1") return "bad";
  if (s === "P2") return "warn";
  return "neutral";
}

type Props = {
  verdict: Verdict | null;
  tab: "verdict" | "json";
  setTab: (t: "verdict" | "json") => void;
  approved: boolean;
  onApprove: () => void;
};

/** Middle column: mock banner, error/empty states, verdict + JSON tabs. */
export function VerdictPanel({ verdict, tab, setTab, approved, onApprove }: Props) {
  const out = verdict?.output;
  const rawJson = verdict ? JSON.stringify(verdict, null, 2) : "";

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
          Result
        </p>
        {out && (
          <div className="flex rounded-md border border-line p-0.5 text-xs">
            {(["verdict", "json"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded px-2.5 py-1 font-mono transition ${
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {t === "json" ? "raw JSON" : "verdict"}
              </button>
            ))}
          </div>
        )}
      </div>

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
          <p className="font-mono text-sm text-zinc-500">
            No run yet — paste a URL and hit <span className="kbd">⌘↵</span>
          </p>
        </Card>
      )}
      {out && tab === "verdict" && (
        <VerdictCard
          out={out}
          runId={verdict?.run_id}
          approved={approved}
          onApprove={onApprove}
        />
      )}
      {out && tab === "json" && (
        <div className="reveal overflow-hidden rounded-lg border border-line bg-black">
          <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
            <span className="font-mono text-[11px] text-zinc-500">
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
  );
}

function VerdictCard({
  out,
  runId,
  approved,
  onApprove,
}: {
  out: NonNullable<Verdict["output"]>;
  runId?: string;
  approved: boolean;
  onApprove: () => void;
}) {
  return (
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
      <MetaGrid out={out} runId={runId} />
      <div className="mt-3 border-t border-line pt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
            Draft reply
          </p>
          <CopyButton text={out.draft_reply} />
        </div>
        <p className="text-sm leading-relaxed text-zinc-200">{out.draft_reply}</p>
      </div>
      <div className="mt-3 flex items-center gap-2.5 border-t border-line pt-3">
        {out.needs_human && !approved ? (
          <PrimaryButton onClick={onApprove}>Approve reply</PrimaryButton>
        ) : null}
        {approved && <Pill tone="ok">approved ✓</Pill>}
        <span className="text-xs text-zinc-500">
          {approved
            ? "Live post goes via the Cloud flow."
            : "Nothing self-posts, ever."}
        </span>
      </div>
    </Card>
  );
}

function MetaGrid({
  out,
  runId,
}: {
  out: NonNullable<Verdict["output"]>;
  runId?: string;
}) {
  return (
    <div className="mt-3 grid gap-2.5 border-t border-line pt-3 sm:grid-cols-3">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Confidence
        </p>
        <div className="mt-1">
          <Meter value={out.confidence} />
        </div>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Duplicate of
        </p>
        <p className="mt-1 font-mono text-sm">
          {out.duplicate_of !== null ? `#${out.duplicate_of}` : "—"}
        </p>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-400">
          Run
        </p>
        <p className="mt-1 truncate font-mono text-sm text-zinc-400">{runId}</p>
      </div>
    </div>
  );
}
