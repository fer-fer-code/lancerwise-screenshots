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
| PART C batch 1 — main authed pages | ✅ DONE | 1 P1, 2 P2, 3 P3 | commit 95558dc |
| PART C batch 1 — unauth (register/login/forgot-password) | ✅ DONE | 0 (Turnstile present) | commit 95558dc |
| PART C batch 2 — work/time + /settings/* (10) + /upgrade + /analytics + /contracts | ✅ DONE | 3 P1, 4 P2, 6 P3 | commit 8732fc3 |
| PART C batch 2 — public unauth (/, /pricing, /about, /contact, /privacy, /terms, /blog, /faq) | ✅ DONE | 1 P2, 1 P3 | commit 8732fc3 |
| PART A — auth flow probes (signup/signin/forgot/reset/logout/expiry) | ✅ **P0 FOUND** | **1 P0** | commit 37784d5 |
| PART D — widget overlap scan | ✅ DONE | 1 P2 + 5 P3 (cross-ref existing) | commit 8732fc3 |
| PART E — edge cases (404/search/filter/empty/full/error) | ✅ DONE | 1 P1, 5 P2 | commit feda749 |
| PART B — CRUD entry forms (/clients/new, /invoices/new, /projects/new, /contracts/new, /proposals/generate) | ✅ DONE | 0 (all forms clean) | commit feda749 |
| PART F — design consistency audit | ✅ DONE | 0 new (4 P3 cross-ref existing) | commit 8732fc3 |

---

## 🎯 FINAL VERDICT

**Aggregate severity inventory** (after all 4 batches + 3 worker passes):

| Severity | Count | Items |
|:--------:|:-----:|-------|
| **P0 LAUNCH-BLOCKER** | **1** | QA-P0-001 (malformed cookie crashes middleware) |
| **P1 broken UX** | **6** | QA-001 (i18n authed routes), QA-007 (/upgrade RU 100% English), QA-008 (Current plan + Upgrade-to-Pro CTA contradiction), QA-009 (i18n coverage matrix), QA-011 (timezone UTC hardcoded), QA-P1-101 (/clients/pipeline USD NaN + KPI mismatch) |
| **P2 visible bugs** | **10** | QA-002 (welcome modal blocks dashboard), QA-005 (hardcoded $), QA-010 (Timer 3 unlabeled inputs), QA-017 (/pricing↔/upgrade feature mismatch), QA-018 (/privacy+/terms 100% English RU), QA-P2-101 (two proposal generators), QA-P2-102 (work/time tabs not URL-sync), QA-P2-103 (/analytics/overview 404), QA-P2-104 (/clients filter KPI mismatch), QA-020 (welcome modal scroll-lock) |
| **P3 polish** | **15+** | QA-004 (Budget pill collision), QA-006 (en-US dates), QA-012 (mobile pricing badges crowd), QA-013 (FAB overlap textarea), QA-014 (Save-Settings always-enabled), QA-015 (Availability casing mix), QA-016 (Settings/api RU), QA-019 (pricing card width), QA-021-025 (widget stacking), QA-031-034 (header/casing/icon variation), QA-P2-105 (proposals/new URL inconsistency), plus inherited backlog re-confirmations |

**P0 fix urgency:** before ANY user-visible launch traffic. Estimated 1-line fix.

**P1 fix urgency:** within 24-48h before launch — these are quality-perception bombs (especially i18n + plan-status contradiction).

**P2 fix urgency:** week 1 post-launch maintenance window acceptable.

**P3:** quarterly polish backlog.

### LAUNCH-READINESS CALL

**❌ DO NOT LAUNCH** until QA-P0-001 is fixed + verified. The 500 crash on malformed cookie is real-world reachable + customer-stranding (no recovery CTA + bare Vercel error page).

**Recommended pre-launch P1 fixes:**
1. QA-P0-001 (cookie middleware) — 1-line try/catch (~15 min)
2. QA-008 (/upgrade Current plan + Upgrade CTA logic) — small UI conditional (~30 min)
3. QA-P1-101 (/clients/pipeline NaN + KPI mismatch) — null-handling + KPI query consistency (~1-2h)
4. QA-001 + QA-007 + QA-009 (i18n gap on authed surfaces) — message catalog completion (largest scope, ~4-8h)

**P0 + P1 fix total estimate: ~6-12h focused work.**

After fixes, re-run probes to confirm:
- `node /tmp/qa_session_variants.js` — confirm all variants land at /login (no more 500)
- `node /tmp/qa_capture.js --engine chromium --locale ru --viewport desktop --routes /clients,/invoices,/proposals,/upgrade,/work/time --authed true` — confirm RU text replaces English where it should

---

---

## Findings (severity-sorted, populated as captures arrive)

### P0 launch-blockers

#### QA-P0-001 — Malformed auth cookie crashes middleware with 500 INTERNAL_SERVER_ERROR (no redirect to /login) [P0 LAUNCH BLOCKER]

**Repro (deterministic across 6 cookie variant tests):**
| Cookie value | Status | Lands at | Verdict |
|--------------|:------:|----------|:------:|
| no cookie | 200 | `/login` | ✅ correct |
| empty string `""` | 200 | `/login` | ✅ correct |
| random non-prefixed string | 200 | `/login` | ✅ correct |
| **`base64-INVALIDCOOKIESTRING`** | **500** | **`/dashboard`** | ❌ **CRASH** |
| truncated valid cookie | 200 | `/login` | ✅ correct |
| `base64-` (empty payload) | 200 | `/login` | ✅ correct |

**Symptom:** When the auth cookie `sb-<ref>-auth-token` starts with `base64-` prefix AND contains characters that decode to non-JSON bytes, the Next.js middleware throws an uncaught exception. The user sees a bare Vercel error page:
```
500: INTERNAL_SERVER_ERROR
Code: `MIDDLEWARE_INVOCATION_FAILED`
ID: `hkg1::8b5zr-1779419022150-e361fee96665`
```

**Where:** Any authed route (/dashboard tested explicitly; suspected to affect ALL protected routes since middleware runs globally)

**Real-world repro vectors:**
- Browser corrupts cookie storage (Chrome version updates have done this historically)
- User pastes a partial cookie from devtools/clipboard
- Cookie length proxied through CDN/load balancer with header-size limits
- Ad blockers / privacy extensions partially scrub cookies but leave `base64-` prefix
- Session expiry where Supabase rotates the cookie partially

**Suspect root cause:** `middleware.ts` (or equivalent) calls something like:
```ts
const session = JSON.parse(Buffer.from(cookieValue.slice(7), 'base64').toString());
```
without try/catch — and `JSON.parse("garbage")` throws. Need to wrap in try/catch + clear cookie + 302 → /login.

**Evidence:**
- `EVIDENCE/auth-flows/session_variant_base64_prefix_invalid_chromium_desktop.png` — the 500 error page
- `EVIDENCE/auth-flows/session_variants.json` — full 6-variant matrix
- `EVIDENCE/auth-flows/session_expiry_redirect_chromium_desktop.png` — earlier capture of same bug

**Impact:** Any production user whose cookie becomes malformed gets a bare Vercel 500 with NO LancerWise branding, NO recovery CTA, NO sign-in link. They're stranded with a Vercel error ID and no path forward. Brand-damaging on launch + customer-support flood likely.

**Severity rationale:** P0 because:
1. Real-world occurrence rate non-zero (cookie corruption happens in field)
2. Error page is BARE Vercel default — no branding, no recovery
3. Affects ALL protected routes (middleware runs globally)
4. Easy 1-line fix (wrap JSON.parse in try/catch + return redirect)
5. Discoverability low (engineers won't see this themselves with valid sessions)

**Fix sketch:**
```ts
// middleware.ts
try {
  const session = JSON.parse(Buffer.from(cookieValue.slice(7), 'base64').toString());
  // proceed with auth check
} catch (e) {
  const response = NextResponse.redirect(new URL('/login', req.url));
  response.cookies.delete(`sb-${REF}-auth-token`);
  return response;
}
```

**Verify after fix:** re-run `node /tmp/qa_session_variants.js` and confirm `base64_prefix_invalid` variant lands at /login (not 500).

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

#### QA-003 — RETRACTED — Welcome tour modal IS translated to RU
- Original observation was a misread (mixed-up cell screenshots). On re-verification: `dashboard_chromium_ru_desktop_above-fold.png` shows "Добро пожаловать в LancerWise" + "Короткий 60-секундный тур по интерфейсу. Можно пропустить — нажмите Esc." + "1 из 5" + "← Назад" / "Далее →" all in RU. Modal IS correctly localized.

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

## PART D — Widget overlap detection (sweep from all captured screenshots)

### P2 (batch D)

#### QA-020 — /dashboard welcome tour modal locks body scroll [P2 — restating QA-002]
- All `dashboard_*_full.png` show identical content to `_above-fold.png` because the welcome modal sets `body { overflow: hidden }` while open
- Effect: full-page screenshots can't capture full dashboard scroll length while modal is open — this is intended modal-behavior but blocks accessibility for users who can't dismiss the modal (e.g. keyboard-only with broken focus trap)
- **Evidence:** every `dashboard_*_full.png` file (4 cells, identical to above-fold)
- **Severity:** P2 (modal scroll-lock works as designed but worth verifying ESC keyboard dismissal + screen-reader announcement)

### P3 (batch D)

#### QA-021 — Cookie consent banner persistently visible at bottom [P3]
- **Where:** Every captured page (all 28 routes × 4 cells = 112 cells)
- **Symptom:** Cookie consent banner "Cookie preferences: We use cookies…" + Customize/Reject/Accept All persists at bottom of viewport on every page. Always visible until user makes a choice
- **Evidence:** Visible in every screenshot
- **Impact:** Slightly reduces vertical space for content (banner is ~50px on desktop, ~80px on mobile). No measurement of overlap with critical CTAs needed because banner uses sticky-bottom positioning + opaque background — content is not hidden, just compressed
- **Severity:** P3 — standard GDPR consent pattern; user dismisses once

#### QA-022 — Notifications "4/7 setup" pill bottom-left + Cookie banner bottom-center potential overlap on mobile [P3]
- **Where:** Mobile WebKit views — both /clients, /dashboard, etc.
- **Symptom:** The "4/7 setup" notifications pill (with bell icon) sits at bottom-left of viewport; the cookie banner sits across the bottom. On WebKit mobile 393×852, when notifications pill is positioned `fixed bottom-4 left-4`, it may stack below or beside the cookie banner depending on z-index + cookie banner height
- **Evidence:** `clients_webkit_*_mobile_above-fold.png`, `dashboard_webkit_*_mobile_above-fold.png`
- **Severity:** P3 — minor stacking; verify on real iPhone for clarity

#### QA-023 — /proposals mobile FAB overlaps Project Scope textarea [P3 — restating QA-013]
- See QA-013

#### QA-024 — /upgrade mobile "Most popular" + "Current plan" badges crowd each other [P3 — restating QA-012]
- See QA-012

## PART E — edge cases + PART B — CRUD entry points

### ✅ POSITIVE — 404 page is branded + has recovery CTAs

`/this-route-does-not-exist-12345` returns 404 status correctly, with LancerWise-branded error page: large "404 / Page not found" + "The page you're looking for doesn't exist or has been moved." + dual CTAs ("Go to dashboard" purple + "Back to home" outline). Cookie banner present. Both authed + unauth sessions get the same page.

**Evidence:** `EVIDENCE/edge-cases/E1_404_authed_chromium_desktop.png`, `E2_404_unauth_chromium_desktop.png`

**This sharply contrasts with QA-P0-001's bare Vercel 500 page** — 404 has full branding + CTAs; 500 has none. Fix for QA-P0-001 should align with the 404 branding pattern.

### ✅ POSITIVE — All CRUD entry forms render cleanly

| Route | Form / Layout | Verdict |
|-------|---------------|:------:|
| /clients/new | 3-step wizard (Basic Info / Project Context / Review) | ✅ clean |
| /invoices/new | Single page, Templates CTA, Line Items table, Currency dropdown | ✅ clean |
| /projects/new | Single page, Quick Templates pills, AI Name Generator panel, AI Milestones hint | ✅ clean |
| /proposals/generate (redirect from /new) | AI Proposal Generator, 3 Tone cards (Friendly/Formal/Technical) | ✅ clean BUT different from /proposals root form (see QA-P2-NEW-001) |
| /contracts/new | Title / Client / End Date / Contract Value / Content | ✅ clean |

**Evidence:** `EVIDENCE/edge-cases/E6_clients_new_step1.png`, `E7_invoices_new.png`, `E8_projects_new.png`, `E11_proposals_new.png`, `E12_contracts_new.png`

### ✅ POSITIVE — search functionality works via URL query

- `/clients?q=Pixel` → 200 status, table filtered to matching clients, URL preserves search term (✓ shareable + bookmarkable)
- `/clients?q=ZZZZNOMATCH` → 200 status, empty-results state rendered
- **Evidence:** `E3_clients_search_pixel_*.png`, `E4_clients_search_no_match_*.png`

### P1 broken UX (PART E new findings)

#### QA-P1-101 — /clients/pipeline "USD NaN" + KPI mismatch [P1]
- **Where:** /clients/pipeline (Pipeline view)
- **Symptom 1:** One card "Ridgeline Consulting / Marketing" displays "USD NaN" instead of a numeric value — JavaScript's `NaN` exposed to user
- **Symptom 2:** KPI cards show ACTIVE LEADS 0 / PIPELINE VALUE USD 0 / FOLLOW-UPS DUE 0 but the kanban shows 6 visible client cards with values summing ~USD 25,000+ (1,500 + 5,000 + 12,000 + 5,000 + NaN + 1,500). KPI totals don't reflect cards on screen
- **Evidence:** `EVIDENCE/edge-cases/E13_clients_pipeline_chromium_desktop.png`
- **Suspect:** `PipelinePage.tsx` (or component) — null/undefined budget field for Ridgeline Consulting → `Number(undefined).toLocaleString()` produces NaN; KPI computation may be querying a different leads dataset (or empty results)
- **Severity:** P1 — visible data quality bug + numeric "NaN" string in customer-facing UI is brand-damaging

### P2 visible bugs (PART E new findings)

#### QA-P2-101 — /proposals two different generators on /proposals vs /proposals/generate [P2]
- **Where:** /proposals (root) vs /proposals/generate (redirect target of /proposals/new)
- **Symptom:** Two distinct proposal-generation forms exist:
  - **/proposals root:** "Proposal Generator" with Your Name / Client Name / Client Email / Service Type (Web Development dropdown) / Project Scope / Budget+Currency / Timeline / Tone (4 options: Professional/Friendly/Bold/Concise) / Expiry Date / + Templates + AI Brief + Generate with AI buttons
  - **/proposals/generate:** "AI Proposal Generator" with Project Type (Website Development) / Client Industry / Budget Range / Timeline / Key Requirements / Your Relevant Experience / Tone (3 cards: Friendly/Formal/Technical) / + Use Template / Generate Proposal
