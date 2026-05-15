# Task 2 — Step A Discovery

**Date:** 2026-05-15
**Agent:** agent3
**Status:** Step A complete; awaiting reviewer approve for Step B (plan)

---

## A.1 Inventory

| Metric | Value |
|---|---|
| Total `page.tsx` in `src/app/**` | **638** |
| URL routes (after route-group + dynamic normalization) | **638** unique |
| Top-level dynamic routes (`src/app/[param]/page.tsx`) | none |
| Route groups detected | `(app)`, possibly others — handled in cross-ref |

Saved: `routes-inventory.txt`

## A.2 Internal links

| Metric | Value |
|---|---|
| Static `href="/..."` references (with file:line) | **517** |
| Unique link target paths (post-deduplication) | **139** |
| Programmatic `router.push("/...")` / `redirect("/...")` targets | **28** unique |
| Combined unique link targets | **150** |

Saved: `internal-links.txt`, `link-targets-unique.txt`

## A.3 Middleware + redirects

* `src/middleware.ts`: auth guard (Supabase SSR) + rate limits for `/api/auth/*`, `/api/v1/*`, `/api/ai/*`. Protected-routes allowlist на lines 93–105. Admin guard на lines 116–126. Auth redirects from `/login`/`/register` → `/dashboard` when authenticated.
* `next.config.ts` redirects (only 3 aliases):
  ```
  /money            -> /money/invoices
  /work             -> /work/projects
  /money/recurring  -> /invoices/recurring
  ```

Saved: `middleware-and-redirects.txt`

## A.4 Sitemap

`src/app/sitemap.ts` exposes only:
* `/` (home), `/pricing`, `/tools/rate-calculator`, `/demo`
* `/blog`, `/blog/<post>` (dynamic — 5 posts confirmed in `src/content/blog/posts/`)
* `/faq`, `/about`, `/contact`, `/api-docs`, `/n8n-templates`, `/changelog`
* `/privacy`, `/terms`, `/cookie-policy`

Every sitemap entry verified existing in `page.tsx`. **No dead URLs in sitemap.**

## A.5 Cross-reference (link targets vs filesystem)

Using a regex matcher that converts `[param]` → `[^/]+` and strips `(group)` segments. Initial pass returned 7 candidates; after dynamic-route handling, only 3 truly missing on filesystem:

| URL | Has page.tsx? | Found via |
|---|---|---|
| `/calendar` | NO | static href grep |
| `/sign-in` | NO | `redirect()` grep (31 sites) |
| `/time` | NO | static href grep |

`/contracts/templates/new` initially flagged but actually routes via `[id]/page.tsx` with `const isNew = id === 'new'` branch — **not dead**.

## A.6 Memory-backlog candidates

From `project_lancerwise_dead_urls_cleanup.md`: 6 routes flagged historically. Verified all 6 + `/settings/profile`:

| URL | page.tsx? | Internal link refs | Production probe |
|---|---|---|---|
| `/today` | NO | 0 | **404** |
| `/insights/time` | NO | 0 | **404** |
| `/insights/goals` | NO | 0 | **404** |
| `/insights/reports` | NO | 0 | **404** |
| `/settings/integrations` | YES (exists) | (n/a) | **memory stale** |
| `/settings/billing` | YES (exists) | (n/a) | **memory stale** |
| `/settings/profile` | NO | 0 | **200** — routed elsewhere |

## A.7 Production probe results

```
/calendar                 -> HTTP 404
/sign-in                  -> HTTP 404
/time                     -> HTTP 404
/today                    -> HTTP 404
/insights/time            -> HTTP 404
/insights/goals           -> HTTP 404
/insights/reports         -> HTTP 404
/settings/profile         -> HTTP 200
/contracts/templates/new  -> HTTP 200
```

Saved: `production-probe.txt`

## Confirmed dead URLs (7 total)

| # | URL | Internal refs | Source location | Cleanup zone |
|---|---|---|---|---|
| 1 | `/calendar` | 1 link | `src/components/WorkCalendarMini.tsx:89` (Mini-calendar widget) | **agent3 scope** |
| 2 | `/sign-in` | 31 redirects | `(app)/activity`, `(app)/analytics/*`, `(app)/clients/*`, `(app)/settings/public-profile`, `(app)/tools/*` (full list in `sign-in-redirect-sites.txt`) | **agent3 scope** (none in `/dashboard/**`) |
| 3 | `/time` | 1 link | `src/app/(app)/dashboard/command-center/CommandCenterClient.tsx:732` | **AGENT #1 ZONE** — flag, не trogai |
| 4 | `/today` | 0 | (orphan) | agent3 scope (sweep only) |
| 5 | `/insights/time` | 0 | (orphan) | agent3 scope (sweep only) |
| 6 | `/insights/goals` | 0 | (orphan) | agent3 scope (sweep only) |
| 7 | `/insights/reports` | 0 | (orphan) | agent3 scope (sweep only) |

## Sitemap clean — false positives

Memory said `/settings/integrations`, `/settings/billing` were dead. Both now have `page.tsx` (confirmed via filesystem). Memory note is stale; will be cleaned in Step B if reviewer approves.

`/contracts/templates/new` previously flagged in my partial pass but is fine — `[id]/page.tsx` has `isNew` branch.

`/settings/profile` flagged in QA Step 2 hint, but production returns 200 — routed somewhere I can't see в static analysis. Confirmed working.

## Risk read

* **High risk:** `/sign-in` redirect — 31 pages will send unauth users to a 404 if they hit the inner `redirect('/sign-in')` call (currently bypassed because middleware redirects to `/login` first). If middleware ever bypassed (test ENV, edge case) → 404.
* **Medium risk:** `/calendar` link in widget — only displayed when `totalEvents > 0`, so visible to authenticated users with calendar events. Clicking yields 404.
* **Low risk:** `/time` link in command center — Agent #1 zone, will flag.
* **Very low risk:** orphan URLs (`/today`, `/insights/*`) — no UI callers, only old bookmarks or external links would reach. No code fix needed beyond awareness.

## Proposed action categories (placeholder для Step B)

1. **Fix link** (`/calendar` widget): decide destination (closest existing: `/time-off/calendar`, `/tax/calendar`, or new `/calendar` index). OR remove the widget link.
2. **Bulk fix** (`/sign-in` → `/login`): replace `redirect('/sign-in')` with `redirect('/login')` в 31 page files.
3. **Flag to Agent #1** (`/time` in CommandCenterClient): decide whether to change href or create page.
4. **Optional sweep** (4 orphans): no code change needed; just confirm in final report and update memory backlog.

## Evidence files in this folder

* `README.md` — context + methodology
* `discovery.md` — this report
* `routes-inventory.txt` — 638 URL routes
* `internal-links.txt` — 517 href entries with file:line
* `link-targets-unique.txt` — 139 deduplicated link paths
* `middleware-and-redirects.txt` — middleware/redirect summary
* `dead-url-link-sources.txt` — grep results per candidate URL
* `sign-in-redirect-sites.txt` — 31 page files calling `redirect('/sign-in')`
* `production-probe.txt` — live HTTP status for 9 candidate URLs
