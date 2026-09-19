export const code = async (inputs) => {
  const t0 = Date.now();
  const model = inputs.model || "nvidia/nemotron-3-super-120b-a12b:free";
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
    return { status: "error", code: "unknown_repo", message: "Repo not in registry: " + repo, memory_records: [], meta: { provider: "activepieces", model, mode: "live-agent", latency_ms: Date.now() - t0 } };
  }
  let ref = parseRef(issueUrl);

  // Memory read (issues_memory via the find_memory Tables step). Rows arrive
  // in engine shapes ({cells:{...}} or flat); match fingerprint repo#number.
  // On a hit the cached verdict returns with NO LLM call (tools_used marks it).
  const fp = ref ? repo + "#" + ref.number : "";
  let memRows = inputs.memory;
  if (memRows && typeof memRows === "object" && !Array.isArray(memRows)) {
    memRows = memRows.records || memRows.data || memRows.rows || [];
  }
  if (!Array.isArray(memRows)) memRows = [];
  const cellVal = (row, names) => {
    const src = row.cells || row.values || row;
    if (src == null || typeof src !== "object") return undefined;
    for (const k of Object.keys(src)) {
      const v = src[k];
      const name = (v && typeof v === "object" && v.fieldName) ? v.fieldName : k;
      if (names.includes(name)) return (v && typeof v === "object" && "value" in v) ? v.value : v;
    }
    return undefined;
  };
  let memHit = null;
  if (fp) {
    for (const row of memRows) {
      const rRepo = asString(cellVal(row, ["repo"]));
      const rNum = Number(cellVal(row, ["github_id"]));
      const rFp = asString(cellVal(row, ["fingerprint"]));
      if ((rFp && rFp === fp) || (rRepo === repo && ref && rNum === ref.number)) {
        memHit = row;
        break;
      }
    }
  }
  const metaBase = () => ({
    provider: "activepieces", model, mode: "live-agent",
    latency_ms: Date.now() - t0, memory_rows_seen: memRows.length,
  });
  if (memHit) {
    let cached = null;
    try { cached = JSON.parse(asString(cellVal(memHit, ["resolution"]))); } catch (_) { cached = null; }
    cached = cached && typeof cached === "object" ? cached : {};
    // Verdict fields live in row COLUMNS; the resolution blob carries the rest.
    // (Older rows may only have the blob — read both, columns win.)
    const colType = asString(cellVal(memHit, ["issue_type"]));
    const colSev = asString(cellVal(memHit, ["severity"]));
    const type = TYPE_ENUM.includes(colType) ? colType
      : (TYPE_ENUM.includes(cached.issue_type) ? cached.issue_type : "question");
    const severity = SEV_ENUM.includes(colSev) ? colSev
      : (SEV_ENUM.includes(cached.severity) ? cached.severity : "P3");
    const output = {
      repo,
      issue_type: type,
      severity,
      confidence: clamp(Number(cached.confidence) || 0, 0, 1),
      duplicate_of: null,
      labels: Array.isArray(cached.labels) ? cached.labels.map(asString).filter(Boolean).slice(0, 6) : [],
      draft_reply: asString(cached.draft_reply).slice(0, 2000) || "Cached verdict — see memory.",
      needs_human: Boolean(cached.needs_human),
    };
    const record = [{
      run_id: "ap-" + t0, created_at: new Date(t0).toISOString(), repo, input_url: issueUrl,
      issue_type: output.issue_type, severity: output.severity, confidence: output.confidence,
      duplicate_of: output.duplicate_of, needs_human: output.needs_human ? "true" : "false",
      labels: output.labels.join(", "), provider: "activepieces", model, mode: "live-agent",
      latency_ms: Date.now() - t0, tools_used: "memory-hit", approved_by: "",
    }];
    return {
      output, memory_records: [],
      meta: { ...metaBase(), tools_used: ["memory-hit"] },
      record,
    };
  }

  // Inline content (synthetic evals) wins over GitHub fetch.
  let context;
  let candidates = [];
  const hasInlineTitle = p.title != null && String(p.title).trim() !== "";
  const hasInlineBody = p.body != null && String(p.body).trim() !== "";
  if (hasInlineTitle || hasInlineBody) {
    context = "Title: " + asString(p.title).trim() + "\nBody: " + (asString(p.body).trim().slice(0, 6000) || "(empty)");
  } else if (ref) {
    const issue = await fetchIssue(ref.repoPath, ref.number);
    if (issue.status !== 200) {
      return { output: hold(repo, "GitHub API returned " + issue.status), memory_records: [], meta: { provider: "activepieces", model, mode: "live-agent", latency_ms: Date.now() - t0, tools_used: ["github.get_issue"] } };
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
  let usedModel = model;
  let held = false;
  // Free pools rotate (a model can flip to paid overnight). Try the requested
  // model, then known-good free fallbacks, before holding for a human.
  const MODELS = [inputs.model,
                  "nvidia/nemotron-3-super-120b-a12b:free",
                  "inclusionai/ling-3.0-flash-vl:free",
                  "nex-agi/nex-n2.5-pro:free",
                  "qwen/qwen3.8-27b:free"]
    .filter((m, i, a) => m && a.indexOf(m) === i);
  let lastErr = "no model attempted";
  try {
    if (!orKey) throw new Error("missing openrouter key");
    for (const candidate of MODELS) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + orKey,
            "HTTP-Referer": "https://github.com/Deepjyoti-Sarmah",
            "X-Title": "TriagePilot",
          },
          body: JSON.stringify({
            model: candidate,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });
        if (!res.ok) { lastErr = "openrouter " + res.status + " (" + candidate + ")"; continue; }
        const data = await res.json();
        const text = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || "";
        const parsed = extractJson(text);
        if (!parsed || typeof parsed !== "object") { lastErr = "bad model JSON (" + candidate + ")"; continue; }
        usedModel = candidate;
        toolsUsed.push("openrouter.chat:" + candidate);
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
        break;
      } catch (inner) {
        lastErr = String(inner && inner.message ? inner.message : inner);
      }
    }
    if (!output) throw new Error(lastErr);
  } catch (e) {
    held = true;
    output = hold(repo, String(e && e.message ? e.message : e));
  }

  // One row for the Cloud "runs" table (cost/audit log). Field names must
  // match the schema created by scripts/cloud/build_flows.py --seed-tables.
  const record = [{
    run_id: "ap-" + t0,
    created_at: new Date(t0).toISOString(),
    repo,
    input_url: issueUrl,
    issue_type: output.issue_type,
    severity: output.severity,
    confidence: output.confidence,
    duplicate_of: output.duplicate_of,
    needs_human: output.needs_human ? "true" : "false",
    labels: (output.labels || []).join(", "),
    provider: "activepieces",
    model: usedModel,
    mode: "live-agent",
    latency_ms: Date.now() - t0,
    tools_used: toolsUsed.join(", "),
    approved_by: "",
  }];

  // Memory write row (issues_memory). Empty on hold paths so a failure
  // never poisons memory; the write step no-ops on [].
  const memory_records = (ref && !held) ? [{
    repo,
    github_id: ref.number,
    fingerprint: repo + "#" + ref.number,
    issue_type: output.issue_type,
    severity: output.severity,
    resolution: JSON.stringify({
      issue_type: output.issue_type,
      severity: output.severity,
      confidence: output.confidence,
      labels: output.labels || [],
      draft_reply: output.draft_reply,
      needs_human: output.needs_human,
    }),
  }] : [];

  return {
    output,
    memory_records,
    meta: {
      provider: "activepieces",
      model: usedModel,
      mode: "live-agent",
      latency_ms: Date.now() - t0,
      tools_used: toolsUsed,
      duplicate_candidates: candidates,
    },
    record,
  };
};