- **User experience:** Confusing — two routes, two forms, same purpose. Unclear which to use
- **Severity:** P2 — consolidate or clearly differentiate (e.g. "Quick proposal" vs "AI-assisted detailed proposal")

#### QA-P2-102 — /work/time tabs don't sync to URL query string [P2]
- **Where:** /work/time?tab=timesheet, /work/time?tab=analytics
- **Symptom:** URL accepts `?tab=` query param but state doesn't activate the corresponding tab — pages all show the default Timer view. Identical bodyLen (15,243) across all 3 query params confirms no state switch occurred
- **Impact:**
  - Users can't bookmark a specific tab
  - "Open in new tab" link sharing from sidebar nav broken
  - Browser back/forward doesn't navigate tabs
- **Suspect file:** `WorkTimePage.tsx` (or equivalent) — tab state should be `useSearchParams` + push, not pure useState
- **Evidence:** `E14_work_time_timesheet_*.png`, `E15_work_time_analytics_*.png`
- **Severity:** P2 — affects shareability + accessibility

#### QA-P2-103 — /analytics/overview returns 404 but is linked from /analytics sidebar [P2]
- **Where:** /analytics page sidebar shows "Overview" sub-nav link, but `/analytics/overview` returns 404
- **Evidence:** `E17_analytics_overview_chromium_desktop.png` (404 page rendered correctly but accessed from a sidebar link in /analytics)
- **Note:** Pre-existing memory `backlog_dead_urls_cleanup` lists 6 dead routes; /analytics/overview is one
- **Severity:** P2 — clean sidebar + remove dead routes pre-launch

