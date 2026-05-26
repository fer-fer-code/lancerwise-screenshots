# /analytics widgets RU/EN i18n + palette — session 1 handoff

**Date:** 2026-05-26
**Session by:** Claude (Sonnet 4.5 via claude.ai)
**Status:** 24/124 widgets done (19.4%) — handoff to next conversation needed.
**Last commit on main:** `11b87b0e` (rebased)

## Completed widgets (24)

Alphabetical, all under `src/app/(app)/analytics/`:

1. AnnualGoal
2. AnnualIncomeBreakdown
3. AverageClientLifespan
4. AverageProjectSize
5. AverageResponseTime
6. AvgInvoiceByMonth
7. AvgInvoiceValueTrend
8. AvgPaymentTime
9. AvgProjectDuration
10. BestDayToInvoice
11. BillableRatioTrend
12. ClientAcquisitionTimeline
13. ClientActivityScore
14. ClientChurnPrediction
15. ClientChurnRisk
16. ClientGrowthChart
17. ClientInvoiceGap
18. ClientLifecycleStage
19. ClientLifetimeValue
20. ClientPaymentBehavior
21. ClientPaymentPattern
22. ClientPaymentScore
23. ClientRepeatRate
24. ClientRevenueGrowth

## Commits landed (in order, all rebased on main)

1. `df408f29` — checkpoint 1 (widgets 1-8)
2. `38ac2e11` → rebased into `cc2f1cb2` line — checkpoint 2 (widgets 9-12)
3. `d7ef60bd` — checkpoint 3 (widgets 13-16)
4. `cc2f1cb2` — checkpoint 4 (widgets 17-20)
5. `11b87b0e` — checkpoint 5 (widgets 21-24)

## Remaining widgets (100)

### Batch 1 finish (8 widgets — Cl* → Co*)
- ClientPaymentRiskScore
- ClientSegmentReport
- ClientValuePerHour
- ClientValueSegmentation
- ConcentrationRisk
- ContractRenewalForecast
- ContractValueTracker
- CopyStatsButton

### Batch 2: D-M (~33 widgets)
EffectiveRate, ExpenseTrend, ExpenseVsRevenueRatio, FreelancerBenchmark, FreelancerCard, FreelancerScorecard, FreelancerStats, HourlyIncomeCalendar, HourlyRateHistory, IncomeProjection, IncomeStabilityScore, InvoiceAgeingReport, InvoiceAgingTrend, InvoiceByDayOfMonth, InvoiceConversionFunnel, InvoiceFrequencyChart, InvoicePaymentGapTrend, InvoiceRecoveryRate, InvoiceSendToPayDelay, InvoiceSizeDistribution, InvoiceStatusFunnel, InvoiceValueTrend, InvoiceVelocityScore, InvoiceWinRate, LargestInvoicesEver, LifetimeRevenueTimeline, LongestPayingClients, MonthlyClientAcquisition, MonthlyHoursHeatmap, MonthlyInvoiceVolume, MonthlyNewVsReturning, MonthlyRecurringRevenue, MonthlyUniqueClients

### Batch 3: N-R (~31 widgets)
NetRevenueRetention, OverdueByClient, OverdueInvoiceImpact, PaymentSpeed, PeakHoursAnalysis, PeakRevenueMonth, ProfitCalculator, ProfitLoss, ProjectCompletionRate, ProjectDurationAnalysis, ProjectEstimateAccuracy, ProjectProfitabilityIndex, ProjectROIByClient, ProjectsByMonth, ProjectsPerClient, ProjectSuccessRate, ProposalConversionRate, QuarterlyGrowthRate, QuarterlyReview, RateSuggestion, RetentionRate, RevenueByClient, RevenueByDay, RevenueByDayOfMonth, RevenueByProjectType, RevenueByWeekOfMonth, RevenueCalendar, RevenueConcentrationHHI, RevenueConcentrationIndex, RevenueConcentrationRisk, RevenueForecastChart, RevenueGapMonths, RevenueGrowthRate, RevenueMomentum, RevenuePerHour, RevenuePerWorkingDay, RevenueSeasonality, RevenueVsExpenses, RevenueVsHoursTrend

### Batch 4: S-Z (~28 widgets)
SourceBreakdown, TaxEstimate, TimeByDayOfWeek, TimeToFirstInvoice, TimeVsRevenueScatter, TopClientsByHoursTracked, TopEarningClients, TopEarningMonths, TopProjectsROI, TopRevenueMonths, TopRevenueWeeks, WeeklyRevenueVariance, WorkHoursChart, YearEndReview, YearOverYearComparison, YearToDateSummary, YearlyGrowthSummary

