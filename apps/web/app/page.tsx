import { Eyebrow, Card, Pill, GhostButton, CodeBlock } from "@/components/ui";

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
  ["POST an issue URL", "Repo is validated against the registry before the agent wakes up. Unknown repo → 400, no LLM call."],
  ["Agent reasons", "gpt-4o, 12 tool steps: per-repo knowledge base, issues memory, duplicate search, sub-flows, web search."],
  ["You approve", "Confidence < 0.70, P0 or spam always holds for a human. Drafts post only on your click."],
];

export default function Home() {
  return (
    <div className="pt-10">
      <div className="reveal max-w-2xl">
        <Eyebrow>Maintainer agent console · Activepieces + gpt-4o</Eyebrow>
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
