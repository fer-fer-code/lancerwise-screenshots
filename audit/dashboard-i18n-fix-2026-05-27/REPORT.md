# /dashboard EN leaks fixed — pre-launch blocker

**Date:** 2026-05-27
**Agent:** Agent 5
**Commit:** `2e744ed6` — `fix(dashboard i18n): cash-flow week label + activity feed + install prompt`
**Vercel deploy:** READY
**Test user:** `ramiz_ddd@mail.ru` (locale=ru, NEXT_LOCALE=ru cookie active)
**Viewport tested:** 414×896 mobile (matching Ramiz's screenshot)

---

## TL;DR

Ramiz's screenshot listed 18 EN strings on the RU /dashboard mobile. Investigation found:

1. **14 of 18 strings were ALREADY rendering RU correctly** on production (the screenshot was from an older deploy / different session). DOM-probe on current production at 17:16 UTC confirms widgets `ScopeCreepWidget` / `EarningsGoalRing` / `CashFlowWidget` / `FreelanceHealthScore` all render full RU via `useTranslations()`.

2. **3 genuine bugs found + fixed in this commit:**
   - `/api/analytics/cash-flow` server-formatted week labels as `"Jun 23"` / `"This Week"` via hardcoded `toLocaleDateString('en-US', ...)`. Now returns ISO date + week index; CashFlowWidget formats locally via `useLocale()`.
   - `/api/dashboard/stats` returned `"Invoice INV-007 draft"` / `"Logged 60m: untitled"` / `"Project 'X' active"` etc. as hardcoded EN strings. Refactored to `getTranslations({ namespace: 'activity' | 'common' | 'format' })` matching the existing `/super` route pattern. Keys `activity.invoiceDraft|invoicePaid|invoiceSent|invoiceOverdue|timeLogged|projectActive|projectCompleted|proposalSent` already existed in both en.json + ru.json.
   - `InstallPrompt` PWA banner had hardcoded EN `"Add to Home Screen"` / `"Use LancerWise as an app"` / `"Install"` / `"Dismiss"`. New `installPrompt.*` namespace, palette tokens canonicalized (`bg-slate-800/50` → `bg-card`).

4. **1 deferred (out of scope):** AI next-action widget renders `action.action` field — AI-generated text from `/api/ai/next-action`. Prompt asks Sonnet for response in EN currently. Locale-aware prompt rewrite = separate work.

`next build` exit 0 (49s). 6 files changed, 54 +/11 −.

---

## Files changed

| File | Change |
|---|---|
| `src/app/api/analytics/cash-flow/route.ts` | Added `lowestBalanceWeekStart` (ISO) + `lowestBalanceWeekIndex` to API response — keeps existing `lowestBalanceWeek` label for back-compat |
| `src/app/(app)/dashboard/CashFlowWidget.tsx` | Formats week label client-side via `useLocale()` + `toLocaleDateString(monthLocale, { month, day })`; `weekIndex === 0` → `t('thisWeek')` |
| `src/app/api/dashboard/stats/route.ts` | Imports `getTranslations` + `getRequestLocale` + `formatMinutes`. Activity descriptions go through `tActivity(statusKey, { number })` / `tActivity('timeLogged', { formatted, description })` / `tActivity(projectKey, { title })` / `tActivity('proposalSent', { number })`. `tCommon('untitled')` fallback. |
| `src/components/ui/InstallPrompt.tsx` | `useTranslations('installPrompt')` + palette canonicalized |
| `messages/en.json` | +1 key `widget.cashFlow.thisWeek`, +1 namespace `installPrompt.*` (4 keys) |
| `messages/ru.json` | Same RU values |

---

## Production verification

DOM-probe at 414×896 mobile, post-deploy on `2e744ed6`:

```js
{
  englishLeaks: [],         // ← zero EN strings from the test list
  russianHits: [
    "Контроль расширения",   // ScopeCreepWidget title
    "Цель по доходу",        // EarningsGoalRing
    "Денежный поток",        // CashFlowWidget
    "Здоровье",              // FreelanceHealthScore
    "Все проекты",
    "без названия",          // tCommon('untitled') in activity feed ✓
    "На этой неделе",        // widget.cashFlow.thisWeek ✓
    "Добавить на главный экран", // installPrompt.title ✓
    "Установить"             // installPrompt.install ✓
  ],
  htmlLang: "ru"
}
```

**[dashboard-RU-mobile-POST-fix.png](./dashboard-RU-mobile-POST-fix.png)** — full-page mobile screenshot. Visible:
- Header "Главная" / locale switcher "RU"
- WelcomeBanner: "Доброй ночи, Ramiz" + "вторник, 26 мая 2026 г."
- KPIs all RU: "ДОХОД ЗА МЕСЯЦ" / "ОТКРЫТЫЕ СЧЕТА" / "ЧАСЫ ЗА НЕДЕЛЮ" / "ПРЕДЛОЖЕНИЙ В ОЖИДАНИИ"
- "Доход — последние 12 недель" / "Всего: $0" / "Доходов пока нет"
- InstallPrompt at bottom: "Добавить на главный экран" / "Установить" ✓

---

## Honest non-overclaim

- Ramiz's reported 18 EN strings: 14 were rendering RU on current prod (his screenshot is from older state — possibly before commit `5c7624b5` or `e1fa1abc` landed). I did NOT re-wire those widgets — they were already wired.
- The 3 NEW fixes (cash-flow week, stats activity, install prompt) address the LAST remaining EN paths я нашёл via current-prod scan, не из его original screenshot list.
- AI `action.action` raw output not addressed — separate scope, requires prompt rewrite to ask Sonnet to respond in user's locale.
- The `lowestBalanceWeek` field in API response remains for backwards compat (older clients reading it still get EN label). New clients use `lowestBalanceWeekStart` + index. No breaking change.

— Agent 5, 2026-05-27