### Batch 5: Outside-folder components imported by page.tsx
- `src/components/analytics/WorkHeatmap.tsx`
- `src/components/WorkHoursHeatmap.tsx`

### Batch 6: Verification
Playwright captures /insights at 1280×1024 fullPage RU + EN, push to `lancerwise-screenshots/audit/insights-widgets-full-2026-05-26/`.

## Established patterns (next-session reference)

### i18n namespace structure

All widget keys under `analyticsPage.widgets.{widgetCamelCase}` in both `messages/en.json` and `messages/ru.json`. Current count: **24 widget groups**.

### Standard widget transformation pattern

```diff
- 'use client'
- import { useState, useEffect } from 'react'
- import { createClient, getCachedUser } from '@/lib/supabase/client'
+ 'use client'
+ import { useState, useEffect } from 'react'
+ import { useTranslations, useLocale } from 'next-intl'  // useLocale only when month/date labels involved
+ import { createClient, getCachedUser } from '@/lib/supabase/client'

  export default function MyWidget() {
+   const t = useTranslations('analyticsPage.widgets.myWidget')
+   const locale = useLocale()  // optional, only when needed
    const [content, setContent] = useState<ReactNode>(null)

    useEffect(() => {
      async function load() {
+       const monthLocale = locale === 'ru' ? 'ru-RU' : 'en-US'
        // ... data fetch ...

-       label: d.toLocaleString('en', { month: 'short' }),
+       label: d.toLocaleString(monthLocale, { month: 'short' }),

        // ... rendering ...
        setContent(
-         <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
+         <div className="bg-card rounded-xl border border-subtle p-6">
-           <h3 className="font-semibold text-slate-100">My Widget Title</h3>
+           <h3 className="font-semibold text-text-primary">{t('title')}</h3>
            ...
          </div>
        )
      }
      load()
-   }, [])
+   }, [t, locale])  // include t, and locale if used

    if (!content) return null
    return <>{content}</>
  }
```

### Palette swap table (used consistently)

| From | To |
|---|---|
| `text-slate-100` | `text-text-primary` |
| `text-slate-200` | `text-text-secondary` |
| `text-slate-300/400/500/600` | `text-text-muted` (mostly) or `text-text-secondary` for emphasis |
| `bg-slate-800/50` `bg-slate-800` | `bg-card` |
| `bg-slate-700/50` | `bg-elevated/40` |
| `bg-slate-900` `bg-slate-950` | `bg-canvas` or `bg-elevated` (tooltip context) |
| `border-slate-700` `border-slate-800` `border-slate-600` | `border-subtle` |
| `bg-violet-100` `bg-violet-200` `bg-violet-300` (decorative) | `bg-violet-700/30` (canonical dim) |
| `bg-purple-100/200` (decorative) | `bg-purple-700/30` |
| `bg-blue-*` (decorative chart accent) | `bg-violet-*` (matches brand) |
| `bg-sky-*` `bg-cyan-*` `bg-orange-100` `bg-pink-100` `bg-gray-900` (decorative) | `bg-violet-700/30` or `bg-elevated` |
| `text-indigo-200/300` | `text-violet-200/300` |
| `bg-teal-50` (light pastel drift) | `bg-teal-900/20` |

**Preserved (semantic, do not touch):**
- `bg-violet-600/500/400`, `bg-violet-900/20`, `border-violet-800/40` — brand
- `bg-red-950/30`, `text-red-400`, `bg-rose-*` — error
- `bg-amber-*`, `text-amber-400`, `bg-orange-700/30`, `text-orange-400` — warning + weekends
- `bg-emerald-*`, `text-emerald-*`, `bg-green-*`, `text-green-*` — success
- `bg-teal-*` (when used as category encoding for "long-term" etc.) — semantic

### Common patterns observed

- **`'Unknown'` fallback for client names** → `t('unknown')`
- **`(inv as any).clients`** → `(inv as { clients?: { name?: string } }).clients` (TS strict)
- **`{value}d` `{value}h` `{value} mo` suffix strings** → `t('daysShort', { days })` / `t('hoursShort', { hours })` etc.
- **`{count} client{count > 1 ? 's' : ''}`** → ICU plural in i18n
- **toLocaleString('en', ...)** → `toLocaleString(monthLocale, ...)` with `locale === 'ru' ? 'ru-RU' : 'en-US'`
- **`useEffect` dependency** → add `[t]` or `[t, locale]` to deps array

### Russian terminology reference (consistent across all widgets)

