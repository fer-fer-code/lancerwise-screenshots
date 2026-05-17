# [AGENT 3] Pre-launch security audit — SUMMARY

**Audit date**: 2026-05-17
**Scope**: 4 areas (exposed secrets, RLS policies, unauthed endpoints, CORS/CSRF/webhooks)
**Mode**: Recon only — NO fixes applied, NO production data touched, NO attack payloads run.

## Severity counts

| Severity | Count | Status |
| -------- | ----- | ------ |
| **P0 critical** | **0** | _none — no immediate-exploit findings_ |
| **P1 high** (must fix before launch) | **4** | review + schedule for fix sprint |
| **P2 medium** (fix in first month) | **7** | review + assign to backlog |
| **P3 low** (post-launch polish) | **2** | document only |

Stopping condition NOT triggered — no P0 critical found, no evidence of past exploitation. Submitting full findings for triage.

---

## P0 — none

No findings rise to P0. Notable near-misses that would have been P0:
- ✗ **service_role JWT in client bundle** → confirmed `role: "anon"` only (Area 1).
- ✗ **RLS completely off on sensitive tables** → confirmed 407/407 tables RLS-enabled (Area 2).
- ✗ **debug/admin endpoints exposed** → all return 404 (Area 1).
- ✗ **stack traces in error bodies** → 404 body clean (Area 1).

These were the explicit P0 patterns from the brief. None present.

---

## P1 — high priority, MUST fix before public launch (4 findings)

### P1-1 — `portal_messages` RLS allows anonymous full CRUD
**Where**: RLS policy `Public access portal messages` on `public.portal_messages`
```sql
cmd=ALL  qual=true  with_check=true
```
**Exploit**: Anyone with the public anon key can SELECT/INSERT/UPDATE/DELETE
any row across all client portals via direct Supabase client.
**Current impact**: 0 (table empty pre-launch); becomes live exploit at first portal use.
**Fix**: Drop the permissive policy + drop "Public can read messages by token" (also `qual=true`), route public read through `/api/portal/[token]/messages` service-role handler with token validation.
**Effort**: 30 min.
**Details**: [`02-rls-gaps.md` § P1-A](02-rls-gaps.md)

### P1-2 — `project_surveys` RLS allows anonymous full CRUD
**Where**: RLS policy `Anyone can view and submit survey by token` on `public.project_surveys`
```sql
cmd=ALL  qual=true  with_check=true
```
Same shape as P1-1.
**Current impact**: 0 (empty pre-launch); becomes live exploit at first project survey use.
**Fix**: Same pattern as P1-1.
**Effort**: 30 min.
**Details**: [`02-rls-gaps.md` § P1-B](02-rls-gaps.md)

### P1-3 — OAuth callback state misuse (Gmail + Outlook)
**Where**: `src/app/api/gmail/callback/route.ts:8` + `src/app/api/outlook/callback/route.ts:8`
```typescript
const userId = searchParams.get('state')   // attacker-controlled
await supabase.from('gmail_connections').upsert({ user_id: userId, access_token, ... })
```
**Exploit**: Attacker initiates OAuth with `state=<victim_user_id>`, signs in to their own Gmail/Outlook, victim's row gets attacker's tokens — integration hijack.
**Current impact**: Low (integrations not heavily used yet); high once launched.
**Fix**: Server-stored nonce pattern — generate random UUID at init, persist to new `oauth_states` table, validate + delete on callback. Migration + ~30 lines code change.
**Effort**: 1 hour.
**Details**: [`03-public-endpoints.md` § P1](03-public-endpoints.md)

### P1-4 — `STRIPE_WEBHOOK_SECRET` missing from Vercel env
**Where**: Vercel env inventory (no STRIPE_* vars at all) vs `src/app/api/stripe/webhook/route.ts:22`
```typescript
if (webhookSecret && sig) { ... } else { /* skip verification */ }
```
**Current impact**: 0 (Stripe disabled entirely — no STRIPE_SECRET_KEY either).
**Exposure when activated**: Anyone POSTs forged event → free Pro plan, mass-cancel subscriptions, etc.
**Fix**: Set env var + remove fail-open branch in code (fail-closed). Bundle as part of Stripe activation checklist.
**Effort**: 30 min (when Stripe is being activated).
**Details**: [`04-cors-csrf-webhooks.md` § P1](04-cors-csrf-webhooks.md)

---

## P2 — medium priority, fix in first post-launch sprint (7 findings)

### P2-1 through P2-6 — Permissive SELECT RLS policies (anonymous data enumeration)

Tables with `USING (true)` SELECT policies — anyone can dump full table via anon key:

| Table | Data leaked | Severity context |
| ----- | ----------- | ---------------- |
| `client_portals` | All portal records (tokens, owners, configs) | P2 — token exposure aids further attack |
| `client_surveys` | All survey records (questions, owners, tokens) | P2 |
| `portal_files` | All file metadata (names, sizes, owners) | P2 |
| `survey_responses` | All customer responses across all users | **High P2 — customer feedback privacy** |
| `testimonial_requests` | All pending testimonial requests | P2 |
| `quotes` | All sent/accepted/declined quotes (clients, amounts) | **High P2 — business deal data** |

**Common fix**: Drop the `qual=true` policies; route public reads through service-role API handlers that filter by token in code.
**Effort total**: 1 hour for all 6.
**Details**: [`02-rls-gaps.md` § P2-A to P2-F](02-rls-gaps.md)

