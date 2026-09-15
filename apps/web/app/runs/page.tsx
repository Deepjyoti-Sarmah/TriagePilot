import { mockRuns } from "@/lib/mock";
import { Eyebrow, Card, Pill } from "@/components/ui";

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
  const maxLatency = Math.max(...runs.map((r) => r.latency_ms), 1);
  const stats: Array<[string, string, string]> = [
    ["Total runs", String(runs.length), "this demo window"],
    ["Avg confidence", avgConf(runs), "gate at 0.70"],
    ["Avg latency", avgLatency(runs), "p95 target 60s"],
    ["Approval rate", approvalRate(runs), "human in the loop"],
  ];

  return (
    <div className="pt-10">
      <Eyebrow>Run history · audit trail</Eyebrow>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Runs
        </h1>
        {!live && <Pill tone="warn">mock data</Pill>}
      </div>

      {!live && (
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
          missing_config — showing mock runs. Connect{" "}
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

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
                <th className="px-5 py-3">run</th>
                <th className="px-3 py-3">repo</th>
                <th className="px-3 py-3">verdict</th>
                <th className="px-3 py-3">conf</th>
                <th className="px-3 py-3">latency</th>
                <th className="px-5 py-3">approved</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.run_id}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-3 font-mono text-[13px] text-lime">
                    {r.run_id}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-3 font-mono text-[13px] text-slate-300">
                    {r.repo}
                  </td>
                  <td className="px-3 py-3">
                    <span className="mr-2">{r.issue_type}</span>
                    <Pill
                      tone={
                        r.severity === "P0" || r.severity === "P1"
                          ? "bad"
                          : "neutral"
                      }
                    >
                      {r.severity}
                    </Pill>
                  </td>
                  <td className="px-3 py-3 font-mono text-[13px]">
                    {r.confidence.toFixed(2)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-lime/80"
                          style={{
                            width: `${(r.latency_ms / maxLatency) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-400">
                        {(r.latency_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-[13px] text-slate-400">
                    {r.approved_by ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-4 text-sm text-slate-500">
        Earnings sim (Gravity narrative): runs × 21.27% share tracked in Tables{" "}
        <code className="font-mono text-[13px]">earnings_sim</code> once live.
      </p>
    </div>
  );
}
