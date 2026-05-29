# Zone A Visual Audit — Core Nav + Dashboard + Clients + Projects + Invoices

**Date:** 2026-05-29
**Author:** [AGENT 1] (Zone A)
**HEAD audited:** `e233c946` (production www.lancerwise.com)
**Viewport:** 1280 × 1024
**Auth:** Supabase Admin magic-link для krokusstudia2@gmail.com
**Locale:** EN (default, no NEXT_LOCALE cookie); Heavy 10 RU i18n verified в separate audit `clients-i18n-cp2-cp3-2026-05-27/`
**Visual ground truth:** `globals.css` design tokens — `--brand-gradient: linear-gradient(135deg, #483ACC, #935AF0, #F897FE)`, `--canvas #0F0A18`, `--surface #15101D`, `--card #1A1525`, `--elevated #221B2E`, `--accent-primary #6A5AE0`

---

## TL;DR

| Metric | Value |
|---|---:|
| Routes probed | **21** (4 explicit + 2 dashboard subs + 17 pass-2 enumerated) |
| HTTP 4xx/5xx on initial nav | **0** |
| Console errors observed | **0** |
| Pageerror exceptions | **0** |
| Network 4xx/5xx (excluding tracking) | **0** |
| **P0 (page/critical flow broken)** | **0** |
| P1 (widget broken or empty where data expected) | **2** |
| P2 (visible defects) | **3** |
| P3 (cosmetic/known) | **3** |
| Known-batch-C (Anthropic 400/credit_balance) re-hits | **0** (not exercised on probed routes; AI briefing rendered successfully) |

**Zone A is clean of P0 blockers. No 5xx, no JS exceptions, no broken navigation.**

---

## Findings table (per route)

Probe instrumentation: console listener + pageerror listener + response listener (status ≥ 400, excluding `_next/static`, `vitals.vercel-insights`, `va.vercel`). DOM census: h1, h2/h3 list, `bg-card`/`bg-elevated` element count, empty-state phrase scan.

### Explicit Zone A — main route list

