# /work/time — Code References

Specific files + lines suspected of contributing к the 95-call mount-time storm.

## Entry point

`src/app/(app)/work/time/page.tsx`:
```tsx
export { default } from '../../time-tracker/page'
```

Just a re-export. No logic. Real component lives in `time-tracker/`.

## Main component

`src/app/(app)/time-tracker/page.tsx` (1,100 LOC, `'use client'`):

| Line | Code | Notes |
|---|---|---|
| 1 | `'use client'` | Client component — все widgets render client-side |
| 3-111 | 109 imports | Of which 102 are local widget files |
| 113 | `export default function TimeTrackerPage()` | Single top-level component |
| 205-211 | `setInterval(() => setElapsed(...), 1000)` | Local-state timer only. **Does NOT fetch.** |
| 256 | `setTimeout(() => setRoundingNotice(null), 5000)` | UI notice clear. Local only. |

The main page itself doesn't fetch heavily на mount — it imports widgets, и each widget fetches its own.

## Widget files contributing к the storm

86 of 101 files в `src/app/(app)/time-tracker/*.tsx` have the pattern. Cataloguing all 86 would be exhaustive; here's a representative sample showing the shape:

### Profile-fetching widgets (most likely to duplicate)

These all fetch from `profiles` table on mount. Many overlap on which columns they want, which means **many widgets re-fetch the same row** independently:

| File | Columns requested |
|---|---|
| `BillableGoal.tsx:17` | `tt_billable_goal_secs` |
| `WeeklyGoalChart.tsx:20` | `tt_work_schedule` |
| `ProductivityScore.tsx:16` | `tt_work_schedule` (same as above) |
| `DailyGoal.tsx:18` | `tt_daily_goal_hours` |
| `LiveEarningsCounter.tsx:33` | `hourly_rate, default_currency` |
| `WorkSchedule.tsx` | `tt_work_schedule` (likely same as above × 2) |
| ... est. 30-40 more profile fetches | various tt_* columns |

**Optimization opportunity:** single query selecting все `tt_*` columns + `hourly_rate` etc. would replace 30+ individual queries.

### Time-entries-fetching widgets

These query `time_entries` table on mount с various filters (date range, billable flag, project_id):

| File | Filter |
|---|---|
| `BillableReport.tsx:10` | useEffect with date range |
| `TimeByHourOfDay.tsx:18` | useEffect, day-of-week aggregation |
| `WeeklyTimeSummary.tsx` | last 7 days |
| `DailyProductivityLog.tsx` | today's entries |
| `MonthlyTimeReport.tsx` | current month |
| `CumulativeHoursChart.tsx` | year-to-date |
| ... est. 20-30 more |

**Optimization opportunity:** server-side `Promise.all([...])` of one broad `time_entries` query (all entries last 90 days) + various aggregations performed client-side from the shared data.

### Project-fetching widgets

Smaller cluster, mostly the project picker dropdown + `LiveEarningsCounter.tsx`'s project-specific rate lookup:

| File | Pattern |
|---|---|
| `LiveEarningsCounter.tsx:24` | `supabase.from('projects').select('hourly_rate, currency').eq('id', projectId)` |
| `RecentProjectActivity.tsx` | recent projects list |
| `ProjectTimeBudget.tsx` | budget by project |

### AI-endpoint-fetching widgets

These call internal `/api/ai/*` routes, не Supabase REST directly. They don't show up в `supabaseRestCount` but DO show in `requestCount`:

| File | Endpoint |
|---|---|
| `DailySummary.tsx:27` | `/api/ai/daily-summary` |
| `TimeEntrySentiment.tsx` | `/api/ai/sentiment` (estimated) |
| `WorkPatternInsights.tsx` | `/api/ai/work-pattern` (estimated) |

These would not be counted in the 95 supabase REST figure (those go through `/lib/ai/` budget-gated server route).

## Setinterval / setTimeout audit

Full list of `setInterval`/`setTimeout` calls across `time-tracker/`:

```
src/app/(app)/time-tracker/FocusSessionsWidget.tsx
src/app/(app)/time-tracker/DescriptionHint.tsx
src/app/(app)/time-tracker/EmailReportButton.tsx
src/app/(app)/time-tracker/SubmitForApprovalButton.tsx
src/app/(app)/time-tracker/PomodoroWidget.tsx
src/app/(app)/time-tracker/PomodoroTimer.tsx
src/app/(app)/time-tracker/QuickTemplates.tsx
src/app/(app)/time-tracker/WeeklySummaryEmail.tsx
src/app/(app)/time-tracker/TagSuggestions.tsx
src/app/(app)/time-tracker/BulkActionBar.tsx
src/app/(app)/time-tracker/SessionNotes.tsx
src/app/(app)/time-tracker/page.tsx
src/app/(app)/time-tracker/DailyProductivityLog.tsx
src/app/(app)/time-tracker/focus/page.tsx
```

Spot-check showed `page.tsx:205` is the elapsed-time interval (local state only) и `page.tsx:256` is a 5-second UI notice clear. The other files would need individual inspection, but at a glance their setInterval calls appear к be UI-only (debounce on text input, hint reveal timing, etc.), not data polling.

## React hydration error context

`Minified React error #418` — "Text content does not match server-rendered HTML."

Likely sources (any widget rendering locale-dependent text directly inside JSX):
- Date formatting (`Date.toLocaleString()`, `new Intl.DateTimeFormat()`)
- Currency formatting (`Intl.NumberFormat`)
- Relative time strings (`formatDateRelative` from `@/lib/utils`)

The widget files DailySummaryBar, DailyTimeBreakdown, BillableTimeCalendar are heavy on date/time formatting — any of those are candidates. Confirmation requires reproducing locally with `next dev` (development build shows full error message + component stack).

## Related

- INVESTIGATION-REPORT.md — root cause analysis
- HYPOTHESIS-RANKING.md — competing hypotheses considered
- RECOMMENDED-FIX-SCOPE.md — proposed fix approach
