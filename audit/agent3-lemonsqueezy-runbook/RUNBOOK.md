# [AGENT 3] LemonSqueezy activation runbook

**Owner**: Ramiz
**Prepared**: 2026-05-19 by AGENT 3 (qa-infra)
**Status**: KYC approval pending. SDK skeleton committed on `feature/lemonsqueezy-integration` branch (not merged).
**Approval window**: 1-5 business days. Email expected from Issac at LemonSqueezy.

## TL;DR

When the approval email lands:

1. Set 5 env vars in Vercel (Production + Preview) — values from LS dashboard.
2. Rebase `feature/lemonsqueezy-integration` onto current `main` and resolve 3 unrelated regressions (billing redirect, force-dynamic invariant, tool-subscriptions revert).
3. Apply DB migration `scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql` via psql.
4. Patch LS webhook handlers to also update `profiles.plan` (so UI gating reflects upgrade).
5. Switch `UpgradeButton.tsx` + `BillingPageClient.tsx` from `/api/stripe/subscribe` to `/api/lemonsqueezy/checkout`.
6. Deploy → test purchase in LS test mode → flip to live.

**Estimated hands-on time post-approval: 3-5 hours** (mostly rebase + UI wire-up; the rest is config).

## Architectural context

### What stays on Stripe (DON'T touch)

- `POST /api/stripe/checkout` — per-invoice payment from client portal (`/portal/[token]/PayButton.tsx`, `/portal/invoices/[token]/invoice/[invoice_id]/PortalPayButton.tsx`)
- `POST /api/stripe/webhook` event `checkout.session.completed` for invoice payments
- The `invoices` table `stripe_payment_id` column

LemonSqueezy is a **subscription replacement only**. Client-facing invoice checkout stays on Stripe. Migrating those is a separate, larger scope.

### What LemonSqueezy replaces

