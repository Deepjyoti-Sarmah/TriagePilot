import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Clock } from "@/components/clock";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "TriagePilot — maintainer agent console",
  description:
    "Triage GitHub issues across repos from one console. Type, severity, labels, draft reply, raw JSON.",
  icons: { icon: "/favicon.svg" },
};

function LogoMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 64 64" aria-hidden>
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
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">
        <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2">
              <LogoMark />
              <span className="text-[15px] font-semibold tracking-tight">
                TriagePilot
              </span>
              <span className="hidden rounded border border-line bg-raised px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 md:inline">
                console
              </span>
            </a>
            <nav className="flex items-center gap-0.5 text-sm">
              <Clock />
              {[
                ["Triage", "/chat"],
                ["Runs", "/runs"],
                ["Repos", "/repos/new"],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md px-2.5 py-1.5 text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  {label}
                </a>
              ))}
              <span className="ml-1.5 hidden items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 font-mono text-[11px] text-amber-300 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                MOCK
              </span>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-16">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-xs text-zinc-500">
            <span>triagepilot · spec-driven · human approves every post</span>
            <span>specs/001 · 80 eval rows · mock until keys land</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
