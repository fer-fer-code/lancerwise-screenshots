# Task 1 — Step A Discovery

**Date:** 2026-05-15
**Agent:** agent3 (parallel workstream #3)
**Task:** Supabase migrations tracking gap

## A.1 — Inventory

| Metric | Value |
| --- | --- |
| Total files in `supabase/migrations/` | **546** |
| Files with invalid name (skipped by CLI) | **1** — `20260426000012b_profile_public.sql` |
| Valid migrations (CLI-tracked) | **545** |
| Date range | `20260424000001` → `20260512000001` |

Naming convention: `<14-digit-timestamp>_<snake_case_name>.sql`.

The 1 invalid file uses a `b` suffix on the timestamp — Supabase CLI strictly requires 14-digit numeric timestamps and silently skips this file (warning shown in CLI output, no error). It needs renaming as a separate action.

## A.2 — Current tracking state

`supabase_migrations.schema_migrations` contains only **3 rows** (briefing said 2, actual is 3):

```
    version     |            name             | stmts_len
----------------+-----------------------------+-----------
 20260424000001 | project_tasks               |       498
 20260425000001 | email_unsubscribe_recurring |       949
 20260512000001 |                             |          (NULL/empty)
```

Out of 545 valid local migrations, **542 are untracked**, **3 are tracked**, **1 is skipped** (invalid name).

The 3rd tracked row (`20260512000001`) has empty `name` and `statements` — likely a manual partial insert (e.g. someone tried to repair tracking and only set `version`).

Tracking table schema (`supabase_migrations.schema_migrations`):

```
version    | text   not null  (PRIMARY KEY)
statements | text[]
name       | text
```

## A.3 — Sample verification (10 random untracked)

Selected 10 random untracked migrations and verified the objects they create/alter exist in production:

| # | Migration | Object expected | In prod? |
|---|---|---|---|
| 1 | `20260427000331_tax_payments` | table `tax_payments` | ✅ |
| 2 | `20260428000494_work_journal` | table `work_journal_entries` | ✅ |
| 3 | `20260428000508_pitch_decks` | table `pitch_decks` | ✅ |
| 4 | `20260428000623_invoice_reminders` | table `invoice_reminders` | ✅ |
| 5 | `20260428000630_comm_templates` | table `comm_templates` | ✅ |
| 6 | `20260428000662_auto_reminders` | tables `auto_reminder_settings`, `invoice_reminder_log` | ✅ ✅ |
| 7 | `20260428000666_scope_analyses` | table `scope_analyses` | ✅ |
| 8 | `20260428000671_rate_calculator` | table `rate_calculations` | ✅ |
| 9 | `20260429000764_job_opportunities` | table `job_opportunities` | ✅ |
| 10 | `20260429000790_proposal_pdf` | columns `proposal_drafts.pdf_theme`, `proposal_drafts.public_token` | ✅ ✅ |

**Result: 10/10 sampled migrations are already de-facto applied to production.** No "phantom" migrations found.

This matches the existing memory note `feedback_adhoc_ddl_pattern.md` — migrations were applied historically via `psql $DATABASE_URL -f scripts/migrations/...` and never recorded in the Supabase tracking table.

## A.4 — Supabase config

`supabase/config.toml` block `[db.migrations]`:
```
enabled = true
schema_paths = []
```

No special migration config — defaults apply.

## A.5 — Why only these 3 tracked?

Inspection of the 3 tracked migrations (file paths + content lengths):

```
20260424000001_project_tasks.sql                498 bytes  Apr 24
20260425000001_email_unsubscribe_recurring.sql  945 bytes  Apr 25
20260512000001_clients_email_unsubscribed.sql   2117 bytes May 12
```

Hypothesis: these are the only migrations applied through `supabase db push` from a developer machine (versus `psql -f` ad-hoc). The 3rd entry has empty `name`/`statements` — likely partially inserted manually.

No clear chronological or content pattern — just sporadic CLI usage.

## Conclusion

* **Risk if NOT fixed:** if someone runs `supabase db push` from their machine or CI ever, Supabase will attempt to apply all 542 untracked migrations again. With `CREATE TABLE IF NOT EXISTS` it'll mostly no-op, but ALTER/INSERT/INDEX statements without `IF NOT EXISTS` guards will throw errors or duplicate data.
* **Risk in fixing:** **none** if we backfill only — we mark migrations as "applied" without re-running them, just updating the tracking table.
* **Recommended path:** mark all 542 untracked migrations as applied via `supabase migration repair --status applied <version>` OR direct INSERT into `supabase_migrations.schema_migrations`. Will detail in Step B plan.

## Evidence files in this folder

* `migration-files-full-list.txt` — full 546-file directory listing
* `migration-list-output.txt` — `supabase migration list --linked` output
* `discovery-terminal-output.txt` — file counts + tracking table state
* `sample-verification.txt` — psql query proof for 10 sample migrations
