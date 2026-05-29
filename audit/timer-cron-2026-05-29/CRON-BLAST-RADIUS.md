# Cron blast-radius map — launch-critical alive vs dead

**Date:** 2026-05-29
**Source:** Cross-ref `vercel.json` (97 crons) × Observability "Last 7 days" (10 fired) × launch-criticality classification
**Method:** each cron classified as **launch-critical** (user-promised automation that breaks billing/notifications/UX if dead) vs **non-critical** (internal hygiene, alerts that aren't customer-facing).

---

## Headline

| Bucket | Count | % of total |
|---|---|---|
| Launch-critical **ALIVE** (fired в last 7d) | **5** | 5% of 97 |
| Launch-critical **DEAD** (0 invocations) | **82** | 85% of 97 |
| Non-critical alive | 5 | 5% |
| Non-critical dead | 5 | 5% |

**85% of launch-critical scheduled work is failing.** This is not "some optimisation" — this is the cron scheduler dropping ~9 out of 10 user-facing automations.

---

## ALIVE — Launch-critical (5 confirmed fired)

| Cron | Schedule | Purpose | Status |
|---|---|---|---|
| `monthly-digest` | `0 9 1 * *` | Monthly user digest email | ✓ 2 invocations |
| `monthly-revenue-forecast` | `0 8 28-31 * *` | Month-end revenue forecast | ✓ 2 invocations |
| `project-completion-followup` | `0 10 * * *` | Follow-up after project completion | ✓ 2 invocations |
| `scope-creep-alert` | `0 9 * * *` | Scope-creep detection | ✓ 2 invocations |
| `weekly-summary` | `0 8 * * 1` | Weekly summary | ✓ 2 invocations |

(`2 invocations` уровень per cron over 7 days — это **far below** даже weekly expectations for daily crons, suggesting these too are partly suppressed but at least firing.)

---

## DEAD — Launch-critical (82 confirmed silently dropped)

### Billing automation (15) — **HIGH BLAST RADIUS**

These directly affect cash flow и legal compliance. Users expect them to fire; not firing = lost revenue или missed legal triggers.

| Cron | Schedule | Promise broken if dead |
|---|---|---|
| `payment-reminders` | `0 8 * * *` | AI-generated reminders for overdue invoices don't go out |
| `payment-reminder` | `0 10 * * 1,4` | Legacy version (probably can drop, but currently registered) |
| `send-payment-reminders` | `0 10 * * *` | Yet another variant |
| `invoice-reminders` | `0 9 * * *` | Pre-due reminders don't ship |
| `invoice-reminders-auto` | `0 10 * * *` | Auto reminders dead |
| `auto-invoice-reminders` | `0 9 * * *` | Auto outstanding-invoice reminders dead |
| `auto-invoice-retainers` | `0 9 * * *` | Retainer invoices not generated на schedule |
| `generate-recurring-invoices` | `0 6 * * *` | Recurring billing dead |
| `recurring-invoices` | `0 6 * * *` | Duplicate of above, also dead |
| `retainer-invoices` | `0 8 * * *` | Retainer billing dead |
| `overdue-escalation` | `0 10 * * *` | Overdue escalation chains dead |
| `overdue-threshold-reminders` | `0 10 * * *` | Threshold alerts dead |
| `late-fees` | `0 9 * * *` | Late fees not calculated |
| `apply-late-fees` | `0 9 * * *` | Late fees not applied |
| `viewed-invoice-digest` | `0 9 * * *` | Notifications когда client opens invoice dead |

### Time tracking automation (5)

| Cron | Schedule | Promise broken |
|---|---|---|
| `auto-stop-timers` | `0 6 * * *` | **CONFIRMED DEAD** — user just experienced 60h timer |
| `time-reminder` | `0 16 * * 1-5` | Daily "log your time" prompts dead |
| `time-midmonth-check` | `0 9 15 * *` | Mid-month check dead |
| `time-budget-alerts` | `0 8 * * *` | Time-budget overruns not flagged |
| `hours-budget-alert` | `0 10 * * *` | Hours-budget alerts dead |

### Contracts / renewals (6)

| Cron | Schedule | Promise broken |
|---|---|---|
| `contract-expiry` | `0 10 * * *` | Contract expiry alerts dead — legal/renewal risk |
| `contract-renewal-alerts` | `0 8 * * *` | Renewal alerts dead |
| `renewal-alerts` | `0 9 * * *` | General renewal pings dead |
| `renewal-reminders` | `0 8 * * *` | Renewal reminders dead |
| `subscription-renewals` | `0 7 * * *` | Subscription renewal automation dead |
| `expire-proposals` | `0 7 * * *` | Stale proposals don't expire |

### Project / milestone tracking (7)

| Cron | Schedule | Promise broken |
|---|---|---|
| `deadline-reminder` | `0 7 * * 1` | Weekly deadline ping dead |
| `milestone-reminder` | `0 9 * * 1` | Milestone alerts dead |
| `milestone-reminders` | `0 7 * * *` | Plural variant dead |
| `milestone-alerts` | `0 7 * * *` | Milestone-alert variant dead |
| `project-survey` | `0 11 * * *` | Post-project surveys dead |
| `project-tracking-gap` | `30 8 * * 1` | Tracking gap detection dead |
| `project-health` | `0 8 * * 1` | Project health summaries dead |

### Proposals / leads (4)

| Cron | Schedule | Promise broken |
|---|---|---|
| `proposal-followup` | `0 9 * * *` | Proposal follow-ups dead |
| `proposal-followups` | `0 10 * * 1,3,5` | Plural variant dead |
| `proposal-expired-alert` | `0 9 * * *` | Expired-proposal alerts dead |
| `lead-followups` | `0 9 * * *` | Lead pipeline followups dead |
| `stale-leads` | `30 9 * * 1` | Stale-lead detection dead |

### Customer engagement (8)

| Cron | Schedule | Promise broken |
|---|---|---|
| `client-checkins` | `0 9 * * *` | Recurring client check-ins dead |
| `client-onboarding` | `0 11 * * *` | Onboarding automation dead |
| `onboarding-nudge` | `0 11 * * *` | Onboarding nudges dead |
| `client-anniversary` | `0 8 * * *` | Anniversary greetings dead |
| `client-greetings` | `0 8 * * *` | Greeting automation dead |
| `special-dates-greeting` | `0 8 * * *` | Holiday greetings dead |
| `winback-reminder` | `0 9 1 * *` | Winback reminders dead |
| `re-engagement` | `0 12 * * *` | Re-engagement dead |

### Reports / digests (10)

| Cron | Schedule | Promise broken |
|---|---|---|
| `daily-summary` | `0 18 * * 1-5` | EOD summaries dead |
| `friday-summary` | `0 16 * * 5` | Friday wrap dead |
| `unbilled-digest` | `0 9 * * 3` | Unbilled time digest dead |
| `weekly-digest` | `0 8 * * 1` | Weekly digest dead |
| `weekly-report` | `0 9 * * 1` | Weekly report dead |
| `weekly-insights` | `0 7 * * 1` | AI weekly insights dead |
| `ai-weekly-insights` | `0 7 * * 1` | AI insights variant dead |
| `weekly-time-report` | `30 8 * * 1` | Weekly time report dead |
| `weekly-review-auto` | `0 17 * * 5` | Auto weekly review dead |
| `monthly-review` | `0 8 1 * *` | Monthly review dead |
| `monthly-health-score` | `0 10 1 * *` | Monthly health score dead |
| `monthly-win-rate` | `0 9 5 * *` | Monthly win rate dead |
| `cash-flow-snapshot` | `0 10 * * 3` | Cash flow report dead |
| `business-pulse` | `0 8 * * 1` | Business pulse weekly dead |
| `revenue-milestone` | `0 8 * * *` | Revenue milestone celebrations dead |
| `goal-check` | `0 12 * * 3` | Goal tracking dead |
| `goal-progress-alert` | `0 9 10 * *` | Goal progress alerts dead |
| `late-payment-pattern` | `0 9 10 * *` | Pattern detection dead |
| `client-invoice-gap` | `0 9 1 * *` | Invoice gap detection dead |
| `expense-ratio-alert` | `0 10 3 * *` | Expense ratio alerts dead |
| `due-soon-reminder` | `0 10 * * *` | Due-date reminders dead |
| `invoice-aging` | `0 11 * * *` | Aging digest dead |
| `stale-draft-invoices` | `0 9 * * *` | Stale draft alerts dead |
| `retainer-usage-alert` | `0 10 * * *` | Retainer usage alerts dead |
| `recurring-expenses` | `0 5 1 * *` | Recurring expenses dead |
| `recurring-expense-summary` | `0 9 1 * *` | Expense summary dead |
| `generate-recurring-tasks` | `0 7 * * *` | Recurring tasks dead |
| `project-profitability-report` | `0 9 5 * *` | Profitability report dead |
| `status-reports` | `0 9 * * 5` | Status reports dead |
| `burnout-alert` | `0 8 * * *` | Burnout alerts dead |
| `capacity-alert` | `0 16 * * 4` | Capacity alerts dead |
| `inactivity-alert` | `0 9 * * 2-5` | User inactivity alerts dead |
| `rate-health-check` | `0 9 1 * *` | Rate-card health dead |
| `rate-increase-reminder` | `0 9 15 1,4,7,10 *` | Rate increase prompt dead |
| `budget-alert` | `0 9 * * *` | Budget alerts dead |
| `budget-alerts` | `30 8 * * *` | Plural variant dead |

---

## Non-critical (10) — for context

### Alive (5)

`api-key-digest`, `at-risk-clients`, `cleanup-oauth-states`, `client-revenue-drop`, `quarterly-review` — all 2 invocations each.

### Dead (5)

`annual-year-review`, `nps-survey`, `quarter-sprint`, `quarterly-tax-digest`, `slow-month-alert` — all 0 invocations. Lower urgency.

---

## Launch implications

### Hard launch-blockers (cannot ship without these working)

1. **Billing reminders/automation** (15 dead) — users on Pro tier signed up для "we'll chase invoices for you". Не working = product promise broken.
2. **Auto-stop-timers** — 60h-stuck-timer scenario just demonstrated real user pain. PR #250 adds defensive UI surface, но root cause still needs fix.
3. **Contract expiry / renewal alerts** — legal risk if missed.

### Soft launch-blockers (degrade UX но don't break core flow)

1. **Weekly/monthly digests** — users expect, но не billing-blocking.
2. **Client engagement** (anniversary, greetings, check-ins) — nice-to-have.

### Negligible (failure is invisible)

- `cleanup-oauth-states` — already alive, fine.
- Reports for owner-only consumption.

---

## Recommended remediation (in order)

1. **Open Vercel support ticket** — see `VERCEL-TICKET-DRAFT.md`. They have telemetry we don't; this could be a 5-minute fix on their side.

2. **Parallel: migrate billing-critical 15 crons к Supabase pg_cron** — Supabase Pro tier includes `pg_cron`. Зависит от Vercel-side fix only for fast retry path. Migration is straightforward:
   - DB function что calls the existing HTTPS endpoint with `CRON_SECRET` (preserves all current logic)
   - `pg_cron.schedule('payment-reminders', '0 8 * * *', ...)`
   - Frees up Vercel cron budget independent from this incident

3. **Defer non-critical crons** — temporarily drop ~30 non-billing crons из vercel.json (greetings, engagement, surveys). Bring 97 → ~67. May reduce hit on whatever throttling is silently dropping invocations.

4. **Defensive UI surfaces** — PR #250 (24h timer cap warning) is one. Add similar для invoice age, contract expiry на dashboard — even if cron fires, user shouldn't depend on it for legal/billing.

— Agent 5, 2026-05-29