| URL | h1 | Widgets | Status | Load | Findings | Sev |
|---|---|---:|:---:|---:|---|---|
| `/dashboard` | "Dashboard" | 47 cards | 200 | 7534ms | Welcome tour modal auto-shows (new-account-onboarding flag still set). Activity Feed has 3× "Logged 0 min: untitled" entries (P2 → see below). Revenue chart empty ("No revenue yet") — expected, no data. | P2 |
| `/clients` | "Clients" | 31 cards | 200 | 6788ms | Total 10, Active 2, Revenue YTD $0, With Overdue 0. **ALL 10 visible clients show HEALTH grade "F" score "10"** — identical → see P1 #1. | **P1** |
| `/projects` | "Projects" | 29 cards | 200 | — | Split layout (Variant C from `1af51e44`) works. Project Timeline w/ 4 dated projects on Apr→Jun axis. Sidebar widgets: Project Overview / Recent activity / Upcoming deadlines render correctly. Clean. | ✅ |
| `/invoices` | "Invoices" | 39 cards | 200 | — | All 16 invoices have CLIENT="—" (test data, see P2 #3). Tabs `All (16) / 14 draft / 2 overdue`. Overdue banner shows correctly. | P2 |

### Dashboard subroutes

| URL | Variant | Widgets | Load | Findings | Sev |
|---|---|---:|---:|---|---|
| `/dashboard/command-center` | "Good afternoon, krokusstudia2 ⚡" | 11 cards | — | Different greeting (email prefix). Business is ON TRACK 🟢. Revenue Pulse $0 / 0% MoM. KPIs: Active Projects 5, Open Proposals 0, Leads in Pipeline 15, Monthly Retainer MRR $0. Wellbeing widget partially visible. | P2 |
| `/dashboard/briefing` | "Good afternoon — " | 11 cards | — | **Greeting has em-dash fallback, NO NAME**. BUSINESS HEALTH SCORE 70 / Needs Attention. AI-generated briefing text WORKS (acknowledges $1,000 overdue, 5 active projects, $0 revenue) → confirms Anthropic AI cluster healthy on this endpoint. | **P2** |

### Sidebar nav (post-expand enumeration)

```
LancerWise → /dashboard
Settings → /settings
Notifications → /notifications
Money → /money/invoices  (group parent — also /money/expenses, /money/reports under group)
Clients → /clients  (group parent — also /clients/funnel)
Work → /work/projects  (group parent — also /work/time)
```

Each top-level item:

| URL | Findings | Sev |
|---|---|---|
| `/money` | **Aliases `/money/invoices`** (same 16 drafts, same CLIENT="—"). Known per `backlog_seo_duplicate_aliased_routes`. | KNOWN |
| `/money/invoices` | Same as `/invoices` (also aliased). | KNOWN |
| `/money/expenses` | 30 cards, 200, 5350ms. Clean render. | ✅ |
| `/money/reports` | 15 cards, 200, 7036ms. 6 report tiles (Year in Review 2026, Project Profitability, Cash Flow Statement, Weekly Timesheet, Income Statement (P&L), Invoice Aging) + 4 CSV export tiles. All render. | ✅ |
| `/work` | **Aliases `/work/projects` ≡ `/projects`**. Same content. Known alias. | KNOWN |
| `/work/projects` | Same as `/projects`. | KNOWN |
| `/work/time` | "Time Tracker". Tabs Timer/Timesheet/Analytics. Week Progress 0.0h/40h 0%. Timer 00:00:00. This Week empty across Sat-Fri. Fri goal: 8h, 08:00:00 remaining. Clean. | ✅ |
| `/notifications` | "Notification Center" 17 alerts (badge matches). Tabs All/High 16/Medium/Low 1. List of 7+ Invoice overdue alerts visible. **Discrepancy:** Dashboard "Today's Agenda" shows 2 overdue, NotificationCenter shows 17. May be intentional filtering — see P1 #2. | P1 |
| `/settings` | "Settings". Profile (name+email+save), Appearance (Dark selected, Light "COMING SOON", System auto-detect). "Try new navigation" toggle. Clean. | P3 |
| `/contracts` | Empty state "Generate your first AI contract". CTA "Generate with AI" + "Browse Templates". Sidebar Contracts group expanded (All Contracts / Generate / Templates / Retainers). Clean. | ✅ |
| `/analytics` | Work Activity Heatmap (GitHub-style), 2025/2026 tabs. Stats: 66.3h Total, 1 Active Day, 1 day Longest Streak, 0 days Current. KPIs: ALL-TIME REVENUE $0, THIS MONTH $0, TOTAL HOURS 66.3h (66.3h billable), INVOICE CONVERSION 0% (0/16 paid), EFFECTIVE RATE $0/h. Clean. | ✅ |

### Clients subroutes (Heavy 10 i18n verified separately)

| URL | Findings | Sev |
|---|---|---|
| `/clients/funnel` | 15 cards, 200. Renders. (Sidebar shows "Pipeline" → `/clients/funnel`.) | ✅ |
| `/clients/win-back` | i18n RU+EN parity confirmed prior. EN render shows "Win-Back Campaign" → 9 candidates loaded. No regression. | ✅ |
| `/clients/intake` | i18n confirmed prior. EN render OK. | ✅ |
| `/clients/import` | i18n confirmed prior. EN render OK. | ✅ |

---

## P1 — widget broken or empty where data expected

### P1 #1 — `/clients` Health column: all clients show identical "F 10"

**Symptom:** Every visible client row (10/10 in test account) shows HEALTH = "F" grade with score 10. No variance across active/prospect/new clients with different revenue/activity levels.

**Possible causes:**
- **(Most likely)** Health-score default for clients without sufficient activity history is "F 10" — i.e. system shows lowest-possible grade as fallback. If so, expected behaviour for empty test account, but UX confusing.
- **(Less likely but possible)** `/api/clients/<id>/health-score` endpoint returns failed-fallback constant for all. Would need to hit endpoint directly to verify.

**Status:** **new** (not in memory). Cross-link `ClientHealthScore.tsx` (Medium tier, out of CP1-3 i18n scope).

**Recommended verification:** Hit `/api/clients/<existing-client-id>/health-score` directly + check console log of the widget under DevTools, OR have product confirm expected display when client has 0 invoices + 0 projects.

**Screenshot:** `clients-viewport.png`

### P1 #2 — Counter discrepancy: Dashboard "Today's Agenda" 2 vs Notification Center 17

**Symptom:**
- `/dashboard` "Today's Agenda" header reads **"2 items"**, lists 2 overdue invoices (INV-2026-7438, INV-2026-7754, both $500)
- `/notifications` shows **17 alerts** all marked HIGH, listing INV-2026-2037, INV-2026-3871, INV-2026-7438, INV-2026-7754, INV-003, INV-001, INV-002, ...

**Possible causes:**
- **(Most likely)** Today's Agenda intentionally filtered to TODAY's overdue (just-flipped-to-overdue), while NotificationCenter shows ALL unresolved. Product intent.
- **(Less likely)** Today's Agenda has a bug capping at 2 items.

**Status:** **new**. Confirm product intent before classifying as bug.

**Screenshots:** `dashboard-viewport.png`, `notifications-viewport.png`

---

## P2 — visible defects

### P2 #1 — Dashboard greeting inconsistency across 3 variants

| Route | Greeting rendered |
|---|---|
| `/dashboard` | "Good afternoon, **Ramiz**" |
| `/dashboard/command-center` | "Good afternoon, **krokusstudia2 ⚡**" (email local part) |
| `/dashboard/briefing` | "Good afternoon **— **" (em-dash fallback, no name) |

Three different name-resolution paths render three different display values for the same user. The em-dash fallback in `/dashboard/briefing` is the worst — suggests missing user-name lookup OR fallback in component renders bare `—`.

**Status:** **new**. Standardize on profile.full_name with email-prefix fallback (current /dashboard pattern is the correct one).

**Screenshots:** `dashboard-viewport.png`, `dashboard_command-center-viewport.png`, `dashboard_briefing-viewport.png`

### P2 #2 — Dashboard Activity Feed: 3× "Logged 0 min: untitled" entries

**Symptom:** Activity Feed widget on /dashboard shows three identical entries: "Logged 0 min: untitled" with relative timestamp "21h ago / 21d ago".

**Possible causes:**
- Test data noise (test account created 0-duration entries with no title)
- OR time-tracker submission allows 0-min + no-title without server-side rejection — would be a backend validation gap

**Status:** **new**. Verify against time-tracker submission validation in `/api/time-entries` (or wherever the writes happen).

**Screenshot:** `dashboard-viewport.png` (Activity Feed widget bottom-right)

### P2 #3 — `/invoices` table: all 16 rows show CLIENT = "—"

**Symptom:** Every invoice row's CLIENT column renders em-dash. Could be:
- All 16 test invoices were created without `client_id` (most likely — test data quirk)
- OR join-side display is broken (less likely — page renders without errors)

Verifiable: open one invoice detail (e.g. `/invoices/INV-012`) and check whether client field is also empty. If yes → test data; if no → display bug.

**Status:** **new but probably test data**. Not a launch blocker if real-user invoices show client correctly.

**Screenshot:** `invoices-viewport.png`, `money_invoices-viewport.png`

---

## P3 — cosmetic / known

### P3 #1 — Welcome tour modal auto-shows on `/dashboard`

Modal "👋 Welcome to LancerWise — Quick 60-second tour" centered, blocks middle of viewport. Expected for new-account onboarding (test account `8/7 setup` badge in bottom-left sidebar). NOT a bug for production users who completed onboarding. Could be P3 if it persists for completed users.

### P3 #2 — `/settings` Appearance: Light theme "COMING SOON"

Intentional copy: "Light mode is rolling out gradually — System auto-detect resolves to dark for now." Tracked in memory `project_lancerwise_light_theme_audit`.

### P3 #3 — Sidebar group label: "Insights" (group parent of `/analytics`)

Sidebar shows top-level group "Insights" — expandable revealing children Overview/Time/Forecast/Cash Flow/Profitability. The route is `/analytics` but sidebar label is "Insights". Design intent, not a bug.

---

## Known issues confirmed (NOT new)

- **Aliased routes (3× collapse, all functional):**
  - `/projects ≡ /work/projects ≡ /work` (3 URLs, identical content)
  - `/invoices ≡ /money/invoices ≡ /money` (3 URLs, identical content)
  Memory: `backlog_seo_duplicate_aliased_routes`. Pre-launch resolution: replace re-exports с `redirect()` so canonical URL gets indexed.
- **Perf waterfall (P2):** loads 5–9s `networkIdle` на main routes. Memory: `backlog_dashboard_perf_waterfall_requests`.
- **Currency hardcoded "$":** Memory `backlog_currency_hardcoded` P0 (already flagged). Visible everywhere in Zone A.
- **Heavy tier i18n verified post-shipping:** memory `project_heavy_tier_i18n_complete` — clients/win-back, /intake, /import, ClientContacts, OnboardingEmailSequence, MeetingLog, ClientAnalytics, StatementView, communications, history all confirmed RU-ready in `clients-i18n-cp2-cp3-2026-05-27/` + statement hotfix `daae5fa`. No regression on EN locale в this audit.
- **Light theme rollout incomplete:** `project_lancerwise_light_theme_audit`.

---

## Known-batch-C check (Anthropic 400 / credit_balance)

Probe-script's response listener captured 0 4xx/5xx network failures matching the `credit balance` / `claude.*400` regex across **21 routes × 100+ XHR requests each**. Critical anti-evidence: `/dashboard/briefing` rendered an AI-generated briefing text successfully (acknowledging real $1,000 overdue + 5 active projects + $0 revenue), confirming the Anthropic/AI cluster is healthy on at least the briefing endpoint. The `feat(ai-migration): Batch B1 — cron/payment-reminders Anthropic→/lib/ai` work landing as part of HEAD `e233c946` may have already addressed prior batch-C issues.

**Conclusion: Zone A does not re-trigger known-batch-C.** Audit findings above are **new** unless explicitly marked KNOWN.

---

## Heavy 10 i18n regression check (EN locale)

Routes probed in EN that were Heavy 10 i18n targets:
- `/clients/win-back` ✅ EN renders correctly ("Win-Back Campaign", "9 candidates", "No activity recorded", "Win-Back Email")
- `/clients/intake` ✅ EN render OK
- `/clients/import` ✅ EN render OK
- `/clients/[id]/{statement,communications,history}` — not probed (Zone A scope is core nav, no specific client_id was navigated this audit)

**No EN regression on Heavy 10 work shipped 2026-05-27.**

---

## Artifacts

- `RESULT.md` (this file)
- `findings.json` (pass 1 — 6 routes raw output)
- `findings-pass2.json` (pass 2 — 17 routes raw output)
- `sidebar-map.json` (post-expand sidebar enumeration)
- `*-viewport.png` × 23 (viewport @ 1280×1024 each route)
- `*-fullpage.png` × 23 (fullPage scroll capture each route)

---

## Recommended next steps (NOT done in this audit per spec — "не чини")

1. **P1 #1 (clients health):** product check — is "F 10" the correct default-display for clients without invoice/activity history? If yes → improve label (e.g. "Insufficient data" instead of "F 10"). If no → bug in `/api/clients/<id>/health-score`.
2. **P1 #2 (counter discrepancy):** confirm Dashboard "Today's Agenda" filter intent vs NotificationCenter. If both should show 17, fix the cap on Today's Agenda.
3. **P2 #1 (greeting inconsistency):** centralize user-name resolution to a single helper, deploy across 3 dashboard variants. Fix em-dash fallback specifically in `/dashboard/briefing`.
4. **P2 #2 (0-min "untitled" log entries):** verify time-tracker server-side validation. If a user can POST 0-min + no-title time entry, add 4xx rejection.
5. **P2 #3 (invoice CLIENT="—"):** spot-check one real-user invoice to confirm display path is healthy.

---

## Summary line per Ramiz spec

**HEAD `e233c946` Zone A audit complete** | 21 routes / 0 P0 / 2 P1 / 3 P2 / 3 P3 / 0 known-batch-C re-hits | 0 console err / 0 page err / 0 4xx5xx | aliased routes (3× /projects, 3× /invoices) confirmed known | Heavy 10 i18n EN regression check ✅
