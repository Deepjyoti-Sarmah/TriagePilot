"use client";

import { useState } from "react";
import { Eyebrow, Card, Field, inputCls, CopyButton } from "@/components/ui";

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

  return (
    <div className="pt-8">
      <Eyebrow>Onboard in minutes · no code change</Eyebrow>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Add a repo</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Generates a <code className="font-mono text-[13px] text-zinc-200">repos.yaml</code>
        -compatible draft. Paste it into{" "}
        <code className="font-mono text-[13px] text-zinc-200">
          specs/002-multi-repo/contracts/repos.yaml
        </code>
        , upload one knowledge base, add 20 eval rows.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="space-y-4 p-4">
          <Field label="owner / repo">
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
              spellCheck={false}
            />
          </Field>
          <Field label="Alert channel">
            <input
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
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
          <Field label="Labels">
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              className={`${inputCls} font-mono text-[13px]`}
              spellCheck={false}
            />
          </Field>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["01 · YAML", "02 · KB upload", "03 · 20 evals"].map((s) => (
              <div
                key={s}
                className="rounded-md border border-line bg-ink px-2 py-2 text-center font-mono text-[11px] text-zinc-500"
              >
                {s}
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-600">
              Live preview
            </p>
            <CopyButton text={yaml} label="Copy YAML" />
          </div>
          <pre className="flex-1 overflow-x-auto rounded-md border border-line bg-black p-3.5 font-mono text-[13px] leading-relaxed text-zinc-200">
            {yaml}
          </pre>
        </Card>
      </div>
    </div>
  );
}
