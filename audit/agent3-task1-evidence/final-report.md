# Task 1 — Final Report: Supabase migrations tracking gap

**Date:** 2026-05-15
**Agent:** agent3
**Status:** ✅ COMPLETE — goal achieved, all verification queries pass

---

## Executive summary

Before fix: `supabase_migrations.schema_migrations` had only 3 rows (one partial), while 546 migration files existed on disk. Future `supabase db push` would have attempted to re-apply 542 migrations.

After fix: 545 valid migrations are now tracked. `supabase db push --dry-run --linked` reports **"Remote database is up to date"** (EXIT 0). The remaining 1 file (`20260426000012b_profile_public.sql`) is intentionally not tracked — see decision below.

---

## State transitions

| Stage | Tracked rows | `db push --dry-run` |
|---|---|---|
| Pre-fix (Step A) | 3 (incl. partial) | exit 1 (542 untracked pending) |
| After C4 repair | 545 | not tested |
| After C5 bad-name INSERT | 546 | **exit 1** ❌ (CLI: "remote ahead of local") |
| After C.6 DELETE bad-name | **545** | **exit 0** ✅ "Remote database is up to date" |

---

## Verification results (Step D — all 5 queries pass)

### Q1: total tracked = 545 ✅
```
 tracked
---------
     545
```

### Q2: `supabase db push --dry-run --linked` ✅
```
DRY RUN: migrations will *not* be pushed to the database.
Connecting to remote database...
Skipping migration 20260426000012b_profile_public.sql... (file name must match pattern "<timestamp>_name.sql")
Remote database is up to date.
EXIT=0
```

### Q3: no UNTRACKED rows in `migration list` ✅
```
UNTRACKED count: 0 (expect 0)
```

### Q4: sample rows have non-null name + statements ✅
```
    version     |            name            | stmt_count
----------------+----------------------------+------------
 20260424000001 | project_tasks              |          3
 20260426000012 | contact_inquiries          |          3
 20260428000662 | auto_reminders             |          8
 20260429000790 | proposal_pdf               |          2
 20260512000001 | clients_email_unsubscribed |          6  ← partial row fully fixed
```

The previously partial row `20260512000001` (NULL name, NULL statements) is now correctly populated — `migration repair` UPSERT semantics handled this in one step.

### Q5: filesystem vs tracking diff ✅
```
63d62
< 20260426000012b
```
Only `20260426000012b` appears on filesystem-only side (line `<`). No tracking-side orphans. Exactly as expected — see decision below.

---

## Decision: bad-name file `20260426000012b_profile_public.sql`

**Decision:** intentionally NOT tracked.

**Reasoning:**
* Supabase CLI's filename validator rejects the `b` suffix → file is **silently skipped** on every CLI command (warning only, not error).
* C5 test confirmed that inserting a tracking row for this version makes `supabase db push --dry-run` exit 1 (CLI's "remote ahead of local" guardrail). Reviewer approved Path A: remove the row.
* File content is a single `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text;` — fully idempotent. Verified column exists in prod:
  ```
   column_name
  -------------
   tagline
  ```
* No risk of re-application: CLI keeps skipping the file. If someone ever renames it to a valid 14-digit timestamp, the `IF NOT EXISTS` guard ensures re-apply is a safe no-op.

**Backlog item flagged:** rename `20260426000012b_profile_public.sql` → `20260426000022_profile_public.sql` (or next free `000020+` slot) as a separate task. After rename, add tracking row via CLI repair. This is a clean-up nicety, not a blocker.

---

## Backup retention

* Location: `/Users/myoffice/lancerwise-backups/migrations-tracking-20260515-232843/`
* Contents:
  * `schema_migrations-backup.sql` (2540 bytes) — `pg_dump 17.9` `--data-only --inserts` of `supabase_migrations` schema
  * `before.csv` (101 bytes) — pre-fix `version,name` snapshot
* **Retention: 30 days minimum** (until 2026-06-14). Do not delete before then.

---

## Execution timeline

| Step | Activity | Duration | Result |
|---|---|---|---|
| C1 | Pre-state capture | <1 min | 3 rows, partial 20260512000001 |
| C2 | `pg_dump` backup (after pg17 client switch) | <1 min | 2540B SQL + 101B CSV |
| C3 | VERSIONS generation + sanity (count=545) | <1 min | 545 ✓ |
| C4 | `supabase migration repair --status applied <545 versions>` | 4 sec | 545 tracked |
| C5 | INSERT bad-name row | <1 min | 546 tracked, **but blocked db push** |
| C.6 | DELETE bad-name row (Path A) | <1 min | 545 tracked, db push clean |
| D | 5 verification queries | ~2 min | All pass ✅ |

**Total elapsed (excluding wait-for-approve cycles): ~10 min.**

---

## Anomalies & gotchas encountered

1. **pg_dump version mismatch.** macOS default `pg_dump` is 16.x; Supabase server runs Postgres 17.6. Workaround: use `/opt/homebrew/opt/postgresql@17/bin/pg_dump`. (Worth caching in agent_learnings or feedback memory.)
2. **zsh word-splitting.** Bash tool runs zsh; `$VAR` does NOT word-split unquoted as in bash. Need `${=VAR}` to pass list-style args to CLI tools. First repair attempt failed because of this. Documented in agent_learnings worthy.
3. **CLI "remote ahead of local" guardrail blocks `db push`** when a tracking row exists for a CLI-skipped filename. Path A (don't track CLI-skipped files) is the operationally correct stance.
4. **Briefing count off.** Briefing said "2 of ~470 migrations tracked". Actual: 3 of 546 (one partial). Numbers updated in discovery.md.

---

## Recommendations for future work

1. **Add CI guard:** if `supabase migration list --linked` shows any UNTRACKED rows, fail CI. Catches future drift early.
2. **Adopt CLI for new migrations.** The `feedback_adhoc_ddl_pattern.md` memo says "use psql + scripts/migrations/, not HTTP endpoints". That's fine, but every such psql ad-hoc DDL should be followed by `supabase migration repair --status applied <version>` to keep tracking sync. Worth adding to `feedback_adhoc_ddl_pattern.md`.
3. **Document zsh word-splitting workaround** in a feedback memo: `${=VAR}` required for any multi-arg CLI call from agent Bash tool.
4. **Rename the 1 bad-name file** in a separate cleanup task (rename + CLI repair). Low priority.

---

## Final state checks

```
$ psql -c "SELECT count(*) FROM supabase_migrations.schema_migrations;"
 count
-------
   545

$ supabase db push --dry-run --linked
DRY RUN: migrations will *not* be pushed to the database.
Connecting to remote database...
Skipping migration 20260426000012b_profile_public.sql... (file name must match pattern "<timestamp>_name.sql")
Remote database is up to date.

$ echo $?
0
```

**Goal: ACHIEVED.**

Ready for Task 2 (Dead URLs cleanup) on reviewer command.
