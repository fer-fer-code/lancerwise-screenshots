# Tier 1 + Tier 2 Post-Merge Report

**Date:** 2026-05-24/25 (session crossed midnight UTC)
**Tester:** Agent 5
**Plan:** [REMEDIATION-PLAN.md](../REMEDIATION-PLAN.md)
**Reference:** Ramiz SEV1 mobile inspection — blue/navy cast on every authed route

## TL;DR

**Both Tier 1 and Tier 2 PRs MERGED. SEV1 acceptance criteria PASSED on production.**

`/dashboard` computed-style probe confirms the expected token migration:
- body: `rgb(11, 11, 18)` = `#0B0B12` = **canvas** ✓
- sidebar (`aside`): `rgb(17, 17, 26)` = `#11111A` = **surface** ✓
- header: `rgb(17, 17, 26)` = `#11111A` = **surface** ✓
- main wrapper: transparent (inherits body) — correct

Compare to plan acceptance criteria:
> Production `body`, `header`, `aside` (sidebar), `<main>` page wrapper all show computed `background-color: rgb(11,11,18)` or `rgb(17,17,26)` (canvas/surface), **not** `rgb(2,6,23)` or `rgb(15,23,42)` (slate-950/900).

✅ **All 4 verification points pass.**

---

## Merge SHAs

| PR | Title | Merge SHA | Merged at |
|---|---|---|---|
| #226 | fix(palette): map .dark --background к --canvas token (SEV1 Bug 1) | `ac82d6bed412700318a471cfa15de66a9cfb855b` | 2026-05-24T18:56:14Z |
| #227 | fix(palette): Tier 1 app shell bg-slate-* → token migration (SEV1) | `966cc384f0903b5e802b5cae88f312fbe5e270cb` | 2026-05-24T19:00 UTC approx |

Both deployed to production via Vercel before the screenshot capture pass at 19:08 UTC.

---

## Tier 1 PR scope (3 files, 3 lines — not 5)

Original plan specified 5 chrome files. Grep before editing showed **2 of those 5 were already migrated** in a prior PR landing on main:
- `src/components/layout/NewSidebar.tsx` — already uses `bg-surface` / `border-subtle`
- `src/components/layout/Header.tsx` — already uses `bg-surface border-b border-subtle`

Tier 1 PR delivered the remaining 3 surgical swaps:

| File | Line | Before | After |
|---|---|---|---|
| `src/app/(app)/layout.tsx` | 92 | `flex h-screen bg-slate-950 overflow-hidden` | `flex h-screen bg-canvas overflow-hidden` |
| `src/components/layout/Sidebar.tsx` | 148 | `hidden md:flex w-60 bg-slate-900 flex-col flex-shrink-0 border-r border-white/5` | `hidden md:flex w-60 bg-surface flex-col flex-shrink-0 border-r border-subtle` |
| `src/components/layout/MobileBottomNav.tsx` | 96 | `fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-900 border-t border-white/5 flex items-center` | `fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-subtle flex items-center` |

Color shifts:
- `bg-slate-950` `rgb(2,6,23)` deep navy → `bg-canvas` `rgb(11,11,18)` warm-neutral (Δ R+9, G+5, B-5)
- `bg-slate-900` `rgb(15,23,42)` navy → `bg-surface` `rgb(17,17,26)` warm-neutral (Δ R+2, G-6, B-16)

The B-channel reduction (-5 on canvas, -16 on surface) is the visible "blue cast disappears" effect.

---

## Captured pages (6 full-page screenshots)

| File | URL | body bg | Notable |
|---|---|---|---|
| `post-tier1-01-landing.jpeg` | `/` | `rgb(11,11,18)` ✓ | Public landing — hero gradient preserved (intentional exception) |
| `post-tier1-02-pricing.jpeg` | `/pricing` | `rgb(11,11,18)` ✓ | 3 tier cards. Pro card retains brand gradient (Phase 2 intentional). |
| `post-tier1-03-dashboard.jpeg` | `/dashboard` | `rgb(11,11,18)` ✓ | **Acceptance verified.** Sidebar + header + main all on canvas/surface tokens. Greeting hero gradient preserved. |
| `post-tier1-04-clients.jpeg` | `/clients` | `rgb(11,11,18)` ✓ | 2-client list, stats cards, filter chips all render against canvas. |
| `post-tier1-05-work-time.jpeg` | `/work/time` | `rgb(11,11,18)` ✓ | Timer UI. Active 32:48:01 timer visible (leftover from earlier QA). |
| `post-tier1-06-settings.jpeg` | `/settings` | `rgb(11,11,18)` ✓ | Profile section, theme picker. |

All captured at viewport 1440×900 via Playwright MCP `fullPage: true`.

---

## CI summary for PR #227

| Check | Result |
|---|---|
| Vercel deploy | ✅ PASS |
| gate/eslint i18n | ✅ PASS (1m19s) |
| gate/locale-purity (ru) | ✅ PASS (1m36s) |
| gate/visual-regression | ✅ PASS (7m4s) |
| Vercel Preview Comments | ✅ PASS |

Notably, **visual-regression PASSED** — the palette change was correctly absorbed by the baseline. No new visual regressions introduced.

---

## What's still left (Tier 3 / Tier 4)

Per plan, Tier 1+2 resolves the **dominant** visible cast but does NOT eliminate slate from per-page wrappers or widget containers:

- **Tier 3** (26 page-level `min-h-screen bg-slate-*` wrappers) — still not migrated. Some routes will still render a navy tint INSIDE the canvas chrome on per-page basis. ~15 min surgical fix when ready.
- **Tier 4** (~30 top widget container files, ~3,500 swaps total long-tail) — incremental, deferable to post-launch polish.

Awaiting Ramiz direction on whether to ship Tier 3 next or pause for launch.

---

## Honest non-overclaim

- 3 of 5 originally-planned files were edited; 2 were already migrated by prior PR (verified via grep, not blind-trusted)
- `/dashboard` was the canonical acceptance test — passed. Other 5 routes captured for evidence but not exhaustively probed for computed-style on every element type.
- Tier 3 wrapper drift may still show slate on certain routes (e.g. `/pricing`, `/about`, public marketing) — captured screenshots show those routes still render fine because the body+chrome tokens dominate the visible area.
- The 32:48:01 active timer on `/work/time` is a user-action artifact from earlier QA session, not a bug introduced by this PR.

— Agent 5, 2026-05-25 (session crossed midnight)
