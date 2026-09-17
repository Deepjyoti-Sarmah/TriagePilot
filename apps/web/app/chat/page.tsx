"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eyebrow } from "@/components/ui";
import { useTriageRun } from "@/hooks/use-triage-run";
import { TriageForm } from "@/components/triage-form";
import { VerdictPanel } from "@/components/verdict-panel";
import { RecentRail } from "@/components/recent-rail";

function TriageConsole({ initialRepo }: { initialRepo: string | null }) {
  const t = useTriageRun(initialRepo);

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
  return <TriageConsole initialRepo={params.get("repo")} />;
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="pt-8 text-sm text-zinc-400">Loading…</div>}>
      <WithRepoParam />
    </Suspense>
  );
}
