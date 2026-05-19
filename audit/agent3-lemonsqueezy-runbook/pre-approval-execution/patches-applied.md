# P0/P1 patches applied — pre-approval execution

**Branch**: `feature/lemonsqueezy-clean` off `origin/main@c62739dd`
**PR**: https://github.com/fer-fer-code/lancerwise/pull/75 (draft)
**Approach**: clean cherry-pick (side-stepped 849-file divergence on original branch)

## Commit tree

```
c62739dd  origin/main (base)
   ↓
af31aac0  cherry-pick: ab7f6cff (skeleton)
526f30b0  cherry-pick: dc277842 (handlers + migration + PAYMENT_PROVIDER toggle)
2948b9a8  THIS PR: P0 + P1 fixes  ← HEAD
```

## P0-1 — Webhook dual-write to `profiles.plan`

**Problem**: Cherry-picked handlers wrote only to new `subscriptions` table. UI gating reads `profiles.plan` ('free'|'pro'|'team') + `profiles.plan_expires_at` — users would pay $15/mo and stay on free tier in UI.

**Fix**: `src/app/api/lemonsqueezy/webhook/route.ts` — added `planFromVariant()` helper + `profiles` dual-write to 4 handlers.

| Handler | Subscriptions table | Profiles table |
|---------|---------------------|----------------|
| `handleSubscriptionCreated` | Upsert with `plan_id` + status | If status ∈ {active, on_trial}: `plan`, `plan_expires_at`, `lemonsqueezy_customer_id` |
| `handleSubscriptionUpdated` | Status + period + plan_id | If status ∈ {active, on_trial}: `plan`, `plan_expires_at` |
| `handleSubscriptionResumed` | Status + period + plan_id | `plan`, `plan_expires_at` |
| `handleSubscriptionExpired` | Status = 'expired' | `plan = 'free'`, `plan_expires_at = null` |
| `handleSubscriptionCancelled` | Status = 'cancelled', `cancel_at_period_end = true` | **No change** — user keeps access until period end (parallels Stripe pattern) |

**Plan mapping**: `String(variant_id) === LEMON_VARIANT_TEAM ? 'team' : 'pro'` — default falls to 'pro' for safety on unknown variants.

## P1-a — BillingPageClient.tsx PAYMENT_PROVIDER toggle

**Before**: Direct `fetch('/api/stripe/subscribe', { plan })`.

**After**: Reads `NEXT_PUBLIC_PAYMENT_PROVIDER` env (defaults `'stripe'`); when set to `'lemonsqueezy'`, routes to `/api/lemonsqueezy/checkout` with `{ tier }` payload. Matches the existing pattern in `UpgradeButton.tsx`.

Kill-switch: unset env or set to `'stripe'` → returns to Stripe path immediately.

## P1-b — UpgradeButton analytics provider unhardcoded

**Before**: `track('checkout_started', { plan, provider: 'stripe' })` always sent `'stripe'` regardless of which path was actually used.

**After**: `track('checkout_started', { plan, provider })` — uses the dynamic provider variable (matches actual code path). Also relaxed the 503 condition: removed `data.error === 'Stripe not configured'` string-match (was provider-specific); now any 503 shows generic "Payments not yet configured" message.

## Migration: `profiles.lemonsqueezy_customer_id`

**File**: `scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql`

Added `alter table profiles add column if not exists lemonsqueezy_customer_id text;` before `subscriptions` table creation. Mirrors existing `profiles.stripe_customer_id`. Allows surfacing LS customer portal links in `/billing` without needing to join through subscriptions.

The webhook handler `handleSubscriptionCreated` now writes this column.

## CI/typecheck status

- `npx tsc --noEmit` on `feature/lemonsqueezy-clean`: **385 errors**
- `npx tsc --noEmit` on `origin/main` (baseline): **385 errors**
- My edits add **0 new errors** (pre-existing errors in `/api/v1/ai/*` files I never touched)
- `npx eslint src/app/api/lemonsqueezy src/lib/lemonsqueezy`: **clean** (no warnings/errors)

## Final diff stats

```
package.json                                       |   1 +
package-lock.json                                  |  10 +
scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql |  101 +++++
src/app/(app)/billing/BillingPageClient.tsx        |  15 +-
src/app/(app)/upgrade/UpgradeButton.tsx            |  17 +-
src/app/api/lemonsqueezy/checkout/route.ts         |  45 +++
src/app/api/lemonsqueezy/webhook/route.ts          | 259 ++++++++++++
src/lib/lemonsqueezy/client.ts                     |  23 +
8 files changed, 464 insertions(+), 7 deletions(-)
```
