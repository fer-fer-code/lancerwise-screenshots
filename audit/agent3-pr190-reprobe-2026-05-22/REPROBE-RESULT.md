# PR #190 RU i18n 4 routes (#155 partial) re-verify

**Verdict:** ✅ **PASS partial — major customer-facing strings translated; residual English bleed on 4 specific surface categories (action buttons, table headers, DB-data values, view toggles)**
**Date:** 2026-05-23
**PR merge SHA:** `205e7c34`
**Vercel deploy READY:** 2026-05-22T18:54:04Z
**Probe author:** [AGENT 3]
**Original bug:** QA-001 + QA-009 in `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` + P1-1 + P1-6 in `../agent3-p1-repro-prep-2026-05-22/`

---

## TL;DR

PR #190 makes substantial progress on the RU i18n gap. Page headings, KPI labels, primary CTAs, filter chips, sub-nav, and empty-state copy are now translated across all 4 routes. EN locale unchanged (no regression). **Residual English bleed-through** is concentrated in 4 categories: secondary action buttons (Filters/More/View/Sort), table column headers, view-mode toggles (Grid/Board), and DB-stored data values (status badges, tag pills) — these are tracked as Phase-2 follow-up per the i18n root-cause analysis. **/contracts is essentially done (99%+); /clients ≈70%; /invoices ≈70%; /projects ≈80%**.

---

## Verdict matrix — 4 routes × 2 locales

### RU locale (key fix verification)

| Route | Heading | KPI labels | Primary CTAs | Filter chips / sub-nav | Residual EN leaks | Verdict |
|-------|:------:|:-----:|:------:|:------:|:-----:|:------:|
| `/clients` | ✅ "Клиенты" | ✅ ВСЕГО КЛИЕНТОВ / АКТИВНЫЕ / ДОХОД С НАЧАЛА ГОДА / С ПРОСРОЧКОЙ | ✅ "+ Новый клиент / Воронка" | partial — table headers EN, filter chips partial | 11 strings | ✅ **partial** |
| `/invoices` | ✅ "Счета" | ✅ ОПЛАЧЕНО / В ОЖИДАНИИ / ПРОСРОЧЕНО / НЕ ВЫСТАВЛЕНО | ✅ "+ Новый счёт / Шаблоны / Взыскания" | ✅ filter chips translated ("4 черновик / 4 отправлено / 5 оплачено / 2 просрочено") | 16 strings (mostly status badges + table headers) | ✅ **partial** |
| `/projects` | ✅ "Проекты" | ✅ АКТИВНЫЕ / В ОЖИДАНИИ / АКТИВНЫЙ БЮДЖЕТ / ВСЕГО ЗАРАБОТАНО | ✅ "+ Новый проект / Создать через AI" | ✅ filter chips + view tabs translated ("Список / Доска / Лента / Гантт") | 12 strings | ✅ **best partial** |
| `/contracts` | ✅ "Договоры" | (no KPIs on this page) | ✅ "+ Новый договор / Создать через AI" | ✅ sub-nav (Все договоры / Создать / Шаблоны / Подписки) + empty state copy translated | 1 string ("More") | ✅ **99% DONE** |

### EN locale (regression check)

| Route | Heading | KPI labels | All UI strings English | Verdict |
|-------|:------:|:-----:|:--:|:------:|
| `/clients` | "Clients" | TOTAL CLIENTS / ACTIVE / REVENUE YTD / WITH OVERDUE | ✓ | ✅ unchanged |
| `/invoices` | "Invoices" | PAID / PENDING / OVERDUE / UNBILLED | ✓ | ✅ unchanged |
| `/projects` | "Projects" | ACTIVE / PENDING / ACTIVE BUDGET / TOTAL EARNED | ✓ | ✅ unchanged |
| `/contracts` | "Contracts" | (no KPIs) | ✓ | ✅ unchanged |

**Aggregate:** ✅ **4 of 4 routes show major RU progress** + ✅ **4 of 4 EN routes unchanged**. **PR #190 makes #155 substantially closer to closure.**

---

## Residual English-bleed taxonomy

Categorising the remaining ~40 string leaks across the 4 routes:

### Category 1: Action buttons (most common leaks)
- "More" (all 4 routes)
- "Filters" (clients, invoices, projects)
- "Quick" (invoices)
- "Remind" (invoices)
- "View →" link (clients, invoices)

**Suspected:** Hardcoded in shared `MoreActions.tsx`, `ListFilters.tsx`, etc. shared UI components — single source likely.

### Category 2: Table column headers
- /clients: CLIENT / TIER / CONTACT / STATUS / TAGS / HEALTH / REVENUE / ADDED / LAST ACTIVE
- /invoices: INVOICE / CLIENT / AMOUNT / DUE DATE / STATUS

**Suspected:** Inline in `page.tsx` or shared table components.

### Category 3: View-mode toggles
- /projects: "Grid / Board" toggle (right side)
- /clients: filter chips "Active / Prospect / Inactive / All Tiers / Gold / Silver / Bronze / New"
- /invoices: sort options "Sort: Date / Amount / Client / Invoice #"

**Suspected:** Status enums + tier names. Tier names (Gold/Silver/Bronze) may be intentionally untranslated as proper-noun product taxonomy.

### Category 4: DB-stored data values (NOT a PR scope concern)
- Status badges: "active" / "paused" / "draft" / "sent" / "paid" / "overdue" / "pending"
- Tag pills: "design" / "development" / "marketing" / "consulting" / "priority" / "routine" / "q1"
- Project labels: "high-value / long-term / new-client / passive / retainer / urgent"

**These are stored in DB as literal English strings.** Per i18n root-cause analysis Phase 3, fixing these requires display-layer enum-to-i18n-key mapping (not just t() calls). Separate scope from PR #190.

