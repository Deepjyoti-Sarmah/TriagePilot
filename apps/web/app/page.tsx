export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold">TriagePilot</h1>
      <p className="mt-2 text-slate-400">
        One ReAct agent (Activepieces + gpt-4o) triages GitHub issues for many
        repos. Paste an issue, pick a repo, get{" "}
        <code className="text-slate-200">type / severity / labels / draft reply</code>{" "}
        — with a human approval gate before anything is posted.
      </p>
      <div className="mt-4 rounded-xl border border-line bg-panel p-5">
        <div className="flex flex-wrap gap-3">
          <a
            href="/chat"
            className="rounded-lg bg-blue-400 px-4 py-2 font-bold text-slate-950"
          >
            Try the demo
          </a>
          <a
            href="/runs"
            className="rounded-lg border border-line px-4 py-2 text-slate-200"
          >
            View runs
          </a>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-line bg-panel p-5">
        <h3 className="font-semibold">Seed repos</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
          <li>activepieces/activepieces (flagship)</li>
          <li>Deepjyoti-Sarmah/VibeCode</li>
          <li>Deepjyoti-Sarmah/Invoice-Cart</li>
          <li>Deepjyoti-Sarmah/symbolgraph</li>
        </ul>
        <p className="mt-3 text-sm text-slate-400">
          No API keys configured yet, so the app runs in deterministic MOCK
          mode — same JSON shape the live agent will return.
        </p>
      </div>
    </div>
  );
}
