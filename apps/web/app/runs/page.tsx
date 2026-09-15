import { mockRuns } from "@/lib/mock";

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

export default async function RunsPage() {
  const { runs, live } = await loadRuns();
  return (
    <div>
      <h1 className="text-2xl font-bold">Runs</h1>
      {!live && (
        <div className="mt-3 rounded-lg bg-amber-950 px-4 py-2.5 text-sm text-amber-300">
          missing_config — showing mock runs. Connect AP_API_KEY to read the
          live Tables `runs`.
        </div>
      )}
      <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-panel p-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-slate-400">
              <th className="pb-2 pr-2">run</th>
              <th className="pb-2 pr-2">repo</th>
              <th className="pb-2 pr-2">verdict</th>
              <th className="pb-2 pr-2">conf</th>
              <th className="pb-2 pr-2">latency</th>
              <th className="pb-2">approved</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.run_id} className="border-b border-line last:border-0">
                <td className="py-2 pr-2">{r.run_id}</td>
                <td className="py-2 pr-2">{r.repo}</td>
                <td className="py-2 pr-2">
                  {r.issue_type} / {r.severity}
                </td>
                <td className="py-2 pr-2">{r.confidence.toFixed(2)}</td>
                <td className="py-2 pr-2">
                  {(r.latency_ms / 1000).toFixed(1)}s
                </td>
                <td className="py-2">{r.approved_by ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-slate-400">
        Earnings sim (Gravity narrative): runs × 21.27% share tracked in Tables
        `earnings_sim` once live.
      </p>
    </div>
  );
}
