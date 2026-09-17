"use client";

import type { RefObject } from "react";
import { REPOS } from "@/lib/repos";
import { Card, Field, inputCls, PrimaryButton } from "@/components/ui";

const EXAMPLES = [
  ["activepieces/activepieces", "15626", "AP#15626"],
  ["activepieces/activepieces", "15623", "AP#15623"],
  ["Deepjyoti-Sarmah/VibeCode", "new?template=syn-clerk-loop", "VC clerk loop"],
];

type Props = {
  repo: string;
  setRepo: (v: string) => void;
  issueUrl: string;
  setIssueUrl: (v: string) => void;
  loading: boolean;
  onRun: () => void;
  urlRef: RefObject<HTMLInputElement | null>;
};

/** Left column: repo picker, URL input, run button, examples. */
export function TriageForm({
  repo, setRepo, issueUrl, setIssueUrl, loading, onRun, urlRef,
}: Props) {
  return (
    <Card className="space-y-4 p-4">
      <Field label="Repository">
        <select
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          className={inputCls}
        >
          {REPOS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Issue URL"
        hint={
          <>
            <span className="kbd">/</span> to focus
          </>
        }
      >
        <input
          ref={urlRef}
          value={issueUrl}
          onChange={(e) => setIssueUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRun();
          }}
          placeholder="https://github.com/owner/repo/issues/123"
          className={`${inputCls} font-mono text-[13px]`}
          spellCheck={false}
        />
      </Field>
      <PrimaryButton onClick={onRun} disabled={loading}>
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950" />
            Running…
          </>
        ) : (
          <>
            Run triage <span className="kbd !border-zinc-700">⌘↵</span>
          </>
        )}
      </PrimaryButton>
      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-400">
          Examples
        </p>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map(([r, n, label]) => (
            <button
              key={`${r}#${n}`}
              onClick={() => {
                setRepo(r);
                setIssueUrl(`https://github.com/${r}/issues/${n}`);
              }}
              className="rounded-md border border-line px-2 py-1 font-mono text-xs text-zinc-400 transition hover:border-zinc-500 hover:text-white"
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
