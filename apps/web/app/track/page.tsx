"use client";

import { useState } from "react";
import {
  Eyebrow, Card, Field, inputCls, PrimaryButton,
} from "@/components/ui";
import { IssueTable, type Issue, type VerdictState } from "@/components/track-table";

export default function TrackPage() {
  const [repo, setRepo] = useState("activepieces/activepieces");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [done, setDone] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [verdicts, setVerdicts] = useState<Record<number, VerdictState>>({});

  async function load() {
    setLoading(true);
    setErr(null);
    setIssues([]);
    setVerdicts({});
    setDone(0);
    try {
      const res = await fetch(
        `/api/repo-issues?repo=${encodeURIComponent(repo)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      setIssues(data.issues ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }

  async function triageRow(issue: Issue): Promise<boolean> {
    setVerdicts((v) => ({ ...v, [issue.number]: { status: "working" } }));
    try {
      const res = await fetch("/api/run-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo,
          issue_url: issue.html_url,
          title: issue.title,
          body: issue.body,
        }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setVerdicts((v) => ({
          ...v, [issue.number]: { status: "idle" },
        }));
        return false; // halt bulk on rate limit
      }
      if (!res.ok || !data.output) throw new Error(data.message || "Failed.");
      const o = data.output;
      setVerdicts((v) => ({
        ...v,
        [issue.number]: {
          status: "done", issue_type: o.issue_type, severity: o.severity,
        },
      }));
      return true;
    } catch {
      setVerdicts((v) => ({
        ...v, [issue.number]: { status: "error", note: "failed" },
      }));
      return true;
    }
  }

  async function categorizeAll() {
    setBulk(true);
    let n = 0;
    for (const issue of issues) {
      if (verdicts[issue.number]?.status === "done") {
        n += 1;
        setDone(n);
        continue;
      }
      const ok = await triageRow(issue);
      n += 1;
      setDone(n);
      if (!ok) {
        setErr("Rate limited — stopping. Re-run to continue where it left off.");
        break;
      }
    }
    setBulk(false);
  }

  return (
    <div className="pt-8">
      <Eyebrow>Backlog tracker</Eyebrow>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Track a repo
      </h1>
      <Card className="mt-4 p-4">
        <div className="flex flex-wrap items-end gap-2.5">
          <div className="min-w-56 flex-1">
            <Field label="Repository or URL">
              <input
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void load();
                }}
                placeholder="activepieces/activepieces"
                className={`${inputCls} font-mono text-[13px]`}
                spellCheck={false}
              />
            </Field>
          </div>
          <PrimaryButton onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Load issues"}
          </PrimaryButton>
          {issues.length > 0 && (
            <button
              onClick={categorizeAll}
              disabled={bulk}
              className="rounded-md border border-line px-4 py-2 text-sm text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:opacity-60"
            >
              {bulk ? `Categorizing ${done}/${issues.length}…` : "Categorize all"}
            </button>
          )}
        </div>
        {err && <p className="mt-2.5 text-[13px] text-amber-300">{err}</p>}
      </Card>

      {issues.length > 0 && (
        <div className="mt-4">
          <IssueTable
            issues={issues}
            verdicts={verdicts}
            busy={bulk}
            onTriage={triageRow}
          />
        </div>
      )}
      <p className="mt-3 text-[13px] text-zinc-400">
        Titles open on GitHub in a new tab. Triage runs inline content —
        read-only, nothing posts back.
      </p>
    </div>
  );
}
