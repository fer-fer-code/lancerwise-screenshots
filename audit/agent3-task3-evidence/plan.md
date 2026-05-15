# Task 3 — Step B Plan: Email Templates Final QA Cleanup

**Date:** 2026-05-16
**Status:** Awaiting reviewer approval. Step C blocked on Ramiz providing postal address (Critical 2).

---

## 1. Discovery recap

Per [discovery.md](./discovery.md): 3 universal templates confirmed; HMAC crypto solid; DB schema clean. **4 issues identified:**

1. CRITICAL — POST `/api/unsubscribe` direct flow `{audience, id, email}` has no auth → anyone with email+UUID can flip `email_unsubscribed`
2. CRITICAL — No physical postal address в email footer → CAN-SPAM § 7704(a)(5)(A) violation for recurring/marketing emails
3. MINOR — `EmailType | string` allows typos → defer to post-launch backlog
4. MINOR — Legacy unsigned token grace period → defer removal to 2026-06-15 backlog

---

## 2. CRITICAL 1 — Remove POST `/api/unsubscribe` direct flow

### Investigation results

Grep across `src/` for callers of POST `/api/unsubscribe` with `{audience, id, email}` body:

```
$ grep -rn "fetch.*['\"]/api/unsubscribe" src/ --include="*.tsx" --include="*.ts"
(no results)
```

**ZERO callers** use POST direct flow в-app. All legitimate generators of unsubscribe URLs использовать `buildUnsubscribeUrl(payload)` (`src/lib/unsubscribe.ts:109`), которое returns a GET URL containing the HMAC-signed token. Found 11 such call sites:

* `src/app/api/satisfaction-surveys/respond/[token]/route.ts`
* `src/app/api/invoices/send-reminder/route.ts`
* `src/app/api/intake-forms/public/[token]/submit/route.ts`
* `src/app/api/survey/project/[token]/route.ts`
* `src/app/api/survey/[token]/route.ts`
* `src/app/api/auto-reminders/send-now/route.ts`
* `src/app/api/booking-requests/route.ts`
* `src/app/api/email/route.ts`
* (+ 3 more — full list в `step-b-investigation-post-callers.txt`)

All use the audience+id+email triple for **token construction**, не для POST body. Safe to delete the direct-flow branch.

### Exact removal diff for `src/app/api/unsubscribe/route.ts`

Lines 175–183 (POST direct-flow branch) → DELETE:

```diff
 export async function POST(request: NextRequest) {
-  const body = await request.json().catch(() => ({})) as { token?: string; audience?: Audience; id?: string; email?: string }
+  // POST accepts only { token }. The direct { audience, id, email } branch
+  // was removed in agent3 task3 — it lacked auth and let anyone with email+UUID
+  // flip another user's email_unsubscribed flag. All legitimate callers use
+  // buildUnsubscribeUrl() / signUnsubscribeToken() to generate signed tokens.
+  const body = await request.json().catch(() => ({})) as { token?: string }

   // Token-based flow (same as GET).
   if (body.token) {
     const verified = verifyUnsubscribeToken(body.token)
     if (!verified) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
     const { ok, error } = await applyUnsubscribe(verified, 'unsubscribe_link')
     return ok
       ? NextResponse.json({ ok: true })
       : NextResponse.json({ error: error || 'Failed' }, { status: 500 })
   }

-  // Direct flow (for in-app preferences UI — requires auth, but that
-  // gate lives at the route boundary). Body must include audience+id+email.
-  if (body.audience && body.id && body.email) {
-    const { ok, error } = await applyUnsubscribe(body as UnsubPayload, 'unsubscribe_link')
-    return ok
-      ? NextResponse.json({ ok: true })
-      : NextResponse.json({ error: error || 'Failed' }, { status: 500 })
-  }
-
-  return NextResponse.json({ error: 'Missing token or {audience,id,email}' }, { status: 400 })
+  return NextResponse.json({ error: 'Missing token' }, { status: 400 })
 }
```

