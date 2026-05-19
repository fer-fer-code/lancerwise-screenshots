# [AGENT 3] GitHub upgrade Free → Pro — REPORT

**Date**: 2026-05-19
**Outcome**: ✅ **GitHub Pro $4/month active** — verified on `fer-fer-code` account

## Critical findings

### F1 — GitHub defaulted to ANNUAL prepay ($48/year), not monthly

When clicking "Upgrade to Pro" from `/settings/billing/plans`, the destination page (`/account/upgrade?plan=pro`) had **"Pay yearly" pre-selected** with **Total amount: $48.00 / year** + "Payment due May 18, 2026 — $48.00". Brief authorized $4/mo, NOT $48 upfront.

**Caught + averted** — clicked "Pay monthly" tab to flip URL to `?plan_duration=month&new_plan=developer` showing:
- Total amount: $4.00 / month ✓
- Due today: $4.00 ✓

This is GitHub's default UX nudging users to annual prepay. Without explicit attention, the automation would have charged $48 instead of $4. **Verified before proceeding.**

### F2 — Empty billing form blocked autonomous completion

The upgrade page required First name, Last name, Address, City, Country, State, Postal/Zip + optional VAT/GST. None of these were saved on the GitHub account. Per memory `feedback_no_autopayments.md` + general "no guessing real billing data" rule, I paused and asked Ramiz to provide the address.

Ramiz completed the form + checkout himself in the same browser window (handled the billing fields + saved card auth). I verified the result on `/settings/billing`.

## Final state

Banner on `/settings/billing`: **"Your plan was changed successfully."** ✅

| Verification | Value |
|--------------|-------|
| Account | `fer-fer-code` (personal) |
| Plan | **GitHub Pro** |
| Price | **$4.00 / month** |
| Actions quota | **3,000 minutes/month** (Free was 2,000) |
| Current usage | 2,000 min used / 3,000 min included ← **1,000 min headroom unblocked** |
| Storage quota | 2 GB Actions storage (currently 0.3 GB used) |
| Billable amount | $0 ($12.08 consumed, $12.08 discount via Pro inclusion) |
| Renewal | Monthly recurring (NOT annual prepay) ✓ |

## Steps taken

1. Navigate `https://github.com/settings/billing/plans` — verified Free as current plan ([01-before.png](screenshots/01-before.png))
2. Click "Upgrade to Pro" → landed on `/account/upgrade?plan=pro` with **yearly $48 pre-selected** ([02-upgrade-yearly-default.png](screenshots/02-upgrade-yearly-default.png))
3. **Click "Pay monthly" tab** to switch to $4/mo ([03-monthly-4dollars.png](screenshots/03-monthly-4dollars.png))
4. Paused for billing info — tagged Ramiz with form fields requirements
5. Ramiz completed billing form + card auth manually
6. Verify `/settings/billing` — banner success + Pro plan + 3,000 min quota ([04-after-pro.png](screenshots/04-after-pro.png))

## Unblocks

- [AGENT 1] Bug #029 CI runs can resume — quota headroom available
- [AGENT 2] P1-A dashboard CI runs can resume
- visual-regression gate failures from earlier today were unrelated to quota (auth.setup creds issue, separate fix)

## Cost impact

- $4/month recurring on fer-fer-code account
- LancerWise CI usage is the primary consumer ($12.08 last month, all discounted under Pro)
- If usage grows beyond 3,000 min: additional overage at $0.008/min ≈ ~$24/3000min beyond Pro included
- Quota resets monthly — 13 days remaining on current cycle

## Files in this dir

| File | Purpose |
|------|---------|
| [`REPORT.md`](REPORT.md) | this — full upgrade record |
| [`SUMMARY.md`](SUMMARY.md) | quick-read |
| [`screenshots/01-before.png`](screenshots/01-before.png) | Free plan current |
| [`screenshots/02-upgrade-yearly-default.png`](screenshots/02-upgrade-yearly-default.png) | $48/yr default caught |
| [`screenshots/03-monthly-4dollars.png`](screenshots/03-monthly-4dollars.png) | $4/mo confirmed |
| [`screenshots/04-after-pro.png`](screenshots/04-after-pro.png) | Pro active + 3,000 min quota |
