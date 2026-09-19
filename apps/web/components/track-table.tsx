import { Card, Pill } from "@/components/ui";

export type Issue = {
  number: number;
  title: string;
  state: string;
  labels: string[];
  updated_at: string;
  html_url: string;
  is_pull_request: boolean;
  body: string;
};

export type VerdictState = {
  status: "idle" | "working" | "done" | "error";
  issue_type?: string;
  severity?: string;
  note?: string;
};

function sevTone(s: string): "bad" | "warn" | "neutral" {
  if (s === "P0" || s === "P1") return "bad";
  if (s === "P2") return "warn";
  return "neutral";
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - +new Date(iso)) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

type Props = {
  issues: Issue[];
  verdicts: Record<number, VerdictState>;
  busy: boolean;
  onTriage: (issue: Issue) => void;
};

/** Issue backlog table: click-out titles, inline verdict pills, per-row triage. */
export function IssueTable({ issues, verdicts, busy, onTriage }: Props) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-line bg-raised/60 text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">issue</th>
              <th className="px-3 py-2.5 font-medium">updated</th>
              <th className="px-3 py-2.5 font-medium">verdict</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {issues.map((it) => {
              const v = verdicts[it.number] ?? { status: "idle" as const };
              return (
                <tr
                  key={it.number}
                  className="border-b border-line/50 last:border-0 hover:bg-white/[0.02]"
                >
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-zinc-400">
                    #{it.number}
                    {it.is_pull_request && (
                      <span className="ml-1.5 text-[11px]">PR</span>
                    )}
                  </td>
                  <td className="max-w-[420px] px-3 py-2.5">
                    <a
                      href={it.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-100 hover:text-white hover:underline"
                    >
                      {it.title}
                    </a>
                    {it.labels.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {it.labels.slice(0, 4).map((l) => (
                          <span
                            key={l}
                            className="rounded bg-white/[0.05] px-1.5 py-px font-mono text-[11px] text-zinc-400"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-zinc-400">
                    {it.updated_at ? timeAgo(it.updated_at) : "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {v.status === "done" ? (
                      <>
                        <span className="mr-1.5">{v.issue_type}</span>
                        <Pill tone={sevTone(v.severity ?? "P3")}>
                          {v.severity}
                        </Pill>
                      </>
                    ) : v.status === "working" ? (
                      <span className="font-mono text-xs text-zinc-400">…</span>
                    ) : v.status === "error" ? (
                      <span className="font-mono text-xs text-red-300">failed</span>
                    ) : (
                      <span className="font-mono text-xs text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => onTriage(it)}
                      disabled={v.status === "working" || busy}
                      className="rounded-md border border-line px-2.5 py-1 font-mono text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-50"
                    >
                      Triage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
