# Pre-approval checklist (do BEFORE Issac's email arrives)

Everything in this file can be done without LemonSqueezy credentials. Knock these out during the 1-5 day KYC wait so approval day = just config + merge + smoke.

## ⏱ Total time: ~2 hours

## 1. Branch hygiene (45 min)

- [ ] Cherry-pick `ab7f6cff` (skeleton) + `dc277842` (handlers + migration) onto a fresh `feature/lemonsqueezy-clean` branch off current `main` to avoid the 849-file diff:
  ```bash
  cd /Users/myoffice/lancerwise-agent3
  git fetch origin
  git checkout -b feature/lemonsqueezy-clean origin/main
  git cherry-pick ab7f6cff
  git cherry-pick dc277842
  ```
- [ ] During cherry-pick, if conflicts on `src/app/(app)/settings/billing/page.tsx` or `src/app/api/tool-subscriptions/optimize/route.ts`: keep `main`'s version (`git checkout origin/main -- <path>`)
- [ ] Verify `npm run typecheck` passes
- [ ] Verify `npm run build` passes (build will warn on missing LS env vars; that's expected — runtime guards handle it)
- [ ] Push as a draft PR — title: `feat: LemonSqueezy subscription integration (skeleton, awaiting KYC)`
- [ ] Mark PR Draft until env vars are set

## 2. Patch the P0 code gaps now, so approval day = config only (60 min)

Apply [`code-gaps.md`](code-gaps.md) Gap 1 + Gap 2 in the clean branch:

- [ ] **Gap 1 fix**: Add `profiles.plan` + `profiles.plan_expires_at` dual-write in webhook handlers (`handleSubscriptionCreated`, `Updated`, `Resumed`, `Cancelled`, `Expired`)
- [ ] **Gap 1 fix**: Add variant_id → plan name mapping at top of file:
  ```typescript
  const planFromVariant = (variantId: string | number): 'pro' | 'team' => {
    if (String(variantId) === process.env.LEMONSQUEEZY_VARIANT_TEAM) return 'team'
    return 'pro'  // default to pro for safety
  }
  ```
- [ ] **Gap 2 fix**: Patch `UpgradeButton.tsx` to call `/api/lemonsqueezy/checkout` with `{ tier }` payload
- [ ] **Gap 2 fix**: Patch `BillingPageClient.tsx` similarly
- [ ] **Gap 4 prep**: Add `lemonsqueezy_customer_id` column to migration file:
  ```sql
  alter table profiles add column if not exists lemonsqueezy_customer_id text;
  ```
- [ ] Webhook writes `lemonsqueezy_customer_id` to profiles in `handleSubscriptionCreated`
- [ ] Run typecheck + build again
- [ ] Commit + push to draft PR

## 3. Test infrastructure (15 min)

- [ ] Set placeholder env vars in `.env.local` (so dev server doesn't crash on import):
  ```bash
  LEMONSQUEEZY_API_KEY=placeholder_replace_after_kyc
  LEMONSQUEEZY_STORE_ID=0
  LEMONSQUEEZY_VARIANT_PRO=0
  LEMONSQUEEZY_VARIANT_TEAM=0
  LEMONSQUEEZY_WEBHOOK_SECRET=placeholder_replace_after_kyc
  ```
- [ ] Confirm `next dev` starts cleanly
- [ ] Confirm `/api/lemonsqueezy/checkout` POST returns the expected 503 ("store or variant not configured") on placeholder values

## 4. Documentation prep (15 min)

- [ ] Draft changelog entry in `src/data/changelog.ts` for the version that ships LS:
  > **Subscription billing on LemonSqueezy.** Pro and Team plan upgrades now flow through LemonSqueezy (Merchant of Record — handles VAT/tax compliance for international users).
- [ ] Draft Twitter/Indie Hackers announcement post: "LancerWise pricing live — Pro $15/mo, Team $39/mo. Built on LemonSqueezy for global tax handling. Free tier stays free."

## 5. LemonSqueezy dashboard prep (can do during KYC review — no need to wait for approval)

- [ ] Log into https://app.lemonsqueezy.com — confirm account exists + KYC status visible
- [ ] **Don't create products yet** — wait for approval (creating products before KYC approval can get flagged)
- [ ] Read LS docs for the events you'll subscribe to:
  - https://docs.lemonsqueezy.com/help/webhooks
  - https://docs.lemonsqueezy.com/api/webhooks/webhook-payloads
- [ ] Familiarize with LS test mode (URL pattern, test card numbers — `4242 4242 4242 4242` works as expected)

## 6. Rollback rehearsal (15 min)

- [ ] Mentally walk through the rollback plan in [`rollback-plan.md`](rollback-plan.md)
- [ ] Verify Vercel "Promote previous deployment" works on a non-critical staging deploy (just to know the click path)
- [ ] Confirm you know how to disable Vercel env vars without deleting them (set to placeholder + redeploy)

## ⏱ Done?

If all checkboxes above are ✅:
- The draft PR is ready to merge with 1 config commit on approval day
- 3-4 hours of approval-day work compresses to ~1 hour of config + verification
- The DB migration, webhook handlers, checkout route, and UI wiring are all done — just paste env vars and merge

If you finish this pre-approval prep, the only thing standing between you and live subscription billing on approval day is **clicking "Add Variable" in Vercel five times**.
