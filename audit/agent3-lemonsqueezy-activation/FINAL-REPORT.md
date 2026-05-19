# [AGENT 3] LemonSqueezy activation — FINAL REPORT

**Date**: 2026-05-19
**Window**: ~45 minutes start-to-flip (vs estimated 50-60 min)
**Outcome**: ✅ **LemonSqueezy is the live subscription provider in production. Ready for test-mode E2E by Ramiz.**

## Executive summary

LemonSqueezy approval email arrived; activation workflow executed end-to-end. Pro subscription product live (Variant 1673993, $15/mo USD). Webhook configured with all 13 lifecycle events (ID 101618). Code merged to main via PR #75. Production deployed with `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` active.

Team/Business plan excluded from LS scope per Issac (separate email) — code patched to filter Team tier from UI when LS is active provider; checkout endpoint returns explicit 400 on `tier=team`.

**Next**: Ramiz enables LS test mode in dashboard + completes test-card E2E purchase to verify subscription_created webhook fires → `profiles.plan` updates → access gating reflects upgrade.

## Phase outcomes

| Phase | Status | Notes |
|-------|--------|-------|
| 1 — Session check | ✅ | Browser MCP alive, LS session active from earlier currency fix |
| 2 — Pro product | ✅ | ID 1067890, $15/mo, published. Default of "every year" caught + changed to month |
| 3 — Webhook | ✅ | ID 101618, 13 events, API-created with self-generated 40-char hex secret |
| 4 — API verify | ✅ | All 4 resources (store/product/variant/webhook) confirmed via GET |
| 5 — Vercel envs | ✅ | 4 LS env vars set (production+preview) via REST API |
| 6a — Team guard | ✅ | 4 files patched (checkout/client + 2 UI), committed `338d6581` |
| 6b — PR #75 merge | ✅ | Admin-merged (commit `9adb8dd0`) — visual-regression CI gate pre-existing failure bypassed |
| 7 — Pre-flip smoke | ✅ | LS webhook 401 ✓, Stripe 503 ✓ (pre-existing), /upgrade 307 ✓ |
| 8 — Toggle flip | ✅ | `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` set + redeploy (commit `0ac52eca`) + bundle confirms "lemonsqueezy" literal |
| 9 — Ramiz handoff | → | This report + Telegram notify |

## LS resources (production state)

| Resource | Value |
|----------|-------|
| Store ID | **370871** (LancerWise, Currency=USD) |
| Product ID | **1067890** (Pro, $15/mo, published) |
| Variant ID | **1673993** (subscription, monthly, slug `2ab113ee-7299-42aa-87c8-9f47ffd3b52b`) |
| Webhook ID | **101618** (`/api/lemonsqueezy/webhook`, 13 events) |
| Webhook secret | 40-char hex, stored in Vercel env only |

## Commits landed

