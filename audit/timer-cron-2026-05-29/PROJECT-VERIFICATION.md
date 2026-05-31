# Project verification — confirming we're looking at the right Vercel project

**Date:** 2026-05-31 05:15 UTC
**Triggered by:** Ramiz's prudent check before pg_cron Phase 2 commitment
**Question:** "вдруг мы смотрим cron-логи НЕ в том кабинете/проекте Vercel, и кроны на самом деле работают, просто не там смотрим"
**Verdict:** **МЕСТО ВЕРНОЕ. Проблема реальная.**

---

## Six-check verification table

| # | Check | Expected | Actual | Status |
|---|---|---|---|---|
| 1 | Project ID matches | `prj_OfYhgE1ONf98IhDzAMzspTr7hC1A` | `prj_OfYhgE1ONf98IhDzAMzspTr7hC1A` (confirmed via Vercel UI Settings → General → Project ID field) | ✅ MATCH |
| 2 | Team / account ownership | The team owning prod lancerwise | `fer-fer-codes-projects` (Pro plan) | ✅ |
| 3 | Production domain bound | `lancerwise.com` + `www.lancerwise.com` | Both attached: `lancerwise.com 308 → www`, `www.lancerwise.com Production`, `lancerwise.vercel.app 301 → www` | ✅ |
| 4 | Observability env filter | Production view | "Production" selected; "All environments" view shows IDENTICAL 4 rows (no hidden preview fires) | ✅ |
| 5 | Same project for 4 firing + 22 silent | One project | Both in same `prj_OfYhgE1...` Observability Cron Jobs view — identical filter, identical screen | ✅ |
| 6 | No duplicate Vercel project | One canonical | Found `lancerwise-agent2` sidecar — investigated: **No Deployment, 0 crons configured**, only domain `lancerwise-agent2.vercel.app`. Empty placeholder. NOT a duplicate config. | ✅ NOT a dupe |

---

## Detail per check

### (1) Project ID

Vercel UI → Settings → General → Project ID block shows:

```
prj_OfYhgE1ONf98IhDzAMzspTr7hC1A
```

Ramiz's note had typos (`prj_OfYhgE10Nf98IhDzANzspTr7hC1A` — `0/O` and `N/M` swap). Canonical from UI matches the value used throughout audit.

Screenshot: [verify-project-id-settings.png](./verify-project-id-settings.png)

### (2) Team

URL path: `/fer-fer-codes-projects/lancerwise/...` → team slug `fer-fer-codes-projects`. Pro plan badge visible. Logged in as `krokusstudia2@gmail.com` / `fer-fer-code` GitHub identity.

### (3) Production domain

Vercel UI → Settings → Domains:

```
lancerwise.com         Valid Configuration   308 → www.lancerwise.com
www.lancerwise.com     Valid Configuration   PRODUCTION
lancerwise.vercel.app  Valid Configuration   301 → www.lancerwise.com
```

`www.lancerwise.com` is the **active Production target** of this project. Same hostname serving https://www.lancerwise.com today.

### (4) Environment filter

Observability → Cron Jobs page:
- **Production** filter: 4 cron routes с invocations
- **All environments** filter: identical 4 cron routes (no hidden preview fires)
- **Last 24 hours**: 4 routes
- **Last 7 days**: same 4 routes

No environment-filter mask. Fires aren't hiding в preview.

### (5) Same project: 4 firing vs 22 silent

Both populations come from the same Observability table:
- Visible rows = `auto-stop-timers`, `payment-reminders`, `invoice-reminders`, `apply-late-fees`
- Missing rows (22 silent) — they simply have 0 invocations, so don't appear (table only shows routes с invocations > 0)

Cross-reference в `vercel.json` (same project, deployed via main branch): all 96 staggered cron paths registered, including the 22 silent ones. Confirmed via Vercel UI → Settings → Cron Jobs which lists all 96 staggered schedules registered against this project.

### (6) Duplicate Vercel project check

Team list filtered by "lancer":
- `lancerwise` ← main project с production domain (this one)
- `lancerwise-agent2` ← sidecar:
  - URL: `https://vercel.com/fer-fer-codes-projects/lancerwise-agent2`
  - Domains tab: `lancerwise-agent2.vercel.app` **No Deployment**
  - Cron Jobs tab: shows "Get Started" tutorial (0 crons configured)
  - Settings → Git: "Connect Git Repository" — not connected
  - **Verdict: empty placeholder, NOT a duplicate cron-config source**

No other projects matching "lancer*" в team.

---

## Cross-check evidence — host of one working invocation

From my earlier diagnostic curl on May 29 14:14 UTC:

```
MAY 29 14:14:48.57 GET 200 www.lancerwis... /api/cron/auto-stop-timers
```

Logged в Runtime Logs of `prj_OfYhgE1ONf98IhDzAMzspTr7hC1A` (same project where we see Observability "alive" entries). Host = `www.lancerwise.com` = this project's primary alias.

The working scheduled fires (auto-stop-timers May 30 06:00, payment-reminders May 30 08:00 etc.) **must hit the same hostname** since they appear в the same project's logs. Vercel cron scheduler is calling this project's cron endpoints through this project's canonical hostname.

The 22 silent crons would land in the same logs IF they fired. They don't — confirmed not a "looking-in-wrong-place" issue.

---

## Conclusion

**Ramiz's prudent gate cleared.** No project mismatch, no environment mismatch, no duplicate project hiding fires. The 4-firing-vs-22-silent pattern is genuinely on prj_OfYhgE1ONf98IhDzAMzspTr7hC1A с Vercel scheduler dropping ~85% of scheduled cron invocations.

**Phase 2 pg_cron migration is justified.** No risk of migrating crons we just couldn't see — they truly aren't firing.

— Agent 5, 2026-05-31
