// Mock run history shown on /runs when Tables are unreachable.
// Deterministic mock triage lives in ./providers/mock (registry).

// Mock run history shown on /runs when Tables are unreachable.
export function mockRuns() {
  return [
    {
      run_id: "mock-001",
      repo: "activepieces/activepieces",
      input_url:
        "https://github.com/activepieces/activepieces/issues/15626",
      issue_type: "bug",
      severity: "P1",
      confidence: 0.91,
      latency_ms: 18400,
      approved_by: null,
    },
    {
      run_id: "mock-002",
      repo: "Deepjyoti-Sarmah/VibeCode",
      input_url:
        "https://github.com/Deepjyoti-Sarmah/VibeCode/issues/new?template=syn-clerk-loop",
      issue_type: "bug",
      severity: "P1",
      confidence: 0.86,
      latency_ms: 16200,
      approved_by: "demo",
    },
  ];
}
