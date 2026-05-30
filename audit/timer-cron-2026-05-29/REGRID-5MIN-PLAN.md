# 5-min regrid plan — ready to apply if granularity hypothesis confirmed at 17:30 UTC

**Status:** READY (not applied). Trigger = 17:30 UTC re-check confirms Vercel scheduler fires reliably on 5-min boundaries (e.g. 10:00 fires but 10:02/10:04 don't).

**Script:** [regrid-5min-script.py](./regrid-5min-script.py) — dry-run + apply

---

## Hypothesis being tested

After PR #252 stagger deploy, 4 launch-critical crons fired в 24h window:
- `auto-stop-timers` at `0 6 * * *` ✓ (minute 0)
- `payment-reminders` at `0 8 * * *` ✓ (minute 0)
- `invoice-reminders` at `0 9 * * *` ✓ (minute 0)
- `apply-late-fees` at `6 9 * * *` ✓ (minute 6 — near 5-min boundary)

Crons на minute `2/4/8/10/12/14/16` did NOT fire. Pattern suggests Vercel scheduler may use **5-minute granularity** (only fires at 0, 5, 10, 15, ..., 55 minute marks).

If confirmed at 17:30 UTC by checking:
- 10:00 UTC slot (`contract-expiry` at minute 0) — should fire
- 10:02/10:04 (`overdue-escalation` at `2 10`, `overdue-threshold-reminders` at `4 10`) — should NOT fire
- 12:01 UTC (`client-anniversary` at `1 12`) — should NOT fire

Then this regrid puts every cron on a 5-min boundary instead of 2-min.

---

## Regrid summary

### What changes

| Burst hour | Current stagger (2-min) | New 5-min regrid |
|---|---|---|
| 06:00 | 0, 5 (auto-stop-timers, gen-recurring-invoices) | unchanged (already on grid) |
| 07:00 daily | 0, 2, 4, 6, 8 | 0, 5, 10, 15, 20 |
| 08:00 daily | 0, 2, 4, 6 | 0, 5, 10, 15 |
| 09:00 daily | 0, 2, 4, 6, 8, 10, 12, 14, 16 | 0, 5, 10, 15, 20, 25, 30, 35, 40 |
| 10:00 daily | 0, 2, 4, 6, 8 | 0, 5, 10, 15, 20 |
| 12:00 daily (low-pri) | 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29 | 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55 + overflow to 13:00 |
| 13:00 daily (overflow) | 31, 33, 35, 37 | 0, 5, 10, 15, 20, 25, 30, 35 |

Monday slots, monthly slots, etc. — same 5-min spacing instead of 2-min.

### Untouched crons (27)

Already on 5-min boundaries (mostly minute 0 or 30). No regrid needed:
- `cleanup-oauth-states 0 3 * * *`, `re-engagement 0 12 * * *`, `daily-summary 0 18 * * 1-5`, etc.

### Dry-run validation

```
Touched: 69 of 69 mapped
Off-grid (minute not divisible by 5): 0
Collisions: NONE ✓
Total crons: 96
```

---

## Latent risk — Mon/Thu/specific-day overlaps

When daily and weekly schedules share minute 0, they collide на specific days:

| Daily | Weekly variant | Overlap day |
|---|---|---|
| `0 10 * * *` (contract-expiry) | `0 10 * * 1,4` (payment-reminder) | Mon, Thu |
| `0 10 * * *` (contract-expiry) | `0 10 * * 1,3,5` (proposal-followups) | Mon, Wed, Fri |
| `0 10 * * *` (contract-expiry) | `0 10 5 * *` (client-revenue-drop, 5th of month) | day 5 |
| `0 9 * * *` (invoice-reminders) | `0 9 1 * *` (monthly-digest, 1st) | day 1 |
| `0 9 * * *` (invoice-reminders) | `0 9 5 * *` (project-profitability-report) | day 5 |
| `0 8 * * *` (payment-reminders) | `0 8 1 * *` (monthly-review) | day 1 |
| `0 8 * * *` (payment-reminders) | `0 8 28-31 * *` (monthly-revenue-forecast) | days 28-31 |

**Conservative refinement** (apply if rare-day overlaps cause issues):
- `payment-reminder`: `0 10 * * 1,4` → `25 10 * * 1,4`
- `proposal-followups`: `0 10 * * 1,3,5` → `30 10 * * 1,3,5`
- `client-revenue-drop`: `0 10 5 * *` → `35 10 5 * *`
- `monthly-digest`: `0 9 1 * *` → `45 9 1 * *`
- `project-profitability-report`: `0 9 5 * *` → `50 9 5 * *`
- `monthly-review`: `0 8 1 * *` → `25 8 1 * *`
- `monthly-revenue-forecast`: `0 8 28-31 * *` → `30 8 28-31 * *`

Apply as separate cleanup PR after observing first month of post-regrid fire pattern.

---

## How к apply

If 17:30 UTC re-check confirms granularity hypothesis:

```bash
cd /Users/myoffice/lancerwise-agent5
git checkout main && git pull --quiet
git checkout -b chore/cron-5min-regrid origin/main

# Apply the regrid (script edits vercel.json)
python3 /Users/myoffice/lancerwise-screenshots-agent5/audit/timer-cron-2026-05-29/regrid-5min-script.py

# Verify
python3 -c "import json; d=json.load(open('vercel.json')); print(len(d['crons']))"
git diff --stat vercel.json

# Commit + PR (author=krokusstudia2)
git add vercel.json
git -c user.email=krokusstudia2@gmail.com -c user.name="Ramiz Fiziev" commit -m \
  "chore(crons): regrid 69 schedules onto 5-min boundaries — Vercel scheduler granularity confirmed"
git push -u origin chore/cron-5min-regrid
gh pr create --draft ...
```

---

## Honest non-overclaim

- Granularity hypothesis assumes Vercel scheduler is deterministic at 5-min marks. If granularity is even coarser (15-min, hourly), this regrid won't fully fix it — fewer slots per hour available than crons that need them.
- Even с 5-min regrid, ~30 launch-critical fit into burst hours 6-10 UTC easily (60 slots available, 30 needed). Low-priority go к 12-13 UTC.
- Some daily/weekly schedule overlaps remain on rare days (see Latent risk section). Acceptable for now; refinement available if those days surface issues.
- pg_cron Phase 2 still remains в reserve if even 5-min regrid doesn't restore most fires.

— Agent 5, 2026-05-30
