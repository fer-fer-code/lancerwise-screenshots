# [AGENT 3] Logged-in app QA audit — 2026-05-18

End-to-end user journey verification на production `https://www.lancerwise.com`. Mobile viewport (390×844, iPhone 14 Pro), RU locale set throughout (Supabase profile + browser cookies confirm `🇷🇺 RU` in app header).

**Stopped at Phase 4** per execution discipline — P0 critical found (server 500 on Mark-as-Paid). Phases 5 + 6 deferred until P0 + P1s resolved.

## Severity counts

| Severity | Count |
|----------|-------|
| **P0 critical** | **1** |
| **P1 high** | **4** |
| **P2 medium** | **6** |
| **P3 low** | **2** |

---

## P0 — critical launch blocker

### P0-1 — POST /api/invoices/status → HTTP 500 (Mark-as-Paid completely broken)

**Where**: `src/app/api/invoices/status/route.ts` POST handler
**Trigger**: From invoice detail page, click "Mark as Paid" → modal opens → fill payment method (e.g., "Bank Transfer") → click "Confirm Paid"
**Observed**: `POST /api/invoices/status` → `HTTP 500`. Console: `Failed to load resource: the server responded with a status of 500 ()`. Invoice status remains "sent" (does NOT transition to "paid").
**Evidence**: [`04-invoice-flow/qa-04-invoice-after-mark-paid.png`](04-invoice-flow/qa-04-invoice-after-mark-paid.png) — same "Mark as Paid" button still present, status badge still "sent"

**Impact**:
- Users cannot record any payment received in the app
- Revenue widget will never update (depends on `paid_at` timestamp + status='paid')
- Total revenue analytics, annual reports, NPS triggers all broken
- Cannot test any post-payment flow (receipts, thank-you emails, accounting sync)

**Root cause (suspected)**: The handler builds:
```typescript
const update: Record<string, string | null> = { status }
if (status === 'paid') update.paid_at = now
if (status === 'paid' && payment_method) update.payment_method = payment_method
if (status === 'paid' && payment_reference) update.payment_reference = payment_reference

const { error } = await supabase.from('invoices').update(update).eq('id', id).eq('user_id', user.id)
if (error) return NextResponse.json({ error: error.message }, { status: 500 })
```
500 with error response body means the Supabase UPDATE failed. Likely candidates:
- `payment_method` or `payment_reference` columns don't exist on `invoices` table
- `paid_at` column missing
- CHECK constraint on `status` enum rejects `'paid'`
- RLS policy mismatch (unlikely since GET works fine)

**Fix recommendation**: 
1. Open Vercel logs for this 500 — grab actual Postgres error
2. Either add missing columns via migration OR remove unsupported fields from the update payload
3. Add integration test that hits the endpoint with status='paid' to prevent recurrence

**Effort**: 30-90 min depending on root cause (could be a missing column or stale handler vs newer schema).

**Severity rationale**: P0 because payment recording is THE core flow. App is unmergeable for launch with this broken.

---

## P1 — high priority

### P1-1 — No email verification gate on signup

**Where**: Supabase Auth project config + `/register` flow
**Trigger**: Submit /register form with any email (including disposable like `*@wshu.net`)
**Observed**: User is redirected IMMEDIATELY to `/onboarding` with full session. Mail.tm inbox polled at +0s, +20s — **0 messages received** (no verification email sent at all). Account is fully functional without email ownership proof.
**Evidence**: [`01-signup/qa-01-after-register-onboarding.png`](01-signup/qa-01-after-register-onboarding.png) — lands on Step 1 of onboarding wizard.

