"use client";

import { Eyebrow } from "@/components/ui";
import type { RecentRun } from "@/lib/history";

type Props = {
  recent: RecentRun[];
  onPick: (repo: string, issueUrl: string) => void;
};

/** Full-width recent-runs rail below the console. */
export function RecentRail({ recent, onPick }: Props) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-baseline justify-between">
        <Eyebrow>Recent in this browser</Eyebrow>
        <span className="font-mono text-[11px] text-zinc-500">
          {recent.length}/10 · click to reload
        </span>
      </div>
      {recent.length === 0 && (
        <p className="rounded-md border border-dashed border-line px-3 py-3 text-[13px] text-zinc-500">
          Your last 10 runs land here. Click any of them to reload it into the form.
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recent.map((r) => (
          <button
            key={r.run_id}
            onClick={() => onPick(r.repo, r.issue_url)}
            className="w-60 shrink-0 rounded-md border border-line bg-panel px-3 py-2.5 text-left transition hover:border-zinc-500"
            title={r.issue_url}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-xs text-zinc-200">
                {r.repo.split("/")[1] ?? r.repo} · {r.issue_type}
              </span>
              <span
                className={`shrink-0 font-mono text-[11px] ${
                  r.severity === "P0" || r.severity === "P1"
                    ? "text-red-300"
                    : "text-zinc-400"
                }`}
              >
                {r.severity}
              </span>
            </div>
            <div className="mt-1 truncate font-mono text-[11px] text-zinc-500">
              {r.issue_url.replace("https://github.com/", "")}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
