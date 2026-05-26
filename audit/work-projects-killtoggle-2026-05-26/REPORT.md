# Kill Duplicate ViewToggle на /work/projects — Verification Report

**Date:** 2026-05-26
**Fix commit:** `d31c29cb` (direct push на main, lancerwise repo)
**Viewport tested:** 1280 × 1024 (13" Safari simulation)
**Auth:** Supabase Admin magic-link для krokusstudia2@gmail.com

---

## Verdict: ✅ Legacy ViewToggle FULLY REMOVED — top-tabs single source of truth

### Production probe results

| Metric | Before fix (diagnostic) | After fix (just now) |
|---|---:|---:|
| Pill containers с class `flex bg-white/[0.04] rounded-lg p-0.5` | 2 | **1** ✅ |
| "Грид" button count | 1 (legacy ViewToggle EN→RU label) | **0** ✅ |
| "Доска" button count | 1 (legacy ViewToggle) | **0** ✅ |
| Top-tabs preserved (List/Board/Timeline/Gantt) | 1 | **1** ✅ (unchanged) |
| Pill text (single remaining) | — | `"ListBoardTimelineGantt"` ← top-tabs от page.tsx |

**Result:** Page now has exactly **one** view-toggle pill — the top-tabs in page.tsx с 4 view links (List/Board/Timeline/Gantt). The legacy in-component `ViewToggle` (which had only Grid/Board labels and lived inside ProjectBoard.tsx) is fully gone.

---

## Code-level changes (commit `d31c29cb`)

`src/app/(app)/projects/ProjectBoard.tsx` — 1 insertion, 106 deletions

| Removed | Why |
|---|---|
| `useState [view, setView] = useState<'grid' \| 'board'>('grid')` | State unused after toggle removal |
| `const ViewToggle = () => (...)` component | The duplicate pill |
| `if (view === 'grid') { return ... }` conditional wrapper | Always-grid behavior moved к top-level return |
| Entire kanban `return (...)` block (~65 lines) | Dead code — /projects/board route uses separate `KanbanBoard.tsx` |
| `const COLUMNS = [...]` | Only used by deleted kanban block |
| `dueBadgeClass()` + `dueBadgeLabel()` helpers | Only used by deleted kanban block |
| `<ViewToggle />` inside grid header row | The pill instance itself |

| Changed | Why |
|---|---|
| Grid header row `flex items-center justify-between` → `flex items-center` | Was justify-between for `[select-all] [ViewToggle]`; only select-all remains so just left-align |

File size: 284 → 178 lines (−37%)

---

## Acceptance criteria checklist

| Criterion | Result |
|---|:---:|
| ViewToggle component declaration deleted | ✅ |
| `useState [view, setView]` deleted | ✅ |
| `if (view === 'grid')` conditional render deleted | ✅ |
| Kanban return block deleted (orphaned legacy) | ✅ |
| `<ViewToggle />` removed от header row | ✅ |
| Only 1 pill container на /work/projects (top-tabs от page.tsx) | ✅ (probe count = 1) |
| Grid view renders correctly (default behavior) | ✅ |
| /projects/board separate route unaffected | ✅ (uses own KanbanBoard.tsx) |
| TSC project verify exit 0 | ✅ clean |
| Direct commit на main | ✅ `d31c29cb` |
| Commit message format | ✅ `fix(work/projects): remove legacy in-component ViewToggle — top-tabs single source of truth` |

---

## Artifacts

- `REPORT.md` (this file)
- `work-projects-after-killtoggle-viewport.png` (1280×1024 viewport)
- `work-projects-after-killtoggle-fullpage.png` (fullPage scroll capture)

Cross-refs:
- Diagnostic: [`audit/work-projects-layout-diagnostic-2026-05-26/`](../work-projects-layout-diagnostic-2026-05-26/)
- Fix #1 (justify-end): [`audit/work-projects-layout-fix-2026-05-26/`](../work-projects-layout-fix-2026-05-26/)

---

## Summary line per Ramiz spec

**HEAD SHA: `d31c29cb`** | **pill containers: 2 → 1** (top-tabs only) | **`Грид`/`Доска` button count: 0** (legacy ViewToggle fully removed) | **file: 284 → 178 lines** (−37%)
