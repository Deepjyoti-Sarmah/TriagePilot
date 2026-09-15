// Registry mirror. SOURCE OF TRUTH: specs/002-multi-repo/contracts/repos.yaml
// Keep in sync manually until D5 wires a build-time import.
export type Repo = {
  id: string;
  channel: string;
  tone: string;
  labels: string[];
};

export const REPOS: Repo[] = [
  {
    id: "activepieces/activepieces",
    channel: "#ap-maintainers",
    tone: "concise maintainer, link docs",
    labels: ["bug", "piece-request", "docs", "question", "spam", "duplicate"],
  },
  {
    id: "Deepjyoti-Sarmah/VibeCode",
    channel: "#vibecode",
    tone: "friendly builder",
    labels: ["bug", "feature", "docs", "question", "duplicate"],
  },
  {
    id: "Deepjyoti-Sarmah/Invoice-Cart",
    channel: "#invoice-cart",
    tone: "friendly builder",
    labels: ["bug", "feature", "docs", "question", "duplicate"],
  },
  {
    id: "Deepjyoti-Sarmah/symbolgraph",
    channel: "#symbolgraph",
    tone: "technical, terse",
    labels: ["bug", "feature", "docs", "question", "duplicate"],
  },
];

export function isKnownRepo(repo: string): repo is Repo["id"] {
  return REPOS.some((r) => r.id === repo);
}