Also update the imports — `Audience` and `UnsubPayload` types still needed by GET flow.

**Net change:** -10 lines, +6 lines, 1 file. Risk: zero (no callers).

---

## 3. CRITICAL 2 — Physical postal address в email footer

### Approach (per reviewer Q2 decision)

* Add `LANCERWISE_POSTAL_ADDRESS` to `.env.example` + production env (Vercel)
* `emailShell()` accepts new `addressLine?: string` option
* If `addressLine` омитted, fall back to `process.env.LANCERWISE_POSTAL_ADDRESS`
* Conditionally render `<div>${addressLine}</div>` в footer ONLY when:
  * `addressLine` is truthy
  * email type is NOT transactional/system/critical
* Plain-text fallback (`htmlToPlainText` already converts `<div>` via paragraph rules) — verify address appears in plain-text version

### `emailShell()` signature change

```diff
 export interface EmailShellOptions {
   preheader?: string
   title: string
   content: string
   footerNote?: string
-  /** Unsubscribe URL — required for transactional + marketing. */
   unsubscribeUrl?: string
+  /** Postal address line, e.g. "LancerWise LLC, 1234 Main St, City, ST 12345, USA".
+   *  Required by CAN-SPAM § 7704(a)(5)(A) for recurring/marketing emails.
+   *  Defaults to process.env.LANCERWISE_POSTAL_ADDRESS. */
+  addressLine?: string
+  /** Email type — drives whether postal address is rendered.
+   *  'transactional' | 'system' | 'critical' suppress address (CAN-SPAM exempt). */
+  type?: 'transactional' | 'system' | 'critical' | string
 }
```

### Footer template change

```diff
       <tr>
         <td style="padding: 20px 32px; border-top:1px solid ${BORDER}; color:${TEXT_MUTED}; font-size:12px; line-height:1.5;" class="text-muted">
           ${footerLine}<a href="https://www.lancerwise.com" style="color:${VIOLET_300}; text-decoration:underline;">LancerWise</a>${unsubLink}
+          ${addressBlock}
         </td>
       </tr>
```

Where `addressBlock` is computed as:

```ts
const effectiveAddress = addressLine ?? process.env.LANCERWISE_POSTAL_ADDRESS
const isTransactional = ['transactional', 'system', 'critical'].includes(type ?? '')
const addressBlock = (effectiveAddress && !isTransactional)
  ? `<div style="margin-top:8px; font-size:11px; color:${TEXT_MUTED};">${escapeHtml(effectiveAddress)}</div>`
  : ''
```

### sendEmail() wrapper

`sendEmail()` already receives `type`. Доhнадобится pass `type` through to templates that call `emailShell()`. The 3 universal templates (`simpleNotificationTemplate`, `infoCardNotificationTemplate`, `richSummaryTemplate`) take a `type?` opt → pass it to shell.

Plan for Step C: surgical addition to template opts:

```diff
 interface SimpleNotificationOpts {
   ...existing...
+  type?: string
 }

 export function simpleNotificationTemplate(opts: SimpleNotificationOpts): string {
   return emailShell({
     ...existing...,
+    type: opts.type,
   })
 }
```

Same pattern for `infoCardNotificationTemplate` (line 817) and `richSummaryTemplate` (line 1002).

For legacy templates (37 still in `emailTemplates.ts` + `email.ts`): defer для post-launch refactor — they're transactional in nature anyway (invoice_sent, payment_receipt, etc.), CAN-SPAM exempt.

### Env var addition

`.env.example`:

```diff
+# CAN-SPAM § 7704(a)(5)(A) — physical postal address for recurring/marketing email footers.
+# Format: "Legal Entity Name, Street, City, State ZIP, Country"
+# Example: "LancerWise LLC, 1234 Main St, San Francisco, CA 94103, USA"
+LANCERWISE_POSTAL_ADDRESS=
```

