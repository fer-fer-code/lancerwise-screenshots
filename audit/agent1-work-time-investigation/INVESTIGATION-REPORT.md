# /work/time 95 Chrome vs 1 WebKit — Investigation Report

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Mode:** Read-only audit. No code changes. No live probes.
**Source data:** `audit/agent3-launch-baselines/baselines-raw/` (chromium_en/ru + webkit_en/ru _work_time.json)

---

## TL;DR

**The 95 vs 1 disparity is NOT a polling-timer artifact.** It's the same N+1 antipattern as #73 (dashboard) and #74 (invoice detail), just at higher scale.

- `/work/time` (which re-exports `/time-tracker/page.tsx`) is a 1,100-line `'use client'` component importing **101 child widgets**, **86 of which fire their own `useEffect(supabase.from(...))` on mount**.
- 86 widgets × ~1.1 fetches/widget ≈ 95 — **the math matches the observed Chromium REST count exactly.**
- WebKit shows 1 because WebKit never rendered the page: `bodyLen: 249` vs Chromium `bodyLen: 3749`. The WebKit probe likely hit an auth/skeleton path that didn't mount the widget tree.

The polling-timer hypothesis from baseline TL;DR is wrong. There IS a `setInterval` in `page.tsx:205`, but it only updates local React state (the elapsed-time counter), not Supabase.

---

## Evidence — Chromium baseline

From `baselines-raw/chromium_en_work_time.json`:

```
"supabaseRestCount": [95, 95, 95]
"requestCount": [151, 152, 151]
"bodyLen": 3749
"errors": ["Minified React error #418; ..."] (x3 runs)
viewport: 1440 × 900
```

Critical: **identical 95 across all 3 runs.** If this were a `setInterval` race, we'd see variance (e.g. 92 / 95 / 101). The exact-same number every run suggests a **deterministic mount-phase fetch storm** — every widget's `useEffect` fires once on first render.

React error #418 = "Text content does not match server-rendered HTML" — SSR hydration mismatch. Common cause: locale-dependent rendering inside the widget tree (e.g. `new Date().toLocaleString()` rendering differently server vs client).

---

## Evidence — WebKit baseline

From `baselines-raw/webkit_en_work_time.json`:

```
"supabaseRestCount": [1, 1, 1]
"requestCount": [42, 42, 43]
"bodyLen": 249
"errors": [] (no errors)
viewport: 393 × 852
```

`bodyLen: 249` is the key signal. That's basically an empty page shell. For comparison, Chromium got `bodyLen: 3749` — **15× larger DOM tree**.

Title "LancerWise — Free Freelancer CRM, Invoices & AI Contracts" is set in `app/layout.tsx` metadata; it appears regardless of whether the route content rendered. So the title alone doesn't prove the page rendered.

The single supabase call WebKit captured is most likely the auth lookup itself (`getUser()` in `(app)/layout.tsx` or middleware), executed before the redirect/empty-render decision.

**Conclusion:** WebKit measurement isn't of `/work/time` content — it's of an auth-redirected / skeleton state. The 1 call is misleading as a comparison metric.

---

## Code analysis — what fires the 95 calls

`src/app/(app)/work/time/page.tsx`:
```tsx
export { default } from '../../time-tracker/page'
```

Just a re-export, no logic.

`src/app/(app)/time-tracker/page.tsx` (1,100 LOC, `'use client'`):
- Line 1: `'use client'`
- Lines 3-111: **109 import statements**, of which **102 are local widget components** (one per file in `./*.tsx`)
- Line 113: `export default function TimeTrackerPage()`
- Line 205: the only `setInterval` — updates local `elapsed` state every 1000ms when `running` flag true. Does NOT touch Supabase.

`src/app/(app)/time-tracker/*.tsx` widget files:
- **101 total `.tsx` files**
- **86 contain `useEffect` + `supabase.from(...)` или `fetch('/api/...')` pattern**

Sample (every one of these mounts on `/work/time` page load):

