# Tracking gap analysis

## TL;DR

**Tracking is in much better shape than the memory entry suggested.** 547 of 554 distinct migrations are tracked (98.7%). The real gap is **7 unrecorded entries**:

- 6 ad-hoc DDL scripts in `scripts/migrations/` applied via psql with no tracking insert
- 1 weird-named `supabase/migrations/` file with a suffix-style version that `supabase db push` couldn't track

## Per-entry status

### Group A — Tracking entries that ARE in supabase_migrations.schema_migrations: **547 / 554**

These align with files in `supabase/migrations/` plus two from `scripts/migrations/` that had explicit `INSERT INTO supabase_migrations.schema_migrations` blocks.

### Group B — Files applied but NOT tracked: **7 / 554**

| Source | File | DB effect verified |
|--------|------|---------------------|
| supabase/migrations | `20260426000012b_profile_public.sql` | `profiles.tagline` column exists ✓ |
| scripts/migrations | `2026-05-15-user-locale.sql` | `profiles.locale` column + `_idx` + check constraint ✓ |
| scripts/migrations | `2026-05-16-dev-feedback.sql` | `dev_feedback` table exists ✓ |
| scripts/migrations | `2026-05-17-oauth-states-table.sql` | `oauth_states` table exists ✓ |
| scripts/migrations | `2026-05-17-rls-fix-portal-messages-project-surveys.sql` | 3 RLS policies on `portal_messages` + `project_surveys` ✓ |
| scripts/migrations | `2026-05-18-fix-invoices-payment-method-columns.sql` | `invoices.payment_method` + `payment_reference` columns + `invoices_payment_method_idx` ✓ |
| scripts/migrations | `2026-05-18-rls-fix-select-cleanup-6-tables.sql` | RLS policies on 6 tables ✓ (per memory `feedback_unsub_policy_decision_tree.md` context) |

All 7 have measurable, present effects in the database — they ARE applied. They just don't have a tracking row.

## Why this matters (and doesn't)

### Doesn't matter for current operations

- Production is healthy
- All schema changes successfully applied
- No data corruption, no missing columns, no broken RLS
- Backups still capture full schema state

### Matters for future operations

- **`supabase db push` may try to re-apply** any "untracked" file when run against a fresh environment. Re-applying with `IF NOT EXISTS` guards is safe (current files use them) but not guaranteed for future ones.
- **Rollback / time-machine restore**: if you ever do `pg_restore` from a backup, the tracking table represents what should be re-applied vs already-present. Gaps here cause confusion.
- **Onboarding new devs / spinning up staging**: `supabase db reset` reads from tracking + reapplies. Gaps mean the reset env won't match prod.
- **Audit trail**: who applied what when? Untracked migrations leave no record beyond git blame on the .sql file.

## Why the gap exists

Two failure modes converge:

### Failure mode 1 — `supabase db push` breaks on this DB

Per memory `project_lancerwise_migration_tracking_gap.md`: "`supabase db push` ломается". When the CLI fails, the workaround per memory `feedback_adhoc_ddl_pattern.md` is to apply DDL directly via `psql $DATABASE_URL -f scripts/migrations/...`. This **applies the DDL but doesn't update tracking**, because psql doesn't know about Supabase's migration system.

### Failure mode 2 — non-standard version format

The `20260426000012b_profile_public.sql` file has a `b` suffix on the version number. Supabase CLI expects pure `YYYYMMDDHHMMSS` (14 digits). When it encounters the suffix, it either:
- Skips it during `db push` (resulting in untracked + unapplied state on fresh envs), OR
- Errors out, blocking subsequent migrations

The file IS applied to current prod (verified `profiles.tagline` exists), so it was probably applied manually via psql at some point during the original schema buildout.

## Comparison vs memory state

| Memory snapshot | Today |
|----------------|-------|
| "3 versions tracked out of ~470 applied" | **547 tracked out of 554** |
| Memory dated 2026-05-12 | Today 2026-05-19 |

Between memory write date and today, someone (or a process) backfilled the tracking table. The memory snapshot was either taken before this backfill or against a different environment.

**Recommendation**: update memory `project_lancerwise_migration_tracking_gap.md` to reflect current state (98.7% coverage, not 0.6%).
