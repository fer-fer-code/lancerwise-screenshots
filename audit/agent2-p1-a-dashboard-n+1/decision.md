# P1-A /dashboard N+1 — approach decision

**Date:** 2026-05-19
**Issue:** [#73](https://github.com/fer-fer-code/lancerwise/issues/73)
**Sentry:** [LANCERWISE-3](https://lancerwise.sentry.io/issues/7483022747/)

## Chosen approach: Option A (extended aggregator + Context)

Per issue recommendation. Lowest disruption к UX, highest impact на metrics.

### Architecture

```
SuperDashboardClient (top-level page client)
  ├── fetch('/api/dashboard/super')  ← 1 HTTP request, ALL data
  └── <DashboardDataContext.Provider value={data}>
       ├── UpcomingInvoicesDue        ← reads ctx.upcoming_invoices
       ├── OverduePulse               ← reads ctx.overdue_invoices_list
       ├── AgingAlertWidget           ← reads ctx.aging_buckets
       ├── UnbilledTimeAlert          ← reads ctx.recent_time_entries
       ├── WeeklyIncomeSnapshot       ← reads ctx.weekly_revenue
       ├── ... 24 more widgets, all consuming context
```

### Why not Option B (Server Components)

* 29 widgets → 12-16h к refactor each `'use client'` к server component
* Many widgets have interactive state (timer running, mood picker, etc.) — can't be server components
* Higher regression risk

### Why not "Quick wins only"

Issue notes quick wins drop trace ~30% but don't fix LCP/CLS. Acceptance criteria require LCP < 2.5s + CLS < 0.1, both achievable only with full N+1 elimination.

## Phased implementation

**Phase 3a — Extend `/api/dashboard/super`** (~1h)

Add these slices к the existing aggregator:
* `upcoming_invoices`: `[{ id, total, currency, due_date, status, client_name }]` (next 14 days, status sent/viewed)
* `overdue_invoices_list`: `[{ id, total, currency, due_date, days_overdue, client_name }]` (status sent, due_date < today)
* `aging_buckets`: `{ b0_30: N, b31_60: N, b61_90: N, b90_plus: N }`
* `recent_time_entries`: `[{ id, project_id, duration, start_time }]` (last 7 days)
* `unbilled_minutes`: number (sum of time_entries without invoice_id, status logged)
* `weekly_revenue`: `{ this_week, last_week, change_pct }`
* `monthly_burndown`: `{ days_in_month, days_elapsed, current_revenue, projected, target }`
* `goals`: `{ monthly_target_amount, achieved_amount, percent }`
* `streak_days`: number
* `client_health_grid`: `[{ client_id, name, last_contact_days, health_score }]` (active clients)
* `client_inactive`: count
* `diversification`: `[{ client_name, revenue, percent }]` (top 5 by revenue)
* `proposals`: `{ sent_count, won_count, win_rate }`
* `churn_risk`: `[{ client_id, name, risk_score }]` (top 5 at risk)
* `hourly_earnings`: `{ this_month_avg, prev_avg }`
* `cash_flow`: `{ inflow_30d, outflow_30d, net }`

**Phase 3b — Create DashboardDataContext** (~30 min)

`src/app/(app)/dashboard/DashboardDataContext.tsx`:
```ts
'use client'
import { createContext, useContext } from 'react'

export const DashboardDataContext = createContext<DashboardData | null>(null)
export function useDashboardData() {
  const data = useContext(DashboardDataContext)
  return data
}
```

Wire в SuperDashboardClient.tsx after `fetch` resolves.

**Phase 3c — Refactor widgets** (~3-4h)

For each of the 29 widgets:
* Remove `useEffect` + `supabase.from(...)` block
* Read data from `useDashboardData()` instead
* Keep ALL existing UI rendering (no visual change)
* Some widgets may have stale-data refresh logic (e.g., mark-follow-up-done) — preserve via lifted-state callbacks

Order of priority (impact-weighted):
1. UpcomingInvoicesDue, OverduePulse, AgingAlertWidget — invoice-heavy, 3 fetches eliminated
2. UnbilledTimeAlert, RecentTimeEntries, WeeklyIncomeSnapshot — time_entries fetches
3. ChurnRisk, ClientHealthGrid, ClientInactiveAlert — client fetches
4. Remaining 20 widgets

**Phase 3d — Quick wins along the way**

* Dedup the 2nd `getUser()` call (move auth check к SuperDashboardClient, pass user to widgets via context)
* Verify no client-side prefetch к /notifications, /settings, /leads (likely from `<Link prefetch>` — review)

## Acceptance check plan

* Local: Chrome DevTools Network tab on `/dashboard`, count Supabase REST requests = target ≤3
* Lighthouse local: LCP < 2.5s, CLS < 0.1
* Preview deploy Lighthouse: same targets
* Production: Sentry [LANCERWISE-3] no new events for 24h

## Risk

* 29-widget refactor is large surface. Each widget needs:
  - Type compatibility check (slice schema vs widget's expected shape)
  - Loading state handling (when context is null/loading)
  - Empty state preservation
* Tsc baseline (385) must hold
* Visual regression should pass (no UI changes intended)

## Time budget

* Phase 3a aggregator: 1h
* Phase 3b context: 30 min
* Phase 3c widget refactor: 3-4h
* Phase 4 verify: 1h
* Total: ~6h (within issue's 4-8h estimate)

## Decision sign-off

Going с Option A. Will commit after Phase 3a (extended aggregator) lands cleanly, then Phase 3b context, then incremental widget refactors.
