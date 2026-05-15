# Task 1 — Step B Plan: Bring migration tracking up to date

**Date:** 2026-05-15
**Agent:** agent3
**Status:** Awaiting reviewer approval

---

## 1. Discovery recap

* 545 valid migrations on disk, 542 untracked, 3 partially tracked (one with empty `name`/`statements`).
* 1 file `20260426000012b_profile_public.sql` has invalid name → CLI skips it. Per reviewer decision: leave file as-is, INSERT tracking entry directly via SQL.
* 10/10 sampled untracked migrations are de-facto applied in production. Zero "phantom" migrations.
* Goal: backfill tracking table so `supabase db push` reports "0 pending" and stops attempting re-runs.

---

## 2. Approach selection

### Option A — Direct bulk INSERT into `supabase_migrations.schema_migrations`

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES ('20260424000001', 'project_tasks', '{...}'), ...
ON CONFLICT (version) DO UPDATE
  SET name = EXCLUDED.name, statements = EXCLUDED.statements;
```

* Pros: atomic single TX, fastest, full control of all 3 columns, handles partial-row UPDATE и invalid-name file in same operation.
* Cons: bypasses Supabase tooling; we'd have to parse 545 files ourselves to extract `statements` array (CLI does this for us); risk of misformatting `statements` (must be Postgres `text[]`).

### Option B — `npx supabase migration repair --status applied <v1> <v2> ...`

* Pros: native Supabase command, official Supabase-supported path; CLI handles `name` extraction (from filename) и `statements` parsing (from file content); operation is UPSERT internally — safe to re-run on the 3 already-tracked rows и will correctly fill the partial `20260512000001` row.
* Cons: cannot handle invalid-name file `20260426000012b_profile_public.sql` (CLI skips it before reaching repair logic); behavior with 545 args at once unverified — may internally loop one-by-one and be slow over remote pooler.
* Argv feasibility: 545 versions × ~15 chars = **8175 chars** total, well under OS argv limits (~256KB).

### Option C — Reset migration history

Not viable. Would require `db reset` semantics on production. Excluded.

### Recommendation: **Option B (with Option A для the 1 skipped file)**

**Hybrid:**

1. Run `supabase migration repair --status applied <all 545 valid versions>` — uses native CLI, populates `name` и `statements` from filenames + file content automatically. UPSERT semantics correctly fix partial row `20260512000001`.
2. Run direct SQL INSERT for `20260426000012b_profile_public.sql` (since CLI cannot reach this file).

**Rationale:**

* Native CLI tooling is the maintainable path — future devs running `supabase migration repair` won't be surprised by manually-crafted rows.
* CLI auto-extracts `name` and `statements` correctly — reduces risk of malformed `text[]` literal.
* The 1 SQL INSERT for the invalid-name file is a one-off, justified by reviewer decision to keep file untouched.

---

## 3. Step-by-step implementation

### 3.1 Pre-flight backup

```bash
# Backup the tracking table specifically (small, fast, sufficient for rollback)
DATABASE_URL=$(grep '^DATABASE_URL=' .env.local | cut -d= -f2- | tr -d '"')
BACKUP_DIR=~/lancerwise-backups/migrations-tracking-$(date +%Y%m%d-%H%M%S)
mkdir -p "$BACKUP_DIR"

pg_dump "$DATABASE_URL" \
  --schema=supabase_migrations \
  --data-only \
  --inserts \
  -f "$BACKUP_DIR/schema_migrations-backup.sql"

# Also snapshot current state as CSV для quick diff
psql "$DATABASE_URL" -c "\\COPY (SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version) TO '$BACKUP_DIR/before.csv' CSV HEADER"

echo "Backup written to: $BACKUP_DIR"
ls -la "$BACKUP_DIR"
```

Screenshot terminal output → evidence/backup-screenshot.png
Save path → evidence/backup-location.txt

### 3.2 Main operation: repair 545 valid migrations

```bash
# Generate list of all 545 valid versions (excludes the 1 invalid-name file)
VERSIONS=$(ls supabase/migrations/ | grep "^[0-9]\{14\}_" | awk -F'_' '{print $1}' | tr '\n' ' ')

# Sanity check
echo "$VERSIONS" | tr ' ' '\n' | wc -l   # → expect 545

# Run repair
npx supabase migration repair --status applied $VERSIONS 2>&1 | tee migration-repair-output.txt
```

**Pre-execution sanity:** confirm count = 545 before invoking. If wc shows anything other than 545, STOP.

Screenshot terminal output (head + tail) → evidence/impl-repair-*.png
Full output → evidence/migration-repair-output.txt

### 3.3 Handle the 1 invalid-name file (`20260426000012b_profile_public.sql`)

Per reviewer side-decision 2: leave the file as-is, INSERT row directly.

The `b` suffix on the timestamp will violate the CLI's regex on future CLI use, but it WILL satisfy `text PRIMARY KEY` constraint on the tracking table (no numeric requirement at DB level). This means CLI will keep skipping the file (warning), but the tracking row prevents any phantom re-apply attempt.

```bash
# Read statements from the file (single-element text[] containing the whole file)
FILE_CONTENT=$(cat supabase/migrations/20260426000012b_profile_public.sql | psql "$DATABASE_URL" -t -A -c "SELECT quote_literal(\$\$$(cat supabase/migrations/20260426000012b_profile_public.sql)\$\$);" )

