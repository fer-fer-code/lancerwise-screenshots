# /insights (== /analytics) Phase 1 i18n + palette fix — verification

**Commit:** `841b8dbc` (direct to main, 2026-05-26)
**File:** `src/app/(app)/analytics/page.tsx` (1 file, 78+/50−)
**Notes:** /insights is re-export of /analytics — both routes share this fix.

## Scope (Phase 1 — main page.tsx only)

| Block | Before | After |
|---|---|---|
| DOW labels | `const DOW_LABELS = ['Sun', 'Mon', ...]` | `DOW_KEYS` + `t(\`charts.dow.${key}\`)` |
| Aging bucket labels | inline `'Not yet due'`, `'1–30 days overdue'` etc. | `labelKey` field + `t(\`aging.${labelKey}\`)` |
| Month formatter | `d.toLocaleString('en', ...)` | `d.toLocaleString(monthLocale, ...)` via `getLocale()` |
| Wrapper width | `max-w-4xl` (896px) | `max-w-6xl` (1152px) |
| `text-slate-100` | 8 instances | `text-text-primary` |
| `text-slate-200` | 5 instances | `text-text-secondary` |
| `text-slate-400` | 15+ instances | `text-text-muted` |
| `hover:text-slate-200` | 1 instance | `hover:text-text-secondary` |
| `hover:text-indigo-300` | 2 instances | `hover:text-violet-300` |
| `text-indigo-300` | 1 instance (pipeline) | `text-violet-300` |
| `text-indigo-200` | 1 instance | `text-violet-200` |
| `bg-violet-200` | 2 (revenue chart dim + project track) | `bg-violet-700/30` |
| `bg-purple-200` | 1 (rate trend dim) | `bg-purple-700/30` |
| `bg-violet-100` | 1 (DoW weekday total) | `bg-violet-700/30` |
| `bg-orange-100` | 1 (DoW weekend total) | `bg-orange-700/30` |

**Preserved (intentional brand/semantic):** `bg-violet-600/500/400`, `bg-violet-900/20 border-violet-800/40` (pipeline shell), `bg-red-950/30 border-red-800/40 text-red-400` (semantic error), `text-orange-400` (semantic weekend label), `bg-card/50 border-subtle`, `bg-canvas`, `bg-elevated/40` (already canonical).

## Verification on production `841b8dbc`

### Layout measurements (1280×1024 viewport)

| Metric | RU | EN |
|---|---|---|
| viewport width | 1280 | 1280 |
| sidebar width | 224px | 224px |
| `<main>` width | 1056px | 1056px |
| wrapper (max-w-6xl) measured width | **1008px** | 1008px |
| void to right of wrapper | **24px** (standard gutter) | 24px |
| main scroll height | ≈10691px | 9731px |

Void was 112px @ max-w-4xl; now 24px @ max-w-6xl — bottleneck closed. Wrapper fills usable column.

### DOW labels (charts.dow.* lookup verified)

| Locale | Captured DOW labels |
|---|---|
| **RU** | `Вс Пн Вт Ср Чт Пт Сб` ✓ |
| **EN** | `Sun Mon Tue Wed Thu Fri Sat` ✓ |

Programmatically extracted from DOM via `span.text-xs` inside "Productivity by Day of Week" / "Производительность по дням недели" card.

### Aging bucket labels

User account has 4 unpaid invoices — aging section renders. Bucket labels in RU shown as `Не просрочено / 1–30 дней просрочки / 31–60 дней / 60+ дней`. Programmatic DOM extract returned `[]` due to scroll position in capture; visual verification only.

### Month chart labels (locale-aware)

Captured in `Monthly Expenses — Last 6 Months` (sub-widget consuming main page's `months[]` array): RU shows `дек. 25 г. / янв. 26 г. / февр. 26 г. / март 26 г. / апр. 26 г. / май 26 г.` — confirms `monthLocale` fix propagates to consumers of the shared months prop.

## Phase 2 backlog — sub-widgets remain EN (out of scope, per task)

Programmatic EN-text leak detection in RU locale found **40+ sub-widget titles** still in English. Flagged for Phase 2:

```
Work Activity Heatmap          My Freelancer Stats Card      Profit & Loss
Work Hours Heatmap             Profit Calculator             Tax Estimate
Revenue Calendar               Set an annual revenue goal    Revenue by Day of Week
Monthly Expenses               Work Hours by Day             Client Segments
TOP CATEGORIES                  Invoice Conversion Funnel    Top Projects by ROI
Billable Ratio                 Invoice Volume                Avg Hours by Day of Week
Year to Date                    Industry Benchmark            14-Day Income + Hours
Client Growth                  Revenue vs Expenses           Client Acquisition
Projects Started per Month     Client Repeat Rate            Projects per Client
Invoice Win Rate               Invoice Status Funnel         Revenue vs Hours Trend
Invoice Velocity               Client Lifecycle Stages
```

≥40 widgets out of estimated ~140 sub-components — same pattern as /work/time Phase 2-3 in progress. These have SEPARATE i18n status and **were explicitly out of scope for Phase 1** per task directive.

## Build verification

- `npx next build` exit 0 (47s compile, 2182 pages generated)
- `grep -nE 'text-slate-|bg-violet-200|bg-purple-200|bg-violet-100|bg-orange-100|indigo'` on touched file → **0 hits** (clean)
- `messages/en.json` + `messages/ru.json` valid (52 namespaces each, added `charts.dow` + 4 `aging.bucket*` keys)

## Evidence

`evidence/`:
- `ru-top.png` — Аналитика hero + Work Activity Heatmap (sub-widget EN) + Активность работы header (RU) + KPI cards (RU)
- `ru-mid-upper.png` — Profit Calculator (sub-widget EN) + Monthly Expenses chart (RU month labels) + Profit & Loss
- `ru-mid-lower.png` — middle of long sub-widget section
- `ru-mid-bottom.png` — Client Growth, Revenue vs Expenses, Client Acquisition (sub-widgets EN)
- `ru-bottom.png` — Revenue vs Hours Trend, Invoice Velocity, Client Lifecycle Stages
- `en-top.png` / `en-mid.png` / `en-bottom.png` — EN parity
- `measurements-v3.json` — programmatic DOM measurements
