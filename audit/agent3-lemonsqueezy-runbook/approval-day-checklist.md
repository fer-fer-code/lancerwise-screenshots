# Approval day checklist

Assumes [`pre-approval-checklist.md`](pre-approval-checklist.md) was completed during KYC wait. If not, ALSO go execute that first — it represents ~50% of the total work that can happen without LS credentials.

## Pre-flight (5 min)

- [ ] Approval email from Issac received? Subject usually contains "approved" or "store activated"
- [ ] Open LemonSqueezy dashboard: https://app.lemonsqueezy.com
- [ ] Confirm store status = active (not "pending review")
- [ ] Set aside ~3 hours uninterrupted. Don't approval-day during launch peak.

## Step 1 — LS dashboard: create products (15 min)

- [ ] Dashboard → Products → New Product
  - Name: **Pro**
  - Type: Subscription
  - Pricing: $15.00 / month USD
  - Free trial: optional, 7 days recommended
  - Save → click into Variants → copy variant ID
- [ ] Dashboard → Products → New Product
  - Name: **Team**
  - Type: Subscription
  - Pricing: $39.00 / month USD
  - Free trial: same as Pro
  - Save → copy variant ID

## Step 2 — LS dashboard: configure webhook (5 min)

- [ ] Dashboard → Settings → Webhooks → "+ Create webhook"
- [ ] **Callback URL**: `https://www.lancerwise.com/api/lemonsqueezy/webhook`
- [ ] **Signing secret**: leave LS auto-generate. Click "Show" and copy.
- [ ] **Events to subscribe** — check ALL 9:
  - [x] order_created
  - [x] order_refunded
  - [x] subscription_created
  - [x] subscription_updated
  - [x] subscription_cancelled
  - [x] subscription_resumed
  - [x] subscription_expired
  - [x] subscription_payment_success
  - [x] subscription_payment_failed
- [ ] Save webhook

## Step 3 — LS dashboard: create API key (3 min)

- [ ] Dashboard → Settings → API → "Create API key"
- [ ] Name: `lancerwise-production`
- [ ] Permissions: "All permissions"
- [ ] Copy key (shown only once — save to password manager + step 4)

## Step 4 — Vercel: set 5 env vars (10 min)

Use the paste-ready template: [`vercel-env-vars-template.txt`](vercel-env-vars-template.txt)

Set all 5 with Target: Production + Preview:

- [ ] `LEMONSQUEEZY_API_KEY` (from Step 3)
- [ ] `LEMONSQUEEZY_STORE_ID` (LS dashboard URL: `/stores/XXXXX`)
- [ ] `LEMONSQUEEZY_VARIANT_PRO` (from Step 1)
- [ ] `LEMONSQUEEZY_VARIANT_TEAM` (from Step 1)
- [ ] `LEMONSQUEEZY_WEBHOOK_SECRET` (from Step 2)
- [ ] Verify: `vercel env ls production | grep -i LEMON` shows 5 lines

Per memory `feedback_vercel_cli_ai_agent_env.md`: if running these CLI commands from Claude Code, fall back to REST API (template file has the curl snippet).

## Step 5 — Apply DB migration (5 min)

- [ ] Make backup first per memory `project_lancerwise_migration_tracking_gap.md`:
  ```bash
  cd /Users/myoffice/lancerwise-agent3
  pg_dump $DATABASE_URL --schema-only > ~/lancerwise-backups/pre-lemonsqueezy-$(date +%Y%m%d-%H%M%S).sql
  ```
- [ ] Apply migration:
  ```bash
  psql $DATABASE_URL -f scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql
  ```
- [ ] Verify tables exist:
  ```bash
  psql $DATABASE_URL -c "\dt subscriptions; \dt subscription_events;"
  ```
- [ ] Confirm RLS policies are in place:
  ```bash
  psql $DATABASE_URL -c "select tablename, policyname from pg_policies where tablename in ('subscriptions', 'subscription_events');"
  ```

## Step 6 — Merge draft PR (5 min)

If pre-approval prep was done, the draft PR already exists with all P0/P1 code fixes applied:

- [ ] Convert draft PR to ready
- [ ] Self-review one more time — focus on:
  - LS webhook updates `profiles.plan` (Gap 1)
  - `UpgradeButton.tsx` calls `/api/lemonsqueezy/checkout` (Gap 2)
  - `/settings/billing/page.tsx` redirect still exists (Gap 3a)
  - `tool-subscriptions/optimize/route.ts` has `force-dynamic` (Gap 3b)
- [ ] Merge → Vercel auto-deploys
- [ ] Wait for "Ready" status (~2 min)

If pre-approval prep was NOT done, you've got a 2-hour patching window ahead of you — see [`code-gaps.md`](code-gaps.md).

## Step 7 — Test mode smoke test (15 min)

