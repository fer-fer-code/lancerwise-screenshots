# /analytics widgets RU/EN i18n + palette — sessions 1+2 + AGENT 5 batch 3 handoff

**Date:** 2026-05-26
**Session 1 by:** Claude (Sonnet 4.5 via claude.ai)
**Session 2 by:** Claude (Opus 4.7 via Claude Code CLI)
**Session 3 by:** [AGENT 5] (Opus 4.7) — Batch 3 mid + Batch 4 start (alphabetical InvoiceVelocityScore → ProjectROIByClient, 24 widgets)

**Total status: 78+/124 widgets — [AGENT 2] 54 + [AGENT 5] 24 = 78 confirmed via own checkpoints. AGENT 1 also working in parallel; their commits land between checkpoints.**

**Last commit on main:**
- [AGENT 2] last: `3d73e090`
- [AGENT 5] last: `c230b43b` (batch 3 checkpoint 4 — ProjectCompletionRate → ProjectROIByClient)

## Sessions log

### Session 1 (24 widgets, 5 checkpoints)
- df408f29 — checkpoint 1 (widgets 1-8)
- 38ac2e11 → rebased — checkpoint 2 (widgets 9-12)
- d7ef60bd — checkpoint 3 (widgets 13-16)
- cc2f1cb2 — checkpoint 4 (widgets 17-20)
- 11b87b0e — checkpoint 5 (widgets 21-24)

### Session 2 (30 widgets, 7 checkpoints)
- 386fd123 — checkpoint 6 (widgets 25-32) [batch 1 finish: ClientPaymentRiskScore → CopyStatsButton]
- d296b194 — checkpoint 7 (widgets 33-36) [EffectiveRate, ExpenseTrend, ExpenseVsRevenueRatio, FreelancerBenchmark]
- 3a7dbea4 — checkpoint 8 (widgets 37-40) [FreelancerCard, FreelancerScorecard, FreelancerStats, HourlyIncomeCalendar]
- 87283394 — checkpoint 9 (widgets 41-44) [HourlyRateHistory, IncomeProjection, IncomeStabilityScore, InvoiceAgeingReport]
- d1d2f46c — checkpoint 10 (widgets 45-48) [InvoiceAgingTrend, InvoiceByDayOfMonth, InvoiceConversionFunnel, InvoiceFrequencyChart]
- 269bdde7 — checkpoint 11 (widgets 49-52) [InvoicePaymentGapTrend, InvoiceRecoveryRate, InvoiceSendToPayDelay, InvoiceSizeDistribution]
- 3d73e090 — checkpoint 12 (widgets 53-54) [InvoiceStatusFunnel, InvoiceValueTrend] **— batch 2 complete**

## Completed widgets by [AGENT 2] (54)

**Batch 1 (A-Co*):** AnnualGoal, AnnualIncomeBreakdown, AverageClientLifespan, AverageProjectSize, AverageResponseTime, AvgInvoiceByMonth, AvgInvoiceValueTrend, AvgPaymentTime, AvgProjectDuration, BestDayToInvoice, BillableRatioTrend, ClientAcquisitionTimeline, ClientActivityScore, ClientChurnPrediction, ClientChurnRisk, ClientGrowthChart, ClientInvoiceGap, ClientLifecycleStage, ClientLifetimeValue, ClientPaymentBehavior, ClientPaymentPattern, ClientPaymentScore, ClientRepeatRate, ClientRevenueGrowth, ClientPaymentRiskScore, ClientSegmentReport, ClientValuePerHour, ClientValueSegmentation, ConcentrationRisk, ContractRenewalForecast, ContractValueTracker, CopyStatsButton — 32 widgets ✓

**Batch 2 (E-Inv*):** EffectiveRate, ExpenseTrend, ExpenseVsRevenueRatio, FreelancerBenchmark, FreelancerCard, FreelancerScorecard, FreelancerStats, HourlyIncomeCalendar, HourlyRateHistory, IncomeProjection, IncomeStabilityScore, InvoiceAgeingReport, InvoiceAgingTrend, InvoiceByDayOfMonth, InvoiceConversionFunnel, InvoiceFrequencyChart, InvoicePaymentGapTrend, InvoiceRecoveryRate, InvoiceSendToPayDelay, InvoiceSizeDistribution, InvoiceStatusFunnel, InvoiceValueTrend — 22 widgets ✓

## Done by [AGENT 5] (Batch 3, 24 widgets, 4 checkpoints)

**Range:** InvoiceVelocityScore → ProjectROIByClient (alphabetical)

