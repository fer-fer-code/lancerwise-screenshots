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
| PART C batch 1 — main authed pages (dashboard/clients/projects/invoices/proposals) | ✅ DONE | 1 P1, 2 P2, 3 P3 | pending push |
| PART C batch 2 — work/time + /settings/* + /analytics + /pricing/upgrade | ⏳ pending | — | — |
| PART C batch 3 — auth/unauth pages (register/login/forgot-password) | ⏳ pending | — | — |
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
