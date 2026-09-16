import { mockRuns } from "@/lib/mock";
import { Eyebrow, Card, Pill } from "@/components/ui";
import { RunsTable, type Run } from "@/components/runs-table";

export const dynamic = "force-dynamic";

async function loadRuns(): Promise<{ runs: Run[]; live: boolean }> {
  // Live path (D4): read Tables `runs` via AP_API_KEY. Until keys exist,
  // fall back to deterministic mock rows so the page is reviewable keyless.
  if (process.env.AP_API_KEY && process.env.AP_PROJECT_ID) {
    return { runs: [], live: true };
  }
  return { runs: mockRuns() as Run[], live: false };
}

export default async function RunsPage() {
  const { runs, live } = await loadRuns();
  const avg = runs.length
    ? (runs.reduce((a, r) => a + r.confidence, 0) / runs.length).toFixed(2)
    : "—";
  const stats: Array<[string, string]> = [
    ["Runs", String(runs.length)],
    ["Avg confidence", avg],
    ["Held for human", String(runs.filter((r) => !r.approved_by).length)],
    ["Stamped", String(runs.filter((r) => r.approved_by).length)],
  ];

  return (
    <div className="pt-8">
      <Eyebrow>Audit log</Eyebrow>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
        {!live && <Pill tone="warn">mock feed</Pill>}
      </div>

      {!live && (
        <div className="mt-4 rounded-md border border-amber-400/25 bg-amber-400/[0.07] px-3 py-2 text-[13px] text-amber-200/90">
          missing_config — showing local runs. Connect{" "}
          <code className="font-mono">AP_API_KEY</code> to read the live Tables{" "}
          <code className="font-mono">runs</code>.
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line lg:grid-cols-4">
        {stats.map(([label, big]) => (
          <div key={label} className="bg-panel px-4 py-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              {label}
            </div>
            <div className="mt-0.5 font-mono text-2xl tabular-nums">{big}</div>
          </div>
        ))}
      </div>

      <Card className="mt-4 p-4">
        <RunsTable runs={runs} />
      </Card>
      <p className="mt-3 text-[13px] text-zinc-400">
        Earnings sim (Gravity narrative): runs × 21.27% share tracked in Tables{" "}
        <code className="font-mono text-xs">earnings_sim</code> once live.
      </p>
    </div>
  );
}
