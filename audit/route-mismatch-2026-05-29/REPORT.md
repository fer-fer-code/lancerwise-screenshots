# Route-mismatch audit — pre-launch

**Date:** 2026-05-29
**Agent:** Agent 5
**Branch:** `fix/work-time-en-leaks-pre-launch` (read-only; nothing mutated)
**Production probed:** `https://www.lancerwise.com` authed as `ramiz_ddd@mail.ru`
**Scope:** static (List A vs List B) + authed HTTP probe; only GET fetch — no create/delete operations issued.

---

## TL;DR — 4 broken targets, 1 silent P0 trap

| # | Target | Status | Severity | Caller count | User-visible? |
|---|---|---|---|---|---|
| 1 | `/sign-in` | 404 | **P0** | **31 server pages** | Silent — triggers when session expires on protected route |
| 2 | `/calendar` | 404 | **P1** | 4 (3 components + 1 API JSON) | Yes — date-grid click + "View calendar" widget link |
| 3 | `/time` | 404 | **P1** | 1 (Command Center quick action) | Yes — "+ Log Time" button on `/dashboard/command-center` |
| 4 | `/work/time/timesheet` | 404 | P3 | 0 | User-guessed URL only (no internal caller); separate alias-config concern |

`/contracts/templates/new` — **NOT broken**. Returns 200 because `[id]/page.tsx` deliberately checks `id === 'new'` to switch to editor-blank mode (`isNew = id === 'new'`).

`/today`, `/morning` — **NOT broken**. Appear only in `MobileBottomNav.activeFor` array (highlight-match logic), never as `href` targets.

Aliased duplicates (`/work` ↔ `/work/projects`, `/work/time` ↔ `/time-tracker`, `/projects` ↔ `/work/projects`) all return 200; SEO concern already tracked in `backlog_seo_duplicate_aliased_routes` — not duplicated here.

---

## Methodology

**List A — actual routes:** enumerated all `src/app/**/page.tsx` (638 files), normalized URL by stripping `(group)` route-groups and treating `[param]` / `[...catchall]` as wildcards. Saved to `list-A-actual-routes.txt`.

**List B — link references:** grepped `href=`, `router.push(`, `redirect(` literals across `src/**/*.{ts,tsx,js,jsx}` (166 distinct targets after dedup + template-literal normalization `${var}` → `[id]`). Saved to `list-B-all-link-refs.txt`.

**Diff:** segment-aware matching — a ref like `/blog/some-slug` correctly matches actual route `/blog/[slug]`; literal `new` matching `[id]` is accepted (Next.js dynamic-segment behaviour); catch-all `[...x]` gobbles tail. Broken refs in `diff-broken-refs.txt`.

**Probe:** authed `fetch(u, { redirect: 'manual', credentials: 'include' })` from `/dashboard` context for each candidate; followed up with `redirect: 'follow'` reads to confirm body size and 404 marker for 200/404 ambiguous cases.

---

## Findings — detail

### #1 — `/sign-in` (P0, silent)

**Static count:** 31 occurrences of literal `redirect('/sign-in')` across `src/app/(app)/**/page.tsx`. Full list in `sign-in-callers-31files.txt`. Samples:

```
src/app/(app)/clients/retainers/page.tsx
src/app/(app)/clients/health-scores/page.tsx
src/app/(app)/settings/public-profile/page.tsx
src/app/(app)/tools/invoice-reminders/page.tsx
src/app/(app)/tools/weekly-report/page.tsx
src/app/(app)/tools/onboarding-flows/page.tsx
… (26 more — 16 in /tools/*, 4 in /analytics/*, 4 in /clients|settings|activity)
```

**Pattern (every file):**
```ts
if (!user) redirect('/sign-in')
```

**Prod probe:** `GET /sign-in` → **404** (body size 220,893 — error page, not a redirect). Login page lives at `/login` (also `/sign-in` is absent from `list-A-actual-routes.txt`).