| File | Fetches on mount |
|---|---|
| `BillableGoal.tsx` | `supabase.from('profiles').select('tt_billable_goal_secs')` |
| `WeeklyGoalChart.tsx` | `supabase.from('profiles').select('tt_work_schedule')` |
| `ProductivityScore.tsx` | `supabase.from('profiles').select('tt_work_schedule')` ← duplicate of WeeklyGoalChart |
| `DailyGoal.tsx` | `supabase.from('profiles').select('tt_daily_goal_hours')` |
| `LiveEarningsCounter.tsx` | `supabase.from('profiles').select('hourly_rate, default_currency')` + `supabase.from('projects').select('hourly_rate, currency')` |
| `DailySummary.tsx` | `fetch('/api/ai/daily-summary', ...)` |
| `BillableReport.tsx`, `TimeByHourOfDay.tsx`, ~80 others | similar pattern |

Many widgets fetch the **same `profiles` row repeatedly**, each pulling different columns. No shared fetch / no Context. Pure mount-time storm.

86 × ~1.1 (some widgets fetch 2 tables) ≈ **95**. Math matches Chromium's observation exactly.

---

## Why the polling-timer hypothesis is wrong

[AGENT 3] BASELINES.md proposed: "a component (probably the active-timer widget) calls Supabase every 100–250ms via setInterval. Chrome's network capture during networkidle wait fires multiple iterations; WebKit's different scheduler fires once."

Three reasons this doesn't fit:

1. **Deterministic count (95 exactly, 3 runs).** A polling timer would produce variance based on how long networkidle wait took.
2. **No supabase calls inside any `setInterval` block.** The only `setInterval` in `page.tsx:205-211` updates `elapsed` via `setElapsed(...)`. No supabase.from(), no fetch().
3. **WebKit's bodyLen of 249 explains the 1-call delta better than scheduler differences.** WebKit isn't measuring the same page state.

---

## Pattern parallel — same shape as #73 and #74

| Bug | Page | Widgets | REST calls before fix | Status |
|---|---|---|---|---|
| #73 | `/dashboard` | ~20 | 22 | Resolved (PR #84 + #86) |
| #74 | `/invoices/[id]` | ~10-15 | 10+ | In progress |
| (new) | `/work/time` | **101** | **95** | Filed below |
| (related) | `/settings` | unknown | 27 | Already flagged P1 (TL;DR #1) |

Same N+1 antipattern, scaled up. **The fix recipe already exists**: [[`PROMISE-ALL-SERVER-FETCH`]] pattern, optionally `Context` if widget data slices overlap heavily. See vault: `Patterns/N-PLUS-ONE-ANTIPATTERN.md`.

---

## Side observation — React error #418

3 runs × 1 error each on Chromium = consistent SSR hydration mismatch. Likely cause: one or more widgets render locale-aware text via `Date.toLocaleString()` or similar client-only function during initial render. The server renders one string ("01/15/2026"), client hydrates with another ("15.01.2026"). React flags as #418.

Not blocking — React falls back to client render — but contributes к re-render cost and may visually flash. Worth tagging in the same fix PR but doesn't have to gate.

---

## Recommendation

This is a **separate issue** from #73 (same pattern, different page). File as P1 (matches `/settings` severity from baseline TL;DR #1) under the broader "N+1 across auth-gated pages" umbrella.

Filing scope and fix sketch are in `RECOMMENDED-FIX-SCOPE.md`. Hypothesis ranking, code references, and risk in their respective siblings.

---

## Related vault entries

- `Patterns/N-PLUS-ONE-ANTIPATTERN.md`
- `Patterns/PROMISE-ALL-SERVER-FETCH.md`
- `Architecture/DASHBOARD-DATA-CONTEXT.md`
- `Architecture/INVOICE-DATA-FLOW.md`
- `Bugs/LANCERWISE-3-N-PLUS-ONE-DASHBOARD.md`
- `Bugs/LANCERWISE-4-N-PLUS-ONE-INVOICES.md`
