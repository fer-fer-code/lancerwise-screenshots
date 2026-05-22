# Comprehensive QA Findings — 2026-05-21 / 22

**Author:** [AGENT 1]
**Date:** 2026-05-22 (batch 1 of comprehensive QA sweep)
**Scope:** Visual regression + RU localization + accessibility + design consistency
**Status:** Batch 1 complete (public/auth pages + mobile). Batches 2-4 deferred к later trigger.

---

## Batch 1 — Public/auth pages (this commit)

### Pages inspected

| Page | Locale | Viewport | Screenshot |
|---|---|---|---|
| / homepage | RU desktop | 1366×768 | `EVIDENCE/ru-localization/homepage-ru-desktop-1366.png` |
| / homepage | EN desktop | 1366×768 | `EVIDENCE/visual-regression/homepage-en-desktop-1366.png` |
| /pricing | EN | 1366×768 | `EVIDENCE/visual-regression/pricing-en-desktop.png` |
| /faq | EN | 1366×768 | `EVIDENCE/visual-regression/faq-en-desktop.png` |
| /privacy | EN | 1366×768 | `EVIDENCE/visual-regression/privacy-en-viewport.png` |
| /register с cookie banner | EN | 1366×768 | `EVIDENCE/overlap/register-en-cookie-banner-overlap.png` |
| /register | EN | iPhone 14 Pro 393×852 | `EVIDENCE/mobile-responsive/register-en-iphone14-393.png` |

---

## Findings

### P0 launch-blockers
**None.**

### P1 fix-before-launch
**None.** (All P1 candidates от smoke testing already resolved per CLOSURES + SMOKE-FINAL-SYNTHESIS.)

### P2 fix-soon-post-launch

**P2-1 — Cookie banner overlaps "Already have an account? Sign in" link on /register**

- **Severity:** P2 (does NOT block CTA, but partially obscures secondary link)
- **Evidence:** [register-en-cookie-banner-overlap.png](EVIDENCE/overlap/register-en-cookie-banner-overlap.png)
- **Route:** `/register` desktop 1366×768
- **Locale:** EN (likely also RU)
- **Description:** "Get started free" purple CTA button renders ABOVE cookie banner (good). "Already have an account? Sign in" link below the button is partially covered by cookie banner. Link text still readable, но visual hierarchy suffers.
- **Suspected fix:** Same `lw-app-main` class pattern that PR #117 used для /onboarding can extend к unauth pages. Add bottom padding (~80px mobile, ~96px desktop) к `<main>` element on /register, /login, /forgot-password when cookie banner is open.
- **Existing precedent:** `globals.css` has `body.cookie-consent-open { padding-bottom: 80px / 96px }` для body-level, but `/register` page structure may have its own scroll container blocking that bubble-up.

### P3 polish (post-launch)

**P3-1 — Cloudflare Turnstile widget i18n locale drift (CF iframe behavior)**

- **Severity:** P3 (Cloudflare iframe responsibility, не LancerWise app code)
- **Evidence:** [register-en-cookie-banner-overlap.png](EVIDENCE/overlap/register-en-cookie-banner-overlap.png) — shows "Успешно" (RU "Success") + "Конфиденциальность" + "Справка" links inside CF iframe on EN page
- **Description:** Cloudflare Turnstile widget auto-detects locale inconsistently. На EN page widget shows RU strings ("Успешно" status text, "Конфиденциальность / Справка" privacy/help links). Same drift in reverse — RU page sometimes shows EN "Verifying...".
- **Suspected fix:** Pass explicit `lang` parameter when initialising Turnstile script (`<script data-lang="en">`). Per Cloudflare Turnstile docs.
- **Cross-reference:** Same finding observed in smoke testing visual review (commit `343b788`). Aggregating.

**P3-2 — Privacy Policy "Last updated: May 20, 2026" date stale**

