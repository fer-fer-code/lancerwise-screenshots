# Phase 7 — Pre-flip smoke (template, results pending production deploy)

After production deploy of commit `9adb8dd0` (PR #75 squash) completes, before flipping `NEXT_PUBLIC_PAYMENT_PROVIDER` to `lemonsqueezy`, verify:

## A. LS webhook endpoint exists (responds 4xx, not 200 → /_not-found)

```bash
curl -i -X POST https://www.lancerwise.com/api/lemonsqueezy/webhook
```

Expected:
- HTTP 401 with body `{"error":"invalid signature"}` (handler ran, signature check failed because of empty payload + no x-signature header)
- NOT 200 with `x-matched-path: /_not-found` (that would mean route still absent)
- NOT 503 with `{"error":"webhook secret not configured"}` (that would mean env var missing)

## B. Stripe subscribe endpoint still works (no regression)

```bash
curl -i -X POST https://www.lancerwise.com/api/stripe/subscribe \
  -H 'Content-Type: application/json' -d '{}'
```

Expected:
- HTTP 401 with `{"error":"Unauthorized"}` (auth check fires before plan check — no session = 401)
- NOT 500 (handler exists, no env-var crash)

## C. Pro CTA on /upgrade still says "Upgrade to Pro" while toggle still = stripe

(Manual visual check via curl, no UI changes expected since `NEXT_PUBLIC_PAYMENT_PROVIDER` is still unset = defaults to 'stripe' branch in client components.)

## D. /api/billing/status, /api/clients etc. still work for authed users

Quick re-run of subset from `audit/agent3-api-smoke-tests/scripts/smoke-test.sh` Section B.

---

Results to be filled in once production READY.
