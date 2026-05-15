# Agent3 Task 2 — Dead URLs Cleanup

**Context:** LancerWise pre-launch cleanup — identify routes that 404 in production and decide cleanup (delete link / redirect / fix) for each.

**Source commits:**
* Task 1 final commit: `b682622` (migrations tracking)
* Agent #1 zone: `src/app/(app)/dashboard/**` — do not modify
* Agent #2 zone: `tests/e2e/**`, `eslint.config.mjs`, `playwright.config.ts`, `.github/workflows/**` — do not modify

**Methodology:**
1. Inventory all `page.tsx` files in `src/app/**` → URL routes (638 routes total)
2. Find all internal `href="/..."` and `router.push("/...")` references (139 unique link targets + 28 router targets)
3. Read `src/middleware.ts` to understand redirects + protected routes
4. Read `src/app/sitemap.ts` to inventory sitemap entries
5. Cross-reference link targets vs filesystem routes (with dynamic `[param]` and route-group `(group)` handling)
6. Probe candidates against production (`https://lancerwise.com/<url>`) for HTTP status

**Branch (Step C onwards):** `agent3-task2-dead-urls-cleanup`
