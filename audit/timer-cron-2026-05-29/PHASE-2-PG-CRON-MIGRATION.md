# Phase 2 — pg_cron migration prep (ready if stagger fails 24h re-check)

**Status:** READY (not executed). Trigger to execute = re-check at 2026-05-30 ~17:30 UTC shows scheduled-fire count still ~0.

**Scope:** migrate 30 launch-critical cron schedulers from Vercel к Supabase pg_cron. Vercel handlers stay unchanged (same `/api/cron/*` endpoints with `Authorization: Bearer $CRON_SECRET`). pg_cron в Supabase calls them via `pg_net.http_post()` on schedule. Vercel cron config для these 30 entries gets removed (drops Vercel cron count к ~66, well under any plausible quota).

---

## Why this is the right Phase 2

| Property | Verdict |
|---|---|
| Already on Supabase Pro plan | ✓ pg_cron + pg_net included |
| No new vendor / billing surface | ✓ |
| Handler code unchanged | ✓ — only the trigger source changes |
| Reversible (rollback = re-add к vercel.json) | ✓ |
| Native PostgreSQL — proven at scale | ✓ Used by thousands of Supabase Pro teams |
| Native cron syntax (5-field `* * * * *`) | ✓ same as Vercel — direct port |
| Visibility / logs | ⚠ `cron.job_run_details` table в Supabase, not unified с Vercel logs (tradeoff: reliability > unified dashboard) |

---

## Pre-flight checks (run before migration)

```sql
-- 1. Confirm pg_cron + pg_net extensions installed (Supabase Pro: enabled by default)
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');

-- 2. Confirm cron schema accessible
SELECT * FROM cron.job LIMIT 1;

-- 3. Confirm pg_net.http_post available
SELECT proname FROM pg_proc WHERE proname = 'http_post' AND pronamespace = 'net'::regnamespace;
```

If any check fails: enable via Supabase Dashboard → Database → Extensions → toggle `pg_cron` + `pg_net`.

---

## CRON_SECRET storage

pg_cron job body needs the secret for `Authorization: Bearer ...`. Two options:

### Option A (RECOMMENDED): Vault / Database Settings

```sql
-- Set via Supabase Dashboard → Project Settings → Vault → "Add new secret"
-- key: cron_secret
-- value: <existing CRON_SECRET от Vercel env>

-- Then в jobs:
SELECT net.http_post(
  url := 'https://www.lancerwise.com/api/cron/auto-stop-timers',
  headers := jsonb_build_object(
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
  )
) AS request_id;
```

### Option B: Postgres custom config (per-session)

```sql
-- Set once per session via psql or migration script:
ALTER DATABASE postgres SET app.cron_secret = '<value>';

-- Then jobs use:
'Authorization', 'Bearer ' || current_setting('app.cron_secret')
```

**Recommend A** — Vault is encrypted at rest and survives DB restarts.

---

## The 30 launch-critical cron list (priority order)

### TIER 1 — Billing-critical (15)

| Endpoint | Vercel schedule (post-stagger) | pg_cron schedule (same) |
|---|---|---|
| `/api/cron/payment-reminders` | `0 8 * * *` | `0 8 * * *` |
| `/api/cron/payment-reminder` | `0 10 * * 1,4` | `0 10 * * 1,4` |
| `/api/cron/send-payment-reminders` | `6 10 * * *` | `6 10 * * *` |
| `/api/cron/invoice-reminders` | `0 9 * * *` | `0 9 * * *` |
| `/api/cron/invoice-reminders-auto` | `8 10 * * *` | `8 10 * * *` |
| `/api/cron/auto-invoice-reminders` | `2 9 * * *` | `2 9 * * *` |
| `/api/cron/auto-invoice-retainers` | `8 9 * * *` | `8 9 * * *` |
| `/api/cron/generate-recurring-invoices` | `5 6 * * *` | `5 6 * * *` |
| `/api/cron/retainer-invoices` | `6 8 * * *` | `6 8 * * *` |
| `/api/cron/overdue-escalation` | `2 10 * * *` | `2 10 * * *` |
| `/api/cron/overdue-threshold-reminders` | `4 10 * * *` | `4 10 * * *` |
| `/api/cron/late-fees` | `4 9 * * *` | `4 9 * * *` |
| `/api/cron/apply-late-fees` | `6 9 * * *` | `6 9 * * *` |
| `/api/cron/viewed-invoice-digest` | `12 9 * * *` | `12 9 * * *` |
| ~~`/api/cron/recurring-invoices`~~ | dropped — dup of generate-recurring-invoices | — |

