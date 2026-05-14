# Full Audit Index — 2026-05-14

**Total screenshots captured:** 201
**Total issues found:** 26
**Severity breakdown:** critical: 3 · major: 15 · minor: 7 · cosmetic: 1
**Category breakdown:** broken-route: 12 · broken-modal: 2 · z-index: 2 · layout: 2 · broken-ai: 7 · broken-form: 1

> Mode: autonomous exhaustive sweep, desktop (1280×800) + mobile (375×812). Authenticated admin session + non-admin verification.

---

## All Screenshots — By Section

### Public Routes (logged out) (25)

- [about](./public/public-about.png)
- [blog list](./public/public-blog-list.png)
- [changelog](./public/public-changelog.png)
- [contact](./public/public-contact.png)
- [cookie policy](./public/public-cookie-policy.png)
- [demo](./public/public-demo.png)
- [faq page](./public/public-faq-page.png)
- [features page](./public/public-features-page.png) — **⚠ FA-001 major**
- [forgot password](./public/public-forgot-password.png)
- [homepage default](./public/public-homepage-default.png)
- [homepage faq anchor](./public/public-homepage-faq-anchor.png)
- [homepage features anchor](./public/public-homepage-features-anchor.png)
- [homepage pricing anchor](./public/public-homepage-pricing-anchor.png)
- [kb](./public/public-kb.png) — **⚠ FA-002 major**
- [login default](./public/public-login-default.png)
- [login password visible](./public/public-login-password-visible.png)
- [login validation errors](./public/public-login-validation-errors.png)
- [n8n templates](./public/public-n8n-templates.png)
- [pricing page](./public/public-pricing-page.png)
- [privacy](./public/public-privacy.png)
- [register default](./public/public-register-default.png)
- [register validation errors](./public/public-register-validation-errors.png)
- [terms](./public/public-terms.png)
- [tools rate calculator](./public/public-tools-rate-calculator.png)
- [wall](./public/public-wall.png)

### Auth — Dashboard (10)

- [dashboard briefing](./auth-dashboard/auth-dashboard-briefing.png)
- [dashboard cmd k palette](./auth-dashboard/auth-dashboard-cmd-k-palette.png)
- [dashboard command center](./auth-dashboard/auth-dashboard-command-center.png)
- [dashboard default](./auth-dashboard/auth-dashboard-default.png)
- [dashboard quick expense FILLED](./auth-dashboard/auth-dashboard-quick-expense-FILLED.png)
- [dashboard quick expense OPEN](./auth-dashboard/auth-dashboard-quick-expense-OPEN.png)
- [dashboard quick invoice FILLED](./auth-dashboard/auth-dashboard-quick-invoice-FILLED.png)
- [dashboard quick invoice OPEN](./auth-dashboard/auth-dashboard-quick-invoice-OPEN.png)
- [dashboard quick invoice SAVE DISABLED](./auth-dashboard/auth-dashboard-quick-invoice-SAVE-DISABLED.png) — **⚠ FA-013 major**
- [dashboard shortcuts modal](./auth-dashboard/auth-dashboard-shortcuts-modal.png)

### Auth — Money (Invoices / Expenses / Tax / Reports) (19)

- [money expenses list](./auth-money/auth-money-expenses-list.png)
- [money expenses new](./auth-money/auth-money-expenses-new.png) — **⚠ FA-004 major**
- [money invoice detail](./auth-money/auth-money-invoice-detail.png)
- [money invoices list](./auth-money/auth-money-invoices-list.png)
- [money invoices new empty](./auth-money/auth-money-invoices-new-empty.png)
- [money money expenses list](./auth-money/auth-money-money-expenses-list.png)
- [money money invoices list](./auth-money/auth-money-money-invoices-list.png)
- [money money reports](./auth-money/auth-money-money-reports.png)
- [money recurring list](./auth-money/auth-money-recurring-list.png)
- [money recurring new](./auth-money/auth-money-recurring-new.png) — **⚠ FA-003 major**
- [money reports aging](./auth-money/auth-money-reports-aging.png)
- [money reports cash flow](./auth-money/auth-money-reports-cash-flow.png)
- [money reports income statement](./auth-money/auth-money-reports-income-statement.png)
- [money reports list](./auth-money/auth-money-reports-list.png)
- [money reports profitability](./auth-money/auth-money-reports-profitability.png)
- [money reports timesheet](./auth-money/auth-money-reports-timesheet.png)
- [money reports year in review](./auth-money/auth-money-reports-year-in-review.png)
- [money tax calendar](./auth-money/auth-money-tax-calendar.png)
- [money tax index](./auth-money/auth-money-tax-index.png)

