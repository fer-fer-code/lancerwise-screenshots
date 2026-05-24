# SEV1 Palette Drift Remediation Plan

**Date:** 2026-05-24
**Reporter:** Ramiz (visual mobile inspection)
**Reference:** `audit/agent6-palette-refactor-2026-05-23/after-palette-dashboard-{EN,RU}.png` + `after-palette-sidebar-detail.png`
**Production:** https://www.lancerwise.com (Phase 1+2+PR #225 deployed)
**Repo:** `/Users/myoffice/lancerwise` — `origin/main` HEAD inspected (test/e2e-pk-test-mode branch checked out locally, but plan is against `origin/main`)

---

## Root cause (CONFIRMED)

Two compounding bugs cause the blue/navy cast Ramiz observed on mobile:

### Bug 1 — globals.css `--background` never points to `--canvas`

`src/app/globals.css` defines Phase 1 raw tokens in `:root` (lines 14-37) AND a Phase 8 `.dark` override (lines 88-91). The `.dark` block sets `--background: #0a0a0a` directly — **NOT** mapped to `var(--canvas)`. The `body` rule (lines 93-97) consumes `var(--background)`, so:

- Light mode: body = `#ffffff` (intended)
- Dark mode: body = `#0a0a0a` (neutral-950, intended Phase 8 value) — **NOT** `#0B0B12` Phase 1 canvas

Impact: page background is `rgb(10,10,10)` (pure dark) instead of `rgb(11,11,18)` canvas — subtle near-black drift. Then Bug 2 dominates the visible cast.

### Bug 2 — App shell + sidebars hardcode `bg-slate-*`

The authed shell wrapper at `src/app/(app)/layout.tsx:88` uses `bg-slate-950` = `#020617` = `rgb(2,6,23)` — a deeply **blue-tinted** near-black. Both sidebar variants (`Sidebar.tsx:148`, `NewSidebar.tsx:188`) use `bg-slate-900` = `#0F172A` = `rgb(15,23,42)` — **navy**. Header uses `bg-slate-800/50` = `rgba(30,41,59,0.5)` — slate-navy.

This is the dominant visible regression — slate-* hex values have a measurable blue channel (slate-950 has 23 blue vs 2 red), giving the entire app chrome the navy cast vs the intended warm-neutral canvas/surface tokens.

Together: even if Bug 1 is fixed, the chrome above the body STILL renders navy because three layout-level files hardcode slate-* utilities instead of Phase 1 `bg-canvas` / `bg-surface` / `bg-card` tokens.

---

## Visual evidence

Live production screenshots could not be captured in this pass — port 50565 Chrome instance was launched without `--remote-allow-origins`, blocking external CDP WebSocket handshake (403). Playwright MCP is locked by another agent on the shared user-data-dir. Reference images from approved Phase 1 + Phase 2 design copied for diff context:

- `baseline/reference-dashboard-EN.png` — approved canvas/surface/card hierarchy
- `baseline/reference-sidebar.png` — approved sidebar bg-surface

A separate Playwright-isolated pass should capture the 14 production screenshots to confirm computed RGB drift per route. The forensics below stand independent of those captures because the drift is in static source code (Tailwind class strings), not runtime style computation.

---

## Drift inventory (static analysis)

### Total scope
- **874 files** contain `bg-slate-*` / `bg-neutral-9*` / `bg-zinc-9*` / `bg-gray-9*` drift utilities
- **3548 occurrences** total across `src/**`
- **3303 occurrences** inside `src/app/(app)/` authed routes alone
- **26 occurrences** are page-level `min-h-screen bg-slate-*` wrappers (these multiply the body bg issue per-route)
- **29 files / 53 occurrences** use correct Phase 1 tokens (`bg-canvas`, `bg-surface`, `bg-card`) — token adoption is at **~1.5%**

### Tier 1 — App shell (HIGHEST IMPACT, affects every authed route)

