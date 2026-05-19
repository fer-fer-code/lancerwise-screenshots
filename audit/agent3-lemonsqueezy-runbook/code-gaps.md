# Code gaps — must-fix before LemonSqueezy goes live

Findings from reading `feature/lemonsqueezy-integration` branch against current `main`. Five gaps, two are P0 blockers.

## Gap 1 [P0] — Webhook does not update `profiles.plan`

**File**: `src/app/api/lemonsqueezy/webhook/route.ts`

**Issue**: All 5 implemented handlers (`handleSubscriptionCreated`, `Updated`, `Cancelled`, `Resumed`, `Expired`) write only to the new `subscriptions` table. UI gating and feature paywalls across the app read `profiles.plan` ('free'|'pro'|'team') + `profiles.plan_expires_at`. After an LS purchase, the `subscriptions` row says `status='active'` but `profiles.plan` stays `'free'` → user pays $15/mo and stays locked out.

**Reference**: Stripe webhook on main (`src/app/api/stripe/webhook/route.ts:184`) writes:
```typescript
await supabase.from('profiles').update({
  plan: ['pro', 'team'].includes(plan) ? plan : 'pro',
  plan_expires_at: periodEnd,
}).eq('id', userId)
```

**Fix**: In `handleSubscriptionCreated`, `handleSubscriptionUpdated`, `handleSubscriptionResumed`, after the `subscriptions` upsert, also:
```typescript
// Map variant_id → plan name
const planMap: Record<string, 'pro' | 'team'> = {
  [process.env.LEMONSQUEEZY_VARIANT_PRO!]: 'pro',
  [process.env.LEMONSQUEEZY_VARIANT_TEAM!]: 'team',
}
const plan = planMap[String(attrs.variant_id)] ?? 'pro'

if (userId && (attrs.status === 'active' || attrs.status === 'on_trial')) {
  await supabase.from('profiles').update({
    plan,
    plan_expires_at: attrs.renews_at,
  }).eq('id', userId)
}
```

For `handleSubscriptionCancelled` + `handleSubscriptionExpired`: set `profiles.plan = 'free'` once `ends_at` passes (not immediately on `cancelled` — user keeps access until period end).

**Effort**: 30-45 min code + manual test pass through webhook with curl + signed payload.

## Gap 2 [P0] — Subscription CTAs still call Stripe

**Files**:
- `src/app/(app)/upgrade/UpgradeButton.tsx:16` — `fetch('/api/stripe/subscribe', ...)`
- `src/app/(app)/billing/BillingPageClient.tsx:133` — same

**Issue**: After LS is enabled, clicking "Upgrade to Pro" still triggers a Stripe checkout session. LS checkout route exists at `/api/lemonsqueezy/checkout` but is uncalled.

**Fix**: Change the fetch URL + payload key from `{ plan }` → `{ tier }` (LS route expects `tier`, not `plan`):
```typescript
// Before:
const res = await fetch('/api/stripe/subscribe', {
  body: JSON.stringify({ plan: 'pro' }),
  ...
})

// After:
const res = await fetch('/api/lemonsqueezy/checkout', {
  body: JSON.stringify({ tier: 'pro' }),
  ...
})
```

The response is `{ url }` in both cases — no other changes needed.

**Effort**: 20-30 min for 2 files + verify both `/upgrade` and `/billing` checkout flows in browser.

**Optional**: gate behind `process.env.PAYMENT_PROVIDER` (currently unset) to ease rollback:
```typescript
const endpoint = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER === 'stripe'
  ? '/api/stripe/subscribe'
  : '/api/lemonsqueezy/checkout'
```
…but this requires `NEXT_PUBLIC_PAYMENT_PROVIDER` to be exposed client-side. Simpler to just hard-swap and rely on Vercel deploy rollback if needed.

## Gap 3 [P1] — Branch carries 3 unrelated regressions

**Branch `feature/lemonsqueezy-integration` diff vs main** includes:

### 3a. Deletes `src/app/(app)/settings/billing/page.tsx`

On main this is:
```typescript
import { redirect } from 'next/navigation'
export default function SettingsBillingRedirect() {
  redirect('/upgrade')
}
```

Branch deletes it. If merged, `/settings/billing` returns 404 instead of redirecting.

**Fix**: During rebase, restore the file from main.

### 3b. Reverts `src/app/api/tool-subscriptions/optimize/route.ts`

Branch reverts this route from new `/lib/ai` abstraction back to direct `@anthropic-ai/sdk` import, AND removes `export const dynamic = 'force-dynamic'`.

