# Security Campaign — Input Scope

Findings from this RLS preview audit к feed into the post-launch security campaign (or earlier if P0 items justify expediting).

## Immediate pre-launch action items

### P0 — Cannot ship as-is

1. **`invoices` table cross-user leak via anon REST** (see `GAPS-IDENTIFIED.md`)
   - Verified exploitable
   - Drop "Portal access by token" policy + move portal access к server-side service_role fetch
   - Estimated effort: ~1h (drop policy + adjust 1 portal route)

## Pre-launch verifications

Before flipping launch flag:
- [ ] Re-run anon-key SELECT probe против all critical tables (script: `audit/agent1-rls-preview-audit/probe-anon-access.sh` — к be written)
- [ ] Verify `/portal/invoices/[token]` still loads correctly after fix
- [ ] Confirm Sentry can capture failed anon attempts (instrumentation gap noted в #78)

## Post-launch security campaign scope

### Category 1: Policy hygiene cleanup (P2/P3)

- Deduplicate redundant policies (`time_entries` × 2, `contracts` × 3, `availability_blocks` × 2). No risk, just cleanup.
- Document RLS conventions в knowledge vault → new `Patterns/RLS-POLICY-HYGIENE.md`

### Category 2: Public-table intent verification (P3)

Tables с `SELECT TO public USING (true)` или `SELECT TO authenticated USING (true)`:
- `availability_dates`, `availability_slots` — confirm intended public-bookable calendar
- `community_messages`, `community_profiles`, `community_rooms` — confirm community feature exists/intended public
- `portfolio_items`, `rate_card_services`, `rate_card_settings` — confirmed intentional shareable

Action: walk-through с Ramiz, sign each off as intended.

### Category 3: Service-role usage audit

- Identify ALL routes calling `createAdminClient()` (бypasses RLS)
- For each: verify input validation prevents privilege escalation
- Common candidates: `/api/webhooks/*`, `/api/admin/*`, `/api/auth/*`, anything с server-side data mutations

### Category 4: Token-based access patterns

`portal_token`-style access (invoices, possibly other tables) should be standardised:
- All token verifications happen server-side via service_role + explicit `WHERE token = X` check
- Don't rely on RLS policy для token validation (current bug pattern)
- Pattern → `Patterns/SERVER-SIDE-TOKEN-AUTH.md` в vault

### Category 5: Penetration test against anon role

End-to-end exercise: cycle through all 410 public tables, try `SELECT *` as anon. Anything returning rows that's not in the intentional-public list = bug.

Script outline:
```bash
for table in $(psql -c "SELECT relname FROM pg_class WHERE..." -t); do
  count=$(curl ... /rest/v1/$table | jq length)
  if [ "$count" -gt 0 ] && ! grep -q "^$table$" INTENDED-PUBLIC.txt; then
    echo "LEAK: $table → $count rows"
  fi
done
```

### Category 6: Service role key rotation policy

Memory note exists (`project_lancerwise_db_password_rotation.md`) about DB password rotation post-exposure incident. Same hygiene applies к service_role JWT — rotate every 6 months or upon any exposure incident. Document procedure в `Operations/SUPABASE-MIGRATION-TRACKING-FIX.md` adjacent.

---

## Recommendation: prioritize P0 immediately, batch rest into campaign

The `invoices` leak is the only finding that gates launch. **Fix that one before public traffic.**

Everything else is hygiene / verification that doesn't represent active exploit risk. Bundle into "Security Campaign — Post-Launch" с 1-week deliverable timeline.

## Owner suggestion

P0 fix: [AGENT 2] (post-Turnstile, similar perf/security cluster work).
Campaign owner: [AGENT 4] (observability + security adjacent).

## Filing recommendation

File P0 as separate GitHub issue immediately:
```
Title: [P0 LAUNCH BLOCKER] invoices table — anon SELECT leak via "Portal access by token" policy
Labels: P0, security, launch-blocker
Body: link to GAPS-IDENTIFIED.md
```

Filed by [AGENT 1] in same batch as Task A reports (per task spec).

## Related

- RLS-COVERAGE-MATRIX.md — full table inventory
- GAPS-IDENTIFIED.md — detailed findings
- Vault: `Architecture/LANCERWISE-OVERVIEW.md` (Supabase + RLS overview)
- Memory: `project_lancerwise_db_password_rotation.md`
