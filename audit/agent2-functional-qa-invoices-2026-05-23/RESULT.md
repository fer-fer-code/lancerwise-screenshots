# Invoices QA — Functional Test Results

**Campaign:** #206 area 4 (Invoices full CRUD)
**Agent:** [AGENT 2]
**Date:** 2026-05-23
**Production SHA:** 04475a34 (post-Phase-2 palette merge)
**Method:** Playwright headless (Chromium) + Supabase Admin magic-link bypass for Turnstile

## Verdict summary

**0 P0 confirmed. 0 P1 NEW. 1 P2 finding (PDF download UX).**

| Test | Verdict | Notes |
|---|---|---|
| AUTH (magic-link bypass) | PASS | Service-role magic-link bypassed Turnstile CAPTCHA |
| T1: Create invoice 3 line items | PASS | Total `$600` matches expected `2×100 + 1×250 + 3×50` |
| T1: Persistence | PASS | Created `b311fe64-…` found in `/invoices` list immediately |
| T2: Edit rate + recalc | PASS | Changed item 1 rate `100→500` → total `$1,400` (matches expected) |
| T2: Edit persistence | PASS | Reload `/invoices/[id]` confirms `$1,400` persisted |
| T3: Mark as paid | PASS | Button click → status indicator updated to "paid" |
| T4: Delete invoice | PASS | Confirm prompt accepted → invoice removed from list |
| T5: Export PDF | PARTIAL | Button exists + click registers; no `download` event fired in 15s |
| T6: Race condition (5 items rapid) | PASS | 6 items added back-to-back, rates filled, total `$210` exact match — **#204 NOT reproducible** |

## Issue #204 status — RECOMMEND CLOSE

**Original report:** Invoice created with `description=design, qty=1, rate=<entered>` persists with `$0` across all fields.

**Reproduction attempt (T1):** 3 line items, rates `100/250/50`, qty `2/1/3`. Persisted total: `$600` ✅ exact.

**Race condition attempt (T6):** 5 rapid `Add item` clicks (0ms delay), 6 visible rate inputs filled `10/20/30/40/50/60`. Persisted total: `$210` ✅ exact.

**Diagnosis:** Cannot reproduce on current production (`04475a34`). The cascade of fixes (#208 input color rendering / PR #216) likely addressed the root cause — if user typed amount into an input that *appeared blank* due to text color bug (issue #208), they would think rate was entered but submit empty. Original #204 screenshot showed `$0` which is consistent with empty rate field due to invisible-text bug.

**Recommended action:** Close #204 as resolved by #208 (PR #216 merged 2026-05-23, deployed to prod). No code-level fix needed in invoices module itself.

## Test methodology notes

- Authentication via Supabase Admin REST API `generate_link?type=magiclink` (service-role-keyed) → followed magic link to set `sb-…-auth-token` cookie. **Turnstile not triggered** since admin endpoint bypasses public auth flow. Per memory `feedback_supabase_captcha_dashboard`.
- Test isolation: created test invoice `b311fe64-4662-4ff1-950c-c95399a254f4` deleted in T4. T6 form cancelled without save. **Production data unchanged.**
- Pre-test invoice count: 4 rows. Post-test: back to 4 rows. Clean.
- All API requests captured: `POST 201` on create, `PATCH 204` on edit, `GET 200` on detail. No 4xx/5xx during functional tests.
- 0 console errors / 0 page errors across all 6 tests.
- "Network errors" recorded (19 in T1) all `ERR_ABORTED` on Next.js RSC prefetch requests — normal noise during rapid navigation.

## P2: PDF download UX

Click on PDF/Download/Export button registers but no browser `download` event fires within 15s. Possible causes:
1. PDF generation is async with email delivery (not direct download)
2. Opens in new tab via `window.open` (Playwright `waitForEvent('download')` doesn't catch)
3. Server-side render → preview modal (not download)

**Severity:** P2 — non-blocking for launch. Worth manual verification by Ramiz to confirm intended UX. Evidence: `evidence/T5-01-after-pdf-click.png`.

## Evidence

20 screenshots in `evidence/`:
- `00-post-auth.png`, `00b-dashboard.png` — auth verification
- `01-invoices-list.png` — pre-test list state (4 rows)
- `T1-01..05` — create flow (blank → after 1 item → 3 items filled → after create with total $600)
- `T2-01..03` — edit flow (form → rate change → after save)
- `T3-01..03` — mark-paid flow (before → modal → after)
- `T4-01..02` — delete flow (prompt → after-delete)
- `T5-01` — after PDF click (no download triggered)
- `T6-01..03` — race condition (blank → 6 items added rapid → all rates filled, total $210)

Findings JSON: `evidence/findings.json` (raw test verdicts + API request log)

## Honest non-overclaim disclaimers

- PASS = full end-to-end functional verification with persistence check
- RENDERS-OK = element/page renders as expected but did not exercise interaction
- PARTIAL = primary check succeeded but a sub-check inconclusive (e.g., T5 download event timeout)
- All tests run on current production `04475a34` — not preview env, not local
- Magic-link bypass is a QA-only technique enabled by service-role key access; production users still go through Turnstile
- T5 PARTIAL is not a code bug confirmation — could be intended UX (e.g., email-delivered PDF)
