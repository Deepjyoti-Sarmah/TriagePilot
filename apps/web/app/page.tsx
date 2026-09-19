import { Eyebrow, Card, Pill, GhostButton, CodeBlock } from "@/components/ui";
import { FEATURED, demoUrl } from "@/lib/demo";

const CURL = `curl -X POST $APP/api/run-agent \\
  -H 'Content-Type: application/json' \\
  -d '{"repo":"activepieces/activepieces",
       "issue_url":"https://github.com/activepieces/activepieces/issues/15626"}'

# → {"issue_type":"bug","severity":"P1","confidence":0.9,
#    "labels":["bug","area/flows"],"draft_reply":"…","needs_human":true}`;

const SECTORS: Array<[string, string, string]> = [
  ["activepieces/activepieces", "flagship · 428 open issues", "bug / piece-request / docs"],
  ["Deepjyoti-Sarmah/VibeCode", "ai builder · E2B + Clerk + Inngest", "bug / feature / question"],
  ["Deepjyoti-Sarmah/Invoice-Cart", "fintech · GST + PDF + Stripe", "bug / feature / docs"],
  ["Deepjyoti-Sarmah/symbolgraph", "devtools · MCP + tree-sitter", "bug / feature / docs"],
];

const STEPS: Array<[string, string]> = [
  ["POST an issue URL", "Any public repo works — no signup, no config. Only the Cloud agent path is scoped to onboarded repos."],
  ["Agent reasons", "12 tool steps on the Cloud path (knowledge base, memory, duplicate search) — or instant classify on the direct path."],
  ["You approve", "Confidence < 0.70, P0 or spam always holds for a human. Drafts post only on your click."],
];

export default function Home() {
  return (
    <div className="pt-10">
      <div className="reveal max-w-2xl">
        <Eyebrow>Maintainer agent console · any public repo</Eyebrow>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Triage for every repo,
          <br />
          from one endpoint.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-zinc-400">
          Paste a GitHub issue, get back type, severity, labels, duplicate
          check and a draft reply — as UI or JSON. Built for maintainers who
          live in terminals, not dashboards.
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          <a
            href="/chat"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white"
          >
            Open triage
          </a>
          <GhostButton href="/runs">Run history</GhostButton>
          <span className="inline-flex items-center gap-2 px-1 font-mono text-xs text-zinc-500">
            <span className="kbd">/</span> focuses input · <span className="kbd">⌘↵</span> runs
          </span>
        </div>
      </div>

      <div className="reveal mt-6 max-w-2xl" style={{ animationDelay: "90ms" }}>
        <CodeBlock code={CURL} />
      </div>

      <div className="mt-10">
        <Eyebrow>Live demos · real open issues</Eyebrow>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          One click loads a real open issue into triage. No signup, no config —
          verdict in seconds.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {FEATURED.map((d) => (
            <Card key={`${d.repo}#${d.number}`} className="p-4 transition-colors hover:border-zinc-500">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-500">
                    {d.repo}#{d.number}
                  </p>
                  <p className="mt-1 text-[15px] font-medium leading-snug">
                    {d.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-500">{d.hint}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2.5">
                <a
                  href={demoUrl(d)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-lime px-3.5 py-1.5 text-sm font-semibold text-[#0c1005] transition hover:brightness-110"
                >
                  Run triage →
                </a>
                <a
                  href={`https://github.com/${d.repo}/issues/${d.number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-md border border-line px-3.5 py-1.5 text-sm text-zinc-300 transition hover:border-zinc-500 hover:text-white"
                >
                  GitHub ↗
                </a>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        {STEPS.map(([title, body], i) => (
          <Card key={title} className="p-4">
            <p className="font-mono text-xs text-zinc-500">0{i + 1}</p>
            <h3 className="mt-1.5 text-[15px] font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{body}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <Eyebrow>Sectors</Eyebrow>
        <Card className="mt-3 overflow-hidden">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-line text-left font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5 font-medium">repo</th>
                <th className="px-4 py-2.5 font-medium">profile</th>
                <th className="px-4 py-2.5 font-medium">labels</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {SECTORS.map(([id, profile, labels]) => (
                <tr key={id} className="border-b border-line/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 font-mono text-[13px] text-zinc-100">{id}</td>
                  <td className="px-4 py-2.5 text-zinc-400">{profile}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-zinc-400">{labels}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a
                      href={`/chat?repo=${encodeURIComponent(id)}`}
                      className="font-mono text-xs text-zinc-400 hover:text-white hover:underline"
                    >
                      triage →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Pill tone="lime">80 eval rows</Pill>
          <Pill>type accuracy gate &gt; 0.8</Pill>
          <Pill>spam + duplicate edge cases</Pill>
          <span className="font-mono text-xs text-zinc-500">
            specs/001-maintainer-agent/evals/dataset.jsonl
          </span>
        </div>
      </div>
    </div>
  );
}