| EN | RU |
|---|---|
| Revenue/Income | Доход |
| Profit | Прибыль |
| Expense | Расход |
| Tax | Налог |
| Invoice | Счёт |
| Client | Клиент (никогда Заказчик) |
| Project | Проект |
| Hours | Часы |
| Billable | Оплачиваемые |
| Active | Активный |
| Paid | Оплачен |
| Overdue | Просрочено |
| Pending | В ожидании |
| Draft | Черновик |
| Sent | Отправлен |
| Growth | Рост |
| Average | Средний / Среднее / В среднем |
| Total | Всего / Итого |
| YTD | С начала года |
| Lifetime | За всё время |
| Churn | Отток |
| Retention | Удержание |
| LTV | LTV (Пожизненная ценность) |
| MRR | MRR (Регулярный месячный доход) |
| Forecast | Прогноз |
| Concentration | Концентрация |
| Burnout | Выгорание |
| Velocity | Скорость |
| Aging | По срокам просрочки |
| Funnel | Воронка |
| ROI | ROI (Окупаемость) |
| Heatmap | Тепловая карта |

### ICU plurals (RU one/few/many/other) — copy-paste templates

```json
"clients":   "{count, plural, one {# клиент} few {# клиента} many {# клиентов} other {# клиента}}",
"invoices":  "{count, plural, one {# счёт} few {# счёта} many {# счетов} other {# счёта}}",
"days":      "{count, plural, one {# день} few {# дня} many {# дней} other {# дня}}",
"months":    "{count, plural, one {# месяц} few {# месяца} many {# месяцев} other {# месяца}}",
"hours":     "{count, plural, one {# час} few {# часа} many {# часов} other {# часа}}",
"projects":  "{count, plural, one {# проект} few {# проекта} many {# проектов} other {# проекта}}",
"weeks":     "{count, plural, one {# неделя} few {# недели} many {# недель} other {# недели}}",
"years":     "{count, plural, one {# год} few {# года} many {# лет} other {# года}}",
"quarters":  "{count, plural, one {# квартал} few {# квартала} many {# кварталов} other {# квартала}}"
```

## Verification commands (used every checkpoint)

```bash
# Build verify
NODE_OPTIONS="--max-old-space-size=8192" npx next build 2>&1 | grep -iE "error TS|Failed|^✓|Compiled" | head -5
echo "exit=$?"

# Palette grep (returns 0 hits if clean — exit 1 from grep means clean)
grep -nE 'text-slate-|bg-slate-|border-slate-|hover:text-indigo|text-indigo-|bg-violet-200|bg-violet-100|bg-purple-200|bg-orange-100|bg-pink-100|bg-gray-900' \
  'src/app/(app)/analytics/MyWidget.tsx'

# Standard commit + rebase + push
git add messages/en.json messages/ru.json src/app/\(app\)/analytics/MyWidget.tsx
git commit -m "feat(analytics widgets): checkpoint N — N widgets"
git pull --rebase origin main
git push origin main
```

## Notes for next-session Claude

1. **Conversation continues from `11b87b0e` on main.** First action: `git fetch origin main && git pull` in `/Users/myoffice/lancerwise-agent2/` to sync local.

2. **JSON state:** `messages/en.json` + `messages/ru.json` already have `analyticsPage.widgets.*` with 24 widget groups. Append to that structure.

3. **Pacing realistic:** ~3-5 tool calls per widget, expect to do 20-30 widgets per conversation max before context exhaustion. Plan for **3-5 more sessions** to finish all 100 remaining.

4. **Quality > speed.** Don't run bulk regex transformations — every widget gets read + manually thoughtful translation + palette decisions.

5. **Always run `next build` before each commit.** Catches TypeScript errors from `(... as any)` removals or missing imports.

6. **After ALL widgets done:** Batch 6 = Playwright fullPage captures 1280×1024 RU + EN at /insights, push to `lancerwise-screenshots/audit/insights-widgets-full-2026-05-26/`.

## Out of scope (confirmed by Ramiz)

- `src/app/(app)/analytics/page.tsx` — already fixed in `841b8dbc`
- `src/app/(app)/analytics/layout.tsx`, `loading.tsx`
- Sub-route directories under `/analytics/` (cash-flow/, forecast/, productivity/, profitability/, kpi-dashboard/, burnout/, ~80 subdirs) — separate routes

## Honest pace assessment

The user's "10 минут" estimate for this task was unrealistic by ~50×. Even at "Path C manual quality" pace, this is genuinely a 6-10 hour task spread across **3-5 conversation sessions**. Each session can sustainably complete ~20-30 widgets before context budget exhausts the conversation.

This session delivered **24 widgets / 5 checkpoints / 5 production deploys** in approximately 1 conversation worth of context. Pre-launch quality preserved; no bulk regex tricks used.
