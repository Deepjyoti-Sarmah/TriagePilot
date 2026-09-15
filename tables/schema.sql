-- Activepieces Tables DDL (create these in Cloud dashboard; this file is the source of truth)
-- repos: one row per repos.yaml id
CREATE TABLE repos (
  repo TEXT PRIMARY KEY,
  kb_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  tone TEXT NOT NULL
);
-- issues_memory: agent long-term memory, isolated by repo
CREATE TABLE issues_memory (
  repo TEXT NOT NULL,
  github_id BIGINT NOT NULL,
  fingerprint TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  resolution TEXT,
  PRIMARY KEY (repo, github_id)
);
-- runs: audit log, idempotency on (repo, github_id)
CREATE TABLE runs (
  run_id TEXT PRIMARY KEY,
  repo TEXT NOT NULL,
  github_id BIGINT,
  input_url TEXT NOT NULL,
  output_json TEXT NOT NULL,
  confidence REAL,
  latency_ms INTEGER,
  tokens INTEGER,
  approved_by TEXT,
  created_at TEXT NOT NULL
);
-- digests: daily summaries
CREATE TABLE digests (
  date TEXT PRIMARY KEY,
  top10_json TEXT NOT NULL
);
