# Task 3 Phase C-2 — Completion Report

**Date:** 2026-05-16
**Agent:** agent3
**Status:** ✅ Code COMPLETE, awaiting reviewer to set Vercel env var before merging PR #3

---

## Commit SHAs

* **Phase C-1:** `d9c220ead171a03f9898567c2e4dc88aa5a7c8af`
* **Phase C-2:** `cba9871b3f2ca16b06f1c9b0bcd76dba6e7c1d7e` (cherry-picked from reverted main commit `7053a345`)
* **Errant push к main:** `7053a345` (reverted by `3df32c0e` before any deploy ran — см. `phase-c2-incident.md`)

PR: https://github.com/fer-fer-code/lancerwise/pull/3 (stack: C-1 + C-2)
Branch: `agent3-task3-email-qa`

Vercel deploy URL: **pending** — PR not yet merged; will be reviewer's call after setting env var.

---

## 1. Vercel env var step — needs Ramiz action

**Exact setting:**
```
Key:    LANCERWISE_POSTAL_ADDRESS
Value:  Lancerwise, Marina Suites, Nha Trang, Khanh Hoa, Vietnam
Envs:   ☑ Production  ☑ Preview  ☐ Development
```

**UI path:**
1. https://vercel.com/lancerwise/lancerwise/settings/environment-variables
2. "Add New" → fill key/value above → check Production + Preview only → Save
3. Comment "env var set" в PR #3 (or @-mention)

**Don't enable Development scope** — keep local dev hard-failing if developer forgets к set `.env.local` value.

---

## 2. Code diffs

### `src/lib/emails/shell.ts` (+ 23 lines)

```diff
+/** Email types that bypass the CAN-SPAM postal-address footer per § 7702(a)
+ *  transactional exemption. Anything else gets the address rendered. */
+export const TRANSACTIONAL_TYPES = ['transactional', 'system', 'critical'] as const
+
 export interface EmailShellOptions {
   ...existing fields...
+  /** Physical postal address line for CAN-SPAM § 7704(a)(5)(A) compliance.
+   *  Defaults to process.env.LANCERWISE_POSTAL_ADDRESS at render time.
+   *  Rendered ONLY when type is NOT в TRANSACTIONAL_TYPES. */
+  addressLine?: string
+  /** Email type — drives whether postal address is rendered. */
+  type?: string
 }

 export function emailShell({
   preheader, title, content, footerNote, unsubscribeUrl,
+  addressLine, type,
 }: EmailShellOptions): string {
   ...existing setup...
+
+  const effectiveAddress = addressLine ?? process.env.LANCERWISE_POSTAL_ADDRESS
+  const isTransactional = TRANSACTIONAL_TYPES.includes(type as typeof TRANSACTIONAL_TYPES[number])
+  const addressBlock = (effectiveAddress && !isTransactional)
+    ? `<div style="margin-top:8px; font-size:11px; line-height:1.4; color:${TEXT_MUTED};" class="text-muted">${escapeHtml(effectiveAddress)}</div>`
+    : ''
   ...

         <!-- Footer -->
         <tr>
           <td style="padding: 20px 32px; ...">
             ${footerLine}<a href="https://www.lancerwise.com">LancerWise</a>${unsubLink}
+            ${addressBlock}
           </td>
         </tr>
```

### `src/lib/email.ts` (+ 18 lines)

```diff
 export interface SharedEmailOptions {
   ...existing fields...
+  /** Email type — controls CAN-SPAM postal-address footer.
+   *  'transactional' | 'system' | 'critical' bypass per § 7702(a). */
+  type?: string
 }

 export async function sendEmail({ to, subject, html, text, userId, clientId, type, replyTo }: EmailPayload) {
+  // CAN-SPAM § 7704(a)(5)(A) hard-fail: non-transactional emails MUST carry
+  // a physical postal address. emailShell() reads LANCERWISE_POSTAL_ADDRESS
+  // at render time — if unset, address is silently omitted и we send
+  // non-compliant mail. Catch that here at send-time.
+  const TRANSACTIONAL = new Set(['transactional', 'system', 'critical'])
+  if (!TRANSACTIONAL.has(type ?? '') && !process.env.LANCERWISE_POSTAL_ADDRESS) {
+    throw new Error('LANCERWISE_POSTAL_ADDRESS env var required for non-transactional emails (CAN-SPAM § 7704(a)(5)(A))')
+  }
   ...existing flow...
 }

 // 3 universal templates — passing type through to emailShell:
 export function simpleNotificationTemplate(opts: SimpleNotificationOpts): string {
   return emailShell({
     ...existing fields...
+    type: opts.type,
   })
 }
 // Same for infoCardNotificationTemplate (line 826) и richSummaryTemplate (line 1012)
```

---

## 3. D.2 fixture evidence — 6 fixtures rendered

Pasted excerpts from generated HTML/text fixtures (full files в `fixtures/` subfolder):

### `simple-transactional` HTML footer (NO address — exempt)
```html
<td style="padding: 20px 32px; border-top:1px solid #2a2a35; color:#8b8b94; font-size:12px;">
  <a href="https://www.lancerwise.com" style="color:#c4b5fd; text-decoration:underline;">LancerWise</a>&nbsp;·&nbsp;<a href="...api/unsubscribe?token=test">Unsubscribe</a>
  
</td>
```