#### QA-P2-104 — /clients filter chip applied but KPI cards don't update [P2/P3]
- **Where:** /clients with Gold tier filter active
- **Symptom:** Filter chip "Gold" applied → table filtered to 1 client, NEW "Top Clients by Revenue" section appears, but KPI cards (TOTAL CLIENTS 8 / ACTIVE 8 / REVENUE YTD $20,072 / WITH OVERDUE 2) remain unchanged — they show ALL-client stats
- **Expected behavior:** Either (a) KPI cards update to filtered subset OR (b) KPI cards have label clarifying "(all clients)" while table shows filtered
- **Evidence:** `E5_clients_filter_gold_chromium_desktop.png`
- **Severity:** P2 — confusing UX; the mismatch implies cards are non-respecting filter

#### QA-P2-105 — /proposals/new → /proposals/generate redirect chains [P3]
- **Where:** /proposals/new (no slash, no path) → redirects to /proposals/generate
- **Symptom:** Inconsistent route convention — most "new" routes use `/{entity}/new` pattern (clients/new, invoices/new, projects/new, contracts/new), but /proposals uses `/proposals/generate` and `/proposals/new` redirects to it
- **Severity:** P3 — minor URL inconsistency; consider unifying to /proposals/new

### POSITIVE polishes observed in /clients/new wizard

