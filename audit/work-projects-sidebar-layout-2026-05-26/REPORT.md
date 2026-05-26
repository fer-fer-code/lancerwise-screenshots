# Variant C — Sidebar Layout Verification Report

**Date:** 2026-05-26
**Fix commit:** `1af51e44` (lancerwise main)
**Viewport tested:** 1280 × 1024 (13" Safari simulation)
**Auth:** Supabase Admin magic-link для krokusstudia2@gmail.com

---

## Verdict: ✅ Split layout live, void filled

| Measurement | Spec target | Actual | Verdict |
|---|---|---|:---:|
| Container width | 1008px | **1008** | ✅ |
| Left col width (cards) | ~660px | **665** | ✅ |
| Right col width (aside) | ~330px | **323** | ✅ |
| Gap between cols | gap-5 (20px) | **20** (913→933) | ✅ |
| Horizontal void к right of aside | 0px | **0** (aside.right = 1256 = container.right) | ✅ |
| Aside widget count visible | 3-4 widgets | **3** (4th conditional) | ✅ |
| Bottom-of-page widgets gone | 0 | **0** (root has only header + KPI + split) | ✅ |

---

## DOM measurements (1280×1024 viewport)

### Split grid wrapper

```
class: "grid grid-cols-1 xl:grid-cols-3 gap-5"
width: 1008px (left=248 → right=1256)
children: 2 (leftCol + aside)
```

### Left column (project content)

```
class: "xl:col-span-2 space-y-5"
width: 665px (left=248 → right=913)
contains: <ProjectTimeline /> + <ProjectFilters />
```

### Aside (sidebar widgets)

```
class: "xl:col-span-1 space-y-4"
width: 323px (left=933 → right=1256)
widgetCount: 3
widget titles (in order):
  1. "Project Overview"     (ProjectStatusOverview — relocated)
  2. "Recent activity"      (RecentProjectActivity — NEW)
  3. "Upcoming deadlines"   (ProjectDeadlines — NEW)
```

4th widget `BudgetOverviewWidget` is conditional (`projectsWithBudget.length > 0`). Test account had no projects with `budget_hours` или `budget_amount`, so it didn't render — expected behavior per page.tsx conditional.

### Root structure (`<main> > div.space-y-5`)

```
3 children, top → bottom:
  1. flex flex-col gap-3      (filter chips + view toggle row, top=88)
  2. grid-cols-2 sm:grid-cols-4 (KPI cards, top=214)
  3. grid grid-cols-1 xl:grid-cols-3 (NEW split layout, top=338)
```

Bottom-of-page `<ProjectStatusOverview />` + `<BudgetOverviewWidget />` no longer present at root level — they moved к aside.

---

## Code-level changes (commit `1af51e44`)

**Files: 5 changed, +278 / −4 lines**

| File | Change |
|---|---|
| `src/app/(app)/projects/page.tsx` | +21 / −4 — restructured displayed render block с split layout grid, added 2 widget imports |
| `src/app/(app)/projects/RecentProjectActivity.tsx` | **NEW** 150 lines — server async, queries time_entries + invoices last 7d + new projects, sorts top 5 events |
| `src/app/(app)/projects/ProjectDeadlines.tsx` | **NEW** 77 lines — server, accepts projects[], sorts by due_date asc, top 5 c day-delta + urgency colors |
| `messages/en.json` | +17 lines — `projectsPage.recentActivity` (7 keys) + `projectsPage.deadlines` (6 keys) |
| `messages/ru.json` | +17 lines — full EN/RU parity |

### Component design

**RecentProjectActivity** queries 3 streams в parallel:
- `time_entries` (last 7d) — formats к "Logged 2.5h on {project}"
- `invoices` с `sent_at >= 7d` OR `paid_at >= 7d` — "Invoice #123 sent" / "Invoice #123 paid"
- `projects` с `created_at >= 7d` — "Project {name} created"

Merges → sorts by timestamp desc → top 5. Icons: Clock (time), Receipt (sent), CheckCircle2 (paid), Sparkles (created). Empty state: "No activity yet" + hint.

**ProjectDeadlines** filters projects с `due_date` AND `status в [active, pending]`. Day-delta math (today=0, tomorrow=1, in N days, overdue по N days). Color urgency: error <0, error <=3, warning <=7, secondary <=14, muted >14.

---

## Responsive behavior

| Viewport | Layout |
|---|---|
| xl+ (≥1280px) — Ramiz 13" Safari | 2/3 + 1/3 split с sidebar widgets right ✅ |
| lg + below (<1280px) | grid-cols-1 → widgets stack full-width below content ✅ |

No regression на mobile / tablet — graceful single-column fallback via `grid-cols-1`.

---

## i18n keys added (full EN/RU parity)

### projectsPage.recentActivity

| Key | EN | RU |
|---|---|---|
| title | "Recent activity" | "Недавняя активность" |
| empty | "No activity yet" | "Пока нет активности" |
| emptyHint | "Track time or send an invoice" | "Учтите время или отправьте счёт" |
| timeLogged | "Logged {duration} on {project}" | "Учтено {duration} в {project}" |
| invoiceSent | "Invoice {number} sent" | "Счёт {number} отправлен" |
| invoicePaid | "Invoice {number} paid" | "Счёт {number} оплачен" |
| projectCreated | "Project {name} created" | "Создан проект {name}" |

### projectsPage.deadlines

| Key | EN | RU |
|---|---|---|
| title | "Upcoming deadlines" | "Ближайшие дедлайны" |
| empty | "No deadlines" | "Без дедлайнов" |
| today | "today" | "сегодня" |
| tomorrow | "tomorrow" | "завтра" |
| inDays | "in {count}d" | "через {count} дн." |
| overdue | "{count}d overdue" | "просрочено на {count} дн." |

---

## Palette compliance

`grep -E "bg-slate-|border-slate-|text-slate-|bg-gray-|border-gray-|text-gray-"` on RecentProjectActivity.tsx + ProjectDeadlines.tsx returns **0 matches**. All canonical tokens (`bg-card`, `border-subtle`, `text-text-primary/muted/secondary`, `text-accent`, `text-success`, `text-warning`, `text-error`). ✅

---

## Acceptance criteria checklist

| Criterion | Status |
|---|:---:|
| Split layout: left 2/3 + right 1/3 на xl | ✅ (665 + 323 of 1008, +20 gap) |
| Sidebar widgets fill right column | ✅ (3 widgets rendered) |
| BudgetOverviewWidget conditional preserved | ✅ (hidden когда no budget projects) |
| Bottom render of ProjectStatusOverview removed | ✅ |
| Bottom render of BudgetOverviewWidget removed | ✅ |
| RecentProjectActivity.tsx created | ✅ (150 lines, server async) |
| ProjectDeadlines.tsx created | ✅ (77 lines, server) |
| i18n keys added к both locales с parity | ✅ (13 new keys × 2 locales = 26 entries) |
| Canonical palette (no slate/gray drift) | ✅ |
| TSC project: 0 NEW errors on touched files | ✅ |
| Direct commit на main | ✅ `1af51e44` |
| Commit message format | ✅ `feat(work/projects): split layout с sidebar widgets — fill horizontal void` |
| Playwright 1280×1024 fullPage capture | ✅ |

---

## Artifacts

- `REPORT.md` (this file)
- `work-projects-sidebar-viewport.png` (1280×1024 viewport)
- `work-projects-sidebar-fullpage.png` (fullPage scroll capture, 147 KB)

Cross-refs (prior /work/projects fixes сегодня):
- [Diagnostic](../work-projects-layout-diagnostic-2026-05-26/) — initial measurement, surfaced 686px void
- [Fix #1 justify-end](../work-projects-layout-fix-2026-05-26/) — moved view-toggle right
- [Kill ViewToggle](../work-projects-killtoggle-2026-05-26/) — removed legacy duplicate
- **This (Variant C):** structural void elimination through content fill

---

## Summary line per Ramiz spec

**HEAD SHA: `1af51e44`** | **cards col: 665px** (target ~660) | **sidebar col: 323px** (target ~330) | **horizontal void: 0px** | **3 widgets в sidebar** (Project Overview / Recent activity / Upcoming deadlines)
