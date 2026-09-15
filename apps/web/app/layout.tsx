import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TriagePilot — multi-repo maintainer agent demo",
  description:
    "Paste a GitHub issue URL, pick a repo, get a triage verdict in seconds.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-line bg-panel">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-3">
            <a href="/" className="font-semibold text-white">
              TriagePilot
            </a>
            <nav className="flex gap-5 text-sm text-slate-400">
              <a href="/chat" className="hover:text-white">
                Chat
              </a>
              <a href="/runs" className="hover:text-white">
                Runs
              </a>
              <a href="/repos/new" className="hover:text-white">
                Add repo
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-5 pb-16 pt-7">{children}</main>
      </body>
    </html>
  );
}
