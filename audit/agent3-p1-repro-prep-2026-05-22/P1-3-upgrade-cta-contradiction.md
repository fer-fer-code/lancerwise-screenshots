# P1-3 — /upgrade "Current plan" badge + "Upgrade to Pro" CTA contradiction [QA-008]

## Severity
**P1 broken UX** — paid-plan management bug, brand-damaging

## Summary
For a user already subscribed to Pro, the Pro card shows BOTH the green "Current plan" badge AND a primary CTA reading "Upgrade to Pro". The user is being asked to upgrade to a plan they're already on. Risk: double-charge if button is functional + click leads to checkout.

## Steps to reproduce
1. Sign in as a user already on Pro plan (the QA fixture user qualifies — confirmed Pro in screenshots)
2. Navigate to `/upgrade`
3. Observe Pro card:
   - Top-left badge: "Most popular" (purple)
   - Top-right badge: "Current plan" (green)
   - Body: features list (12 items)
   - **Primary CTA at bottom: `Upgrade to Pro` (purple button, fully enabled)**

## Expected behavior
When `isCurrent === true` for a paid plan, the CTA should:
- Be disabled OR
- Read "Manage plan" / "Manage subscription" / "Cancel subscription" / "Your current plan"
- Link to `/settings/billing` or open a Manage Plan modal

The Free plan card handles this correctly — when isCurrent it shows "Your current plan" (cursor-default, no action). The Pro plan does NOT.

## Actual behavior
`<UpgradeButton plan={plan.ctaPlan} label="Upgrade to Pro" />` renders unchanged. If clicked, it likely triggers LemonSqueezy / Stripe checkout for Pro plan again.

## Screenshot reference
- `EVIDENCE/page-screenshots/upgrade_chromium_en_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/upgrade_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/upgrade_webkit_en_mobile_above-fold.png`
- `EVIDENCE/page-screenshots/upgrade_webkit_ru_mobile_above-fold.png`

## Suspect file location
**`src/app/(app)/upgrade/PlansGrid.tsx`** line 171-177 (verified):

```tsx
{plan.cta ? (
  <UpgradeButton plan={plan.ctaPlan} label={plan.cta} />
) : (
  <div className="block text-center font-semibold py-3 rounded-xl border border-slate-700 text-slate-500 text-sm cursor-default">
    {isCurrent ? 'Your current plan' : 'Free forever'}
  </div>
)}
```

The `plan.cta ?` branch fires whenever `plan.cta` is truthy (i.e. for Pro plan always). The `isCurrent` check only applies to the cta-less Free branch.

## Quick fix hypothesis

Move `isCurrent` check OUTSIDE the cta branch:

```diff
- {plan.cta ? (
-   <UpgradeButton plan={plan.ctaPlan} label={plan.cta} />
- ) : (
-   <div className="block text-center font-semibold py-3 rounded-xl border border-slate-700 text-slate-500 text-sm cursor-default">
-     {isCurrent ? 'Your current plan' : 'Free forever'}
-   </div>
- )}
+ {isCurrent ? (
+   <Link href="/settings" className="block text-center font-semibold py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-100 text-sm">
+     {t('upgrade.manage')}
+   </Link>
+ ) : plan.cta ? (
+   <UpgradeButton plan={plan.ctaPlan} label={plan.cta} />
+ ) : (
+   <div className="block text-center font-semibold py-3 rounded-xl border border-slate-700 text-slate-500 text-sm cursor-default">
+     {t('upgrade.plans.free.freeForever')}
+   </div>
+ )}
```

Or simplest: if `isCurrent`, render a non-clickable "✓ Your current plan" pill in place of CTA.

## Verification after fix
1. Re-probe `/upgrade` as Pro user → Pro card CTA should NOT say "Upgrade to Pro"
2. Re-probe `/upgrade` as Free user → Pro card CTA SHOULD say "Upgrade to Pro" + Free card shows "Your current plan"
3. Test as Business user (if billing supports it) → Business card shows "Your current plan"

## Estimate
~30 min (single conditional change + verify all 3 plan states)

## Cross-references
- P1-2 (RU translation gap on /upgrade) — same file, fix together
- LemonSqueezy integration backlog `project_lancerwise_lemonsqueezy_env_vars` — confirm checkout idempotency before/after fix (in case button IS functional + user already-subscribed click triggers duplicate)
