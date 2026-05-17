# [AGENT 3] Bundle 1 — P1-1 + P1-2 RLS fixes APPLIED

Resolves [`SUMMARY.md`](../SUMMARY.md) findings **P1-1** (portal_messages) +
**P1-2** (project_surveys).

## Status — **APPLIED + VERIFIED in production**

| Item | Status |
| ---- | ------ |
| Pre-check: service-role API routes confirmed safe | ✓ |
| Migration written | ✓ `scripts/migrations/2026-05-17-rls-fix-portal-messages-project-surveys.sql` |
| Applied to production DB via psql | ✓ |
| `pg_policies` post-state verified | ✓ — see [`post-fix-pg-policies.txt`](post-fix-pg-policies.txt) |
| Production anon CRUD exploit blocked | ✓ — SELECT returns `[]`, INSERT returns `42501 RLS violation` |
| PR opened | ✓ — [#29](https://github.com/fer-fer-code/lancerwise/pull/29) |

## Production exploit verification

Tested live against `https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/*`
using the public anon key (same key any attacker can extract from
the client bundle):

### Test 1 — SELECT
```bash
curl -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  "$SUPA_URL/rest/v1/portal_messages?select=*"
```
**Before fix**: would return all rows globally (qual=true SELECT policy).
**After fix**: `HTTP 200 []` — empty array (RLS hides all rows from anon).

### Test 2 — INSERT
```bash
curl -X POST -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  "$SUPA_URL/rest/v1/portal_messages" \
  -d '{"user_id":"00000000-0000-0000-0000-000000000000",
       "client_id":"00000000-0000-0000-0000-000000000000",
       "portal_token":"audit-attack",
       "sender":"client",
       "message":"would-have-succeeded-before-fix"}'
```
**Before fix**: would INSERT successfully (200 with row payload).
**After fix**:
```json
HTTP 401
{"code":"42501","details":null,"hint":null,
 "message":"new row violates row-level security policy for table \"portal_messages\""}
```

Same pattern verified for `project_surveys`. Tables had **0 rows** before
the fix (pre-launch) — no actual data was leaked during the
vulnerability window.

## Files

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + exploit verification |
| [`post-fix-pg-policies.txt`](post-fix-pg-policies.txt) | `pg_policies` snapshot post-fix: 3 rows, all auth-scoped |

## Cross-links

- Migration source: [`scripts/migrations/2026-05-17-rls-fix-portal-messages-project-surveys.sql`](https://github.com/fer-fer-code/lancerwise/blob/main/scripts/migrations/2026-05-17-rls-fix-portal-messages-project-surveys.sql) (post-merge link)
- PR: https://github.com/fer-fer-code/lancerwise/pull/29
- Audit source: [`../SUMMARY.md`](../SUMMARY.md) findings P1-1, P1-2
- Memory: `feedback_adhoc_ddl_pattern.md` (followed pattern: scripts/migrations/YYYY-MM-DD-name.sql + psql -f)

## Next bundle (standby — do not auto-start)

Per user execution discipline: report after Bundle 1 production-verified
before starting **Bundle 2** (P1-3 OAuth state binding for gmail+outlook
callbacks). Awaiting go signal.