**Trigger:** any unauthed visit to one of these 31 routes (cookie expiry, fresh device, copy-pasted URL). Instead of being sent к `/login` user lands on Next.js 404. Silent regression — never visible to a logged-in user during normal QA.

**Fix:** bulk replace `redirect('/sign-in')` → `redirect('/login')` across the 31 files. Single-line `sed -i '' "s|redirect('/sign-in')|redirect('/login')|g"` per file, or a single rg+sed pass. No middleware change required; the rest of the codebase already routes к `/login`.

### #2 — `/calendar` (P1)

**Static count:** 4 references across 4 files. Prod probe → **404**.

| File | Line | Form |
|---|---|---|
| `src/components/WorkCalendarMini.tsx` | 89 | `<Link href="/calendar">` — "View calendar" CTA inside mini widget |
| `src/components/WorkCalendar.tsx` | 243 | `<Link href={\`/calendar?date=${key}\`}>` — every clickable date cell на week grid |
| `src/components/layout/MobileBottomNav.tsx` | 20 | `activeFor: ['/dashboard', '/today', '/morning', '/calendar']` — **highlight-match only, not a link** (read on click; no impact) |
| `src/app/api/booking/create/route.ts` | 175 | `link: '/calendar'` — sent в notification JSON when a public booking is created (likely surfaces в email/SMS to freelancer or client) |

**User impact:**
- Anywhere `WorkCalendar` или `WorkCalendarMini` are rendered, every date click → 404. (Where these are mounted across the app needs a follow-up sweep, но both look like dashboard widgets.)
- Public booking notification deep-link → 404 for whoever clicks (client or freelancer).

**Fix options:** (a) ship a `/calendar` page (proper weekly/monthly calendar) — already implied by widget UX, looks like un-shipped feature; (b) rewrite refs к existing destination (`/time-tracker` weekly view? `/dashboard/calendar`?) — Ramiz call; (c) `next.config` rewrite to existing alias. Either way **the widget code presumes a target that does not exist** — this is not a typo, it's a missing route.

### #3 — `/time` (P1, visible)

**Static count:** 1 reference. Prod probe → **404**.

```
src/app/(app)/dashboard/command-center/CommandCenterClient.tsx:732
  <QuickActionBtn href="/time" icon="⏱️" label="+ Log Time" />
```

**User impact:** confirmed live на `/dashboard/command-center` — link "⏱️ + Log Time" leads to a 404. Highly visible (top quick-action row, primary CTA for the timer feature).

**Fix:** one-line — `href="/time"` → `href="/time-tracker"`.

### #4 — `/work/time/timesheet` (P3, no internal caller)

**Static count:** 0 internal callers. Prod probe → **404**.

User-discovered during Phase 3 verification (intuited that `/work/time` exists → `/work/time/timesheet` should also). Actual page lives at `/time-tracker/timesheet` (and is healthy — full RU rendering verified в `work-time-en-leaks-fix-2026-05-27/REPORT.md`).

Relates к existing memo `backlog_seo_duplicate_aliased_routes` — `/work/time` aliases `/time-tracker` only at the index level; the alias is not recursive.

**Fix options:** (a) add `src/app/(app)/work/time/timesheet/page.tsx` re-export of `/time-tracker/timesheet/page.tsx`; (b) Next.js `rewrites()`/`redirects()` for `/work/time/:path*` → `/time-tracker/:path*`; (c) leave as-is and document the canonical path (`/time-tracker/timesheet`) since no UI surface points here.

---

## What is NOT broken (verified)