**Impact**:
- Anyone can create accounts using any email (including competitor / impersonation attacks: register with `support@competitor.com`)
- Bot-driven mass account creation possible (combined with Turnstile bypass)
- No proof of email ownership for legal/GDPR (account-deletion requests can't verify)
- Spam vector: attacker creates account at `victim@gmail.com`, app sends welcome / digest emails to victim from `lancerwise.com` — victim never registered

**Fix**: Enable "Confirm email" in Supabase Auth Dashboard → Authentication → Providers → Email → "Confirm email" toggle. App already has the post-confirmation handler (per memory `project_lancerwise_supabase_auth_emails.md`).

**Effort**: 5 min (Supabase dashboard toggle).

### P1-2 — /onboarding wizard 100% English despite RU locale active

**Where**: `src/app/(app)/onboarding/OnboardingWizard.tsx` + `src/messages/ru.json` (missing `onboarding.*` namespace)
**Observed**: After register, lands on `/onboarding`. Header shows `🇷🇺 RU` flag (RU locale active) but ALL onboarding wizard content in English:
- "Skip setup →", "STEP 1 OF 5", "Set Up Your Profile", "Add your name and business info"
- "Welcome to LancerWise! Let's set up your profile."
- "Full Name", "Business Name (optional)", "Hourly Rate (optional)", "Country (optional)"
- "Select country" + 33 country options all English

**Evidence**: [`01-signup/qa-01-after-register-onboarding.png`](01-signup/qa-01-after-register-onboarding.png), [`03-onboarding/qa-03-onboarding-step2.png`](03-onboarding/qa-03-onboarding-step2.png), [`03-onboarding/qa-03-onboarding-step3.png`](03-onboarding/qa-03-onboarding-step3.png)

**Impact**: Russian-speaking users (target audience for v1 launch) get first-app-impression in unfamiliar language. Direct hit to activation rate.

**Fix**: Add `onboarding.*` keys to `messages/ru.json` + replace hardcoded strings in `OnboardingWizard.tsx` with `t('onboarding.*')` calls. Same pattern as dashboard/welcome-tour which DO work.

**Effort**: 2-3 hours (5 steps × ~25 strings each + country list translation).

### P1-3 — Onboarding step 2 "Brand Your Invoices" save → HTTP 400

**Where**: `src/app/(app)/onboarding/OnboardingWizard.tsx` line 130-ish (branding submit) + `src/app/api/settings/branding/route.ts` PATCH handler
**Trigger**: From onboarding step 2, click Continue (no field changes required — default brand_color #6366f1 + footer "Thank you for your business!")
**Observed**: `PATCH /api/settings/branding → HTTP 400 {"error":"No fields to update"}`. Red "Failed to save branding" toast appears.
**Evidence**: [`03-onboarding/qa-03-onboarding-step3.png`](03-onboarding/qa-03-onboarding-step3.png) — red error banner at bottom.

**Root cause** (verified by reading both files):
- Client sends: `{ brand_color, invoice_footer }` (line ~130 of `OnboardingWizard.tsx`)
- Handler destructures: `{ brand_color, invoice_footer, ... }` ✓ at line 11-15 of `settings/branding/route.ts`
- But handler's `updates` builder ONLY assigns `portal_*` and `invoice_*` fields — `brand_color` and `invoice_footer` are never copied to `updates`. Result: `Object.keys(updates).length === 0` → 400.

**Fix**: Either:
- (A) Add `brand_color → invoice_accent_color`, `invoice_footer → invoice_footer_text`, `logo_url → invoice_logo_url` mapping in the handler.
- (B) Update onboarding wizard to send new field names (`invoice_accent_color`, `invoice_footer_text`, `invoice_logo_url`).

Recommend (A) for backwards-compat with any other call site.

**Effort**: 15 min (3-line addition in handler).

### P1-4 — Multiple in-app pages render English content despite RU locale (`/clients/new`, `/invoices/new`, invoice detail)

**Where**: Multiple files — `src/app/(app)/clients/new/*`, `src/app/(app)/invoices/new/*`, `src/app/(app)/invoices/[id]/*`
**Observed**: Header chrome shows `Клиенты` / `Счета` (translated), but page bodies are English:
- /clients/new: "New Client", "Step 1/2/3", "Full Name", "Company (optional)", "Email", "Phone", "Country", "Internal Notes", "Add Client"
- /invoices/new: "New Invoice", "Invoice Number", "Auto-generated • Configure in Settings", "Client", "No client", "Issue Date", "Due Date", "Currency", "Line Items", "Add item", "Templates", "From Library", "From Time Entries", "From Milestones", "Save as template", "Create Invoice"
- invoice detail: "Back to Invoices", "Send to Client", "Send Invoice", "Print PDF", "Copy Pay Link", "WhatsApp", "QR Code", "Pay Online", "Duplicate", "Credit Note", "BILL TO", "DESCRIPTION", "QTY", "RATE"

**Evidence**: [`04-invoice-flow/qa-04-clients-new.png`](04-invoice-flow/qa-04-clients-new.png), [`04-invoice-flow/qa-04-invoice-new.png`](04-invoice-flow/qa-04-invoice-new.png), [`04-invoice-flow/qa-04-invoice-detail.png`](04-invoice-flow/qa-04-invoice-detail.png)

**Impact**: Critical-path flows (add client, create invoice, payment) unusable for non-English Russian speakers. This is the daily-use surface of the app.

**Fix**: Add `clients.new.*`, `invoices.new.*`, `invoices.detail.*` namespaces to `messages/ru.json`. Replace hardcoded strings.

**Effort**: 4-6 hours (3 large screens, ~50-80 strings each).

---

## P2 — medium

### P2-1 — Bottom mobile navigation labels English

Bottom nav `Home / Money / Clients / Work / More` stays English on every page regardless of locale. Missing `nav.bottomNav.*` namespace.
Evidence: visible in every screenshot's bottom row.
Effort: 10 min.

### P2-2 — PWA "Add to Home Screen" install banner English

Banner shows "Add to Home Screen / Use LancerWise as an app / Install / Dismiss" — English regardless of locale.
Evidence: visible bottom in [`01-signup/qa-01-after-register-onboarding.png`](01-signup/qa-01-after-register-onboarding.png) and all subsequent.
Effort: 15 min.

### P2-3 — Currency `$` hardcoded (matches earlier `backlog_currency_hardcoded.md`)

Every monetary value shown as `$500`, `$0`, `$ 0` regardless of selected currency. Even when invoice has Currency dropdown set to `USD — US Dollar`, the rest of the UI hardcodes the `$` glyph instead of using `Intl.NumberFormat` with locale.
Evidence: [`04-invoice-flow/qa-04-invoice-detail.png`](04-invoice-flow/qa-04-invoice-detail.png) — `$500` for amount; dashboard widget shows `$0`.
Effort: 4-6 hours per existing memo (extract `formatCurrency()` helper, wire through).

### P2-4 — Date format uses English month names in RU mode

Invoice header says "Issued May 18, 2026 · Due Jun 17, 2026". RU locale should yield "Выпущен 18 мая 2026 · Срок 17 июня 2026" or at least `18.05.2026` numeric format.
Evidence: [`04-invoice-flow/qa-04-invoice-detail.png`](04-invoice-flow/qa-04-invoice-detail.png)
Effort: 2 hours (locale-aware `Intl.DateTimeFormat`).

### P2-5 — PWA install banner visually overlaps bottom navigation

"Add to Home Screen" install banner partially occludes the bottom-nav row on mobile. Both elements are persistent and z-fight near the bottom 80px.
Evidence: every full-page screenshot shows the overlap.
Effort: 30 min (raise banner above nav, or auto-dismiss when nav is visible).

### P2-6 — Setup checklist label mixed RU+EN

Bottom-left widget reads "🚀1/7 setup" — emoji + numeric progress (good) but the word "setup" is untranslated.
Evidence: [`04-invoice-flow/qa-04-clients-step3.png`](04-invoice-flow/qa-04-clients-step3.png)
Effort: 5 min.

---

## P3 — low priority

### P3-1 — Page `<title>` always English

`<title>LancerWise — Free Freelancer CRM, Invoices & AI Contracts</title>` regardless of locale. Browser tab + bookmark show English.
Effort: 30 min (locale-aware `generateMetadata()` in `layout.tsx`).

### P3-2 — Console errors from Cloudflare Turnstile iframe (CSP TrustedHTML)

Several `TrustedHTML/TrustedScript assignment` violations come from CF Turnstile's `challenge-platform/h/g/turnstile/...` iframe. This is CF's bug, not lancerwise's — but spams console + noisy in Sentry potentially. May want to suppress via Sentry beforeBreadcrumb filter.
Effort: 10 min (Sentry config).

---

## Clean findings (no issues)

✅ **/register page** — fully translated to RU, Turnstile mounts + auto-passes the headless check, password visibility toggle works, form validates correctly
✅ **/dashboard** — fully translated (Главная, Добрый вечер, Доход и активность, KPI cards, revenue chart) and date in dashboard greeting uses proper RU locale ("понедельник, 18 мая 2026 г.")
✅ **Welcome Tour (driver.js)** — all 5 steps render in Russian with proper grammar and tone:
  1. "👋 Добро пожаловать в LancerWise"
  2. "Боковое меню — ваш центр управления"
  3. "Горячие клавиши"
  4. "AI — главное преимущество LancerWise"
  5. "Чек-лист настройки"
✅ **Sidebar nav** — Финансы / Клиенты / Работа / Договоры / Аналитика / Горячие клавиши — fully translated
✅ **Client creation** — multi-step wizard advances + saves (UUID `c4765db1-43e5-436e-98be-2c68973418ec` created)
✅ **Invoice creation** — form saves with line item + tax + total (UUID `d4e2e10f-d16b-449f-aeaa-93d84875ee4f`, INV-001, $500)
✅ **Invoice "Send to Client"** — successfully transitions draft → sent, presumably triggers Resend (not directly verified since recipient is `acme@example.com` not my mail.tm inbox)
✅ **Security headers** — present on every page (X-Frame-Options, HSTS, Permissions-Policy from Bundle 4's hardening)

---

## Phases NOT TESTED (deferred per P0-stop rule)

The brief specified: "If hit critical bug (500 error, data corruption) — STOP, flag P0, not continue testing."

P0-1 was found mid Phase 4. Per discipline, halted further testing of:

- **Phase 5** — Time tracking start/stop/manual entry, hours widget update
- **Phase 6** — Settings (Profile, Notification prefs, Email prefs, Unsubscribe links, Logout flow)

Both can resume after P0-1 is fixed and a fresh test run is justified.

---

## Test artifacts (cleanup needed post-triage)

| Resource | ID | Note |
|----------|-----|------|
| Supabase auth user | (lookup by email) | email `lancerwise-qa-1779104365@wshu.net`, name "QA Launch Test" |
| Profile row | matches above user_id | basic info set (no avatar) |
| Client row | `c4765db1-43e5-436e-98be-2c68973418ec` | name "Acme Test Studio", email `acme-test@example.com` |
| Invoice row | `d4e2e10f-d16b-449f-aeaa-93d84875ee4f` | INV-001, $500 USD, status `sent` (never reached `paid` due to P0-1) |
| mail.tm temp account | id `6a0afa6e8d33cdf36b0278d5` | expires ~10 min after last use (already gone by now) |

Leave in production data for inspection (per brief). Cleanup after P0/P1 fixes verified.

---

## Files in this audit

| Path | Content |
|------|---------|
| [`FINDINGS.md`](FINDINGS.md) | this — severity-ordered findings |
| [`SUMMARY.md`](SUMMARY.md) | top-of-page summary |
| [`test-account-creds.txt`](test-account-creds.txt) | _local only, gitignored_ — test account credentials |
| [`01-signup/qa-01-register-mobile.png`](01-signup/qa-01-register-mobile.png) | /register fresh load (mobile RU) |
| [`01-signup/qa-01-register-filled.png`](01-signup/qa-01-register-filled.png) | form filled, Turnstile passed |
| [`01-signup/qa-01-after-register-onboarding.png`](01-signup/qa-01-after-register-onboarding.png) | post-submit redirect to /onboarding (P1-1, P1-2) |
| [`02-welcome-tour/qa-02-dashboard-arrival.png`](02-welcome-tour/qa-02-dashboard-arrival.png) | Welcome Tour step 1 of 5 (RU, clean) |
| [`03-onboarding/qa-03-onboarding-step2.png`](03-onboarding/qa-03-onboarding-step2.png) | "Brand Your Invoices" form |
| [`03-onboarding/qa-03-onboarding-step3.png`](03-onboarding/qa-03-onboarding-step3.png) | red "Failed to save branding" error (P1-3) |
| [`04-invoice-flow/qa-04-clients-new.png`](04-invoice-flow/qa-04-clients-new.png) | New Client wizard step 1 (English content) |
| [`04-invoice-flow/qa-04-clients-step3.png`](04-invoice-flow/qa-04-clients-step3.png) | client form filled re-render after Next loop |
| [`04-invoice-flow/qa-04-clients-review.png`](04-invoice-flow/qa-04-clients-review.png) | Step 3 review screen |
| [`04-invoice-flow/qa-04-invoice-new.png`](04-invoice-flow/qa-04-invoice-new.png) | New Invoice form |
| [`04-invoice-flow/qa-04-invoice-detail.png`](04-invoice-flow/qa-04-invoice-detail.png) | INV-001 status=draft, action menu |
| [`04-invoice-flow/qa-04-invoice-send-modal.png`](04-invoice-flow/qa-04-invoice-send-modal.png) | after click Send to Client → status=sent |
| [`04-invoice-flow/qa-04-invoice-paid.png`](04-invoice-flow/qa-04-invoice-paid.png) | post Mark-as-Paid attempt — status still "sent" (P0-1 evidence) |
| [`04-invoice-flow/qa-04-invoice-after-mark-paid.png`](04-invoice-flow/qa-04-invoice-after-mark-paid.png) | "Mark as Paid" modal with payment method selector (modal works; save fails) |