### `simple-digest` HTML footer (HAS address — required)
```html
<td style="padding: 20px 32px; border-top:1px solid #2a2a35; color:#8b8b94; font-size:12px;">
  <a href="https://www.lancerwise.com">LancerWise</a>&nbsp;·&nbsp;<a href="...api/unsubscribe?token=test">Unsubscribe</a>
  <div style="margin-top:8px; font-size:11px; line-height:1.4; color:#8b8b94;" class="text-muted">Lancerwise, Marina Suites, Nha Trang, Khanh Hoa, Vietnam</div>
</td>
```

### `simple-digest` plain-text fallback tail
```
LancerWise (https://www.lancerwise.com) · Unsubscribe (https://www.lancerwise.com/api/unsubscribe?token=test)
Lancerwise, Marina Suites, Nha Trang, Khanh Hoa, Vietnam
```

### Aggregate matrix
```
fixture                          html_address  plain_address
simple-transactional             false         false
simple-digest                    true          true
infocard-transactional           false         false
infocard-digest                  true          true
rich-transactional               false         false
rich-digest                      true          true
```

All 6 match expected behavior. Plain-text fallback correctly includes address для recurring types и omits it для transactional.

---

## 4. D.3 real email send evidence

Sent to **`lancerwise.team@gmail.com`** (Resend test-mode key permits only this address; CF Email Routing rule forwards to the same inbox from `team@lancerwise.com`):

```
transactional → {"ok":true, "data":{"id":"9922b1d5-d7d1-4063-beae-a590cedfb65e"}}
digest        → {"ok":true, "data":{"id":"f156d9f6-0508-4272-af5c-cd6cf13eefb5"}}
```

**Ramiz: open https://mail.google.com/mail/u/0/#search/agent3+D.3+test и screenshot both inboxes** to confirm:
* "transactional" email footer reads just `LancerWise · Unsubscribe`
* "digest" email footer reads `LancerWise · Unsubscribe` + new line `Lancerwise, Marina Suites, Nha Trang, Khanh Hoa, Vietnam`

(Я не have Gmail screenshot ability — but Resend IDs above confirm both delivered.)

Note: original target was `krokusstudia2@gmail.com` (your personal). Resend test-mode key rejected it ("you can only send testing emails to your own email address (lancerwise.team@gmail.com)"). Production Resend key (paid plan) will accept any recipient.

---

## 5. Hard-fail test (D.3 unit case)

Standalone script temporarily unset env var и attempted а `type: 'digest'` send:

```
=== D.3 hard-fail test: temporarily unset LANCERWISE_POSTAL_ADDRESS ===
  ✅ Hard-fail thrown as expected:
     LANCERWISE_POSTAL_ADDRESS env var required for non-transactional emails (CAN-SPAM § 7704(a)(5)(A))
  ✅ Transactional with no env var still succeeded: {"ok":true,"data":{"id":"8e57a215-d096-4f30-845a-c54be104ea6f"}}
```

Confirms:
* `type: 'digest'` + no env → throws expected error message ✅
* `type: 'transactional'` + no env → still succeeds (bypass works correctly) ✅

---

## 6. Post-deploy D.1 verification (deferred)

After PR #3 merges + Vercel deploys:

```bash
# Should now return "Missing token" (not "Missing token or {audience,id,email}")
curl -X POST https://www.lancerwise.com/api/unsubscribe \
  -H "Content-Type: application/json" \
  -d '{"audience":"user","id":"00000000-0000-0000-0000-000000000000","email":"test@example.invalid"}'

# Expected: {"error":"Missing token"} HTTP 400
```

Я will run this и report once deploy completes.

---

## 7. Incident memo — Phase C-2 push к main

`audit/agent3-task3-evidence/phase-c2-incident.md` documents an issue: Phase C-2 commit briefly landed on `main` (commit `7053a345`) due to silent branch switch by parallel agent. Reverted (`3df32c0e`) before any deploy. Cherry-picked properly к `agent3-task3-email-qa`. **Production NOT affected.**

Apologies для the PR-review bypass. Lesson logged.

---

## 8. Backlog memos applied (for reviewer to add к user memory)

* `backlog_legacy_unsubscribe_tokens_removal.md` — scheduled 2026-06-15 (already pushed Phase C-1)
* `backlog_email_type_strict_enum.md` — Minor 3 strict EmailType enum (post-launch refactor)
* `backlog_lancerwise_legal_entity.md` — register formal entity (US LLC или Vietnam), update `LANCERWISE_POSTAL_ADDRESS` к registered business address

(Я recommend reviewer create these memory files; agent3 не modifies user memory без explicit ask.)

---

## Phase C-2 summary

| Item | Status |
|---|---|
| `shell.ts` addressLine + type | ✅ Implemented |
| `email.ts` 3 templates pass type | ✅ Implemented |
| `sendEmail()` hard-fail | ✅ Implemented + tested (throws expected) |
| D.2 fixture rendering | ✅ 6/6 fixtures pass |
| D.3 real email send | ✅ 2 Resend IDs (lancerwise.team@gmail.com) |
| D.3 hard-fail unit | ✅ Pass |
| PR #3 updated | ✅ Both commits stacked |
| Vercel env var | ⏳ Pending Ramiz |
| Post-deploy D.1 probe | ⏳ Pending merge + deploy |
| Errant push к main incident | ✅ Reverted, documented |

Phase C-2 ready to ship after Vercel env var set + PR merged.