| Target | Static flag | Verified | Note |
|---|---|---|---|
| `/contracts/templates/new` | Initially suspect | **200** | Intentional: `[id]/page.tsx` line 17 `const isNew = id === 'new'` switches to blank-editor mode. Body 317KB (vs 220KB 404 baseline). |
| `/today`, `/morning` | 404 individually | OK | Appear only в `MobileBottomNav.activeFor` array used for highlight matching, не как link targets. No code path navigates here. |
| `/work` | opaque-redirect | **200 after follow** | Server-redirect к `/work/projects`. Works. |
| `/login` | opaque-redirect | **200 after follow** | Authed-user redirect к `/dashboard`. Works. |
| `/blog/{4-slugs}` | Initially suspect | OK | All 4 referenced slugs (`best-time-tracking-methods-freelancers`, `freelance-invoice-template`, `how-to-calculate-freelance-hourly-rate`, `how-to-write-freelance-contract`) match `.ts` post files в `src/content/blog/posts/` and are served by `/blog/[slug]`. |
| `/insights` ↔ `/analytics` | Both exist | OK | Sidebar parent goes к `/insights`, sub-pages live под `/analytics/*` — both index pages exist and respond 200. (UX consistency может стоить отдельной memo, но не broken-route.) |

---

## Probe results (raw, 18 URLs, authed)

```json
[
  {"url":"/calendar",                "status":404, "type":"basic"},
  {"url":"/sign-in",                 "status":404, "type":"basic"},
  {"url":"/time",                    "status":404, "type":"basic"},
  {"url":"/contracts/templates/new", "status":200, "type":"basic"},
  {"url":"/work/time/timesheet",     "status":404, "type":"basic"},
  {"url":"/today",                   "status":404, "type":"basic"},
  {"url":"/morning",                 "status":404, "type":"basic"},
  {"url":"/work",                    "status":0,   "type":"opaqueredirect"},  // → /work/projects
  {"url":"/work/projects",           "status":200, "type":"basic"},
  {"url":"/projects",                "status":200, "type":"basic"},
  {"url":"/work/time",               "status":200, "type":"basic"},
  {"url":"/time-tracker",            "status":200, "type":"basic"},
  {"url":"/insights",                "status":200, "type":"basic"},
  {"url":"/analytics",               "status":200, "type":"basic"},
  {"url":"/inbox",                   "status":200, "type":"basic"},
  {"url":"/help",                    "status":200, "type":"basic"},
  {"url":"/login",                   "status":0,   "type":"opaqueredirect"},  // → /dashboard (authed)
  {"url":"/dashboard",               "status":200, "type":"basic"}
]
```

Visible-link confirmation:
- `/dashboard/command-center` snapshot: `<a href="/time">⏱️+ Log Time</a>` present.
- `/contracts/templates` snapshot: `<a href="/contracts/templates/new">Новый шаблон</a>` present (and target works — 200).

---

## Honest non-overclaim

- Scope is **broken targets**, not exhaustive UX/SEO of aliased routes. Aliased duplicates (`/work` ↔ `/work/projects` etc.) all return 200, so they aren't in this report — separate backlog memo `backlog_seo_duplicate_aliased_routes` already tracks them.
- The `activeFor: [..., '/today', '/morning', '/calendar']` highlight array в `MobileBottomNav.tsx` is **not** itself a broken link, но it's a clue that someone planned routes that never shipped (`/today`, `/morning`, `/calendar`). If those features were dropped, the array should be cleaned. If they're still planned, they're missing routes.
- Static analysis didn't enumerate `<form action=...>` or `fetch('/...')` API calls — only navigation primitives (`href=`, `router.push`, `redirect`). API endpoint health was out of scope.
- 31 `redirect('/sign-in')` calls were counted via exact-literal grep — variable-interpolated cases would be missed (none found in this codebase).
- Probe was authed; for `/sign-in` specifically the trigger condition is *unauthed* visit к a protected page. Probe simulated the result by directly fetching `/sign-in` which the unauthed branch would land на anyway — confirmed 404.
- Nothing mutated: no POST/PUT/DELETE issued. Browser stayed signed in throughout.

— Agent 5, 2026-05-29
