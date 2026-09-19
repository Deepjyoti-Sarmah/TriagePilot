"use client";

import { useEffect, useRef, useState } from "react";
import { REPOS } from "@/lib/repos";
import type { Verdict } from "@/lib/triage";
import { loadRecent, saveRecent, type RecentRun } from "@/lib/history";

/** State machine for one triage run: form state, fetch, shortcuts, history. */
export function useTriageRun(
  initialRepo: string | null,
  initialIssueUrl: string | null = null
) {
  const looksLikeRepo = (r: string | null): r is string =>
    !!r && /^[^/\s]+\/[^/\s]+$/.test(r);
  const [repo, setRepo] = useState(
    looksLikeRepo(initialRepo) ? initialRepo : REPOS[0].id
  );
  const [issueUrl, setIssueUrl] = useState(
    initialIssueUrl && initialIssueUrl.startsWith("https://")
      ? initialIssueUrl
      : "https://github.com/activepieces/activepieces/issues/15626"
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

  return {
    repo, setRepo, issueUrl, setIssueUrl, loading,
    verdict, tab, setTab, approved, setApproved,
    recent, urlRef, run,
  };
}

export type TriageRun = ReturnType<typeof useTriageRun>;