- [ ] Confirm LS store is in **test mode** (dashboard top banner)
- [ ] Open `https://www.lancerwise.com/upgrade` in a fresh incognito window
- [ ] Sign in as a non-Pro test account
- [ ] Click "Upgrade to Pro" → should redirect to LS checkout (URL contains `app.lemonsqueezy.com/checkout/...`)
- [ ] Pay with test card: **`4242 4242 4242 4242`**, any future expiry, any CVC
- [ ] Confirm redirect back to `/dashboard?upgraded=1`
- [ ] In Supabase Studio, verify:
  - [ ] `subscriptions` table has new row with `status='active'`
  - [ ] `subscription_events` has `subscription_created` payload
  - [ ] `profiles.plan = 'pro'` for the test user ← **critical, this was Gap 1**
  - [ ] `profiles.plan_expires_at` is ~30 days out
  - [ ] `profiles.lemonsqueezy_customer_id` is set
- [ ] UI sanity: navigate to `/upgrade` while signed in as the test user → button says "You're on Pro" (not "Upgrade")

## Step 8 — Test cancellation flow (5 min)

- [ ] In LS dashboard → Subscriptions → click the test subscription → "Cancel"
- [ ] Within 30s, verify webhook fired:
  - [ ] `subscription_events` has `subscription_cancelled` row
  - [ ] `subscriptions.status = 'cancelled'`
  - [ ] `subscriptions.cancel_at_period_end = true`
  - [ ] `profiles.plan` still = 'pro' (user keeps access until period end)
- [ ] Optional: in LS dashboard force-expire the subscription → verify `profiles.plan` flips to 'free'

## Step 9 — Switch LS store to Live mode (5 min)

- [ ] LS dashboard top right → toggle "Test mode" OFF (store goes live)
- [ ] Re-create live API key:
  - Settings → API → Create new key (live mode keys are separate from test keys)
  - Copy new key
- [ ] Update Vercel env var `LEMONSQUEEZY_API_KEY` with live key (Production environment only — keep test key on Preview)
- [ ] Variant IDs persist across modes — don't change `LEMONSQUEEZY_VARIANT_PRO` / `LEMONSQUEEZY_VARIANT_TEAM`
- [ ] Webhook signing secret persists across modes — don't change
- [ ] Vercel: trigger Production redeploy (UI button or `git commit --allow-empty -m "deploy: switch LS to live mode" && git push`)
- [ ] Wait for "Ready"

## Step 10 — Real-money smoke test (15 min)

- [ ] Use your personal card for a Pro tier ($15) purchase via `https://www.lancerwise.com/upgrade`
- [ ] Verify all of Step 7 checks pass with a REAL `subscriptions` row
- [ ] LS dashboard → Subscriptions → confirm new live subscription with your email
- [ ] **Immediately** refund: LS dashboard → click subscription → "Refund last payment"
- [ ] Verify webhook `subscription_payment_failed` or `order_refunded` fires
- [ ] Verify `profiles.plan` does NOT auto-downgrade on refund alone (only on cancellation + expiration) — confirm this is the intent
- [ ] LS dashboard → cancel + immediately end the subscription (don't wait 30 days)
- [ ] Verify `profiles.plan = 'free'` after expiration webhook

## Step 11 — Production health check (10 min)

- [ ] Vercel logs: tail `/api/lemonsqueezy/webhook` calls for the last hour — should be 200 responses
- [ ] Sentry / Vercel Logs: zero `[lemon] handler error` lines
- [ ] DB: `select count(*) from subscription_events where created_at > now() - interval '1 hour'` — should match expected count
- [ ] Spot-check: pick one event row, inspect raw JSON payload to confirm webhook actually delivered

## Step 12 — Cutover communication (10 min)

- [ ] Tag git release: `git tag -a v1.0-lemonsqueezy -m "Subscription billing now live on LemonSqueezy"`
- [ ] Push tag: `git push --tags`
- [ ] Update `src/data/changelog.ts` with the entry drafted in pre-approval step 4
- [ ] If LancerWise has any existing Stripe subscribers (currently zero — pre-launch), email them with migration path (not applicable for first launch)
- [ ] Twitter / Indie Hackers post per pre-approval step 4

## Step 13 — Telegram + sleep

- [ ] Send `[AGENT 3] LemonSqueezy live. First real subscription tested + refunded. Stripe coexists for client invoice payments.` notification
- [ ] Walk away. The next 24h will reveal anything broken. Don't fiddle with config.

## Total time

- With pre-approval prep done: **2-3 hours**
- Without pre-approval prep: **4-5 hours**

If anything goes wrong before Step 9 (still in test mode): no real money is involved, no users are affected. Fix and continue.

If anything goes wrong AFTER Step 9 (live mode), refer to [`rollback-plan.md`](rollback-plan.md).