### TIER 2 — Legal-critical (5)

| Endpoint | Schedule |
|---|---|
| `/api/cron/contract-expiry` | `0 10 * * *` |
| `/api/cron/contract-renewal-alerts` | `2 8 * * *` |
| `/api/cron/renewal-alerts` | `10 9 * * *` |
| `/api/cron/renewal-reminders` | `4 8 * * *` |
| `/api/cron/subscription-renewals` | `2 7 * * *` |

### TIER 3 — User-facing reminders (10)

| Endpoint | Schedule |
|---|---|
| `/api/cron/auto-stop-timers` | `0 6 * * *` |
| `/api/cron/time-reminder` | `0 16 * * 1-5` |
| `/api/cron/deadline-reminder` | `0 7 * * 1` |
| `/api/cron/milestone-reminder` | `2 9 * * 1` |
| `/api/cron/milestone-reminders` | `4 7 * * *` |
| `/api/cron/milestone-alerts` | `6 7 * * *` |
| `/api/cron/expire-proposals` | `0 7 * * *` |
| `/api/cron/proposal-followup` | `14 9 * * *` |
| `/api/cron/proposal-followups` | `0 10 * * 1,3,5` |
| `/api/cron/proposal-expired-alert` | `16 9 * * *` |

**Total 30 endpoints** — exactly the 30 critical that have 0 invocations в Observability per `CRON-BLAST-RADIUS.md`.

---

## Migration SQL — full script

Save as `scripts/migrations/2026-05-30-pg-cron-launch-critical.sql` ONLY IF Phase 2 triggered.

