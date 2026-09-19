/** Curated live demo triages — all verified open on the GitHub API.
 *  New users one-click from landing straight into a real verdict. */
export type FeaturedDemo = {
  repo: string;
  number: number;
  title: string;
  hint: string;
};

export const FEATURED: FeaturedDemo[] = [
  {
    repo: "activepieces/activepieces",
    number: 15626,
    title: "Subflow INTERNAL_ERROR fails the parent, retry response dropped",
    hint: "race-condition bug → expect P1",
  },
  {
    repo: "vercel/next.js",
    number: 98958,
    title: "next build deletes unrelated user data with distDir",
    hint: "critical bug → expect P0/P1",
  },
  {
    repo: "oven-sh/bun",
    number: 43635,
    title: "missing tls.checkServerIdentity in native WebSocket client",
    hint: "API gap → expect feature/P2–P3",
  },
  {
    repo: "microsoft/typescript",
    number: 64362,
    title: "Content mappers: granular resolution + default extensions",
    hint: "language feature → expect feature",
  },
  {
    repo: "activepieces/activepieces",
    number: 15623,
    title: "Use Template / Import flow 500s on cloud",
    hint: "cloud 500 → expect P1",
  },
];

export function demoUrl(d: FeaturedDemo) {
  return `/chat?repo=${encodeURIComponent(d.repo)}&issue=${d.repo}%2F${d.number}`;
}

export function issueUrl(repo: string, number: number) {
  return `https://github.com/${repo}/issues/${number}`;
}