Vercel production env: must be set before Step C deploy. **🚨 BLOCKED on Ramiz providing actual address.**

### Type list — address required vs exempt

| Type | CAN-SPAM | Address required? |
|---|---|---|
| `'transactional'`, `'system'`, `'critical'` | Exempt (§ 7702(a)) | NO |
| All others (incl. `'digest'`, `'reminder'`, `'notification'`, `'marketing'`, и любые ad-hoc strings) | Recurring/relationship | YES |

---

## 4. MINOR 3 — Strict EmailType enum (DEFER)

Backlog entry text (для appending to MEMORY.md or separate backlog file):

```markdown
- [Email type strict enum backlog](backlog_email_type_strict_enum.md) — P2 post-launch:
  remove `| string` escape from `EmailType` в `src/lib/email.ts:18`; canonicalize
  the 14+ ad-hoc strings found in send sites (`'invoice_reminder'`,
  `'budget_alert'`, etc.) to a strict union. Prevents typo-caused
  inadvertent recurring marketing emails. Touches ~50+ call sites.
```

NOT in Step C scope.

---

## 5. MINOR 4 — Legacy unsigned tokens (BACKLOG + SCHEDULED REMOVAL)

Create new file `audit/agent3-task3-evidence/backlog_legacy_unsubscribe_tokens_removal.md` (also recommended saving as memory file by reviewer):

```markdown
# Backlog: legacy_unsigned unsubscribe token removal

**Scheduled removal date:** 2026-06-15
**Source migration:** D1d (2026-05-12)
**Grace period:** 30 days + buffer

## Pre-removal verification

Run weekly от 2026-05-19 to 2026-06-15:

\`\`\`sql
SELECT count(*) FROM email_unsubscribe_log
WHERE source = 'legacy_unsigned' AND unsubscribed_at > now() - interval '7 days';
\`\`\`

If count > 5 in the last full week before scheduled date, defer removal +14 days. Else proceed.

## Code locations для deletion

* `src/app/api/unsubscribe/route.ts` lines 14–34 (`parseLegacyEmail`, `parseLegacyUuid`)
* `src/app/api/unsubscribe/route.ts` lines 105–132 (`resolveLegacyToPayload`)
* `src/app/api/unsubscribe/route.ts` lines 147–158 (GET fallback for legacy tokens)

After removal: legacy tokens return ERROR_BODY HTML. Users with old emails в inbox click link → "Invalid unsubscribe link" page → must contact support OR receive a fresh email and click the new HMAC-signed link.
```

NOT removed in Step C — just scheduled.

---

## 6. Code change inventory

| File | Change | Step |
|---|---|---|
| `src/app/api/unsubscribe/route.ts` | Remove POST direct-flow branch (-10/+6 lines) | Step C |
| `src/lib/emails/shell.ts` | Add `addressLine` + `type` опции; conditional footer render | Step C (blocked on address) |
| `src/lib/email.ts` | Pass `type` to shell в 3 universal templates (lines 721, 817, 1002) | Step C (blocked on address) |
| `.env.example` | Add `LANCERWISE_POSTAL_ADDRESS` placeholder | Step C |
| `audit/agent3-task3-evidence/backlog_legacy_unsubscribe_tokens_removal.md` | NEW backlog file | Step C |

**Net touch surface:** 4 files modified + 1 new backlog file. Total ~30 lines changed.

---

## 7. Test plan (Step D)

### D.1 — POST `/api/unsubscribe` security regression

```bash
# Direct-flow attempt → должен fail
curl -X POST https://www.lancerwise.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"audience":"user","id":"<test-uuid>","email":"test@example.com"}'
# Expected: { "error": "Missing token" } with 400

# Token-flow → должен succeed
TOKEN=$(node -e "...buildUnsubscribeUrl from test fixture...")
curl -X POST https://www.lancerwise.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}"
# Expected: { "ok": true } with 200
```

