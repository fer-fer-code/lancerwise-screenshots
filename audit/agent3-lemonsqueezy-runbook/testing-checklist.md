# Testing checklist — LemonSqueezy integration

For both test-mode smoke (Step 7 of approval day) and live-mode real-money smoke (Step 10), use this grid. Run from a fresh incognito window each time to avoid cached auth.

## Test accounts

| Account | Email | Purpose |
|---------|-------|---------|
| Free user (control) | `lancerwise-ls-test-free@<temp>` | Should never see paywalled content |
| Pro upgrade target | `lancerwise-ls-test-pro@<temp>` | Will purchase Pro tier |
| Team upgrade target | `lancerwise-ls-test-team@<temp>` | Will purchase Team tier |
| Cancellation target | reuse Pro after smoke | Cancel + verify access timeline |

Use mail.tm or `+suffix` aliases on a gmail account. Per memory `backlog_test_account_email_domain.md`: don't use `.local` / `.test` — Supabase rejects.

## Section A — Free plan signup (control flow)

- [ ] Register fresh email via `/register`
- [ ] Confirmation email arrives (per Supabase Confirm Email setup)
- [ ] Click confirm link → land on dashboard
- [ ] DB: `profiles.plan = 'free'`, no `subscriptions` row
- [ ] UI: navigate `/upgrade` → CTAs show "Upgrade to Pro" + "Upgrade to Team"
- [ ] UI: navigate `/dashboard` → paywalled features show "Upgrade required" hints (if any)

## Section B — Pro tier checkout

- [ ] Sign in as `lancerwise-ls-test-pro` (free)
- [ ] Open `/upgrade`
- [ ] Click "Upgrade to Pro" → DevTools Network tab: POST to `/api/lemonsqueezy/checkout` (NOT `/api/stripe/subscribe`)
- [ ] Response is `{ url: "https://app.lemonsqueezy.com/checkout/..." }`
- [ ] Browser navigates to LS checkout
- [ ] LS checkout shows: Product = Pro, Price = $15/mo, customer email pre-filled
- [ ] Test mode: pay with `4242 4242 4242 4242` (any future expiry/CVC)
- [ ] Redirect back to `https://www.lancerwise.com/dashboard?upgraded=1`
- [ ] DB checks (within 30s):
  - [ ] `subscriptions` has new row, `status='active'`, `variant_id` matches `LEMONSQUEEZY_VARIANT_PRO`
  - [ ] `subscription_events` has `subscription_created` payload (full JSON visible)
  - [ ] **`profiles.plan = 'pro'` for this user** ← #1 gotcha verifier
  - [ ] `profiles.plan_expires_at` ≈ now + 30 days
  - [ ] `profiles.lemonsqueezy_customer_id` is set (non-null string)
- [ ] UI re-fetch `/upgrade` → primary CTA changes ("You're on Pro" or similar) — verifies cache invalidation

## Section C — Team tier checkout

- [ ] Sign in as `lancerwise-ls-test-team` (free)
- [ ] Same flow as B, but click "Upgrade to Team"
- [ ] Verify `variant_id` matches `LEMONSQUEEZY_VARIANT_TEAM`
- [ ] **`profiles.plan = 'team'` for this user**
- [ ] All Team-only features unlock in UI

## Section D — Webhook signature verification

- [ ] Send a forged webhook to `/api/lemonsqueezy/webhook` with wrong signature:
  ```bash
  curl -X POST https://www.lancerwise.com/api/lemonsqueezy/webhook \
    -H 'x-signature: deadbeef' \
    -H 'Content-Type: application/json' \
    -d '{"meta":{"event_name":"subscription_created"},"data":{"id":"fake"}}'
  ```
- [ ] Expect: HTTP 401 `{"error":"invalid signature"}`
- [ ] DB: no `subscription_events` row was inserted for `id=fake`

## Section E — Webhook delivery verification (from real LS)

- [ ] Send a Pro subscription via test mode (Section B already does this)
- [ ] LS dashboard → Webhooks → click your webhook → "Recent deliveries" list
- [ ] Confirm 200 response for `subscription_created` delivery
- [ ] Click delivery → see payload + response body
- [ ] If 5xx response: check Vercel logs for `[lemon] handler error`

