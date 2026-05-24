#!/usr/bin/env bash
# AGENT 4 reusable production monitor template
#
# Captures: HTTP probes (status, total time, TTFB, x-vercel-cache, x-vercel-id)
# Triggers: HTTP !== 200/307, any route > 5s, new Sentry release → optional screenshot
# Output: monitor.log + cycle-N-{sha}/ dirs on new deploy (if CDP available)
#
# Usage:
#   bash agent4-monitor-template.sh <output_dir> <cycles> <interval_sec> <route1> [route2] ...
#
# Example:
#   bash agent4-monitor-template.sh \
#     /Users/myoffice/lancerwise-screenshots/audit/agent4-monitor-2026-XX-XX \
#     45 120 \
#     / /pricing /login /dashboard /work/time

set -u

OUT_DIR="${1:?missing output dir}"
CYCLES="${2:-45}"
INTERVAL="${3:-120}"
shift 3 2>/dev/null || true
ROUTES=("$@")
[ ${#ROUTES[@]} -eq 0 ] && ROUTES=("/" "/pricing" "/login")

mkdir -p "$OUT_DIR"
LOG="$OUT_DIR/monitor.log"
SENTRY_TOKEN="${SENTRY_TOKEN:?SENTRY_TOKEN env var required — export before running}"

T0=$(date +%s)
T0_ISO=$(date -u +%Y-%m-%dT%H:%M:%SZ)

# ─── F1: CDP preflight ──────────────────────────────────────
CDP_PORT="${CDP_PORT:-59736}"
CDP_LIVE=$(curl -s --max-time 3 "http://localhost:$CDP_PORT/json/version" 2>/dev/null | grep -q '"Browser"' && echo yes || echo no)

# Sentry baseline SHA (newest release in vercel-production)
KNOWN_SHA=$(curl -s -H "Authorization: Bearer $SENTRY_TOKEN" \
  "https://sentry.io/api/0/organizations/lancerwise/releases/?per_page=5" \
  | node -e "let r='';process.stdin.on('data',c=>r+=c);process.stdin.on('end',()=>{try{const d=JSON.parse(r);const p=d.find(x=>x.lastDeploy?.environment==='vercel-production');console.log(p?.shortVersion?.slice(0,12)||'?')}catch{console.log('?')}});" 2>/dev/null)

echo "=== Monitor t0=$T0_ISO cycles=$CYCLES interval=${INTERVAL}s routes=${ROUTES[*]} ===" | tee "$LOG"
echo "  CDP_LIVE=$CDP_LIVE (port $CDP_PORT) — $([ "$CDP_LIVE" = "yes" ] && echo "screenshots enabled" || echo "HTTP-only mode, screenshots SKIPPED")" | tee -a "$LOG"
echo "  baseline_prod_sha=$KNOWN_SHA" | tee -a "$LOG"
echo "  alert thresholds: HTTP !== 200/307, time > 5s sustained" | tee -a "$LOG"
echo "" | tee -a "$LOG"

screenshot_capture() {
  local cycle="$1" sha="$2"
  if [ "$CDP_LIVE" != "yes" ]; then
    echo "  [cycle $cycle] CDP DOWN — screenshot skipped for $sha" | tee -a "$LOG"
    return
  fi
  local outdir="$OUT_DIR/cycle-${cycle}-${sha}"
  mkdir -p "$outdir"
  # F2/F3 left as caller's job — this template assumes an existing screenshot script
  if [ -x /tmp/agent4-deploy-screenshot.mjs ] || [ -f /tmp/agent4-deploy-screenshot.mjs ]; then
    node /tmp/agent4-deploy-screenshot.mjs "$cycle" "$sha" 2>&1 | tee -a "$LOG"
  else
    echo "  [cycle $cycle] no /tmp/agent4-deploy-screenshot.mjs — skipping" | tee -a "$LOG"
  fi
}

probe_route() {
  local path="$1"
  curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{time_starttransfer}" --max-time 15 "https://www.lancerwise.com$path"
}

for ITER in $(seq 1 "$CYCLES"); do
  ELAPSED=$(( $(date +%s) - T0 ))
  NOW=$(date -u +%H:%M:%S)

  declare -A R
  ALERT=""
  for ROUTE in "${ROUTES[@]}"; do
    KEY=$(echo "$ROUTE" | sed 's|^/||' | sed 's|/|_|g'); [ -z "$KEY" ] && KEY="root"
    VAL=$(probe_route "$ROUTE")
    R[$KEY]="$VAL"
    CODE=$(echo "$VAL" | cut -d'|' -f1)
    TIME=$(echo "$VAL" | cut -d'|' -f2)
    [ "$CODE" != "200" ] && [ "$CODE" != "307" ] && ALERT="$ALERT $KEY=$CODE"
    awk -v t="$TIME" 'BEGIN{exit !(t+0 > 5)}' && ALERT="$ALERT ${KEY}_slow=${TIME}s"
  done

  # Vercel headers off /
  HEADERS=$(curl -sI --max-time 10 "https://www.lancerwise.com${ROUTES[0]}")
  VCACHE=$(echo "$HEADERS" | grep -i "^x-vercel-cache" | head -1 | tr -d '\r\n' | cut -d':' -f2- | tr -d ' ')
  VID=$(echo "$HEADERS" | grep -i "^x-vercel-id" | head -1 | tr -d '\r\n' | cut -d':' -f2- | tr -d ' ' | head -c 40)

  # Sentry latest production release
  TOP_REL=$(curl -s -H "Authorization: Bearer $SENTRY_TOKEN" \
    "https://sentry.io/api/0/organizations/lancerwise/releases/?per_page=5" \
    | node -e "let r='';process.stdin.on('data',c=>r+=c);process.stdin.on('end',()=>{try{const d=JSON.parse(r);const p=d.find(x=>x.lastDeploy?.environment==='vercel-production');console.log(p?.shortVersion?.slice(0,12)||'?')}catch{console.log('?')}});" 2>/dev/null)

  NEW_DEPLOY=""
  if [ -n "$TOP_REL" ] && [ "$TOP_REL" != "?" ] && [ "$TOP_REL" != "$KNOWN_SHA" ]; then
    NEW_DEPLOY="★NEW:$TOP_REL"
    KNOWN_SHA="$TOP_REL"
  fi

  # Format probe summary
  PROBES=""
  for ROUTE in "${ROUTES[@]}"; do
    KEY=$(echo "$ROUTE" | sed 's|^/||' | sed 's|/|_|g'); [ -z "$KEY" ] && KEY="root"
    PROBES="$PROBES $KEY=${R[$KEY]}"
  done

  echo "  iter=$ITER elapsed=${ELAPSED}s now=$NOW$PROBES vcache=$VCACHE vid=${VID:0:25} rel=$TOP_REL${ALERT:+ ALERT:$ALERT}${NEW_DEPLOY:+ $NEW_DEPLOY}" | tee -a "$LOG"

  if [ -n "$NEW_DEPLOY" ]; then
    echo "" | tee -a "$LOG"
    echo "[cycle $ITER] new deploy detected → screenshot trigger" | tee -a "$LOG"
    screenshot_capture "$ITER" "$TOP_REL"
    echo "" | tee -a "$LOG"
  fi

  [ "$ITER" -lt "$CYCLES" ] && sleep "$INTERVAL"
done

echo "" | tee -a "$LOG"
echo "=== monitor complete: $CYCLES cycles | final_known_sha=$KNOWN_SHA | CDP_LIVE=$CDP_LIVE ===" | tee -a "$LOG"
