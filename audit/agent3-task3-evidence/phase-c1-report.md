# Task 3 Phase C-1 — Completion Report

**Date:** 2026-05-16
**Agent:** agent3
**Status:** ✅ COMPLETE — PR #3 opened, vulnerability confirmed in production (will close on merge)

---

## Commit SHA

`d9c220ead171a03f9898567c2e4dc88aa5a7c8af`

PR: https://github.com/fer-fer-code/lancerwise/pull/3
Branch: `agent3-task3-email-qa`

---

## 1. `route.ts` diff (Critical 1 removal)

```diff
diff --git a/src/app/api/unsubscribe/route.ts b/src/app/api/unsubscribe/route.ts
index 39ccaad9..2ef60b35 100644
--- a/src/app/api/unsubscribe/route.ts
+++ b/src/app/api/unsubscribe/route.ts
@@ -161,9 +161,13 @@ export async function GET(request: NextRequest) {
 }
 
 export async function POST(request: NextRequest) {
-  const body = await request.json().catch(() => ({})) as { token?: string; audience?: Audience; id?: string; email?: string }
+  // POST accepts only { token }. The direct { audience, id, email } branch
+  // was removed in agent3 task3 Phase C-1 — it lacked auth and let anyone
+  // with email+UUID flip another user's email_unsubscribed flag. All legitimate
+  // callers use buildUnsubscribeUrl() / signUnsubscribeToken() to generate
+  // signed tokens.
+  const body = await request.json().catch(() => ({})) as { token?: string }
 
-  // Token-based flow (same as GET).
   if (body.token) {
     const verified = verifyUnsubscribeToken(body.token)
     if (!verified) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
@@ -173,14 +177,5 @@ export async function POST(request: NextRequest) {
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

Net: -10 lines / +6 lines / 1 file.

---

## 2. D.1 curl outputs — vulnerability CONFIRMED LIVE in production

Ran 3 probes against `https://www.lancerwise.com/api/unsubscribe` from terminal (production runs main branch, pre-PR-merge state):

### Probe 1: Direct-flow attack vector

```bash
$ curl -s -X POST -w "\nHTTP %{http_code}\n" \
    "https://www.lancerwise.com/api/unsubscribe" \
    -H "Content-Type: application/json" \
    -d '{"audience":"user","id":"00000000-0000-0000-0000-000000000000","email":"agent3-test@example.invalid"}'

{"ok":true}
HTTP 200
```

🚨 **The endpoint accepted the attack body without any HMAC, auth, or rate limit.** With a real user UUID this would have actually flipped `profiles.email_unsubscribed=true`.

I used UUID `00000000-...` (zero UUID) so no real user was affected. Verified:

```sql
SELECT id, email, email_unsubscribed FROM profiles
WHERE id='00000000-0000-0000-0000-000000000000';
→ 0 rows
```

But the audit log DID get an entry:

```sql
SELECT * FROM email_unsubscribe_log
WHERE target_id='00000000-0000-0000-0000-000000000000';
→ 1 row: audience=user, source=unsubscribe_link, ...
```

Cleaned up test entry post-probe:
```sql
DELETE FROM email_unsubscribe_log
WHERE target_id='00000000-0000-0000-0000-000000000000'
  AND email='agent3-test@example.invalid';
→ DELETE 1
```

### Probe 2: HMAC token-flow с invalid signature (sanity check)

```bash
$ curl -s -X POST -w "\nHTTP %{http_code}\n" \
    "https://www.lancerwise.com/api/unsubscribe" \
    -H "Content-Type: application/json" \
    -d '{"token":"invalid.signature"}'

{"error":"Invalid token"}
HTTP 400
```

HMAC verification correctly rejected the bogus token (length mismatch caused early reject before timingSafeEqual). ✅

### Probe 3: Empty body

```bash
$ curl -s -X POST -w "\nHTTP %{http_code}\n" \
    "https://www.lancerwise.com/api/unsubscribe" \
    -H "Content-Type: application/json" \
    -d '{}'

{"error":"Missing token or {audience,id,email}"}
HTTP 400
```

