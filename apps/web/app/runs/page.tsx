import { mockRuns } from "@/lib/mock";
import { Eyebrow, Pill } from "@/components/ui";

export const dynamic = "force-dynamic";

type Run = {
  run_id: string;
  repo: string;
  input_url: string;
  issue_type: string;
  severity: string;
  confidence: number;
  latency_ms: number;
  approved_by: string | null;
};

async function loadRuns(): Promise<{ runs: Run[]; live: boolean }> {
  // Live path (D4): read Tables `runs` via AP_API_KEY. Until keys exist,
  // fall back to deterministic mock rows so the page is reviewable keyless.
  if (process.env.AP_API_KEY && process.env.AP_PROJECT_ID) {
    return { runs: [], live: true };
  }
  return { runs: mockRuns() as Run[], live: false };
}

function avgConf(runs: Run[]) {
  if (!runs.length) return "—";
  return (runs.reduce((a, r) => a + r.confidence, 0) / runs.length).toFixed(2);
}

function avgLatency(runs: Run[]) {
  if (!runs.length) return "—";
  const ms = runs.reduce((a, r) => a + r.latency_ms, 0) / runs.length;
  return `${(ms / 1000).toFixed(1)}s`;
}

function approvalRate(runs: Run[]) {
  if (!runs.length) return "—";
  return `${Math.round(
    (runs.filter((r) => r.approved_by).length / runs.length) * 100
  )}%`;
}

export default async function RunsPage() {
  const { runs, live } = await loadRuns();
  const stats: Array<[string, string, string]> = [
    ["Strips filed", String(runs.length), "this demo window"],
    ["Avg confidence", avgConf(runs), "gate at 0.70"],
    ["Avg handle time", avgLatency(runs), "p95 target 60s"],
    ["Stamped", approvalRate(runs), "human in the loop"],
  ];

  return (
    <div className="pt-10">
      <Eyebrow>Filed strips · audit log</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          The log
        </h1>
        {!live && <Pill tone="warn">mock feed</Pill>}
      </div>

      {!live && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          missing_config — showing filed demo strips. Connect{" "}
          <code className="font-mono">AP_API_KEY</code> to read the live Tables{" "}
          <code className="font-mono">runs</code>.
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {stats.map(([label, big, sub]) => (
          <div key={label} className="bg-panel px-5 py-4">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-500">
              {label}
            </div>
            <div className="mt-1 font-display text-3xl font-bold">{big}</div>
            <div className="mt-0.5 text-[13px] text-slate-500">{sub}</div>
          </div>
        ))}
      </div>

      {/* strip bay */}
      <div className="mt-6 space-y-3">
        {runs.map((r, i) => (
          <div
            key={r.run_id}
            className={`strip-paper flex items-stretch overflow-hidden rounded-md shadow-[0_16px_44px_-20px_rgb(0_0_0/0.85)] ${
              i % 2 === 0 ? "-rotate-[0.25deg]" : "rotate-[0.25deg]"
            }`}
          >
            <div className="strip-holes w-3 shrink-0 opacity-80" aria-hidden />
            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-5 gap-y-1 px-4 py-3 sm:grid-cols-[130px_1fr_auto_auto_auto]">
              <span className="font-mono text-[13px] font-bold text-lime-950">
                {r.run_id}
              </span>
              <span className="col-span-2 truncate font-mono text-[13px] sm:col-span-1">
                {r.repo}
              </span>
              <span className="font-mono text-[13px] font-bold uppercase">
                {r.issue_type}
                <span
                  className={`ml-2 ${
                    r.severity === "P0" || r.severity === "P1"
                      ? "text-red-800"
                      : "text-black/60"
                  }`}
                >
                  {r.severity}
                </span>
              </span>
              <span className="font-mono text-xs text-black/60 tabular-nums">
                {(r.confidence * 100).toFixed(0)}% ·{" "}
                {(r.latency_ms / 1000).toFixed(1)}s
              </span>
              <span className="font-mono text-xs font-bold text-black/70">
                {r.approved_by ? `✓ ${r.approved_by}` : "○ HOLD"}
              </span>
            </div>
            <div className="strip-holes w-3 shrink-0 opacity-80" aria-hidden />
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500">
        Earnings sim (Gravity narrative): strips × 21.27% share tracked in
        Tables <code className="font-mono text-[13px]">earnings_sim</code> once
        live.
      </p>
    </div>
  );
}