### Auth — Clients (18)

- [clients detail](./auth-clients/auth-clients-detail.png)
- [clients list](./auth-clients/auth-clients-list.png)
- [clients new step1](./auth-clients/auth-clients-new-step1.png)
- [clients pipeline](./auth-clients/auth-clients-pipeline.png)
- [clients ai summary AFTER REFRESH](./auth-clients/clients-ai-summary-AFTER-REFRESH.png)
- [clients ai summary BEFORE](./auth-clients/clients-ai-summary-BEFORE.png)
- [clients ai summary LOADING](./auth-clients/clients-ai-summary-LOADING.png)
- [clients ai summary REGENERATING](./auth-clients/clients-ai-summary-REGENERATING.png)
- [clients ai summary RESULT](./auth-clients/clients-ai-summary-RESULT.png) — **⚠ FA-018 minor**
- [clients detail FULL](./auth-clients/clients-detail-FULL.png)
- [clients list AFTER acme creation](./auth-clients/clients-list-AFTER-acme-creation.png)
- [clients new SUCCESS](./auth-clients/clients-new-SUCCESS.png)
- [clients new step1 EMPTY](./auth-clients/clients-new-step1-EMPTY.png)
- [clients new step1 FILLED](./auth-clients/clients-new-step1-FILLED.png) — **⚠ FA-015 minor**
- [clients new step1 VALIDATION ERROR](./auth-clients/clients-new-step1-VALIDATION-ERROR.png) — **⚠ FA-016 cosmetic**
- [clients new step2 EMPTY](./auth-clients/clients-new-step2-EMPTY.png)
- [clients new step2 FILLED](./auth-clients/clients-new-step2-FILLED.png) — **⚠ FA-014 critical**
- [clients new step3 REVIEW](./auth-clients/clients-new-step3-REVIEW.png)

### Auth — Work (Projects / Tasks / Time Tracker) (19)

- [work index](./auth-work/auth-work-index.png)
- [work projects legacy](./auth-work/auth-work-projects-legacy.png)
- [work projects list](./auth-work/auth-work-projects-list.png)
- [work projects new](./auth-work/auth-work-projects-new.png)
- [work tasks list](./auth-work/auth-work-tasks-list.png)
- [work tasks recurring](./auth-work/auth-work-tasks-recurring.png)
- [work time CRITICAL](./auth-work/auth-work-time-CRITICAL.png)
- [work time tracker legacy](./auth-work/auth-work-time-tracker-legacy.png)
- [projects ai brief NOT FOUND](./auth-work/projects-ai-brief-NOT-FOUND.png) — **⚠ FA-020 minor**
- [projects ai name generator BEFORE](./auth-work/projects-ai-name-generator-BEFORE.png)
- [projects ai name generator LOADING](./auth-work/projects-ai-name-generator-LOADING.png)
- [projects ai name generator RESULT](./auth-work/projects-ai-name-generator-RESULT.png)
- [projects ai scope checker LOADING](./auth-work/projects-ai-scope-checker-LOADING.png)
- [projects ai scope checker RESULT](./auth-work/projects-ai-scope-checker-RESULT.png) — **⚠ FA-020 major**
- [projects ai status summary BEFORE](./auth-work/projects-ai-status-summary-BEFORE.png)
- [projects ai status summary NO BUTTON](./auth-work/projects-ai-status-summary-NO-BUTTON.png) — **⚠ FA-019 minor**
- [projects detail FULL](./auth-work/projects-detail-FULL.png) — **⚠ FA-021 minor**
- [projects new FULL](./auth-work/projects-new-FULL.png)
- [projects new scope checker VIEW](./auth-work/projects-new-scope-checker-VIEW.png)

### Auth — Contracts (AI generation) (26)