### Category 5: Single-word strings that survived
- /invoices sub-nav "Recurring" (other sub-nav items translated)
- /clients "Search clients..." placeholder
- /clients "clients" count word in "8 clients"

---

## Critical evidence

### Visual proof — /clients RU
`EVIDENCE/after-pr190-clients-ru.png`:
- KPI cards top: "ВСЕГО КЛИЕНТОВ 8 / АКТИВНЫЕ 8 / ДОХОД С НАЧАЛА ГОДА $20,072 / С ПРОСРОЧКОЙ 2"
- "+ Новый клиент / Воронка / More" action buttons (More still EN)
- Filter chips: "Active / Prospect / Inactive / All Tiers / Gold / Silver / Bronze / New" — still EN
- Sub-nav: "Все клиенты / Воронка" ✓

### Visual proof — /invoices RU
`EVIDENCE/after-pr190-invoices-ru.png`:
- KPI: "ОПЛАЧЕНО / В ОЖИДАНИИ / ПРОСРОЧЕНО / НЕ ВЫСТАВЛЕНО"
- Banner: "5 счетов просрочено — $13,900 к получению" + "Очередь взысканий →"
- Filter chips: "Все (15) / 4 черновик / 4 отправлено / 5 оплачено / 2 просрочено"
- Buttons: "+ Новый счёт / Шаблоны / Взыскания (5) / More / Quick"
- Table headers + status badges remain EN

### Visual proof — /projects RU
`EVIDENCE/after-pr190-projects-ru.png`:
- KPI: "АКТИВНЫЕ 5 / В ОЖИДАНИИ 5 / АКТИВНЫЙ БЮДЖЕТ $30,383 / ВСЕГО ЗАРАБОТАНО $20,072"
- View tabs: "Список / Доска / Лента / Гантт" ✓
- Filter chips: "Все (20) / 5 активные / 5 в ожидании / 5 завершённые / 5 отменённые"
- Card status pills + label pills remain EN (DB data)

### Visual proof — /contracts RU (best result)
`EVIDENCE/after-pr190-contracts-ru.png`:
- Heading + sub-nav + buttons all translated
- Empty state: "Создайте первый AI-договор / Определите объём работ, условия и подписи за минуты..."
- "Сгенерировать через AI" / "Посмотреть шаблоны" CTAs
- Only "More" button remains EN

### Regression check — EN unchanged
`EVIDENCE/after-pr190-clients-en.png` (sanity sample): All English labels intact identical to pre-PR baseline.

---

## Pre-fix comparison

### Before PR #190 (from interactive QA EVIDENCE)
- `/clients` RU: KPI labels English ("TOTAL CLIENTS", "ACTIVE", "REVENUE YTD", "WITH OVERDUE")
- Page heading "Клиенты" was already translated
- Sub-nav "Все клиенты / Воронка" was already translated
- Filter chips, table headers, ALL English

### After PR #190
- KPI labels translated (4/4)
- Major CTAs translated
- View toggles translated (/projects)
- Filter chip categories partially translated (/invoices fully, /projects fully, /clients still EN)
- Empty state copy translated (/contracts)

**Net delta:** ~50% additional surface area now translated per route.

---

## Coverage scope claim verification

From P1-6 i18n coverage matrix (pre-fix):
- `/clients` was ~30% — now estimated ~70% ✅
- `/invoices` was ~30% — now estimated ~70% ✅
- `/projects` was ~30% — now estimated ~80% ✅
- `/contracts` was ~50% — now estimated ~99% ✅

PR #190 substantially closes the gap. Issue #155 has 4 routes at ~70-99% coverage.

---

## Recommendations

**✅ PR #190 cleared as partial.** The PR scope was explicitly "#155 partial" — and it delivered substantial progress on those 4 routes. Customer-facing perception of RU support is now significantly improved.

**Follow-up scope (Phase-2 i18n, NOT this PR):**

1. **Shared component sweep** — Audit `MoreActions.tsx`, `ListFilters.tsx`, `KPICard.tsx`, and other shared UI primitives for hardcoded English. Wrap in `t()` calls. Single-place fix benefits all routes simultaneously.

2. **Table column headers** — Extract header definitions to per-route translation keys. Possibly use a shared `<TableHeader t={...} />` pattern.

3. **View-mode toggles** ("Grid / Board" on /projects, "All Tiers" + tier chips on /clients) — Translate or document intentional non-translation for product taxonomy.

4. **DB-data enum mapping (Phase-3)** — Status badges ("draft", "paid", "sent", "overdue", etc.) and tag values ("design", "development", "marketing", etc.) are stored as literal English in DB. Add display-layer mapping:
   ```ts
   const statusLabel = { draft: t('status.draft'), paid: t('status.paid'), ... }
   ```
   This is the largest remaining scope — affects most surface area.

5. **Remaining 4 routes** — /work/time, /upgrade, /proposals, /dashboard widgets — per P1-6 matrix, these still need same treatment. Not in PR #190 scope.

---

## Cross-references

- Original P1: `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` § QA-001 + QA-009
- P1 repro docs: `../agent3-p1-repro-prep-2026-05-22/P1-1-i18n-gap-authed-routes.md` + `P1-6-i18n-coverage-matrix.md`
- i18n root-cause: `../agent3-i18n-rootcause-2026-05-22/ROOT-CAUSE-ANALYSIS.md`
- Pre-fix screenshots: `../agent3-comprehensive-qa-2026-05-21/EVIDENCE/page-screenshots/{clients,invoices,projects,contracts}_chromium_ru_desktop_above-fold.png`
- Sibling fixes verified this session: PR #154, #184, #186, #188, #189
