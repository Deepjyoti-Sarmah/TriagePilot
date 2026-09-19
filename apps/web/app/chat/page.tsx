"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { useTriageRun } from "@/hooks/use-triage-run";
import { TriageForm } from "@/components/triage-form";
import { VerdictPanel } from "@/components/verdict-panel";
import { RecentRail } from "@/components/recent-rail";

function TriageConsole({
  initialRepo,
  initialIssueUrl,
}: {
  initialRepo: string | null;
  initialIssueUrl: string | null;
}) {
  const t = useTriageRun(initialRepo, initialIssueUrl);

  return (
    <div className="pt-8">
      <Eyebrow>Triage</Eyebrow>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">New run</h1>
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <TriageForm
          repo={t.repo}
          setRepo={t.setRepo}
          issueUrl={t.issueUrl}
          setIssueUrl={t.setIssueUrl}
          loading={t.loading}
          onRun={t.run}
          urlRef={t.urlRef}
        />
        <VerdictPanel
          verdict={t.verdict}
          tab={t.tab}
          setTab={t.setTab}
          approved={t.approved}
          onApprove={() => t.setApproved(true)}
        />
      </div>
      <RecentRail
        recent={t.recent}
        onPick={(repo, issueUrl) => {
          t.setRepo(repo);
          t.setIssueUrl(issueUrl);
          t.urlRef.current?.focus();
        }}
      />
    </div>
  );
}

function WithRepoParam() {
  const params = useSearchParams();
  const repo = params.get("repo");
  const issue = params.get("issue"); // "owner/name#number" from featured demos
  let issueUrl: string | null = null;
  const m = issue && issue.match(/^([^/]+\/[^/]+)#(\d+)$/);
  if (m) issueUrl = `https://github.com/${m[1]}/issues/${m[2]}`;
  return <TriageConsole initialRepo={repo} initialIssueUrl={issueUrl} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="pt-8 text-sm text-zinc-400">Loading…</div>}>
      <WithRepoParam />
    </Suspense>
  );
}
