export type TriageOutputData = {
  issue_type: string;
  severity: string;
  confidence: number;
  duplicate_of: number | null;
  labels: string[];
  draft_reply: string;
  needs_human: boolean;
};

export type Verdict = {
  mode?: string;
  error?: string;
  run_id?: string;
  message?: string;
  output?: TriageOutputData;
};
