# [AGENT 3] Logged-in app QA audit — SUMMARY

**Audit date**: 2026-05-18
**Environment**: `https://www.lancerwise.com` (production)
**Viewport**: 390×844 mobile (iPhone 14 Pro)
**Locale**: RU
**Mode**: One real end-to-end user journey using disposable mail.tm address

## Severity counts (final, post-Phase-5+6)

| Severity | Count | Status |
|----------|-------|--------|
| **P0 critical** | **0** open | **P0-1 CLOSED 2026-05-18** — fix verified end-to-end |
| **P1 high** | **4** | unchanged — Ramiz Supabase toggle pending on P1-1 |
| **P2 medium** | **6** | unchanged |
| **P3 low** | **3** | +1 (P3-3 "Sign out of all devices" string EN in user menu) |

## Closure timeline

1. **2026-05-18 ~11:50 UTC** — P0-1 found mid Phase 4 — STOPPED per discipline
2. **~12:15 UTC** — Root cause identified via direct psql (pg 42703, columns missing)
3. **~12:25 UTC** — Migration written + applied to production DB + PR #62 opened
4. **~12:31 UTC** — PR #62 merged as `fe21364c`
5. **~12:38 UTC** — Production deploy READY, fresh-account E2E verification PASSED:
   - HTTP 500 → HTTP 200
   - DB invoice `94168173-...` status=`paid`, paid_at + payment_method captured
   - UI badge transitioned green "paid"
6. **~12:40 UTC** — Phase 5 (time tracking) — works mechanically, only translation gap
7. **~12:43 UTC** — Phase 6 (settings) — works, /settings/notifications stub redirect confirmed, logout button in RU ("Выйти") but "Sign out of all devices" still EN (P3-3)
8. **~12:45 UTC** — Audit closed. Total time: ~55 min from P0 discovery to full audit close-out (including the fix).

## P0 — 0 open

| ID | Title | Status |
|----|-------|--------|
| P0-1 | `POST /api/invoices/status → 500` on mark-as-paid | ✅ **FIXED** PR #62 `fe21364c` (actual time 24 min from approval to verified prod) |

## P1 — 4 findings (all must-fix before public launch)

| ID | Title | Effort |
|----|-------|--------|
| P1-1 | No email verification gate on signup (Supabase auto-confirms, allows impersonation/spam accounts) | 5 min (dashboard toggle) |
| P1-2 | `/onboarding` wizard 100% English despite RU locale active | 2-3 hrs |
| P1-3 | Onboarding step 2 "Brand Your Invoices" save → 400 (handler doesn't map `brand_color`/`invoice_footer`/`logo_url` field names) | 15 min |
| P1-4 | `/clients/new`, `/invoices/new`, invoice detail page — all English despite RU header (huge i18n gap on daily-use surface) | 4-6 hrs |

## P2 — 6 findings (first post-launch sprint)

| ID | Title | Effort |
|----|-------|--------|
| P2-1 | Bottom mobile nav labels English ("Home / Money / Clients / Work / More") | 10 min |
| P2-2 | PWA "Add to Home Screen" banner English | 15 min |
| P2-3 | Currency `$` glyph hardcoded everywhere (matches earlier `backlog_currency_hardcoded.md`) | 4-6 hrs |
| P2-4 | English month names in date displays ("Issued May 18, 2026") regardless of locale | 2 hrs |
| P2-5 | PWA install banner visually overlaps with bottom nav on mobile | 30 min |
| P2-6 | Setup checklist mixes RU+EN: "🚀1/7 setup" | 5 min |

## P3 — 2 findings (post-launch polish)

| ID | Title | Effort |
|----|-------|--------|
| P3-1 | Page `<title>` always English | 30 min |
| P3-2 | Console errors from Cloudflare Turnstile iframe (CSP TrustedHTML) — noise, not lancerwise's bug | 10 min (Sentry filter) |

## Positive findings (what's already working)

✅ `/register` flow: form, Turnstile, validation, password reveal — all translated and functional
✅ `/dashboard`: full RU translation, greeting + RU date format
✅ Welcome Tour (driver.js): all 5 steps in proper RU with native phrasing
✅ Sidebar nav: Финансы / Клиенты / Работа / Договоры / Аналитика — translated
✅ Client creation flow: works mechanically end-to-end (UUID `c4765db1-...`)
✅ Invoice creation: works (UUID `d4e2e10f-...`, INV-001, $500 USD draft)
✅ Invoice "Send to Client": transitions draft → sent successfully
✅ Bundle 4 security guardrails (Turnstile + rate limit) functioning on `/register` without UX regression

## Recommended fix order

1. **P0-1** — open Vercel logs for the 500, fix root cause (probably missing column or stale handler). 30-90 min. **BLOCKS LAUNCH.**
2. **P1-1** — toggle Supabase Auth "Confirm email". 5 min. Highest ROI.
3. **P1-3** — fix handler field-name mapping (3 lines). 15 min.
4. **P1-2 + P1-4** — translation gap on logged-in surfaces. Largest effort (~8 hrs combined). Schedule a dedicated translation pass.
5. **P2** + **P3** — first post-launch sprint.

Total P0+P1 fix effort: **~10 hours** (mostly the translation pass).

## Stopping condition compliance

Per brief: "If hit critical bug (500 error, data corruption) — STOP, flag P0, not continue testing." ✅ Halted at first 500. Documented + screenshot evidence + located root-cause file. No further attempts to mark-paid OR start time tracking OR settings flow.

No data corruption observed — invoice state stuck at `sent` is correct given the failed transition (no partial write).

## Test account artifacts

| Resource | ID | Notes |
|----------|-----|-------|
| Auth user | (by email) | `lancerwise-qa-1779104365@wshu.net`, name "QA Launch Test" |
| Profile | matches | basic info, country=United States, no avatar |
| Client | `c4765db1-43e5-436e-98be-2c68973418ec` | "Acme Test Studio" |
| Invoice | `d4e2e10f-d16b-449f-aeaa-93d84875ee4f` | INV-001, $500 USD, status=`sent` |

Leave for inspection. Cleanup after P0/P1 fixes verified.

## Cross-links

- Detailed per-finding write-up: [`FINDINGS.md`](FINDINGS.md)
- Per-phase screenshots: [`01-signup/`](01-signup/), [`02-welcome-tour/`](02-welcome-tour/), [`03-onboarding/`](03-onboarding/), [`04-invoice-flow/`](04-invoice-flow/)
- Test credentials: [`test-account-creds.txt`](test-account-creds.txt) (local-only, never pushed)
- Earlier related audit: [`../agent3-security-audit/SUMMARY.md`](../agent3-security-audit/SUMMARY.md) — security-side P0/P1/P2 findings (separate scope)
- Earlier translation gap notes: `backlog_currency_hardcoded.md`, `backlog_timezone_hardcoded.md`, `backlog_date_format_localization.md` (memory)