- `b2a49bfb` — CP1 (9 widgets): InvoiceVelocityScore, InvoiceWinRate, LargestInvoicesEver, LifetimeRevenueTimeline, LongestPayingClients, MonthlyClientAcquisition, MonthlyHoursHeatmap, MonthlyInvoiceVolume, MonthlyNewVsReturning
- `7e55adee` — CP2 (5 widgets): MonthlyRecurringRevenue, MonthlyUniqueClients, NetRevenueRetention, OverdueByClient, OverdueInvoiceImpact
- `52263251` — CP3 (5 widgets): PaymentSpeed, PeakHoursAnalysis, PeakRevenueMonth, ProfitCalculator, ProfitLoss
- `c230b43b` — CP4 (5 widgets): ProjectCompletionRate, ProjectDurationAnalysis, ProjectEstimateAccuracy, ProjectProfitabilityIndex, ProjectROIByClient

**Conflicts resolved during rebases:** 3× JSON merge conflicts in en.json/ru.json (interleaved namespace additions with AGENT 1 + AGENT 2 commits). Resolved by keeping both sides additive — never overwrite. Each conflict diff verified by `node JSON.parse` before `rebase --continue`.

**Build verification:** `next build` exit 0 on every checkpoint.

## Done by parallel agents (not exhaustive — check git log)
Per parallel-agent commits visible during rebases:
- QuarterlyReview → RevenueByClient (AGENT 1 batch 3 — checkpoints 2-3)
- Some S-T range (SourceBreakdown, TaxEstimate, TimeByDayOfWeek, TimeToFirstInvoice)
- Some T-W range (Time*, Top*, Y*)

JSON now contains **125+ widget groups** in `analyticsPage.widgets.*` (combined from all agents — confirmed merged successfully via rebase resolver).

## Realistically remaining

[AGENT 5]'s scope (Inv* → ProjectR*) = ✓ COMPLETE.

Still pending (per other agents' progress):
- **ProjectsByMonth, ProjectsPerClient, ProjectSuccessRate, ProposalConversionRate, QuarterlyGrowthRate** (AGENT 1 has these in their range — likely shipped)
- **RateSuggestion, RetentionRate** (R-start)
- **RevenueByDay, RevenueByDayOfMonth, RevenueByProjectType, RevenueByWeekOfMonth, RevenueCalendar, RevenueConcentrationHHI, RevenueConcentrationIndex, RevenueConcentrationRisk, RevenueForecastChart, RevenueGapMonths, RevenueGrowthRate, RevenueMomentum, RevenuePerHour, RevenuePerWorkingDay, RevenueSeasonality, RevenueVsExpenses, RevenueVsHoursTrend** (Rev*)
- **TimeVsRevenueScatter, TopClientsByHoursTracked, TopEarningClients, TopEarningMonths, TopProjectsROI, TopRevenueMonths, TopRevenueWeeks, WeeklyRevenueVariance, WorkHoursChart, YearEndReview, YearOverYearComparison, YearToDateSummary, YearlyGrowthSummary** (T-Z, AGENT 4 likely picking up)

**Verify which are done:** Run `grep -l 'useTranslations' src/app/\(app\)/analytics/*.tsx | wc -l` and cross-reference against `messages/en.json` `analyticsPage.widgets.*` keys.

## Components outside `/analytics/` folder (batch 5)

Still untouched per session 2 scope:
- `src/components/analytics/WorkHeatmap.tsx`
- `src/components/WorkHoursHeatmap.tsx`

## Established patterns (next-session reference)

### i18n namespace structure

All widget keys under `analyticsPage.widgets.{widgetCamelCase}` in `messages/en.json` + `messages/ru.json`.

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
+   }, [t, locale])
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
| `bg-slate-900` `bg-slate-950` | `bg-canvas` or `bg-elevated` |
| `border-slate-700` `border-slate-800` `border-slate-600` | `border-subtle` |
| `bg-violet-100` `bg-violet-200` `bg-violet-300` (decorative) | `bg-violet-700/30` |
| `bg-purple-100/200` (decorative) | `bg-purple-700/30` |
| `bg-blue-*` (decorative chart accent) | `bg-violet-*` (matches brand) |
| `bg-sky-*` `bg-cyan-*` (decorative) | `bg-violet-700/30` or `bg-elevated` |
| `bg-orange-100` `bg-pink-100` | `bg-orange-700/30` `bg-pink-700/30` |
| `text-indigo-200/300` | `text-violet-200/300` |
| `bg-teal-50` (light pastel drift) | `bg-teal-900/20` |
| `bg-slate-300` (very light text-muted drift) | `bg-text-muted` |

**Preserved (semantic):** `bg-violet-600/500/400`, `bg-violet-900/20`, `border-violet-800/40` (brand) · `bg-red-950/30`, `text-red-400`, `bg-rose-*` (error) · `bg-amber-*`, `text-amber-400`, `text-orange-400` (warning/weekends) · `bg-emerald-*`, `text-emerald-*`, `bg-green-*` (success) · `bg-teal-400` (category indicator).

### Common patterns

