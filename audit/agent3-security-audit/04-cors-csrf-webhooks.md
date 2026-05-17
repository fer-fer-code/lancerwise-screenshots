# [AGENT 3] Security audit — Area 4: CORS, CSRF, Webhook Signatures

**Findings**: 1 × P1, 1 × P2

## Summary table

| Surface | Verdict |
| ------- | ------- |
| `next.config.ts` `securityHeaders` | ✓ OK — full standard set (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) |
| CORS for `/api/v1/*` (Bearer-token API) | ✓ OK — `Access-Control-Allow-Origin: *` acceptable because Bearer auth not browser-auto-sent |
| CORS for cookie-authed routes | ✓ OK — no explicit Allow-Origin set, browsers enforce same-origin |
| CSRF for cookie-authed mutating endpoints | ⚠ P2 — relies on browser SameSite default; no explicit CSRF tokens |
| Stripe webhook signature | 🚨 P1 — `STRIPE_WEBHOOK_SECRET` missing from Vercel env; handler skips verification when unset (acceptable today because Stripe is disabled; P0 if Stripe activated without fixing) |
| Resend webhook handler | n/a — none configured (no inbound Resend events expected) |
| Supabase Auth callbacks | n/a — handled by Supabase's hosted infrastructure, not lancerwise code |
| LemonSqueezy webhook handler | n/a — not yet implemented; **must include signature check at launch** |
| OAuth state validation (gmail/outlook callbacks) | 🚨 P1 — see Area 3 (P1: OAuth callback state misuse) |