| File | Line | Current class | Replacement |
|---|---|---|---|
| `src/app/(app)/layout.tsx` | 88 | `flex h-screen bg-slate-950 overflow-hidden` | `flex h-screen bg-canvas overflow-hidden` |
| `src/components/layout/Sidebar.tsx` | 148 | `hidden md:flex w-60 bg-slate-900 flex-col flex-shrink-0 border-r border-white/5` | `hidden md:flex w-60 bg-surface flex-col flex-shrink-0 border-r border-subtle` |
| `src/components/layout/NewSidebar.tsx` | 188 | `hidden md:flex w-56 bg-slate-900 flex-col flex-shrink-0 border-r border-white/5` | `hidden md:flex w-56 bg-surface flex-col flex-shrink-0 border-r border-subtle` |
| `src/components/layout/Header.tsx` | 139 | `h-16 bg-slate-800/50 border-b border-slate-700 flex items-center justify-between px-4 md:px-6 flex-shrink-0` | `h-16 bg-surface border-b border-subtle flex items-center justify-between px-4 md:px-6 flex-shrink-0` |
| `src/components/layout/MobileBottomNav.tsx` | 96 | `fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-900 border-t border-white/5 flex items-center` | `fixed bottom-0 left-0 right-0 z-40 md:hidden bg-surface border-t border-subtle flex items-center` |

**Estimate:** 5 surgical edits, 5 minutes. Verify visually on production after deploy — this alone should resolve ~80% of the perceived cast.

### Tier 2 — globals.css alignment (1-line fix, body bg)

`src/app/globals.css:88-91` currently:

```css
.dark {
  --background: #0a0a0a;
  --foreground: #ededed;
}
```

Replacement:

```css
.dark {
  --background: var(--canvas);  /* align to Phase 1 #0B0B12 */
  --foreground: var(--text-primary);  /* align to Phase 1 #F4F4F6 */
}
```

**Estimate:** 1 file, 2 lines, 2 minutes. Resolves Bug 1. Negligible visual change on its own (rgb(10,10,10) → rgb(11,11,18) is 1 unit each on G+B) but eliminates the token contradiction.

### Tier 3 — Page-level `min-h-screen bg-slate-*` wrappers (26 routes)

These duplicate the body bg with a tinted wrapper, so even after Tier 2 fix the page below header still renders slate:

| File | Line | Current | Replacement |
|---|---|---|---|
| `src/app/error.tsx` | 13 | `min-h-screen bg-slate-950 ...` | `min-h-screen bg-canvas ...` |
| `src/app/not-found.tsx` | 6 | `min-h-screen bg-slate-950 ...` | `min-h-screen bg-canvas ...` |
| `src/app/page.tsx` | 124 | `min-h-screen bg-slate-900 overflow-x-hidden` | `min-h-screen bg-canvas overflow-x-hidden` |
| `src/app/demo/DemoClient.tsx` | 100 | `min-h-screen bg-slate-950 text-white` | `min-h-screen bg-canvas text-primary` |
| `src/app/admin/layout.tsx` | 21 | `min-h-screen bg-slate-950 text-slate-100` | `min-h-screen bg-canvas text-primary` |
| `src/app/(public-tools)/tools/rate-calculator/page.tsx` | 32 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/contact/page.tsx` | 32 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/privacy/page.tsx` | 26 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/cookie-policy/page.tsx` | 26 | `min-h-screen bg-slate-900 text-slate-300` | `min-h-screen bg-canvas text-secondary` |
| `src/app/faq/page.tsx` | 67 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/terms/page.tsx` | 26 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/about/page.tsx` | 40 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/unsubscribe/page.tsx` | 11 | `min-h-screen bg-slate-900/50 ...` | `min-h-screen bg-canvas ...` |
| `src/app/blog/page.tsx` | 85 | `min-h-screen bg-slate-900 text-slate-100` | `min-h-screen bg-canvas text-primary` |
| `src/app/blog/[slug]/page.tsx` | 141 | `min-h-screen bg-slate-900 text-slate-100` | `min-h-screen bg-canvas text-primary` |
| `src/app/pricing/page.tsx` | 37 | `min-h-screen bg-slate-900` | `min-h-screen bg-canvas` |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 356 | `min-h-screen bg-slate-900/50 p-6` | `min-h-screen bg-canvas p-6` |
| `src/app/(app)/tools/timezone/page.tsx` | 320 | `min-h-screen bg-slate-900 flex items-center ...` | `min-h-screen bg-canvas flex items-center ...` |
| `src/app/(app)/tools/timezone/page.tsx` | 330 | `min-h-screen bg-slate-900 text-slate-100 p-6` | `min-h-screen bg-canvas text-primary p-6` |
| `src/app/(app)/tools/faq-builder/page.tsx` | 325 | `min-h-screen bg-slate-900/50` | `min-h-screen bg-canvas` |
| `src/app/(app)/leads/analytics/page.tsx` | 82 | `min-h-screen bg-slate-900 text-slate-100` | `min-h-screen bg-canvas text-primary` |
| `src/app/(app)/time-tracker/focus/page.tsx` | 114 | `min-h-screen bg-slate-950 flex flex-col items-center ...` | `min-h-screen bg-canvas flex flex-col items-center ...` |
| `src/app/(app)/analytics/capacity/page.tsx` | 292 | `min-h-screen bg-slate-900 flex items-center ...` | `min-h-screen bg-canvas flex items-center ...` |
| `src/app/(app)/analytics/capacity/page.tsx` | 300 | `min-h-screen bg-slate-900 flex items-center ...` | `min-h-screen bg-canvas flex items-center ...` |
| `src/app/(app)/analytics/capacity/page.tsx` | 312 | `min-h-screen bg-slate-900 text-white` | `min-h-screen bg-canvas text-primary` |
| `src/app/(app)/reports/expenses/page.tsx` | 133 | `min-h-screen bg-gray-950 text-white` | `min-h-screen bg-canvas text-primary` |