# Simpler approach: use \copy with prepared payload
psql "$DATABASE_URL" <<'EOF'
INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
VALUES (
  '20260426000012b',
  'profile_public',
  ARRAY[ pg_read_file('20260426000012b_profile_public.sql') ]::text[]
)
ON CONFLICT (version) DO NOTHING;
EOF
```

**Caveat:** `pg_read_file` requires file to be in Supabase server's data dir — not available remotely. Fallback: read file locally and pass as parameter:

```bash
psql "$DATABASE_URL" -v 'content=cat:supabase/migrations/20260426000012b_profile_public.sql' \
  -c "INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20260426000012b', 'profile_public', ARRAY[ :'content' ]::text[])
      ON CONFLICT (version) DO NOTHING;"
```

Actually cleanest path: heredoc with literal content embedded by shell:

```bash
CONTENT=$(cat supabase/migrations/20260426000012b_profile_public.sql)
psql "$DATABASE_URL" -v "content=$CONTENT" -c "
  INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
  VALUES ('20260426000012b', 'profile_public', ARRAY[:'content']::text[])
  ON CONFLICT (version) DO NOTHING;"
```

Screenshot → evidence/impl-invalid-name-insert.png

### 3.4 Skip — 3rd partial row handled automatically

The CLI repair in 3.2 includes `20260512000001` in the list, and its UPSERT semantics will fill `name` ← `clients_email_unsubscribed` and `statements` ← parsed from file. No separate action needed.

We'll verify in Step D that the row's `name` is non-null after repair.

---

## 4. Rollback plan

If anything goes wrong:

```bash
# Wipe tracking table и restore from backup
psql "$DATABASE_URL" <<EOF
TRUNCATE supabase_migrations.schema_migrations;
\\i ~/lancerwise-backups/migrations-tracking-<timestamp>/schema_migrations-backup.sql
EOF

# Confirm row count matches pre-fix (3)
psql "$DATABASE_URL" -c "SELECT count(*) FROM supabase_migrations.schema_migrations;"
```

Rollback is fast (<10 sec) because tracking table is tiny.

**No application code touched в эта операция.** No risk of leaving the app in broken state — only the tracking table changes. Application reads/writes to `public.*` tables, не к `supabase_migrations.*`.

---

## 5. Verification queries (Step D)

```bash
# 1. Total tracked = 546 (545 valid + 1 invalid-name)
psql "$DATABASE_URL" -c "SELECT count(*) AS tracked FROM supabase_migrations.schema_migrations;"
# Expected: 546

# 2. supabase db push --dry-run shows 0 pending
npx supabase db push --dry-run --linked
# Expected: "No pending migrations" or equivalent

# 3. supabase migration list --linked: every Local has a Remote
npx supabase migration list --linked | awk -F'|' 'NR>5 {gsub(/[ ]/,"",$1); gsub(/[ ]/,"",$2); if ($1 ~ /^[0-9]{14}$/ && $2 == "") print "UNTRACKED:", $1}' | wc -l
# Expected: 0

# 4. Sample 5 rows и confirm names populated
psql "$DATABASE_URL" -c "
  SELECT version, name, array_length(statements,1) AS stmt_count
  FROM supabase_migrations.schema_migrations
  WHERE version IN ('20260424000001','20260428000662','20260429000790','20260512000001','20260426000012b')
  ORDER BY version;"
# Expected: every row has non-null name + stmt_count >= 1

# 5. Cross-check files vs tracking
diff \
  <(ls supabase/migrations/ | grep "^[0-9]\{14\}" | awk -F'_' '{print $1}' | sort) \
  <(psql "$DATABASE_URL" -t -A -c "SELECT version FROM supabase_migrations.schema_migrations ORDER BY version" | sort)
# Expected: empty diff
```

---

## 6. Risk register

| # | Risk | Likelihood | Severity | Mitigation |
|---|---|---|---|---|
| 1 | `supabase migration repair` rate-limited or refuses 545-arg call | Med | Low | Fallback: batch in chunks of 100 via `xargs -n 100` |
| 2 | CLI parses `statements` differently from how migration was originally executed (causes diff in `schema_migrations.statements` vs reality) | Low | Very Low | `statements` column is informational only; не replayed automatically; backup exists |
| 3 | Network failure mid-repair leaves tracking partially populated | Med | Low | Operation is idempotent (UPSERT); just re-run |
| 4 | Future dev runs `supabase db push` от machine with stale schema | Low | Med | Out of scope; will be 0 pending after fix |
| 5 | `20260426000012b` file produces invalid `text[]` payload due to dollar-quoting clash | Low | Low | Test parameter passing on staging; fallback to escaped `$$...$$` literal |
| 6 | CLI repair takes too long (~30+ min) due to per-version remote roundtrip | Med | Very Low | Operation can be safely interrupted и resumed (UPSERT); no partial-state issue |

---

## 7. Estimated time per phase

| Phase | Activity | Time |
|---|---|---|
| 3.1 | Backup tracking table | 2 min |
| 3.2 | `migration repair` 545 versions | 5-15 min (depends on CLI batching internally) |
| 3.3 | Direct SQL для invalid-name file | 1 min |
| Step D | Verification | 5-10 min |
| **Total** | **Step C + D execution** | **~30 min** |

---

## Open questions для reviewer

* **Q1:** OK proceeding with hybrid (CLI repair for 545 + direct SQL for 1)? Or prefer pure Option A (single SQL TX, faster, no CLI dependency)?
* **Q2:** OK to run on production directly без staging dry-run? (No staging ENV configured per discovery; rollback is fast.)
* **Q3:** Backup location `~/lancerwise-backups/migrations-tracking-<timestamp>/` — confirm path acceptable, or specify alternative?

If no objections, proceed with hybrid approach as written.
