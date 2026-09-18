export const code = async (inputs) => {
  const t0 = Date.now();
  const model = inputs.model || "deepseek/deepseek-v4-flash-0731:free";
  const ghToken = inputs.github_pat || "";
  const orKey = inputs.openrouter_key || "";
  const REPOS = [
    "activepieces/activepieces",
    "Deepjyoti-Sarmah/VibeCode",
    "Deepjyoti-Sarmah/Invoice-Cart",
    "Deepjyoti-Sarmah/symbolgraph",
  ];

  const ghHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "TriagePilot-Digest",
  };
  if (ghToken) ghHeaders.Authorization = "Bearer " + ghToken;

  async function recentIssues(repo) {
    const q = encodeURIComponent("repo:" + repo + " is:issue is:open");
    try {
      const res = await fetch(
        "https://api.github.com/search/issues?q=" + q + "&sort=created&order=desc&per_page=3",
        { headers: ghHeaders });
      if (!res.ok) return [];
      const d = await res.json();
      return (d.items || []).map((it) => ({
        repo,
        number: it.number,
        title: it.title,
        url: it.html_url,
        comments: it.comments || 0,
      }));
    } catch (_) {
      return [];
    }
  }

  const all = [];
  for (const repo of REPOS) {
    const items = await recentIssues(repo);
    for (const it of items) all.push(it);
  }
  const top = all.slice(0, 10);
  const list = top.map((i) => "#" + i.number + " " + i.title + " (" + i.repo + ", " + i.comments + " comments)").join("\n");

  let digest = "Open issues snapshot (" + (list ? top.length + " issues" : "none") + "):\n" + (list || "- none");
  if (orKey && top.length) {
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
          model,
          messages: [
            { role: "system", content: "You are a maintainer. Summarize the open issues into a short daily digest: 3-6 bullets, most urgent first, then a one-line action list." },
            { role: "user", content: list },
          ],
          temperature: 0.2,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        const text = (d && d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "";
        if (text.trim()) digest = text.trim();
      }
    } catch (_) { /* keep the raw snapshot */ }
  }

  return {
    output: { digest, issues: top },
    meta: { provider: "activepieces", model, mode: "live-agent", latency_ms: Date.now() - t0, tools_used: ["github.search_issues"].concat(orKey && top.length ? ["openrouter.chat"] : []) },
  };
};