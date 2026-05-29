# Vercel support ticket — silent cron scheduler drop

**Draft for Ramiz to submit.** Do not send as-is — review and adjust tone/specifics.

**Submit at:** https://vercel.com/help (Pro plan support) or Discord `#support` channel
**Severity:** High — billing-critical automation is silently failing
**Attach:** screenshots from `lancerwise-screenshots/audit/timer-cron-2026-05-29/` (cron-04, cron-05, cron-06, cron-07)

---

## Subject

`Cron scheduler silently dropping ~90% of configured cron jobs — only 10 of 97 executed in last 7 days (Pro plan, project prj_OfYhgE1ONf98IhDzAMzspTr7hC1A)`

## Body

Hi Vercel team,

I'm hitting a production issue where the Vercel cron scheduler is **silently failing to invoke ~90% of our configured cron jobs**. This is breaking billing automation, payment reminders, and other user-facing scheduled flows.

**Project ID:** `prj_OfYhgE1ONf98IhDzAMzspTr7hC1A`
**Team ID:** `team_1chEHohDYMmF5qKeIHoyczor`
**Project URL:** https://vercel.com/fer-fer-codes-projects/lancerwise
**Latest production deployment:** `dpl_39jpaaw4cQxDrTyPHhDUEUMpYzQR` (`e233c946`, READY)
**Plan:** Pro

### What I observe

- **97 cron jobs configured** в `vercel.json` (all show in Project → Settings → Cron Jobs).
- Cron toggle: **Enabled** (verified в Settings UI, not disabled).
- No quota / throttling warning surfaced anywhere в the Vercel dashboard.
- **Observability → Cron Jobs (last 7 days, Production env) shows only 10 cron paths with invocations**:

  ```
  weekly-summary           — 2 invocations
  scope-creep-alert        — 2 invocations
  quarterly-review         — 2 invocations
  project-completion-followup — 2 invocations
  monthly-revenue-forecast — 2 invocations
  monthly-digest           — 2 invocations
  client-revenue-drop      — 2 invocations
  cleanup-oauth-states     — 2 invocations
  at-risk-clients          — 2 invocations
  api-key-digest           — 2 invocations
  ```

  Each one ровно 2 invocations за 7 days — looks like a Vercel-side health check baseline, not actual scheduled execution. None of the daily 8-9 a.m. UTC crons appear at the expected frequency.

- **`auto-stop-timers`** (`0 6 * * *`) shows **zero invocations** в Observability for last 7 days.
- I confirmed handler health independently by manually hitting the endpoint:

  ```bash
  curl -s -w "\nHTTP=%{http_code} TIME=%{time_total}s" \
    -X GET "https://www.lancerwise.com/api/cron/auto-stop-timers" \
    -H "Authorization: Bearer $CRON_SECRET"
  ```

  Returns `200 {"stopped":0,"message":"No stale timers found."}` в 1.18 seconds.

  The invocation **appears immediately в Vercel runtime logs** (`requestPath:/api/cron/auto-stop-timers`):
  ```
  MAY 29 14:14:48.57 GET 200 www.lancerwise.com /api/cron/auto-stop-timers
  ```

  So the route handler, CRON_SECRET auth, code, and Vercel logs are all working — the scheduler simply isn't firing it.

### Concrete user impact

A user (the team owner) had a `time_entries` row stuck running since `2026-05-26T18:23 UTC`. By the time we noticed (2026-05-29 06:53 UTC), it was at **60h 32m**. `auto-stop-timers` cron should have truncated it к 8h on each daily run (May 27 / 28 / 29 at 06:00 UTC) — it never fired any of those three days.

Verified there are **0 `timer_auto_stopped` notifications** in the database for that user, confirming the cron never executed (the cron inserts a notification on every successful stop).

### What I've ruled out

| Check | Result |
|---|---|
| Cron Toggle disabled | NO — toggle Enabled in UI |
| CRON_SECRET expired/rotated | NO — manual curl with current env secret returns 200 |
| Route handler crash | NO — manual curl returns valid JSON в 1.18s, no error |
| RLS blocking | NO — cron uses service-role admin client |
| Email config issue | N/A (auto-stop-timers writes notification + UPDATE, no email) |
| Project paused / suspended | NO — production deployments are READY, project active |
| Recent deployment broke crons | NO — cron config has been stable for 7+ days |
| Browser cache в Observability UI | NO — same result via REST API for project meta |

### Hypotheses I'd like Vercel to investigate

1. **Hidden cron quota** beyond the documented 100-cron limit on Pro. We have 97 configured. Is there a daily-invocation cap, concurrent-execution cap, or per-minute rate-limit что silently drops scheduled invocations?

2. **Scheduler-vs-cron-config drift.** Cron Jobs UI shows all 97 paths registered against the live deployment `dpl_39jpaaw4cQxDrTyPHhDUEUMpYzQR`. Is the scheduler actually using a stale registration? Project meta returns `crons.deploymentId: dpl_39jpaaw4cQxDrTyPHhDUEUMpYzQR, updatedAt: 1780033747779` — consistent.

3. **Timezone-collision throttling.** Many of our crons share the same UTC minute (e.g. ~25 crons at `0 9 * * *`). If the scheduler caps concurrent invocations per minute, that could silently drop the tail.

### What we need

- Confirmation that the scheduler IS or IS NOT invoking these crons in your backend telemetry.
- If it's a quota/throttle issue, explicit documentation of the limit so we can architect around it (consolidate crons, move к external schedulers, etc.).
- If it's a bug, ETA / workaround.

We're 1 week pre-launch — this blocks several billing-critical user-facing automations. Happy to provide more logs, deployment IDs, or run targeted reproduction tests on request.

Thanks,
Ramiz Fiziev
fer-fer-code@users.noreply.github.com / krokusstudia2@gmail.com

---

## Attachments to include

1. `cron-01-jobs-list.png` — Settings UI showing 97 crons + Enabled toggle
2. `cron-04-7d-window.png` — Observability time-range Last 7 days
3. `cron-05-7d-only-10-of-97.png` — Observability showing only 10 cron paths
4. `cron-06-manual-run-result.png` — UI Run click attempted, no toast
5. `cron-07-live-log-post-curl.png` — Manual curl invocation appearing в live log

---

## After-ticket follow-ups

- If Vercel can't fix in 24-48h: migrate launch-critical crons (auto-stop-timers, payment-reminders, invoice-reminders) к **Supabase pg_cron** или external scheduler (GitHub Actions cron / Cloudflare Workers Cron / Upstash).
- Independent от the ticket: the 24h GlobalTimerBar amber warning shipped в PR #250 provides defensive surface so users notice forgotten timers regardless of cron fix.
