export type RecentRun = {
  run_id: string;
  repo: string;
  issue_url: string;
  issue_type: string;
  severity: string;
  confidence: number;
  ts: number;
};

const KEY = "triagepilot:recent";
const MAX = 10;

export function loadRecent(): RecentRun[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function saveRecent(run: RecentRun): RecentRun[] {
  const next = [
    run,
    ...loadRecent().filter(
      (r) => !(r.repo === run.repo && r.issue_url === run.issue_url)
    ),
  ].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — ignore */
  }
  return next;
}

export function clearRecent() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
