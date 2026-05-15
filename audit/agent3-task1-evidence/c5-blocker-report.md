# Task 1 — Step C BLOCKER (C5 invalid-name file)

**Date:** 2026-05-15
**Status:** STOPPED, awaiting reviewer guidance

## Current state

* C1–C4 completed successfully:
  * Pre-state captured (3 rows, partial 20260512000001)
  * Backup written to `/Users/myoffice/lancerwise-backups/migrations-tracking-20260515-232843/`
  * VERSIONS list = 545 (sanity passed)
  * `supabase migration repair --status applied <545 versions>` → EXIT 0, 4 sec
  * Tracking table count = 545 ✅
* C5 executed per reviewer simplified INSERT:
  ```sql
  INSERT INTO supabase_migrations.schema_migrations (version, name)
  VALUES ('20260426000012b', 'profile_public')
  ON CONFLICT (version) DO NOTHING;
  ```
  * Output: `INSERT 0 1` ✅
  * Tracking table count = **546** ✅

## Unexpected discovery: row breaks `supabase db push`

Running verification:

```
$ supabase db push --dry-run --linked
DRY RUN: migrations will *not* be pushed to the database.
Connecting to remote database...
Skipping migration 20260426000012b_profile_public.sql... (file name must match pattern "<timestamp>_name.sql")
Remote migration versions not found in local migrations directory.

Make sure your local git repo is up-to-date. If the error persists, try repairing the migration history table:
supabase migration repair --status reverted 20260426000012b
...
EXIT=1
```

**The CLI exits with code 1.** The tracking row makes `db push` fail because:

* The bad-name file is **skipped** by CLI (filename validation regex) → CLI thinks the file does not exist locally
* The tracking table has a row for `20260426000012b` → CLI sees this as "remote ahead of local" condition
* CLI's behavior: refuse to push, recommend either `migration repair --status reverted` or `db pull`

`supabase migration list --linked` still works (just prints a SKIP warning at top), but `db push` is **completely blocked**.

## Goal mismatch

The original goal was: prevent `supabase db push` from re-applying old migrations. After the fix:

* Without the bad-name row: `db push` would show "0 pending" — goal met.
* With the bad-name row: `db push` exits 1 — actually **worse** than before.

The reviewer's decision to INSERT the row was based on the assumption that the row would silently sit in the tracking table without affecting CLI operations. In practice it actively blocks deployments.

## File content review

```
$ cat supabase/migrations/20260426000012b_profile_public.sql
-- Add dedicated tagline column for public profile (short 1-2 sentence bio/tagline)
-- Note: public_profile_enabled already exists from migration 20260425000048
-- Note: public_rates_tagline already exists from migration 20260425000020 (rates page tagline)
-- This adds a separate shorter tagline shown in the public profile hero
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text;
```

Single `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statement. **Idempotent and safe to re-apply** — `IF NOT EXISTS` guard means even if CLI ever does process this file, it'll no-op against a column that already exists.

Verified column exists in prod:
```
$ psql -c "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='tagline'"
 column_name
-------------
 tagline
```

## Recommended path

**Path A — DELETE the bad-name row, leave file as-is.**

```sql
DELETE FROM supabase_migrations.schema_migrations WHERE version='20260426000012b';
```

* Resulting state: 545 tracked rows, CLI skips the bad-name file silently with warning, `db push` works clean (0 pending).
* Risk: minimal. The file is already de-facto applied and has `IF NOT EXISTS` guard — even if filename is fixed later, re-apply is a no-op.
* This is the **simplest** path и fully achieves the original goal.

**Path B — Rename file 20260426000012b → 20260426000022 (next free), keep tracking row updated.**

```bash
git mv supabase/migrations/20260426000012b_profile_public.sql \
       supabase/migrations/20260426000022_profile_public.sql
psql -c "UPDATE supabase_migrations.schema_migrations
         SET version='20260426000022'
         WHERE version='20260426000012b';"
```

* Resulting state: 546 tracked, CLI happy, file properly named.
* Risk: changes git history of an applied migration. Per reviewer's earlier statement "НЕ rename — это меняет history" — this was already rejected.

**Path C — Other (please specify).**

## Action requested

Reviewer please pick A or B (or C). All other Step C work is solid; just the bad-name row decision needs revisiting.

If Path A: I'll run the DELETE, re-run verification (expect all 5 queries pass), then write final report.
If Path B: I'll need a separate approve to rename the migration file (touches actual code, not just DB).

## Rollback availability

If reviewer wants total rollback: backup at `/Users/myoffice/lancerwise-backups/migrations-tracking-20260515-232843/schema_migrations-backup.sql` (2540 bytes), TRUNCATE + restore takes <10 sec.
