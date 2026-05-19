# Fix plan — post-launch migration tracking remediation

**Trigger**: post-launch, after first paying customer onboarded and 1 week of stable production traffic. Not a launch blocker.

## Goal

Bring `supabase_migrations.schema_migrations` and `supabase/migrations/` directory back into perfect sync, AND prevent the gap from reopening.

## Phase 1 — Backfill (15 min)

For each of the 7 untracked entries:

### 1.1 Copy ad-hoc DDL files into the canonical Supabase migrations dir

```bash
cd /Users/myoffice/lancerwise

# 6 files from scripts/migrations/ that are applied but untracked
# Use the date prefix as version (drop the - separators)
cp scripts/migrations/2026-05-15-user-locale.sql \
   supabase/migrations/20260515000001_user_locale.sql

cp scripts/migrations/2026-05-16-dev-feedback.sql \
   supabase/migrations/20260516000002_dev_feedback.sql

cp scripts/migrations/2026-05-17-oauth-states-table.sql \
   supabase/migrations/20260517000001_oauth_states_table.sql

cp scripts/migrations/2026-05-17-rls-fix-portal-messages-project-surveys.sql \
   supabase/migrations/20260517000002_rls_fix_portal_messages_project_surveys.sql

cp scripts/migrations/2026-05-18-fix-invoices-payment-method-columns.sql \
   supabase/migrations/20260518000001_fix_invoices_payment_method_columns.sql

cp scripts/migrations/2026-05-18-rls-fix-select-cleanup-6-tables.sql \
   supabase/migrations/20260518000002_rls_fix_select_cleanup_6_tables.sql
```

Note version numbering: pick microsecond-level increments to avoid collision with the existing `20260516000001` (`ai_usage_log`) which uses suffix `000001`.

**Important**: ensure each migration file has `IF NOT EXISTS` / `OR REPLACE` guards on every CREATE / ALTER. The current files already do — verified during this audit.

### 1.2 Insert missing tracking rows for the 7 entries

```sql
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES
  ('20260426000012b', 'profile_public',                          '{}'),
  ('20260515000001',  'user_locale',                             '{}'),
  ('20260516000002',  'dev_feedback',                            '{}'),
  ('20260517000001',  'oauth_states_table',                      '{}'),
  ('20260517000002',  'rls_fix_portal_messages_project_surveys', '{}'),
  ('20260518000001',  'fix_invoices_payment_method_columns',     '{}'),
  ('20260518000002',  'rls_fix_select_cleanup_6_tables',         '{}')
ON CONFLICT (version) DO NOTHING;
```

The `statements` column is `text[]` — can be left empty `{}` since the SQL is in the file. Per the LemonSqueezy migration tracking row I added earlier (commit `ac6599f1`), this format works.

### 1.3 Optional: dual-source migrations have a small drift to resolve

For the 2 tracking entries that came FROM `scripts/migrations/` (`lemonsqueezy_subscriptions` v=`20260514120000` and `ai_usage_log` v=`20260516000001`):

- Tracking row exists with that version
- File doesn't exist in `supabase/migrations/` with that exact version
- Effect: `supabase db push` won't try to re-apply (good), but `db reset` won't find a file to apply against (bad)

**Fix**: also copy these into `supabase/migrations/` with matching version:

```bash
cp scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql \
   supabase/migrations/20260514120000_lemonsqueezy_subscriptions.sql

cp scripts/migrations/2026-05-16-ai-usage-log.sql \
   supabase/migrations/20260516000001_ai_usage_log.sql
```

(The version in the filename must match the tracking row exactly.)

After Phase 1.3, `supabase db reset` against a fresh DB would reproduce production schema exactly.

## Phase 2 — Forward discipline (5 min — codified)

Add a single source of truth document at `supabase/migrations/README.md` (or `docs/MIGRATIONS.md`):

```markdown
# Database migrations

ALL schema changes go through `supabase/migrations/`. Two paths:

## Path A — Normal (CLI works)

1. `supabase migration new <name>` → creates skeleton file
2. Edit, test locally with `supabase db push --local`
3. `supabase db push` to apply to remote
4. Tracking row auto-inserted

## Path B — CLI broken (use ONLY if Path A fails)

1. Manually create the file in `supabase/migrations/` with `YYYYMMDDHHMMSS_name.sql` format
2. Apply via `psql $DATABASE_URL -f supabase/migrations/<file>`
3. **MANUALLY insert tracking row**:
   ```sql
   INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
   VALUES ('YYYYMMDDHHMMSS', 'name', '{}')
   ON CONFLICT DO NOTHING;
   ```

## ❌ NEVER

- Apply DDL via Supabase Studio SQL editor (no tracking)
- Use suffix-style versions (`20260426000012b`)
- Place migration SQL in `scripts/migrations/` going forward (the existing 8 files are historical)
- Skip the tracking insert when using Path B
```

## Phase 3 — Retire `scripts/migrations/` (10 min)

After Phase 1 copies the 8 files into `supabase/migrations/`:

```bash
# Verify all 8 are now in supabase/migrations/
ls supabase/migrations/ | grep -cE '(user_locale|dev_feedback|oauth_states|rls_fix_portal|fix_invoices_payment|rls_fix_select_cleanup|lemonsqueezy_subscriptions|ai_usage_log)'
# expect: 8

# Then remove scripts/migrations/ entirely
git rm -r scripts/migrations/
git commit -m "chore(migrations): consolidate to supabase/migrations/ single source"
```

Update memory `feedback_adhoc_ddl_pattern.md` to point at the new Path B in the README.

## Phase 4 — Validation (5 min)

```bash
# Verify counts match
psql $DATABASE_URL -c "SELECT count(*) FROM supabase_migrations.schema_migrations;"
# expect: 554

ls supabase/migrations/*.sql | wc -l
# expect: 554

# Drift detection
comm -23 <(ls supabase/migrations/ | sed 's|_.*||' | sort) \
         <(psql $DATABASE_URL -tA -c "SELECT version FROM supabase_migrations.schema_migrations" | sort)
# expect: empty output
```

## Phase 5 — CI gate (10 min)

Add a GitHub Actions workflow that fails the PR if:
- A new file in `supabase/migrations/` has version not matching `^[0-9]{14}$`
- A new file in `supabase/migrations/` was added without a matching name-keyword in the PR description

Optional but valuable. See `.github/workflows/migration-lint.yml` template:

```yaml
name: migration-lint
on:
  pull_request:
    paths: ['supabase/migrations/**']
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: |
          for f in $(git diff --name-only origin/main...HEAD -- 'supabase/migrations/*.sql'); do
            base=$(basename "$f" .sql)
            version="${base%%_*}"
            if ! [[ "$version" =~ ^[0-9]{14}$ ]]; then
              echo "::error file=$f::Migration version '$version' must be 14 digits (YYYYMMDDHHMMSS)"
              exit 1
            fi
          done
```

## Estimated total effort

| Phase | Time | Risk |
|-------|------|------|
| 1 (Backfill) | 15 min | Low — only adds tracking rows |
| 2 (Discipline doc) | 5 min | None |
| 3 (Retire scripts/migrations/) | 10 min | Low if Phase 1 done correctly |
| 4 (Validation) | 5 min | None |
| 5 (CI gate, optional) | 10 min | None |
| **Total** | **45 min** | Low |

## When to execute

Recommend: **2 weeks post-launch, during a normal infrastructure tidy sprint**. Wait for the first month of customer activity to settle before touching tracking infrastructure.

Until then: keep using the ad-hoc Path B for urgent changes. Just **remember to do the manual tracking insert** going forward (per the example in Phase 2).
