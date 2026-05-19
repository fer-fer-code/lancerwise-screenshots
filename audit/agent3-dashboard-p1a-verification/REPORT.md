# [AGENT 3] P1-A Dashboard functional verification — REPORT

**Date**: 2026-05-19 ~08:12 UTC
**Production deploy**: `dpl_uMrqsYfmqr9PcD8ySVHTCePfHaW1` (commit `e0757ec`, the perf fix)
**Method**: Playwright authed session on www.lancerwise.com/dashboard, fresh test user, cold cache

## Verdict

**Partially confirms AGENT 2's claim.** AGENT 2's batched endpoints (`/api/dashboard/super`, `/api/dashboard/widget-data`, `/api/dashboard/stats`) ARE live and serving. BUT **10 direct Supabase REST calls still fire from client components** on /dashboard load — the N+1 pattern wasn't fully eliminated, just partially shifted to internal API.

**Sentry signal**: 0 errors, 2 minor warnings during full /dashboard cold load. Safe for AGENT 4 to confirm no regression.

## Network probe — all /dashboard requests

### Internal API (AGENT 2's batched routes) — 3 calls

| Endpoint | Count | Status | Notes |
|----------|-------|--------|-------|
| `/api/dashboard/super` | 1 | 200 | Pre-existing batched route |
| `/api/dashboard/widget-data` | 1 | 200 | **NEW from commit e0757ec — P1-A fix** |
| `/api/dashboard/stats` | 1 | 200 | Pre-existing |

### Direct Supabase REST queries from client — 10 calls 🚩

| # | Query | Use case |
|---|-------|----------|
| 1 | `time_entries?end_time=is.null&order=start_time.desc&limit=1` | Active timer badge |
| 2 | `time_entries?end_time=is.null&order=start_time.desc&limit=1` | **Duplicate** of #1 — fired twice |
| 3 | `invoices?paid_at=gte.2025-11-30&status=eq.paid` | Period-bounded revenue tile |
| 4 | `proposal_drafts?select=id,status,created_at` | Pending proposals widget |
| 5 | `invoices?paid_at=gte.2026-02-18&status=eq.paid` | Trailing-90d revenue |
| 6 | `clients?order=name.asc` | Clients list (full) |
| 7 | `invoices?status=eq.paid` | All-paid total |
| 8 | `projects?status=eq.active&budget=not.is.null&budget=gt.0` | Active project budgets |
| 9 | `time_entries?project_id=not.is.null&duration=not.is.null` | Billable hours |
| 10 | `clients?status=eq.active` | Active clients count |

Plus **2 `auth/v1/user`** calls (Supabase session refresh).

### Notification polling — 3 calls

`/api/notifications` fired 3 times (likely polling for unread badge).

## Web Vitals (cold cache, authenticated)

| Metric | Value | Google threshold | Verdict |
|--------|-------|------------------|---------|
| TTFB | **68 ms** | ≤ 800 ms | ✅ Excellent |
| FCP | **4152 ms (4.15s)** | ≤ 1800 ms | 🚩 POOR |
| LCP | n/a (not captured — welcome tour overlay) | ≤ 2500 ms | n/a |
| CLS | **0** | ≤ 0.1 | ✅ Excellent |
| domInteractive | 4196 ms | n/a | Same as FCP — single render moment |
| domContentLoaded | 4197 ms | n/a | — |
| Load event | 4197 ms | n/a | — |
| Resource count | 72 | — | Reasonable |

**Interpretation**: Server response is fast (68 ms TTFB), but first content paint takes 4+ seconds. This matches a "blank → spinner → content" pattern: the page TTFB is fast, then client-side rendering waits on the 10 Supabase queries + 3 internal API calls before showing data.

If AGENT 2's batching had fully eliminated direct Supabase REST queries, FCP should drop to ~1-2s (just server roundtrip + initial render).

## What AGENT 2 claimed vs reality

| Claim | Reality |
|-------|---------|
| "Batch widget data fetches via Context" | ✅ True — `/api/dashboard/widget-data` exists + returns 200 |
| "N+1 fetches eliminated, batched into 1 request" | ❌ **Partial** — internal calls are 3 batched routes, but widgets STILL hit Supabase REST directly 10 times |
| "0 direct Supabase calls on /dashboard" (implied) | ❌ **10 direct Supabase REST calls observed** + 2 auth/v1/user |

AGENT 2's fix touches a Context provider that batches SOME data, but doesn't refactor widgets like ActiveTimer, ProposalDrafts, RevenueTile, ClientsList, ProjectsList, TimeEntriesList to consume from the Context. They still query Supabase directly.

## Sentry signal for AGENT 4

**No new errors during /dashboard cold load.** Console state at the moment of capture:
- **0 errors**
- **2 warnings** (likely deprecated React APIs or i18n key warnings, not Sentry-relevant)

Resource count 72 / status all 2xx. No 4xx/5xx during /dashboard flow.

AGENT 4: safe to confirm no new Sentry issues introduced by commit `e0757ec`. Sample size = 1 cold load of a fresh user with empty data. Recommend longer monitoring window for production traffic (~1 hr) before signing off.

## Recommendations

### For AGENT 2 (P1-A v2 if desired)

The bigger win on /dashboard FCP would come from migrating these client widgets to consume from the existing DashboardDataContext instead of querying Supabase directly:

| Widget | Current direct query | Could come from |
|--------|---------------------|------------------|
| ActiveTimer | `time_entries?end_time=is.null` (×2!) | `/api/dashboard/widget-data` |
| RevenueTile (12w) | `invoices?paid_at=gte.X&status=paid` | Same |
| Pending Proposals | `proposal_drafts?...` | Same |
| Active Clients | `clients?status=active` | Same |
| Project Budgets | `projects?status=active&budget>0` | Same |
| Billable Hours | `time_entries?project_id+duration` | Same |

Eliminating those 10 client-side fetches would drop FCP from 4.15s → ~1.5-2s (rough estimate).

Also: **investigate why `time_entries` active-timer query fires twice** — likely two components both subscribing without sharing state.

### For monitoring

The FCP 4.15s number on a cold load is concerning for first-time visitor UX. Could be caused by:
1. Client-side query waterfall (likely main contributor — 10 queries, each ~150-300 ms in serial = 1.5-3 s tail)
2. React hydration + Welcome Tour overlay rendering
3. Resource preload chain

Add to backlog if not already: per `backlog_dashboard_perf_waterfall_requests.md` — this measurement quantifies the prior backlog item with hard numbers.

## Files in this dir

| File | Purpose |
|------|---------|
| [`REPORT.md`](REPORT.md) | this — full functional verification |
| [`screenshots/dashboard-loaded.png`](screenshots/dashboard-loaded.png) | /dashboard fully loaded for `Perf Probe` test user (empty data state + Welcome Tour) |
