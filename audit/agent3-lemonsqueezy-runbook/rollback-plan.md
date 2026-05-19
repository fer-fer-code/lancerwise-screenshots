# Rollback plan — LemonSqueezy

Three tiers depending on severity. Always check Vercel logs + `subscription_events` audit table FIRST to understand what failed before deciding tier.

## Triage decision tree

```
Problem detected
│
├── Checkout doesn't load OR upgrade button broken
│   → Tier 1 (UI revert) — 5 min
│
├── Checkout works but webhook fails (subscriptions row missing OR
│                                     profiles.plan not updating)
│   → Tier 2 (disable LS) — 15 min
│
├── Real users charged but data is wrong/inconsistent
│   → Tier 3 (manual migration) — 1-2 hrs per user
│
└── DB schema corruption (subscriptions table broken)
    → Tier 4 (DB rollback from pre-LS backup) — 30 min, requires downtime
```

## Tier 1 — Soft rollback (UI revert only)

**When**: LS checkout flow has UI bugs but webhook + DB are intact. Symptoms:
- "Upgrade to Pro" button returns 500
- LS checkout page won't open
- Redirect after payment lands on wrong page

**Action** (5 min):

1. Vercel dashboard → Deployments → previous deployment (before LS merge)
2. Click "..." → **"Promote to Production"**
3. Confirms within ~30s

**Effect**:
- New users hitting `/upgrade` → Stripe checkout path again
- LS webhook keeps firing for any in-flight LS subscriptions → their `subscriptions` rows + `profiles.plan` keep updating
- Existing LS-subscribed users keep access (data is already correct in DB)
- No data loss

**Recovery path**: fix the UI bug, deploy a patch, repromote.

## Tier 2 — Hard rollback (disable LS entirely)

**When**: LS webhook is corrupting data, or signature verification is broken, or `profiles.plan` is getting wrong values.

**Action** (15 min):

1. **Step A — Stop the bleeding** (1 min):
   - LS dashboard → Webhooks → pause the webhook
   - **Or**: Vercel → env vars → set `LEMONSQUEEZY_WEBHOOK_SECRET` to `disabled` and redeploy → webhook returns 503 on all calls
2. **Step B — Disable checkout** (2 min):
   - Vercel → env vars → set `LEMONSQUEEZY_API_KEY` to `disabled` and redeploy
   - Now `/api/lemonsqueezy/checkout` returns 503 ("store or variant not configured")
3. **Step C — Revert UI** (5 min):
   - Either: Vercel "Promote previous deployment" (back to pre-LS)
   - Or: git revert the LS-merge commit on main, push, wait for new deploy
4. **Step D — Communicate** (5 min):
   - Tweet/announce: "Subscription upgrades temporarily on Stripe while we resolve a LemonSqueezy integration issue."
   - Email any LS subscribers from the last 24h with status

**Effect**:
- All new upgrades → Stripe path (assuming Stripe code wasn't removed — it shouldn't have been; only `/api/stripe/subscribe` callers were swapped to LS)
- LS subscribers stay subscribed in LS (paying), but their `profiles.plan` won't update from webhooks (now disabled)
- Risk: LS subscribers fall out of `profiles.plan = 'pro'` if their `plan_expires_at` was set during the broken period and the cron evicts them. Mitigation: temporarily disable any plan-expiration cron, OR manually patch affected users (Tier 3).

**Recovery path**: same as Tier 1 — fix, re-enable env vars, redeploy, re-verify.

## Tier 3 — Manual customer migration

**When**: real users have paid via LS but their `subscriptions` row OR `profiles.plan` is incorrect. Could happen if a deploy went out with a webhook bug for 30+ min.

**Action** (1-2 hrs per affected user):

1. **Step A — Build the affected list** (15 min):
   - LS dashboard → Subscriptions → export CSV of all active subscriptions
   - Cross-reference with DB: `select user_id, plan, plan_expires_at from profiles where lemonsqueezy_customer_id is not null;`
   - Find mismatches (e.g. LS says active, DB says free)
