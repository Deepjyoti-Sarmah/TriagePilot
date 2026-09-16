"use client";

import { useState, type ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </p>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-panel ${className}`}>
      {children}
    </div>
  );
}

const pillTones: Record<string, string> = {
  ok: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
  warn: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
  bad: "bg-red-400/10 text-red-300 ring-red-400/25",
  info: "bg-sky-400/10 text-sky-300 ring-sky-400/25",
  neutral: "bg-white/[0.04] text-zinc-300 ring-white/10",
  lime: "bg-lime/10 text-lime ring-lime/25",
};

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: keyof typeof pillTones;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs ring-1 ring-inset ${pillTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Meter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.8 ? "bg-lime" : value >= 0.6 ? "bg-amber-300" : "bg-red-300";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-xs tabular-nums text-zinc-400">{pct}%</span>
    </span>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
        {hint && <span className="normal-case tracking-normal">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-white/10";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AccentButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-lime px-4 py-2 text-sm font-semibold text-[#0c1005] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { href, ...rest } = props as { href?: string } & Record<string, unknown>;
  const cls =
    "inline-flex items-center justify-center gap-2 rounded-md border border-line bg-transparent px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:text-white";
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)} className={cls}>
      {children}
    </button>
  );
}

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }
  return (
    <button
      onClick={copy}
      className="rounded-md border border-line px-2 py-1 font-mono text-xs text-zinc-400 transition hover:border-zinc-600 hover:text-white"
      title="Copy to clipboard"
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-black">
      <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
        <span className="font-mono text-[11px] text-zinc-600">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[13px] leading-relaxed text-zinc-200">
        {code}
      </pre>
    </div>
  );
}
