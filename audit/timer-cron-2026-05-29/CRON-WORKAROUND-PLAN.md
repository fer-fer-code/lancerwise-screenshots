# Cron workaround plan — stagger first, external fallback

**Date:** 2026-05-29
**Status:** Analysis only — NOT implemented. Awaiting Ramiz OK before any vercel.json mutation.
**Sister docs:** [VERCEL-TICKET-SUBMITTED.md](./VERCEL-TICKET-SUBMITTED.md) · [CRON-BLAST-RADIUS.md](./CRON-BLAST-RADIUS.md)

---

## TL;DR launch-blocker verdict

**YES — this is a hard launch-blocker.**

- **30 launch-critical crons dead. 0 launch-critical alive.** All 15 billing + 5 legal + 10 user-facing reminders show 0 invocations за 7 days в Vercel Observability.
- The 10 crons что DID fire are all low-priority (internal hygiene, digests for owner-only) — NONE user-facing.
- Concrete impact: payment reminders, overdue chases, late-fee application, contract expiry alerts, retainer billing, recurring invoices, milestone alerts, auto-stop-timers — all silently broken.

Launching as-is would mean: every Pro-tier user signs up expecting "we chase invoices for you" → gets zero automation. **Public refund-risk + reputation impact.**

Recommendation: **don't launch без either stagger fix OR external trigger migration** for at least the 15 billing-critical crons.

---

## Burst analysis — Vercel's hypothesis confirmed

Vercel Agent suggested: "scheduling a large batch of concurrent function invocations simultaneously can occasionally cause queuing issues or downstream pressure."

Our data:

```
Schedule          Crons sharing slot          Critical share
0 9 * * *         14 crons                    9 launch-critical
0 8 * * *         10 crons                    4 launch-critical
0 10 * * *         9 crons                    5 launch-critical
0 7 * * *          5 crons                    4 launch-critical
0 9 1 * *          5 crons (monthly)          0 launch-critical
0 8 * * 1          4 crons (weekly)           0 launch-critical
0 11 * * *         4 crons                    0 launch-critical
0 6 * * *          3 crons                    3 launch-critical  ← incl. auto-stop-timers
```

**Daily 7-10 a.m. UTC = 41 cron firings** in 4 hours. Peak 9 a.m. = 14 simultaneous. 

This **strongly matches** the symptom: Vercel scheduler can dispatch maybe N concurrent invocations per minute; remainder silently dropped. The 10 surviving crons are exactly the ones in **unique solo slots** (`0 3 * * *`, `0 12 * * 3`, `0 18 * * 1-5`, etc.).

---

## Plan A — STAGGER (recommended first)

### Scope

Spread the 5 burst slots across multiple minutes. Touch only `vercel.json` `schedule` strings. No code changes, no new infra.

### Concrete stagger map

#### `0 9 * * *` → spread across 9:00-9:45 (5-min intervals)

| Cron | New schedule | Notes |
|---|---|---|
| invoice-reminders | `0 9 * * *` | KEEP — critical, primary |
| auto-invoice-reminders | `5 9 * * *` | offset +5 |
| late-fees | `10 9 * * *` | offset +10 |
| apply-late-fees | `15 9 * * *` | runs after late-fees |
| auto-invoice-retainers | `20 9 * * *` | |
| renewal-alerts | `25 9 * * *` | |
| viewed-invoice-digest | `30 9 * * *` | |
| proposal-followup | `35 9 * * *` | |
| proposal-expired-alert | `40 9 * * *` | |
| (5 low-priority: scope-creep-alert, budget-alert, client-checkins, lead-followups, stale-draft-invoices) | `45-65 9 * * *` или `* 12 * * *` (afternoon) | move out of morning peak |

#### `0 10 * * *` → spread across 10:00-10:25

| Cron | New schedule |
|---|---|
| contract-expiry | `0 10 * * *` (canonical) |
| overdue-escalation | `5 10 * * *` |
| overdue-threshold-reminders | `10 10 * * *` |
| send-payment-reminders | `15 10 * * *` |
| invoice-reminders-auto | `20 10 * * *` |
| (4 low-priority: project-completion-followup, due-soon-reminder, hours-budget-alert, retainer-usage-alert) | redistribute к 11-12 hours |

#### `0 8 * * *` → spread across 8:00-8:25

| Cron | New schedule |
|---|---|
| payment-reminders | `0 8 * * *` (canonical, billing-critical) |
| contract-renewal-alerts | `5 8 * * *` |
| renewal-reminders | `10 8 * * *` |
| retainer-invoices | `15 8 * * *` |
| (6 low-priority: client-anniversary, client-greetings, special-dates-greeting, time-budget-alerts, revenue-milestone, burnout-alert) | move к 13-14 hours OR `*/30` schedules |

#### `0 6 * * *` → spread across 6:00-6:15 (all 3 are critical)

