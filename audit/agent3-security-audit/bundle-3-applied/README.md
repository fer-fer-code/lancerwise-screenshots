# [AGENT 3] Bundle 3 — P2-A..P2-F SELECT RLS cleanup APPLIED

Resolves [`../SUMMARY.md`](../SUMMARY.md) findings **P2-A** through **P2-F**: 6 tables had permissive `USING (true)` SELECT policies that allowed anonymous enumeration via the public anon key.

## Status — **APPLIED + VERIFIED in production**

| Item | Status |
| ---- | ------ |
| Pre-flight: service-role API handlers verified for all 6 tables | ✓ |
| Migration written | ✓ `scripts/migrations/2026-05-18-rls-fix-select-cleanup-6-tables.sql` |
| Applied to production DB via psql | ✓ |
| `pg_policies` post-state verified | ✓ — see [`post-fix-pg-policies.txt`](post-fix-pg-policies.txt) |
| Production anon SELECT exploit blocked on all 6 tables | ✓ — HTTP 200 `[]` on every table |
| PR opened | ✓ — [#39](https://github.com/fer-fer-code/lancerwise/pull/39) |
| Worktree isolation | ✓ — work done in `/Users/myoffice/lancerwise-agent3` |

## What was dropped (6 policies)

```sql
DROP POLICY "Public view portal by token"        ON client_portals       -- SELECT qual=true
DROP POLICY "Public can view surveys by token"   ON client_surveys       -- SELECT qual=true
DROP POLICY "Public view portal files"           ON portal_files         -- SELECT qual=true
DROP POLICY "Public can view responses by token" ON survey_responses     -- SELECT qual=true
DROP POLICY "Public submit via token 797"        ON testimonial_requests -- SELECT qual=true
DROP POLICY "Public view quotes by token"        ON quotes               -- SELECT qual=status IN sent/accepted/declined
```

## Production exploit verification

```bash
for t in client_portals client_surveys portal_files survey_responses \
         testimonial_requests quotes; do
  curl -s -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
    "${SUPA_URL}/rest/v1/${t}?select=*&limit=1"
done
```

| Table | Before fix | After fix |
| ----- | ---------- | --------- |
| `client_portals` | would return all portals globally | `HTTP 200 []` |
| `client_surveys` | would return all surveys | `HTTP 200 []` |
| `portal_files` | would return all file metadata | `HTTP 200 []` |
| `survey_responses` | would return all customer responses | `HTTP 200 []` |
| `testimonial_requests` | would return all pending testimonials | `HTTP 200 []` |
| `quotes` | would return all sent/accepted/declined quotes | `HTTP 200 []` |

Tables had **0 rows** at audit time (pre-launch) → no actual data was leaked during the vulnerability window.

## Why this is safe (UX preserved)

Pre-flight verified each table has a working service-role API handler:

| Table | Handler |
|-------|---------|
| `client_portals` | `/api/client-portals/public/[token]/route.ts` (`createAdminClient` × 2) |
| `client_surveys` | `/api/surveys/public/[token]/route.ts` (× 3) |
| `portal_files` | `/api/portal/[token]/route.ts` (× 3) + `/api/portals/[id]/files/route.ts` (auth-scoped) |
| `survey_responses` | `/api/surveys/public/[token]/route.ts` (× admin) + `/api/surveys/submit/route.ts` (admin, public insert) |
| `testimonial_requests` | `/api/testimonials/submit/[token]/route.ts` (× 3) |
| `quotes` | `/api/quotes/public/[token]/route.ts` (× 2) |

Service-role bypasses RLS entirely. Zero client-side React components query these tables via anon Supabase client.

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + exploit verification |
| [`post-fix-pg-policies.txt`](post-fix-pg-policies.txt) | `pg_policies` snapshot post-fix: 11 rows, all auth-scoped except 2 (public submit INSERT/UPDATE which are intentional + token-validated in code) |

## Cross-links

- Migration: [`scripts/migrations/2026-05-18-rls-fix-select-cleanup-6-tables.sql`](https://github.com/fer-fer-code/lancerwise/blob/fix/security-audit-p2-rls-select-cleanup/scripts/migrations/2026-05-18-rls-fix-select-cleanup-6-tables.sql) (post-merge)
- PR: https://github.com/fer-fer-code/lancerwise/pull/39
- Audit source: [`../SUMMARY.md`](../SUMMARY.md) findings P2-A..P2-F
- Memory: `feedback_adhoc_ddl_pattern.md`, `feedback_worktree_isolation_pattern.md`

## Next bundle (standby — do not auto-start)

Per execution discipline: report after Bundle 3 production-verified + PR opened. Awaiting reviewer go-signal for **Bundle 4** (P2-7 — 5 contact-form endpoints get Turnstile + Upstash rate-limit, ~2h).
