# Pre-Launch Smoke Testing Protocol

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Status:** Design only — NOT executed. Run after #94 closes.
**Discipline:** Verifies production-deployed state against acceptance criteria before public launch trigger.

---

## Trigger conditions (when к execute this protocol)

All of the following must be true before kicking off:

- [ ] #94 /settings N+1 PR merged + production deploy READY (green)
- [ ] [AGENT 3] /settings probe verdict ✅ PASS
- [ ] [AGENT 4] Sentry watch CLEAN for 15 min post-deploy
- [ ] No open launch-blocker labels на open PRs
- [ ] PRELAUNCH-CHECKLIST "Cannot launch without" list empty

If any criterion FAIL — pause, escalate, do NOT proceed к smoke phase.

---

## Test matrix — at-a-glance

**11 flows × 2 locales × 2 viewports × 3 auth states (where applicable) = ~30-40 testable cells.**

Not every combination is meaningful (e.g. "sign-up flow с signed-in user" не applicable). Realistic effective cells: ~25-30.

### Flows

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
| F1-F4 auth + onboarding | ~60 min |
| F5 create entities chain | ~32 min |
| F6 + F7 dashboard + work/time | ~90 min (incl iOS real-device) |
| F8 settings 16 subroutes | ~45 min compressed |
| F9 email send | ~15 min |
| F10 LemonSqueezy redirect | ~20 min |
| F11 password reset | ~32 min |
| API sample checks (parallel) | ~10 min |
| Cross-locale spot-check delta | ~20 min |
| Triage + escalation buffer | ~30 min |

**Aggregate: ~4-5 hours focused smoke testing.**

Parallelizable across 3 agents reduces к **~2-2.5 hours wall-clock.**

---

## Owner mapping

| Owner | Coverage |
|---|---|
| **[AGENT 3]** | All browser-based flows (F1-F8, F10, F11) — Playwright probe protocol expertise |
| **[AGENT 4]** | Sentry-side correlation (F1-F11 background) + email channel (F9) + critical API sample checks |
| **[AGENT 1]** | Visual capture review of [AGENT 3]'s screenshots, email body render verification (F9), final smoke-pass synthesis report |
| **Ramiz** | LS checkout redirect verification (F10 — founder eyes на payment surface), final go/no-go sign-off |

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