2. **Step B — Per-user repair** (5-15 min each):
   - For each mismatch, look up the LS subscription's `customer_id`, `variant_id`, `renews_at`
   - Determine plan from `variant_id`: PRO_VARIANT → 'pro', TEAM_VARIANT → 'team'
   - Run SQL:
     ```sql
     update profiles set
       plan = 'pro',  -- or 'team'
       plan_expires_at = 'YYYY-MM-DD HH:MM:SSZ',  -- from LS renews_at
       lemonsqueezy_customer_id = '12345'  -- if missing
     where id = '<user_uuid>';
     ```
   - Optional: also backfill the `subscriptions` table row if missing:
     ```sql
     insert into subscriptions (user_id, lemonsqueezy_subscription_id, lemonsqueezy_customer_id,
                                status, plan_id, variant_id, current_period_start, current_period_end)
     values (...);
     ```
3. **Step C — Notify affected users** (15 min):
   - Email template: "Hi <name>, we briefly had an issue with our subscription system. Your Pro access is now active. No action needed. Sorry for the disruption."

**Prevention**: monitor `subscription_events` table for `null` `subscription_id` foreign keys + retry mismatches via a one-shot script every hour for the first 48h post-launch.

## Tier 4 — DB rollback (last resort)

**When**: `subscriptions` table itself is corrupted (constraint violation, lost rows). Should never happen but documented for completeness.

**Action** (30 min, requires brief downtime):

1. **Step A — Maintenance mode** (2 min): Vercel env var `MAINTENANCE_MODE=true` and redeploy if a maintenance landing page exists
2. **Step B — Restore from backup**:
   - Pre-LS backup file: `~/lancerwise-backups/pre-lemonsqueezy-<timestamp>.sql` (created in approval-day Step 5)
   - Drop affected tables: `psql $DATABASE_URL -c "drop table subscription_events cascade; drop table subscriptions cascade;"`
   - Restore schema: `psql $DATABASE_URL -f ~/lancerwise-backups/pre-lemonsqueezy-<timestamp>.sql`
3. **Step C — Replay events**:
   - Pull all `subscription_events` from LS dashboard → Webhooks → deliveries (last 30 days)
   - Re-run each through the webhook endpoint OR write a script that walks them and rebuilds `subscriptions` rows
4. **Step D — Exit maintenance**: unset env var, redeploy
5. **Step E — Audit**: spot-check 5+ users' plan states vs LS dashboard

## Communication templates

### To affected users (Tier 2 or Tier 3)
```
Subject: Quick note about your LancerWise subscription

Hi <name>,

We had a brief issue with our subscription billing system today. Your subscription is fully active and you should have access to all your plan's features.

No action needed from your side. We're sorry for any confusion this caused.

If you notice anything off, reply to this email and we'll fix it immediately.

— Ramiz
```

### Public status (Tier 2 if it became visible)
```
We hit a brief snag with our subscription upgrade flow today. New upgrades are flowing through our backup payment processor while we fix it. Existing subscriptions are unaffected. Will post again when fully resolved.
```

## What NOT to do during rollback

- ❌ Do NOT delete the `subscriptions` or `subscription_events` tables without backup
- ❌ Do NOT cancel any LS subscriptions from the LS dashboard during rollback — let users keep paying; reconcile DB afterward
- ❌ Do NOT issue refunds proactively — wait for user complaints, then offer if asked
- ❌ Do NOT revert the Stripe webhook handler — it still serves invoice payments
- ❌ Do NOT push a "fix" without test-mode verification first — pressure to ship fast is how the original bug got there

## Post-rollback retrospective

After any rollback, before reattempting:
- [ ] Document root cause in git commit message of the fix
- [ ] Add test case (manual or automated) that would have caught it
- [ ] Update [`code-gaps.md`](code-gaps.md) with the new gap (if applicable)
- [ ] Wait minimum 24h between rollback and next deploy attempt — gives time for the issue to fully manifest if there's more
