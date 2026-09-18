export const code = async (inputs) => {
  const t0 = Date.now();
  const model = inputs.model || "deepseek/deepseek-v4-flash-0731:free";
  const ghToken = inputs.github_pat || "";
  const orKey = inputs.openrouter_key || "";
  const toolsUsed = [];

  const REPOS = {
    "activepieces/activepieces": { tone: "concise maintainer, link docs" },
    "Deepjyoti-Sarmah/VibeCode": { tone: "friendly builder" },
    "Deepjyoti-Sarmah/Invoice-Cart": { tone: "friendly builder" },
    "Deepjyoti-Sarmah/symbolgraph": { tone: "technical, terse" },
  };

  const TYPE_ENUM = ["bug", "piece-request", "feature", "docs", "question", "spam", "duplicate"];
  const SEV_ENUM = ["P0", "P1", "P2", "P3"];

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const asString = (v) => (typeof v === "string" ? v : v == null ? "" : String(v));

  function extractJson(text) {
    try {
      return JSON.parse(text);
    } catch (_) { /* fall through */ }
    const matches = String(text).match(/\{[\s\S]*\}/g) || [];
    for (const m of matches) {
      try { return JSON.parse(m); } catch (_) { /* next */ }
    }
    return null;
  }

  function parseRef(url) {
    const m = String(url).match(/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/);
    return m ? { repoPath: m[1], number: Number(m[2]) } : null;
  }

  function ghHeaders() {
    const h = { Accept: "application/vnd.github+json", "User-Agent": "TriagePilot-CloudFlow" };
    if (ghToken) h.Authorization = "Bearer " + ghToken;
    return h;
  }

  async function fetchIssue(repoPath, number) {
    const res = await fetch("https://api.github.com/repos/" + repoPath + "/issues/" + number, { headers: ghHeaders() });
    if (!res.ok) return { status: res.status };
    const d = await res.json();
    return {
      status: 200,
      title: asString(d.title),
      body: asString(d.body).slice(0, 6000),
      state: d.state,
      labels: Array.isArray(d.labels) ? d.labels.map((l) => (typeof l === "string" ? l : l && l.name)).filter(Boolean) : [],
      is_pull_request: Boolean(d.pull_request),
      comments: d.comments || 0,
      user: d.user && d.user.login ? d.user.login : null,
    };
  }

  const STOP = new Set(["this", "that", "with", "from", "have", "when", "what", "your", "does", "doesn", "after", "before", "into", "issue", "error", "using", "unable", "cannot", "failed", "unexpected", "getting"]);
  function searchTerms(title) {
    return String(title).toLowerCase().replace(/[^a-z0-9\s-]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)).slice(0, 6);
  }

  async function dedupeSearch(repoPath, title, currentNumber) {
    const terms = searchTerms(title);
    if (!terms.length) return [];
    const q = encodeURIComponent("repo:" + repoPath + " is:issue " + terms.join(" "));
    try {
      const res = await fetch("https://api.github.com/search/issues?q=" + q + "&per_page=5", { headers: ghHeaders() });
      if (!res.ok) return [];
      const d = await res.json();
      return (d.items || [])
        .filter((it) => it.number !== currentNumber)
        .slice(0, 3)
        .map((it) => ({ number: it.number, title: it.title, state: it.state }));
    } catch (_) {
      return [];
    }
  }

  const hold = (repo, reason) => ({
    repo,
    issue_type: "question",
    severity: "P3",
    confidence: 0.4,
    duplicate_of: null,
    labels: ["question"],
    draft_reply: "Cloud flow could not verify this issue (" + reason + "). Routed to a human maintainer.",
    needs_human: true,
  });

  // Cloud passes the whole webhook body as `payload`; local tests pass flat inputs.
  let rawPayload = inputs.payload;
  if (typeof rawPayload === "string") {
    try { rawPayload = JSON.parse(rawPayload); } catch (_) { rawPayload = null; }
  }
  const p = rawPayload && typeof rawPayload === "object" ? rawPayload : inputs;
  let repo = asString(p.repo);
  let issueUrl = asString(p.issue_url);
  // GitHub "issues" webhook event normalization (used by webhook-github-intake).
  if (!issueUrl && p.issue && p.repository) {
    repo = repo || asString(p.repository.full_name);
    issueUrl = asString(p.issue.html_url) ||
      "https://github.com/" + repo + "/issues/" + asString(p.issue.number);
  }
  if (!REPOS[repo]) {
    return { status: "error", code: "unknown_repo", message: "Repo not in registry: " + repo, meta: { provider: "activepieces", model, mode: "live-agent", latency_ms: Date.now() - t0 } };
  }

  // Inline content (synthetic evals) wins over GitHub fetch.
  let context;
  let candidates = [];
  let ref = parseRef(issueUrl);
  const hasInlineTitle = p.title != null && String(p.title).trim() !== "";
  const hasInlineBody = p.body != null && String(p.body).trim() !== "";
  if (hasInlineTitle || hasInlineBody) {
    context = "Title: " + asString(p.title).trim() + "\nBody: " + (asString(p.body).trim().slice(0, 6000) || "(empty)");
  } else if (ref) {
    const issue = await fetchIssue(ref.repoPath, ref.number);
    if (issue.status !== 200) {
      return { output: hold(repo, "GitHub API returned " + issue.status), meta: { provider: "activepieces", model, mode: "live-agent", latency_ms: Date.now() - t0, tools_used: ["github.get_issue"] } };
    }
    toolsUsed.push("github.get_issue");
    context = "Title: " + issue.title + "\nBody: " + (issue.body || "(empty)") +
      "\nState: " + issue.state + " | Comments: " + issue.comments + " | Author: " + (issue.user || "unknown") +
      (issue.labels.length ? " | Labels: " + issue.labels.join(", ") : "") +
      (issue.is_pull_request ? "\nNOTE: this is a pull request." : "");
    candidates = await dedupeSearch(ref.repoPath, issue.title, ref.number);
    if (candidates.length) toolsUsed.push("github.search_duplicates");
  } else {
    context = "Title: \nBody: (could not parse issue reference from URL)";
  }

  const candText = candidates.length
    ? candidates.map((c) => "#" + c.number + " [" + c.state + "] " + c.title).join("\n")
    : "(none)";

  const system = [
    "You triage ONE GitHub issue for repo " + repo + " (tone: " + REPOS[repo].tone + ").",
    "You have already run tools: the issue title+body and duplicate-candidate search are in the user message.",
    "Return JSON ONLY, exactly:",
    '{"issue_type":"bug|piece-request|feature|docs|question|spam|duplicate","severity":"P0|P1|P2|P3","confidence":0.0-1.0,"duplicate_of":null,"labels":[],"draft_reply":"3-6 lines, repo tone","needs_human":true|false}',
    "Rules:",
    "- If duplicate candidates clearly match this report, set issue_type \"duplicate\" and duplicate_of to that issue number. Otherwise duplicate_of null.",
    "- Empty/gibberish/promo body -> issue_type \"spam\", confidence <= 0.3, needs_human true.",
    "- Crash/500/auth-breakage/data-loss words -> severity P0/P1, needs_human true.",
    "- \"How do I / can I / where\" -> \"question\", P3. Missing-docs complaints -> \"docs\", P3.",
    "- New integration asks -> \"piece-request\", P3.",
    "- Unsure -> confidence <= 0.6, needs_human true. Never invent URLs or issue numbers.",
  ].join("\n");

  const user = "Repo: " + repo + "\nURL: " + issueUrl + "\n" + context + "\n\nDuplicate candidates:\n" + candText;

  let output;
  try {
    if (!orKey) throw new Error("missing openrouter key");
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + orKey,
        "HTTP-Referer": "https://github.com/Deepjyoti-Sarmah",
        "X-Title": "TriagePilot",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error("openrouter " + res.status);
    const data = await res.json();
    const text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
    const parsed = extractJson(text);
    if (!parsed || typeof parsed !== "object") throw new Error("bad model JSON");
    toolsUsed.push("openrouter.chat");
    const type = TYPE_ENUM.includes(parsed.issue_type) ? parsed.issue_type : "question";
    const severity = SEV_ENUM.includes(parsed.severity) ? parsed.severity : "P3";
    let duplicateOf = Number.isInteger(parsed.duplicate_of) ? parsed.duplicate_of : null;
    if (type !== "duplicate") duplicateOf = null;
    if (type === "duplicate" && duplicateOf == null && candidates.length) duplicateOf = candidates[0].number;
    const confidence = clamp(Number(parsed.confidence) || 0, 0, 1);
    const labels = Array.isArray(parsed.labels) ? parsed.labels.map(asString).filter(Boolean).slice(0, 6) : [];
    let draft = asString(parsed.draft_reply).trim();
    if (draft.length < 10) draft = "Thanks for the report. A maintainer will take a look shortly.";
    if (draft.length > 2000) draft = draft.slice(0, 1990) + " ...";
    output = {
      repo,
      issue_type: type,
      severity,
      confidence,
      duplicate_of: duplicateOf,
      labels,
      draft_reply: draft,
      needs_human: Boolean(parsed.needs_human) || confidence < 0.8 || severity === "P0",
    };
  } catch (e) {
    output = hold(repo, String(e && e.message ? e.message : e));
  }

  return {
    output,
    meta: {
      provider: "activepieces",
      model,
      mode: "live-agent",
      latency_ms: Date.now() - t0,
      tools_used: toolsUsed,
      duplicate_candidates: candidates,
    },
  };
};