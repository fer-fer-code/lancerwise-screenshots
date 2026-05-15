# Task 3 — Step A Discovery: Email Infrastructure

**Date:** 2026-05-16
**Agent:** agent3
**Status:** Step A complete; awaiting reviewer approve for Step B

---

## TL;DR

* ✅ 3 universal templates confirmed (`simpleNotificationTemplate`, `infoCardNotificationTemplate`, `richSummaryTemplate`)
* ✅ HMAC-SHA256 + timingSafeEqual on `/api/unsubscribe` GET — solid
* ✅ Audience-aware opt-out (`profiles.email_unsubscribed`, `clients.email_unsubscribed`)
* ✅ Audit log `email_unsubscribe_log` with RLS (service-role-only)
* ⚠️ **Critical issue 1:** POST `/api/unsubscribe` `{audience,id,email}` branch has **no auth/HMAC check** — anyone who knows email+id can unsubscribe any account
* ⚠️ **Critical issue 2:** No physical mailing address в email footer — CAN-SPAM § 7704(a)(5)(A) violation for marketing/recurring emails
* ⚠️ **Minor issue 3:** Type field is `EmailType | string` — 14+ ad-hoc string values used; only 3 trigger transactional bypass of unsub footer (`'transactional' | 'system' | 'critical'`). Risk of typo causing inadvertent unsub-footer-less marketing email.
* ⚠️ **Minor issue 4:** Legacy unsigned base64 token grace period accepts forgeable tokens — flag for removal post-launch when usage trails off

---

## A.1 — 3 universal templates

In `src/lib/email.ts`:

| Template | Line | Purpose |
|---|---|---|
| `simpleNotificationTemplate` | 721 | Plain prose + CTA notifications (e.g. invoice viewed, proposal opened) |
| `infoCardNotificationTemplate` | 817 | Notification + 1 highlighted info block (e.g. payment received, milestone complete) |
| `richSummaryTemplate` | 1002 | Multi-section summary (e.g. weekly digest, monthly report) |

These are wrapped через `emailShell({title, content, preheader, footerNote, unsubscribeUrl})` from `src/lib/emails/shell.ts` — single source of dark-theme layout. Shell handles Outlook 2007–2019 table-based fallbacks, Gmail/Apple Mail dark-mode meta, mobile media query, plain-text fallback generation.

**Legacy templates** (not yet migrated, still callable):
* `src/lib/emailTemplates.ts` — 19 functions (invoiceEmailHTML, weeklyReportHTML, etc.)
* `src/lib/email.ts` lines 124–700 — ~17 named templates (invoiceComposeTemplate, paymentReceiptTemplate, etc.)

These coexist with the 3 universal ones. Migration is partial but functional.

## A.2 — sendEmail() call sites

* Total invocations: **161** `sendEmail({...})` calls
* Distinct caller files: **120+**
* Wrapper: `src/lib/email.ts:67` `export async function sendEmail({to, subject, html, text, userId, clientId, type, replyTo})`

`sendEmail()` correctly:
* Checks `profiles.email_unsubscribed` if `userId` set → skip silently if true
* Checks `clients.email_unsubscribed` if `clientId` set → skip silently if true
* Appends fallback unsubscribe footer for recurring types (Phase A bridge)
* Logs to `email_logs` post-send (best-effort)

## A.3 — HMAC unsubscribe

`src/lib/unsubscribe.ts` (111 lines):

* HMAC-SHA256 over base64url-encoded JSON payload (`{audience, id, email}`)
* `signUnsubscribeToken()` — input validation (audience must be 'user'|'client', all 3 fields required)
* `verifyUnsubscribeToken()` — length check before `timingSafeEqual` → constant-time, no timing leak
* `getSecret()` — throws in production if `UNSUBSCRIBE_SECRET < 16 chars`; dev fallback logs warning
* Token format: `<base64url(payload)>.<hex(hmac)>` — decodable but not forgeable

**Strong implementation.** No issues с the crypto itself.

`/api/unsubscribe/route.ts` (186 lines):

GET flow:
1. Read `token` from query
2. Verify HMAC → если valid, call `applyUnsubscribe(payload, 'unsubscribe_link')`
3. Else try legacy base64(email) → match against `profiles` by email
4. Else try legacy base64(uuid) → match against `profiles` by id
5. Return HTML page with success/error message

POST flow:
1. If `body.token` → verify HMAC → applyUnsubscribe
2. **Else if `body.audience && body.id && body.email`** → applyUnsubscribe directly (NO HMAC CHECK)

**Critical issue 1:** POST direct flow has no auth gate. Middleware excludes `/api/*` from auth by default (only `/api/auth/*`, `/api/v1/*`, `/api/ai/*` get rate limits, none get auth). Anyone can POST:

```bash
curl -X POST https://www.lancerwise.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"audience":"user","id":"<victim-uuid>","email":"victim@example.com"}'
```

→ flips `profiles.email_unsubscribed` для that user. UUID isn't secret in many flows (referrer logs, screenshots, public profile URLs). Email + UUID is the unsub key — both leakable.

Code comment says "for in-app preferences UI — requires auth, but that gate lives at the route boundary". **The gate does not exist в middleware or в the route file.**

## A.4 — DB schema

Three migrations:

1. **`20260425000001_email_unsubscribe_recurring.sql`** — adds `profiles.email_unsubscribed boolean DEFAULT false`
2. **`20260512000001_clients_email_unsubscribed.sql`** — adds `clients.email_unsubscribed boolean NOT NULL DEFAULT false` + creates `email_unsubscribe_log` audit table with RLS (service-role-only)
3. **`20260425000039_email_logs.sql`** — `email_logs` for send tracking (user_id, type, to_email, subject, sent_at); RLS allows users to see own logs