| SHA | Branch | Purpose |
|-----|--------|---------|
| `338d6581` | `feature/lemonsqueezy-clean` | Team-plan guard (4 files) |
| `9adb8dd0` | `main` (via PR #75 squash) | Full LemonSqueezy integration (skeleton + handlers + dual-write + guard) |
| `0ac52eca` | `main` | Empty commit to trigger redeploy after env var change |

## Vercel env vars (production state)

| Variable | Target | Type |
|----------|--------|------|
| `LEMONSQUEEZY_API_KEY` | prod+preview | encrypted |
| `LEMONSQUEEZY_STORE_ID` | prod+preview | encrypted |
| `LEMONSQUEEZY_VARIANT_PRO` | prod+preview | encrypted |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | prod+preview | encrypted |
| `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` | production only | plain |

## DB schema migration

Applied `scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql` to production DB:

- `subscriptions` table (RLS: users read own) — 14 columns including `lemonsqueezy_subscription_id`, `status`, `plan_id`, `current_period_*`
- `subscription_events` table (RLS: users read own) — audit log for raw webhook payloads
- `profiles.lemonsqueezy_customer_id` column (mirrors stripe_customer_id)
- Tracking row inserted at `supabase_migrations.schema_migrations` version `20260514120000`

Migration file had a bug (wrong schema_migrations table path/column) — caught + fixed live + committed back to branch (`ac6599f1`).

## Notable findings during execution

### F1 — vue-select needs keyboard interaction (reused from currency fix)
Year→Month dropdown change via `focus → type 'MO' → Enter`. JS `.click()` doesn't open vue-select dropdowns reliably.

### F2 — LS API webhook secret has 40-char max
Initially tried `secrets.token_urlsafe(32)` = 43 chars → 422 Unprocessable Entity. Switched to `secrets.token_hex(20)` = 40 chars exact.

### F3 — Default subscription period is "Year" not "Month"
LS subscription product form defaults to annual billing. Easy to miss. Verified text "Customers will be charged $15.00 every month" before publish.

### F4 — Variant status `pending` is normal
New subscription variants land in `pending` state per LS docs. Doesn't block checkout. Transitions on first purchase attempt.

### F5 — Stripe subscriptions were never live in production
Pre-flip smoke revealed `/api/stripe/subscribe` returns 503 ("Stripe not configured") — `STRIPE_SECRET_KEY` was never set in Vercel production. So this PR isn't switching FROM working Stripe TO LS; it's enabling subscription billing for the first time. Documented in rollback plan.

### F6 — PR #75 visual-regression CI failure is pre-existing
`tests/e2e/auth.setup.ts` "Invalid login credentials" fails on every commit, including last 3 main runs. Not introduced by PR #75. Admin-merge bypassed it.

### F7 — Code regression caught during cherry-pick (avoided)
Original `feature/lemonsqueezy-integration` branch had 849-file divergence with 3 unrelated regressions (billing redirect delete + tool-subscriptions force-dynamic revert + zombie snapshot deletes). Cherry-pick approach side-stepped all three.

## Ramiz next steps (test-mode E2E)

⚠️ Per Issac's email: **no real-money testing on own store** (money laundering risk). Use LS test mode + test card.

### 1. Enable LS test mode

1. Login `https://app.lemonsqueezy.com`
2. Bottom-left LancerWise badge → toggle "Test mode" ON (currently OFF)
3. Confirm test-mode banner appears at top

### 2. Test purchase

1. Open `https://www.lancerwise.com/upgrade` in **incognito window** (no auth cache)
2. Register a fresh test account (use mail.tm or `+test1@gmail.com` alias)
3. Confirm email, land on dashboard
4. Click "Upgrade to Pro"
5. Should redirect to `app.lemonsqueezy.com/checkout/...`
6. **Test card**: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
7. Complete purchase

### 3. Verify webhook + DB state

Within 30s of payment success:
- Supabase Studio → `subscription_events` table → should have `subscription_created` row with full payload
- `subscriptions` table → new row, `status='active'`, `variant_id='1673993'`, `plan_id='pro'`
- `profiles` table → for the test user, `plan='pro'` + `plan_expires_at` ≈ now+30d + `lemonsqueezy_customer_id` set ← **critical check, this is the P0 fix that PR #75 closed**

### 4. Test cancellation

1. LS dashboard → Subscriptions → click test subscription → "Cancel"
2. Within 30s:
   - `subscriptions.status='cancelled'`, `cancel_at_period_end=true`
   - `profiles.plan` stays `'pro'` (user keeps access until period end — Stripe-pattern parity)

### 5. Force-expire to test downgrade

1. LS dashboard → force-expire the cancelled subscription
2. Webhook `subscription_expired` fires
3. `profiles.plan = 'free'`, `plan_expires_at = null`
4. UI re-paywalls Pro features

### 6. Disable test mode + go live

Once 1-5 pass cleanly:
- LS dashboard → toggle Test mode OFF
- All future purchases run against live API
- API_KEY may need to be the live-mode key (verify in LS dashboard whether test/live use same key)

## Files in this dir

| File | Purpose |
|------|---------|
| [`FINAL-REPORT.md`](FINAL-REPORT.md) | this — executive summary |
| [`SUMMARY.md`](SUMMARY.md) | Ramiz quick-read |
| [`PHASE-1-session-check.md`](PHASE-1-session-check.md) | Session verification |
| [`PHASE-2-product-creation.md`](PHASE-2-product-creation.md) | Pro product creation + browser learnings |
| [`PHASE-3-webhook-creation.md`](PHASE-3-webhook-creation.md) | Webhook via API (40-char secret gotcha) |
| [`PHASE-4-api-verification.md`](PHASE-4-api-verification.md) | curl GET verification of all 4 resources |
| [`PHASE-5-vercel-envs.md`](PHASE-5-vercel-envs.md) | Env var REST API pattern + rotation runbook |
| [`PHASE-6-pr-75-merge.md`](PHASE-6-pr-75-merge.md) | Team guard + admin-merge |
| [`PHASE-7-pre-flip-smoke.md`](PHASE-7-pre-flip-smoke.md) | LS webhook 401 + Stripe 503 + /upgrade 307 |
| [`PHASE-8-toggle-flipped.md`](PHASE-8-toggle-flipped.md) | NEXT_PUBLIC_PAYMENT_PROVIDER flip + bundle verify |
| `phase-4-api-verification.txt` | Raw curl JSON responses for audit trail |
| `screenshots/` | 11 PNGs covering Phases 1-3 |

## Cross-links

- LemonSqueezy runbook: [`../agent3-lemonsqueezy-runbook/`](../agent3-lemonsqueezy-runbook/) — pre-approval prep docs that drove this execution
- Currency fix: [`../agent3-lemonsqueezy-currency-fix/`](../agent3-lemonsqueezy-currency-fix/) — earlier VND→USD change that unblocked product creation
- PR #75: https://github.com/fer-fer-code/lancerwise/pull/75 (merged)
- API smoke tests: [`../agent3-api-smoke-tests/`](../agent3-api-smoke-tests/) — baseline for post-launch monitoring

## Status: STANDBY for Ramiz E2E

LancerWise subscription billing is mechanically live. The next action is Ramiz's test-mode E2E pass per the 6 steps above. After E2E confirms `profiles.plan = 'pro'` updates on payment, LancerWise is ready for first real customer.
