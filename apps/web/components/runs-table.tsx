"use client";

import { useMemo, useState } from "react";
import { Pill, inputCls } from "@/components/ui";

export type Run = {
  run_id: string;
  repo: string;
  input_url: string;
  issue_type: string;
  severity: string;
  confidence: number;
  latency_ms: number;
  approved_by: string | null;
};

function sevTone(s: string): "bad" | "warn" | "neutral" {
  if (s === "P0" || s === "P1") return "bad";
  if (s === "P2") return "warn";
  return "neutral";
}

export function RunsTable({ runs }: { runs: Run[] }) {
  const [repoQ, setRepoQ] = useState("");
  const [sev, setSev] = useState("all");
  const [typeQ, setTypeQ] = useState("all");

  const repos = useMemo(
    () => [...new Set(runs.map((r) => r.repo))],
    [runs]
  );
  const types = useMemo(
    () => [...new Set(runs.map((r) => r.issue_type))],
    [runs]
  );

  const filtered = runs.filter(
    (r) =>
      (!repoQ || r.repo === repoQ) &&
      (sev === "all" || r.severity === sev) &&
      (typeQ === "all" || r.issue_type === typeQ)
  );

  return (
    <div>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <select
          value={repoQ}
          onChange={(e) => setRepoQ(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
        >
          <option value="">all repos</option>
          {repos.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={sev}
          onChange={(e) => setSev(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
        >
          <option value="all">all severities</option>
          {["P0", "P1", "P2", "P3"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={typeQ}
          onChange={(e) => setTypeQ(e.target.value)}
          className={`${inputCls} font-mono text-xs`}
        >
          <option value="all">all types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-line bg-raised/60 text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-medium">run</th>
                <th className="px-3 py-2.5 font-medium">repo</th>
                <th className="px-3 py-2.5 font-medium">verdict</th>
                <th className="px-3 py-2.5 font-medium">conf</th>
                <th className="px-3 py-2.5 font-medium">latency</th>
                <th className="px-4 py-2.5 font-medium">approved</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.run_id}
                  className="border-b border-line/50 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-2.5 font-mono text-[13px] text-lime">
                    {r.run_id}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-[13px] text-zinc-300">
                    {r.repo}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="mr-2">{r.issue_type}</span>
                    <Pill tone={sevTone(r.severity)}>{r.severity}</Pill>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums">
                    {r.confidence.toFixed(2)}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[13px] tabular-nums text-zinc-400">
                    {(r.latency_ms / 1000).toFixed(1)}s
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[13px] text-zinc-400">
                    {r.approved_by ? `✓ ${r.approved_by}` : "—"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-zinc-400">
                    No runs match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 font-mono text-xs text-zinc-500">
        {filtered.length}/{runs.length} runs
      </p>
    </div>
  );
}
