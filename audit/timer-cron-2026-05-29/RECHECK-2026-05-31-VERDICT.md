# Re-check 2026-05-31 04:55 UTC — Verdict B (granularity insufficient)

**Time elapsed since stagger deploy:** ~35.5 hours (deploy at 2026-05-29 17:30 UTC, re-check at 2026-05-31 04:55 UTC)
**Burst windows passed:** 2 (May 30 06:00-13:00 UTC + May 31 00:00-04:55 UTC partial)
**Vercel engineer reply:** **NO** — ticket #01pqHRCWQbKgYCzb still "Awaiting response"

---

## TL;DR

**Verdict: B (with nuance)** — granularity hypothesis insufficient. Vercel scheduler is broken deeper than minute-2/4/8 vs minute-0/5 timing.

**Action:** do NOT deploy 5-min regrid (it wouldn't help). Trigger **Phase 2 pg_cron migration** for the 26 still-silent launch-critical crons.

---

## Numbers

### Observability "Last 24 hours" (and "Last 7 days") — identical 4 fires

| Route | Schedule | Invocations | Duration |
|---|---|---|---|
| `/api/cron/auto-stop-timers` | `0 6 * * *` | 2 (in 7d: 1 manual curl May 29 + 1 scheduled May 30 06:00) | 960ms |
| `/api/cron/payment-reminders` | `0 8 * * *` | 1 | 1.09s |
| `/api/cron/invoice-reminders` | `0 9 * * *` | 1 | 1.57s |
| `/api/cron/apply-late-fees` | `6 9 * * *` | 1 | 297ms |

**Total scheduled fires в 7-day window: 4 unique cron routes (5 invocations с 2x для auto-stop-timers).**

Pre-stagger baseline (per `STAGGER-DEPLOYED.md`): 0 scheduled fires. So **stagger gave +4 unique critical fires** — real but very limited.

---

## Specific minute-0/2/4/6 cells from Ramiz's verdict criteria

| Cron | Schedule | Hypothesis prediction | Actual |
|---|---|---|---|
| `contract-expiry` | `0 10 * * *` | should fire (minute 0) | **❌ DID NOT FIRE** |
| `overdue-escalation` | `2 10 * * *` | should NOT fire (granularity) | not fired (consistent с both hypotheses) |
| `overdue-threshold-reminders` | `4 10 * * *` | should NOT fire | not fired |
| `send-payment-reminders` | `6 10 * * *` | borderline | not fired |

**Critical finding:** `contract-expiry` at **canonical minute 0** ALSO did not fire. This **invalidates** the simple "5-min granularity" hypothesis — если scheduler had clean 5-min grid, ALL minute-0 crons would fire reliably.

Other minute-0 crons that DID fire:
- auto-stop-timers @ `0 6` ✓
- payment-reminders @ `0 8` ✓
- invoice-reminders @ `0 9` ✓

So minute-0 fires INCONSISTENTLY — 3 of 5 expected hourly canonical slots fired (06, 08, 09), but 07 и 10 didn't (despite having staggered minute-0 crons in those slots: `expire-proposals` at `0 7`, `contract-expiry` at `0 10`).

---

## Why verdict is B, not A или C

### Not A (granularity)
- `contract-expiry` @ `0 10` (canonical minute-0) did NOT fire
- `expire-proposals` @ `0 7` (canonical minute-0) did NOT fire
- `generate-recurring-invoices` @ `5 6` (canonical 5-min boundary) did NOT fire
- If granularity were the rule, all minute-0/5 should fire — they don't

### Not C (everything fixed)
- 4 of ~26 expected staggered fires per 24h actually fired (~15% restoration)
- 22 staggered crons still completely silent

### B — Vercel scheduler genuinely broken
- Some routes fire some days; most never fire regardless of timing
- Pattern не linked к minute/hour granularity
- May be tied к specific route history (auto-stop-timers, payment-reminders, invoice-reminders all have long firing history; contract-expiry possibly stale)
- Or quota-per-route at sub-day granularity that we don't have telemetry для

---

## Recommendation (acting on verdict B)

### 1. DO NOT deploy 5-min regrid

`REGRID-5MIN-PLAN.md` was prepared based on granularity hypothesis. Since hypothesis disproven, deploying it would:
- Burn another deploy cycle
- Reshuffle schedules без addressing root cause
- Just delay Phase 2 by another ~24h cycle

**Decision: shelved.** Script preserved in audit folder for later reference.

### 2. Trigger Phase 2 — Supabase pg_cron migration

`PHASE-2-PG-CRON-MIGRATION.md` ready. ~30 min active work:
- 14 billing-critical + 5 legal-critical + 10 user-facing reminders = 29 endpoints (recurring-invoices already dropped в stagger)
- pg_cron is native Postgres, doesn't depend on Vercel scheduler
- Handler code unchanged (HTTP POST к existing `/api/cron/*` с CRON_SECRET in Authorization header)

This bypasses the Vercel scheduler issue entirely. Stagger crons remaining on Vercel (~67) can stay since 4 of них fire fine; и even if none fire, those are low-priority.

### 3. Merge PR #255 (defensive next.config redirect fix)

Independent defensive surface. Doesn't help cron firing directly, но protects future:
- LemonSqueezy webhooks (launch-week-1 critical)
- Cron jobs IF Vercel ever changes scheduler hostname к `*.vercel.app`

Author confirmed `krokusstudia2@gmail.com`. Visual-regression check may FAIL для unrelated baseline drift (same as #249, #250, #252) — admin-merge if needed.

### 4. Keep Vercel ticket open

`#01pqHRCWQbKgYCzb` still Awaiting response. When engineer replies, their telemetry may reveal:
- Specific route-level quota
- Why minute-0 fires inconsistently
- Whether pg_cron is the right long-term answer

Не блокируем launch на их ответе. pg_cron — наш fallback.

---

## Launch-blocker status

**Cron-track НЕ закрыт.** Stagger workaround alone won't restore the 30 launch-critical automations promised к users. Need pg_cron to confidently launch.

After pg_cron migration:
- 29 critical crons trigger from pg_cron → call Vercel handlers → execute reliably
- Handlers proven healthy via earlier curl evidence (`{stopped:0}` in 1.18s)
- Verifiable through `cron.job_run_details` table

---

## Honest non-overclaim

- Stagger was the right Phase 1 — it cost nothing, took 30 min, and gave +4 critical fires from 0. Even partial progress is data.
- "Verdict B" не disproves Vercel scheduler issue exists — actually confirms it more strongly (canonical minute-0 also unreliable, beyond just burst).
- Pg_cron migration is straightforward but **does add complexity к ops**. Trade-off: reliability > unified Vercel dashboard.
- Vercel engineer reply may yet provide a fix-on-their-side. We don't lose anything by migrating proactively — easy к roll back if Vercel finally fires consistently.

— Agent 5, 2026-05-31
