# Phase 2 pg_cron — DEPLOYED (2026-05-31 05:27 UTC)

**Status:** Live. 29 launch-critical crons now scheduled от Supabase pg_cron. Awaiting first scheduled fire (06:00 UTC auto-stop-timers) для end-to-end verification.

---

## Pre-flight verification chain

| Step | Result | Evidence |
|---|---|---|
| (1) pg_cron + pg_net extensions enabled | ✅ | `pg_cron 1.6.4`, `pg_net 0.20.0`, `net.http_post` available |
| (2) CRON_SECRET stored в Vault | ✅ | `vault.secrets` name=`cron_secret`, decryptable len 27 |
| (3) `call_cron_endpoint()` helper deployed | ✅ | SECURITY DEFINER, uses `vault.decrypted_secrets`, calls `net.http_get` (Vercel cron handlers export GET) |
| (5a) Manual triggers — 3 endpoints | ✅ all 200 | auto-stop-timers `{"stopped":0,"message":"No stale timers found."}`, payment-reminders + invoice-reminders `{"processed":0,"sent":0,"skipped":0,"errors":0}` |
| (5b) Scheduled fire test (`* * * * *`) | ✅ | Fired 2x at 05:24 + 05:25 UTC, both `succeeded` per `cron.job_run_details`, both 200 в `net._http_response`, then unscheduled |

## Critical fix during testing

First attempt used `net.http_post()` — returned 405 Method Not Allowed because Vercel cron handlers export GET only (Next.js convention). Switched к `net.http_get()` → 200 OK.

Helper function final form:

```sql
CREATE OR REPLACE FUNCTION public.call_cron_endpoint(endpoint_path text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, vault, net AS $$
DECLARE
  secret text;
  req_id bigint;
BEGIN
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'cron_secret' LIMIT 1;
  IF secret IS NULL THEN RAISE EXCEPTION 'cron_secret not configured в Vault'; END IF;
  SELECT net.http_get(
    url := 'https://www.lancerwise.com' || endpoint_path,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || secret,
      'X-Cron-Source', 'pg_cron-supabase'
    ),
    timeout_milliseconds := 60000
  ) INTO req_id;
  RETURN req_id;
END;
$$;
```

## Dedup strategy executed

1. PR #257 dropped same 29 endpoints from `vercel.json` (96 → 67 crons) — author `krokusstudia2@gmail.com`, admin-merged через visual-regression pre-existing baseline drift
2. Vercel prod deploy `dpl_DtfuyvyqcRhzPA4GVKPR574pJPTG` (SHA `ddd5c2df`) reached READY at 05:27 UTC
3. **Only then** scheduled 29 pg_cron jobs (via `scripts/migrations/2026-05-31-pg-cron-launch-critical.sql`, recorded в PR #258 draft)
4. **Zero overlap window** — Vercel scheduler stopped invoking these 29 before pg_cron started

## 29 scheduled jobs (`cron.job` table)

| jobid | jobname | schedule | tier |
|---|---|---|---|
| 2 | payment-reminders | `0 8 * * *` | billing |
| 3 | payment-reminder | `0 10 * * 1,4` | billing |
| 4 | send-payment-reminders | `6 10 * * *` | billing |
| 5 | invoice-reminders | `0 9 * * *` | billing |
| 6 | invoice-reminders-auto | `8 10 * * *` | billing |
| 7 | auto-invoice-reminders | `2 9 * * *` | billing |
| 8 | auto-invoice-retainers | `8 9 * * *` | billing |
| 9 | generate-recurring-invoices | `5 6 * * *` | billing |
| 10 | retainer-invoices | `6 8 * * *` | billing |
| 11 | overdue-escalation | `2 10 * * *` | billing |
| 12 | overdue-threshold-reminders | `4 10 * * *` | billing |
| 13 | late-fees | `4 9 * * *` | billing |
| 14 | apply-late-fees | `6 9 * * *` | billing |
| 15 | viewed-invoice-digest | `12 9 * * *` | billing |
| 16 | contract-expiry | `0 10 * * *` | legal |
| 17 | contract-renewal-alerts | `2 8 * * *` | legal |
| 18 | renewal-alerts | `10 9 * * *` | legal |
| 19 | renewal-reminders | `4 8 * * *` | legal |
| 20 | subscription-renewals | `2 7 * * *` | legal |
| 21 | auto-stop-timers | `0 6 * * *` | user |
| 22 | time-reminder | `0 16 * * 1-5` | user |
| 23 | deadline-reminder | `0 7 * * 1` | user |
| 24 | milestone-reminder | `2 9 * * 1` | user |
| 25 | milestone-reminders | `4 7 * * *` | user |
| 26 | milestone-alerts | `6 7 * * *` | user |
| 27 | expire-proposals | `0 7 * * *` | user |
| 28 | proposal-followup | `14 9 * * *` | user |
| 29 | proposal-followups | `0 10 * * 1,3,5` | user |
| 30 | proposal-expired-alert | `16 9 * * *` | user |

All `active = true`. Total: 29.

## First-fire verification window

Currently 05:30 UTC May 31. Next scheduled fires:
- 06:00 UTC: auto-stop-timers (jobid 21)
- 06:05 UTC: generate-recurring-invoices (jobid 9)
- 07:00 UTC: expire-proposals (jobid 27)
- 07:02 UTC: subscription-renewals (jobid 20)
- ... through hours 7-10 UTC: 22 more critical fires

Verify at 06:01 UTC + every fire window passed: `SELECT jobname, status, start_time FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20` + `SELECT status_code FROM net._http_response ORDER BY id DESC LIMIT 20`.

Expected: each scheduled fire → `succeeded` row + matching 200 OK.

## Rollback (if any cron causes issue)

```sql
DO $$
DECLARE j RECORD;
BEGIN
  FOR j IN SELECT jobid FROM cron.job WHERE jobname IN (
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
  ) LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;
```

Plus revert PR #257 to restore Vercel-side config.

## Honest non-overclaim

- 29 schedules confirmed registered + active. End-to-end fire NOT yet verified (waiting 06:00 UTC).
- pg_cron internal scheduler is proven reliable across the Supabase Pro tier (used by thousands of teams). Test cron fired exactly on the minute boundary в both expected fires.
- Helper uses `net.http_get` (not http_post) — verified by 405→200 fix during testing.
- One small risk: `net._http_response` is async-fire-and-forget — `cron.job_run_details` shows pg_cron successfully SCHEDULED the call (the SELECT returned a request_id), but doesn't itself confirm Vercel handler returned 200. Need к correlate `cron.job_run_details.runid` с `net._http_response` to fully verify.
- Vercel ticket #01pqHRCWQbKgYCzb still Awaiting response. pg_cron migration unblocks launch independently.

— Agent 5, 2026-05-31