Per memory `feedback_force_dynamic_invariant.md`: routes importing `/lib/ai` MUST export `force-dynamic` to prevent Next.js static-render inference from freezing build-time `process.env` values. Removing it re-triggers the PR #28 incident.

**Fix**: During rebase, keep main's version.

### 3c. 849-file diff vs main

The branch is far behind. Most of the 20433 deleted lines are visual-regression snapshot files that were removed on main during prior cleanup. A clean rebase requires careful conflict resolution to discard these branch-side deletions.

**Rebase strategy**:
```bash
git checkout feature/lemonsqueezy-integration
git fetch origin
git rebase origin/main
# For each conflict in deleted-on-branch files: `git checkout origin/main -- <path>`
# Specifically restore: src/app/(app)/settings/billing/page.tsx
#                       src/app/api/tool-subscriptions/optimize/route.ts
# Discard branch's snapshot deletions: git checkout origin/main -- e2e/visual-tests/*
git push --force-with-lease origin feature/lemonsqueezy-integration
```

**Alternative**: cherry-pick only the LS-relevant commits onto a fresh branch:
```bash
git checkout -b feature/lemonsqueezy-clean origin/main
git cherry-pick ab7f6cff   # skeleton
git cherry-pick dc277842   # named handlers + migration
# Resolve any conflicts → keep main's billing redirect + tool-subscriptions
```
Cherry-pick is cleaner if commits are atomic. Inspect both commits first.

**Effort**: 15-45 min depending on conflict density. Cherry-pick is faster if commits are clean.

## Gap 4 [P1] — No customer portal in UI

**Issue**: After purchase, users have no in-app way to manage their subscription (cancel, change payment method, view invoices). LemonSqueezy hosts a portal — we need to surface its URL.

**Solution**: Add a "Manage subscription" button in `/billing` or `/settings/billing`:
1. Server-side, call LS API:
   ```typescript
   import { getCustomer } from '@lemonsqueezy/lemonsqueezy.js'
   const { data } = await getCustomer(profile.lemonsqueezy_customer_id)
   const portalUrl = data?.data?.attributes?.urls?.customer_portal
   ```
2. Render `<a href={portalUrl}>Manage subscription</a>`

Requires adding `profiles.lemonsqueezy_customer_id` column (similar to existing `profiles.stripe_customer_id`):
```sql
alter table profiles add column if not exists lemonsqueezy_customer_id text;
```

Webhook handler `handleSubscriptionCreated` already has `customer_id` in `attrs` — also write it to profiles:
```typescript
await supabase.from('profiles').update({
  lemonsqueezy_customer_id: String(attrs.customer_id),
  plan, plan_expires_at: attrs.renews_at,
}).eq('id', userId)
```

**Effort**: 30 min (migration + handler patch + UI button).

## Gap 5 [P2] — Stub handlers for `subscription_payment_*` events

**File**: `src/app/api/lemonsqueezy/webhook/route.ts`

```typescript
async function handleSubscriptionPaymentSuccess(payload) {
  console.log(...)
  // TODO post-KYC: extend period_end + send receipt email
}
```

`handleSubscriptionPaymentFailed` does update `subscriptions.status = 'past_due'` but doesn't notify user or trigger dunning.

**Why P2 not P0**: LS-managed dunning emails go out automatically (LS sends payment receipt + retry notifications). Our handler not doing it is a redundancy gap, not a correctness gap.

**Fix** (optional for launch):
- `payment_success`: send custom receipt email via Resend matching the Stripe `paymentReceiptTemplate`
- `payment_failed`: send custom warning + downgrade UI hint after N retries

**Effort**: 1-2 hours including email template.

## Gap 6 [P3] — No analytics tracking on LS checkout

**Issue**: `posthog.capture('subscription_started')` etc. that exists for Stripe path is not yet present in LS checkout/webhook flow.

**Fix**: Mirror Stripe analytics calls in webhook + checkout. See `src/app/api/stripe/webhook/route.ts` for shape.

**Effort**: 30 min.

## Summary by severity

| Severity | Gaps | Total effort |
|----------|------|--------------|
| **P0** (blocks launch) | 1, 2 | ~1 hour |
| **P1** (must fix during merge) | 3, 4 | ~1 hour |
| **P2** (deferrable, UX gap) | 5 | 1-2 hours |
| **P3** (post-launch polish) | 6 | 30 min |

**Realistic approval-day budget**: 3-4 hours of focused work to clear P0 + P1. P2 + P3 can ship in a follow-up patch within the first week.