- Clear 3-step indicator with current step highlighted
- Required field markers (*) consistent
- Optional fields explicitly labeled "(optional)"
- "Share Intake Form Instead" alternative CTA top-right — smart UX for delegating data entry to client
- Country dropdown — supports international clients

---

## PART F — design consistency observations (sweep from all captured screenshots)

### P3 polish

#### QA-031 — Page header pattern inconsistent across routes [P3]
- **Where:** Top-bar page heading
- **Symptom:** Different routes use different header rendering patterns:
  - `/dashboard`: top-bar shows "Dashboard" only; main content has "Good morning, QA" hero
  - `/clients`: top-bar "Clients", main heading also "Clients" (duplicate)
  - `/projects`: same duplicate pattern
  - `/invoices`: same duplicate
  - `/proposals`: top-bar "Proposals" + main heading "Proposal Generator" (different)
  - `/contracts`: top-bar "Contracts" + main heading "Contracts" (duplicate)
  - `/work/time`: top-bar "Time Tracker" + main heading also "Time Tracker" (duplicate)
  - `/settings`: top-bar "Settings" + main heading also "Settings" (duplicate)
  - `/settings/api`: top-bar "Settings" + main heading "API Keys" (different — better pattern)
  - `/upgrade`: top-bar "LancerWise" (logo only) + main heading "Upgrade your plan"
