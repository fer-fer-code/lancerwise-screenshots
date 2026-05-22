# P1-2 — /upgrade page 100% English on RU locale [QA-007]

## Severity
**P1 broken UX** — pricing conversion surface, RU revenue path

## Summary
The authed `/upgrade` page renders 100% English content for Russian users — only the sidebar nav is translated. This is the conversion-critical surface where users decide to subscribe; broken localization here directly impacts RU revenue.

## Steps to reproduce
1. Sign in as RU-locale user (or set `NEXT_LOCALE=ru` cookie)
2. Navigate to `https://www.lancerwise.com/upgrade`
3. Observe sidebar shows Главная / Финансы / Клиенты etc. (translated ✓)
4. Observe page content is all English:
   - Page heading: "Upgrade your plan" (should be "Обновите план")
   - Subheading: "You're on the Pro plan." (should be "Вы на тарифе Pro.")
   - Toggle: "Monthly / Yearly / Save 17-20%" (should be "Помесячно / Годовой / Экономия 17-20%")
   - Free plan card: "Free / $0 forever" / "Up to 2 clients / Unlimited invoices / Time tracker / 3 AI generations / month / Basic reports / GDPR data export / Mobile responsive" → all English
   - Pro card: "Pro / $15/month / For growing freelancers" / feature list (12 items) → all English
   - Badges: "Most popular" + "Current plan" → English
   - CTAs: "Upgrade to Pro" + "Free forever" → English

## Expected behavior
All content translated to Russian on `NEXT_LOCALE=ru`. Reference: `/pricing` (public) is fully translated — same page essentially, different route. Authed `/upgrade` should mirror that translation pattern.

## Actual behavior
PlansGrid component uses hardcoded English strings in `PLANS` const + `priceLabel()` + JSX literals.

## Screenshot reference
- `EVIDENCE/page-screenshots/upgrade_chromium_ru_desktop_above-fold.png` — confirms 100% English
- `EVIDENCE/page-screenshots/upgrade_chromium_en_desktop_above-fold.png` — EN baseline
- `EVIDENCE/page-screenshots/pricing_chromium_ru_desktop_above-fold.png` — counterexample, fully translated public version

## Suspect file location
**`src/app/(app)/upgrade/PlansGrid.tsx`** (verified to exist)

Specifically the `PLANS` array (lines ~30-90) likely contains:
```ts
const PLANS = [
  { name: 'Free', amount: '$0', period: 'forever', features: ['Up to 2 clients', ...], cta: null },
  { name: 'Pro', amount: '$15', period: '/month', features: ['Unlimited clients', ...], cta: 'Upgrade to Pro', ... },
  { name: 'Business', amount: 'Coming soon', features: ['Everything in Pro', ...], ... }
]
```

All these literal strings need to flow through `t('upgrade.plans.free.name')` etc.

## Quick fix hypothesis

```diff
- { name: 'Free', amount: '$0', period: 'forever', features: ['Up to 2 clients', 'Unlimited invoices', ...] }
+ { name: t('upgrade.plans.free.name'), amount: '$0', period: t('upgrade.plans.free.period'), features: t.array('upgrade.plans.free.features') }
```

Add keys to `messages/en.json` AND `messages/ru.json`:
```json
{
  "upgrade": {
    "title": "Upgrade your plan" / "Обновите план",
    "subtitle": "You're on the {plan} plan." / "Вы на тарифе {plan}.",
    "toggle": { "monthly": "Monthly/Помесячно", "yearly": "Yearly/Годовой", "save": "Save {pct}%" / "Экономия {pct}%" },
    "plans": {
      "free": { "name": "Free", "amount": "$0", "period": "forever/навсегда", "features": [...8 entries...] },
      "pro": { "name": "Pro", "amount": "$15", "period": "/month/мес", "features": [...12 entries...], "cta": "Upgrade to Pro/Перейти на Pro" },
      "business": { "name": "Business", "comingSoon": "Coming soon/Скоро", "features": [...7 entries...] }
    },
    "badges": { "popular": "Most popular/Самый популярный", "current": "Current plan/Текущий тариф" }
  }
}
```

Reuse keys from `/pricing` public page if possible (DRY principle).

## Verification after fix
```bash
node /tmp/qa_capture.js --engine chromium --locale ru --viewport desktop --routes /upgrade --authed true
```
Open resulting `upgrade_chromium_ru_desktop_above-fold.png` and verify all text in Russian.

## Estimate
~1-2h (single page, ~30 strings to extract)

## Cross-references
- P1-1 (i18n gap general) — same root cause; this is the highest-leverage instance because revenue path
- P1-3 (Current plan CTA contradiction) — same file, fix together
- QA-017 P2: /pricing↔/upgrade feature-list mismatch — also same file
