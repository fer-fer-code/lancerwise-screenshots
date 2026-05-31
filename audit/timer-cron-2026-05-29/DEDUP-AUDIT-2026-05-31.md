# Dedup audit — vercel.json vs pg_cron overlap check

**Date:** 2026-05-31 17:09 UTC
**Trigger:** Ramiz's prudent check для no-double-fire on money tasks after pg_cron Phase 2 stable
**Verdict:** ✅ **dedup CLEAN.** 0 overlaps. 19/20 money tasks correctly в pg_cron only. 1 intentional gap (dropped dupe).

---

## TL;DR

After PR #257 dropped 29 from vercel.json + PR #258 recorded pg_cron migration SQL, the two schedulers run **disjoint sets** of crons. Zero risk of any cron firing on both schedulers — no double-billing, no double-email.

---

## Numbers

| Source | Total crons |
|---|---|
| `vercel.json` (live `origin/main`) | 67 |
| `cron.job` table (Supabase pg_cron) | 29 |
| **Overlap (Vercel ∩ pg_cron)** | **0** |
| Union | 96 |

(96 = 67 + 29; original 97 had `recurring-invoices` which was confirmed dupe of `generate-recurring-invoices`, dropped in PR #252)

## Money-task focus (20 endpoints)

Per Ramiz's risk list: payment-reminders, invoice-reminders, generate-recurring-invoices, apply-late-fees, retainer-invoices, subscription-renewals etc. Each should be в exactly one scheduler — preferably pg_cron (reliable) — never both (would dual-charge / dual-email customers).

| Status | Count | Tasks |
|---|---|---|
| ✅ pg_cron only | **19** | apply-late-fees, auto-invoice-reminders, auto-invoice-retainers, contract-expiry, contract-renewal-alerts, generate-recurring-invoices, invoice-reminders, invoice-reminders-auto, late-fees, overdue-escalation, overdue-threshold-reminders, payment-reminder, payment-reminders, renewal-alerts, renewal-reminders, retainer-invoices, send-payment-reminders, subscription-renewals, viewed-invoice-digest |
| ⛔ Intentionally not scheduled (dropped dupe) | 1 | `recurring-invoices` |
| 🚨 Dual-scheduled (RISK) | **0** | — |
| ⚠️ Vercel-only (unreliable scheduler) | **0** | — |

### Detail на the "intentional gap"

**`recurring-invoices`** is NOT scheduled anywhere — by design.

Code-level analysis (per PR #257 commit message + earlier audit):

> Both `/api/cron/recurring-invoices` (135 lines, older simpler) и `/api/cron/generate-recurring-invoices` (212 lines, newer с email notifications + Vault-unsub support) execute the SAME business logic against the SAME `recurring_invoices` table — both insert into `invoices`. Если both fire, **duplicate invoices created** для same recurring schedule.

Resolution: PR #252 (stagger) dropped `recurring-invoices` cron entry. Handler code preserved (no risk if someone calls it directly), но only `generate-recurring-invoices` is now scheduled.

In pg_cron:
```
jobid 9 | generate-recurring-invoices | 5 6 * * * | active
```

Verified firing yesterday `06:05:00 UTC succeeded, 200 {"generated":0,"errors":[]}`.

**Recurring invoice generation IS happening — just under the newer endpoint name.** Не gap в functionality, gap только в the name `recurring-invoices`.

---

## What's в vercel.json now (67 lower-priority)

Mostly informational / weekly digests / internal hygiene:
- Weekly digests (`weekly-summary`, `weekly-digest`, `weekly-report`, `weekly-insights`, `ai-weekly-insights`)
- Monthly reports (`monthly-digest`, `monthly-review`, `monthly-revenue-forecast`, `monthly-health-score`, `monthly-win-rate`)
- Annual/quarterly (`annual-year-review`, `quarterly-review`, `quarter-sprint`, `quarterly-tax-digest`)
- Client engagement (`client-anniversary`, `client-greetings`, `client-checkins`, `special-dates-greeting`, `winback-reminder`, `re-engagement`)
- Internal alerts (`scope-creep-alert`, `burnout-alert`, `capacity-alert`, `at-risk-clients`, `client-revenue-drop`, `slow-month-alert`, etc.)
- Hygiene (`cleanup-oauth-states`, `api-key-digest`)

Per Vercel Observability data, of these 67, only ~10 fire reliably from Vercel scheduler. The other ~57 may also be dropped but they're low-priority enough that occasional misses don't block launch (digests just не arrive on rare days).

If Vercel engineer eventually fixes scheduler: all 67 fire properly. If they don't: low-priority crons may miss days, но launch isn't blocked because money flows are 100% reliable через pg_cron.

---

## Honest non-overclaim

- "0 overlaps" is exact — confirmed via `set & set` operation on full lists.
- 1 "intentional gap" (recurring-invoices) is design choice, not oversight; verified by checking `generate-recurring-invoices` fired successfully yesterday при time 06:05 UTC.
- vercel.json's 67 крон remaining still depend on Vercel scheduler's ~15% reliability. They're not launch-critical so this is acceptable, but **the same crons would benefit from pg_cron** if migration scope expanded. Backlog idea for post-launch.
- This audit doesn't check the cron HANDLER for idempotency (handlers SHOULD be idempotent — e.g. payment-reminders checks invoice status before sending). Trust но verify if a handler ever shows up в incidents.

— Agent 5, 2026-05-31
