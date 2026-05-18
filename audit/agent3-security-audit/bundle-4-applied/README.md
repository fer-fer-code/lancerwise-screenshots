# [AGENT 3] Bundle 4 — P2-7 contact-form Turnstile + rate-limit APPLIED

Resolves [`../SUMMARY.md`](../SUMMARY.md) finding **P2-7**: 5 (now 6, after grep
turned up `/api/contact/[username]`) public no-auth contact endpoints were
unrate-limited + had no CAPTCHA, despite `TURNSTILE_SECRET_KEY` and Upstash
Redis env vars being present.

## Status

| Item | Status |
| ---- | ------ |
| Identify exact endpoints + client form components | ✓ — 6 endpoints + 6 forms |
| Add `contactRatelimit()` factory (3/hour/IP) | ✓ `src/lib/security/ratelimit.ts` |
| Server-side enforcement on 6 endpoints | ✓ — applyRatelimit=2 + verifyTurnstile=2 each |
| Client-side TurnstileWidget mount on 6 forms | ✓ — import=1 + header=1 + captchaToken refs=3 each |
| PR opened | ✓ — [#42](https://github.com/fer-fer-code/lancerwise/pull/42) |
| Live HTTP exploit verification | _deferred to post-merge_ (preview URL gets SEO-308'd to prod where OLD code still runs) |

## Architecture

```
Server-side (every handler):
   1. ip = getClientIp(req)               // x-forwarded-for / x-real-ip / cf-connecting-ip
   2. rl = await applyRatelimit(contactRatelimit(), `<route>:${ip}`)
      ↳ 429 with X-RateLimit-* + Retry-After if exceeded
   3. turnstile = await verifyTurnstile(req.headers.get('cf-turnstile-response'), ip)
      ↳ 403 'CAPTCHA verification failed.' if invalid
   4. (existing body parse / DB / email logic — unchanged)

Client-side (every form):
   const [captchaToken, setCaptchaToken] = useState('')
   const turnstileRequired = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
   ...
   <TurnstileWidget onSuccess={setCaptchaToken} ... />
   <button disabled={sending || (turnstileRequired && !captchaToken)} />
   fetch(url, { headers: { ..., 'cf-turnstile-response': captchaToken }, ... })
```

Graceful fallback: if `TURNSTILE_SECRET_KEY` or `UPSTASH_REDIS_REST_URL` env
is unset (dev), both helpers return `{ success: true }`. Production has both.

## Endpoints + components

| API endpoint | Client component | Use case |
|--------------|-----------------|----------|
| `/api/contact-form` | `src/app/contact/ContactForm.tsx` | Site-wide contact form (`/contact`) |
| `/api/pricing-page/contact` | `src/app/pricing/[slug]/PublicContactForm.tsx` | Per-pricing-page contact (`/pricing/[slug]`) |
| `/api/portfolio-site/contact` | `src/app/p/[username]/PortfolioPublicClient.tsx` | Portfolio-site contact (`/p/[username]`) |
| `/api/portfolio/contact` | `src/app/portfolio/[handle]/PortfolioPageView.tsx` | Alt portfolio contact (`/portfolio/[handle]`) |
| `/api/profile/[slug]/contact` | `src/app/profile/[handle]/ProfileContactForm.tsx` | Public profile contact |
| `/api/contact/[username]` | `src/app/profile/[handle]/ContactForm.tsx` | Username-keyed contact |

## Why pre-DB enforcement

Rate-limit + CAPTCHA checks happen BEFORE any side effect:
- Resend send (cost: $0.0004/email)
- Supabase row INSERT (storage + write)
- In-app notification row INSERT
- Webhook fire

An attacker hitting the rate limit consumes ZERO of these. Spam DoS surface
reduces to **1 Upstash REST request per blocked attempt**.

Pre-fix: 100k spam requests → 100k Resend sends ($40 cost) + 100k Supabase
inserts (burn user's row quota + storage).

Post-fix: 100k spam requests → 100k Upstash checks (Upstash free tier: 10k
commands/day for /first 30 days; pay-as-you-go after — fractional cost vs
Resend amplification).

## Verification plan

| # | Scenario | Expected | Tool |
|---|----------|----------|------|
| 1 | POST without `cf-turnstile-response` header | `403 {"error":"CAPTCHA verification failed."}` | curl post-merge |
| 2 | POST with invalid token (e.g., `fake`) | `403` | curl post-merge |
| 3 | POST 4× from same IP within 1 hour | First 3: 403 (no token), 4th: `429` + `Retry-After` | curl post-merge |
| 4 | POST with valid Turnstile token | Reaches handler | manual browser smoke |
| 5 | Wait 1 hour, retry | Window reset, accepts | manual after wait |

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — architecture + verification plan |
| `post-merge-http-tests.md` | _added after merge_ — live curl results for tests 1-3 |

## Cross-links

- PR: https://github.com/fer-fer-code/lancerwise/pull/42
- Audit source: [`../SUMMARY.md`](../SUMMARY.md) finding P2-7
- Bundle 1 (merged): `85cf792c`; Bundle 2 (merged): `99255f19`; Bundle 3 (merged): `4f5b4b3e`
- Pattern reference: existing `authRatelimit()` / `aiRatelimit()` / `apiRatelimit()` in `/lib/security/ratelimit.ts`
- Existing Turnstile usage: `/login`, `/register`, `/forgot-password` (client-side mount only — no server enforcement until this PR)

## Security audit roadmap status (post Bundle 4)

| Bundle | Status |
| ------ | ------ |
| Bundle 1 (P1-1 + P1-2) RLS qual=true on portal_messages + project_surveys | ✓ MERGED |
| Bundle 2 (P1-3) OAuth state binding for gmail+outlook | ✓ MERGED |
| Bundle 3 (P2-A..P2-F) 6 permissive SELECT RLS | ✓ MERGED |
| Bundle 4 (P2-7) Turnstile + rate-limit on 6 contact endpoints | ✅ THIS PR |
| Bundle 5 (P1-4) STRIPE_WEBHOOK_SECRET | deferred → Stripe activation runbook |
| Polish (P3-1 HTML escape, P3-2 CSP) | deferred → post-launch |
