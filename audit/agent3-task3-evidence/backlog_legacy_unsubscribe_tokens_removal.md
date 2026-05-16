# Backlog: legacy_unsigned unsubscribe token removal

**Status:** scheduled
**Removal date:** 2026-06-15
**Source migration:** D1d (`20260512000001_clients_email_unsubscribed.sql`, applied 2026-05-12)
**Grace period:** 30 days + 3-day buffer

## Why

`/api/unsubscribe` currently accepts two legacy unsigned token formats during a transition window:

1. `base64(email)` — anyone who base64-encodes an email can unsubscribe that user (forgeable)
2. `base64(user_id)` — same problem with UUID

These were necessary при rollout of HMAC-signed tokens (D1d) so that emails already sitting в client inboxes with old-format unsubscribe links continued to work.

After 30 days, all marketing/recurring emails in active inboxes should have been re-sent with HMAC-signed tokens via the new path. Legacy tokens then become abuse surface only.

## Pre-removal verification

Run weekly starting **2026-05-19** and stop after **2026-06-15**:

```sql
SELECT count(*) AS legacy_hits_last_7d
FROM email_unsubscribe_log
WHERE source = 'legacy_unsigned'
  AND unsubscribed_at > now() - interval '7 days';
```

**Decision rule:**

* If `legacy_hits_last_7d > 5` in the last full week before scheduled date → defer removal +14 days (extend grace period)
* If ≤ 5 → proceed with scheduled removal

Log the weekly count в `audit/agent3-task3-evidence/legacy-hits-monitor.txt` (append-only).

## Code locations для deletion

Three regions в `src/app/api/unsubscribe/route.ts`:

1. **Lines 14–34** — helper functions:
   ```typescript
   function parseLegacyEmail(token: string): string | null { ... }
   function parseLegacyUuid(token: string): string | null { ... }
   ```
2. **Lines 105–132** — `resolveLegacyToPayload()` helper
3. **Lines 147–158** — GET fallback branch:
   ```typescript
   // Legacy grace period — base64(email) or base64(user_id).
   const legacyEmail = parseLegacyEmail(token)
   const legacyUuid = parseLegacyUuid(token)
   if (legacyEmail || legacyUuid) { ... }
   ```

After removal, `GET /api/unsubscribe?token=<base64-email>` returns the `ERROR_BODY` HTML page ("Invalid unsubscribe link" + contact support link).

## User impact after removal

* New emails (HMAC-signed) — unaffected
* Old emails в inboxes with legacy tokens — clicking yields error page instructing к contact `support@lancerwise.com`
* Users can still receive a fresh marketing email and click the new link

## Owner

agent3 task3 (this evidence folder) — scheduled but not yet executed.

## Removal PR template

When removal happens, the PR description should include:

* SQL output of `legacy_hits_last_7d` для each of the 4 monitoring weeks
* Diff showing -53 lines (approximate) от route.ts
* Confirmation что `npm run build` passes
* Confirmation что D.1 unsubscribe security regression test still passes для HMAC tokens
