#!/usr/bin/env bash
# smoke.sh — keyless runtime proof. Builds, boots, asserts, cleans up.
# Usage: bash scripts/smoke.sh [port]   (default 3210)
# Exit 0 = all green. No API keys needed (exercises MOCK mode).
set -euo pipefail

PORT="${1:-3210}"
WEB_DIR="$(cd "$(dirname "$0")/../apps/web" && pwd)"
BASE="http://localhost:${PORT}"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); echo "[PASS] $1"; }
bad()  { FAIL=$((FAIL + 1)); echo "[FAIL] $1${2:+ — $2}"; }

cleanup() {
  if [ -n "${SERVER_PID:-}" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd "$WEB_DIR"

# Rebuild when missing OR any source is newer than the last build
# (stale servers are the #1 smoke false-negative).
if [ ! -f .next/BUILD_ID ] || [ -n "$(find app lib components public package.json tsconfig.json next.config.mjs postcss.config.mjs -newer .next/BUILD_ID 2>/dev/null)" ]; then
  echo "— (re)building…"
  npm run build >/tmp/smoke-build.log 2>&1 || { bad "next build" "$(tail -3 /tmp/smoke-build.log)"; exit 1; }
fi
ok "next build present"

setsid nohup npm run start -- -p "$PORT" >/tmp/smoke-start.log 2>&1 < /dev/null & disown
SERVER_PID=$!
BOOTED=0
for _ in $(seq 1 20); do
  if curl -s -o /dev/null --max-time 3 "$BASE/" 2>/dev/null; then BOOTED=1; break; fi
  sleep 3
done
if [ "$BOOTED" -eq 0 ]; then
  bad "server boot" "no 200 on $BASE/ in 60s — see /tmp/smoke-start.log"
  exit 1
fi
ok "server boot"

need() { # need <desc> <expected> <actual>
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1" "want $2 got $3"; fi
}

for p in "" "chat" "runs" "repos/new"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$BASE/$p" || echo "000")
  need "GET /$p" "200" "$code"
done

# valid triage → mock verdict shape
resp=$(curl -s --max-time 20 -X POST "$BASE/api/run-agent" \
  -H 'Content-Type: application/json' \
  -d '{"repo":"activepieces/activepieces","issue_url":"https://github.com/activepieces/activepieces/issues/15626"}' || echo '{}')
echo "$resp" | python3 -c "
import json,sys
d = json.load(sys.stdin)
o = d.get('output', {})
m = d.get('meta', {})
assert o.get('issue_type') == 'bug' and o.get('severity') == 'P1', d
assert 0 <= o.get('confidence', -1) <= 1 and isinstance(o.get('needs_human'), bool)
assert m.get('provider') == 'mock' and 'latency_ms' in m, d
print('mock verdict+meta ok:', o['issue_type'], o['severity'], m['provider'])
" && ok "POST valid → bug/P1 mock + meta" || bad "POST valid → bug/P1 mock + meta" "$resp"

# unknown repo → 400
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$BASE/api/run-agent" \
  -H 'Content-Type: application/json' \
  -d '{"repo":"nope/repo","issue_url":"https://github.com/x/y/issues/1"}' || echo "000")
need "POST unknown repo → 400" "400" "$code"

# invalid input → 400
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 -X POST "$BASE/api/run-agent" \
  -H 'Content-Type: application/json' \
  -d '{"repo":"activepieces/activepieces","issue_url":"not-a-url"}' || echo "000")
need "POST invalid input → 400" "400" "$code"

# rate limit → at least one 429 in a burst of 14 (limit is 10/min/IP)
codes=$(for _ in $(seq 1 14); do
  curl -s -o /dev/null -w "%{http_code} " --max-time 10 -X POST "$BASE/api/run-agent" \
    -H 'Content-Type: application/json' \
    -d '{"repo":"activepieces/activepieces","issue_url":"https://github.com/a/b/issues/1"}' || echo "000 "
done)
if echo "$codes" | grep -q "429"; then ok "rate limit trips (burst → 429)"; else bad "rate limit trips" "$codes"; fi

echo ""
echo "$PASS passed, $FAIL failed."
[ "$FAIL" -eq 0 ]