| Cron | New schedule |
|---|---|
| auto-stop-timers | `0 6 * * *` (canonical) |
| generate-recurring-invoices | `5 6 * * *` |
| recurring-invoices | `10 6 * * *` (probable dup, but safer to keep until #249-style review) |

#### `0 7 * * *` → spread across 7:00-7:20

| Cron | New schedule |
|---|---|
| expire-proposals | `0 7 * * *` |
| subscription-renewals | `5 7 * * *` |
| milestone-reminders | `10 7 * * *` |
| milestone-alerts | `15 7 * * *` (probable variant of -reminders) |
| generate-recurring-tasks | `20 7 * * *` |

### Estimated total stagger changes

**~30 schedule edits** in `vercel.json`. Lines changed in PR diff: 30. No code touches. Risk: user-facing time of automation shifts by 5-45 min — for emails/billing reminders this is **negligible** (no SLA on exact minute).

### Pros / cons

| Pros | Cons |
|---|---|
| Free, no new vendor | Doesn't fix root cause (Vercel scheduler bug). If hypothesis wrong, won't help |
| 30-min implementation | Stagger doesn't completely eliminate burst — even 5-min separation might hit slot N+1's burst |
| Stays on Vercel (single platform) | If Vercel's drop threshold is per-hour, not per-minute, this won't help |
| Test cycle ~24h (next-day cron firings) | Requires another deploy → another QA gate → qa-gates bot block risk |

---

## Plan B — EXTERNAL TRIGGER (fallback if stagger doesn't help)

Migrate billing-critical 15 crons (+ auto-stop-timers + ~5 other launch-critical user-facing) to external scheduler that calls existing `/api/cron/*` endpoints с `Authorization: Bearer $CRON_SECRET`. Handlers proven работают (curl confirmed).

### Comparison

| Option | Setup time | Reliability | Cost | Dependency added |
|---|---|---|---|---|
| **Supabase pg_cron** | ~1 hour | **HIGH** (Postgres-native, already в our DB) | Included в Pro tier (no new $) | None (already have Supabase Pro) |
| GitHub Actions schedule | ~45 min | MEDIUM (cron jobs have 30-90 min lag известно) | Free (2k min/month) | None new |
| cron-job.org | ~30 min | HIGH (10+ years uptime, но no SLA) | Free для ≤50 jobs | Free public service |
| Upstash QStash | ~1 hour | HIGH (Redis-backed) | $1.80 per 100k messages (~$1-2/mo for us) | Paid SaaS account |
| AWS EventBridge | ~2-3 hours | VERY HIGH (enterprise SLA) | $1 per 1M (~free для us) | AWS account |

### Recommendation: Supabase pg_cron

**Why:** already on Pro, native to our DB, zero new vendor, proven reliable (Supabase используется в production by thousands of teams).

**How:**

```sql
-- Enable pg_cron + pg_net в Supabase Dashboard
-- (already enabled if Pro tier)

-- Example: auto-stop-timers
SELECT cron.schedule(
  'auto-stop-timers',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := 'https://www.lancerwise.com/api/cron/auto-stop-timers',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.cron_secret')
      )
    ) AS request_id;
  $$
);
```

Repeat для 30 launch-critical crons. **Stays on Vercel for low-priority crons** (97-30 = 67 crons that can stay if scheduler eventually fixes itself OR if dropping low-priority is fine).

### Migration scope (if Plan B needed)

- 15 billing-critical → pg_cron
- 5 legal-critical → pg_cron
- 10 user-facing → pg_cron
- **Total 30 crons** moved
- Stagger them within pg_cron (Postgres scheduler easily handles burst — different problem domain)

---

## Recommended sequence

### Phase 1 — STAGGER first (low cost, follows Vercel hint)

1. PR: `chore(crons): stagger burst slots — Vercel ticket #01pqHRCWQbKgYCzb`
2. ~30 schedule edits в vercel.json
3. Merge → deploy
4. Wait 24-48h
5. Check Vercel Observability Cron Jobs (Last 24 hours) — see if invocation count climbs от 10 → ≥30
6. If YES (most launch-critical now firing): keep on Vercel, ship launch
7. If NO (still only ~10 fire): proceed к Phase 2

### Phase 2 — pg_cron migration if stagger fails

1. Enable pg_cron + pg_net в Supabase (1-line config)
2. Move CRON_SECRET к pg_settings (`app.cron_secret`)
3. Per-cron migration: `SELECT cron.schedule(...)` calls для 30 launch-critical routes
4. Smoke test: trigger each manually + verify notification chain works end-to-end
5. Remove migrated paths из vercel.json (drops Vercel cron count к 67)
6. Ship launch

### Phase 3 — independent

1. PR #250 (24h GlobalTimerBar warning) — merge независимо. Defensive against ANY cron failure mode.
2. CRON-DEDUP-MAP.md review — drop confirmed duplicates (`recurring-invoices` vs `generate-recurring-invoices`, etc.) regardless of scheduler fix.

---

## Honest non-overclaim

- Stagger plan assumes Vercel's hypothesis is correct (burst → drop). If real cause is different (e.g. project-level invocation cap regardless of timing), stagger fails. Best test: wait 24h after stagger deploy.
- pg_cron migration loses Vercel-level observability за migrated crons — would need pg_cron's own logs (`cron.job_run_details` table) для visibility. Tradeoff: reliability > unified dashboard.
- GitHub Actions cron alone is unreliable for time-sensitive auto-stop-timers; OK для slow-tolerance crons (digests, weekly reports).
- cron-job.org has no SLA — fine как backup notification path but not primary.

— Agent 5, 2026-05-29
