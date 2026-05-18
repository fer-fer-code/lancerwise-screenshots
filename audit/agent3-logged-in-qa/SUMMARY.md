# [AGENT 3] Logged-in app QA audit — SUMMARY

**Audit date**: 2026-05-18
**Environment**: `https://www.lancerwise.com` (production)
**Viewport**: 390×844 mobile (iPhone 14 Pro)
**Locale**: RU
**Mode**: One real end-to-end user journey using disposable mail.tm address

## Severity counts

| Severity | Count | Status |
|----------|-------|--------|
| **P0 critical** | **1** | **STOPPED — see P0-1** |
| **P1 high** | **4** | _must-fix before launch_ |
| **P2 medium** | **6** | first post-launch sprint |
| **P3 low** | **2** | post-launch polish |

## 🚨 Stopping condition triggered

**P0-1**: `POST /api/invoices/status → HTTP 500` when transitioning invoice to `paid`. Mark-as-Paid action is completely non-functional. Per execution brief: "If hit critical bug (500 error, data corruption) — STOP, flag P0, not continue testing."

**Halted**: Phase 5 (time tracking) and Phase 6 (settings, integrations, logout). These will run on a fresh test account after P0-1 is fixed.

## P0 — 1 finding

| ID | Title | Effort |
|----|-------|--------|
| P0-1 | `POST /api/invoices/status → 500` on mark-as-paid (revenue widget never updates) | 30-90 min |

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
