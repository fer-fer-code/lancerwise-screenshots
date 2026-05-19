# Migration inventory

**Date**: 2026-05-19
**Production DB**: Supabase project `skfgwyzarrhhkzvltbgm`

## Two migration locations

LancerWise uses two parallel migration paths, both with valid use cases:

### 1. `supabase/migrations/` — 546 `.sql` files

Versioned via the Supabase CLI pattern `YYYYMMDDHHMMSS_name.sql`. Run by `supabase db push` against migrations.

- File count: **546**
- Earliest: `20260424000001_project_tasks.sql`
- Latest: `20260512000001_clients_email_unsubscribed.sql`
- One non-standard file: `20260426000012b_profile_public.sql` (suffix `b` for follow-up)

### 2. `scripts/migrations/` — 8 `.sql` files (ad-hoc DDL pattern)

Per memory `feedback_adhoc_ddl_pattern.md`: when `supabase db push` breaks (most often per memory `project_lancerwise_migration_tracking_gap.md`), DDL gets applied directly via `psql $DATABASE_URL -f scripts/migrations/YYYY-MM-DD-name.sql`.

| File | Applied to prod? | Tracked in `supabase_migrations.schema_migrations`? |
|------|------------------|---------------------------------------------------|
| `2026-05-14-lemonsqueezy-subscriptions.sql` | ✅ yes (verified table exists) | ✅ tracked as `20260514120000` |
| `2026-05-15-user-locale.sql` | ✅ yes (column exists) | ❌ NOT tracked |
| `2026-05-16-ai-usage-log.sql` | ✅ yes (table exists) | ✅ tracked as `20260516000001` |
| `2026-05-16-dev-feedback.sql` | ✅ yes (table exists) | ❌ NOT tracked |
| `2026-05-17-oauth-states-table.sql` | ✅ yes (table exists) | ❌ NOT tracked |
| `2026-05-17-rls-fix-portal-messages-project-surveys.sql` | ✅ yes (3 RLS policies exist) | ❌ NOT tracked |
| `2026-05-18-fix-invoices-payment-method-columns.sql` | ✅ yes (columns + index exist) | ❌ NOT tracked |
| `2026-05-18-rls-fix-select-cleanup-6-tables.sql` | ✅ yes (policies present on 6 tables) | ❌ NOT tracked |

**Verified**: 8 of 8 ad-hoc files are applied to production. Only 2 of 8 are tracked in `supabase_migrations.schema_migrations`.

## Memory entry was outdated

`project_lancerwise_migration_tracking_gap.md` says "schema_migrations имеет только 3 версии из ~470 применённых". Actual today:

| Source | Count |
|--------|-------|
| `supabase/migrations/*.sql` on disk | 546 |
| `supabase_migrations.schema_migrations` rows | **547** |
| `scripts/migrations/*.sql` on disk | 8 |

The "3 versions" claim was a stale snapshot. Today's tracking is **nearly complete** for the Supabase-CLI path. The real gap is on the ad-hoc `scripts/migrations/` path, which has its own untracked-but-applied entries.

## File-vs-tracked delta (3 entries total)

### Tracked but no file in `supabase/migrations/` (2)

| Version | Name | Reason |
|---------|------|--------|
| `20260514120000` | `lemonsqueezy_subscriptions` | Ad-hoc DDL — file lives at `scripts/migrations/2026-05-14-lemonsqueezy-subscriptions.sql` |
| `20260516000001` | `ai_usage_log` | Ad-hoc DDL — file lives at `scripts/migrations/2026-05-16-ai-usage-log.sql` |

### File but not tracked (1)

| File | Status | Notes |
|------|--------|-------|
| `supabase/migrations/20260426000012b_profile_public.sql` | Applied (`profiles.tagline` column exists) | The `b` suffix likely confused `supabase db push` so it didn't track. Fix: PATCH tracking row in. |

## Volume by date (last 30 days)

| Day | Migrations applied |
|-----|---------------------|
| 2026-04-24 | 1 |
| 2026-04-25 | 49 |
| 2026-04-26 | **99** |
| 2026-04-27 | **125** |
| 2026-04-28 | **141** ← peak |
| 2026-04-29 | 109 |
| 2026-05-05 | 3 |
| 2026-05-06 | 5 |
| 2026-05-07 | 5 |
| 2026-05-08 | 2 |
| 2026-05-09 | 1 |
| 2026-05-10 | 4 |
| 2026-05-12 | 1 |
| 2026-05-14 | 1 |
| 2026-05-16 | 1 |

Bursts on Apr 26-29 (523 of 547 rows) reflect the original schema buildout. Recent activity (May 5+) is incremental — 1-5 migrations per day. Healthy pace.
