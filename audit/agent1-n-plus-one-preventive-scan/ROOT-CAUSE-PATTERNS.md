# Root Cause Patterns Observed

Categorising the N+1 incidents seen across (app) routes. Goal: identify whether это one pattern, multiple patterns, or some routes need different fixes.

## Pattern A — Mount-time fetch storm (canonical N+1)

**Signature:**
- Page is `'use client'` с many widget components imported
- Each widget has `useEffect(() => { supabase.from(X).select(...).then(setState) }, [])` on mount
- Result: N widgets × ~1 fetch each = N fetches на page load

**Observed instances:**

| Route | Widgets с pattern | Sample fetches |
|---|---|---|
| `/work/time` | 86 of 101 | profiles, time_entries, projects (many overlap) |
| `/settings` | 41 of 56 | profiles.* (different columns per widget) |
| `/clients/[id]` (latent) | 37 of 64 | clients, invoices, projects related rows |
| `/invoices/[id]` (active #74) | 16 of 43 | invoice_payments, reminders, activity, disputes |

**Cost drivers:**
1. **Many widgets** — page authoring habit drifted к "one component per metric/section"
2. **No shared data layer** — each widget fetches its own slice
3. **Duplicate fetches** — multiple widgets often want different columns from the same row (e.g. `profiles.tt_*` columns), each fetched independently

**Established fix recipes:**
- [`PROMISE-ALL-SERVER-FETCH`](../../lancerwise-knowledge/Patterns/PROMISE-ALL-SERVER-FETCH.md) — server-side batched fetch + props
- [`DASHBOARD-DATA-CONTEXT`](../../lancerwise-knowledge/Architecture/DASHBOARD-DATA-CONTEXT.md) — Context provider when widget count > 10

Already applied successfully для `/dashboard` (Issue #73, PRs #84 + #86, 22 calls → 0).

## Pattern B — Polling timer (hypothesised, NOT observed)

**Signature:** `setInterval` calling Supabase, accumulating calls during networkidle wait.

**Status:** [AGENT 3] proposed this for `/work/time` 95-call disparity. Code reading rejected it:
- Deterministic 95 across 3 runs (timer race would vary)
- Only `setInterval` в codebase updates local state, не Supabase
- WebKit's 1-call difference better explained by page-state difference (bodyLen 249)

Не a real pattern in this codebase. Documented as rejected hypothesis в [`../agent1-work-time-investigation/HYPOTHESIS-RANKING.md`](../agent1-work-time-investigation/HYPOTHESIS-RANKING.md).

## Pattern C — Sequential dependency chain (NOT observed)

**Signature:** Widget A fetches data, then widget B (или same widget's child effect) fetches based on A's result, then C based on B, etc. Cascade waterfall.

**Status:** Not seen in baseline data — patterns are mostly parallel concurrent fetches, не chained. The mount-time storm fires all 86 fetches at roughly the same moment.

(This pattern is more typical of REST-style API design where each call is a foreign-key resolution. Supabase queries can include joins via `.select('*, related_table(...)')` which avoids this entirely. The codebase mostly uses single-table queries без join syntax — но not chained either.)

## Pattern D — Real-time subscription bug (NOT observed)

**Signature:** `supabase.channel('...').on('postgres_changes', ...).subscribe()` reconnect loop or filter mismatch firing repeated REST polls.

**Status:** No `.channel()` или `.subscribe()` calls в audited routes. Supabase Realtime uses WebSocket, не REST — wouldn't show up в `supabaseRestCount` filter anyway. Not relevant к baseline findings.

## Pattern E — SSR hydration mismatch с client re-fetch (rare)

**Signature:** Server renders с initial data, hydration error fires (React #418), client re-mounts and fetches fresh.

**Observed indirectly:** `/work/time` baseline shows 3 React error #418 captures across 3 runs. The hydration mismatch is real, but the 95 calls are mostly accounted for by Pattern A directly — не by post-hydration re-mounts. The #418 error contributes to FCP cost but не к the call count.

Fix orthogonal: find locale-dependent rendering inside one of the widgets (`new Date().toLocaleString()` etc.) and stabilise.

## Summary

**Pattern A is the only N+1 antipattern actively occurring в (app) routes.** Patterns B/C/D not observed; Pattern E adjacent but не causal к the call counts.

This is good news: **one pattern → one fix recipe → predictable migration cost.** The four observed instances (`/work/time`, `/settings`, `/clients/[id]`, `/invoices/[id]`) все respond к the same [`PROMISE-ALL-SERVER-FETCH`] pattern.

Estimated total effort to clear all four:
- `/work/time` (~6-8h) — biggest, 86 widgets
- `/settings` (~3-4h) — 41 widgets, but many fetch same row
- `/clients/[id]` (~3-4h) — 37 widgets
- `/invoices/[id]` (in flight, P1-B) — 16 widgets

**~14-20h total focused work** к clear все four pages. ~7-10 PRs если split per-page, or 2-3 PRs if grouped по related concerns.

## Related

- SCAN-RESULTS.md
- LAUNCH-BLOCKER-RANKING.md
- [`../agent1-work-time-investigation/`](../agent1-work-time-investigation/)
- Vault: `Patterns/N-PLUS-ONE-ANTIPATTERN.md`
