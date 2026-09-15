import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "TriagePilot — every issue, triaged in seconds",
  description:
    "One ReAct maintainer agent for many GitHub repos. Paste an issue, get type, severity, labels and a draft reply.",
  icons: { icon: "/favicon.svg" },
};

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 64 64" aria-hidden>
      <path
        d="M32 6 58 32 32 58 6 32Z"
        fill="none"
        stroke="#c9f24b"
        strokeWidth="7"
      />
      <circle cx="32" cy="32" r="6" fill="#c9f24b" />
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="grain min-h-screen font-sans">
        <div className="bg-blueprint pointer-events-none fixed inset-0" aria-hidden />
        <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
            <a href="/" className="flex items-center gap-2.5">
              <LogoMark />
              <span className="font-display text-[17px] font-bold tracking-tight">
                TriagePilot
              </span>
            </a>
            <nav className="flex items-center gap-1 text-sm">
              {[
                ["Triage", "/chat"],
                ["Runs", "/runs"],
                ["Add repo", "/repos/new"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-lg px-3 py-1.5 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}
              <span className="ml-2 hidden items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[11px] text-amber-300 sm:inline-flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                </span>
                MOCK
              </span>
            </nav>
          </div>
        </header>
        <main className="relative mx-auto max-w-6xl px-5 pb-20">{children}</main>
        <footer className="relative border-t border-line/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 font-mono text-xs text-slate-600">
            <span>TriagePilot — spec-driven demo · human approves every post</span>
            <span>specs/001 · 80 eval rows · mock mode until keys land</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
