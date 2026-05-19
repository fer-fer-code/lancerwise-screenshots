# Risk analysis — untracked migrations

## Risk matrix

| # | Risk | Likelihood | Impact | Severity |
|---|------|-----------|--------|----------|
| R1 | Duplicate apply on fresh staging/dev DB | Medium | Low (IF NOT EXISTS guards) | **Low** |
| R2 | Schema drift between envs after rebuild | High when rebuild happens | Medium | **Medium** |
| R3 | Audit trail gap during compliance/incident review | Low | Low | **Low** |
| R4 | `supabase db reset` misfires post-backfill | Low | Medium | **Low-Medium** |
| R5 | New devs run `supabase db push` and break their local env | Medium | Low | **Low** |
| R6 | Future migration with same version prefix collides | Low | High | **Medium** |
| R7 | Backup restore + reapply tracking mismatch | Low | High | **Medium** |

## Risk details

### R1 — Duplicate apply

If a clean staging environment runs `supabase db push`, untracked files in `supabase/migrations/` (just the one `20260426000012b`) would be re-attempted. Inspected the file:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text;
```

Has `IF NOT EXISTS` guard. Safe on duplicate apply.

The 6 `scripts/migrations/` files are NOT auto-applied by `supabase db push` (different directory), so this risk only affects `20260426000012b`.

### R2 — Schema drift after rebuild

If someone rebuilds production-equivalent DB from scratch (e.g. for staging, DR test, or migration to new region):

- `supabase db push` would skip the untracked-suffix file → `profiles.tagline` would be **missing** in the new env
- The 6 ad-hoc DDL scripts wouldn't be picked up at all → 6 missing tables/columns/policies

**This is the highest-impact scenario.** Schema parity matters for staging tests.

### R3 — Audit trail gap

When did `oauth_states` get added? `git log scripts/migrations/2026-05-17-oauth-states-table.sql` answers that. But the tracking table has no row, so reconstructing the timeline via DB-side metadata alone fails. Not blocking for current operations, but adds friction during incident review.

### R4 — `supabase db reset` misfires

`supabase db reset` drops everything + reapplies from tracking. If we backfill tracking rows for ad-hoc DDL without ensuring the corresponding migration logic is also in `supabase/migrations/`, the reset would skip those migrations (no file → no apply). 

This means **just inserting tracking rows is INSUFFICIENT** — the underlying SQL must also live in a migration file the CLI knows to find. Fix plan addresses this.

### R5 — Local-env breakage

New dev clones repo + runs `supabase db push` against their local instance. Same as R2 — local env missing 7 migrations. Diagnosis would be confusing because the files exist in `scripts/migrations/` but the CLI doesn't look there.

### R6 — Version collision

If a future migration uses version `20260426000012c` or similar, the inconsistent suffix style makes ordering ambiguous. PostgreSQL applies migrations in lexical order of version strings, so `20260426000012b` sorts after `20260426000012` (good) but its position vs `20260426000013` is `20260426000012b < 20260426000013` (also good). So suffix-style works lexically but is non-standard.

### R7 — Backup restore mismatch

`pg_restore` from a Vercel-Supabase backup recreates schema + data. The tracking table is just another table — it gets restored as-is. But if you then try to apply *new* migrations on top of a restored DB, the CLI compares its `migrations/` directory to the tracking table:
- Files in `migrations/` not in tracking → CLI tries to apply (potential duplicate-apply if `IF NOT EXISTS` not used)
- Tracking rows with no matching file → CLI may warn or refuse

For LancerWise specifically: the 2 ad-hoc-but-tracked entries (`20260514120000` lemonsqueezy, `20260516000001` ai_usage_log) have tracking rows with **no corresponding file in `supabase/migrations/`**. A `supabase db push` after restore would not find files for those versions → could surface a warning. Verified file content suggests this is benign.

## Composite assessment

**Current overall risk: LOW** for steady-state operations. Production works. Customers unaffected.

**Risk elevates if any of these happens**:
- Staging environment rebuild
- DR / failover test
- New developer onboarding
- Migration to different Supabase region

**Recommendation**: address as post-launch tidy. Not a launch blocker.

## What would make it WORSE

- More ad-hoc DDL via psql without tracking inserts (pattern keeps spreading)
- More suffix-style versioning (`b`, `_v2`, etc.)
- Application of migrations directly via Supabase Studio SQL editor (also doesn't track)

Forward discipline guidance lives in `FIX-PLAN.md`.
