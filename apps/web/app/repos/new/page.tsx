"use client";

import { useState } from "react";
import { Eyebrow, Card, Field, inputCls } from "@/components/ui";

export default function NewRepoPage() {
  const [id, setId] = useState("owner/repo");
  const [channel, setChannel] = useState("#maintainers");
  const [tone, setTone] = useState("concise maintainer, link docs");
  const [labels, setLabels] = useState("bug, feature, docs, question, duplicate");
  const [copied, setCopied] = useState(false);

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

  async function copy() {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="pt-10">
      <Eyebrow>Onboard in minutes · no code change</Eyebrow>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight">
        Add a repo
      </h1>
      <p className="mt-2 max-w-2xl text-[15px] text-slate-400">
        Generates a <code className="font-mono text-[13px] text-slate-200">repos.yaml</code>
        -compatible draft. Paste it into{" "}
        <code className="font-mono text-[13px] text-slate-200">
          specs/002-multi-repo/contracts/repos.yaml
        </code>
        , upload one knowledge base, add 20 eval rows — done.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <Field label="owner / repo">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className={`${inputCls} font-mono text-sm`}
              spellCheck={false}
            />
          </Field>
          <Field label="Alert channel">
            <input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className={`${inputCls} font-mono text-sm`}
              spellCheck={false}
            />
          </Field>
          <Field label="Reply tone">
            <input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Labels (comma separated)">
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className={`${inputCls} font-mono text-sm`}
              spellCheck={false}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["01 · YAML", "02 · KB upload", "03 · 20 evals"].map((s) => (
              <div
                key={s}
                className="rounded-lg border border-line bg-ink px-3 py-2 text-center font-mono text-xs text-slate-400"
              >
                {s}
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
            Live preview
          </p>
          <pre className="mt-2 flex-1 overflow-x-auto rounded-xl border border-line bg-ink p-4 font-mono text-[13px] leading-relaxed text-lime/90">
            {yaml}
          </pre>
          <button
            onClick={copy}
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-2.5 font-display text-[15px] font-semibold text-[#0c1005] transition hover:brightness-110 active:scale-[0.98]"
          >
            {copied ? "Copied ✓" : "Copy YAML"}
          </button>
        </Card>
      </div>
    </div>
  );
}
