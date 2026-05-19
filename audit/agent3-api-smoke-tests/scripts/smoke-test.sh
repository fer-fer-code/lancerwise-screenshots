#!/usr/bin/env bash
# Reproducible smoke test for LancerWise production API endpoints.
#
# Usage:
#   export SUPABASE_URL='https://skfgwyzarrhhkzvltbgm.supabase.co'
#   export SUPABASE_ANON_KEY='<anon key>'
#   export TEST_EMAIL='lancerwise-qa-1779107498@wshu.net'
#   export TEST_PASSWORD='LancerWiseQA-1779107498-Strong!'
#   ./smoke-test.sh > smoke-$(date +%Y%m%d-%H%M).txt
#
# Output: 4 tables (public, authed, webhooks, AI sample) with status codes + duration.
# Pass criteria: zero 5xx, all webhook empty-POSTs return 4xx/503 not 5xx.

set -u
BASE='https://www.lancerwise.com'
REF=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^.]+).*|\1|')

# ─── 1. Login via Supabase REST ────────────────────────────────────────
resp=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" --max-time 15)

COOKIE_VAL=$(python3 -c "
import json, base64
data = json.loads('''$resp''')
payload = json.dumps(data, separators=(',',':'))
print('base64-' + base64.b64encode(payload.encode()).decode().rstrip('='))
")

# Define probe helper
probe() {
  local method="$1"; local path="$2"; local opts="${3:-}"
  local out
  out=$(eval curl -s -o /dev/null -w '"%{http_code} %{time_total}"' --max-time 15 -X "$method" $opts "$BASE$path")
  printf "%-50s %-6s %s\n" "$path" "$method" "$out"
}

# ─── 2. Public endpoints ────────────────────────────────────────────────
echo "=== Public endpoints ==="
printf "%-50s %-6s %s\n" "endpoint" "method" "status duration_s"
probe GET  /sitemap.xml
probe GET  /robots.txt
probe GET  /blog/rss.xml
probe POST /api/contact-form
probe POST /api/tools/newsletter

# ─── 3. Authenticated CRUD ──────────────────────────────────────────────
echo ""; echo "=== Authenticated CRUD ==="
printf "%-50s %-6s %s\n" "endpoint" "method" "status duration_s"
COOKIE_HEADER="-b 'sb-${REF}-auth-token=${COOKIE_VAL}'"
for p in /api/clients /api/invoices /api/time-entries /api/projects /api/profile /api/settings /api/billing/status /api/dashboard/stats /api/expenses /api/notifications /api/analytics/forecast /api/contracts /api/proposals /api/tags /api/portfolio /api/calendar-events /api/business-expenses; do
  probe GET "$p" "$COOKIE_HEADER"
done

# ─── 4. Webhooks (POST empty body) ──────────────────────────────────────
echo ""; echo "=== Webhooks (expect 4xx/503 not 5xx) ==="
printf "%-50s %-6s %s\n" "endpoint" "method" "status duration_s"
for p in /api/stripe/webhook /api/lemonsqueezy/webhook /api/webhooks/test /api/webhooks/fire /api/gmail/callback /api/outlook/callback /api/payments/webhook; do
  probe POST "$p"
done

# ─── 5. AI sample (POST with payload) ───────────────────────────────────
echo ""; echo "=== AI sample ==="
printf "%-50s %-6s %s\n" "endpoint" "method" "status duration_s"
probe POST /api/ai/scan-receipt "-b 'sb-${REF}-auth-token=${COOKIE_VAL}' -H 'Content-Type: application/json' -d '{}'"
probe POST /api/v1/ai/invoice-description-writer "-b 'sb-${REF}-auth-token=${COOKIE_VAL}' -H 'Content-Type: application/json' -d '{\"items\":[\"web design\"]}'"