Pre-fix error message confirms current production code path. **Post-deploy** will return `{"error":"Missing token"}` (no mention of `audience,id,email` — confirms the branch is gone).

---

## 3. D.4 grep verify — zero matches

```bash
$ grep -nE "body\.audience|body\.id|body\.email" src/app/api/unsubscribe/route.ts
(no output)
$ echo $?
1
```

✅ All three forbidden patterns gone from the file.

`Audience` and `UnsubPayload` imports retained — still used by GET flow handlers (`applyUnsubscribe`, `resolveLegacyToPayload`):

```bash
$ grep -n "Audience\|UnsubPayload" src/app/api/unsubscribe/route.ts
3:import { verifyUnsubscribeToken, type Audience, type UnsubPayload } from '@/lib/unsubscribe'
74:  payload: UnsubPayload,
108:): Promise<UnsubPayload | null> {
117:      return { audience: 'user' as Audience, id: data.id, email: data.email }
128:      return { audience: 'user' as Audience, id: data.id, email: data.email }
```

---

## 4. `.env.example` — placeholder only, no actual address

```bash
$ grep -nE "LANCERWISE_POSTAL_ADDRESS" .env.example
38:#     LANCERWISE_POSTAL_ADDRESS="LancerWise LLC, 1234 Main St, San Francisco, CA 94103, USA"
39:# LANCERWISE_POSTAL_ADDRESS=
```

Both occurrences are **commented out**:
* Line 38 — illustrative example inside a `# Example:` comment block
* Line 39 — the actual env var line, commented `#` так что `.env.example` does not set a value

```bash
$ grep -E "^LANCERWISE_POSTAL_ADDRESS=" .env.example
(no output — exit 1)
```

✅ No real address committed. Comment block instructs operator to set the value via Vercel production env, not in repo.

---

## 5. Backlog file location + first 10 lines

Location: `audit/agent3-task3-evidence/backlog_legacy_unsubscribe_tokens_removal.md`

```
# Backlog: legacy_unsigned unsubscribe token removal

**Status:** scheduled
**Removal date:** 2026-06-15
**Source migration:** D1d (`20260512000001_clients_email_unsubscribed.sql`, applied 2026-05-12)
**Grace period:** 30 days + 3-day buffer

## Why

`/api/unsubscribe` currently accepts two legacy unsigned token formats during a transition window:
```

Full file at the path above (110 lines) — includes pre-removal SQL monitoring query, decision rule (extend grace if `legacy_hits_last_7d > 5`), code locations to delete, и user-impact note.

---

## Phase C-1 summary

| Item | Status |
|---|---|
| Critical 1 (POST direct-flow removal) | ✅ Done |
| .env.example placeholder | ✅ Done (no actual address) |
| Minor 4 backlog file | ✅ Done (scheduled 2026-06-15) |
| D.4 grep verify | ✅ Zero matches |
| D.1 curl probe (pre-deploy) | ✅ Confirmed vulnerability LIVE на production; will close on PR merge |
| PR opened | ✅ #3 |

Total execution time: ~25 min (route.ts edit + .env.example + backlog + verification + cleanup test entry).

---

## What remains в Phase C-2 (blocked)

Per Step B plan:
* `src/lib/emails/shell.ts` — add `addressLine?` + `type?` options; conditional footer render
* `src/lib/email.ts` — pass `type` to shell in 3 universal templates
* `sendEmail()` — hard-fail when env var missing AND type is non-transactional (per reviewer Q2 decision)
* Vercel production env: set actual `LANCERWISE_POSTAL_ADDRESS`

**🚨 BLOCKED on Ramiz providing:**
1. Legal entity name
2. Postal address (US service address если non-US entity)

Estimated Phase C-2 execution: ~30 min once address provided.

---

## Build note

`npm run build` локально will fail on this PR (same as Task 2 PR #2) — `src/app/(app)/dashboard/*` references uncommitted Agent #1 CP-A files (`@/lib/types/ai-next-action`, etc.). Pre-existing condition on origin/main, unrelated to this PR. Vercel preview will hit same failure until Agent #1 commits CP-A files.

My 2 file changes (16-line net touch) verified syntactically clean.
