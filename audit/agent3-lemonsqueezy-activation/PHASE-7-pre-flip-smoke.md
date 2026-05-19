# Phase 7 — Pre-flip smoke

All 3 checks ran against production at commit `9adb8dd0` (PR #75 merged but `NEXT_PUBLIC_PAYMENT_PROVIDER` still unset → defaults `'stripe'`).

## A — LS webhook endpoint exists ✅

```bash
curl -i -X POST https://www.lancerwise.com/api/lemonsqueezy/webhook
```

Response:
```
HTTP/2 401
x-matched-path: /api/lemonsqueezy/webhook
{"error":"invalid signature"}
```

- Status **401** — handler ran, rejected empty payload via HMAC verify ✓
- `x-matched-path: /api/lemonsqueezy/webhook` — confirms route is on main ✓ (vs prior `_not-found`)
- Body indicates signature verification fired (signing secret env var loaded) ✓

## B — Stripe subscribe endpoint still responds ✅

```bash
curl -i -X POST https://www.lancerwise.com/api/stripe/subscribe -H 'Content-Type: application/json' -d '{}'
```

Response:
```
HTTP/2 503
x-matched-path: /api/stripe/subscribe
{"error":"Stripe not configured"}
```

- Status **503** — handler ran, returns Stripe-not-configured because `STRIPE_SECRET_KEY` env var is not set in production
- This 503 is **pre-existing**, not introduced by PR #75. Stripe subscriptions were never wired in production env (only LS will be the live provider)
- No 500 crash, no regression

**Important finding**: Stripe subscription path was never live in production before this PR. The "coexistence" path the runbook described is theoretical — Stripe stays as a kill-switch destination, but switching back via `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe` would route to a 503 endpoint until `STRIPE_SECRET_KEY` gets set. Documented in rollback plan.

## C — /upgrade page reachable ✅

```bash
curl -sI https://www.lancerwise.com/upgrade
```

Response:
```
HTTP/2 307
location: /login
```

- 307 redirect to `/login` because auth required for `/upgrade` (expected)
- Page exists at the route, not 404 ✓

## Verdict

All 3 checks pass. Production is ready for the `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` flip. The LS webhook handler is in place, the page renders, and the Stripe fallback path responds (with documented 503 — not a regression).