## Section F — Cancellation flow

- [ ] Take the Pro test subscription from Section B
- [ ] LS dashboard → Subscriptions → click → "Cancel subscription"
- [ ] Within 30s, DB:
  - [ ] `subscriptions.status = 'cancelled'`
  - [ ] `subscriptions.cancel_at_period_end = true`
  - [ ] `subscription_events` has `subscription_cancelled` row
- [ ] `profiles.plan` should still be 'pro' (user keeps access until period end)
- [ ] UI navigate `/billing` → shows "Cancels on <date>"

## Section G — Subscription expiration

- [ ] LS dashboard → force-expire the cancelled subscription (or wait for natural period end)
- [ ] Webhook `subscription_expired` fires
- [ ] DB: `subscriptions.status = 'expired'`
- [ ] DB: **`profiles.plan = 'free'`** for the user
- [ ] UI: Pro-only features re-paywall

## Section H — Refund handling

- [ ] After a paid subscription is active in Section B:
- [ ] LS dashboard → Subscriptions → "Refund last payment"
- [ ] Within 30s: `subscription_events` has `order_refunded` payload
- [ ] **Decision required**: should refund auto-cancel the subscription?
  - Default LS behavior: refund cancels the subscription
  - Our handler currently does nothing on `order_refunded` (stub)
  - Recommend: keep stub for now; if customer complains about access after refund, manual via support flow
- [ ] If automated: implement `order_refunded` handler to set `profiles.plan = 'free'`

## Section I — Payment failure (dunning)

Hard to test without LS-side simulation. Options:
- [ ] LS test mode: use card `4000 0000 0000 0341` (succeeds on auth, fails on capture)
- [ ] Verify: webhook `subscription_payment_failed` fires
- [ ] DB: `subscriptions.status = 'past_due'`
- [ ] LS auto-retries per its retry schedule (3 attempts over 2 weeks by default)
- [ ] After final failure: `subscription_expired` → `profiles.plan = 'free'`

## Section J — Self-service customer portal

(Only after Gap 4 fix is in.)
- [ ] Sign in as a subscribed user
- [ ] Navigate to `/billing` (or `/settings/billing`)
- [ ] Click "Manage subscription"
- [ ] Redirects to LS-hosted customer portal (URL pattern: `https://app.lemonsqueezy.com/billing/<customer-token>`)
- [ ] In portal: can update payment method, view invoices, cancel
- [ ] Action taken in portal → webhook fires → DB updated within 30s

## Section K — Stripe coexistence (for client invoice payments)

LemonSqueezy is subscription-only. Client invoice payments stay on Stripe — verify these still work:

- [ ] Sign in as a freelancer, send an invoice
- [ ] Open the invoice portal link (token-based) in incognito
- [ ] Click "Pay invoice" → POST to `/api/stripe/checkout` (not LemonSqueezy)
- [ ] Stripe test card `4242 4242 4242 4242` succeeds
- [ ] Webhook `checkout.session.completed` fires
- [ ] `invoices.status = 'paid'`, `invoices.paid_at` set
- [ ] **`invoices.stripe_payment_id` is set** — confirms Stripe path is intact

## Section L — UI regression spot-check

Following P0/P1 patches, verify nothing else broke:

- [ ] `/settings/billing` redirects to `/upgrade` (Gap 3a) — not 404
- [ ] `/api/tool-subscriptions/optimize` POST returns streaming response (Gap 3b) — not env-frozen error
- [ ] All other AI routes in `/api/ai/*` still work (force-dynamic invariant preserved)

## Pass criteria

- All of A, B, C, D, E, F, G, K pass before going live
- H, I deferred to first-week post-launch with monitoring
- J deferred until Gap 4 ships
- L verified before any merge

## Failure handling

If any test in A-G fails → go to [`rollback-plan.md`](rollback-plan.md). Do NOT switch to live mode (Step 9 of approval day) until all critical tests pass in test mode.