### P2-7 — Contact forms unrate-limited / no Turnstile
**Where**: 5 routes — `contact-form`, `portfolio-site/contact`, `pricing-page/contact`, `portfolio/contact`, `profile/[slug]/contact`
**Exploit**: Spam DoS, Resend cost amplification, owner inbox flood. `TURNSTILE_SECRET_KEY` already in Vercel env (used by /login/register) but not enforced on contact forms.
**Fix**: Add `verifyTurnstile(token)` check + Upstash Redis rate limit (3/hour/IP). Upstash creds already configured.
**Effort**: 2 hours (5 routes × add 2 checks + client widget mount).
**Details**: [`03-public-endpoints.md` § P2](03-public-endpoints.md)

---

## P3 — low priority, post-launch polish (2 findings)

### P3-1 — `/api/contact-form` HTML interpolation in admin email
**Where**: `src/app/api/contact-form/route.ts`
User inputs (`name`, `email`, `company`, `message`) interpolated raw into HTML email sent to admin. Modern email clients (Gmail web) sanitize, but attribute-vector XSS possible in poorly-sanitizing clients.
**Fix**: `escapeHtml()` helper, apply to all interpolated values. Same pattern for the other 4 contact routes when fixing P2-7.
**Effort**: 10 min per file.
**Details**: [`03-public-endpoints.md` § P3](03-public-endpoints.md)

### P3-2 — CSP header absent
**Where**: `next.config.ts` `securityHeaders` array
All other security headers present (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) but no Content-Security-Policy. Would mitigate any future XSS but requires per-route tuning for Next.js inline scripts + PostHog + Sentry monitoring tunnel.
**Fix**: Define base CSP, test against production routes, gradually tighten.
**Effort**: 1 day (test + tune iteratively).
**Details**: [`04-cors-csrf-webhooks.md`](04-cors-csrf-webhooks.md)

---

## What was checked (positive findings)

- ✅ **407/407 public-schema tables have RLS enabled** (no `rowsecurity=false`)
- ✅ **No service_role JWT in client bundle** (only `role: anon` — by design)
- ✅ **All 7 `NEXT_PUBLIC_*` env vars are safe-to-expose** (Supabase anon, PostHog public key, Sentry DSN, Turnstile site key, public URLs)
- ✅ **No exposed file routes** (`.git/.env/.env.local/admin/internal/debug/server-info/package.json` all 404)
- ✅ **404 body has zero stack traces / paths / env leaks**
- ✅ **Full standard security headers set** (HSTS preload-eligible, X-Frame-Options, nosniff, Permissions-Policy)
- ✅ **CORS appropriate** (`*` only on Bearer-token v1 API; same-origin default elsewhere)
- ✅ **Stripe webhook handler does verify signature when env var present** (just missing env var)
- ✅ **`/api/portal/time-approval` properly validates token via DB lookup** (sampled spot-check)
- ✅ **`/api/contracts/sign` properly validates token via fallback chain** (sampled spot-check)
- ✅ **Turnstile properly enforced on auth pages** (/login, /register, /forgot-password)
- ✅ **2601/2685 API routes have auth pattern** (97% coverage); remaining 84 mostly intentional public-token endpoints

---

## Files in this audit

| File | Purpose |
| ---- | ------- |
| [`SUMMARY.md`](SUMMARY.md) | this — severity-ordered findings + recommended order of fix |
| [`01-exposed-secrets.md`](01-exposed-secrets.md) | Area 1 detail — clean |
| [`02-rls-gaps.md`](02-rls-gaps.md) | Area 2 detail — 2 P1 + 5 P2 RLS findings |
| [`02-rls-raw-policies.txt`](02-rls-raw-policies.txt) | raw `pg_policies` dump for the 24 flagged policies |
| [`03-public-endpoints.md`](03-public-endpoints.md) | Area 3 detail — OAuth P1 + contact-form P2 + HTML-interp P3 |
| [`03-no-auth-routes-raw.txt`](03-no-auth-routes-raw.txt) | raw list of 84 no-auth routes |
| [`04-cors-csrf-webhooks.md`](04-cors-csrf-webhooks.md) | Area 4 detail — Stripe-webhook-secret P1 + CSRF-default P2 |

---

## Recommended fix order

Sequenced for fastest risk reduction:

1. **P1-1 + P1-2 (RLS)** — 1 hour total. Drop 2 policies + verify route handlers. Removes anonymous full-CRUD bypass risk.
2. **P1-3 (OAuth state)** — 1 hour. New `oauth_states` table + nonce-binding. Removes integration-hijack vector.
3. **P2-1..6 (permissive SELECT RLS)** — 1 hour. Drop 6 policies + verify token-equality filters in public-API handlers.
4. **P2-7 (contact form spam)** — 2 hours. Turnstile + rate limit. Removes spam DoS + cost amplification.
5. **P1-4 (Stripe webhook)** — DEFER until Stripe activation. Bundle with activation runbook.
6. **P3-1 (HTML escape)** — 10 min during P2-7 fixes (same files).
7. **P3-2 (CSP)** — 1 day. Schedule for week 2 post-launch.

Total P1+P2 fix effort: **~5 hours**, can ship in single bug-fix sprint.

## Cross-links

- Earlier security-adjacent work: `feedback_vercel_env_patch_pattern.md` (PATCH-target pattern for env var changes when fixing P1-4)
- Memory of architecture: `project_lancerwise_email_infrastructure.md` (Resend send via lancerwise.com)
- Memory of payment provider: `backlog_payment_provider_decision.md` (LemonSqueezy primary, Stripe backup)
