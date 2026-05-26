# /work/projects Layout Diagnostic — 1280×1024 (13" Safari)

**Date:** 2026-05-26
**Author:** [AGENT 1]
**Mode:** READ-ONLY diagnostic — NO commits applied к lancerwise repo
**lancerwise main HEAD SHA at capture:** `b2627dda`
**Viewport tested:** 1280 × 1024 (13" Safari simulation)
**Auth:** magic-link via Supabase Admin (krokusstudia2@gmail.com)
**URL captured:** `/work/projects` resolved к equivalent of `/projects` (route alias)

---

## TL;DR — Root cause

**The page wrapper is 1008px wide (1280 − 224 sidebar − 48 padding = 1008px usable).** Within that 1008px:

- KPI grid (4 cards × 243px + 36px gaps) **correctly fills** к 1008px ✅
- Project card grid (3 cards × 325px + 32px gap) **correctly fills** к 1008px ✅
- Filter chip row + action buttons row — **fully width-utilizing** via `justify-between` ✅
- **🚨 Грид/Доска view-toggle pill = 322px wide, sits alone в an empty row with 686px of void к its right** ← dominant visible imbalance
- Project card grid caps at `lg:grid-cols-3` — **could expand к 4 cols at xl: breakpoint** for better density на ≥1280px

---

## DOM measurements (1280×1024 viewport)

| Section | Width | Left | Right | Class summary | Verdict |
|---|---:|---:|---:|---|:---:|
| viewport | 1280 | — | — | — | — |
| sidebar `<aside>` | **224** | 0 | 224 | `hidden md:flex w-56 bg-surface flex-col flex-shrink-0 border-r border-subtle` | ✅ |
| `<main>` content | 1056 | 224 | 1280 | `lw-app-main flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6` (24px padding each side) | ✅ |
| inner `space-y-5` wrapper | 1008 | 248 | 1256 | `space-y-5` (no max-w constraint) | ✅ |
| KPI grid | 1008 | 248 | 1256 | `grid grid-cols-2 sm:grid-cols-4 gap-3` — 4 cols × 243px | ✅ fills container |
| KPI card single | 243 | (varies) | (varies) | `bg-card border border-subtle rounded-xl p-5` | ✅ |
| Filter chip row + actions | 1008 | 248 | 1256 | `flex items-center justify-between gap-2 flex-wrap` | ✅ width-utilized |
| **View-toggle pill (Грид/Доска)** | **322** | **248** | **570** | `flex bg-white/[0.04] rounded-lg p-0.5 gap-0.5 border border-subtle` | **🚨 686px void к right** |
| Project card grid | 1008 | 248 | 1256 | `grid sm:grid-cols-2 lg:grid-cols-3 gap-4` — 3 cols × 325px | ⚠️ could be 4 cols on ≥1280 |
| Project card single | 325 | (varies) | (varies) | `bg-card rounded-xl border p-5 ...` | ✅ |
| ProjectStatusOverview grid | 966 | 269 | 1235 | `grid grid-cols-2 gap-2` — 2 cols × ~475px | ✅ fills container |

**Body overflow:** ❌ none (`bodyHasOverflow: false`) — no horizontal scroll
**document.documentElement width:** 1280 (matches viewport)

---

## Layout problems — structured report

### Problem 1 — 🚨 View-toggle pill orphaned в its own row, 686px void к right

**File:** `src/app/(app)/projects/page.tsx`
**Lines:** 106-128
**Section:** "View toggle" row (Грид / Доска / Календарь / Гантт buttons)

**Current behavior:**
- Parent: `<div className="flex items-center gap-2 flex-wrap">` (line 106)
- Sole child: pill group containing 4 view buttons (List/Board/Timeline/Gantt)
- Pill width measures **322px**; row reaches **1008px** of available width
- Result: **686px of empty space к right of the pill** — `gap-2` + `flex-wrap` does nothing because there's only one child

**Visible gap:** 686px void к the right of the pill (~68% of available width unused)

**Possible cause:**
1. The toggle row was originally designed к hold OTHER controls к the right of the pill (e.g., a search field, label filter inline, или Quick filters), but those were moved elsewhere — leaving the pill alone
2. Or the row was designed для mobile where wrap behavior matters, but на desktop the row is overly tall (50px) для just а 322px pill
3. No `justify-between`, `justify-center`, or sibling element к balance the row visually

**Suggested fixes (pick один):**

**A. Place view-toggle inline с the filter chip row (same line as Все/Active/Pending/...)**
- Move `<div className="flex items-center gap-2 flex-wrap">` content into the filter chip row's right side using `ml-auto` on the pill OR restructure the parent flex container
- Net effect: filter chips left, view toggle right, both on one line — uses full 1008px elegantly
- Risk: на mobile (<640px) the toggle wraps к next line, but `flex-wrap` already handles that

**B. Move view-toggle right-aligned с `justify-end` or `ml-auto`**
- Change line 106 к `<div className="flex items-center gap-2 flex-wrap justify-end">`
- Pill moves к right edge; still uses single row but right-justified
- Reads cleanly с the filter chips above (left-justified) — natural eye flow
- Lowest-risk change (1-class swap)

**C. Add complementary content к the right side** (defer)
- Quick filter combobox / "Show only with budget" toggle / "Sort by" dropdown — populate the void
- Requires product decision не just layout fix

**Recommendation:** **Fix A** if Ramiz wants compact 1-row pattern (saves 50px vertical). **Fix B** if he wants к keep 2-row separation but reduce void perception (lowest risk).

---

### Problem 2 — ⚠️ Project card grid stops at 3 columns; could fit 4 on ≥1280px

**File:** `src/app/(app)/projects/page.tsx` → `ProjectBoard.tsx:144` (where the grid lives)
**Lines:** `grid sm:grid-cols-2 lg:grid-cols-3 gap-4` (ProjectBoard.tsx:144)
**Section:** "Project cards grid" rendered by ProjectFilters → ProjectBoard

**Current behavior:**
- Container: 1008px wide
- Breakpoints: 1 col mobile → 2 cols sm (≥640px) → 3 cols lg (≥1024px)
- Cards at 1280×1024: 3 × 325px + 2 × 16px gap = 1007px used → ✅ fills container
- BUT each card has 325px width — comfortable but не tight density; **на ≥1280px viewport we have room для 4 cols** (1008 − 48 gap) / 4 = **240px per card**, which is still readable

**Visible gap:** no left/right void, но cards visually "spaced out" с lots of internal whitespace per card

**Possible cause:**
- Tailwind grid breakpoints stop at `lg:grid-cols-3`. No `xl:grid-cols-4` к leverage wider screens
- Designer assumed ≥1024px = max useful column count

**Suggested fixes:**

**A. Add `xl:grid-cols-4` to the grid line** (lowest-risk)
- Change to `grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- On 1280×1024 the xl breakpoint engages (Tailwind v4 `xl` = 1280px)
- Each card shrinks от 325px к 240px — still room для project title, dates, budget pill

**B. Add `2xl:grid-cols-5` too** for ≥1536px monitors (deferred polish)

**Recommendation:** **Fix A** with а quick visual test that 240px-wide card doesn't break long project-title wrapping. If titles need ≥260px, defer 4-col к `2xl` breakpoint instead.

---

### Problem 3 — ⚠️ "Метки" (Labels) filter row width — measurement inconclusive

**File:** `src/app/(app)/projects/ProjectFilters.tsx`
**Lines:** 122-159
**Section:** Labels filter row at top of ProjectFilters

**Current behavior:**
- DOM evaluate query found `labelFilterRow: []` — couldn't locate row via text-content match for "Метки"
- Likely cause: labels row only renders когда `allLabels.length > 0` — test fixture had 0 labels OR row text doesn't start with "Метки" (could be wrapped в children)
- Line 125 structure: `<div className="flex flex-wrap items-center gap-2">` containing label `<span>` + "Все" button + label buttons

**Hypothesis (per Ramiz observation "row занимает ~750px из ~1040px usable"):**
- Labels row is `flex flex-wrap items-center gap-2` — fills width as needed
- If user has 5-10 labels, total horizontal extent ~700-800px (each label ~50-100px depending text length)
- Leaves ~200-300px void к right
- **NOT а layout bug per se** — это natural width-based wrap behavior

**Possible cause:**
- Row uses `gap-2` not `gap-x-2 gap-y-2` (which is same thing на flex-wrap), and flex-wrap inherently leaves trailing void on last row
- No `justify-between` would stretch labels, but уtem density would feel uneven

**Suggested fix (defer unless visually problematic):**
- Add `ml-auto` к а sibling element on the right (e.g. а "Selected count" badge OR а "Clear labels" mini-button) — fills the void semantically
- OR accept the natural flex-wrap void (200-300px is не visually offensive at 1280)

**Recommendation:** DEFER. Wait для visual review of screenshot. Если visually OK, no fix needed.

---

### Problem 4 — ℹ️ "Выбрать всё" checkbox в void

**Location:** Likely ProjectBoard.tsx selection-mode UI (line ~107: `<div className="flex items-center gap-3 bg-accent-subtle border border-accent/30 rounded-xl px-4 py-3 mb-3">`)

**Note:** Not captured в DOM measurements because the checkbox renders only когда selection-mode is active (toggleable). My anon-authed capture didn't have it active.

**Hypothesis:**
- Selection bar has structure: `<div class="flex items-center gap-3 bg-accent-subtle ... px-4 py-3">` (line 107 ProjectBoard.tsx)
- Inside: checkbox + selected count, then `<div class="flex items-center gap-2 ml-auto">` (line 109) для secondary actions
- IF only checkbox is in the bar (no count, no actions), it sits flush left с the entire bar width к right of it

**Suggested fix:**
- Verify selection-bar fully populates с checkbox + selected count + bulk-actions
- Если only checkbox renders в some states, add а filler element OR collapse the bar к narrower width

**Recommendation:** Need а capture с selection mode ACTIVE к diagnose. Skip in this pass.

---

## Container constraint analysis — why 1008px

```
viewport (1280px)
  └─ <body>
      └─ <div class="flex h-screen ...">  ← app shell, full-width
          ├─ <aside class="w-56 ...">  ← sidebar, fixed 224px wide
          └─ <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
              │   computed width: 1280 - 224 = 1056px
              │   computed padding: 24px on left + 24px on right
              │   inner usable width: 1056 - 48 = 1008px
              └─ <div class="space-y-5">  ← page content wrapper
                      ↳ width 1008px, no max-w-* constraint
```

**No max-w bottleneck.** The 1008px usable area is а function of viewport (1280) minus sidebar (224) minus padding (48). All correctly computed.

**Project card grid uses 1008px fully (3 cols).** KPI grid uses 1008px fully (4 cols). Filter chip row uses `flex-wrap` so it ranges based на content. View-toggle row uses only 322px из 1008px = **dominant single source of visual imbalance**.

---

## Visual file inventory

- `work-projects-viewport-1280.png` — top viewport (1280×1024) capture
- `work-projects-fullpage-1280.png` — full-page scroll capture (same size as viewport since page height ≤1024)
- `work-projects-dom-grep.txt` — output of `grep -E "max-w-|grid-cols-|w-[0-9]|flex-|justify-|ml-auto|space-y"` across 6 files (83 lines)
- `projects-dom-measurements.json` — raw `page.evaluate` measurement output (3.5 KB)

---

## Action items для Ramiz scoping

Prioritized fix recommendations (Ramiz decides scope):

| # | Problem | Suggested fix | Effort | Risk |
|---|---|---|---|---|
| 1 | View-toggle 686px void | Fix B: add `justify-end` к page.tsx:106 wrapper | 1 class swap, ~1 min | Lowest |
| 1' | View-toggle 686px void | Fix A: merge с filter chip row (1-row pattern) | 5-10 min refactor | Low |
| 2 | Project cards stop at 3 cols | Add `xl:grid-cols-4` к ProjectBoard.tsx:144 | 1 class addition, ~1 min | Low (verify 240px card titles) |
| 3 | Labels row natural void | DEFER unless visually problematic | — | — |
| 4 | Selection checkbox void | Re-capture с selection mode ACTIVE first | — | — |

---

## Cross-references

- **lancerwise main HEAD at capture:** `b2627dda`
- **lancerwise-screenshots commit (this diagnostic):** TBD after push
- **Source files inspected:**
  - `src/app/(app)/projects/page.tsx` (167 lines)
  - `src/app/(app)/projects/ProjectFilters.tsx` (266 lines)
  - `src/app/(app)/projects/ProjectBoard.tsx` (283 lines)
  - `src/app/(app)/projects/ProjectTimeline.tsx` (125 lines)
  - `src/app/(app)/projects/ProjectStatusOverview.tsx` (90 lines)
  - `src/app/(app)/projects/BudgetOverviewWidget.tsx` (121 lines)
- **Tooling:** isolated Python Playwright + Supabase Admin magic-link auth (MCP Playwright was locked by parallel agent)

---

**NO CODE CHANGES applied к lancerwise repo.** Diagnostic only.
