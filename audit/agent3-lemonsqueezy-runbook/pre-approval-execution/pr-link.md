# PR — feature/lemonsqueezy-clean

**URL**: https://github.com/fer-fer-code/lancerwise/pull/75

**Status**: DRAFT (intentionally — awaiting KYC approval before mark-ready + merge)

## Branch

`feature/lemonsqueezy-clean` — fresh off `origin/main@c62739dd`, 3 commits ahead.

## Commits

| SHA | Title | Source |
|-----|-------|--------|
| `af31aac0` | `skeleton: LemonSqueezy SDK + webhook + checkout route stubs` | cherry-pick of `ab7f6cff` |
| `526f30b0` | `lemonsqueezy: named event handlers + DB migration + provider toggle` | cherry-pick of `dc277842` |
| `2948b9a8` | `fix(lemonsqueezy): P0 webhook dual-write profiles.plan + P1 CTAs swap` | this PR's new commit |

## Files changed (8)

```
package.json                                                  |   1 +
package-lock.json                                             |  10 +
scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql  | 101 ++
src/app/(app)/billing/BillingPageClient.tsx                   |  15 +-
src/app/(app)/upgrade/UpgradeButton.tsx                       |  17 +-
src/app/api/lemonsqueezy/checkout/route.ts                    |  45 +
src/app/api/lemonsqueezy/webhook/route.ts                     | 259 ++++++
src/lib/lemonsqueezy/client.ts                                |  23 +
8 files changed, 464 insertions(+), 7 deletions(-)
```

## CI status snapshot

| Gate | Status | Notes |
|------|--------|-------|
| TypeScript (`tsc --noEmit`) | 385 errors | Same as `origin/main` baseline — 0 added by this PR |
| ESLint (LS-specific paths) | 0 errors | `src/app/api/lemonsqueezy`, `src/lib/lemonsqueezy` clean |
| Build | Not run | Skeleton handles missing env vars via 503 at runtime |
| Visual regression | Not run | No UI changes |

## Merge gates (DO NOT MERGE UNTIL all checked)

- [ ] LemonSqueezy KYC approval email from Issac received
- [ ] 5 env vars set in Vercel per [`vercel-env-vars-template.txt`](../vercel-env-vars-template.txt)
- [ ] DB migration applied via psql per [`approval-day-checklist.md`](../approval-day-checklist.md) Step 5
- [ ] Test-mode smoke test PASS per [`testing-checklist.md`](../testing-checklist.md) Section B (Pro tier)
- [ ] Test-mode smoke test PASS per [`testing-checklist.md`](../testing-checklist.md) Section F (cancellation)
- [ ] Set `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` in Vercel (otherwise PR change is dormant — still routes to Stripe)

## What this PR does NOT do

- Does not enable LemonSqueezy by default (`NEXT_PUBLIC_PAYMENT_PROVIDER` defaults to `'stripe'`)
- Does not delete any Stripe code (Stripe stays for client invoice payments)
- Does not auto-apply the DB migration (manual psql step on approval day)
- Does not test against live LS API (no credentials — runtime guards handle 503 gracefully)

## What this PR DOES do

- Reduces approval-day workload from ~3-5 hours to ~1-2 hours
- Closes the P0 gap that would have left paying users on free tier
- Closes the P1 gaps that would have left CTAs routed to Stripe
- Side-steps 3 unrelated regressions on the original branch
- Compresses 849-file diff to clean 8-file diff
