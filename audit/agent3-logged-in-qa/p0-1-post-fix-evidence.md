# P0-1 post-fix verification — Mark-as-Paid working end-to-end

PR #62 merged as `fe21364c`. Production deploy READY at ~12:35 UTC. Below: end-to-end verification of the fix on production using a fresh test account.

## Result: ✅ P0-1 RESOLVED — mark-as-paid works end-to-end in production

| Layer | Before fix | After fix |
|-------|-----------|-----------|
| Schema | `column "payment_method" does not exist` (42703) | both columns present, nullable TEXT |
| Direct psql UPDATE | ERROR | row updated, status=paid |
| API `POST /api/invoices/status` | HTTP 500 | **HTTP 200** ✓ |
| UI invoice detail | badge stuck `sent`, button still says "Mark as Paid" | badge transitions to green **`paid`** ✓ |
| Action menu | Send to Client / Send Invoice / Edit / Client View / Print PDF / Copy Pay Link / WhatsApp / QR Code / Pay Online / Duplicate (no "Credit Note") | Delete / Send Invoice / Client View / Print PDF / WhatsApp / QR Code / Duplicate / **Credit Note** ✓ (paid invoice action menu) |

## Test artifacts (fresh account)

| Resource | ID/Value |
|----------|----------|
| Test account email | `lancerwise-qa-1779107498@wshu.net` (mail.tm, gitignored creds) |
| Account user_id | `f77ffa5a-3141-4803-a410-d624b5d94699` |
| Test client | `67bac824-1afa-475d-9b44-cf1f351e1f83` ("PostFix Verify Co") |
| Test invoice | `94168173-28d4-4329-8550-69ac40826c67` (`INV-POSTFIX-001`, $750 USD) |

## Step-by-step verification

### 1. Fresh signup + landing
- Created mail.tm account `lancerwise-qa-1779107498@wshu.net`
- Submitted /register form, fully translated RU, Turnstile auto-passed
- Redirected immediately to `/onboarding` (P1-1 still open — confirms Ramiz hasn't toggled "Confirm email" yet at audit time)
- mail.tm inbox at +0s and +30s polled: 0 messages (confirms Supabase Auth still auto-confirms — P1-1 remains a launch blocker)

### 2. Test invoice setup (direct psql for speed)
Instead of clicking through the broken onboarding wizard (P1-3) + the multi-step client/invoice forms again, used service-role psql to insert a fresh test client + invoice under the new user's `user_id`. This isolates the P0-1 fix verification from unrelated wizard issues.

```sql
INSERT INTO public.clients (user_id, name, email)
VALUES ('f77ffa5a-3141-4803-a410-d624b5d94699', 'PostFix Verify Co', 'postfix-verify@example.com')
RETURNING id;
-- → 67bac824-1afa-475d-9b44-cf1f351e1f83

INSERT INTO public.invoices (user_id, client_id, invoice_number, status, total, currency,
                              issue_date, due_date, sent_at)
VALUES ('f77ffa5a-3141-4803-a410-d624b5d94699',
        '67bac824-1afa-475d-9b44-cf1f351e1f83',
        'INV-POSTFIX-001', 'sent', 750.00, 'USD',
        CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', now())
RETURNING id;
-- → 94168173-28d4-4329-8550-69ac40826c67
```

### 3. Navigate to invoice detail in browser → click Mark as Paid → modal → Confirm Paid

```javascript
// Playwright sequence:
b = [...buttons].find(x => x.textContent.trim() === 'Mark as Paid'); b.click();
// modal opens with payment method options (Bank Transfer pre-selected)
b = [...buttons].find(x => x.textContent.trim() === 'Confirm Paid'); b.click();
```

### 4. Network capture during click

```
POST https://www.lancerwise.com/api/invoices/status → HTTP 200
```

**vs. pre-fix POST same endpoint → HTTP 500**

### 5. DB state immediately after Confirm Paid

```
                  id                  | invoice_number  | status |          paid_at           | payment_method | total
--------------------------------------+-----------------+--------+----------------------------+----------------+--------
 94168173-28d4-4329-8550-69ac40826c67 | INV-POSTFIX-001 | paid   | 2026-05-18 12:39:27.936+00 | bank_transfer  | 750.00
```

- ✓ `status = paid`
- ✓ `paid_at` populated with action timestamp
- ✓ `payment_method = 'bank_transfer'` (normalized snake_case, matches `payment_method.replace(/_/g, ' ')` display logic in `/invoices/[id]/page.tsx`)

### 6. UI state confirmed

Screenshot: [`04-invoice-flow/qa-p0-fix-verified-paid.png`](04-invoice-flow/qa-p0-fix-verified-paid.png)

- Invoice header shows green **paid** badge (replacing `sent` blue badge)
- Total: $750 visible
- Action menu now shows post-paid options (Credit Note, Duplicate, etc.) — Mark as Paid button correctly removed
- Bottom Money / Clients / Work nav unaffected

## Same handler code, only schema changed

The handler `src/app/api/invoices/status/route.ts` was NOT modified by PR #62 — only the SQL migration ran. This proves:
1. The handler was always correct
2. The bug was purely schema gap
3. No client-side regression risk from the fix (no app code touched)

## Time taken
- Approval received → migration written + applied + verified at DB level: ~12 min
- Merge → production deploy ready: ~7 min (Vercel build)
- Fresh-account E2E verification: ~5 min
- **Total fix-to-verified-prod: ~24 min** (well under the 30-90 min estimate)

## Related findings still open (unchanged by this fix)

- P1-1: no email verification gate — Ramiz Supabase Dashboard toggle pending
- P1-2: /onboarding translation gap
- P1-3: /onboarding step 2 save 400 (separate handler bug)
- P1-4: /clients/new + /invoices/new + invoice detail translation gaps
- P2-1..P2-6: various polish (bottom nav EN, PWA banner EN, currency hardcoded, date format EN, install banner overlap, "🚀1/7 setup")
- P3-1..P3-2: page title EN, CF Turnstile console noise

See [`FINDINGS.md`](FINDINGS.md) for full detail.