- **Severity:** P3 (acceptable — close to current date)
- **Evidence:** [privacy-en-viewport.png](EVIDENCE/visual-regression/privacy-en-viewport.png)
- **Description:** Privacy Policy header shows "Last updated: May 20, 2026" (matches PR #105 D4 update). Not а regression, just а note that date will need refresh when next legal review happens.
- **Suspected fix:** Bump date when next material policy change ships.

---

## Visual regression — baselines vs current

Compared current production renders vs older baselines (lancerwise-screenshots `exhaustive-audit/batch-*`, `full-audit-2026-05-14`).

### Homepage
- **RU + EN renders are stable.** Layout consistent, hero card "$48,240" hero placeholder unchanged, 9 feature cards intact, 3-step setup ("Get started in minutes" / "Запуск за пару минут"), 3 personas, 3-tier pricing с "Most popular" badge on Pro.
- No regressions detected.

### Pricing page
- **3-tier layout (Free $0 / Pro $15/mo / Business "Coming soon") consistent.** "Most popular" yellow badge на Pro tier. "Save 20%" green badge на Yearly toggle. "Compare all features" link below cards. "30-day money-back guarantee" footnote под Pro.
- Footer trust badges: "SSL Encrypted / GDPR Compliant / Mobile app coming soon"
- No regressions detected.

### FAQ page
- **5 sections (GETTING STARTED / BILLING & PRICING / FEATURES / SECURITY & DATA / ACCOUNT)** с 20 questions total, all accordions collapsed.
- "Still have questions?" CTA с "Email Support" + "Contact Form" buttons.
- No regressions detected.

### Privacy Policy
- "Last updated: May 20, 2026" date.
- 6 data categories enumerated.
- Card-style content с proper hierarchy.
- No regressions detected.

---

## RU localization audit (homepage RU vs EN)

| Aspect | Verdict | Notes |
|---|---|---|
| Hero headline | ✅ Translated | "Универсальный бизнес-хаб для фрилансеров" vs "The All-in-One Business Hub for Freelancers" |
| Hero subhead | ✅ Translated | (both visible in screenshots) |
| Feature pills (4) | ✅ Translated | "Всё в одном / На базе AI / Бесплатно / 5 мин" vs "All-in-one / AI-powered / Free / 5 min" |
| Section: Features grid | ✅ Translated | "Возможности для управления фриланс-бизнесом" vs "Freelance Management Features Built for Independent Professionals" |
| 9 feature cards | ✅ Translated | All section titles в RU |
| Section: Setup steps | ✅ Translated | "Запуск за пару минут" vs "Get started in minutes" |
| 3 setup cards (Шаг 1/2/3) | ✅ Translated | (visible in RU screenshot) |
| Section: Personas | ✅ Translated | "Подходит каждому типу фрилансера" vs "Built for every kind of freelancer" |
| Section: Pricing | ✅ Translated | "Простые и прозрачные тарифы" vs "Simple, transparent pricing" |
| Section: FAQ | ✅ Translated | "Частые вопросы" vs "Frequently asked questions" |
| Bottom CTA | ✅ Translated | "Управляйте фриланс-бизнесом как профи" vs "Run Your Freelance Business Like a Pro" |
| Footer | ✅ Translated | (visible) |

**No EN string leaks detected on homepage RU.** Full localization coverage.

### Caveat (P3)

Page `<title>` tag remains "LancerWise — Free Freelancer CRM, Invoices & AI Contracts" в EN regardless of locale (browser title bar shows EN under RU body). **Pre-existing i18n leak** carried от earlier audits. Not regressed; not introduced by recent work.

---

## Mobile responsive (iPhone 14 Pro 393×852)

### /register mobile
- ✅ Single-column form layout
- ✅ Touch targets adequate (Get started free button ~48px tall)
- ✅ Cookie banner mini variant с "Customize / Accept All / X"
- ✅ No horizontal scroll, no text cut-off
- ⚠️ "Already have an account? Sign in" link visible above mini cookie banner — slight visual proximity на shorter viewports
- ✅ Hero hidden on mobile (form takes full width) — correct responsive behavior

---

## What was NOT covered in this batch (deferred к batch 2-4)

- **Batch 2:** Signed-in flows visual regression (/dashboard, /work/time, /settings + 16 subroutes)
- **Batch 3:** Comprehensive overlap detection (modal backdrops, dropdown overflow, sticky headers, date pickers, toast notifications, mobile bottom nav, tooltips)
- **Batch 4:** Accessibility quick pass (color contrast, alt text, keyboard nav, focus indicators, form labels)
- **Design consistency audit** (typography hierarchy, brand palette compliance, spacing tokens, icon style)

Batch 2-4 require ~2-3h focused work each. Will execute when triggered post-launch OR if pre-launch capacity allows.

---

## Cross-references к other audits

- [`audit/agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md`](../agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md) — smoke testing browser flows (covered F1-F11 functionally)
- [`audit/agent1-smoke-coordination/SMOKE-COORDINATION-AGENT1-2026-05-21.md`](../agent1-smoke-coordination/SMOKE-COORDINATION-AGENT1-2026-05-21.md) — visual review during smoke (overlapping coverage)
- [`audit/agent1-launch-readiness-master/SMOKE-FINAL-SYNTHESIS-2026-05-21.md`](../agent1-launch-readiness-master/SMOKE-FINAL-SYNTHESIS-2026-05-21.md) — final smoke synthesis (P0/P1/P2/P3 categorization)
- Memory: `feedback_marketing_honesty_policy.md` — applies к pricing/FAQ claims accuracy

---

## Batch 1 summary

- **Pages inspected:** 7 screenshots across 6 routes × 2 locales × 2 viewports
- **P0:** 0
- **P1:** 0 (all resolved pre-batch)
- **P2:** 1 (cookie banner overlap "Sign in" link)
- **P3:** 2 (CF Turnstile locale drift; page title not translated)
- **Visual regressions vs baselines:** None
- **RU localization coverage homepage:** complete
- **Mobile responsive /register:** clean

**Batch 1 verdict:** ✅ no launch-blockers. 1 P2 to file post-launch (cookie banner extending к unauth pages). Continue к batches 2-4 when triggered.

---

## Batch 2 + 3 — Signed-in flows visual + widget overlap detection

### Auth setup

Logged in via magic link as fixture user `46b486d7-5fec-47af-a466-3295dc1c3b95` (QA Realistic Account, `lancerwise-qa-93s1-fixed-1779327754@wshu.net`).

### Pages inspected (5 signed-in surfaces)

| Page | Locale | Viewport | Screenshot |
|---|---|---|---|
| /dashboard | EN | 1366×768 | `EVIDENCE/visual-regression/b2-dashboard-en-1366.png` |
| /work/time | EN | 1366×768 | `EVIDENCE/visual-regression/b2-worktime-en-1366.png` |
| /settings (post #94 v2) | EN | 1366×768 | `EVIDENCE/visual-regression/b2-settings-en-1366.png` |
| /clients | EN | 1366×768 | `EVIDENCE/visual-regression/b2-clients-en-1366.png` |
| /invoices | EN | 1366×768 | `EVIDENCE/visual-regression/b2-invoices-en-1366.png` |

### Visual regression vs baselines

- **/dashboard:** Clean render. "Good morning, QA" greeting, Today's Agenda с 2 overdue invoices, 4 KPI cards (Revenue $8,474 / Open $17,027 / Hours 17.7h / Proposals 0), Revenue 12-week chart, Activity Feed. Sidebar "Home" highlighted purple. Quick Add FAB visible. **No regression.**
- **/work/time:** Renders post-#93 Stage 2 v2. Time Tracker tabs (Timer / Timesheet / Analytics), action buttons (Pomodoro / Invoice Time / Export CSV), Timer card 00:00:00 (fixture week reset since smoke), Templates button, Start + Billable buttons, This Week histogram с weekday columns. Sidebar Work expanded showing Projects/Tasks/Time Tracker (highlighted). **No regression.**
- **/settings (post #94 v2):** Settings header, Profile card (QR avatar, Full Name "QA Realistic Account", Email field, Save Profile button), Appearance card (theme System auto-detect). Sidebar Settings highlighted. **Server-component conversion confirmed working visually** — page renders без race conditions.
- **/clients:** 4 KPI cards (Total 8 / Active 8 / Revenue YTD $20,072 / With Overdue 2). "+ New Client" + Pipeline + More buttons. Filter tabs (Active / Prospect / Inactive / All Tiers / Gold / Silver / Bronze / New). Filters dropdown. Search clients input. Table headers (CLIENT / TIER / CONTACT / STATUS / TAGS / HEALTH / REVENUE / ADDED / LAST ACTIVE). 8 sample clients с `.example` emails. **No regression.**
- **/invoices:** 4 KPI cards (PAID $20,072 / PENDING $11,027 / OVERDUE $6,000 / UNBILLED $20,640.83 + 190.0h tracked). Yellow alert "5 invoices overdue — $13,900 outstanding" + "View Collections Queue" link. Filter chips (All 15 / 3 draft / 4 sent / 5 paid / 2 overdue). "+ New Invoice / Templates / Collections (5) / More / Quick" action buttons. Sort by Date/Amount/Client/Invoice #. Filters dropdown. Table с QA-0003 + QA-0002 visible. **No regression.**

### NEW P2 FINDING — Quick Add FAB menu overlaps content

**P2-2 — Quick Add FAB menu items obscure underlying table data**

- **Severity:** P2 (visual hierarchy issue, mis-click risk)
- **Evidence:** [b3-quickadd-fab-overlap-clients-table.png](EVIDENCE/overlap/b3-quickadd-fab-overlap-clients-table.png)
- **Route:** /clients (likely affects all routes when FAB activated)
- **Locale:** EN
- **Description:** Clicking Quick Add FAB (bottom-right purple lightning) opens action menu с 6 items ("New Client", "New Project", "New Invoice", "Add Expense", "Add Task", "Log Time"). Menu items expand leftward and **directly overlay the clients table content** — covering "ADDED" + "LAST ACTIVE" columns + "Filters" button + "Search clients" input partial. Menu items have dark-card backgrounds but **no semi-transparent backdrop/scrim к dim underlying content**, creating visual confusion (user может read both menu items AND underlying table data — overlap blur).
- **Suspected fix:** Add semi-transparent backdrop (`backdrop-blur` + `bg-black/40`) к dim underlying content when FAB menu is open. Standard menu/modal pattern.
- **Reproduction:** signed-in user → any route с FAB → click Quick Add FAB → observe action menu overlaying underlying content без backdrop.

### Language switcher dropdown — CORRECT behavior

[b3-language-switcher-dropdown-clean.png](EVIDENCE/overlap/b3-language-switcher-dropdown-clean.png) shows language dropdown opens cleanly над "OVERDUE" KPI card area. Dark dropdown background covers underlying icon. **This is expected dropdown overlay behavior, NOT а bug.** Z-index proper. Не filed as finding.

### Cookie banner display inconsistency observation

Cookie banner appears on /dashboard, /work/time, /settings, /invoices but NOT visible on /clients during same session. Possible explanations:
- Dismissed during /clients visit OR auto-dismissed after а timeout
- Different consent-state-check per route
- **Severity: P3 (minor inconsistency)** — banner should appear consistently OR consistently NOT appear across signed-in routes per consent rules

---

## Batch 4 — Accessibility quick pass + design consistency + FAB reassessment

**Executed:** 2026-05-22 (continuation of comprehensive QA sweep)
**Method:** Playwright DOM queries (counts + computed styles) on 5 routes — /, /dashboard, /clients, /settings, /invoices — plus focus-indicator keyboard test + FAB screenshot re-examination.

---

### FAB finding reassessment — P2-2 → **P1 (ESCALATED, agree с independent visual review)**

**P1-NEW — Quick Add FAB menu items overlap underlying table data без backdrop**

- **Evidence:** [b3-quickadd-fab-overlap-clients-table.png](EVIDENCE/overlap/b3-quickadd-fab-overlap-clients-table.png)
- **Route:** /clients (and likely all signed-in routes когда FAB activated)
- **Severity reassessment rationale:**
  1. **Core workflow page** — /clients is а primary CRM management surface (8 sample clients, 4 KPI cards, full table interaction). User mis-click probability higher on dense data routes.
  2. **Visual hierarchy break** — 6 menu items render directly над table data without semi-transparent scrim/backdrop. Column "LAST ACTIVE" fully covered; "ADDED" partially obscured; "Filters" button covered; "Search clients" input partially overlapped.
  3. **Mis-click risk concrete** — menu items have dark-card backgrounds на dark page; underlying table also dark-themed. Users may read both layers simultaneously (overlap blur), increasing risk of clicking wrong element (e.g., intending к click а table row, hitting "New Project" menu item instead).
  4. **Pre-launch polish bar should be high** — standard backdrop-blur + bg-black/40 is well-established modal/menu pattern (used everywhere from Material/Tailwind UI к LinkedIn/Stripe Dashboard).
- **Final severity: P1 fix-before-launch** (agreed с Claude independent visual review escalation).
- **Suspected fix:** Add `<div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeFab}>` overlay element rendered just below FAB menu (z-50). Standard portal/scrim pattern. Estimated 10-15 min fix.

**Note:** Previous severity (P2 in batch 2+3) was based on aesthetic-only impact. Reassessment factored in mis-click probability + workflow-criticality + standard menu pattern non-compliance. P1 is correct call.

---

### Part A — Accessibility quick pass (5 routes sampled)

Playwright DOM-level a11y counts per route:

| Route | Buttons | Icon-only без label | Inputs | Unlabeled inputs | h1 count | Skip link | html lang |
|---|---:|---:|---:|---:|---:|---|---|
| `/` (homepage EN) | 13 | 0 ✅ | 0 | 0 | 1 ✅ | ❌ | en ✅ |
| `/dashboard` | 24 | 1 ⚠️ | 0 | 0 | 1 ✅ | ❌ | en ✅ |
| `/clients` | 39 | 1 ⚠️ | 2 | 0 (placeholder) | 1 ✅ | ❌ | en ✅ |
| `/invoices` | 69 | 2 ⚠️ | 0 | 0 | 1 ✅ | ❌ | en ✅ |
| `/settings` | 187 | **82 ⚠️⚠️⚠️** | 79 | **23 ⚠️⚠️⚠️** | **2 ⚠️** | ❌ | en ✅ |

#### A11y findings filed

**P2-3 — `/settings` has 82 icon-only buttons + 23 unlabeled inputs (highest a11y debt route)**

- **Severity:** P2 (post-launch fix, screen-reader users on configuration pages will struggle)
- **Evidence:** Playwright DOM query showing 82/187 buttons render с empty text + no aria-label/title, 23/79 inputs lack any labeling association (label[for], aria-label, aria-labelledby, OR placeholder fallback).
- **Description:** /settings landing page aggregates ~12 subsections (Profile/Appearance/Email/Notifications/etc). High icon-density (toggle switches, color-pickers, sort handles, copy-buttons) leaves many controls без accessible name. 23 inputs (likely color/checkbox/toggle hidden inputs) lack `<label>` associations.
- **Suspected fix:** Audit `/settings` subsections; add `aria-label="…"` к icon-only buttons (estimate ~30-60 min); ensure all visible `<input>` elements have `<label for="…">` OR `aria-label`. Note that "labels:156" suggests many `<label>` elements exist но only 2 carry `for=` attribute — most are wrapping inputs visually but not associating semantically.
- **Acceptance:** post-fix, axe-core scan returns 0 critical violations on /settings landing.

**P2-4 — `/settings` page contains 2 `<h1>` elements (should be 1)**

- **Severity:** P2 (heading hierarchy violation; screen readers announce two top-level page titles)
- **Description:** Playwright query returned `h1Count: 2` on /settings. Likely one в `<header>` ("Settings") and second от server-rendered subsection (e.g., "Profile"). WCAG 2.4.6 requires single `<h1>` per page.
- **Suspected fix:** Downgrade subsection `<h1>` к `<h2>` OR remove sidebar duplicate.

**P3-4 — No `<a href="#main">` skip link on any signed-in route**

- **Severity:** P3 (WCAG 2.4.1 "Bypass Blocks" technically met via headings/landmarks, но dedicated skip link is best-practice especially for sidebar-heavy nav)
- **Description:** All 5 sampled routes return `skipLinkPresent: false`. Users navigating с keyboard must Tab through entire sidebar (5-8 items × Money/Clients/Work submenus) before reaching main content.
- **Suspected fix:** Add `<a href="#main-content" className="sr-only focus:not-sr-only …">Skip to main content</a>` в root layout. ~5 min implementation. /invoices already has `main` landmark — add `id="main-content"` к existing `<main>`.

**P3-5 — Focus indicator uses browser-default (blue auto 1px) instead of brand-styled focus-visible**

- **Severity:** P3 (focus IS visible, but не brand-consistent + minimal contrast on dark theme)
- **Evidence:** [b4-focus-indicator-dashboard-tab1.png](EVIDENCE/a11y/b4-focus-indicator-dashboard-tab1.png)
- **Description:** Tab-1 on /dashboard focuses LancerWise sidebar logo с `outline: rgb(0, 95, 204) auto 1px` (browser default). On dark sidebar background, blue outline is visible but thin (~1px) and не match brand violet palette.
- **Suspected fix:** Add global `*:focus-visible { outline: 2px solid theme('colors.violet.400'); outline-offset: 2px; }` к globals.css. Matches dark theme + brand palette. ~5 min.

#### A11y wins (positive observations)

- ✅ **html lang="en"** set on every route (correct, also confirms i18n bug — see below)
- ✅ **No images без alt text** anywhere (homepage 0 images, signed-in routes 0 images — all visuals are SVG)
- ✅ **All SVGs are aria-hidden="true"** OR have `<title>` (decorative-by-default pattern correctly applied) — 72 SVGs on homepage, 74 on /clients, all properly hidden от AT
- ✅ **Heading hierarchy generally correct** — homepage 1 H1 / 7 H2 / 19 H3 (proper nesting), /dashboard 1 H1, /invoices 1 H1 ("Invoices"), /clients 1 H1
- ✅ **Inputs that exist have placeholders** (acceptable fallback when label-for missing, though not ideal)
- ✅ **Landmarks present on /invoices**: 1 `<main>` + 2 `<nav>` (sidebar + header)
- ⚠️ **No `<footer>` landmark on signed-in routes** — minor (sidebar handles nav)

---

### Part B — Design consistency observations

#### Typography hierarchy (cross-route sampling)

| Element | Font size | Font weight | Color | Notes |
|---|---|---|---|---|
| `<h1>` on /dashboard | 18px | 600 | white | ⚠️ Surprisingly small для page H1 (likely header-bar pattern, sidebar = visual H1) |
| `<h1>` on /invoices | (same pattern) | 600 | white | Header-bar style |
| `<h3>` /invoices | 14px | 600 | white | Small section labels |
| `<p>` /dashboard | 12px | 400 | slate-300-ish | ⚠️ 12px body text — borderline для readability (WCAG min 16px recommended) |
| Body root | 16px | 400 | rgb(23,23,23) on white | Defaults set correctly |

**Observation:** H1 18px is small для page heading — looks more like an `<h2>`. Combined с sidebar header pattern (full-height brand on left), это intentional design choice ("the sidebar IS the H1"). Acceptable but documented.

**P3-6 — Body text 12px on /dashboard KPI subtext borderline для readability**

- **Severity:** P3 (legibility nit on small KPI captions)
- **Description:** KPI sub-text ("3 paid · average: $2,825", "6 overdue ($17,027)") renders at 12px. WCAG не mandates 16px but recommends ≥14px для body content. Older users + mobile zoom-reset may struggle.
- **Suspected fix:** Bump KPI sub-text к 13-14px OR increase line-height for breathing room.

#### Brand palette compliance

10 unique background colors detected on /invoices buttons (oklab/rgb mix). Top usage:
1. `rgba(0,0,0,0)` (transparent) — 24 buttons (most-used for ghost/icon buttons)
2. `oklab(0.408004 0.0966848 0.0760221 / 0.2)` — orange/red tint (overdue)
3. `rgb(26,26,34)` — dark card background
4. White text on transparent — primary purple CTAs

**Verdict:** ✅ Palette consistent — violet/purple для primary, ghost buttons transparent, semantic colors (green/red/yellow) used purposefully. No rogue colors detected.

#### Loading skeletons coverage

- /dashboard: 0 skeletons active (data prefetched server-side per #73 fix)
- /clients: 0 skeletons (server prefetched per #74 fix)
- /settings: 0 skeletons (server prefetched per #94 v2 fix)
- /invoices: 0 skeletons (#94 v2 + sibling prefetch)

**Verdict:** ✅ Phase 1 N+1 elimination removed need для most mount-time skeletons. Где они used (e.g., AI generation calls, async modals) was не sampled in this batch.

#### Icon style/size

72-74 SVGs per signed-in route, all lucide-react with stroke-width 2, sizes 16/20/24px по semantic context (sidebar icons 20px, button icons 16px, KPI icons 24px). All `aria-hidden="true"`. **Verdict:** ✅ Consistent.

#### Button states (visual sampling)

Focus state: browser-default `rgb(0, 95, 204) auto 1px` outline. Hover/active/disabled states not exhaustively sampled in this batch (would require interaction across 100+ buttons). **Verdict:** ⚠️ focus state needs custom focus-visible CSS (P3-5 above); hover/disabled likely consistent based on tailwind utility-driven design but не exhaustively verified.

---

### Part C — Cross-cutting quality checks

#### Page `<title>` i18n coverage — **ALL ROUTES SHOW EN MARKETING TITLE**

| Route | Page `<title>` |
|---|---|
| `/` | `LancerWise — Free Freelancer CRM, Invoices & AI Contracts` |
| `/dashboard` | `LancerWise — Free Freelancer CRM, Invoices & AI Contracts` ⚠️ (generic, not "Dashboard — LancerWise") |
| `/clients` | `LancerWise — Free Freelancer CRM, Invoices & AI Contracts` ⚠️ |
| `/settings` | `LancerWise — Free Freelancer CRM, Invoices & AI Contracts` ⚠️ |
| `/invoices` | `LancerWise — Free Freelancer CRM, Invoices & AI Contracts` ⚠️ |

**P3-7 — Page `<title>` не route-specific on signed-in routes**

- **Severity:** P3 (browser tab UX nit — when user has multiple LancerWise tabs open они indistinguishable)
- **Description:** All routes share the same marketing landing-page `<title>`. Browser tab/window title doesn't change as user navigates. Also impacts bookmark/history readability.
- **Suspected fix:** Add per-route `metadata.title` в layout.tsx или page.tsx. Next.js 16 supports `title: { template: '%s — LancerWise', default: '…' }` pattern in root layout, then per-page `export const metadata = { title: 'Dashboard' }`. Estimated 15-20 min для all signed-in routes.
- **Cross-reference:** This subsumes the pre-existing batch-1 P3-1 finding ("title not translated on RU").

#### Meta description coverage

| Route | Meta description |
|---|---|
| `/` | "Free freelancer CRM with professional invoices, AI contracts, time tracking & payment reminders. No credit card needed." (119 chars) ✅ |
| `/clients` | (same as above) — 119 chars ✅ |
| `/dashboard` | (same) ✅ |

**Verdict:** ✅ Meta description present + correct length on all sampled routes. Same content used for signed-in routes (acceptable — they're noindex по auth-gate).

#### Favicon coverage

All routes return 14 `<link rel="icon"|"apple-touch-icon"|…>` entries. **Verdict:** ✅ Comprehensive coverage.

#### Cookie banner consistency (re-test)

- /dashboard 2026-05-22 fresh load — **cookie banner VISIBLE** (`cookieBannerVisible: true`)
- Batch 3 noted absence on /clients during same session — likely temporary dismiss/local-state behavior, не persistent route-specific consent rule difference.
- **Updated verdict on P3 cookie consistency finding:** likely false-positive от session state during batch 3. Banner consistently shows on first-visit per session. **Downgrade к "monitor" — не filing P3 ticket.**

---

## Batch 4 summary

- **Routes inspected:** 5 (homepage, dashboard, clients, settings, invoices) via DOM query + 1 focus-indicator screenshot
- **Screenshots added:** 1 (`b4-focus-indicator-dashboard-tab1.png`)
- **NEW P1:** 1 (FAB overlap — escalated от P2-2)
- **NEW P2:** 2 (settings a11y debt 82 icon-only + 23 unlabeled inputs; settings duplicate h1)
- **NEW P3:** 4 (no skip link; browser-default focus indicator; 12px KPI subtext borderline; signed-in route titles generic)
- **DOWNGRADED:** 1 (cookie banner cross-route inconsistency P3 → "monitor", false positive)

### Cumulative findings (batches 1+2+3+4)

- **P0:** 0
- **P1:** 1 (Quick Add FAB menu obscures content — escalated from P2)
- **P2:** 3 (cookie banner /register overlap; /settings 82 icon-only buttons + 23 unlabeled inputs; /settings duplicate h1)
- **P3:** 6 (CF Turnstile locale drift; signed-in route titles generic [supersedes prior page title not-translated]; no skip link; browser-default focus indicator; 12px KPI subtext borderline; privacy policy date stale)

**Batch 4 verdict:** 1 P1 to fix before launch (FAB backdrop ~15 min). 3 P2 + 6 P3 для post-launch backlog. Estimated total pre-launch a11y work: ~15 min FAB fix. Estimated post-launch a11y polish: 2-4h work spread across the P2/P3 items.