- **`'Unknown'` fallback** → `t('unknown')`
- **`(inv as any).clients`** → `(inv as { clients?: { name?: string } }).clients`
- **`{value}d` suffix** → `t('daysShort', { days })`
- **`{count} item{s}`** → ICU plural in i18n
- **toLocaleString('en', ...)** → `toLocaleString(monthLocale)` via `useLocale()`
- **`useEffect` deps** → `[t]` or `[t, locale]`

### Russian terminology (consistent)

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
| Average | Средний / Среднее / В среднем |
| YTD | С начала года |
| Lifetime | За всё время |
| Churn | Отток |
| Retention | Удержание |
| LTV | LTV (Пожизненная ценность) |
| Forecast | Прогноз |
| Concentration | Концентрация |
| Aging | По срокам просрочки |
| Funnel | Воронка |
| ROI | ROI (Окупаемость) |

### ICU plurals templates

```json
"clients":  "{count, plural, one {# клиент} few {# клиента} many {# клиентов} other {# клиента}}",
"invoices": "{count, plural, one {# счёт} few {# счёта} many {# счетов} other {# счёта}}",
"days":     "{count, plural, one {# день} few {# дня} many {# дней} other {# дня}}",
"months":   "{count, plural, one {# месяц} few {# месяца} many {# месяцев} other {# месяца}}",
"hours":    "{count, plural, one {# час} few {# часа} many {# часов} other {# часа}}",
"projects": "{count, plural, one {# проект} few {# проекта} many {# проектов} other {# проекта}}"
```

## JSON conflict resolution pattern (heavy parallel-agent use)

Each session-2 checkpoint hit JSON conflicts in messages/en.json + ru.json because 4 agents pushing concurrently. The resolver pattern that works:

```python
# /tmp/merge-conflict-N.py — re-usable per checkpoint
import json, subprocess
from collections import OrderedDict

en_my = { "widget1": {...}, "widget2": {...}, ... }  # only this agent's new widgets
ru_my = { ... }

for path, my_widgets in [(en_path, en_my), (ru_path, ru_my)]:
    rev = subprocess.check_output(['git', '-C', repo, 'show', f'HEAD:{rel_path}']).decode('utf-8')
    data = json.loads(rev, object_pairs_hook=OrderedDict)  # other agents' state
    for k, v in my_widgets.items():
        data['analyticsPage']['widgets'][k] = v  # add mine on top
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')

# Then: git add + git rebase --continue + git push
```

## Verification commands

```bash
# Build verify
NODE_OPTIONS="--max-old-space-size=8192" npx next build 2>&1 | grep -iE "error TS|Failed|^✓|Compiled" | head -5

# Palette grep
grep -nE 'text-slate-|bg-slate-|border-slate-|hover:text-indigo|text-indigo-|bg-violet-200|bg-violet-100|bg-purple-200|bg-orange-100|bg-pink-100|bg-gray-900' \
  'src/app/(app)/analytics/MyWidget.tsx'

# Sync + commit + rebase + push (handles parallel agent conflicts)
git fetch origin main
git add messages/en.json messages/ru.json src/app/\(app\)/analytics/MyWidget.tsx
git commit -m "feat(analytics widgets): checkpoint N — N widgets"
git pull --rebase origin main
# If conflict in messages/*.json → use python merge resolver above
git push origin main
```

## Notes for next-session Claude

1. **Conversation continues from `3d73e090` (or wherever main is when next session starts).** First action: `cd /Users/myoffice/lancerwise-agent2 && git fetch origin main && git pull --ff-only` to sync.

2. **Pacing realistic:** ~3-5 tool calls per widget, expect 20-30 widgets per conversation max. **3-4 more sessions needed to finish all 124.**

3. **JSON state:** Heavy parallel-agent activity. ALWAYS use the merge-resolver pattern when rebasing, NOT manual conflict resolution.

4. **Quality > speed.** Don't run bulk regex transformations.

5. **Always run `next build` before commit.** Catches TS errors from `as any` removals or missing imports.

6. **After ALL widgets done:** Batch 5 (`WorkHeatmap` + `WorkHoursHeatmap` in `src/components/`) + Batch 6 (Playwright captures + final RESULT.md).

## Out of scope (confirmed preserved)

- `src/app/(app)/analytics/page.tsx` — already fixed in `841b8dbc`
- `src/app/(app)/analytics/layout.tsx`, `loading.tsx`
- ~80 sub-route directories under `/analytics/`

## Honest pace summary

Sessions 1+2 combined: **54 widgets / 12 checkpoints / 12 production deploys** by [AGENT 2] in ~2 conversation sessions worth of context. Parallel agents (1, 4, 5, 6) shipped additional ~47 widgets. **Total combined progress: ~101 widget namespaces in JSON, but TSX files for many of those still need wiring by the original-owner agent.**

Realistic finish: **~2 more conversation sessions** for [AGENT 2] to clear remaining 30-40 unclaimed widgets (mostly P-Z range), then batch 5 (2 widgets outside folder) + batch 6 (Playwright verify).
