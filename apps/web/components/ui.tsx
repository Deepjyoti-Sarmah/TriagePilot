import type { ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.22em] text-lime">
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
    <div
      className={`rounded-2xl border border-line bg-panel shadow-[0_20px_60px_-30px_rgb(0_0_0/0.8)] ${className}`}
    >
      {children}
    </div>
  );
}

const pillTones: Record<string, string> = {
  ok: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/30",
  warn: "bg-amber-400/10 text-amber-300 ring-amber-400/30",
  bad: "bg-red-400/10 text-red-300 ring-red-400/30",
  info: "bg-sky-400/10 text-sky-300 ring-sky-400/30",
  neutral: "bg-white/5 text-slate-300 ring-white/15",
  lime: "bg-lime/10 text-lime ring-lime/30",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs ring-1 ring-inset ${pillTones[tone]}`}
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
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-line bg-ink px-3.5 py-2.5 text-[15px] text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-lime/60 focus:ring-2 focus:ring-lime/20";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime px-5 py-2.5 font-display text-[15px] font-semibold text-[#0c1005] transition hover:brightness-110 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
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
    "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white/[0.02] px-5 py-2.5 font-display text-[15px] font-medium text-slate-200 transition hover:border-slate-500 hover:bg-white/[0.05]";
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
