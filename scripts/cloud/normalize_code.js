// Normalize trigger input into {repo, github_id, fingerprint, issue_url}.
// Runs BEFORE the find-memory step so every trigger shape (webhook body,
// MCP output, flat local input, native GitHub event) resolves uniformly.
export const code = async (inputs) => {
  const asString = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));
  let p = inputs.payload;
  if (typeof p === "string") {
    try { p = JSON.parse(p); } catch (_) { p = null; }
  }
  if (!p || typeof p !== "object") p = inputs;
  let repo = asString(p.repo);
  let issueUrl = asString(p.issue_url);
  if (!issueUrl && p.issue && p.repository) {
    repo = repo || asString(p.repository.full_name);
    issueUrl =
      asString(p.issue.html_url) ||
      "https://github.com/" + repo + "/issues/" + asString(p.issue.number);
  }
  let githubId = null;
  const m = issueUrl.match(/github\.com\/[^/]+\/[^/]+\/(?:issues|pull)\/(\d+)/);
  if (m) githubId = Number(m[1]);
  return {
    repo,
    issue_url: issueUrl,
    github_id: githubId,
    fingerprint: repo && githubId != null ? repo + "#" + githubId : "",
  };
};
