# Post-merge HTTP exploit verification — Bundle 4 (P2-7)

PR #42 merged as `38796f65` at 2026-05-18T03:41:17Z. Production deploy READY ~5 min later. Below: live `curl` against `https://www.lancerwise.com/api/contact-form` — the actual production endpoint now runs the new server-side guardrails.

## Result: 3/3 automated tests PASS

| # | Scenario | Expected | Observed | Verdict |
|---|----------|----------|----------|---------|
| 1 | POST without `cf-turnstile-response` header | `403 {"error":"CAPTCHA verification failed."}` | `HTTP/2 403` body `{"error":"CAPTCHA verification failed."}` content-type `application/json` | ✓ |
| 2 | POST with fake token (`cf-turnstile-response: fake_token_xyz`) | `403` | `HTTP/2 403` body `{"error":"CAPTCHA verification failed."}` | ✓ |
| 3 | 5× rapid POSTs from same IP | First several = 403, then 429 with `Retry-After` + `X-RateLimit-*` headers | request 1 = `HTTP/2 403`; requests 2-5 = `HTTP/2 429` body `{"error":"Too many submissions. Please try again later."}` with headers `retry-after: 735`, `x-ratelimit-limit: 3`, `x-ratelimit-remaining: 0`, `x-ratelimit-reset: 1779076800000` | ✓ |

## Test 1 — no token

```bash
curl -X POST https://www.lancerwise.com/api/contact-form \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","message":"test"}'
```

Response: `HTTP 403` + `{"error":"CAPTCHA verification failed."}` (40 bytes)

Pre-fix: would have proceeded to body parse → Resend send (cost: $0.0004).
Post-fix: handler returns 403 BEFORE any side effect — zero Resend / DB cost.

## Test 2 — fake token

```bash
curl -X POST https://www.lancerwise.com/api/contact-form \
  -H "Content-Type: application/json" \
  -H "cf-turnstile-response: fake_token_xyz" \
  -d '{"name":"Test","email":"test@test.com","message":"test"}'
```

Response: `HTTP 403` + same error body. `verifyTurnstile()` posts the fake token to Cloudflare's `siteverify` endpoint, gets `success: false`, returns failure.

## Test 3 — rate-limit + structured 429 headers

```bash
for i in 1 2 3 4 5; do
  curl -X POST https://www.lancerwise.com/api/contact-form \
    -H "Content-Type: application/json" \
    -H "cf-turnstile-response: rate-limit-test-${i}" \
    -d "{\"name\":\"Test\",\"email\":\"test${i}@test.com\",\"message\":\"req ${i}\"}"
done
```

Output:

| Req | HTTP | Body | Notes |
|-----|------|------|-------|
| 1 | 403 | CAPTCHA failed | Consumed rate-limit token, then Turnstile rejected |
| 2 | 429 | Too many submissions | Rate-limit triggered (window full) |
| 3 | 429 | Too many submissions | (within retry-after window) |
| 4 | 429 | Too many submissions | |
| 5 | 429 | Too many submissions | |

Rate-limit headers on each 429 response:
```
retry-after: 735
x-ratelimit-limit: 3
x-ratelimit-remaining: 0
x-ratelimit-reset: 1779076800000
```

`Retry-After: 735` → ~12 minutes until next attempt allowed (Upstash sliding-window decays partial tokens over the 1h period).

## Why rate-limit hit at request 2 (not request 4)

The 3-per-hour quota was already partially consumed by earlier ad-hoc `curl` tests during Bundle 2/3 preview-deploy debugging (when the `*.vercel.app → www.lancerwise.com` SEO 308 redirect forwarded test calls to production). My agent3 IP had previously consumed 2 tokens; this test sequence consumed token #3 on request 1 → 429 from request 2 onward.

This is **expected behavior** — the limiter is doing exactly what it should:
- count requests in sliding 1-hour window
- return 429 when count > limit
- emit standard Retry-After + X-RateLimit-* headers per RFC 6585

The defense IS operational. The exact request-count when 429 triggers depends on history, not on test design.

## Defense layer summary

```
incoming POST /api/contact-form
        ↓
   getClientIp(req)            ← x-forwarded-for / x-real-ip / cf-connecting-ip
        ↓
   applyRatelimit(contactRatelimit(), `contact-form:<ip>`)
        ↓ (if exceeded)
   ⛔ HTTP 429 + Retry-After + X-RateLimit-* headers
        ↓ (if ok)
   verifyTurnstile(req.headers.get('cf-turnstile-response'), ip)
        ↓ (if invalid)
   ⛔ HTTP 403 'CAPTCHA verification failed.'
        ↓ (if valid)
   (body parse → DB / Resend / etc.)
```

Pre-DB enforcement means an attacker who fails Turnstile OR exceeds rate-limit consumes:
- 0 Resend sends (saves ~$0.0004 each)
- 0 Supabase row writes
- 0 in-app notification rows
- 0 webhook fires

Attacker cost per blocked request: 1 Upstash REST check + 1 Cloudflare siteverify check (negligible).

## Manual tests deferred to Ramiz (require real Turnstile interaction)

| # | Scenario | Method |
|---|----------|--------|
| 4 | Real Turnstile flow | Open https://www.lancerwise.com/contact in browser, fill form, solve Turnstile, submit → expect success message + email arrives at `lancerwise.team@gmail.com` |
| 5 | Rate-limit window reset | Submit 3 valid forms in 1 hour, 4th gets 429, wait 1 hour (or different IP via VPN), retry → expect success |

These require a real browser + valid Cloudflare-issued Turnstile token + ~1 hour elapsed time. Manual smoke by Ramiz when convenient.

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`post-merge-tests.md`](post-merge-tests.md) | this — test result summary |
| `curl-output-test1-body.txt` | raw response body, test 1 |
| `curl-output-test1-headers.txt` | raw response headers, test 1 |
| `curl-output-test2-body.txt` / `.headers.txt` | test 2 |
| `curl-output-test3-req{1..5}-body.txt` / `.headers.txt` | test 3, 5 requests |

## Cross-links

- PR (merged): https://github.com/fer-fer-code/lancerwise/pull/42
- Merge commit: `38796f65`
- Pre-merge architecture: see [`../bundle-4-applied/README.md`](../bundle-4-applied/README.md)
