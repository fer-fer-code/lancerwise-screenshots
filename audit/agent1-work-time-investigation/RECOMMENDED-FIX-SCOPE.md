# /work/time — Recommended Fix Scope

**Mode:** Proposed only. Не implemented. Awaiting Ramiz decision.

## Recipe

Apply the proven [[PROMISE-ALL-SERVER-FETCH]] + Context pattern that already worked for #73 (dashboard). The page is too large для prop drilling (101 widgets); Context is the right shape.

## Shape

### 1. Convert page.tsx к server-async + Context provider

`src/app/(app)/work/time/page.tsx`:
```tsx
// Currently:
export { default } from '../../time-tracker/page'

// After:
import { createClient } from '@/lib/supabase/server'
import { TimeTrackerDataProvider } from '@/app/(app)/time-tracker/TimeTrackerDataProvider'
import TimeTrackerClient from '@/app/(app)/time-tracker/TimeTrackerClient'

export default async function WorkTimePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const data = await getTimeTrackerData(user.id)
  return (
    <TimeTrackerDataProvider initialData={data}>
      <TimeTrackerClient />
    </TimeTrackerDataProvider>
  )
}
```

### 2. Batch fetch в `getTimeTrackerData`

`src/app/(app)/time-tracker/getTimeTrackerData.ts`:
```ts
export async function getTimeTrackerData(userId: string) {
  const supabase = await createClient()

  // Single batched query — captures everything the 86 widgets need
  const [
    { data: profile },        // tt_* columns, hourly_rate, default_currency
    { data: projects },       // projects user has access к
    { data: timeEntries },    // last 90 days
    { data: clients },        // names + status
    { data: tags },           // user's tag library
  ] = await Promise.all([
    supabase.from('profiles')
      .select('tt_billable_goal_secs, tt_work_schedule, tt_daily_goal_hours, hourly_rate, default_currency, ...всё tt_* + currency')
      .eq('id', userId).maybeSingle(),
    supabase.from('projects')
      .select('id, title, hourly_rate, currency, status').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('start_time', threeMontheAgo)
      .order('start_time', { ascending: false }),
    supabase.from('clients').select('id, name, status').eq('user_id', userId),
    supabase.from('time_tags').select('tag').eq('user_id', userId),
  ])

  return { profile, projects, timeEntries, clients, tags }
}
```

### 3. Refactor TimeTrackerClient.tsx ('use client')

Move all 101 widgets к consume `useTimeTrackerData()` Context hook instead of их individual fetches:

```tsx
// Old widget (BillableGoal.tsx)
const [goal, setGoal] = useState<number | null>(null)
useEffect(() => {
  supabase.from('profiles').select('tt_billable_goal_secs').then(...)
}, [])

// New widget
const { profile } = useTimeTrackerData()
const goal = profile?.tt_billable_goal_secs ?? null
```

86 widgets × identical refactor pattern. Mostly mechanical — `useState` + `useEffect(fetch)` → `useTimeTrackerData()` selector.

### 4. Keep live-data widgets (timer, earnings counter) с local state

Some widgets really do need client-side state (the elapsed timer, live earnings tick). Those keep their `useState` + `setInterval` for client display, но pull *initial* values + rate из Context, не a fresh fetch.

## Effort estimate

| Step | Effort |
|---|---|
| Server `page.tsx` rewrite + `getTimeTrackerData` | ~1h |
| `TimeTrackerDataProvider` + types | ~30min |
| Refactor 86 widgets (mechanical) | ~3-4h |
| Verify React error #418 source + fix any locale formatting issue | ~30-60min |
| Probe + verify (Chrome + WebKit) | ~30min |
| **Total** | **~6-8h focused work** |

Compares к dashboard #73:
- Dashboard was ~20 widgets, took ~2 PRs across multiple days
- /work/time is 4-5× larger but same pattern, so multiplier holds: ~6-8h for one engineer focused

## Scoping decisions

### Single PR vs phased?

**Single PR.** Same reasoning as [[../Decisions/2026-05-19-P1-B-SCOPE-EXPANSION]]: hybrid intermediate state would be confusing (some widgets on Context, some on direct fetch). Mechanical refactor scales well in single PR.

### Include React error #418 fix?

**Yes.** Hydration mismatch hurts perception too. Best к find и fix the offending locale-render in the same PR — likely 1-2 widget files.

### Address `/settings` 27-call storm simultaneously?

**No — separate PR.** Different page, different state-shape. Combining would double the diff и double review burden.

### Add iOS Safari crash regression test?

**Yes, ideally.** Playwright WebKit run that actually authenticates (vs. the baseline's auth-skeleton skip) и asserts page renders without throwing. Bug #74 work cluster should establish that infra; reuse here.

## Acceptance criteria

- [ ] `/work/time` (via re-export к `/time-tracker`) shows **<10 supabaseRestCount** in baseline re-probe (Chromium desktop)
- [ ] WebKit baseline shows non-empty bodyLen (>2000 chars) — i.e., page actually renders
- [ ] No React error #418 in baseline runs
- [ ] FCP < 4s warmest, < 6s cold (relax from 2.5s target given page complexity)
- [ ] LCP < 4s warmest
- [ ] iOS Safari renders без crash (manual real-device test)
- [ ] All 101 widgets visually unchanged (no regression в what shown)

## Filing recommendation

File as new GitHub issue:

```
Title: P1: /work/time 95-call N+1 storm — same pattern as #73 + #74, much larger scale
Labels: P1, performance, post-launch
Body: link к INVESTIGATION-REPORT.md
```

If `/settings` 27-call issue gets filed separately, link them as related (both are post-#73 N+1 sweeps).

## Related

- INVESTIGATION-REPORT.md — root cause analysis
- CODE-REFERENCES.md — specific files involved
- HYPOTHESIS-RANKING.md — why polling-timer hypothesis was wrong
- RISK-ASSESSMENT.md — launch blocker rationale
- Vault patterns: N-PLUS-ONE-ANTIPATTERN.md, PROMISE-ALL-SERVER-FETCH.md