- [contracts generate form filled](./auth-contracts/auth-contracts-generate-form-filled.png)
- [contracts generate form](./auth-contracts/auth-contracts-generate-form.png)
- [contracts generate loading](./auth-contracts/auth-contracts-generate-loading.png)
- [contracts generate result](./auth-contracts/auth-contracts-generate-result.png)
- [contracts list](./auth-contracts/auth-contracts-list.png)
- [contracts retainers](./auth-contracts/auth-contracts-retainers.png)
- [contracts templates](./auth-contracts/auth-contracts-templates.png)
- [contracts checklist 3 CHECKED](./auth-contracts/contracts-checklist-3-CHECKED.png)
- [contracts checklist AFTER REFRESH](./auth-contracts/contracts-checklist-AFTER-REFRESH.png)
- [contracts checklist INITIAL](./auth-contracts/contracts-checklist-INITIAL.png)
- [contracts detail FULL AGAIN](./auth-contracts/contracts-detail-FULL-AGAIN.png)
- [contracts edit FORM](./auth-contracts/contracts-edit-FORM.png)
- [contracts full risk ACTUAL RESULT](./auth-contracts/contracts-full-risk-ACTUAL-RESULT.png) — **⚠ FA-022 critical**
- [contracts full risk ANALYZING](./auth-contracts/contracts-full-risk-ANALYZING.png)
- [contracts full risk FULL](./auth-contracts/contracts-full-risk-FULL.png)
- [contracts full risk PRELOADED](./auth-contracts/contracts-full-risk-PRELOADED.png) — **⚠ FA-025 minor**
- [contracts full risk RESULT](./auth-contracts/contracts-full-risk-RESULT.png)
- [contracts full risk redirect](./auth-contracts/contracts-full-risk-redirect.png)
- [contracts generate FORM EMPTY](./auth-contracts/contracts-generate-FORM-EMPTY.png)
- [contracts generate FORM FILLED](./auth-contracts/contracts-generate-FORM-FILLED.png)
- [contracts generate LOADING](./auth-contracts/contracts-generate-LOADING.png)
- [contracts generated DETAIL](./auth-contracts/contracts-generated-DETAIL.png)
- [contracts quick risk BEFORE](./auth-contracts/contracts-quick-risk-BEFORE.png)
- [contracts quick risk LOADING](./auth-contracts/contracts-quick-risk-LOADING.png)
- [contracts quick risk RESULT](./auth-contracts/contracts-quick-risk-RESULT.png)
- [contracts send MODAL](./auth-contracts/contracts-send-MODAL.png)

### Auth — Proposals (18)

- [proposals default](./auth-proposals/auth-proposals-default.png)
- [proposals FULL PAGE AFTER ALL](./auth-proposals/proposals-FULL-PAGE-AFTER-ALL.png)
- [proposals FULL PAGE INITIAL](./auth-proposals/proposals-FULL-PAGE-INITIAL.png)
- [proposals email rewriter BEFORE](./auth-proposals/proposals-email-rewriter-BEFORE.png)
- [proposals email rewriter LOADING](./auth-proposals/proposals-email-rewriter-LOADING.png)
- [proposals email rewriter RESULT](./auth-proposals/proposals-email-rewriter-RESULT.png)
- [proposals generator FORM FILLED](./auth-proposals/proposals-generator-FORM-FILLED.png)
- [proposals generator SAVE DISABLED](./auth-proposals/proposals-generator-SAVE-DISABLED.png) — **⚠ FA-027 major**
- [proposals objection BEFORE](./auth-proposals/proposals-objection-BEFORE.png)
- [proposals objection LOADING](./auth-proposals/proposals-objection-LOADING.png)
- [proposals objection RESULT](./auth-proposals/proposals-objection-RESULT.png)
- [proposals quote BEFORE](./auth-proposals/proposals-quote-BEFORE.png)
- [proposals quote LOADING](./auth-proposals/proposals-quote-LOADING.png)
- [proposals quote RESULT](./auth-proposals/proposals-quote-RESULT.png)
- [proposals scorer BEFORE](./auth-proposals/proposals-scorer-BEFORE.png)
- [proposals scorer EXPANDED](./auth-proposals/proposals-scorer-EXPANDED.png)
- [proposals scorer LOADING](./auth-proposals/proposals-scorer-LOADING.png)
- [proposals scorer RESULT](./auth-proposals/proposals-scorer-RESULT.png)