- `POST /api/stripe/subscribe` (called by `UpgradeButton.tsx` + `BillingPageClient.tsx` to upgrade user's own plan)
- `POST /api/stripe/billing-portal` for self-service subscription management
- Subscription side of `POST /api/stripe/webhook` (events `customer.subscription.*`)

### Subscription state source of truth

| Table/column | Current (Stripe) | After LS wire-up |
|--------------|------------------|------------------|
| `profiles.plan` ('free' \| 'pro' \| 'team') | Written by Stripe webhook | Must ALSO be written by LS webhook (dual update) |
| `profiles.plan_expires_at` | Written by Stripe webhook | Must ALSO be written by LS webhook |
| `profiles.stripe_customer_id` | Used for Stripe portal | Keep for legacy Stripe subscribers |
| `subscriptions` (new) | n/a | LS webhook writes — audit history |
| `subscription_events` (new) | n/a | Raw webhook payloads — audit log |

**Critical**: UI gating (paywall, feature toggles) reads `profiles.plan`. If LS webhook only writes to `subscriptions` and not `profiles.plan`, users will pay but stay on "free" tier in the UI. **This is the #1 launch-day gotcha**.

## Phase A — Pre-approval prep (do BEFORE email arrives)

### A.1 Create LS account (if not yet)

→ See [`pre-approval-checklist.md`](pre-approval-checklist.md).

LS dashboard account is created during KYC submission — already done per memory.

### A.2 Inventory existing skeleton

**Branch `feature/lemonsqueezy-integration`** (NOT merged to main):

| File | Status | Notes |
|------|--------|-------|
| `src/lib/lemonsqueezy/client.ts` | ✅ Complete | SDK init + 4 env var exports |
| `src/app/api/lemonsqueezy/checkout/route.ts` | ✅ Complete | Pro/Team tier checkout; passes `custom: { user_id }` |
| `src/app/api/lemonsqueezy/webhook/route.ts` | ⚠️ Partial | 5 handlers wired (subscription_*); 4 stubs (order_*, payment_success) |
| `scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql` | ✅ Complete | `subscriptions` + `subscription_events` tables w/ RLS |
| `package.json` | ✅ Pinned | `@lemonsqueezy/lemonsqueezy.js@^4.0.0` |

**3 unrelated regressions on branch — MUST resolve during rebase**:

1. **`src/app/(app)/settings/billing/page.tsx` deleted**. On main, this is a 5-line redirect to `/upgrade` — branch removes it entirely. If merged as-is, `/settings/billing` returns 404. **Fix during rebase: keep main's version.**
2. **`src/app/api/tool-subscriptions/optimize/route.ts` reverted** from new `/lib/ai` abstraction back to direct Anthropic SDK + **removed `export const dynamic = 'force-dynamic'`**. Per memory `feedback_force_dynamic_invariant.md`, this would re-trigger the PR #28 incident (Next.js static-render inference freezes build-time env values). **Fix during rebase: keep main's version.**
3. **Branch is 849 files behind main** (10949 insertions, 20433 deletions in the diff vs main). Most are visual-regression snapshot files. A clean rebase needs to discard most of these in favor of main.

### A.3 Free tier handling

Memory mentions `LEMONSQUEEZY_VARIANT_ID_FREE`, but the actual code (`src/lib/lemonsqueezy/client.ts`) defines only `LEMON_VARIANT_PRO` + `LEMON_VARIANT_TEAM`. **There is no LS product for the Free tier** — Free = no `subscriptions` row + `profiles.plan = 'free'`. Don't create a Free variant in LS.

### A.4 Branch protection ahead of merge

Before merging `feature/lemonsqueezy-integration`, ensure branch protection rules are NOT yet enforcing required reviews/checks (will block the merge otherwise). If GitHub Pro upgraded, configure:
- Required PR review: 0 (solo dev)
- Required status checks: build + typecheck (when CI added)
- Allow force-push by admin only

## Phase B — Approval day execution

→ Detailed step-by-step in [`approval-day-checklist.md`](approval-day-checklist.md).

Order matters. Approximate timings assume no surprises.

| Step | Time | Action |
|------|------|--------|
| B.1 | 0:00 | LS dashboard: create Pro + Team products. Note variant IDs. |
| B.2 | +10 min | LS dashboard: enable webhook → `https://www.lancerwise.com/api/lemonsqueezy/webhook` → copy signing secret. |
| B.3 | +5 min | Vercel: add 5 env vars (Production + Preview) per [`vercel-env-vars-template.txt`](vercel-env-vars-template.txt). |
| B.4 | +30 min | Rebase `feature/lemonsqueezy-integration` onto `main`, resolve the 3 regressions above. |
| B.5 | +15 min | Apply DB migration via `psql $DATABASE_URL -f scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql`. |
| B.6 | +45 min | Patch webhook handlers (see Code Gaps §1 below) to dual-write `profiles.plan` + `profiles.plan_expires_at`. |
| B.7 | +30 min | Patch `UpgradeButton.tsx` + `BillingPageClient.tsx` to call `/api/lemonsqueezy/checkout` instead of `/api/stripe/subscribe`. |
| B.8 | +10 min | Merge PR + Vercel auto-deploys. |
| B.9 | +20 min | Test purchase in LS test mode (use LS test card `4242 4242 4242 4242`). Verify: checkout opens → payment success → webhook fires → `subscriptions` + `profiles.plan` both updated → UI shows upgraded tier. |
| B.10 | +10 min | LS dashboard: switch store from test → live mode. Update Vercel env vars to live API key + live variant IDs. Re-deploy. |
| B.11 | +15 min | Real-money smoke test: actual purchase on personal card for $15, verify everything, then issue refund from LS dashboard. |
| B.12 | EOD | Tag release, update changelog, notify customers (if any).

**Total: ~3-5 hours hands-on, plus 1-2 days of LS test-mode soak before going live (recommended but optional).**

## Phase C — Env vars

→ See [`vercel-env-vars-template.txt`](vercel-env-vars-template.txt) for the paste-ready file with comments.

5 vars required, all server-side (no `NEXT_PUBLIC_` prefix needed):

| Var | Where it comes from | Per-environment value? |
|-----|---------------------|------------------------|
| `LEMONSQUEEZY_API_KEY` | LS Dashboard → Settings → API → New API key | Test API key on Preview; Live API key on Production |
| `LEMONSQUEEZY_STORE_ID` | LS Dashboard → Stores → "View" → ID in URL (`/stores/XXXXX`) | Same on both (single store) |
| `LEMONSQUEEZY_VARIANT_PRO` | LS Dashboard → Products → Pro plan → Variant ID | Same on both (LS variants persist across modes) |
| `LEMONSQUEEZY_VARIANT_TEAM` | LS Dashboard → Products → Team plan → Variant ID | Same on both |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | LS Dashboard → Webhooks → (your endpoint) → Signing secret | Same on both (single webhook → both deployments share secret) |

Pattern for Vercel CLI (per memory `feedback_vercel_env_patch_pattern.md`):
```bash
# Use REST API to ADD with `target: ["production", "preview"]`
curl -X POST "https://api.vercel.com/v10/projects/{projectId}/env" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  -d '{"key":"LEMONSQUEEZY_API_KEY","value":"...","target":["production","preview"],"type":"encrypted"}'
```

Per memory `feedback_vercel_cli_ai_agent_env.md`: the Vercel CLI may misbehave when `AI_AGENT` env var is set. If running from Claude Code, fall back to REST API.

## Phase D — Webhook configuration

LS Dashboard → Webhooks → New webhook:

- **Endpoint URL**: `https://www.lancerwise.com/api/lemonsqueezy/webhook`
- **Signing secret**: auto-generated by LS — copy into `LEMONSQUEEZY_WEBHOOK_SECRET` env var
- **Events** (subscribe to all 9):
  - `order_created`
  - `order_refunded`
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_payment_success`
  - `subscription_payment_failed`

### Signature verification

Already implemented in `src/app/api/lemonsqueezy/webhook/route.ts`:
- HMAC SHA-256 with timing-safe comparison
- Reads `x-signature` header
- Compares against `crypto.createHmac('sha256', LEMON_WEBHOOK_SECRET).update(rawBody).digest('hex')`

**Important**: the route does `request.text()` BEFORE parsing JSON to preserve raw bytes for signature. Don't refactor to `request.json()` first — signature verification will break.

## Phase E — Code gaps

→ See [`code-gaps.md`](code-gaps.md) for detailed gap-by-gap breakdown with effort estimates.

Summary of 5 gaps that block launch:

| # | Gap | Severity | Effort |
|---|-----|----------|--------|
| 1 | LS webhook does NOT update `profiles.plan` / `profiles.plan_expires_at` — UI gating won't reflect upgrade | **P0 blocker** | 30-45 min |
| 2 | `UpgradeButton.tsx` + `BillingPageClient.tsx` still POST to `/api/stripe/subscribe` | **P0 blocker** | 20-30 min |
| 3 | Branch deletes `/settings/billing` redirect + reverts force-dynamic invariant + reverts tool-subscriptions to direct Anthropic | **P1 must fix during rebase** | 15 min |
| 4 | No customer portal surfaced in UI for self-service subscription management | **P1** | 30 min (LS portal URLs are returned by `getCustomer()` API) |
| 5 | `subscription_payment_success` handler is a stub — no period extension or receipt email | **P2** | 1-2 hrs (mirror Stripe `customer.subscription.updated` shape) |

## Phase F — Rollback plan

→ See [`rollback-plan.md`](rollback-plan.md).

Three rollback tiers depending on how bad it goes:

### F.1 Soft rollback — UI revert only (5 min)
If LS checkout flow has UI bugs but webhooks work:
- Revert the `UpgradeButton.tsx` + `BillingPageClient.tsx` commit on Vercel via "Promote previous deployment"
- LS webhooks keep firing → existing LS subscribers stay on plan
- New upgrades go through Stripe again

### F.2 Hard rollback — disable LS entirely (15 min)
If LS webhook is corrupting data:
- Remove `LEMONSQUEEZY_API_KEY` from Vercel → checkout route returns 503
- Pause webhook in LS dashboard
- Revert merge commit on main → redeploy
- Existing LS subscribers can't be charged again, but `subscriptions` table is read-only audit data

### F.3 Manual customer migration (1-2 hrs per affected user)
If users paid via LS but data is wrong:
- LS dashboard → export subscription list → CSV
- For each row: manually set `profiles.plan = 'pro'/'team'` + `plan_expires_at = LS.renews_at`
- Email affected users with status

## Phase G — Testing checklist

→ See [`testing-checklist.md`](testing-checklist.md) for full per-flow checklist.

Quick smoke (must pass before B.10 live switch):

- [ ] LS Test mode: checkout opens for Pro tier
- [ ] LS Test mode: card `4242 4242 4242 4242` succeeds
- [ ] Webhook fires within 30s
- [ ] `subscriptions` table has new row
- [ ] `subscription_events` table has `subscription_created` payload
- [ ] `profiles.plan` = 'pro' (THIS IS THE CRITICAL CHECK — fails today, needs Code Gap #1 fix)
- [ ] `profiles.plan_expires_at` is set
- [ ] UI: navigate to `/upgrade` or `/billing` shows "You're on Pro"
- [ ] Cancellation flow: LS portal cancel → webhook → `subscriptions.status = 'cancelled'`
- [ ] Re-test on Team tier
- [ ] Real-money smoke (B.11) before public launch

## Cross-references

- Memory: `project_lancerwise_lemonsqueezy_env_vars.md` (created 2026-05-14, point-in-time)
- Memory: `feedback_force_dynamic_invariant.md` (PR #28 incident — applies to gap #3)
- Memory: `feedback_vercel_env_patch_pattern.md` (Vercel REST API for env vars)
- Memory: `feedback_vercel_cli_ai_agent_env.md` (CLI gotcha)
- Memory: `feedback_adhoc_ddl_pattern.md` (DB migration approach)
- Memory: `project_lancerwise_migration_tracking_gap.md` (psql workaround for migration tracking)
- Branch: `feature/lemonsqueezy-integration` commits `ab7f6cff` + `dc277842`
- Issue tracking: TBD when merged
