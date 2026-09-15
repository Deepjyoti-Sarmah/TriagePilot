import { Eyebrow, Card, Pill, GhostButton } from "@/components/ui";

const STATS: Array<[string, string, string]> = [
  ["04", "repos", "one template, many trackers"],
  ["80", "eval rows", "20 labeled issues each"],
  ["~18s", "verdict", "type + severity + draft"],
  ["100%", "human-gated", "nothing posts itself"],
];

const STEPS = [
  {
    n: "01",
    title: "Paste an issue",
    body: "Any GitHub issue URL from a registered repo. The flow validates the repo before the agent ever wakes up.",
  },
  {
    n: "02",
    title: "The agent reasons",
    body: "gpt-4o with 12 tool steps: per-repo knowledge base, issues memory, GitHub duplicate search, sub-flows, web search.",
  },
  {
    n: "03",
    title: "You approve",
    body: "Low confidence, P0 or spam always routes to a human. The draft reply posts only on your click.",
  },
];

const REPO_CARDS = [
  {
    id: "activepieces/activepieces",
    tag: "flagship",
    blurb: "428 open issues. Template 500s, subflow races, piece-auth edge cases — the real triage firehose.",
    accent: "text-lime",
  },
  {
    id: "Deepjyoti-Sarmah/VibeCode",
    tag: "ai builder",
    blurb: "E2B timeouts, Clerk loops, stuck generations. Product bugs with user-facing urgency.",
    accent: "text-sky-300",
  },
  {
    id: "Deepjyoti-Sarmah/Invoice-Cart",
    tag: "fintech",
    blurb: "GST slabs, rupee glyphs in PDFs, Stripe webhooks. Money bugs get P1 by default.",
    accent: "text-amber-300",
  },
  {
    id: "Deepjyoti-Sarmah/symbolgraph",
    tag: "devtools",
    blurb: "MCP crashes, tree-sitter gaps, index invalidation. Terse, technical, exact.",
    accent: "text-emerald-300",
  },
];

// Honest counts from scripts/eval_report.py
const TYPE_BARS: Array<[string, number, string]> = [
  ["bug", 40, "bg-red-400/80"],
  ["feature", 11, "bg-sky-400/80"],
  ["question", 7, "bg-slate-400/80"],
  ["docs", 7, "bg-violet-400/80"],
  ["spam", 8, "bg-amber-400/80"],
  ["duplicate", 4, "bg-orange-400/80"],
  ["piece-request", 3, "bg-lime/80"],
];

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="pb-10 pt-14 sm:pt-20">
        <div className="reveal">
          <Eyebrow>Multi-repo maintainer agent · Activepieces + gpt-4o</Eyebrow>
        </div>
        <h1
          className="reveal mt-4 max-w-3xl font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Every issue,
          <br />
          triaged in <span className="text-lime">seconds.</span>
        </h1>
        <p
          className="reveal mt-5 max-w-xl text-lg leading-relaxed text-slate-400"
          style={{ animationDelay: "160ms" }}
        >
          TriagePilot reads a GitHub issue, searches the repo&apos;s docs and
          memory, checks for duplicates — then hands you a verdict and a draft
          reply. You stay the maintainer. It just does the sorting.
        </p>
        <div
          className="reveal mt-7 flex flex-wrap gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <a
            href="/chat"
            className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 font-display text-base font-semibold text-[#0c1005] transition hover:brightness-110 active:scale-[0.98]"
          >
            Triage an issue →
          </a>
          <GhostButton href="/runs">See run history</GhostButton>
        </div>

        {/* stat strip */}
        <div
          className="reveal mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4"
          style={{ animationDelay: "320ms" }}
        >
          {STATS.map(([big, label, sub]) => (
            <div key={label} className="bg-panel px-5 py-4">
              <div className="font-display text-3xl font-bold text-white">
                {big}
              </div>
              <div className="font-mono text-xs uppercase tracking-[0.16em] text-lime">
                {label}
              </div>
              <div className="mt-1 text-[13px] text-slate-500">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-10">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Flows route. The agent thinks. You decide.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card
              key={s.n}
              className="reveal group p-6 transition-colors hover:border-lime/30"
            >
              <div
                className="reveal font-mono text-sm text-slate-600"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {s.n}
              </div>
              <h3 className="mt-2 font-display text-xl font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-400">
                {s.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* SEED REPOS */}
      <section className="py-10">
        <Eyebrow>One template, four trackers</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Seed repos
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {REPO_CARDS.map((r) => (
            <Card key={r.id} className="p-6 transition-colors hover:border-lime/30">
              <div className="flex items-center justify-between gap-3">
                <code className="truncate font-mono text-[13px] text-slate-200">
                  {r.id}
                </code>
                <Pill tone="lime">{r.tag}</Pill>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-400">
                {r.blurb}
              </p>
              <a
                href={`/chat?repo=${encodeURIComponent(r.id)}`}
                className={`mt-4 inline-block font-mono text-[13px] ${r.accent} hover:underline`}
              >
                Triage in this repo →
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* EVAL BACKING */}
      <section className="py-10">
        <Eyebrow>Grounded, not vibes</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          80 labeled rows behind the demo
        </h2>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">
          Real open issues verified against the GitHub API, plus marked
          synthetic edge cases — spam, empty bodies, duplicate pairs — so the
          agent is tested where demos usually lie. Gate: type accuracy &gt;
          0.8 before anything ships.
        </p>
        <Card className="mt-6 p-6">
          <div className="space-y-2.5">
            {TYPE_BARS.map(([label, n, bar]) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-28 shrink-0 font-mono text-xs text-slate-400">
                  {label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${bar}`}
                    style={{ width: `${(n / 40) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono text-xs text-slate-300">
                  {n}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 font-mono text-xs text-slate-600">
            specs/001-maintainer-agent/evals/dataset.jsonl · source: github vs
            synthetic-edge marked per row
          </p>
        </Card>
      </section>
    </div>
  );
}