### Auth — Insights / Analytics (8)

- [insights burn rate](./auth-insights/auth-insights-burn-rate.png)
- [insights burnout](./auth-insights/auth-insights-burnout.png)
- [insights cash flow](./auth-insights/auth-insights-cash-flow.png)
- [insights forecast](./auth-insights/auth-insights-forecast.png)
- [insights kpi dashboard](./auth-insights/auth-insights-kpi-dashboard.png)
- [insights overview](./auth-insights/auth-insights-overview.png)
- [insights productivity](./auth-insights/auth-insights-productivity.png)
- [insights profitability](./auth-insights/auth-insights-profitability.png)

### Auth — Advisor (AI multi-turn chat) (12)

- [advisor FULL CONVERSATION](./auth-advisor/advisor-FULL-CONVERSATION.png)
- [advisor INITIAL](./auth-advisor/advisor-INITIAL.png)
- [advisor turn 1](./auth-advisor/advisor-turn-1.png)
- [advisor turn 2](./auth-advisor/advisor-turn-2.png)
- [advisor turn 3](./auth-advisor/advisor-turn-3.png)
- [advisor turn 4](./auth-advisor/advisor-turn-4.png)
- [advisor turn 5](./auth-advisor/advisor-turn-5.png)
- [advisor default](./auth-advisor/auth-advisor-default.png)
- [advisor empty](./auth-advisor/auth-advisor-empty.png)
- [advisor turn 1](./auth-advisor/auth-advisor-turn-1.png)
- [advisor turn 2](./auth-advisor/auth-advisor-turn-2.png)
- [advisor turn 3](./auth-advisor/auth-advisor-turn-3.png)

### Auth — Settings (20)

- [settings account](./auth-settings/auth-settings-account.png) — **⚠ FA-011 major**
- [settings ai preferences](./auth-settings/auth-settings-ai-preferences.png) — **⚠ FA-008 major**
- [settings api](./auth-settings/auth-settings-api.png)
- [settings availability](./auth-settings/auth-settings-availability.png)
- [settings billing](./auth-settings/auth-settings-billing.png) — **⚠ FA-005 major**
- [settings digest](./auth-settings/auth-settings-digest.png)
- [settings email preview](./auth-settings/auth-settings-email-preview.png)
- [settings export](./auth-settings/auth-settings-export.png)
- [settings index](./auth-settings/auth-settings-index.png)
- [settings integrations](./auth-settings/auth-settings-integrations.png) — **⚠ FA-007 major**
- [settings items library](./auth-settings/auth-settings-items-library.png)
- [settings late fees](./auth-settings/auth-settings-late-fees.png)
- [settings notifications](./auth-settings/auth-settings-notifications.png)
- [settings onboarding](./auth-settings/auth-settings-onboarding.png) — **⚠ FA-009 major**
- [settings public profile](./auth-settings/auth-settings-public-profile.png)
- [settings reminders](./auth-settings/auth-settings-reminders.png)
- [settings security](./auth-settings/auth-settings-security.png) — **⚠ FA-006 major**
- [settings tags](./auth-settings/auth-settings-tags.png)
- [settings team](./auth-settings/auth-settings-team.png) — **⚠ FA-012 major**
- [settings upgrade](./auth-settings/auth-settings-upgrade.png) — **⚠ FA-010 major**

### Auth — Admin Panel (4)

- [admin activity](./auth-admin/auth-admin-activity.png)
- [admin dashboard](./auth-admin/auth-admin-dashboard.png)
- [admin redirect as non admin](./auth-admin/auth-admin-redirect-as-non-admin.png)
- [admin users](./auth-admin/auth-admin-users.png)

### Mobile (375×812 @ 2x DPR) (22)

