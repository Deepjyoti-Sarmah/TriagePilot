"use client";

import { useState } from "react";

export default function NewRepoPage() {
  const [id, setId] = useState("owner/repo");
  const [channel, setChannel] = useState("#maintainers");
  const [tone, setTone] = useState("concise maintainer, link docs");
  const [labels, setLabels] = useState("bug, feature, docs, question, duplicate");

  const slug = (id.split("/")[1] ?? "repo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_");
  const yaml = `- id: ${id}
  kb_id: kb_${slug}
  labels: [${labels
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(", ")}]
  channel: "${channel}"
  tone: ${tone}
  p0_definition: outage or data-loss bug
  docs: []`;

  const inputCls =
    "min-w-56 flex-1 rounded-lg border border-line bg-[#0e1220] px-3 py-2.5 text-slate-100";

  return (
    <div>
      <h1 className="text-2xl font-bold">Add a repo</h1>
      <p className="mt-2 text-slate-400">
        Generates a <code className="text-slate-200">repos.yaml</code>-compatible
        draft (spec 002). Paste it into{" "}
        <code className="text-slate-200">
          specs/002-multi-repo/contracts/repos.yaml
        </code>
        , upload a KB, add 20 eval rows — no code change needed.
      </p>
      <div className="mt-4 rounded-xl border border-line bg-panel p-5">
        <div className="flex flex-wrap gap-2.5">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            className={inputCls}
          />
          <input
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          <input
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className={inputCls}
          />
          <input
            value={labels}
            onChange={(e) => setLabels(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-line bg-panel p-5">
        <pre className="overflow-x-auto rounded-lg border border-line bg-[#0e1220] p-3 text-[13px]">
          {yaml}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(yaml)}
          className="mt-3 rounded-lg border border-line px-4 py-2 text-slate-200"
        >
          Copy YAML
        </button>
      </div>
    </div>
  );
}