```sql
-- 2026-05-30 — Phase 2: migrate 30 launch-critical cron schedulers from
-- Vercel к Supabase pg_cron. Triggered after stagger PR #252 (2026-05-29)
-- failed к restore scheduled-fire count after 24h re-check.
--
-- Strategy: pg_cron schedules HTTP POST к existing Vercel handlers с the
-- project's CRON_SECRET. Handlers, business logic, и code paths unchanged
-- — only the schedule trigger source moves.
--
-- See VERCEL-TICKET-SUBMITTED.md (case #01pqHRCWQbKgYCzb) для backstory.

-- ===== Pre-flight: ensure extensions =====
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Confirm cron_secret stored в Vault (manual step via Supabase Dashboard):
--   Settings → Vault → Add new secret · name: cron_secret · value: <env>
-- After this script, verify with:
--   SELECT name FROM vault.decrypted_secrets WHERE name = 'cron_secret';

-- ===== Helper: wrapper that does the POST with auth =====
CREATE OR REPLACE FUNCTION call_cron_endpoint(endpoint_path text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault, net
AS $$
DECLARE
  secret text;
  request_id bigint;
BEGIN
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'cron_secret';
  IF secret IS NULL THEN
    RAISE EXCEPTION 'cron_secret not configured в Vault';
  END IF;

  SELECT net.http_post(
    url := 'https://www.lancerwise.com' || endpoint_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || secret,
      'Content-Type', 'application/json',
      'X-Cron-Source', 'pg_cron-supabase'
    ),
    timeout_milliseconds := 60000  -- 60s — covers slow handlers
  ) INTO request_id;

  RETURN request_id;
END;
$$;

-- ===== TIER 1 — Billing-critical (14 active, recurring-invoices dropped) =====
SELECT cron.schedule('payment-reminders',             '0 8 * * *',     $$SELECT call_cron_endpoint('/api/cron/payment-reminders')$$);
SELECT cron.schedule('payment-reminder',              '0 10 * * 1,4',  $$SELECT call_cron_endpoint('/api/cron/payment-reminder')$$);
SELECT cron.schedule('send-payment-reminders',        '6 10 * * *',    $$SELECT call_cron_endpoint('/api/cron/send-payment-reminders')$$);
SELECT cron.schedule('invoice-reminders',             '0 9 * * *',     $$SELECT call_cron_endpoint('/api/cron/invoice-reminders')$$);
SELECT cron.schedule('invoice-reminders-auto',        '8 10 * * *',    $$SELECT call_cron_endpoint('/api/cron/invoice-reminders-auto')$$);
SELECT cron.schedule('auto-invoice-reminders',        '2 9 * * *',     $$SELECT call_cron_endpoint('/api/cron/auto-invoice-reminders')$$);
SELECT cron.schedule('auto-invoice-retainers',        '8 9 * * *',     $$SELECT call_cron_endpoint('/api/cron/auto-invoice-retainers')$$);
SELECT cron.schedule('generate-recurring-invoices',   '5 6 * * *',     $$SELECT call_cron_endpoint('/api/cron/generate-recurring-invoices')$$);
SELECT cron.schedule('retainer-invoices',             '6 8 * * *',     $$SELECT call_cron_endpoint('/api/cron/retainer-invoices')$$);
SELECT cron.schedule('overdue-escalation',            '2 10 * * *',    $$SELECT call_cron_endpoint('/api/cron/overdue-escalation')$$);
SELECT cron.schedule('overdue-threshold-reminders',   '4 10 * * *',    $$SELECT call_cron_endpoint('/api/cron/overdue-threshold-reminders')$$);
SELECT cron.schedule('late-fees',                     '4 9 * * *',     $$SELECT call_cron_endpoint('/api/cron/late-fees')$$);
SELECT cron.schedule('apply-late-fees',               '6 9 * * *',     $$SELECT call_cron_endpoint('/api/cron/apply-late-fees')$$);
SELECT cron.schedule('viewed-invoice-digest',         '12 9 * * *',    $$SELECT call_cron_endpoint('/api/cron/viewed-invoice-digest')$$);

-- ===== TIER 2 — Legal-critical (5) =====
SELECT cron.schedule('contract-expiry',               '0 10 * * *',    $$SELECT call_cron_endpoint('/api/cron/contract-expiry')$$);
SELECT cron.schedule('contract-renewal-alerts',       '2 8 * * *',     $$SELECT call_cron_endpoint('/api/cron/contract-renewal-alerts')$$);
SELECT cron.schedule('renewal-alerts',                '10 9 * * *',    $$SELECT call_cron_endpoint('/api/cron/renewal-alerts')$$);
SELECT cron.schedule('renewal-reminders',             '4 8 * * *',     $$SELECT call_cron_endpoint('/api/cron/renewal-reminders')$$);
SELECT cron.schedule('subscription-renewals',         '2 7 * * *',     $$SELECT call_cron_endpoint('/api/cron/subscription-renewals')$$);

-- ===== TIER 3 — User-facing reminders (10) =====
SELECT cron.schedule('auto-stop-timers',              '0 6 * * *',     $$SELECT call_cron_endpoint('/api/cron/auto-stop-timers')$$);
SELECT cron.schedule('time-reminder',                 '0 16 * * 1-5',  $$SELECT call_cron_endpoint('/api/cron/time-reminder')$$);
SELECT cron.schedule('deadline-reminder',             '0 7 * * 1',     $$SELECT call_cron_endpoint('/api/cron/deadline-reminder')$$);
SELECT cron.schedule('milestone-reminder',            '2 9 * * 1',     $$SELECT call_cron_endpoint('/api/cron/milestone-reminder')$$);
SELECT cron.schedule('milestone-reminders',           '4 7 * * *',     $$SELECT call_cron_endpoint('/api/cron/milestone-reminders')$$);
SELECT cron.schedule('milestone-alerts',              '6 7 * * *',     $$SELECT call_cron_endpoint('/api/cron/milestone-alerts')$$);
SELECT cron.schedule('expire-proposals',              '0 7 * * *',     $$SELECT call_cron_endpoint('/api/cron/expire-proposals')$$);
SELECT cron.schedule('proposal-followup',             '14 9 * * *',    $$SELECT call_cron_endpoint('/api/cron/proposal-followup')$$);
SELECT cron.schedule('proposal-followups',            '0 10 * * 1,3,5',$$SELECT call_cron_endpoint('/api/cron/proposal-followups')$$);
SELECT cron.schedule('proposal-expired-alert',        '16 9 * * *',    $$SELECT call_cron_endpoint('/api/cron/proposal-expired-alert')$$);

-- ===== Sanity: list registered jobs =====
SELECT jobname, schedule, active FROM cron.job ORDER BY jobname;
```

---

## Vercel-side cleanup PR (paired)

If pg_cron migration runs, remove the 30 entries from `vercel.json` to:
1. Avoid duplicate execution if Vercel scheduler eventually fixes itself
2. Drop Vercel cron count к ~66 (well under documented Pro 100 limit)