- [auth advisor](./mobile/mobile-auth-advisor.png)
- [auth clients new](./mobile/mobile-auth-clients-new.png)
- [auth clients](./mobile/mobile-auth-clients.png)
- [auth contracts generate](./mobile/mobile-auth-contracts-generate.png)
- [auth contracts](./mobile/mobile-auth-contracts.png)
- [auth dashboard](./mobile/mobile-auth-dashboard.png)
- [auth expenses](./mobile/mobile-auth-expenses.png)
- [auth insights](./mobile/mobile-auth-insights.png)
- [auth invoices new](./mobile/mobile-auth-invoices-new.png)
- [auth invoices](./mobile/mobile-auth-invoices.png)
- [auth projects](./mobile/mobile-auth-projects.png)
- [auth proposals](./mobile/mobile-auth-proposals.png)
- [auth reports](./mobile/mobile-auth-reports.png)
- [auth settings api](./mobile/mobile-auth-settings-api.png)
- [auth settings](./mobile/mobile-auth-settings.png)
- [auth tasks](./mobile/mobile-auth-tasks.png)
- [auth time tracker](./mobile/mobile-auth-time-tracker.png)
- [public blog](./mobile/mobile-public-blog.png)
- [public homepage](./mobile/mobile-public-homepage.png)
- [public login](./mobile/mobile-public-login.png)
- [public pricing](./mobile/mobile-public-pricing.png)
- [public register](./mobile/mobile-public-register.png)

---

## Issues Summary

### Critical (3)

- **FA-014** — `/clients/new` — Cookie consent banner intercepts pointer events on /clients/new step 2 Next button — [screenshot](./auth-clients/clients-new-step2-FILLED.png)
  - Cookie consent banner (role=dialog aria-label='Cookie consent', fixed bottom z-50) overlaps the step 2 Next button on /clients/new wizard. Playwright reports the banner's subtree intercepts the pointe
- **FA-019** — `/projects/new` — AI Scope Checker /api/ai/scope-check returns HTTP 500 — [screenshot](./auth-work/projects-ai-scope-checker-RESULT.png)
  - Filled scope text + clicked Check Scope. Network response: 500 Internal Server Error from /api/ai/scope-check. Latency 20.6s before timeout (suggests server-side AI provider failure OR endpoint bug). 
- **FA-022** — `/contracts/analyze` — AI Contract Risk Analyzer fails: 'Analysis failed — please try again' after 46s wait — [screenshot](./auth-contracts/contracts-full-risk-ACTUAL-RESULT.png)
  - Opened /contracts/analyze?contractId=... (contract auto-loaded в textarea, 4231 chars). Clicked 'Analyze Contract' button. After 46 seconds, page rendered 'Analysis failed — please try again' inline e

### Major (15)

- **FA-001** — `/features` — /features returns HTTP 404 — [screenshot](./public/public-features-page.png)
  - Public route /features returned 404 when accessed without auth.
- **FA-002** — `/kb` — /kb returns HTTP 404 — [screenshot](./public/public-kb.png)
  - Public route /kb returned 404 when accessed without auth.
- **FA-003** — `/money/invoices/recurring/new` — /money/invoices/recurring/new returns HTTP 404 — [screenshot](./auth-money/auth-money-recurring-new.png)
  - Authenticated route returned 404.
- **FA-004** — `/expenses/new` — /expenses/new returns HTTP 404 — [screenshot](./auth-money/auth-money-expenses-new.png)
  - Authenticated route returned 404.
- **FA-005** — `/settings/billing` — /settings/billing HTTP 404 — [screenshot](./auth-settings/auth-settings-billing.png)
  - Settings route returned 404.
- **FA-006** — `/settings/security` — /settings/security HTTP 404 — [screenshot](./auth-settings/auth-settings-security.png)
  - Settings route returned 404.
- **FA-007** — `/settings/integrations` — /settings/integrations HTTP 404 — [screenshot](./auth-settings/auth-settings-integrations.png)
  - Settings route returned 404.
- **FA-008** — `/settings/ai-preferences` — /settings/ai-preferences HTTP 404 — [screenshot](./auth-settings/auth-settings-ai-preferences.png)
  - Settings route returned 404.
- **FA-009** — `/settings/onboarding` — /settings/onboarding HTTP 404 — [screenshot](./auth-settings/auth-settings-onboarding.png)
  - Settings route returned 404.
- **FA-010** — `/settings/upgrade` — /settings/upgrade HTTP 404 — [screenshot](./auth-settings/auth-settings-upgrade.png)
  - Settings route returned 404.
- **FA-011** — `/settings/account` — /settings/account HTTP 404 — [screenshot](./auth-settings/auth-settings-account.png)
  - Settings route returned 404.
