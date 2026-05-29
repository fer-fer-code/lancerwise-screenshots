# Timer 60h diagnosis — auto-stop-timers cron not firing

**Date:** 2026-05-29 ~07:00 UTC
**Agent:** Agent 5
**Track:** separate from route-mismatch-fixes PR #249

---

## TL;DR

GlobalTimerBar shows **60:32** for user `ramiz_ddd@mail.ru` because there is a `time_entries` row started **2026-05-26 18:23:20 UTC** with `end_time = NULL`. That's ~60.5h ago. Cron `/api/cron/auto-stop-timers` is configured to truncate any such row to 8h at `0 6 * * *` UTC, **но не отработал ни 27, ни 28, ни 29 мая**.

Not a code bug в timer rendering. Root cause = cron exec failure.

---

## Evidence chain

### 1. Running entry IS live

```js
// GET /api/dashboard/widget-data → running_timer field
{
  id: "0f61a59e-4c8b-4bde-ac13-8f079b915b03",
  start_time: "2026-05-26T18:23:20.093+00:00",
  hoursElapsed: "60.54"
}
```

`GlobalTimerBar.formatElapsed()` → `Math.floor((Date.now() - start) / 1000)` → 60h 32m 26s display. Rendering correct.

### 2. Cron is configured

```json
// vercel.json (line for auto-stop-timers)
{ "path": "/api/cron/auto-stop-timers", "schedule": "0 6 * * *" }
```

Project meta (Vercel API):
```
crons.deploymentId: dpl_39jpaaw4cQxDrTyPHhDUEUMpYzQR (live prod)
crons.disabledAt:   None  ← not disabled
cron config count:  97
```

### 3. Cron logic itself is sound

`src/app/api/cron/auto-stop-timers/route.ts`:

```ts
const cutoff = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
const { data: stale } = await supabase.from('time_entries')
  .select('id, user_id, start_time, project_id')
  .is('end_time', null)
  .lt('start_time', cutoff)
// → UPDATE end_time + duration = 8h, INSERT notifications row type='timer_auto_stopped'
```

Filter `end_time IS NULL AND start_time < (now - 8h)` would match `0f61a59e…` since 2026-05-27 02:23 UTC. Three daily executions (27/28/29 May 06:00 UTC) would each have truncated it. None did.

### 4. Cron has NOT run for this user

```js
// GET /api/notifications?limit=200 → user notifications, filtered by type
{
  totalNotifications: 8,
  notificationTypesCount: { success: 8 },
  autoStoppedCount: 0  // ← zero timer_auto_stopped notifications
}
```

Cron inserts `notifications.type='timer_auto_stopped'` on successful update. Zero notifications of that type for this user → cron either (a) never executed, (b) executed but found no rows, or (c) executed but UPDATE failed.

Filter `(b)` impossible — entry start_time was 27/28/29 May < cutoff each day.

So: cron either failed silently or didn't fire at all.

---

## Most likely root cause: cron throttling / quota

Project has **97 cron jobs configured**. Vercel Pro plan supports up to 100 cron jobs, BUT там separate limits:
- Daily execution count
- Concurrency / overlap windows
- Account-level fairness throttling

`auto-stop-timers` is scheduled at `0 6 * * *` — same UTC minute as a dozen others (`0 6` через grep даёт ~3-4 collisions; `0 *` family ~30). If Vercel queues per-minute and silently drops the tail, `auto-stop-timers` could be one of the casualties.

Could not retrieve Vercel cron execution history через REST API (no public endpoint). Verification path requires Vercel UI: **Project → Crons → auto-stop-timers → Execution History**.

---

## Other possibilities (less likely)

1. **CRON_SECRET mismatch** — confirmed env var exists в target=`['production','preview']`, created 1777985515835 (~Apr 2026). Not rotated since.
2. **Route handler error** — would surface в Vercel Runtime Logs (couldn't find auto-stop traces в last 200 events for current deployment).
3. **RLS blocking UPDATE** — cron uses `createAdminClient()` (service_role key), bypasses RLS. Not the cause.
4. **Cron file moved/renamed since last deploy** — file present at `src/app/api/cron/auto-stop-timers/route.ts` in current deploy SHA `e233c946`. Not it.

---

## Action items (for Ramiz)

### Immediate (manual unblock)

1. **Stop the stale timer manually** — UI `/time-tracker` or backend (DELETE/PATCH `time_entries` row `0f61a59e…`). User-action, sets `end_time + duration` so GlobalTimerBar drops to zero.

### Verification (5 min)

2. **Vercel Dashboard → lancerwise → Crons → auto-stop-timers → Execution History**. Check last 7 days. If empty / all FAILED → cron not running. If shows `200 stopped:0` → filter mismatch (но shown evidence above rules this out).

3. **Manual cron probe**:
   ```bash
   curl -i https://www.lancerwise.com/api/cron/auto-stop-timers \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
   Expected: `200 { stopped: 1, ... }` and within seconds a `timer_auto_stopped` notification appears for `ramiz_ddd@mail.ru`. If route returns 401 → secret rotation needed. If 500 → runtime error.

### Long-term (P1 backlog)

4. **Cut cron count from 97 → under 60**. Many overlap heavily (e.g. `client-onboarding` + `onboarding-nudge` + `proposal-followup` + `proposal-followups` — sounds like duplicates from different audit passes). One sweep PR can probably hit -20 by dedup alone.

5. **Replace `auto-stop-timers` with edge middleware** или **DB trigger** — cron-driven cleanup is fragile when quota-constrained. Postgres `pg_cron` (Supabase Pro feature) или Supabase Edge Function bound к timer-start would be more reliable.

6. **Add hard cap on GlobalTimerBar rendering** — if elapsed > 24h, show warning UI ("Looks like you left this running — stop?") instead of just incrementing display. Defensive surface against cron failure.

---

## Honest non-overclaim

- Confirmed the symptom (60h render) and the data state (one entry, end_time NULL since 2026-05-26 18:23 UTC).
- Confirmed cron is CONFIGURED, NOT DISABLED, and code logic is correct.
- Cannot confirm `executions` history через REST — Vercel doesn't expose it. Conclusion "cron didn't run" inferred от absence of `timer_auto_stopped` notifications, which is strong but not direct proof.
- Did NOT trigger the cron manually (would mutate `time_entries` row + insert notification — outside scope of read-only audit).
- Quota-throttling hypothesis based на public Vercel docs (Pro plan ≤100 crons) + cron count = 97. Not directly verified; could be wrong.

— Agent 5, 2026-05-29