- **Suggestion:** Pick one consistent pattern. Recommended: top-bar = route path, main heading = "Action context" (e.g. /clients top-bar "Clients", main heading "Your clients" or "8 clients"); /settings/api shows the pattern done right.
- **Note:** Already covered by pre-existing memory `backlog_page_header_pattern.md`
- **Severity:** P3 — design-system consistency call

#### QA-032 — Section header casing inconsistent (UPPERCASE vs Title Case) [P3]
- **Where:** Various card section headers
- **Symptom:** Mixed conventions across the app:
  - `/dashboard`: "Today's Agenda", "Revenue & Activity Hub", "Activity Feed", "Revenue — Last 12 Weeks" → Title Case + Sentence Case
  - `/clients`: KPI labels "TOTAL CLIENTS", "ACTIVE", "REVENUE YTD", "WITH OVERDUE" → ALL CAPS
  - `/invoices`: KPI labels "PAID", "PENDING", "OVERDUE", "UNBILLED" → ALL CAPS
  - `/settings/availability`: "AVAILABILITY STATUS", "WEEKLY CAPACITY", "AVAILABILITY NOTE" → ALL CAPS
  - `/settings/digest`: "Delivery Settings", "Sections to Include" → Title Case
  - `/settings/reminders`: "AUTOMATION SETTINGS", "EMAIL TEMPLATE PREVIEWS", "RECENT REMINDERS SENT" → ALL CAPS