**Estimate:** 26 edits, 15 minutes. Each is single-class swap, low risk.

### Tier 4 — Widget container shells (Top 30 files, est ~500 swaps)

| File | Drift count | Notes |
|---|---|---|
| `src/app/(app)/analytics/work-location/page.tsx` | 29 | `bg-slate-800/50` cards → `bg-card`; `border-slate-700` → `border-subtle` |
| `src/app/(app)/team/TeamPageClient.tsx` | 27 | same pattern |
| `src/app/(app)/invoices/new/page.tsx` | 25 | form panels |
| `src/app/(app)/time-tracker/page.tsx` | 23 | timer card surfaces |
| `src/app/(app)/settings/page.tsx` | 23 | settings sections |
| `src/app/(app)/analytics/time/page.tsx` | 21 | analytics widgets |
| `src/app/(app)/reports/annual/AnnualReportClient.tsx` | 20 | report sections |
| `src/app/(app)/analytics/heatmap/WorkHeatmapPage.tsx` | 20 | heatmap shells |
| `src/app/(app)/time-tracker/analytics/page.tsx` | 19 | sub-page |
| `src/app/(app)/proposals/page.tsx` | 19 | proposals list+detail |
| `src/app/(app)/clients/win-back/page.tsx` | 19 | win-back cards |
| `src/app/(app)/skills/page.tsx` | 18 | skill chips/cards |
| `src/app/(app)/onboarding/OnboardingWizard.tsx` | 18 | onboarding panels |
| `src/app/(app)/analytics/scope-creep/page.tsx` | 18 | analytics widgets |
| `src/app/(app)/revenue-goals/GoalsPageClient.tsx` | 17 | goals cards |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 16 | tool panels |
| `src/app/(app)/reports/year-in-review/page.tsx` | 16 | report sections |
| `src/app/(app)/reports/expenses/page.tsx` | 16 | already in Tier 3 page wrapper |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 16 | estimator cards |
| `src/app/(app)/projects/onboarding/page.tsx` | 16 | onboarding panels |
| `src/app/(app)/leads/page.tsx` | 16 | leads pipeline |
| `src/app/(app)/expenses/page.tsx` | 16 | expense list cards |
| `src/app/(app)/work-log/page.tsx` | 15 | log entries |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 15 | template cards |
| `src/app/(app)/tools/faq-builder/page.tsx` | 15 | builder panels |
| `src/app/(app)/tools/budgets/BudgetsClient.tsx` | 15 | budget rows |
| `src/app/(app)/tax-estimator/TaxEstimatorClient.tsx` | 15 | estimator panels |
| `src/app/(app)/reports/monthly/MonthlyReportClient.tsx` | 15 | report widgets |
| `src/app/(app)/projects/[id]/page.tsx` | 15 | project detail panels |
| `src/components/dashboard/*Widget.tsx` (5+ files) | ~15 | NotesWidget, RetainerUsageCard, RunwayWidget, etc |