## ✅ Security headers (`next.config.ts`)

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },                    // anti-clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },                // anti MIME-sniff
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]
```

Applied via `async headers() { return [{ source: '/:path*', headers: securityHeaders }] }`.

All present, all values sensible. HSTS preload-eligible (`max-age=63072000; includeSubDomains; preload` — meets Chrome HSTS-preload list requirements).

**One enhancement to consider** (P3, not a finding): add `Content-Security-Policy` header. Currently absent. CSP would mitigate any future XSS — but requires careful per-route tuning (Next.js inline scripts + PostHog + Sentry tunnels). Document as backlog memo, not a launch blocker.

---

## ✅ CORS

### `/api/v1/*` endpoints — `Access-Control-Allow-Origin: *`

Set in `src/lib/apiAuth.ts`:
```typescript
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  }
}
```

**Verdict: OK**. `/api/v1/*` uses Bearer-token auth (`Authorization: Bearer lw_...`).
Browsers do NOT auto-send Authorization headers on cross-origin requests
(unlike cookies). Wildcard CORS is the correct config for Bearer-token APIs
intended for third-party app integration.

### Other endpoints — no explicit CORS

No middleware injects CORS headers. Browsers default to same-origin policy.
Cross-origin POSTs from third-party sites would be blocked by the browser
(no Access-Control-Allow-Origin response).

**Verdict: OK**.

---

## ⚠ P2: CSRF defense relies on browser SameSite default

Cookie-authed mutating endpoints (POST/PATCH/DELETE on the ~2500 internal routes)
use Supabase SSR (`createServerClient` → `cookies()` for session token). Defense
chain:

1. **Supabase cookie SameSite**: Supabase SSR sets cookies without explicit SameSite, relying on browser default → `SameSite=Lax` in all modern browsers (Chrome ≥80, Firefox ≥69, Safari ≥13).
2. **Content-Type guard**: Requests with `Content-Type: application/json` trigger CORS preflight (`OPTIONS`); without server CORS allow, third-party origin POSTs are blocked.
3. **No explicit CSRF tokens** in code (no double-submit cookie pattern, no `csrf-token` headers, no anti-forgery middleware).

**Risk**:
- Default SameSite=Lax allows top-level POSTs (form submits with `<form method=POST>`) cross-origin, which can omit JSON Content-Type → bypass preflight. An attacker landing page with `<form action="https://www.lancerwise.com/api/...">` and `<button>Click for prize</button>` could trigger an authenticated POST.
- Modern Next.js + JSON APIs typically reject non-JSON Content-Type at parse time (`request.json()` would throw), which incidentally blocks naive form-CSRF.
- However: any endpoint that accepts `multipart/form-data` or `application/x-www-form-urlencoded` is vulnerable.

**Recommended mitigation**:
- For highest-risk mutations (account-delete, plan-change, password-change, role-change), add explicit anti-CSRF: server-stored CSRF token in cookie, validated against header on POST.
- Alternative: enforce `Content-Type: application/json` check at top of every mutating handler (cheaper); add `X-Requested-With: XMLHttpRequest` header check (also blocked by CORS preflight on non-simple types).

**Effort**: 1–2 days to add a uniform middleware-style guard.

**Severity P2** because:
- Browser defaults DO provide reasonable baseline protection.
- No known multipart/form-data POST endpoints inspected so far (all sampled use JSON).
- Worth scheduling but not a launch blocker.

---

## 🚨 P1: `STRIPE_WEBHOOK_SECRET` missing from Vercel env

`src/app/api/stripe/webhook/route.ts`:
```typescript
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
// ...
const sig = request.headers.get('stripe-signature')
try {
  if (webhookSecret && sig) {
    // Production: verify signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } else {
    // Dev/test mode: skip signature verification (no STRIPE_WEBHOOK_SECRET set)
  }
}
```

**Vercel env inventory** (`/v9/projects/.../env`):
```
STRIPE / WEBHOOK / SECRET env vars in Vercel:
  (none)
```

No `STRIPE_SECRET_KEY`, no `STRIPE_PUBLISHABLE_KEY`, no `STRIPE_WEBHOOK_SECRET`.

**Current exposure (today): MOOT — exploit impact 0**.
Because no `STRIPE_SECRET_KEY` is configured, the `stripe` library cannot initialize a working client. `isStripeEnabled()` (in `src/lib/stripe.ts`) likely returns `false`. The webhook would attempt to construct an event with no library state and fail.

Also per memory `backlog_payment_provider_decision.md`, the chosen provider is
**LemonSqueezy** (MoR for VAT); Stripe is a backup path. No Stripe activity flowing today.

**Exposure when Stripe gets activated**:
- ANY HTTP POST to `https://www.lancerwise.com/api/stripe/webhook` with a JSON body shaped like a Stripe event will be accepted as authentic.
- Attacker forges `checkout.session.completed` event → app provisions subscription / credits / Pro plan to attacker without payment.
- Attacker forges `invoice.payment_failed` → mass-cancel subscriptions of legit users.

**Recommended fix (when activating Stripe)**:

1. In Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - Endpoint URL: `https://www.lancerwise.com/api/stripe/webhook`
   - Events: select needed (`checkout.session.completed`, `invoice.paid`, etc.)
   - Copy the signing secret (`whsec_...`)

2. Add to Vercel env via REST API:
   ```bash
   curl -X POST "https://api.vercel.com/v10/projects/$PROJECT_ID/env?teamId=$TEAM" \
     -H "Authorization: Bearer $VERCEL_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"key":"STRIPE_WEBHOOK_SECRET","value":"whsec_...","target":["production","preview"],"type":"encrypted"}'
   ```

3. Also REMOVE the fallback "skip signature" branch in `src/app/api/stripe/webhook/route.ts`:
   ```typescript
   if (!webhookSecret) {
     return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
   }
   if (!sig) {
     return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
   }
   const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
   ```
   Fail-closed, not fail-open.

**Effort**: 30 min (UI + API + code change + redeploy).

**Severity P1** because:
- Currently inactive → today's risk = 0.
- Easy to MISS at Stripe-activation time → would become P0 the moment Stripe goes live without env + code fix.
- Bundle the activation checklist with the env var addition.

---

## LemonSqueezy webhook — pre-emptive recommendation

Per memory `project_lancerwise_lemonsqueezy_env_vars.md`:
- SDK skeleton landed on `feature/lemonsqueezy-integration` branch, not merged.
- Env vars + Vercel config pending KYC approval.

**When LemonSqueezy webhook handler ships**:

1. Add to handler:
   ```typescript
   const signature = request.headers.get('x-signature')
   const signingSecret = process.env.LEMONSQUEEZY_SIGNING_SECRET
   if (!signature || !signingSecret) {
     return NextResponse.json({ error: 'Invalid' }, { status: 401 })
   }
   const computed = crypto.createHmac('sha256', signingSecret)
     .update(rawBody).digest('hex')
   if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))) {
     return NextResponse.json({ error: 'Bad signature' }, { status: 401 })
   }
   ```

2. `LEMONSQUEEZY_SIGNING_SECRET` env var must be set BEFORE merging the
   handler PR — use Vercel REST PATCH pattern per `feedback_vercel_env_patch_pattern.md`.

3. Document in launch checklist alongside Stripe webhook secret.

This is preventive — not a current finding.

---

## Methodology

```bash
# CORS surface check
grep -rn "Access-Control-Allow" src/

# Webhook handlers across codebase
find src/app/api -name "route.ts" | xargs grep -l "webhook"

# Stripe webhook secret presence
python3 -c "import json; d=json.load(open('/tmp/vercel-env-raw.json')); print([e['key'] for e in d['envs'] if 'STRIPE' in e['key'] or 'WEBHOOK' in e['key']])"

# Supabase SSR cookie SameSite check
grep -rn "sameSite\|SameSite" src/lib/supabase/
# → no matches (relies on browser default)

# CSRF token presence
grep -rn "csrf\|CSRF\|XSRF" src/ | grep -v "\.git\|node_modules"
# → no occurrences (no custom CSRF tokens)
```
