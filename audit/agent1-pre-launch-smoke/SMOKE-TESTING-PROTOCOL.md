# Pre-Launch Smoke Testing Protocol

**Author:** [AGENT 1]
**Date:** 2026-05-21 (originally), **revised 2026-05-23** — post-9-PR-batch retest sequence (F12-F20 added)
**Status:** Design only — NOT executed. Run after all 9 P0/P1 PRs (#147, #184-#191, #193) land + deploys READY.
**Discipline:** Verifies production-deployed state against acceptance criteria before public launch trigger.

---

## Trigger conditions (when к execute this protocol) — REVISED for final retest

All of the following must be true before kicking off the F1-F20 sequence:

- [ ] All 9 PRs merged + production deploy READY за each:
  - [ ] [#147](https://github.com/fer-fer-code/lancerwise/pull/147) P0 middleware cookie crash (merged 2026-05-22)
  - [ ] [#184](https://github.com/fer-fer-code/lancerwise/pull/184) ModalBackdrop + 50 migrations
  - [ ] [#185](https://github.com/fer-fer-code/lancerwise/pull/185) Upstash UTF-8 defensive
  - [ ] [#186](https://github.com/fer-fer-code/lancerwise/pull/186) Cookie Customize modal
  - [ ] [#187](https://github.com/fer-fer-code/lancerwise/pull/187) Upgrade CTA contradiction
  - [ ] [#188](https://github.com/fer-fer-code/lancerwise/pull/188) Pipeline NaN + KPI (merged 2026-05-23)
  - [ ] [#189](https://github.com/fer-fer-code/lancerwise/pull/189) Timezone local-time alongside UTC
  - [ ] [#190](https://github.com/fer-fer-code/lancerwise/pull/190) RU i18n 4 routes (merged 2026-05-23)
  - [ ] [#191](https://github.com/fer-fer-code/lancerwise/pull/191) /upgrade RU i18n (stacks on #187)
  - [ ] [#193](https://github.com/fer-fer-code/lancerwise/pull/193) Schema.org refine
- [ ] [AGENT 3] per-PR re-probe verdicts ✅ PASS (recorded in `agent3-pr<N>-reprobe-*/` dirs)
- [ ] [AGENT 4] Sentry watch CLEAN for 15 min post-each-deploy (cumulative ≥ 60 min stable)
- [ ] No open launch-blocker labels на open PRs
- [ ] PRELAUNCH-CHECKLIST "Cannot launch without" list empty

If any criterion FAIL — pause, escalate, do NOT proceed к smoke phase.

### Re-validation note для F1-F11

F1-F11 baseline flows DESIGNED 2026-05-21 against pre-9-PR-batch production. **They remain valid post-batch** — no PRs changed signup/signin/onboarding/dashboard/email send/checkout flows directly. F1-F11 owner = same as original. Re-verify к catch any cross-cutting regression from architectural PRs (#184 ModalBackdrop touches 50 files; #185 ratelimit middleware touched).

---

## Test matrix — at-a-glance

**20 flows × 2 locales × 2 viewports × 3 auth states (where applicable) = ~50-65 testable cells.**

Not every combination is meaningful (e.g. "sign-up flow с signed-in user" не applicable). Realistic effective cells: ~45-55.

### Flows — F1-F11 baseline (pre-batch design)

| # | Flow | Owner | Eff cells | Critical? |
|---|---|---|---|---|
| F1 | Sign-up via /register + Turnstile | [AGENT 3] | 4 (2 loc × 2 vp) | P0 |
| F2 | Email verification → /onboarding | [AGENT 3] + [AGENT 1] visual | 4 | P0 |
| F3 | Sign-in existing user → /onboarding или /dashboard | [AGENT 3] | 4 | P0 |
| F4 | Onboarding wizard 5 steps + Skip | [AGENT 3] | 4 | P1 |
| F5 | Create first client → first project → first invoice → first proposal | [AGENT 3] | 4 | P0 |
| F6 | Dashboard widgets load — no error boundary, no missing data | [AGENT 3] | 4 | P0 |
| F7 | /work/time renders full widget tree (80 widgets via Provider) | [AGENT 3] | 4 | P0 |
| F8 | /settings renders ALL 16 subroutes (post #94) | [AGENT 3] | ~20 (subroute × loc) | P0 |
| F9 | Email send: notification + invoice + unsubscribe link | [AGENT 4] + [AGENT 1] visual | 3 | P0 |
| F10 | LemonSqueezy checkout redirect stub (NO real purchase) | [AGENT 3] | 2 (locale) | P1 |
| F11 | Password reset link → /reset-password (audit precedent) | [AGENT 3] | 4 | P1 |

### Flows — F12-F20 post-9-PR-batch additions (added 2026-05-23)

| # | Flow | Owner | Eff cells | Closes |
|---|---|---|---|---|
| F12 | P0 middleware cookie crash — 6-variant matrix verify (QA-P0-001) | [AGENT 3] curl | 6 cookie variants × 1 cell | [#154](https://github.com/fer-fer-code/lancerwise/issues/154) (verified clean via PR #147 re-probe; re-run к catch regression) |
| F13 | ModalBackdrop visual — AI modals на /invoices/new + /contracts/new + /projects/new | [AGENT 3] + [AGENT 1] visual | 6 (3 modals × 2 vp) | [#143](https://github.com/fer-fer-code/lancerwise/issues/143) + [#183](https://github.com/fer-fer-code/lancerwise/issues/183) + IQA-P1-001/002 |
| F14 | Cookie Customize modal — opens centered с backdrop (IQA-P2-001) | [AGENT 3] | 4 (2 loc × 2 vp) | IQA-P2-001 |
| F15 | Pipeline NaN + KPI — /clients/pipeline shows real $ values + KPI matches card sum | [AGENT 3] + [AGENT 1] visual | 2 (desktop, mobile) | [#158](https://github.com/fer-fer-code/lancerwise/issues/158) (merged via #188; re-verify in retest) |
| F16 | Timezone dual-format — /settings/digest + /settings/reminders show local time alongside UTC | [AGENT 3] | 4 (2 routes × 2 TZ: UTC + Asia/Bangkok) | [#157](https://github.com/fer-fer-code/lancerwise/issues/157) |
| F17 | RU i18n 4 routes — /clients + /invoices + /projects + /contracts substantial RU coverage | [AGENT 3] | 8 (4 routes × 2 vp; RU locale only) | [#155](https://github.com/fer-fer-code/lancerwise/issues/155) partial via PR #190; [#194](https://github.com/fer-fer-code/lancerwise/issues/194) tracks residual |
| F18 | Schema.org valid JSON-LD on homepage — Rich Results test passes без errors | [AGENT 4] + [AGENT 1] visual | 1 (production EN) | PR [#193](https://github.com/fer-fer-code/lancerwise/pull/193) |
| F19 | /upgrade CTA — Pro user sees "Your current plan" (not "Upgrade к Pro") | [AGENT 3] | 4 (2 plans × 2 vp) | [#156](https://github.com/fer-fer-code/lancerwise/issues/156) via PR #187 |
| F20 | /upgrade page fully RU translated | [AGENT 3] + [AGENT 1] visual | 2 (desktop + mobile; RU only) | [#155](https://github.com/fer-fer-code/lancerwise/issues/155) /upgrade slice via PR #191 |

### Locales

- **EN** (`NEXT_LOCALE=en` cookie, navigator.language fallback)
- **RU** (`NEXT_LOCALE=ru` или RU-region browser)

### Viewports

- **Desktop:** 1366×768 minimum (Chromium + WebKit)
- **Mobile:** 375×667 iPhone SE baseline (WebKit / Mobile Safari)

iOS real-device validation **mandatory для F7** (post-#74 mobile crash history). For all other flows, Playwright WebKit mobile emulation acceptable.

### Auth states

- **Signed-out** (anon, fresh cookie/localStorage)
- **Signed-in** (admin-created test user via `admin.generateLink`)
- **Expired session** (auth cookie present но JWT past `expires_at`)

Not every flow exercises all 3 states.

---

## Per-flow detailed spec

### F1 — Sign-up + Turnstile (P0)

**URL:** `https://www.lancerwise.com/register`

**Setup:** fresh-incognito browser, no auth state.

**Steps:**
1. Navigate к /register
2. Fill: full name, email (must NOT be `.test` TLD per earlier audit), password ≥ 8 chars, accept ToS checkbox
3. Verify Turnstile widget loads (timestamp before/after, expect green checkmark)
4. Click "Get started free"
5. Observe redirect к either /onboarding (immediate) или /verify-email (если email confirmation required)

**PASS criteria:**
- Form renders с all 4 fields + Turnstile + ToS checkbox
- Turnstile completes within 10s (auto OR с invisible challenge)
- Form submission returns 200/201 (NOT 4xx)
- Redirect к /onboarding OR /verify-email (no 500 page)
- localStorage contains `sb-*` auth keys after successful flow (cookie-based auth confirmed)
- Cookie banner appears on first visit (consent gating)

**FAIL escalation:**
- Turnstile fails к load → ⚠️ P0 escalate (CAPTCHA broken = sign-up dead)
- Form submission 500 → ⚠️ P0 escalate
- No redirect happens → ⚠️ P0 escalate (UX dead-end)
- `.test` TLD passes through к Supabase → P2 (pre-existing audit finding)

**Failure categorization:**
- P0: Turnstile down, sign-up 500, infinite redirect loop
- P1: Cookie banner missing, Turnstile loaded в wrong locale
- P2: Title in EN под RU body (pre-existing i18n leak)

**Estimated execution time:** 4 min × 4 cells = 16 min

---

### F2 — Email verification (P0)

**URL:** `https://skfgwyzarrhhkzvltbgm.supabase.co/auth/v1/verify?token=<TOKEN>&type=signup&redirect_to=https://www.lancerwise.com`

**Setup:** admin-created test user via `scripts/auth-audit-setup.mjs create`.

**Steps:**
1. Generate signup link via admin API
2. Open link в test browser
3. Expect Supabase redirect к `https://www.lancerwise.com/#access_token=...&type=signup`
4. AuthHashHandler (per PR #117) should detect hash, call `setSession`, route к /onboarding
5. Verify final URL `/onboarding`
6. Verify session active (try navigating к `/dashboard` — should NOT 302 к /login)

**PASS criteria:**
- Final URL: `https://www.lancerwise.com/onboarding`
- `localStorage.getItem('sb-*')` returns auth keys (cookie-based auth confirmed)
- /onboarding wizard renders с user metadata loaded (full_name populated if provided at signup)
- No fragment leak: `location.hash` empty post-handler

**FAIL escalation:**
- Lands on `/` homepage → P0 (AuthHashHandler broken — known launch-blocker pattern)
- Lands on /login → P0 (session not established)
- /onboarding fails к load → P0 (post-signup dead-end)

**Test user:** `46b486d7-5fec-47af-a466-3295dc1c3b95` (idempotent reuse from [AGENT 3]'s probe protocol)

**Estimated execution time:** 3 min × 4 cells = 12 min

---

### F3 — Sign-in existing user (P0)

**URL:** `https://www.lancerwise.com/login`

**Setup:** existing user credentials.

**Steps:**
1. Navigate к /login
2. Fill email + password
3. Click "Sign in"
4. Observe redirect

**PASS criteria:**
- Form returns valid credentials → redirect к `/onboarding` (incomplete profile) OR `/dashboard` (complete profile)
- Invalid credentials → red error "Invalid login credentials" inline; no redirect
- Form has "Forgot password?" link к `/forgot-password`
- Form has "Sign up free" link к `/register`

**FAIL escalation:**
- Valid creds → 500 → P0
- Valid creds → no redirect → P0
- Invalid creds → 500 (instead of clean error) → P0
- "Sign in" button disabled with valid input → P1

**Estimated execution time:** 3 min × 4 cells = 12 min

---

### F4 — Onboarding wizard (P1)

**URL:** `https://www.lancerwise.com/onboarding`

**Setup:** signed-in user с empty profile.

**Steps:**
1. Land on /onboarding (post-signup or via direct nav)
2. Verify Step 1 of 5 ("Set Up Your Profile") renders
3. Fill required: Full Name
4. Click Continue — **MUST NOT** be blocked by cookie banner (PR #117 fix)
5. Verify Step 2 of 5 ("Brand Your Invoices") renders
6. Test "Skip setup →" link → /dashboard

**PASS criteria:**
- Wizard renders all 5 step indicators
- Required field validation fires (Full Name)
- Continue button advances step
- **Cookie banner does NOT block Continue button** (PR #115 fix verified live)
- Skip setup link works → /dashboard

**FAIL escalation:**
- Wizard не renders → P0
- Continue button blocked by banner → P0 (regression of PR #115 fix)
- Skip link broken → P1
- Required validation missing → P2

**Estimated execution time:** 5 min × 4 cells = 20 min

---

### F5 — Create first entities (P0)

**URLs:** /clients/new → /projects/new → /invoices/new → /(app)/proposals/new

**Setup:** signed-in user с completed onboarding.

**Steps:**
1. Create client (name + email)
2. Create project linked к client
3. Create invoice linked к project
4. Create proposal_draft linked к client

**PASS criteria:**
- Each entity persists (visible в list view post-creation)
- No 5xx during save
- RLS works (other test users cannot see this user's rows — sample-check 1 table)
- Foreign keys resolve (project shows client name; invoice shows project title)

**FAIL escalation:**
- Save 500 → P0
- Save succeeds but list view empty → P0 (RLS too tight)
- Other user sees this user's data → P0 critical security regression

**Estimated execution time:** 8 min × 4 cells = 32 min (longer due к chained create flows)

---

### F6 — Dashboard widgets (P0)

**URL:** `https://www.lancerwise.com/dashboard`

**Setup:** signed-in user с some data (от F5).

**Steps:**
1. Land on /dashboard
2. Observe widget tree renders fully
3. Check Network panel: ≤ 5 REST calls (DashboardDataContext Provider pattern post-PR #84/#86)
4. Check Console: 0 errors (excluding pre-existing CF Turnstile + WebKit Notification noise)

**PASS criteria:**
- Page bodyLen > 18,000 chars (substantive content rendered, NOT error boundary)
- 0 pageerrors в Playwright
- 0 critical console errors (CF Turnstile + Safari Notification noise pre-existing/acceptable)
- /api/dashboard/widget-data fires exactly 1×
- Per-widget content visible (revenue chart, time chart, recent invoices, etc.)

**FAIL escalation:**
- Error boundary screen → P0 critical regression
- /api/dashboard/widget-data 500 → P0
- > 10 REST calls (N+1 storm pattern) → P0 (Phase 1 N+1 architecture regression)

**Estimated execution time:** 5 min × 4 cells = 20 min

---

### F7 — /work/time full render (P0)

**URL:** `https://www.lancerwise.com/work/time`

**Setup:** signed-in user, test fixture с corrected `tt_work_schedule = [0,8,8,8,8,6,0]` (per PR #111 + [AGENT 3] precedent).

**Steps:**
1. Land на /work/time
2. Observe all 80 widgets render
3. Check Network panel: 3 REST calls expected (per [AGENT 3] Stage 2 v2 verdict — 1 Provider + 1 GlobalTimerBar + 0-2 residual per #130)
4. Mobile (WebKit emulation): verify renders без error boundary (NOT empty 251-byte body)
5. iOS real-device validation (separate session): widget tree renders, no crash

**PASS criteria:**
- Chromium fetch count ≤ 5 (allowing margin)
- bodyLen > 18,000 Chromium
- 0 pageerrors
- WebKit doesn't crash (renders OR shows empty-fixture state cleanly)
- iOS real-device: visual confirmation 80 widgets visible

**FAIL escalation:**
- bodyLen drop > 50% → P0 (error boundary regression, see Stage 1 v1 pattern)
- Fetch count > 10 → P0 (Phase 1 N+1 regression)
- iOS crash → P0 (#74 / #93 pattern recurrence)
- Single widget render error visible → P1 (broader fix unless multiple)

**Special validation:** [AGENT 3] re-run probe protocol (4-cell × 3-run matrix) для post-#94 deploy state. Re-confirm Stage 2 v2 numbers hold.

**Estimated execution time:** 10 min × 4 cells + 30 min iOS real-device = 70 min

---

### F8 — /settings ALL 16 subroutes (P0)

**URL roots:** `/settings`, `/settings/{account, api, availability, billing, digest, email-preview, export, integrations, items-library, late-fees, notifications, public-profile, reminders, security, tags, upgrade}`

**Setup:** signed-in user.

**Steps per subroute:**
1. Navigate к /settings/<sub>
2. Verify page renders (no 404, no error boundary)
3. Verify widgets render с initial data (per #94 server-prefetch pattern)
4. Spot-check: 1 widget save action works (e.g. /settings/availability save calendar slot)

**PASS criteria per subroute:**
- 200 status response
- bodyLen > 5000 (rendered content)
- 0 pageerrors
- Widgets show initial data, не mount-fetch spinner
- Save action 200/201

**Aggregate PASS:** all 16 subroutes pass individually + total mount-fetch count для /settings root < 10.

**FAIL escalation:**
- Any subroute 500 → P0
- Mount-fetch count > 15 (N+1 regression) → P0
- Server-prefetch pattern broken (widgets show empty + spinner) → P0 critical #94 regression
- 1-2 subroutes show minor display issues → P1

**Estimated execution time:** 3 min × 16 subroutes × 2 locales = 96 min (most-visited 5 subroutes desktop+mobile, rest desktop only)

**Realistic compressed:** 45 min focused (Pareto: 5 most-visited subroutes full; remaining 11 quick smoke)

---

### F9 — Email send paths (P0)

**Channels:** Resend transactional API → Cloudflare Email Routing → recipient inbox.

**Setup:** test inbox `lancerwise.team@gmail.com+smoke-test-{ts}@gmail.com`.

**Steps:**
1. Trigger notification email (e.g. /api/notifications POST OR cron preview endpoint)
2. Trigger invoice email (send invoice к client)
3. Verify unsubscribe link → /api/unsubscribe → 200 + confirmation page

**PASS criteria:**
- Resend dashboard: email sent successfully (status: delivered)
- mail-tester score ≥ 9/10 (per memory `project_lancerwise_email_infrastructure` — currently 10/10)
- Unsubscribe link returns 200, marks user in `email_unsubscribe_log` table
- No bounce signals в Resend dashboard

**FAIL escalation:**
- Email not delivered within 60s → P0
- Unsubscribe link 500 → P0
- Email body renders broken (missing locale, broken HTML) → P1

**Owner split:** [AGENT 4] for Resend/CF correlation; [AGENT 1] for visual capture of rendered email.

**Estimated execution time:** 15 min (parallel-able across 3 channels)

---

### F10 — LemonSqueezy checkout redirect (P1)

**URL:** /upgrade → click "Upgrade к Pro" → redirected к LemonSqueezy checkout

**Setup:** signed-in user.

**Steps:**
1. Navigate к /upgrade or /settings/billing
2. Click upgrade CTA
3. Observe redirect к `*.lemonsqueezy.com/buy/...`
4. **STOP** at checkout page — DO NOT enter real card

**PASS criteria:**
- Redirect URL is `*.lemonsqueezy.com` domain (not fake)
- Checkout page loads с correct product (Pro plan, $15/mo)
- LemonSqueezy widget shows correct currency (USD)
- Successful test purchase via LS test mode (если configured) → webhook fires → user.plan = 'pro'

**FAIL escalation:**
- Redirect к wrong URL → P0
- Checkout page 404 → P0
- Wrong product/price displayed → P0
- LS test webhook fires но user.plan не updates → P0 (per #112 watch — proposals migration drift; same Sentry alert covers)

**Estimated execution time:** 10 min × 2 locales = 20 min (test mode only; no real card)

---

### F11 — Password reset (P1)

**URL chain:** /forgot-password → email link → /reset-password → /login → /dashboard

**Steps:**
1. Navigate к /forgot-password
2. Submit email
3. Verify reset email sent
4. Click reset link
5. AuthHashHandler routes к /reset-password (PR #117)
6. Submit new password
7. Sign in с new password → /dashboard

**PASS criteria:**
- /forgot-password form submits 200
- Reset email arrives within 60s
- Reset link routes к /reset-password (NOT homepage — PR #117 fix)
- New password updates успешно
- Sign-in с new password works
- Old password no longer works

**Estimated execution time:** 8 min × 4 cells = 32 min

---

### F12 — P0 middleware cookie crash 6-variant matrix (regression check)

**Closes:** [#154](https://github.com/fer-fer-code/lancerwise/issues/154) (QA-P0-001) — verified clean post-PR #147 by [AGENT 3] commit `5cb6fe3` (7/7 variants PASS). Re-run as regression check для final retest after 9-PR-batch deploys (#184 ModalBackdrop touched some route shells, #185 ratelimit shares middleware path — need confirm cookie-crash defense intact).

**URL:** `https://www.lancerwise.com/dashboard` (any protected route)

**Setup:** curl с each cookie variant — no UI session needed.

**Steps:** per [AGENT 3] `qa_session_variants.js` protocol — issue 6 curl probes:

| # | Cookie value | Expected status | Expected destination |
|---:|---|:---:|---|
| 1 | no cookie | 200 | /login |
| 2 | empty string `""` | 200 | /login |
| 3 | random non-prefixed string | 200 | /login |
| 4 | `base64-INVALIDCOOKIESTRING` | **307** (was 500 pre-fix) | /login + Set-Cookie sb-…=; Max-Age=0 |
| 5 | truncated valid cookie | 200 | /login |
| 6 | `base64-` (empty payload) | 200 | /login |

**Repro command (variant 4 critical):**
```bash
curl -i -s -H "Cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=base64-INVALIDCOOKIESTRING" \
     https://www.lancerwise.com/dashboard | grep -iE "^HTTP|^location:|^set-cookie:"
```

**PASS criteria:** all 6 variants land at /login (HTTP 307); variant 4 specifically returns `Set-Cookie: sb-...=; Max-Age=0` clearing directive. No HTTP 500 / `MIDDLEWARE_INVOCATION_FAILED`.

**FAIL escalation:** Any variant returns 500 → **P0 launch-blocker** (regression of #147 fix).

**Owner:** [AGENT 3] curl batch (10 min)

**Estimated execution time:** 10 min total

---

### F13 — ModalBackdrop visual — AI modals (3 routes)

**Closes:** [#143](https://github.com/fer-fer-code/lancerwise/issues/143) (FAB Quick Add) + [#183](https://github.com/fer-fer-code/lancerwise/issues/183) (AI generate modal transparent /invoices/new) + IQA-P1-001/002. Verifies PR #184 `<ModalBackdrop>` shared component correctly mounted across 50 migrated call-sites.

**URLs + repro per route:**

1. `/invoices/new` — click "Сгенерировать с AI" / "Generate Line Items с AI" → AI modal opens с backdrop
2. `/contracts/new` — click "Load Template" → ContractTemplates modal opens с backdrop
3. `/projects/new` — click any AI panel trigger → modal opens с backdrop
4. **Bonus:** any route → click bottom-right Quick Add FAB → action menu opens с backdrop dimming underlying page

**PASS criteria per modal:**
- Backdrop visible — semi-opaque dark layer (`bg-slate-950/80 backdrop-blur-sm`) covers entire viewport
- Underlying page form/table NOT visible через modal (no transparency bleed)
- Click outside modal closes it (event.target === currentTarget gate)
- Escape key closes modal
- Body scroll locked when modal open (background не scrolls)
- `role="dialog"` + `aria-modal="true"` present (DevTools inspection)

**FAIL escalation:**
- Modal renders без backdrop → P1 (PR #184 migration regression)
- Underlying content visible through modal → P1
- Click-outside doesn't close → P2
- Esc key fails → P2
- Body scroll НЕ locked → P3

**Owner:** [AGENT 3] (Playwright click + capture) + [AGENT 1] (visual review screenshots)

**Cells:** 3 modals × 2 viewports = 6 cells. Plus FAB bonus check.

**Estimated execution time:** 5 min × 6 cells = 30 min

---

### F14 — Cookie Customize modal (IQA-P2-001)

**Closes:** IQA-P2-001 via PR #186 — Customize button now opens centered modal с backdrop вместо subtle in-place expand.

**URL:** `https://www.lancerwise.com/` (или any route — cookie banner global)

**Setup:** fresh-incognito browser (cookie banner not previously dismissed).

**Steps:**
1. Land on / homepage в fresh-incognito state
2. Cookie banner visible at bottom
3. Click "Customize" button
4. Observe: centered modal opens с dim backdrop covering page
5. Verify modal contains: Essential always-on chip + Analytics toggle + Reject All + Save buttons
6. Toggle Analytics off → click Save → modal closes + consent persisted
7. Click outside modal (на backdrop) → modal closes

**PASS criteria:**
- Modal renders centered (NOT inline expansion)
- Backdrop visible covering page
- All 4 controls render (Essential chip, Analytics toggle, Reject All, Save)
- Save passes correct `analyticsChecked` value к `onSaveCustom` handler
- Reject All works
- Click outside closes modal
- ARIA: `role="dialog"` + `aria-modal="true"` present

**FAIL escalation:**
- Customize click no-op (нет visible state change) → P1 (regression of IQA-P2-001 fix)
- Modal renders без backdrop → P1
- Toggle state lost → P2
- Click-outside dismiss broken → P2

**Owner:** [AGENT 3]

**Cells:** 2 locales × 2 viewports = 4 cells

**Estimated execution time:** 3 min × 4 cells = 12 min

---

### F15 — Pipeline NaN + KPI alignment (regression check)

**Closes:** [#158](https://github.com/fer-fer-code/lancerwise/issues/158) (QA-P1-101) via PR #188. Verifies card-level parseFloat + isFinite guard + KPI aggregation includes proposals.

**URL:** `https://www.lancerwise.com/clients/pipeline`

**Setup:** signed-in user с populated pipeline (leads + proposals with mixed value shapes — null, numeric, string-numeric).

**Steps:**
1. Land on /clients/pipeline
2. Inspect Kanban cards — no "USD NaN" anywhere
3. Cards с null `potential_value` / `budget` show no price line (skipped gracefully)
4. KPI cards (ACTIVE LEADS / PIPELINE VALUE / FOLLOW-UPS DUE) match sum of visible card values

**PASS criteria:**
- 0 occurrences of literal `NaN` string в page bodyText
- All client cards с numeric value display correctly (e.g., `USD 25,000`)
- KPI "Pipeline Value" === sum of (active leads values + active proposals values), using same `safeAmount()` helper
- Currency on KPI matches first-found currency в leads ?? proposals ?? 'USD'

**FAIL escalation:**
- "USD NaN" visible anywhere → P1 (regression)
- KPI total ≠ visible card sum → P1
- Card price renders for null values (should skip) → P2

**Owner:** [AGENT 3] + [AGENT 1] visual

**Cells:** 2 (desktop + mobile, EN locale primary; RU spot-check)

**Estimated execution time:** 5 min × 2 cells + 5 min visual cross-check = 15 min

---

### F16 — Timezone dual-format (#157)

**Closes:** [#157](https://github.com/fer-fer-code/lancerwise/issues/157) via PR #189. Confirms `formatUtcHourInLocalTime()` helper surfaces user's local clock time alongside UTC anchor.

**URLs:**
1. `/settings/digest` — Delivery Time dropdown
2. `/settings/reminders` — Schedule helper text

**Setup:** Playwright с timezone override (`page.context({ timezoneId: 'Asia/Bangkok' })`) + control cell с UTC.

**Test matrix:**

| Cell | Browser TZ | Expected dropdown option text | Expected reminders helper |
|---|---|---|---|
| 1 | `UTC` (Etc/UTC) | `"10:00 UTC (10:00 UTC)"` *(known P3 redundancy [#192](https://github.com/fer-fer-code/lancerwise/issues/192) — acceptable)* | `"Runs daily at 10:00 AM UTC (10:00 UTC)"` |
| 2 | `Asia/Bangkok` (ICT, UTC+7) | `"10:00 UTC (17:00 ICT)"` | `"Runs daily at 10:00 AM UTC (17:00 ICT)"` |
| 3 | `America/Los_Angeles` (PST/PDT) | `"10:00 UTC (02:00 PST)"` или `(03:00 PDT)` depending DST | similar |
| 4 | (default — Playwright default tz) | local suffix appears | local suffix appears |

**PASS criteria:**
- Non-UTC timezones show local-time suffix `(HH:MM <ABBR>)` correctly
- UTC users get redundant `(10:00 UTC)` suffix (known P3 [#192], документировать-but-not-block)
- Backend cron stored times unchanged (verify через Supabase admin — should still be UTC)
- No hydration mismatch warnings в console на these routes (potential React #418 surface per [AGENT 1] PR #189 review caveat)

**FAIL escalation:**
- Local suffix missing для non-UTC user → P1 (fix didn't work)
- Hydration warning в console → P2 (post-launch polish — useEffect-based pattern)
- Backend UTC stored value drift → P0 (data integrity)

**Owner:** [AGENT 3]

**Cells:** 2 routes × 2 timezone cells = 4 cells (primary); +2 timezone spot-checks (PST, default)

**Estimated execution time:** 5 min × 4 cells = 20 min

---

### F17 — RU i18n 4 routes substantial coverage

**Closes:** [#155](https://github.com/fer-fer-code/lancerwise/issues/155) partial (via PR #190). Residual ~40 strings tracked в [#194](https://github.com/fer-fer-code/lancerwise/issues/194) для post-launch — F17 verifies "substantial enough к ship" threshold.

**URLs:** /clients, /invoices, /projects, /contracts с `?locale=ru` OR NEXT_LOCALE=ru cookie

**PASS threshold:** ≥70% RU coverage per route — KPI labels, action button labels, table headers, status badges, form labels translated к RU. Residual EN bleed acceptable если limited к taxonomy listed в #194 (table column headers + DB enums + shared component buttons).

**Per-route PASS criteria:**

| Route | RU coverage expected | Acceptable EN bleed |
|---|---|---|
| /clients | "Всего клиентов", "Активные", "Доход с начала года", "С просрочкой", "Новый клиент", "Воронка" | Table headers CLIENT/TIER/etc, More, Filters, Quick |
| /invoices | "Оплачено", "Ожидание", "Просрочено", "Не оплачено", "Новый счёт", "Шаблоны" + ICU plural "X счёт просрочен" | Same shared components + status badges (draft/sent/paid) |
| /projects | KPI + status pills + actions translated | Same shared component bleed |
| /contracts | "Истекают в 30 дн.", "Отметить продлённым", contract template names | Same |

**FAIL escalation:**
- Any route < 50% RU coverage → P1 (PR #190 didn't ship as documented)
- ICU plural rendering wrong RU form ("X клиент" instead of "X клиентов" для count=5) → P1
- EN string в KPI label / page heading (visible above-the-fold) → P2
- EN string в residual taxonomy (table headers / DB enums) → already known via #194, NOT a regression

**Owner:** [AGENT 3] capture all 4 routes × RU desktop+mobile, [AGENT 1] visual verification

**Cells:** 4 routes × 2 viewports = 8 cells (RU locale only)

**Estimated execution time:** 4 min × 8 cells = 32 min

---

### F18 — Schema.org JSON-LD validation (#193)

**Closes:** PR [#193](https://github.com/fer-fer-code/lancerwise/pull/193) (Organization description + drop unclaimed sameAs).

**URL:** `https://www.lancerwise.com/` (homepage)

**Steps:**
1. View page source (or DevTools → Elements → `<script type="application/ld+json">`)
2. Verify 4 JSON-LD blocks present: Organization, WebSite + SearchAction, SoftwareApplication, FAQPage
3. Copy Organization JSON → paste into Google [Rich Results Test](https://search.google.com/test/rich-results?url=https%3A%2F%2Fwww.lancerwise.com)
4. Verify no validation errors / warnings
5. Verify Organization snippet shows new `description` field
6. Verify sameAs array absent + inline comment present в source

**PASS criteria:**
- 4 JSON-LD blocks present + parseable
- Organization includes `description: "All-in-one CRM platform for freelancers — invoicing, AI contracts, time tracking, and client management."`
- Organization does NOT include `sameAs` array (sources for restoration comment present)
- Rich Results Test reports 0 errors / 0 critical warnings for Organization
- WebSite/SoftwareApplication/FAQPage schemas still valid (no regression)

**FAIL escalation:**
- Any schema removed / malformed → P1
- Rich Results Test errors → P1 (Google indexing risk)
- sameAs к 404 URL still present (PR #193 didn't apply) → P2

**Owner:** [AGENT 4] (curl + JSON parse + Rich Results submit) + [AGENT 1] visual confirmation

**Cells:** 1 cell (production EN homepage — JSON-LD same across locales)

**Estimated execution time:** 10 min

---

### F19 — /upgrade CTA Pro user (#156)

**Closes:** [#156](https://github.com/fer-fer-code/lancerwise/issues/156) (QA-008) via PR #187. Pro user sees "Your current plan" instead of contradictory "Upgrade к Pro" CTA.

**URLs:** `https://www.lancerwise.com/upgrade`

**Setup matrix — 2 fixture users:**
1. Free-plan user — should see "Upgrade к Pro" CTA active
2. Pro-plan user — should see "Your current plan" disabled pill

**Steps:**
1. Sign in as fixture-pro user (`46b486d7-5fec-47af-a466-3295dc1c3b95` если currently на Pro; else update fixture via admin)
2. Navigate к /upgrade
3. Observe Pro plan card

**PASS criteria (Pro user cell):**
- Pro card shows "Current plan" green badge (top-right)
- Pro card shows "Your current plan" disabled pill (NOT "Upgrade к Pro" active button)
- Pro card disabled pill does NOT navigate когда clicked
- Free plan card shows "Free forever" disabled pill (since Pro user is above Free)

**PASS criteria (Free user cell):**
- Pro card shows active "Upgrade к Pro" button (clickable → LemonSqueezy checkout)
- Free card shows "Your current plan" disabled pill

**FAIL escalation:**
- Pro user still sees "Upgrade к Pro" → P1 (PR #187 didn't apply)
- Both badges + Upgrade CTA visible simultaneously → P1
- Free user sees "Your current plan" on Pro card → P0 (UX/data corruption)

**Owner:** [AGENT 3]

**Cells:** 2 plan tiers × 2 viewports = 4 cells

**Estimated execution time:** 4 min × 4 cells = 16 min

---

### F20 — /upgrade page fully RU translated (#155 /upgrade slice)

**Closes:** /upgrade slice of [#155](https://github.com/fer-fer-code/lancerwise/issues/155) via PR #191 (stacks on #187). Conversion-critical surface fully Russian.

**URL:** `https://www.lancerwise.com/upgrade?locale=ru`

**Steps:**
1. Set NEXT_LOCALE=ru
2. Navigate к /upgrade
3. Scan visible copy на page

**PASS criteria — all visible strings RU:**
- Billing toggle: "Ежемесячно" / "Ежегодно" + "Экономия 17-20%"
- Price labels: "$0" + "навсегда" / "/мес" + "Счёт $144/год · экономия 20%"
- Badges: "Самый популярный", "Текущий тариф", "Ваш текущий тариф", "Бесплатно навсегда"
- Plan names: Free / Pro / Business (brand convention — Latin OK)
- CTAs: "Перейти на Pro" / "Перейти на Business"
- 25 feature labels: all RU ("Безлимитные AI-генерации", "AI Бизнес-советник", "Чек-листы перед подписанием", etc.)
- Footer: "Безопасная оплата. Отменить можно..." + "Управление подпиской в настройках"

**Acceptance threshold:** ≥95% RU coverage on /upgrade (higher bar than F17 since this is conversion-critical).

**FAIL escalation:**
- Any visible CTA / badge / feature label остаётся EN на RU locale → P1
- ICU interpolation broken ("Billed ${amount}/yr · save {savings}%" не resolves) → P1
- Plan tier comparison breaks (LemonSqueezy provider filtering misaligned) → P0

**Owner:** [AGENT 3] + [AGENT 1] visual review screenshots

**Cells:** 2 (desktop + mobile, RU locale only)

**Estimated execution time:** 5 min × 2 cells = 10 min

---

## Critical API sample checks (parallel к UI flows)

| Endpoint | Expected | Owner |
|---|---|---|
| GET `/api/notifications` | 200 + JSON array | [AGENT 4] |
| GET `/api/time-tracker/widget-data` | 200 + Provider data shape | [AGENT 4] |
| GET `/api/dashboard/widget-data` | 200 + Provider data shape | [AGENT 4] |
| POST `/api/unsubscribe` (с test token) | 200 + confirmation | [AGENT 4] |
| GET `/api/settings/*` (sample 3 endpoints) | 200 | [AGENT 4] |
| GET /sitemap.xml | 200 + valid XML | [AGENT 4] |
| GET /robots.txt | 200 | [AGENT 4] |

**Failure categorization:**
- Any 5xx on these endpoints during normal smoke run → P0
- 4xx on authed endpoint когда signed-out → expected, документировать
- 429 rate-limit → P1 (likely Turnstile или Supabase rate-limit configs)

**Estimated execution time:** 10 min (parallel via curl batch script)

---

## Failure categorization summary

### P0 — Launch-blocker (do NOT ship until fixed)

- Sign-up/sign-in/email-verify dead-ends
- /work/time или /settings renders error boundary
- Dashboard widgets N+1 regression > 10 calls
- Email send broken (Resend API down OR template broken)
- Cross-tenant RLS leak (one user sees another's data)
- LemonSqueezy checkout broken (wrong URL, wrong price)
- iOS real-device crash на /work/time или /settings

### P1 — Fix-before-launch (ship-blocker but recoverable)

- Onboarding wizard cookie banner overlap (regression of #115)
- Password reset email link broken (regression of #117)
- /settings sub-route 404 или partial render
- Email body locale leak (RU user gets EN body)
- LS test webhook не updates user.plan
- /api/settings/* 429 rate-limit

### P2 — Ship-anyway (file post-launch follow-up)

- Title metadata leak (`<title>` EN under RU body — pre-existing)
- Cookie banner button text inconsistency
- Mobile responsive minor padding issues
- Pre-existing CF Turnstile console noise
- Pre-existing WebKit Notification console noise

### P3 — Post-launch polish

- Per-page OG image gaps (per `backlog_seo_per_page_og_images.md`)
- Cosmetic copy clarity ("Stripe Connect" wording)
- Animation timing tweaks

---

## Aggregate execution estimate

| Phase | Time |
|---|---|
| **F1-F11 baseline (originally designed)** | |
| F1-F4 auth + onboarding | ~60 min |
| F5 create entities chain | ~32 min |
| F6 + F7 dashboard + work/time | ~90 min (incl iOS real-device) |
| F8 settings 16 subroutes | ~45 min compressed |
| F9 email send | ~15 min |
| F10 LemonSqueezy redirect | ~20 min |
| F11 password reset | ~32 min |
| **F12-F20 post-batch additions (2026-05-23)** | |
| F12 P0 cookie variant matrix | ~10 min |
| F13 ModalBackdrop visual × 3 modals | ~30 min |
| F14 Cookie Customize modal | ~12 min |
| F15 Pipeline NaN + KPI | ~15 min |
| F16 Timezone dual-format | ~20 min |
| F17 RU i18n 4 routes | ~32 min |
| F18 Schema.org Rich Results | ~10 min |
| F19 /upgrade CTA Pro/Free fixtures | ~16 min |
| F20 /upgrade RU fully translated | ~10 min |
| **Cross-cutting** | |
| API sample checks (parallel) | ~10 min |
| Cross-locale spot-check delta | ~20 min |
| Triage + escalation buffer | ~30 min |

**Aggregate (F1-F20): ~7-8 hours focused smoke testing.**

Parallelizable across 3 agents reduces к **~3-4 hours wall-clock.**

**F12-F20 alone (если F1-F11 baseline acceptable per #94-era smoke):** ~3 hours focused / ~1.5h parallel wall-clock.

---

## Owner mapping — updated for F12-F20

| Owner | Coverage |
|---|---|
| **[AGENT 3]** | All browser-based flows (F1-F8, F10, F11, F12 curl, F13-F17 visual, F19, F20) — Playwright probe protocol expertise. Heaviest workload в final retest cycle. |
| **[AGENT 4]** | Sentry-side correlation (F1-F20 background watch), email channel (F9), critical API sample checks, Schema.org Rich Results validation (F18) |
| **[AGENT 1]** | Visual capture review of [AGENT 3]'s screenshots (F13 modals, F15 pipeline cards, F17 RU coverage, F20 /upgrade RU), email body render verification (F9), JSON-LD source inspection (F18), final smoke-pass synthesis report, **addendum issues if visual review catches what [AGENT 3] missed** |
| **Ramiz** | LS checkout redirect verification (F10 — founder eyes на payment surface), final go/no-go sign-off, /upgrade CTA fixture-pro user manual cross-check (F19) если automation hits roadblock |

---

## Pre-smoke setup checklist

Before kicking off:

- [ ] Production prod-deploy READY for current main HEAD
- [ ] Test user available: `46b486d7-5fec-47af-a466-3295dc1c3b95` (idempotent reuse) OR fresh smoke user via `scripts/auth-audit-setup.mjs create`
- [ ] [AGENT 3] probe scripts up к date
- [ ] [AGENT 4] Sentry watch window opened (15 min minimum before + during smoke)
- [ ] Telegram alert channel armed для P0 escalations
- [ ] iOS real-device available (iPhone Safari) для F7

## Post-smoke deliverable

After execution, output single consolidated report:

```
audit/agent1-pre-launch-smoke/
├── SMOKE-TESTING-PROTOCOL.md (this doc)
├── SMOKE-RESULTS-{date}.md (after execution)
└── EVIDENCE/
    ├── screenshots/ (per cell × per run)
    ├── network-logs/ (HAR files for each flow)
    └── sentry-correlation.md (15-min watch summary)
```

**Smoke verdict format:** PASS / PASS-with-caveats / FAIL — same 5-criterion-style table as [AGENT 3] probe verdicts. If FAIL — surface к Ramiz с recommended action (defer / hotfix / launch-anyway-с-monitoring).

---

## Cross-references

- [`audit/agent1-auth-flow-regression/`](../agent1-auth-flow-regression/) — F1, F2, F3, F4, F11 audit precedent (7 flows × 2 locales already executed once)
- [`audit/agent3-93-stage-1-verify/`](../agent3-93-stage-1-verify/), [`agent3-93-stage-2-v2-verify/`](../agent3-93-stage-2-v2-verify/) — probe protocol precedent
- [`audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) — operational triage paths
- [`audit/agent1-94-settings-diagnosis/`](../agent1-94-settings-diagnosis/) — F8 expected post-#94 state
- Memory: `project_lancerwise_email_infrastructure` — F9 mail-tester baseline 10/10
- Issues post-launch backlog: [#112](https://github.com/fer-fer-code/lancerwise/issues/112), [#130](https://github.com/fer-fer-code/lancerwise/issues/130), [#118](https://github.com/fer-fer-code/lancerwise/issues/118), [#120](https://github.com/fer-fer-code/lancerwise/issues/120), [#121](https://github.com/fer-fer-code/lancerwise/issues/121)