- **Suggestion:** KPI-card mini-labels stay UPPERCASE (looks like data-row labels). Card section headers should be Title Case for readability.
- **Note:** Already covered by `backlog_label_casing_consistency.md`
- **Severity:** P3

#### QA-033 — Floating widgets stacking in bottom-right [P3]
- **Where:** Authed pages — bottom-right corner
- **Symptom:** Up to 3 widgets occupy bottom-right area: purple lightning FAB (always visible), Notifications "4/7 setup" pill (bottom-LEFT), GlobalTimerBar (when timer running), Shortcuts pill (bottom-left, mobile). Plus cookie banner sticky-bottom across entire viewport
- **Risk:** On mobile (393×852), bottom-half viewport is dominated by floating widgets + cookie banner. Real content forced to ~70% of viewport height
- **Evidence:** Multiple `*_webkit_*_mobile_above-fold.png` show this pattern
- **Severity:** P3 — minor mobile real-estate loss; verify post-cookie-banner-dismiss

#### QA-034 — KPI card icon position varies [P3]
- **Where:** /dashboard, /clients, /projects, /invoices, /analytics KPI rows
- **Symptom:** Some KPI cards have small icon top-right ($, ⏱, etc.), some don't, some have different visual weight
- **Severity:** P3 — design-system polish

### POSITIVE — design strengths observed

- **Empty states are CONSISTENT** across /contracts, /settings/tags: icon + headline + body + dual CTA pattern (verified visually)
- **Dark theme contrast is consistent** across all routes
- **Sidebar nav is identical pattern** across all authed pages
- **Cookie banner is identical** across all pages (sticky bottom, 3 buttons, same copy)
- **Loading states present** — most pages have visible content within 5s networkidle
- **Currency symbol is consistent** ($ everywhere — though this is the P0/P1 hardcoded bug, the consistency at least means easy global find-replace)

#### QA-025 — /work/time: GlobalTimerBar floating widget bottom-right + FAB bottom-right potential overlap [P3]
- **Where:** Any authed page (GlobalTimerBar mounts globally per smoke F6 verdict)
- **Symptom:** The lightning FAB (bottom-right purple circle) + GlobalTimerBar (when timer running) both occupy bottom-right area. Smoke verdict noted GlobalTimerBar fires `time_entries` REST on every authed route. If timer is RUNNING, both widgets may stack visually
- **Note:** Fixture user has no active timer in current screenshots so GlobalTimerBar shell visible at top-banner area as "Week Progress" not as floating widget. To repro overlap, start a timer + capture mobile screenshot
- **Severity:** P3 — verify post-launch with active-timer user

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