**Canonical swap rules for Tier 4:**

| Before | After | Reason |
|---|---|---|
| `bg-slate-800/50` | `bg-card` | card backgrounds |
| `bg-slate-800` | `bg-card` | card backgrounds (solid) |
| `bg-slate-900` (when used as card, not page) | `bg-card` OR `bg-surface` (per-case) | depends on hierarchy |
| `bg-slate-900/50` (hover overlay) | `bg-elevated/40` | hover lift |
| `border-slate-700` | `border-subtle` | default card border |
| `border-slate-700/50` | `border-subtle` | softer divider |
| `border-slate-600` | `border-line` | stronger divider |
| `text-slate-100` | `text-primary` | primary text |
| `text-slate-300` | `text-secondary` | secondary text |
| `text-slate-400` / `text-slate-500` | `text-muted` | muted text |
| `hover:bg-slate-700/50` | `hover:bg-elevated/50` | hover lift |

**Estimate:** 30 files × ~15 swaps avg = ~450 edits, 90 minutes (incremental, can be batched by route group).

---

## DO NOT TOUCH (out of scope)

Per Ramiz's directive — these are intentional and must be preserved:

1. **Button gradients** — `bg-gradient-to-r from-violet-500 to-pink-500` style chains (Phase 3 backlog)
2. **Decorative hero gradients** — landing hero (`src/app/page.tsx` hero section), `/dashboard` greeting card, `/upgrade` Pro plan card (intentional brand surface)
3. **Semantic status tints** — `bg-blue-900/20`, `bg-red-900/20`, `bg-green-900/20`, `bg-amber-900/20` used for status badges, alerts, activity types (these are NOT app chrome drift; they are deliberate semantic color)
4. **Email template inline styles** — required by email clients (see `feedback_email_template_inline_styles.md`)
5. **`/analytics/forecast` light theme** — existing known-light memo (`project_lancerwise_light_theme_audit.md`)
6. **Demo mockup screens** — `src/components/demo/mockups/*Mockup.tsx` are intentional UI illustrations, not the real app
7. **Text-color drift** — separate concern from background drift; can be coupled with Tier 4 swaps but not the SEV1 focus

---

## Phase 1 token reference (target values)

| Token | Hex | RGB | Use |
|---|---|---|---|
| `--canvas` | `#0B0B12` | `rgb(11,11,18)` | Page background, app shell root |
| `--surface` | `#11111A` | `rgb(17,17,26)` | Nav chrome (sidebar, header, mobile bottom nav) |
| `--card` | `#15151F` | `rgb(21,21,31)` | Default card background |
| `--elevated` | `#1B1B26` | `rgb(27,27,38)` | Modal, popover, hover-lift state |
| `--border-subtle` | `rgba(255,255,255,0.06)` | — | Default card border |
| `--border` | `rgba(255,255,255,0.08)` | — | Default divider |
| `--border-strong` | `rgba(255,255,255,0.10)` | — | Emphatic divider |
| `--accent-primary` | `#6A5AE0` | `rgb(106,90,224)` | Solid violet for active + CTA |

**Drift hex values that must be eliminated from app chrome:**

| Tailwind class | Hex | RGB | Cast |
|---|---|---|---|
| `bg-slate-950` | `#020617` | `rgb(2,6,23)` | Deep blue-tinted near-black |
| `bg-slate-900` | `#0F172A` | `rgb(15,23,42)` | Navy |
| `bg-slate-800` | `#1E293B` | `rgb(30,41,59)` | Slate-navy |
| `bg-neutral-950` | `#0A0A0A` | `rgb(10,10,10)` | Pure dark (currently `--background` in `.dark`!) |
| `bg-gray-950` | `#030712` | `rgb(3,7,18)` | Cool-dark |
| `bg-zinc-950` | `#09090B` | `rgb(9,9,11)` | Slight cool-dark |

---

## Estimated scope summary

