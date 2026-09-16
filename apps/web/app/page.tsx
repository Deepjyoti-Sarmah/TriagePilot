import { Eyebrow, Card, Pill, GhostButton } from "@/components/ui";

const STATS: Array<[string, string, string]> = [
  ["04", "sectors", "one template, many trackers"],
  ["80", "eval strips", "20 labeled issues each"],
  ["~18s", "to verdict", "type + severity + draft"],
  ["100%", "human-gated", "nothing posts itself"],
];

const STEPS = [
  {
    n: "01",
    title: "File the strip",
    body: "Any GitHub issue URL from a registered sector. The flow validates the callsign before the agent ever wakes up.",
  },
  {
    n: "02",
    title: "The tower reasons",
    body: "gpt-4o with 12 tool steps: per-repo knowledge base, issues memory, GitHub duplicate search, sub-flows, web search.",
  },
  {
    n: "03",
    title: "Controller approves",
    body: "Low confidence, P0 or spam always routes to a human. The draft reply leaves the bay only on your click.",
  },
];

const REPO_CARDS = [
  {
    id: "activepieces/activepieces",
    tag: "flagship sector",
    blurb: "428 open issues. Template 500s, subflow races, piece-auth edge cases — the real triage firehose.",
  },
  {
    id: "Deepjyoti-Sarmah/VibeCode",
    tag: "ai builder",
    blurb: "E2B timeouts, Clerk loops, stuck generations. Product bugs with user-facing urgency.",
  },
  {
    id: "Deepjyoti-Sarmah/Invoice-Cart",
    tag: "fintech",
    blurb: "GST slabs, rupee glyphs in PDFs, Stripe webhooks. Money bugs squawk P1 by default.",
  },
  {
    id: "Deepjyoti-Sarmah/symbolgraph",
    tag: "devtools",
    blurb: "MCP crashes, tree-sitter gaps, index invalidation. Terse, technical, exact.",
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

const TICKER_ITEMS = [
  "AP#15626 subflow INTERNAL_ERROR → BUG P1",
  "AP#15623 template import 500 → BUG P1",
  "AP#15610 slides service-account → PIECE-REQUEST P3",
  "VC#syn-clerk-loop → BUG P1",
  "IC#syn-gst-rate → BUG P1",
  "SG#1 pack_recall → FEATURE P2",
  "AP#15616 worker E2BIG → BUG P0",
  "AP#15597 zendesk oauth2 → PIECE-REQUEST P3",
];

function PrintedStrip({
  callsign,
  verdict,
  delay,
  tilt,
}: {
  callsign: string;
  verdict: string;
  delay: string;
  tilt: string;
}) {
  return (
    <div className="overflow-hidden">
      <div
        className={`printer-strip strip-paper mx-auto flex max-w-md items-stretch rounded-sm shadow-[0_18px_50px_-18px_rgb(0_0_0/0.9)] ${tilt}`}
        style={{ animationDelay: delay }}
      >
        <div className="strip-holes w-3 shrink-0 opacity-70" aria-hidden />
        <div className="flex-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[13px] font-bold tracking-tight">
              {callsign}
            </span>
            <span className="stamp text-[13px] text-red-800">{verdict}</span>
          </div>
          <div className="tear-x my-2" />
          <div className="flex items-center justify-between font-mono text-[11px] text-black/60">
            <span>CONF 0.90</span>
            <span>DRAFT READY</span>
            <span className="text-black/80">▸ HOLD FOR APPROVAL</span>
          </div>
        </div>
        <div className="strip-holes w-3 shrink-0 opacity-70" aria-hidden />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section className="grid items-center gap-10 pb-10 pt-14 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="reveal">
            <Eyebrow>Tower log · multi-repo maintainer agent</Eyebrow>
          </div>
          <h1
            className="reveal mt-4 font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-7xl"
            style={{ animationDelay: "80ms" }}
          >
            Every issue,
            <br />
            sorted like
            <br />
            a <span className="text-lime">strip bay.</span>
          </h1>
          <p
            className="reveal mt-5 max-w-xl text-lg leading-relaxed text-slate-400"
            style={{ animationDelay: "160ms" }}
          >
            Controllers don&apos;t read skies — they read strips. TriagePilot
            prints every GitHub issue as a flight strip: callsign, verdict,
            confidence, draft reply. You work the bay. Nothing leaves it
            without your stamp.
          </p>
          <div
            className="reveal mt-7 flex flex-wrap gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <a
              href="/chat"
              className="inline-flex items-center gap-2 rounded-xl bg-lime px-6 py-3 font-display text-base font-semibold text-[#0c1005] transition hover:brightness-110 active:scale-[0.98]"
            >
              Work the bay →
            </a>
            <GhostButton href="/runs">Read the log</GhostButton>
          </div>
        </div>

        {/* strip printer */}
        <div
          className="reveal relative mx-auto w-full max-w-md"
          style={{ animationDelay: "200ms" }}
          aria-hidden
        >
          <div className="rounded-t-xl border border-line bg-raised px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500">
            ▓▓ outlet · verdict printer
          </div>
          <div className="space-y-3 border-x border-line bg-ink/60 px-4 py-4">
            <PrintedStrip
              callsign="AP · 15626"
              verdict="P1 BUG"
              delay="0s"
              tilt="-rotate-[0.6deg]"
            />
            <PrintedStrip
              callsign="AP · 15623"
              verdict="P1 BUG"
              delay="3s"
              tilt="rotate-[0.5deg]"
            />
            <PrintedStrip
              callsign="VC · CLERK-LOOP"
              verdict="P1 BUG"
              delay="6s"
              tilt="-rotate-[0.4deg]"
            />
          </div>
          <div className="rounded-b-xl border border-line bg-raised px-4 py-2.5 text-center font-mono text-[11px] text-slate-600">
            — tear here —
          </div>
        </div>
      </section>

      {/* ticker */}
      <div className="reveal overflow-hidden rounded-xl border border-line bg-panel" aria-hidden>
        <div className="ticker-track flex w-max gap-0 py-2.5">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
            <span
              key={i}
              className="whitespace-nowrap px-5 font-mono text-xs text-slate-400"
            >
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-lime align-middle" />
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* stat strip */}
      <div className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
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

      {/* HOW IT WORKS */}
      <section className="py-10">
        <Eyebrow>Procedure</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Flows route. The tower thinks. You stamp.
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card
              key={s.n}
              className="reveal p-6 transition-colors hover:border-lime/30"
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

      {/* SECTORS */}
      <section className="py-10">
        <Eyebrow>Four sectors on scope</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Sectors
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
                className="mt-4 inline-block font-mono text-[13px] text-lime hover:underline"
              >
                Open sector in the bay →
              </a>
            </Card>
          ))}
        </div>
      </section>

      {/* EVAL BACKING */}
      <section className="py-10">
        <Eyebrow>Grounded, not vibes</Eyebrow>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          80 filed strips behind the demo
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