Save evidence: `d1-unsubscribe-security.txt`

### D.2 — Email footer postal address rendering

For each of 3 universal templates, generate a test email с each type tier:

```ts
// Test fixtures
const transactionalTest = simpleNotificationTemplate({
  ...minimalOpts,
  type: 'transactional',
})
const recurringTest = simpleNotificationTemplate({
  ...minimalOpts,
  type: 'digest',
})
```

Render both HTML и plain text. Verify:
* `transactionalTest` HTML: **no** address line
* `recurringTest` HTML: address line present (truncated to fit footer)
* Both: unsubscribe link present (if `unsubscribeUrl` passed)

Save HTML files for manual visual inspection в Litmus / browser preview.

### D.3 — sendEmail() integration test

* Send test email с `type: 'transactional'` → verify no address в rendered output
* Send test email с `type: 'digest'` → verify address visible в Gmail mobile + desktop, Apple Mail dark mode, Outlook 2007 fallback

Save Litmus screenshots in evidence/ (if Litmus available; otherwise local browser dev mode + multiple inboxes).

### D.4 — Grep verify removal

```bash
grep -rn "body.audience\|body\.id\|body\.email" src/app/api/unsubscribe/route.ts
# Expected: zero matches after Step C
```

---

## 8. Risk register

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| 1 | Unknown POST direct-flow caller breaks after removal | Very Low | Med | Grep showed zero callers; if production logs show 4xx spike, restore branch с auth middleware |
| 2 | Postal address envвar missing in production → emails sent без required address | Low | High (legal) | Hard-fail в `sendEmail()` для non-transactional types when address absent OR add CI check for env var existence |
| 3 | Address visually too long for footer (Outlook) | Med | Low | Truncate to 100 chars в shell or document max length |
| 4 | Legacy unsigned token removal premature → old inbox clicks fail | Low | Low | Pre-removal SQL query + scheduled date; users can still receive fresh emails |
| 5 | Plain-text fallback omits address | Low | Med | `htmlToPlainText` already converts `<div>` → newlines; explicit test in D.2 |
| 6 | Type passing through 3 templates → opts.type touches 3 function signatures | Low | Very Low | Optional param, default behavior unchanged |

---

## 9. Estimated time

| Phase | Activity | Time |
|---|---|---|
| Step C.1 | Remove POST direct-flow branch | 5 min |
| Step C.2 | `emailShell` + 3 universal template changes | 20 min |
| Step C.3 | `.env.example` + backlog file | 5 min |
| Step C.4 | npm run build verify | 10 min |
| Step C.5 | Push + open PR | 5 min |
| Step D | Verification (D.1–D.4) | 30 min |
| **Total Step C+D** | (excluding Ramiz address wait) | **~75 min** |

---

## 10. 🚨 STEP C BLOCKED ON RAMIZ INPUT

Before Step C can proceed, need from Ramiz:

1. **Legal entity name** для email footer (e.g. "LancerWise LLC", "ИП Fiziev R.", etc.)
2. **Registered business address** для CAN-SPAM compliance. Если non-US legal entity, what US service address? Может быть virtual office address OR home address if no business yet.
3. Confirm OK to commit address text in `.env.example` placeholder (using fake example) AND set actual value in Vercel production env (not in repo)

If Ramiz prefers tax-time setup, alternative interim:
* Use Ramiz's home address (already in payment card record per memory `project_card_details.md`)
* Add note в backlog to update once formal business entity registered

Reviewer please confirm OR provide address.

---

## 11. Open questions для reviewer

* **Q1:** Confirm hybrid plan (Critical 1 removal + Critical 2 env-based) — OK?
* **Q2:** Risk #2 mitigation — fail-hard когда env var missing? Or soft-warn в logs only? Hard-fail is safer pre-launch.
* **Q3:** Step C может proceed для Critical 1 + MINOR 4 backlog file (don't need Ramiz address для those), then pause until address arrives для Critical 2?
