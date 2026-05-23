# Comprehensive visual tour — 16 pages × 2 viewports (RU locale)

**Date:** 2026-05-23
**Probe author:** [AGENT 3]
**Production:** https://www.lancerwise.com
**Locale focus:** RU (highest visibility for findings per Ramiz's spec)
**Fixture user:** `46b486d7-5fec-47af-a466-3295dc1c3b95` (Pro tier)
**Viewports:** Chromium 1440×900 desktop + WebKit iPhone 14 Pro 393×852 mobile
**Scope:** 16 pages explicitly NOT in Ramiz's prior coverage of 8 dashboard/money/work/insights routes
**Mode:** Inventory only — NO fixing

---

## TL;DR

32 screenshots captured (16 routes × 2 viewports). **3 dead URLs found in sidebar nav** (P2 launch concern). **11 of 16 routes have substantial RU translation gap** (P1 i18n — overlaps with known PR #190 follow-up scope). **1 emoji-as-icon pattern** on /notifications (P3). **1 onboarding inconsistency** — two paths exist (modal-on-dashboard vs 5-step /onboarding wizard) (P3 UX). **No horizontal overflow on any route on either viewport.** Dark theme consistent across all pages.

Most findings overlap with previously documented backlog (P1 i18n Phase-2, dead URL cleanup). Visual tour confirms scope but does not introduce new P0 blockers.

---

## Aggregate findings by category

| Category | Count | Notes |
|----------|:-----:|-------|
| **i18n bleed (English in RU)** | 11 routes | Same root cause as P1-1; not covered by PR #190 |
| **Dead URLs in sidebar** | 3 routes | /work/tasks, /insights/goals, /insights/reports → 404 |
| **404 page not localized to RU** | n/a | "Page not found" + recovery CTAs in English |
| **Emoji-as-functional-icon** | 1 route | /notifications uses 📄 emoji per item (P3) |
| **Onboarding pattern inconsistency** | 1 | Welcome modal on /dashboard + 5-step wizard at /onboarding both exist |
| **Mobile layout / overflow** | 0 horizontal-scroll | All routes responsive |
| **Mobile-specific tap-target concerns** | n/a | Inherited from prior E2E (P3) |
| **Color saturation / cohesion** | 0 | Dark theme uniform across all routes |
| **Date format inconsistency** | 1 | Desktop MM/DD/YYYY vs mobile DD.MM.YYYY (browser locale, not app) |
| **Other** | 1 | Page heading missing for /onboarding (top-bar says "LancerWise" not "Настройка") |

---

## Per-page issues table (16 routes)

### Route 1: `/clients` (Все клиенты) — desktop + mobile

| Aspect | Status | Notes |
|--------|:------:|-------|
| Page heading | ✅ | "Клиенты" |
| KPI labels | ✅ | "ВСЕГО КЛИЕНТОВ / АКТИВНЫЕ / ДОХОД С НАЧАЛА ГОДА / С ПРОСРОЧКОЙ" |
| CTAs | ⚠ | "+ Новый клиент / Воронка" RU; "More" still EN |
| Filter chips | ❌ | "Active / Prospect / Inactive / All Tiers / Gold / Silver / Bronze / New" all EN |
| Table headers | ❌ | "CLIENT / TIER / CONTACT / STATUS / TAGS / HEALTH / REVENUE / ADDED / LAST ACTIVE" all EN |
| Status/tag badges | ❌ | "active / paused / design / development / marketing" (DB enum, untranslated) |
| Search placeholder | ❌ | "Search clients..." EN |
| Mobile KPI labels | ⚠ | "ВСЕГО КЛИЕНТОВ" wraps 2 lines, "ДОХОД С НАЧАЛА ГОДА" wraps 3 lines (P3 — labels feel cramped) |
| EN words in body | 177 | RU coverage ~6% |
| Horizontal overflow | none | ✓ |

### Route 2: `/clients/pipeline` (Воронка)

| Aspect | Status | Notes |
|--------|:------:|-------|
| Page heading | ❌ | Top bar "Воронка" ✓ but page heading "Pipeline" EN |
| Subtitle | ❌ | "Leads and proposals across stages" EN |
| KPI labels | ❌ | "ACTIVE LEADS / PIPELINE VALUE / FOLLOW-UPS DUE" EN |
| KPI VALUES | ✅ | "USD 37,000" — Pipeline NaN fix (#188) verified |
| Stage column headers | ❌ | "Lead / Contacted / Proposal Sent / Won / Lost" EN |
| Card CTAs | ❌ | "Move → / Move to ▾" EN |
| Empty state | ❌ | "Drop leads here" EN |
| Action buttons | ❌ | "+ New Lead / Export CSV" EN |
| EN words in body | 70 | RU coverage ~0% |
| Horizontal overflow | none | ✓ |

### Route 3: `/clients/[id]` (client detail — Pixel Forge Studios)

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar title | ✅ | "Клиенты" |
| Page heading (client name) | n/a | DB data, user-visible name |
| "Send" message button | ❌ | EN button |
| Activity Feed heading | ❌ | "Activity Feed / 10 events" EN |
| Filter tabs | ❌ | "All / Invoices / Projects / Notes / Time / Contracts / Files" EN |
| Date dividers | ❌ | "MAY 2026 / THIS WEEK" EN |
| Activity items | ❌ | "Invoice paid QA-0009 / 2093 USD received / in 3 days" — all EN |
| EN words in body | 582 | RU coverage ~4% (LONGEST EN exposure on this page) |
| Status emojis | colored dots | CSS, not actual emoji — fine |
| Horizontal overflow | none | ✓ |

### Route 4: `/contracts` (list)

| Aspect | Status | Notes |
|--------|:------:|-------|
| Page heading | ❌ | "Contracts" EN |
| Top-bar title | ✅ | "Договоры" |
| Sub-nav | ✅ | "Все договоры / Создать / Шаблоны / Подписки" |
| CTAs | ⚠ | "+ Новый договор / Создать через AI" RU; "More" still EN |
| Empty state body | ✅ | "Создайте первый AI-договор..." |
| Empty state CTAs | ✅ | "Сгенерировать через AI / Посмотреть шаблоны" |
| EN words in body | 1 | RU coverage ~95% — **best result** (matches PR #190 verdict) |
| Horizontal overflow | none | ✓ |

### Route 5: `/contracts/generate`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar | ✅ | "Создать договор" |
| Card title | ❌ | "Generate Contract with AI" EN |
| Card subtitle | ❌ | "AI will write a professional contract for you" EN |
| Form labels | ❌ | "Freelancer Name / Client / Contract Type / Duration / Budget / Currency / Scope of Work *" — ALL EN |
| Placeholders | ❌ | "Your name / Select client / Web Development / e.g. 3 months..." EN |
| CTA | ❌ | "Generate Contract" EN |
| EN words in body | 50 | RU coverage ~0% |
| Horizontal overflow | none | ✓ |

### Route 6: `/contracts/templates`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar | ✅ | "Договоры" |
| Browser headings | ❌ | All EN |
| Template cards | ❌ | "Web Development / Freelance Design / Consulting / NDA" — EN (could be intentional product taxonomy) |
| EN words in body | 44 | RU coverage ~0% |
| Horizontal overflow | none | ✓ |

### Route 7: `/work/projects`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Page heading | ✅ | "Проекты" (top-bar) |
| Filter chips | ✅ | "Все (20) / 5 активные / 5 в ожидании / 5 завершённые / 5 отменённые" |
| KPI labels | ✅ | "АКТИВНЫЕ / В ОЖИДАНИИ / АКТИВНЫЙ БЮДЖЕТ / ВСЕГО ЗАРАБОТАНО" |
| View tabs | ✅ | "Список / Доска / Лента / Гантт" |
| CTAs | ⚠ | "+ Новый проект / Создать через AI" RU; "More" EN |
| Labels filter | ❌ | "Labels: All / high-value / long-term / new-client / passive / retainer / urgent" EN (DB data) |
| "Grid / Board" toggle | ❌ | EN |
| "Filters" button | ❌ | EN |
| Card status pills | ❌ | "pending / active" EN (DB data) |
| Card tag pills | ❌ | "+ priority / + q1 / + routine" EN (DB data) |
| "No budget" empty state | ❌ | EN |
| EN words in body | 179 | RU coverage ~9% — matches /projects (PR #190 covered) |
| Horizontal overflow | none | ✓ |

### Route 8: `/work/projects/[id]` — **404 DEAD URL** ⚠

Route returns HTTP 404. Project detail page lives at `/projects/[id]` (without /work prefix). Sidebar nav links "Работа → Проекты" point to /work/projects (list works), but project cards link directly to `/projects/<id>` not `/work/projects/<id>`. **Inconsistent URL space.**

### Route 9: `/work/tasks` — **404 DEAD URL** ⚠

Sidebar shows "Работа → Задачи" linking to `/work/tasks` but route returns 404. **Dead link in primary nav.**

### Route 10: `/insights/goals` — **404 DEAD URL** ⚠

Sidebar shows "Аналитика → Goals" linking to `/insights/goals` but route returns 404. **Dead link in secondary nav (under Insights/Аналитика).**

### Route 11: `/insights/reports` — **404 DEAD URL** ⚠

Sidebar shows "Аналитика → Reports" linking to `/insights/reports` but route returns 404. **Dead link in secondary nav.**

### Route 12: `/money/invoices/recurring` (Регулярные счета)

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar | ✅ | "Регулярные счета" |
| Sub-nav | ⚠ | "Счета / Recurring / Расходы" — "Recurring" still EN |
| Breadcrumb | ❌ | "Invoices / Recurring" EN |
| Page heading | ❌ | "Recurring Invoices" EN |
| Top CTA | ❌ | "+ New Recurring Invoice" EN |
| Empty state heading | ❌ | "No recurring invoices" EN |
| Empty state body | ❌ | "Set up automatic invoice creation for retainer clients — they'll bill on schedule without you having to remember." EN |
| Empty state CTA | ❌ | "New Recurring Invoice" EN |
| Footer info banner | ❌ | "Auto-generation: LancerWise checks your recurring invoices daily at **6 AM UTC** and creates draft invoices automatically when they're due. Edit any template to change frequency, line items, or client." EN + **also hardcoded UTC (no dual-format per PR #189)** |
| EN words in body | 38 | RU coverage ~0% |
| Horizontal overflow | none | ✓ |

### Route 13: `/money/invoices/new`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar | ✅ | "Счета" |
| Page heading | ✅ | "Новый счёт" |
| Sub-nav | ⚠ | "Счета / Recurring / Расходы" — "Recurring" EN |
| Form labels | ✅ | "Номер счёта / Клиент / Дата выставления / Срок оплаты / Валюта / Позиции / Описание" |
| Auto-gen helper | ✅ | "Сгенерировано автоматически • Настроить в Настройках" |
| Currency picker | ⚠ | "$ USD — US Dollar" (US Dollar in EN) |
| Buttons | ⚠ | "Сгенерировать с AI / + Добавить позицию" RU; **"Saved items / From Library / Save as template"** EN |
| Sub-section | ✅ | "Из учтённого времени / Подытог / Промокод / Скидка" |
| Code placeholder | ✅ | "Введите код" |
| Date format (desktop) | ⚠ | MM/DD/YYYY (US format on RU locale) |
| Date format (mobile) | ✅ | DD.MM.YYYY (EU format — browser locale) — inconsistent vs desktop |
| Templates button | ❌ | "Templates" EN |
| EN words in body | 56 | RU coverage ~37% |
| Horizontal overflow | none | ✓ |

### Route 14: `/settings` (root)

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar / page heading | ✅ | "Настройки" |
| Profile section | ✅ | "Профиль / Полное имя / Email / Email нельзя изменить здесь / Сохранить профиль" |
| Profile Photo caption | ❌ | "Profile Photo / JPG, PNG or WebP" EN (only EN string in above-fold) |
| Appearance | ✅ | "Внешний вид / Выберите цветовую тему / Системная (авто) / Светлая [СКОРО] / Тёмная" |
| EN words in body | 2525 | LARGE count — likely from below-fold API documentation section (1053 endpoints, technical docs in EN by convention) |
| Horizontal overflow | none | ✓ |

### Route 15: `/onboarding`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar title | ❌ | "LancerWise" (route name fallback — should be "Настройка" or similar) |
| Step indicator | ✅ | "ШАГ 1 ИЗ 5" + numbered circles "1 2 3 4 5" |
| Page heading | ✅ | "Настройте профиль" |
| Subtitle | ✅ | "Добавьте имя и информацию о бизнесе" |
| Greeting | ✅ | "Добро пожаловать в LancerWise! Давайте настроим ваш профиль." |
| Form labels | ✅ | "Полное имя * / Название бизнеса (необязательно) / Часовая ставка (необязательно) / Страна (необязательно) / Выберите страну" |
| Navigation | ✅ | "Назад / Далее > / Пропустить настройку →" |
| EN words in body | 39 | RU coverage ~45% (still 39 EN words — likely from sidebar nav or top-bar) |
| Horizontal overflow | none | ✓ |
| **NOTE** | ⚠ | This route exists as a separate 5-step wizard, but new users actually land on /dashboard with Welcome modal overlay (verified in E2E Flow 1). **Two onboarding patterns coexist — UX inconsistency.** |

### Route 16: `/notifications`

| Aspect | Status | Notes |
|--------|:------:|-------|
| Top-bar | ✅ | "Уведомления" |
| Page heading | ❌ | "Notification Center" + red "6" badge — EN |
| Subtitle | ❌ | "6 alerts require your attention" EN |
| Severity tabs | ❌ | "All / High / Medium / Low" EN |
| Notification rows | ❌ | "Invoice #QA-0013 overdue / 47 days overdue — total 2873 USD / View →" EN |
| Priority badge | ❌ | "HIGH" (red pill) EN |
| Date footnote | ❌ | "47 days overdue" EN |
| **Emoji-as-icon** | ⚠ | 📄 emoji used per item as type indicator (should be SVG icon) |
| EN words in body | 122 | RU coverage ~0% |
| Horizontal overflow | none | ✓ |

---

## Cross-cutting observations

### Dark theme cohesion (POSITIVE)
Dark slate-950 backdrop + violet/purple primary CTAs + emerald/red status pills consistent across all 16 routes. No "saturated bright" mismatch. Card backgrounds + border treatments uniform.

### Mobile responsive (POSITIVE)
**Zero horizontal overflow** on any of 16 routes on iPhone 14 Pro viewport (393×852). All KPI grids, tables, kanban boards, settings forms degrade to mobile-stack cleanly. Hamburger menu replaces sidebar on mobile.

### 404 page (P3 polish)
Branded 404 with recovery CTAs ("Go to dashboard" / "Back to home") — but in English regardless of locale. Should translate.

### Date format inconsistency (P3)
- Desktop browser context: MM/DD/YYYY (US convention)
- Mobile WebKit context: DD.MM.YYYY (EU convention)
- This is browser-locale-driven (native date input widget), not app-controlled. RU users on desktop would see US format on date pickers. Workaround: use custom react-day-picker or similar instead of native `<input type="date">`.

### Currency display ($ prefix)
Hardcoded `$` everywhere (KPI values, line items, totals, banners) — known P0/P1 inherited backlog. Not introduced by PR #190 / not addressed by it.

---

## NEW findings (NOT previously documented)

### P2 — 3 dead URLs linked from primary nav

| Route | Status | Linked from |
|-------|:------:|-------------|
| `/work/tasks` | 404 | Sidebar "Работа → Задачи" |
| `/insights/goals` | 404 | Sidebar "Аналитика → Goals" (English label too) |
| `/insights/reports` | 404 | Sidebar "Аналитика → Reports" (English label too) |
| `/work/projects/[id]` | 404 | Project list cards link to `/projects/[id]` not `/work/projects/[id]` |

**Pre-launch action:** Either remove these sidebar entries OR implement the routes. Currently they're dead links — clicking them dumps user on 404 page (which is also untranslated). Brand-damaging.

### P3 — Emoji-as-functional-icon on /notifications

📄 emoji used per notification row as type indicator. Should be replaced with proper SVG icon (Lucide / Heroicons / etc.) for:
1. Accessibility (screen readers may say "page facing up" instead of "invoice notification")
2. Visual consistency (rest of app uses Lucide icons)
3. Internationalization (emoji rendering varies by OS/browser/locale)

### P3 — Two coexisting onboarding patterns

1. **New user lands /dashboard** → Welcome tour modal opens (5-step modal overlay) — see E2E Flow 1
2. **Direct navigation /onboarding** → 5-step wizard form (full-page form-based)

Both exist in production. Unclear which is the canonical path. The modal-overlay version dismisses on Esc; the form-wizard requires explicit Next/Skip navigation. **Choose one pattern OR document when each applies.**

### P3 — /onboarding top-bar fallback "LancerWise"

Top-bar reads "LancerWise" (brand name) instead of route-specific label like "Настройка профиля" or "Начало работы". Inconsistent with other routes that show route-name in top-bar.

---

## Findings already documented elsewhere (cross-references)

| Finding | Cross-ref |
|---------|-----------|
| 11 routes with RU bleed-through | P1-1 i18n root-cause analysis + PR #190 verdict |
| Hardcoded $ currency | `backlog_currency_hardcoded` (memory) |
| US date format on desktop | `backlog_date_format_localization` (memory) |
| Hardcoded "6 AM UTC" on recurring page | PR #189 follow-up scope (covered /settings/digest + /settings/reminders only) |
| /clients/pipeline RU 0% | P1-6 i18n coverage matrix (route NOT in PR #190 scope) |
| Welcome modal blocks dashboard | QA-002 P2 (already documented) |

---

## Recommendation

### NEW pre-launch action items

1. **Remove 3 dead sidebar links** (`/work/tasks`, `/insights/goals`, `/insights/reports`) OR implement the routes. P2 launch concern — clickable broken navigation is brand-damaging. Quick fix: comment out sidebar entries pending implementation. ~10 min.

2. **Decide /work/projects/[id] vs /projects/[id]** — pick one URL space, redirect the other. Currently inconsistent. ~30 min.

3. **404 page localization** — translate "Page not found / The page you're looking for..." + CTAs to RU. ~15 min.

### NOT launch-blocking, post-launch backlog

- **/notifications emoji-as-icon** — replace 📄 with proper SVG (P3 polish)
- **Onboarding pattern consolidation** — decide modal-overlay vs full-page wizard (P3 UX)
- **/onboarding top-bar label** — add route-specific title (P3 polish)
- **Remaining i18n scope** — /clients/pipeline, /clients/[id], /contracts/generate, /contracts/templates, /money/invoices/recurring, /money/invoices/new (Templates button + Saved items + From Library + Save as template), /notifications, /work/projects (More/Filters/Grid/Board buttons) — Phase-2 i18n
- **DB enum mapping (Phase 3)** — status badges, tags, label values stored as English literals — Phase-3 i18n

---

## Evidence

`EVIDENCE/desktop/` — 16 desktop screenshots (1440×900 Chromium, full-page captures)
`EVIDENCE/mobile/` — 16 mobile screenshots (393×852 WebKit iPhone 14 Pro, full-page captures)
`EVIDENCE/visual-tour-data.json` — structured per-route analysis (URL, status, EN word count, emoji count, cyrillic ratio, body snippet)

### Highlighted captures

- `02_clients-pipeline-desktop.png` — 0% RU translation, all kanban headers EN
- `03_clients-detail-desktop.png` — 582 EN words, Activity Feed all EN
- `05_contracts-generate-desktop.png` — Form 100% EN
- `09_work-tasks-desktop.png` — **404 page (untranslated)**
- `10_insights-goals-desktop.png` — **404 page** (sidebar link broken)
- `11_insights-reports-desktop.png` — **404 page** (sidebar link broken)
- `12_money-recurring-desktop.png` — Empty state + cron disclosure 100% EN
- `15_onboarding-desktop.png` — 95% RU translated ✓
- `16_notifications-desktop.png` — 📄 emoji per item + 0% RU

---

## Session-wide context

This visual tour is the 18th audit dropped this session:

| # | Audit | Verdict |
|--:|-------|:------:|
| 1 | Comprehensive QA | P0 + 6 P1 found |
| 2 | P1 repro prep pack | 6 docs |
| 3 | i18n root-cause analysis | Hypothesis C |
| 4 | P0 #154 re-verify | ✅ |
| 5 | Interactive QA | Modal backdrop bug + 16 routes |
| 6 | PR #184 re-verify | ✅ |
| 7 | PR #186 re-verify | ✅ |
| 8 | PR #187 re-verify | ✅ |
| 9 | PR #188 re-verify | ✅ |
| 10 | PR #189 re-verify | ✅ +UTC caveat |
| 11 | PR #190 re-verify | ✅ partial |
| 12 | PR #191 re-verify | ✅ partial |
| 13 | FINAL smoke (F12-F22) | 11/11 ✅ |
| 14 | E2E pre-launch (4 flows) | 4/4 ✅ |
| 15-17 | Various sub-verifications | ✅ |
| **18** | **Visual tour 16 pages** | **3 dead URLs found** |

**Launch readiness: still GO** with the 3 dead sidebar links cleaned up (~10 min fix). Other findings are Phase-2 i18n backlog already planned.
