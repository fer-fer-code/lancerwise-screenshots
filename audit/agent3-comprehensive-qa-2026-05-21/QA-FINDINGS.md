# Comprehensive QA — pre-launch findings (live document)

**Author:** [AGENT 3]
**Started:** 2026-05-22
**Production:** commit `f27bb710` (post #94 v2 merge), deploy READY 2026-05-21T17:29:02Z
**Fixture user:** `46b486d7-5fec-47af-a466-3295dc1c3b95` (`lancerwise-qa-93s1-fixed-1779327754@wshu.net`)
**Cell matrix:** Chromium 1440×900 desktop + WebKit iPhone 14 Pro 393×852 mobile × EN/RU locale = 4 cells per page
**Screenshot policy:** above-fold viewport + fullPage scrolled-bottom per cell

This document updates incrementally as the QA passes execute. Each batch commit message includes new-finding counts by severity.

---

## Severity rubric

| Severity | Definition |
|----------|------------|
| **P0** | Launch-blocker: page won't render, write path broken, data corruption, auth bypass |
| **P1** | Broken UX: feature partially functional, missing critical CTAs, render regression, accessibility blocker |
| **P2** | Visible bug: layout overlap, copy inconsistency, missing translation, design drift |
| **P3** | Polish: minor typography/spacing/iconography inconsistency, edge-case copy, nice-to-have |

---

## Progress tracker (live)

| Pass | Status | Findings count | Pushed batch |
|------|:------:|----------------|:------------:|
| PART C batch 1 — main authed pages (dashboard/clients/projects/invoices/proposals) | ✅ DONE | 1 P1, 2 P2, 3 P3 | commit 95558dc |
| PART C batch 1 — unauth (register/login/forgot-password) | ✅ DONE | 0 (Turnstile present) | commit 95558dc |
| PART C batch 2 — work/time + /settings/* (10) + /upgrade + /analytics + /contracts | ✅ DONE | findings below | pending push |
| PART C batch 2 — public unauth (/, /pricing, /about, /contact, /privacy, /terms, /blog, /faq) | ✅ DONE | findings below | pending push |
| PART A — auth flow probes (signup/signin/forgot/reset/logout/expiry) | ⏳ pending | — | — |
| PART B — CRUD flows (clients/projects/invoices/proposals/time/contracts) | ⏳ pending | — | — |
| PART D — widget overlap scan | ⏳ pending | — | — |
| PART E — edge cases (empty/full/error/search/filter/pagination) | ⏳ pending | — | — |
| PART F — design consistency audit | ⏳ pending | — | — |

---

## Findings (severity-sorted, populated as captures arrive)

### P0 launch-blockers

_(none yet — will populate as discovered)_

### P1 broken UX

#### QA-001 — Russian locale: KPI cards + table headers NOT translated [P1]
- **Where:** /clients, /invoices, /projects, /proposals (4 of 5 authed routes confirmed via batch 1). **AUTH ROUTES (/register, /login, /forgot-password) ARE FULLY TRANSLATED** — so the gap is in authed-route message catalogs only
- **Symptom:** Sidebar IS translated to RU ("Главная", "Финансы", "Клиенты"…) but content body strings remain English
- **Examples on /clients RU desktop:** "TOTAL CLIENTS", "ACTIVE", "REVENUE YTD", "WITH OVERDUE", "+ New Client", "Pipeline", "More", "All Tiers", "Gold", "Silver", "Bronze", "New", "CLIENT", "TIER", "CONTACT", "STATUS", "TAGS", "HEALTH", "REVENUE", "ADDED", "LAST ACTIVE", "View →", "Active", "Prospect", "Inactive"
- **Examples on /invoices RU desktop:** "PAID", "PENDING", "OVERDUE", "UNBILLED", "5 invoices overdue — $13,900 outstanding", "View Collections Queue →", "+ New Invoice", "Templates", "Collections", "More", "Quick", "Filters", "Sort: Date / Amount / Client / Invoice #", status badges ("draft", "paid", "sent", "overdue"), "Remind", sub-nav "Recurring", "Expenses"
- **Examples on /proposals RU desktop:** "Proposal Generator", "Generate a professional client proposal in seconds using AI.", "Your Name", "Client Name", "Client Email (optional…)", "Service Type", "Web Development", "Project Scope *", placeholder text, "Budget", "Currency", "Timeline", "Tone", "Professional / Friendly / Bold / Concise", "Expiry Date (optional)", "7 days / 14 days / 30 days / Custom", "Templates", "AI Brief", "Generate with AI", "Generated Proposal", "Fill in the form and click Generate to create your proposal"
- **Reproduce:** open https://www.lancerwise.com/{route}?locale=ru OR set NEXT_LOCALE=ru cookie, navigate to any of the 3 routes
- **Affected:** RU only, both mobile + desktop, both Chromium + WebKit (same i18n key gap pattern)
- **Suspect file:** `messages/ru.json` (or whichever locale file is loaded) — keys for KPI labels, form labels, table headers, status badges, button copy missing OR fallback path returns English
- **Evidence:** `EVIDENCE/page-screenshots/{clients,invoices,proposals}_{chromium,webkit}_ru_{desktop,mobile}_above-fold.png`
- **Impact:** RU launch UX broken — feels like a half-translated MVP; substantial perceived-quality risk
- **Severity rationale:** P1 not P0 because page renders correctly, feature works, sidebar is in RU; but breadth of missing translations is too wide to ship as "supports Russian"

### P2 visible bugs

#### QA-002 — Welcome tour modal blocks dashboard above-fold KPIs on first login [P2]
- **Where:** /dashboard for fresh-session users (cookie expired OR new login)
- **Symptom:** "👋 Welcome to LancerWise. Quick 60-second tour to show you around. You can skip anytime by pressing Esc. 1 of 5 [← Back] [Next →]" modal renders centered, blocking the 4 KPI cards (REVENUE THIS MONTH / INVOICES / HOURS THIS WEEK / PROPOSALS PENDING)
- **Affected:** Both mobile + desktop, both EN + RU. RU modal copy is in English ("Welcome to LancerWise…") — separate P1 i18n hit there
- **Evidence:** `dashboard_{chromium,webkit}_{en,ru}_{desktop,mobile}_above-fold.png`
- **Note:** Modal IS dismissible (× + Esc + skip). Intended behavior for onboarding. The bug is that this overlay is also shown to fixture users who already have a populated account — onboarding flag not respecting `seeded data` state. Verify whether persistent users see modal on every session, or only once per cookie lifetime
- **P2 rationale:** Not a blocker (dismissible) but creates poor first-impression for non-onboarding users + RU translation missing inside modal copy

#### QA-003 — Welcome tour modal: copy in English on RU locale [P1→P2 inside QA-002]
- See QA-002. Inside the welcome modal, "👋 Welcome to LancerWise" + "Quick 60-second tour…" + "1 of 5" + "Back / Next →" remain English on RU locale
- **Evidence:** `dashboard_chromium_ru_desktop_above-fold.png`, `dashboard_webkit_ru_mobile_above-fold.png`
- **Suspect file:** `WelcomeTour.tsx` or `OnboardingTour.tsx` — hardcoded English strings instead of `t('welcome.title')` keys

### P3 polish

#### QA-004 — /proposals Budget label collides with "Estimate with AI" pill [P3]
- **Where:** /proposals desktop + RU (also affects EN — same layout)
- **Symptom:** The "Budget" field label wraps under/into the inline "💵 Estimate with AI →" CTA pill, producing visually messy "Budge💵 Estimate / [partial] with AI →"
- **Evidence:** `proposals_chromium_en_desktop_above-fold.png`, `proposals_chromium_ru_desktop_above-fold.png`
- **Suspect file:** `ProposalGenerator.tsx` (or equivalent) — flex/gap on the field-label row needs `flex-wrap` discipline OR the pill should be a row below the label
- **Severity rationale:** Cosmetic, not breaking UX; common pattern at form field densities

#### QA-005 — /invoices banner copy hardcoded $ symbol [P2/P3 inherited backlog]
- **Where:** /invoices "5 invoices overdue — $13,900 outstanding" banner
- **Symptom:** `$` is hardcoded; same hit on KPI cards "$20,072 / $11,027 / $6,000 / $20,640.83"
- **Evidence:** `invoices_chromium_{en,ru}_desktop_above-fold.png`
- **Note:** Pre-existing memory `backlog_currency_hardcoded` P0 — re-confirmed visually
- **Suspect:** No `formatCurrency()` helper + no `user.currency` lookup yet

#### QA-006 — Date format "Jun 9, 2026" hardcoded en-US [P3 inherited backlog]
- **Where:** /invoices table Due Date column, /clients "1 day ago" + "Added" columns
- **Symptom:** en-US date format renders for RU users too ("May 25, 2026" / "Jun 9, 2026")
- **Evidence:** `invoices_chromium_ru_desktop_above-fold.png`
- **Note:** Pre-existing memory `backlog_date_format_localization` P1 — re-confirmed visually

---

## Batch 2 findings — /work/time + /settings/* + /upgrade + /analytics + /contracts

### P1 broken UX (batch 2)

#### QA-007 — /upgrade page 100% English on RU locale [P1]
- **Where:** /upgrade (and presumably /pricing)
- **Symptom:** Entire pricing page is English on RU locale — only sidebar nav is translated. Page heading "Upgrade your plan", subhead "You're on the Pro plan", Monthly/Yearly toggle, "Save 17-20%", "Free" / "$0 forever" / "Pro" / "$15/month", feature lists, "Most popular" + "Current plan" badges, "Upgrade to Pro" CTA, "Free forever" CTA — all English
- **Evidence:** `upgrade_chromium_ru_desktop_above-fold.png`, `upgrade_webkit_ru_mobile_above-fold.png`
- **Impact:** Conversion-critical surface, untranslated for half the audience
- **Severity:** P1 — pricing conversion is launch-revenue path

#### QA-008 — /upgrade "Current plan" + "Upgrade to Pro" CTA contradiction [P1]
- **Where:** /upgrade for fixture user already on Pro plan
- **Symptom:** Pro card has "Current plan" green badge BUT primary CTA reads "Upgrade to Pro" — user is being asked to upgrade to a plan they're already on
- **Evidence:** `upgrade_chromium_en_desktop_above-fold.png`, `upgrade_chromium_ru_desktop_above-fold.png`
- **Expected:** Button should be `disabled` with copy "Manage plan" / "Manage subscription" / "Cancel subscription" / "Your current plan"
- **Impact:** Confusing UX; potential to double-charge if button is functional (need to verify backend); brand-damaging on launch
- **Severity:** P1 — UX bug touching paid plan management

### P1 broken UX (batch 2) — i18n continued

#### QA-009 — i18n coverage matrix: ALL authed routes have partial-to-zero RU coverage [P1 — single root issue, multiple surfaces]

Summarising RU coverage observed in batch 1 + 2 (both confirmed):

| Route | Sidebar | Page heading | Body content | Sub-nav | CTAs/buttons | Coverage |
|-------|:------:|:-----:|:-----:|:-----:|:-----:|:-:|
| /dashboard | ✅ | ✅ | partial — KPIs untranslated | n/a | partial | ~50% |
| /clients | ✅ | ✅ (Клиенты) | ❌ table headers + filter chips + KPIs all English | ✅ | ❌ "New Client" English | ~30% |
| /projects | ✅ | ✅ | ❌ KPIs + status pills + filter chips + view tabs all English | ✅ | ❌ "New Project" English | ~30% |
| /invoices | ✅ | ✅ (Счета) | ❌ KPIs + filter chips + status badges + banner all English | ✅ | ❌ "New Invoice" English | ~30% |
| /proposals | ✅ | ✅ (Коммерческие предложения) | ❌ entire Proposal Generator form English | ✅ | ❌ all CTAs English | ~10% |
| /contracts | ✅ | ❌ "Contracts" English | ✅ empty-state body translated | ✅ | ❌ "New Contract" / "Generate AI" / "More" English | ~50% |
| /work/time | ✅ | ✅ (Учёт времени) | ❌ Timer/Timesheet/Analytics tabs + Time Tracker + all buttons English | ✅ | ❌ Pomodoro/Invoice Time/Export CSV English | ~20% |
| /analytics | ✅ | ✅ (Аналитика) | partial — KPI cards translated, heatmap chart card NOT translated | ❌ subnav (Overview/Time/Forecast/...) English | ✅ tab labels translated | ~50% |
| /settings root | ✅ | ✅ (Настройки) | ✅ Profile + Appearance translated | n/a | ✅ Save Profile translated | ~95% (only "Profile Photo / JPG, PNG or WebP" caption English) |
| /settings/api | ✅ | ❌ "API Keys" English | ❌ all English | n/a | ❌ "+ New Key" English | ~5% (probably acceptable — API docs convention) |
| /upgrade | ✅ | ❌ all English | ❌ all English | n/a | ❌ all English | ~5% |

- **Suspect file(s):** likely a mix of:
  - Hardcoded English strings instead of `t('...')` calls in widget components (Dashboard KPI cards, Clients table headers, Projects view tabs, Invoices banner, Work/Time tracker UI)
  - Missing keys in `messages/ru.json` (translations not authored yet)
  - TopBar uses route name from layout metadata not from i18n catalog (causes "Contracts"/"API Keys" page-heading bleed)
- **Severity:** P1 — half-translated product feels broken for RU users; launch-quality risk

### P2 visible bugs (batch 2)

#### QA-010 — /work/time Timer card: 3 empty unlabeled input fields [P2]
- **Where:** /work/time Timer tab, between Templates button and the Start/Billable controls
- **Symptom:** Three empty input fields render with no labels, no placeholder text. User can't tell what to type (client? project? task? notes?)
- **Evidence:** `work_time_chromium_en_desktop_above-fold.png`
- **Suspect file:** `TimerWidget.tsx` (or equivalent) — input fields missing placeholder OR label props
- **Impact:** Core Time Tracker feature is unusable until user discovers labels via tooltip/focus
- **Severity:** P2 (not P1 because Start button still works — but UX is broken without context)

#### QA-011 — Timezone hardcoded UTC re-confirmed in /settings/digest + /settings/reminders [P1 inherited backlog]
- **Where:** /settings/digest "Delivery Time (UTC)" dropdown, /settings/reminders "Runs daily at 10:00 AM UTC"
- **Symptom:** All time-of-day UI surfaces use UTC instead of user's local timezone
- **Evidence:** `settings_digest_*.png`, `settings_reminders_*.png`
- **Note:** Pre-existing memory `backlog_timezone_hardcoded` P1 — re-confirmed across 2 more routes
- **Severity:** P1 — confusing for users globally; will cause reminder send-time complaints

### P3 polish (batch 2)

#### QA-012 — /upgrade mobile: "Most popular" + "Current plan" badges overlap visually on Pro card [P3]
- **Where:** /upgrade WebKit iPhone 14 Pro mobile
- **Symptom:** Two absolutely-positioned pills (purple "Most popular" + green "Current plan") align on the same row above the Pro card; on mobile narrow width they appear visually crowded
- **Evidence:** `upgrade_webkit_en_mobile_above-fold.png`, `upgrade_webkit_ru_mobile_above-fold.png`
- **Severity:** P3 — cosmetic, not blocking

#### QA-013 — /work/time mobile: purple Floating Action Button overlaps Project Scope textarea on /proposals [P3]
- Wait — actually proposals, not /work/time. Affecting /proposals mobile WebKit.
- **Where:** /proposals WebKit mobile
- **Symptom:** The purple lightning/AI FAB (bottom-right) overlaps the bottom of the "Project Scope *" textarea, partially covering placeholder text "Describe the project: what needs to be built, key requirements, special constraints..."
- **Evidence:** `proposals_webkit_en_mobile_above-fold.png`
- **Suspect:** FAB positioned `fixed bottom-4 right-4` without scroll-padding adjustment on form pages
- **Severity:** P3 — placeholder text is partially obscured but content still typeable

#### QA-014 — /settings/late-fees "Save Settings" CTA always-enabled [P3]
- **Where:** /settings/late-fees
- **Symptom:** Save Settings purple primary CTA is enabled by default; clicking with no changes still triggers PATCH
- **Evidence:** `settings_late-fees_chromium_en_desktop_above-fold.png`
- **Severity:** P3 — standard form-dirty pattern improvement; not blocking

#### QA-015 — /settings/availability label-case inconsistency [P3]
- **Where:** /settings/availability — 2x2 status pill grid
- **Symptom:** Pill names mix one-word ("Available", "Limited", "Unavailable") with three-word ("Open to Work") — inconsistent casing convention. Section headers are SCREAMING-CAPS ("AVAILABILITY STATUS", "WEEKLY CAPACITY", "AVAILABILITY NOTE") which is loud
- **Evidence:** `settings_availability_chromium_en_desktop_above-fold.png`
- **Severity:** P3 — design-system polish

#### QA-016 — /settings/api → /upgrade redirect + page-heading "API Keys" English-only on RU [P3]
- **Where:** /settings/api
- **Symptom:** Renders but everything is English (1053 endpoints, API Reference, BASE URL etc.) — probably acceptable for developer docs convention, but at least empty state copy "No API keys yet. Create one to get started." + "+ New Key" CTA should translate
- **Evidence:** `settings_api_chromium_ru_desktop_above-fold.png`
- **Severity:** P3 — developer audience tolerates English API docs

---

## Batch 2-unauth findings — public marketing pages (/, /pricing, /about, /contact, /privacy, /terms, /blog, /faq)

### POSITIVE — public pages are FULLY localized to RU [contrast with authed]

The complete marketing surface translates cleanly:
- `/` homepage: hero copy, dashboard mockup labels, all CTAs, top nav, cookie banner — all RU ✓
- `/pricing`: tier names, prices, feature lists, "Most popular" / "Coming soon" badges, all CTAs — all RU ✓
- `/about`: "Our Story" hero, mission copy — all RU ✓
- `/contact`: form, "General support", response time copy — all RU ✓
- `/blog`: "LancerWise Blog" + "Freelance Knowledge Base" + category chips — all RU ✓
- `/faq`: "Frequently Asked Questions" + category headers — all RU ✓

This strengthens QA-009 conclusion: i18n discipline IS in place for marketing surfaces; the gap is **specifically inside authed-app message catalogs**, not the framework.

### P2 visible bugs (batch 2-unauth)

#### QA-017 — /pricing public ↔ /upgrade authed feature-list inconsistency [P2]
- **Where:** /pricing (logged-out) vs /upgrade (logged-in)
- **Symptom:** Pro plan feature list differs between public + app surfaces:
  - **/pricing public:** 8 features (Unlimited clients, Unlimited AI generations (12+ features), AI Business Advisor, AI Contract Risk Analyzer, Payment reminder automation, Recurring invoices, Custom branding, Priority email support)
  - **/upgrade authed:** 12 features (above 8 PLUS Revenue forecasting, Project profitability reports, Pre-signing checklists, ...wait `/pricing` lacks: Revenue forecasting, Project profitability reports, Pre-signing checklists, Custom branding)
- **Evidence:** `pricing_chromium_en_desktop_above-fold.png` + `upgrade_chromium_en_desktop_above-fold.png`
- **Also:** /pricing public "Save 20%" toggle copy vs /upgrade authed "Save 17-20%" copy — inconsistent
- **Severity:** P2 — pricing-surface inconsistency hurts trust + perception of feature coverage; pre-launch must align

#### QA-018 — /privacy + /terms 100% English on RU locale [P2 GDPR risk]
- **Where:** /privacy, /terms
- **Symptom:** Top nav RU but legal-doc body untranslated. GDPR Art. 12 requires "clear and plain language" — does NOT explicitly mandate locale-specific translation, but national consumer-protection laws in RU + EU may require local-language privacy disclosure when targeting users in those locales
- **Evidence:** `privacy_chromium_ru_desktop_above-fold.png`, `terms_chromium_ru_desktop_above-fold.png`
- **Severity:** P2 (compliance/legal risk) — verify with legal counsel pre-launch; if not legally required, downgrade to P3

### P3 polish (batch 2-unauth)

#### QA-019 — /pricing card width inconsistent across 3 tiers [P3]
- **Where:** /pricing public — Free / Pro / Business cards
- **Symptom:** Pro card is wider + has purple highlight background, Free + Business cards are narrower with dark borders — visual asymmetry intentional but creates layout instability when comparing feature lists side-by-side
- **Evidence:** `pricing_chromium_en_desktop_above-fold.png`
- **Severity:** P3 — design choice, not a bug per se

---

## Known caveats inherited from prior probes — STATUS UPDATE

| Caveat | Source | Severity | Status |
|--------|--------|----------|--------|
| F1 Turnstile widget presence ambiguous (CSS selector miss) | SMOKE-RESULTS-AGENT3-2026-05-21 | P1 | ✅ **RESOLVED** — visually confirmed present on /register + /login + /forgot-password, both EN + RU (see `register_*.png`, `login_*.png`, `forgot-password_*.png`); my prior CSS selector `iframe[src*="turnstile"]` was stale/wrong but widget IS mounted + functional |
| React #418 on /work/time Chromium (was WebKit-only) | SMOKE-RESULTS-AGENT3-2026-05-21 | P2 | Tracked post-launch, console noise only |
| WebKit React #418 on /settings (pre-existing per launch-baselines) | VERDICT-94-V2-v1.md | P2/P3 | Tracked post-launch |

---

## Evidence inventory (updated per batch)

`EVIDENCE/page-screenshots/` — page-level screenshots (above-fold + fullPage per cell)
`EVIDENCE/auth-flows/` — signup/signin/reset/logout/expiry sequences
`EVIDENCE/crud-flows/` — clients/projects/invoices/proposals/time/contracts create/edit/delete
`EVIDENCE/widget-overlaps/` — annotated overlap captures
`EVIDENCE/edge-cases/` — empty/full/error/search/filter
`EVIDENCE/design-inconsistencies/` — typography/color/spacing/icon drift captures

---

## Cross-references

- Prior smoke verdict: [`../agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md`](../agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md)
- #94 v2 PASS verdict: [`../agent3-94-settings-verify/VERDICT-94-V2-v1.md`](../agent3-94-settings-verify/VERDICT-94-V2-v1.md)
- #93 Stage 2 v2 PASS verdict: [`../agent3-93-stage-2-v2-verify/VERDICT-STAGE2-V2-v1.md`](../agent3-93-stage-2-v2-verify/VERDICT-STAGE2-V2-v1.md)
- LESSONS-LEARNED: [`../agent3-93-stage-1-verify/LESSONS-LEARNED.md`](../agent3-93-stage-1-verify/LESSONS-LEARNED.md)
