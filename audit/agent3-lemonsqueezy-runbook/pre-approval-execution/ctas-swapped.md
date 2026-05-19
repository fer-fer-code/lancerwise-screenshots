# CTAs swapped — subscription upgrade flow now toggleable

Both subscription upgrade entry points now respect `NEXT_PUBLIC_PAYMENT_PROVIDER` env var. Defaults to `'stripe'` for backwards compatibility — flip to `'lemonsqueezy'` post-KYC to switch.

## File-by-file

### `src/app/(app)/upgrade/UpgradeButton.tsx`

**Source**: cherry-pick commit `526f30b0` already had the toggle scaffold; this PR fixes the analytics hardcode in commit `2948b9a8`.

```typescript
const provider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe') as 'stripe' | 'lemonsqueezy'

async function handleUpgrade() {
  // ...
  const endpoint = provider === 'lemonsqueezy'
    ? '/api/lemonsqueezy/checkout'
    : '/api/stripe/subscribe'
  const body = provider === 'lemonsqueezy'
    ? JSON.stringify({ tier: plan })
    : JSON.stringify({ plan })
  // ...
  track('checkout_started', { plan, provider })   // was: provider: 'stripe' (hardcoded)
}
```

### `src/app/(app)/billing/BillingPageClient.tsx`

**Source**: this PR (commit `2948b9a8`). Was direct `/api/stripe/subscribe` call.

```typescript
const provider = (process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? 'stripe') as 'stripe' | 'lemonsqueezy'

async function handleUpgrade(plan: string) {
  // ...
  const endpoint = provider === 'lemonsqueezy'
    ? '/api/lemonsqueezy/checkout'
    : '/api/stripe/subscribe'
  const body = provider === 'lemonsqueezy'
    ? JSON.stringify({ tier: plan })
    : JSON.stringify({ plan })
  // ...
}
```

Also relaxed the error-message branch from `'Stripe not configured — contact support'` (provider-specific) to `'Payments not yet configured — contact support'` (generic).

## Other CTAs NOT swapped (by design)

These continue to use Stripe directly because they handle **client-facing invoice payments**, not freelancer subscription upgrades:

| File | Endpoint | Why kept on Stripe |
|------|----------|---------------------|
| `src/app/portal/invoices/[token]/invoice/[invoice_id]/PortalPayButton.tsx` | `/api/stripe/checkout` | Client pays freelancer's invoice — different scope |
| `src/app/portal/[token]/PayButton.tsx` | `/api/stripe/checkout` | Same — client invoice payment portal |

LemonSqueezy is **subscription-only** in this integration. Migrating client invoice payments to LS would be a separate, larger scope (different product model, requires reconciliation with the `invoices.stripe_payment_id` column, etc.).

## Verification

Live preview deploys with `NEXT_PUBLIC_PAYMENT_PROVIDER` UNSET:
- Both `/upgrade` and `/billing` "Upgrade" buttons → POST to `/api/stripe/subscribe` ✓ (existing behavior)
- Stripe path returns 503 if env vars unset → "Payments not yet configured" toast ✓

Live preview deploys with `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` (NOT YET — pending KYC):
- Both `/upgrade` and `/billing` "Upgrade" buttons → POST to `/api/lemonsqueezy/checkout` with `{ tier }`
- LS path returns 503 until LS env vars set → same "Payments not yet configured" toast

## Rollback

To revert to Stripe-only:
1. Vercel → env vars → set `NEXT_PUBLIC_PAYMENT_PROVIDER=stripe` (or unset entirely)
2. Trigger redeploy
3. Effect: both `/upgrade` + `/billing` route to Stripe immediately on next request

No code revert needed for kill-switch.
