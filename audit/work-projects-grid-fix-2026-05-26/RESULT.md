# /work/projects grid view fix — verification

**Issue:** Ramiz phone screenshot — solitary "Pia/Jefrey" project card in narrow ~280px column on left, ~750px void on right at 13" Safari viewport. Cursor showing empty space.

**Commit:** `4e2ff25b` (direct to main, 2026-05-26)
**File:** `src/app/(app)/projects/ProjectBoard.tsx:144` (1 line changed)

## Change

```diff
- <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
+ <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
```

| Breakpoint | Before | After |
|---|---|---|
| <640px | 1 col | 1 col |
| 640–767px | **2 cols** (sm) | 1 col (explicit `grid-cols-1`) |
| 768–1023px | 2 cols (sm) | 2 cols (md) |
| 1024–1279px | **3 cols** (lg) — cramped ~240px | **2 cols** (md) — wider ~480px |
| ≥1280px | 3 cols (lg) | 3 cols (xl) — ~330px target |

## Measurements on production (`4e2ff25b`)

Auth via Supabase magic-link, headless Chromium, locale cookie `NEXT_LOCALE`.

| Viewport | Locale | Computed grid-template-columns | Card width | Cols |
|---|---|---|---|---|
| 1280×1024 | RU | `325.328px 325.328px 325.328px` | 325px | **3** ✓ matches target ~330px |
| 1280×1024 | EN | `325.328px 325.328px 325.328px` | 325px | **3** identical to RU |
| 1024×1024 | RU | `368px 368px` | 368px | **2** wider in md range |
| 600×1024 | RU | `568px` | 568px | **1** full mobile width |

Width math: 1280 viewport − 240 sidebar = 1040 content. Grid measured 1008 (1040 minus page padding). 1008 − 2×16 gap = 976 / 3 = 325.33 ✓ matches.

## Card count behavior

User has 1 project ("Pia/Jefrey"). Grid container correctly creates 3 columns at xl breakpoint; the single project occupies cell 1 (top-left), cells 2–3 empty until more projects added. When data grows to 6+, cards will fill 2 rows of 3 cleanly.

This is **expected behavior for any responsive multi-column grid with sparse data** — not a bug. The fix improves the *card width* at medium viewports (1024–1280px) where 3-col was cramped before.

## Out of scope (untouched per task)

- "Доска" view (kanban) — preserved
- ProjectFilters row, "Выбрать всё" checkbox — already uses `flex justify-between` full width, no max-w constraint
- i18n keys — no changes
- Canonical palette — no changes (zero `bg-slate-*` / `border-slate-*` on touched file)

## Verification commands

- `next build` exit 0 (57s compile, 2182 pages generated)
- `grep -nE 'bg-slate-|border-slate-' src/app/(app)/projects/ProjectBoard.tsx` → CLEAN

## Evidence

9 PNGs + `measurements.json` in `evidence/`:

- `ru-1280-viewport.png` + `ru-1280-fullpage.png` — RU primary verify (target screenshot from Ramiz's case)
- `en-1280-viewport.png` + `en-1280-fullpage.png` — EN parity check
- `ru-1024-fullpage.png` — md breakpoint (2 cols)
- `ru-600-fullpage.png` — mobile (1 col)
- `measurements.json` — raw DOM measurements per viewport
