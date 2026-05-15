# Dead URLs — Confirmed Candidates

7 URLs confirmed dead (HTTP 404 in production):

| # | URL | Link source | page.tsx exists? | Renders 404? | Proposed action | Zone |
|---|---|---|---|---|---|---|
| 1 | `/calendar` | `src/components/WorkCalendarMini.tsx:89` (Mini-calendar widget header "Full calendar →") | NO | YES (404) | Decide: link to `/time-off/calendar` OR `/tax/calendar` OR remove link OR create `/calendar` index | agent3 |
| 2 | `/sign-in` | `redirect('/sign-in')` в 31 page files (full list in `sign-in-redirect-sites.txt`); ZERO files в `/dashboard/**` | NO | YES (404) | Replace `redirect('/sign-in')` → `redirect('/login')` everywhere (bulk find/replace) | agent3 |
| 3 | `/time` | `src/app/(app)/dashboard/command-center/CommandCenterClient.tsx:732` (Quick action "+ Log Time") | NO | YES (404) | **AGENT #1 ZONE** — flag к Agent #1; recommended: change `href` to `/time-tracker` (exists, line 96 middleware) | agent#1 |
| 4 | `/today` | none (orphan) | NO | YES (404) | No code change needed (no UI caller); update memory backlog | agent3 |
| 5 | `/insights/time` | none (orphan) | NO | YES (404) | No code change needed; update memory backlog | agent3 |
| 6 | `/insights/goals` | none (orphan) | NO | YES (404) | No code change needed; update memory backlog | agent3 |
| 7 | `/insights/reports` | none (orphan) | NO | YES (404) | No code change needed; update memory backlog | agent3 |

## NOT dead (false positives — for record)

| URL | Status | Notes |
|---|---|---|
| `/settings/profile` | 200 OK | Memory hint stale; some other route serves this |
| `/contracts/templates/new` | 200 OK | Routed via `[id]/page.tsx` with `isNew = id === 'new'` branch |
| `/settings/integrations` | exists | Memory stale; `page.tsx` present |
| `/settings/billing` | exists | Memory stale; `page.tsx` present |

## Total code touch surface for Step C (if reviewer approves bulk fixes)

* 1 file: `src/components/WorkCalendarMini.tsx` (1 line)
* 31 files: `redirect('/sign-in')` → `redirect('/login')` (1 line each)
* 1 message to Agent #1 about `/time` href в CommandCenterClient

**Net: 32 files modified, ~32 lines changed.**

No new files created, no files deleted (orphan URLs have no link callers — nothing to touch). Memory backlog entry will be updated to reflect resolved status.