`email_unsubscribe_log` schema:
```sql
id            uuid PK
audience      text CHECK (audience IN ('user', 'client'))
target_id     uuid NOT NULL
email         text NOT NULL
source        text DEFAULT 'unsubscribe_link'   -- 'unsubscribe_link' | 'legacy_unsigned'
unsubscribed_at timestamptz DEFAULT now()
```

Indexed on (audience, target_id) and (unsubscribed_at DESC). Service-role-only access. Solid.

## A.5 — CAN-SPAM audit

CAN-SPAM § 7704(a) requires:
1. **Sender identification** in From/header — ✅ `RESEND_FROM_EMAIL` env or `LancerWise <onboarding@resend.dev>` fallback
2. **Subject line accuracy** — ⚠️ template-level can't enforce; each `sendEmail()` caller sets own subject. Spot-check needed for all 161 sites. Templates I've reviewed don't have deceptive defaults.
3. **Identification as advertisement** — N/A for transactional/relationship emails (purely transactional are exempt per § 7702(a))
4. **Physical postal address** — ❌ **MISSING** — `emailShell.ts` footer (lines 134–139):
   ```html
   <td style="padding: 20px 32px; border-top:..."><a href="https://www.lancerwise.com">LancerWise</a> · Unsubscribe</td>
   ```
   No postal address. Required for **commercial messages** under § 7704(a)(5)(A). Transactional are exempt, but recurring/marketing (digest, reminder, notification) are not.
5. **Unsubscribe mechanism** — ✅ Working HMAC-signed link in footer for recurring types; takes effect immediately (DB update on click)
6. **Honor opt-out within 10 business days** — ✅ DB update is immediate; subsequent `sendEmail()` to that user/client is skipped

**Critical issue 2:** Physical address missing. Fix path в Step B: amend `emailShell()` footer or pass through `addressLine` via shell options и conditionally render only for non-transactional types.

## A.6 — Transactional vs marketing classification

`EmailType` definition (`src/lib/email.ts:18`):
```typescript
type EmailType = 'notification' | 'marketing' | 'digest' | 'reminder' | 'transactional' | 'system' | 'critical' | string
```

The `| string` catch-all allows any value — no compile-time enforcement.

`maybeAppendFallbackFooter()` whitelist for "no unsub footer needed" (truly transactional):
* `'transactional' | 'system' | 'critical'`

Everything else (or undefined) gets unsubscribe footer.

Observed `type:` values across 161 send sites (sample, from grep over `/tmp/email-send-sites.txt`):

| Type | Classification | Risk |
|---|---|---|
| `'transactional'` | Transactional ✅ | none |
| `'system'` | Transactional ✅ | none |
| `'critical'` | Transactional ✅ | none |
| `'digest'`, `'digest_test'` | Marketing/Recurring | needs unsub + address |
| `'reminder'`, `'invoice_reminder'`, `'renewal_reminder'`, `'budget_alert'` | Recurring | needs unsub + address |
| `'notification'`, `'milestone_alert'`, `'goal_progress_alert'` | Notification/Recurring | needs unsub + address |
| `'proposal_sent'`, `'proposal_followup'` | Marketing-adjacent | needs unsub + address |
| `'scope_creep_alert'`, `'late_payment_pattern'`, `'expense_summary'` | Notification | needs unsub + address |

**Critical issue 3:** No canonical enum. A typo (e.g., `type: 'tranzactional'`) silently routes the email as recurring AND skips the explicit transactional check elsewhere. Fix path: replace `| string` with strict union, fail TypeScript build on typos.

## A.7 — Legacy unsigned token grace period

`/api/unsubscribe/route.ts` lines 14–34 + 147–158 accept legacy unsigned base64(email) and base64(uuid) tokens. These are **forgeable** — anyone can base64-encode an email и unsubscribe that account.

Code comment says это grace period для existing emails в client inboxes. Source logged as `'legacy_unsigned'` for monitoring.

**Minor issue 4:** Acceptable as transition mechanism, but should be removed before public launch OR within 30-day grace from D1d migration date (2026-05-12 → grace ends ~2026-06-11). Recommend Step B plan a follow-up removal date.

---

## Open questions для Step B

1. **Critical issue 1 (POST direct flow):** quick fix to remove `audience+id+email` branch from POST OR add auth gate? Removal is simplest and breaks no callers (in-app preferences should use HMAC token from sendUnsubscribeEmail).
2. **Critical issue 2 (physical address):** add to `emailShell()` footer behind `addressLine` option, defaulting to env `LANCERWISE_POSTAL_ADDRESS`? Or hardcode? Address content depends on legal entity — needs reviewer input.
3. **Minor issue 3 (type union):** drop `| string` from `EmailType` и enforce strict enum? Will require touch к ~50+ call sites that pass non-canonical strings (`invoice_reminder`, etc.). High-touch but type-safe.
4. **Minor issue 4 (legacy tokens):** when to remove grace period? Reviewer call.

---

## Evidence files

* `README.md` — context + methodology
* `discovery.md` — this report
* `email-files.txt` — file inventory
* `email-send-sites.txt` — 383 grep lines, 197 unique files for send-related code
* `unsubscribe-schema.txt` — full text of 3 DB migrations
* `type-classification.txt` — sample of `type:` field values across send sites
* `email-infra-inventory.txt` — inventory summary