- **FA-012** — `/settings/team` — /settings/team HTTP 404 — [screenshot](./auth-settings/auth-settings-team.png)
  - Settings route returned 404.
- **FA-013** — `/dashboard` — Quick Invoice: Save-as-Draft disabled when description empty, but Send-&-Create is active (inconsistent validation) — [screenshot](./auth-dashboard/auth-dashboard-quick-invoice-SAVE-DISABLED.png)
  - Observed visually: Modal fields fill OK except description ("What are you charging for?" remains empty with placeholder visible). Save as Draft stays DISABLED while Send & Create button is ACTIVE. Two
- **FA-020** — `/projects/new` — AI Scope Checker — server error не surfaced к user — [screenshot](./auth-work/projects-ai-scope-checker-RESULT.png)
  - When /api/ai/scope-check returns 500, the UI does not show error toast, inline error message, or any indication к the user that the action failed. Check Scope button returns к clickable state silently
- **FA-027** — `/proposals` — Generate Proposal button disabled after filling visible fields — [screenshot](./auth-proposals/proposals-generator-SAVE-DISABLED.png)
  - After filling freelancer/client/email/service-type/scope/budget/timeline, button remains disabled. Required-empty: ["Describe the project: what needs to be built, key requirements, special constraints

### Minor (7)

- **FA-015** — `/clients/new` — Wizard step 1 inputs lack <label> markup (accessibility) — [screenshot](./auth-clients/clients-new-step1-FILLED.png)
  - Inputs (Full Name, Company, Email, Phone, Country) have no associated <label for=...> element. Playwright getByLabel() returns no match для all 5 fields. Screen-reader users lose field context. Visibl
- **FA-017** — `/clients/[id]` — Client detail page has 6+ buttons literally labeled 'Generate' (selector + UX ambiguity) — [screenshot](./auth-clients/clients-ai-summary-RESULT.png)
  - On a single client detail page, multiple AI-feature buttons share the exact label 'Generate' (AI Client Summary, AI Project Brief, Win-back Email, Referral Request Email, etc.). Plus 'Regenerate' for 
- **FA-018** — `/clients/[id]` — Portal-link Regenerate confirmation modal uses z-[9999] inset-0 (good practice; document) — [screenshot](./auth-clients/clients-ai-summary-RESULT.png)
  - When 'Regenerate' clicked on Client Portal link section, full-viewport modal с backdrop-blur opens asking 'Are you sure? Regenerate the portal link? The old link will stop working immediately.' c Canc
- **FA-019** — `/projects/62924406-138c-443f-9654-831b73bf2398` — AI feature "AI Status Summary": no trigger button found — [screenshot](./auth-work/projects-ai-status-summary-NO-BUTTON.png)
  - Could not locate any of: Generate, Refresh, Regenerate near "/Status Summary|AI Status/i" heading.
- **FA-020** — `/projects/62924406-138c-443f-9654-831b73bf2398` — AI feature "AI Project Brief" heading not found на project detail — [screenshot](./auth-work/projects-ai-brief-NOT-FOUND.png)
  - Could not locate "/Project Brief|AI Brief/i" text section.
- **FA-021** — `/projects/[id]` — Pass 2 could не trigger AI Status Summary/Brief/Milestones on minimal project (selector limitation OR conditional rendering) — [screenshot](./auth-work/projects-detail-FULL.png)
  - Pass 2 audit could not locate 'AI Status Summary' / 'AI Project Brief' / 'Generate Milestones' buttons on /projects/[id] для the tested project (minimal data — 1 active project, no tasks, no time entr
- **FA-025** — `/contracts/analyze` — Full Risk Report opens с contract text pre-loaded but не auto-analyzed — [screenshot](./auth-contracts/contracts-full-risk-PRELOADED.png)
  - Clicking "Full Risk Report" CTA on contract detail navigates к /contracts/analyze?contractId=... с the contract text auto-loaded в the textarea. User then must click ANOTHER "Analyze Contract" button 

### Cosmetic (1)

- **FA-016** — `/clients/new` — Validation error color uses text-red-500 instead of design-system rose-500 — [screenshot](./auth-clients/clients-new-step1-VALIDATION-ERROR.png)
  - Empty-submit validation errors на /clients/new render с classes 'text-red-500' / 'text-red-400'. Design system pattern (per backlog_button_color_inconsistency и B3.20 destructive pattern) uses 'rose' 

---

## Issues By Category

### broken-route (12)

- FA-001 `/features` — /features returns HTTP 404
- FA-002 `/kb` — /kb returns HTTP 404
- FA-003 `/money/invoices/recurring/new` — /money/invoices/recurring/new returns HTTP 404
- FA-004 `/expenses/new` — /expenses/new returns HTTP 404
- FA-005 `/settings/billing` — /settings/billing HTTP 404
- FA-006 `/settings/security` — /settings/security HTTP 404
- FA-007 `/settings/integrations` — /settings/integrations HTTP 404
- FA-008 `/settings/ai-preferences` — /settings/ai-preferences HTTP 404
- FA-009 `/settings/onboarding` — /settings/onboarding HTTP 404
- FA-010 `/settings/upgrade` — /settings/upgrade HTTP 404
- FA-011 `/settings/account` — /settings/account HTTP 404
- FA-012 `/settings/team` — /settings/team HTTP 404

### broken-modal (2)

- FA-013 `/dashboard` — Quick Invoice: Save-as-Draft disabled when description empty, but Send-&-Create is active (inconsistent validation)
- FA-017 `/clients/[id]` — Client detail page has 6+ buttons literally labeled 'Generate' (selector + UX ambiguity)

### z-index (2)

- FA-014 `/clients/new` — Cookie consent banner intercepts pointer events on /clients/new step 2 Next button
- FA-018 `/clients/[id]` — Portal-link Regenerate confirmation modal uses z-[9999] inset-0 (good practice; document)

### layout (2)

- FA-015 `/clients/new` — Wizard step 1 inputs lack <label> markup (accessibility)
- FA-016 `/clients/new` — Validation error color uses text-red-500 instead of design-system rose-500

### broken-ai (7)

- FA-019 `/projects/62924406-138c-443f-9654-831b73bf2398` — AI feature "AI Status Summary": no trigger button found
- FA-019 `/projects/new` — AI Scope Checker /api/ai/scope-check returns HTTP 500
- FA-020 `/projects/62924406-138c-443f-9654-831b73bf2398` — AI feature "AI Project Brief" heading not found на project detail
- FA-020 `/projects/new` — AI Scope Checker — server error не surfaced к user
- FA-021 `/projects/[id]` — Pass 2 could не trigger AI Status Summary/Brief/Milestones on minimal project (selector limitation OR conditional rendering)
- FA-022 `/contracts/analyze` — AI Contract Risk Analyzer fails: 'Analysis failed — please try again' after 46s wait
- FA-025 `/contracts/analyze` — Full Risk Report opens с contract text pre-loaded but не auto-analyzed

### broken-form (1)

- FA-027 `/proposals` — Generate Proposal button disabled after filling visible fields

---

## Audit Methodology

**Captured:**
- Public routes (logged out): 25 screenshots
- Authenticated dashboard + money: 23 screenshots
- Clients + work routes: 12 screenshots (CRITICAL /work/time tested — confirmed working)
- Contracts + proposals + insights + advisor: 20 captures + 3 AI generation cycles (contract + advisor turns)
- Settings: 20 sub-routes attempted
- Admin: 3 routes + allowlist enforcement test (non-admin redirected к /dashboard ✓)
- Mobile sweep: 22 routes @ 375×812

**AI verification (Phase 11 hold):**
- Contract generation: 7693 chars, **0 Cyrillic**, **0 literal placeholders** ✓
- Advisor 3-turn chat: 8000 chars total, **0 Cyrillic** ✓

**Security:**
- Admin allowlist verified live — non-admin (test-phase10@example.com) navigated к /admin/users → redirected к /dashboard ✓

**Tooling:**
- Playwright headless Chromium, persistent storageState
- All HTTP status, console errors, pageerrors captured per-route
- Issues auto-logged к issues.json on 4xx/5xx OR console errors

## Files
- This index: `INDEX.md`
- Issues JSON: `../../../lancerwise/test-results/full-audit-2026-05-14/issues.json` (local — not committed)
- Console errors log: `../../../lancerwise/test-results/full-audit-2026-05-14/console-errors.log` (local)
- AI outputs: `../../../lancerwise/test-results/full-audit-2026-05-14/ai-outputs/`