```bash
# Helper script to drop migrated entries:
python3 -c "
import json
MIGRATED = {
  'payment-reminders','payment-reminder','send-payment-reminders',
  'invoice-reminders','invoice-reminders-auto','auto-invoice-reminders',
  'auto-invoice-retainers','generate-recurring-invoices','retainer-invoices',
  'overdue-escalation','overdue-threshold-reminders','late-fees',
  'apply-late-fees','viewed-invoice-digest',
  'contract-expiry','contract-renewal-alerts','renewal-alerts',
  'renewal-reminders','subscription-renewals',
  'auto-stop-timers','time-reminder','deadline-reminder',
  'milestone-reminder','milestone-reminders','milestone-alerts',
  'expire-proposals','proposal-followup','proposal-followups',
  'proposal-expired-alert',
}
d = json.load(open('vercel.json'))
d['crons'] = [c for c in d['crons'] if c['path'].replace('/api/cron/','') not in MIGRATED]
json.dump(d, open('vercel.json','w'), indent=2)
open('vercel.json','a').write('\n')
print(f'Crons remaining in vercel.json: {len(d[\"crons\"])}')
"
```

PR title: `chore(crons): drop 30 launch-critical from vercel.json (now in Supabase pg_cron — Phase 2)`

---

## Testing protocol (before relying on it in production)

### Per-endpoint smoke (run BEFORE removing Vercel entry)

```sql
-- Manual one-off invocation от psql:
SELECT call_cron_endpoint('/api/cron/auto-stop-timers');

-- Check pg_net response:
SELECT * FROM net._http_response ORDER BY id DESC LIMIT 1;
-- Expect: status_code = 200, content_length > 0
```

If status_code != 200: handler issue (already proven healthy via earlier curl tests, но re-verify per endpoint).

### Wait one scheduled cycle

For daily cron (`0 6 * * *`): wait 24h since insertion. Check:

```sql
SELECT runid, jobid, job_pid, database, username, command, status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobname = 'auto-stop-timers'
ORDER BY start_time DESC
LIMIT 5;
```

Expect: at least 1 row с status='succeeded' within last 24h.

### Cross-verify on Vercel side

- For each migrated endpoint, after 24h, query Vercel runtime logs:
  ```
  requestPath:/api/cron/auto-stop-timers
  ```
  Should see 1 invocation per scheduled occurrence с `X-Cron-Source: pg_cron-supabase` header (from `call_cron_endpoint` helper).

- Verify notification chain works end-to-end (e.g. `auto-stop-timers` insertнул `notifications.type='timer_auto_stopped'` row for any stale timer).

---

## Rollback plan

If pg_cron migration somehow worsens (unlikely — handlers are unchanged):

```sql
-- Drop all 30 jobs in one go:
DO $$
DECLARE
  job_record RECORD;
BEGIN
  FOR job_record IN
    SELECT jobid FROM cron.job
    WHERE jobname IN (
      'payment-reminders','payment-reminder','send-payment-reminders',
      'invoice-reminders','invoice-reminders-auto','auto-invoice-reminders',
      'auto-invoice-retainers','generate-recurring-invoices','retainer-invoices',
      'overdue-escalation','overdue-threshold-reminders','late-fees',
      'apply-late-fees','viewed-invoice-digest',
      'contract-expiry','contract-renewal-alerts','renewal-alerts',
      'renewal-reminders','subscription-renewals',
      'auto-stop-timers','time-reminder','deadline-reminder',
      'milestone-reminder','milestone-reminders','milestone-alerts',
      'expire-proposals','proposal-followup','proposal-followups',
      'proposal-expired-alert'
    )
  LOOP
    PERFORM cron.unschedule(job_record.jobid);
  END LOOP;
END $$;
```

Then revert the Vercel-side `vercel.json` drop PR.

---

## Estimated effort if triggered

| Step | Duration |
|---|---|
| Confirm pg_cron + pg_net enabled | 5 min |
| Store CRON_SECRET in Vault via Dashboard | 5 min |
| Run migration SQL (one psql command) | 1 min |
| Smoke-test all 30 endpoints (parallel via psql script) | 15 min |
| Wait 24h for first scheduled cycle | passive |
| Open + merge Vercel-side cleanup PR | 10 min |
| **Total active time:** ~30 min |

---

## Honest non-overclaim

- pg_cron sometimes has minor delays (seconds to a couple of minutes) под heavy DB load. For time-sensitive crons like auto-stop-timers (need on-time within an hour), pg_cron's accuracy >> Vercel's current zero-fires status — clearly better.
- pg_net.http_post is async fire-and-forget — `cron.job_run_details` shows whether pg_cron SCHEDULED the call, not whether the HTTP response succeeded. To verify end-to-end, must query `net._http_response` separately.
- Supabase Pro tier пока has soft cap of ~64 active pg_cron jobs (per Supabase docs). We'd add 29 (recurring-invoices dropped) — well below cap.
- This script is **drafted but NOT executed**. Trigger = stagger fails 24h re-check. No DB changes from preparing this document.

— Agent 5, 2026-05-29