| Tier | Description | Files | Edits | Minutes |
|---|---|---|---|---|
| 1 | App shell (layout + sidebars + header + mobile nav) | 5 | 5 | 5 |
| 2 | `globals.css` `.dark` mapping | 1 | 2 | 2 |
| 3 | Page-level `min-h-screen bg-slate-*` wrappers | ~25 | 26 | 15 |
| 4 | Widget container shells (per-route) | ~30 top files (+ ~840 long-tail) | ~3,500 swaps | 4–6 hours incremental |
| **TOTAL SEV1 (Tier 1+2+3)** | | **31** | **33** | **~22 min** |
| **Full cleanup (Tier 1+2+3+4)** | | **~870** | **~3,500** | **~7 hours** |

---

## Recommended PR strategy

### PR #1 — App shell + globals.css (SEV1 critical path) ~22 min

Combine Tier 1 + Tier 2 + Tier 3 into ONE PR. Tier 1 alone resolves the dominant visible cast (sidebar + header + shell wrapper); Tier 2 aligns the body var so future Phase work has a consistent foundation; Tier 3 catches the per-page wrapper duplicates that would still render slate-* even with shell fixed.

**Acceptance:** Production `body`, `header`, `aside` (sidebar), `<main>` page wrapper all show computed `background-color: rgb(11,11,18)` or `rgb(17,17,26)` (canvas/surface), not `rgb(2,6,23)` or `rgb(15,23,42)` (slate-950/900).

### PR #2 — Top 30 widget container files ~2 hours

Tier 4 batch 1: 30 files with 15+ drift occurrences each. Per-file swap using the canonical rule table above. Visual diff per route against `reference-dashboard-EN.png` palette.

### PR #3+ — Long-tail widget cleanup (incremental, can be deferred)

Remaining ~840 files at ~2 swaps each. Can be split per-route-group:
- `src/app/(app)/clients/**`
- `src/app/(app)/projects/**`
- `src/app/(app)/invoices/**`
- `src/app/(app)/analytics/**`
- `src/app/(app)/tools/**`
- `src/app/(app)/settings/**`
- `src/components/**`

These do NOT block SEV1 resolution — they polish individual route consistency.

---

## NOT codemod justification

Per Ramiz: NO codemod. Every swap must be eyes-on because:

1. **`bg-slate-900` is contextual** — sometimes it's a sidebar (→ `bg-surface`), sometimes a card (→ `bg-card`), sometimes a page wrapper (→ `bg-canvas`). A blind `s/bg-slate-900/bg-surface/g` would mis-class hundreds of card backgrounds.
2. **Semantic status tints must be preserved** — `bg-blue-900/20` for an Activity badge is INTENTIONAL, not drift.
3. **Decorative gradient backdrops** sometimes use slate-900 as a stop or overlay — must skip.
4. **Border + text classes pair with bg** — a `bg-slate-800/50 border-slate-700 text-slate-100` triple needs to swap together to a `bg-card border-subtle text-primary` triple to avoid contrast regression.

Tier 1 + Tier 2 are safe enough to do as `Edit` calls with exact line numbers (provided above). Tier 3 is mostly safe (page wrappers are always-canvas). Tier 4 needs per-file judgment.

---

## Next action

**Recommend Ramiz approve PR #1 (Tier 1+2+3, ~33 edits, ~22 min) FIRST.** Deploy and visually verify on production mobile — the cast should drop dramatically with just the 5 Tier-1 edits. Then sequence PR #2 + #3 over the next 1–2 working sessions.

If only ONE single fix is approved: **change `src/app/(app)/layout.tsx:88` from `bg-slate-950` → `bg-canvas`**. That single edit changes the authed app shell from `rgb(2,6,23)` (deep navy) to `rgb(11,11,18)` (warm-neutral canvas), which is the dominant pixel area of every authed page and the most visually obvious regression.

---

## Out of scope (deferred to backlog)

- Button gradient chains (Phase 3 backlog)
- Decorative gradient widgets (landing hero, dashboard greeting, upgrade Pro card — intentional)
- Text-color drift (`text-slate-*` → `text-primary/secondary/muted`) — couples to Tier 4 but not SEV1
- `/analytics/forecast` light-theme route — separate `project_lancerwise_light_theme_audit.md` track
- Semantic status badge tints (`bg-{blue,red,green,amber}-900/20`) — intentional
- Email template inline styles — intentional
- Demo mockup components in `src/components/demo/mockups/*` — illustrative
- Live computed-style probe per route — blocked by CDP origin restriction this pass; queue for next Playwright-isolated session if needed for visual regression test
