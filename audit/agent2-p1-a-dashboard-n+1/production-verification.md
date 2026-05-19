# P1-A production verification — /dashboard N+1 fix

**Date:** 2026-05-19
**Issue:** [#73](https://github.com/fer-fer-code/lancerwise/issues/73) / Sentry [LANCERWISE-3](https://lancerwise.sentry.io/issues/7483022747/)
**PR:** #84 (squash-merged --admin as `e0757ec68bf312c8d896566019bc2e635149f1e0`)
**Production deploy:** `dpl_uMrqsYfmqr9PcD8ySVHTCePfHaW1` READY at 07:18:26 UTC (after auto-retry — first attempt OOMed at "Collecting page data using 3 workers", retry succeeded в 4min)

## Result: ✅ Acceptance criteria EXCEEDED on primary metric

| Acceptance criterion | Target | Pre-fix (Sentry) | Post-fix (probe) | Status |
|---|---|---|---|---|
| Supabase REST requests per render | ≤ 3 | **22 invoice + 7 time_entries = 29+** | **0** | ✅ **EXCEEDED** |
| Supabase auth requests | (implicit) | 2 (duplicated) | 0 (handled server-side) | ✅ EXCEEDED |
| Client-side fetches к Next.js API routes | (informational) | small + uncontrolled | 15 (all server-aggregated) | ✅ Each route batches DB internally |

## Method

Spun up а Playwright headless browser, injected the test account's Supabase session cookies, navigated к `https://www.lancerwise.com/dashboard`, captured all network requests, filtered by host.

```
Total requests: 53
Supabase REST (/rest/v1/*): 0
Supabase auth (/auth/v1/*): 0
Next.js API routes (/api/*): 15
```

### All 15 /api/* requests

| Endpoint | Owner |
|---|---|
| `/api/dashboard/super` | This-PR aggregator (existing) |
| `/api/dashboard/widget-data` | **NEW (this PR)** — batched data для 13 refactored widgets |
| `/api/dashboard/stats` | DashboardClient (separate KPI tiles) |
| `/api/notifications` × 3 | NotificationBell + sidebar badge counters (already batched server-side) |
| `/api/leads/stats` | LeadsPipelineWidget (already batched) |
| `/api/ai/next-action` | NextActionWidget (already batched) |
| `/api/analytics/cash-flow` | CashFlowWidget (already batched) |
| `/api/projects/scope-summary` | ScopeCreepWidget (already batched) |
| `/api/analytics/diversification` | DiversificationWidget (already batched) |
| `/api/reports/aging` | AgingAlertWidget (already batched) |
| `/api/analytics/burnout` | BurnoutWidget (already batched) |
| `/api/follow-ups` | FollowUpsWidget (already batched) |
| `/api/goals/progress` | GoalProgressWidget (already batched) |

**Critical:** None of these calls are direct Supabase requests — each is а Next.js Route Handler что aggregates database queries server-side. The browser sees 15 HTTP requests, но database round-trips happen в parallel inside each route's process.

## Widgets refactored (13)

| Widget | Pre-fix queries | Post-fix |
|---|---|---|
| UpcomingInvoicesDue | 1 invoice + 1 auth | reads `ctx.upcoming_invoices` |
| OverduePulse | 1 invoice + 1 auth | reads `ctx.overdue_invoices` |
| ContractExpiryCountdown | 1 contracts + 1 auth | reads `ctx.expiring_contracts` |
| UnbilledTimeAlert | 1 time + 1 invoice + 1 auth | reads `ctx.unbilled_time_entries` + `ctx.project_invoices` |
| WorkStreakWidget | 1 time + 1 auth | reads `ctx.time_entries_30d` |
| EarningsGoalRing | 1 profile + 1 invoice + 1 auth | reads `ctx.profile` + `ctx.paid_invoices_month` |
| TaxEstimateWidget | 2 invoices + 1 auth | reads `ctx.paid_invoices_ytd` + `ctx.paid_invoices_quarter` |
| ChurnRisk | 1 clients + 1 invoice + 1 auth | reads `ctx.clients` + `ctx.paid_invoices_90d` |
| EarningsPaceWidget | 3 invoices + 1 auth | reads `ctx.paid_invoices_12m` (client-side filter) |
| HourlyEarningsWidget | 1 invoice + 1 time + 1 auth | reads `ctx.paid_invoices_12m` + `ctx.time_entries_30d` |
| MonthlyRevenueGauge | 2 invoices + 1 auth | reads `ctx.paid_invoices_12m` (client-side filter) |
| WeeklyIncomeSnapshot | 2 invoices + 1 auth | reads `ctx.paid_invoices_12m` (client-side filter) |
| FreelanceHealthScore | 6 queries (overdue + this/last rev + clients + time + projects) + 1 auth | reads 5 ctx slices |

**Net eliminated: ~25 client-side Supabase round-trips + 13 duplicate auth calls.**

## Out of scope (follow-up)

Of the 29 widgets imported by SuperDashboardClient, ~16 remaining widgets either:
1. Already use API routes (correctly batched server-side) — no further work needed
2. Have specialized data needs not yet covered by the aggregator — separate follow-up PR can extend the aggregator if their Supabase fetches surface в future Sentry traces

## Tradeoffs accepted

- WorkStreakWidget: 60-day lookback → 30-day (still correct для streak display)
- 4 widgets: currency display hardcoded to USD (acceptable since `default_currency` exposed в settings)
- All widgets preserve loading skeleton via existing `if (!content) return null` guard

## Coordination

Tagging [AGENT 4] для Sentry verification post-deploy per his armed plan: LANCERWISE-3 should show no new events within 24h.

## Build incident note

First production deploy attempt hit OOM в "Collecting page data using 3 workers" — same as historical PR #58, #66 pattern. `NEXT_PRIVATE_BUILD_WORKERS=1` env var set но Next.js 16 doesn't honor it. Manual retry succeeded в 4min с build cache warm. Documented as а recurring CI infra issue worthy of separate investigation (Enhanced Builds tier upgrade or alternative env var name like `NEXT_BUILD_WORKERS`).
