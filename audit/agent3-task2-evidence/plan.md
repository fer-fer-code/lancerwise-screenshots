# Task 2 — Step B Plan: Dead URLs cleanup

**Date:** 2026-05-16
**Status:** Awaiting reviewer approval before Step C

---

## 1. Discovery recap

7 dead URLs confirmed in production (HTTP 404):
1. `/calendar` (1 link from `WorkCalendarMini.tsx`)
2. `/sign-in` (31 `redirect()` call sites)
3. `/time` (1 link from `CommandCenterClient.tsx` — Agent #1 zone)
4. `/today`, `/insights/{time,goals,reports}` — 4 orphan URLs, zero internal callers

2 memory-backlog false positives identified (`/settings/integrations`, `/settings/billing` have `page.tsx`).

---

## 2. Per-URL resolution

### URL 1: `/calendar`

**Investigation result:** No existing route is a semantic match. Available `*calendar*` routes:

```
src/app/(app)/analytics/revenue-calendar/page.tsx     # financial only
src/app/(app)/tax/calendar/page.tsx                   # tax deadlines only
src/app/(app)/time-off/calendar/page.tsx              # PTO/vacation only
src/app/(app)/tools/content-calendar/page.tsx         # content planning only
src/app/(app)/tools/tax-calendar/page.tsx             # duplicate of tax
```

`WorkCalendarMini` fetches `/api/calendar-events` which aggregates **invoices + contracts + milestones + proposals + follow-ups + time-off** from 6 sources. No single existing page shows all 6.

**Decision: Option (b) — remove "Full calendar →" link** in `src/components/WorkCalendarMini.tsx:89`. Widget continues to render (7-day mini-view), just без CTA. Per reviewer rule: "Don't create new /calendar index — out of scope."

Code change (1 file, ~3 lines):
```diff
- <Link href="/calendar" className="text-sm text-violet-400 ...">
-   Full calendar <ArrowUpRight className="w-3.5 h-3.5" />
- </Link>
+ {/* Removed broken "Full calendar" link — no aggregate calendar route exists */}
```

(Also remove `ArrowUpRight` import if no longer used in file — verify before commit.)

### URL 2: `/sign-in`

**Decision:** Bulk replace `redirect('/sign-in')` → `redirect('/login')` across 31 files. Single commit per reviewer guidance.

Code change (31 files, 1 line each):
```diff
- if (!user) redirect('/sign-in')
+ if (!user) redirect('/login')
```

Affected files (full list in `sign-in-redirect-sites.txt`):
* `(app)/activity/page.tsx`
* `(app)/analytics/annual-review/page.tsx`, `billing-efficiency`, `kpi-dashboard`, `revenue-forecast`
* `(app)/clients/health-scores/page.tsx`, `retainers`
* `(app)/settings/public-profile/page.tsx`
* `(app)/tools/*` — 23 page.tsx files

Will execute via `find ... -exec sed -i …` или single Bash for-loop с verify.

### URL 3: `/time` — AGENT #1 ZONE

**Verification of recommended fix `/time` → `/time-tracker`:**

```bash
$ curl -s -o /dev/null -w "code=%{http_code} redirect=%{redirect_url}\n" \
    "https://lancerwise.com/time-tracker"
code=308 redirect=https://www.lancerwise.com/time-tracker

$ curl -s -L -o /dev/null -w "final_code=%{http_code} url=%{url_effective}\n" \
    "https://lancerwise.com/time-tracker"
final_code=200 url=https://www.lancerwise.com/login
```

* 308 = host canonicalization (lancerwise.com → www.lancerwise.com). Normal.
* Final 200 (unauth visit lands at `/login` due to middleware). Authenticated visit would 200 to actual `time-tracker` page.
* Filesystem confirms: `src/app/(app)/time-tracker/page.tsx` exists, plus `/time-tracker/focus`, `/time-tracker/timesheet`.

**`/time-tracker` IS a valid working route.** Agent #1 recommended fix is sound.

**My action:** flag в final report `final-report.md` as cross-agent message к Agent #1 with recommended diff:

```diff
- <QuickActionBtn href="/time" icon="⏱️" label="+ Log Time" />
+ <QuickActionBtn href="/time-tracker" icon="⏱️" label="+ Log Time" />
```

Agent #3 will NOT edit `CommandCenterClient.tsx` (Agent #1 zone). Reviewer pings Agent #1 separately.

### URLs 4–7: `/today`, `/insights/{time,goals,reports}` — 301 redirects to `/dashboard`

Per reviewer Q4 decision. Add 4 entries to `next.config.ts` redirects array:

```diff
  async redirects() {
    return [
      // Old->new URL aliases (convenience, not forced — old URLs still work directly)
      { source: '/money',          destination: '/money/invoices',  permanent: false },
      { source: '/work',           destination: '/work/projects',   permanent: false },
      { source: '/money/recurring', destination: '/invoices/recurring', permanent: false },
+     // Dead URLs from pre-launch cleanup — 301 redirect to dashboard for bookmark / SEO graceful handling
+     { source: '/today',           destination: '/dashboard', permanent: true },
+     { source: '/insights/time',   destination: '/dashboard', permanent: true },
+     { source: '/insights/goals',  destination: '/dashboard', permanent: true },
+     { source: '/insights/reports', destination: '/dashboard', permanent: true },
    ]
  },
```

`permanent: true` = HTTP 308 (Next.js's behavior, equivalent to 301 for SEO). Old bookmarks → `/dashboard`, search engines update index.

---

## 3. Code change inventory

| File | Change | Reason |
|---|---|---|
| `src/components/WorkCalendarMini.tsx` | Remove "Full calendar →" Link element (and unused `ArrowUpRight` import if no other usage) | URL 1 fix |
| 31 page.tsx files в (app)/* | `redirect('/sign-in')` → `redirect('/login')` | URL 2 fix |
| `next.config.ts` | +4 lines в `redirects()` | URLs 4–7 fix |
| `final-report.md` (evidence) | Flag к Agent #1 для `/time` fix | URL 3 (cross-agent) |

**Net: 33 source files modified, ~36 lines changed.**

No file deletions. No new files created.

---

## 4. /time-tracker production verification

Captured above (Section 2 URL 3): 308 → 200. Saved в `step-b-investigation.txt`.

---

## 5. Test plan (Step D)

After Step C changes are deployed:

### D.1 Re-run production probe для all 7 dead URLs

```bash
for url in /calendar /sign-in /time /today /insights/time /insights/goals /insights/reports; do
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" --max-time 10 \
    "https://lancerwise.com$url" || echo "ERR"
done
```

Expected results:

| URL | Expected post-fix |
|---|---|
| `/calendar` | unchanged (404) — link removed but URL doesn't exist; this is OK since no caller |
| `/sign-in` | unchanged (404) — URL doesn't exist; callers fixed to use /login |
| `/time` | unchanged (404) — Agent #1 zone, will be fixed separately |
| `/today` | **308** → `/dashboard` |
| `/insights/time` | **308** → `/dashboard` |
| `/insights/goals` | **308** → `/dashboard` |
| `/insights/reports` | **308** → `/dashboard` |

### D.2 Grep verification for /sign-in elimination

```bash
grep -r "redirect('/sign-in')" src/ --include="*.tsx" --include="*.ts" | wc -l
# Expected: 0
```

### D.3 WorkCalendarMini render verification

* Build project: `npm run build` — expect zero errors related to removed import (TypeScript catches unused imports).
* No live UI test required (text-only Link removal).

### D.4 Cross-agent flag verification

Confirm `final-report.md` flags `/time` к Agent #1 with diff + production probe evidence.

---

## 6. Memory backlog updates

Two memory files in `/Users/myoffice/.claude/projects/-Users-myoffice-instagram-agent/memory/`:

1. **`project_lancerwise_dead_urls_cleanup.md`** — mark as resolved with summary:
   * 4 of 6 orphans handled via 301 redirect (`/today`, `/insights/*`)
   * 2 reported false positives (`/settings/integrations`, `/settings/billing` have `page.tsx`)
   * 1 widget link removed (`/calendar`)
   * 1 callsite-bulk fix (`/sign-in` → `/login`, 31 sites)
   * 1 cross-agent action remaining (`/time` к Agent #1)

2. **MEMORY.md** — update line referencing the dead URLs backlog к completed/resolved.

---

## 7. Estimated execution time

| Phase | Activity | Time |
|---|---|---|
| C.1 | Branch checkout (`agent3-task2-dead-urls-cleanup`) | 1 min |
| C.2 | `WorkCalendarMini.tsx` edit + import cleanup | 3 min |
| C.3 | Bulk `/sign-in` → `/login` (31 files, scripted) | 5 min |
| C.4 | `next.config.ts` +4 redirects | 2 min |
| C.5 | Local build verification (`npm run build`) | 5–10 min |
| C.6 | Commit + push to feature branch | 2 min |
| C.7 | Memory backlog update | 3 min |
| D | Post-deploy production probes + grep verify | 5 min |
| **Total Step C+D** | | **~30 min** |

Note: production probe в D requires the changes to be deployed на www.lancerwise.com. Step C produces the PR; merge + Vercel deploy is reviewer-controlled.

---

## 8. Risk register

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| 1 | sed-based bulk replace catches `/sign-in` in non-redirect context (string literal, comment) | Low | Low | Use grep first to enumerate exact lines, then for-loop touching one file at a time with exact-match sed |
| 2 | `ArrowUpRight` removed but still used in same file | Low | Very Low | grep file для remaining uses before removing import |
| 3 | `next.config.ts` redirects break existing /money, /work patterns | Very Low | Med | Append new redirects after existing, no edit to old |
| 4 | `permanent: true` causes browser cache lock-in if URL ever resurrected | Low | Low | Standard practice for actually-dead URLs; acceptable |
| 5 | `/time-tracker` redirect chain breaks unauth users | None | n/a | Verified: 308 → 200; middleware handles auth gracefully |
| 6 | Agent #1 doesn't apply /time fix → /time stays 404 post-launch | Med | Low | Flag prominently in final-report.md; reviewer pings Agent #1 |
| 7 | Build fails due to import cleanup miss | Low | Low | Run `npm run build` локально before push |

---

## 9. Open question для reviewer

**Q-only-one:** Confirm Option (b) — remove "Full calendar →" link — is acceptable для `/calendar`. Alternative would be link to `/time-off/calendar` as the closest "events" calendar, but it only covers 1 of 6 event types, which would be misleading. Recommend Option (b).

If Option (b) approved + plan looks good — proceed to Step C.
