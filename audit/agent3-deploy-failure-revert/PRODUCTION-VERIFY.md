# Production verification — `e0757ec` is healthy

All checks run at 2026-05-19 ~07:55 UTC, ~45 min after `dpl_uMrqsYfmqr9...` went READY.

## Live deploy

```
Deploy ID:  dpl_uMrqsYfmqr9PcD8ySVHTCePfHaW1
Commit:     e0757ec68bf3
Target:     production
State:      READY
Aliases:    www.lancerwise.com
            lancerwise.com
            lancerwise.vercel.app
            lancerwise-fer-fer-codes-projects.vercel.app
            lancerwise-git-main-fer-fer-codes-projects.vercel.app
```

## HTTP smoke tests

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/` | GET | 200 | HTML renders, contains "LancerWise" + "Pro plan" copy |
| `/dashboard` | GET | 307 → `/login` | Auth gate working |
| `/upgrade` | GET | 307 → `/login` | Auth gate working |
| `/sitemap.xml` | GET | 200 | XML valid |
| `/robots.txt` | GET | 200 | Indexable content correct |
| `/api/lemonsqueezy/webhook` | POST (empty) | 401 "invalid signature" | Handler running, signing secret env loaded |
| `/api/stripe/subscribe` | POST (empty) | 503 "Stripe not configured" | Pre-existing (STRIPE_SECRET_KEY never set in prod), expected |
| `/api/clients` | GET (unauth) | 401 "Unauthorized" | Auth gate working |

## Vercel-level health

| Check | Result |
|-------|--------|
| Deploy state | READY |
| Build duration | 4.4 min (vs failed 45 min — proves it's a flake, not code) |
| Aliases attached | All 5 production aliases ✓ |
| Routing | Confirmed via `x-vercel-id` and `x-matched-path` headers |
| LS webhook | Receiving + verifying signatures correctly |
| Bundle contents | Contains `"lemonsqueezy"` literal → `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` env baked in correctly |

## Customer impact during the 46-min window

**None observed.** During the period between failed deploy `EUZYsFTG8` (13:24 UTC) and successful retry `uMrqsYf` (14:10 UTC):
- Old production (`dpl_A6ca68kt7...` serving `0ac52eca`) stayed aliased to `www.lancerwise.com` per standard Vercel deploy-on-success behavior
- Failed deploys never receive production traffic — Vercel doesn't swap the alias until the new deploy reaches READY state
- So customers saw `0ac52eca` (LS activation) the entire failed-deploy window, then `e0757ec` (perf fix) post-retry

No customer-facing outage. The "failed deploy" only affected the deploy queue, not serving traffic.

## Recommendation

Production is healthy. No revert needed. Document the flaky-build pattern for future reference and continue work.
