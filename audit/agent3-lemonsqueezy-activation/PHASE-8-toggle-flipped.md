# Phase 8 — Toggle flip: NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy

## Step 1 — Add env var to Vercel production (only) ✅

```bash
POST /v10/projects/prj_OfYhgE1ONf98IhDzAMzspTr7hC1A/env
{
  "key": "NEXT_PUBLIC_PAYMENT_PROVIDER",
  "value": "lemonsqueezy",
  "target": ["production"],
  "type": "plain"
}
→ 201 created
```

**Scope decision**: production only, NOT preview. Preview deploys default to `'stripe'` (env var absent there) so PR preview builds don't accidentally bind to live LS credentials. If a future preview needs LS testing, add `preview` target then.

**Type**: `plain` (not `encrypted`) because `NEXT_PUBLIC_*` env vars bake into client bundles anyway — encryption is misleading at that scope.

## Step 2 — Verify env var set ✅

```
LEMONSQUEEZY_API_KEY: target=['production', 'preview']
LEMONSQUEEZY_STORE_ID: target=['production', 'preview']
LEMONSQUEEZY_VARIANT_PRO: target=['production', 'preview']
LEMONSQUEEZY_WEBHOOK_SECRET: target=['production', 'preview']
NEXT_PUBLIC_PAYMENT_PROVIDER: target=['production']  ← NEW
```

All 5 LS-related vars present.

## Step 3 — Trigger redeploy ✅

Vercel needs a new build to pick up `NEXT_PUBLIC_*` value into the client bundle. Triggered via empty commit on main:

```bash
git commit --allow-empty -m "chore(deploy): trigger redeploy for NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy"
git push origin main
→ 9adb8dd0..0ac52eca  main -> main
```

Vercel auto-deployed `dpl_A6ca68kt7En1oDmNxd4LSrPG2jhH` (production target).

## Step 4 — Wait for READY ✅

Monitor `b5gr281f7`: QUEUED → BUILDING → **READY** (took ~3 min).

## Step 5 — Verify toggle is live ✅

### LS webhook still responds 401 (signature check active)

```bash
curl -sI -X POST https://www.lancerwise.com/api/lemonsqueezy/webhook
→ HTTP/2 401
```

Confirms webhook handler unchanged (signing-secret env var still loaded post-redeploy).

### Client bundle contains "lemonsqueezy" literal

```bash
# /upgrade chunk inspection
curl -s https://www.lancerwise.com/_next/static/chunks/0m1ggghb5lxco.js | grep -oE '"(stripe|lemonsqueezy)"' | sort -u
→ "lemonsqueezy"
```

The `NEXT_PUBLIC_PAYMENT_PROVIDER` value is baked into the client JS — UI logic in `UpgradeButton.tsx` + `BillingPageClient.tsx` + `PlansGrid.tsx` will now route to `/api/lemonsqueezy/checkout`.

## What's now live

| Flow | Before flip | After flip |
|------|-------------|------------|
| Click "Upgrade to Pro" on /upgrade | POST `/api/stripe/subscribe` → 503 | POST `/api/lemonsqueezy/checkout` → redirect to LS hosted checkout |
| Click "Upgrade to Pro" on /billing | Same as above | Same as above |
| Click "Upgrade to Business" on /upgrade | Visible row in 3-col grid | **Hidden** (2-col grid, Business excluded per Issac scope) |
| Click "Upgrade to Team" on /billing | Visible row | **Hidden** |
| Webhook `/api/lemonsqueezy/webhook` | 200 → /_not-found (pre-PR-75) | 401 invalid signature (active) |
| Subscription state on profile | `profiles.plan = 'free'` for everyone | Will flip to 'pro' once first webhook fires |

## Rollback path (Tier 1, ~30 sec)

If anything misbehaves with LS-live behavior:

```bash
# Get env var ID
ENV_ID=$(curl -s -H "Authorization: Bearer $VTOKEN" \
  "https://api.vercel.com/v9/projects/$PROJECT_ID/env?teamId=$TEAM" | \
  python3 -c "import sys,json; [print(e['id']) for e in json.load(sys.stdin)['envs'] if e['key']=='NEXT_PUBLIC_PAYMENT_PROVIDER']")

# Delete (or PATCH value to 'stripe')
curl -X DELETE "https://api.vercel.com/v9/projects/$PROJECT_ID/env/$ENV_ID?teamId=$TEAM" \
  -H "Authorization: Bearer $VTOKEN"

# Trigger redeploy
git commit --allow-empty -m "chore(deploy): rollback NEXT_PUBLIC_PAYMENT_PROVIDER" && git push
```

Effect: env unset → defaults to `'stripe'` → UI routes back to `/api/stripe/subscribe` (which 503s since `STRIPE_SECRET_KEY` isn't set in prod) → users see "Payments not yet configured" toast → no payments, no broken UI.

This is the soft revert. Hard revert = `git revert 9adb8dd0` and redeploy.
