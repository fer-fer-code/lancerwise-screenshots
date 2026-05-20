# Sentry Alert Spec — proposals migration drift canary

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Why this lives in a spec file (not API):** No Sentry token in agent's `.env.local`; per `backlog_sentry_token_event_admin.md` the existing v2 token lacks scope для mutating alert rules via API. UI configuration required.

---

## Recipe для Ramiz (3 min)

1. Open Sentry project [lancerwise](https://sentry.io/organizations/lancerwise/issues/) (replace с actual org slug if different).
2. **Settings → Alerts → Create Alert Rule**
3. Choose **Issues** → **When a new issue is created**

### Conditions (AND)

| Field | Value |
|---|---|
| Project | lancerwise-prod (and lancerwise-preview if want preview noise) |
| Event type | error |
| Filter | `message` contains `relation "public.proposals" does not exist` |
| Filter (alternative if message variant) | `message` contains `PGRST205` AND `message` contains `proposals` |
| Environment | production |

### Actions

| Action | Setting |
|---|---|
| **Send notification к Telegram** | Webhook URL: same one used by `notify.py` (see `feedback_telegram_notify.md`). Payload includes `event.message`, `event.transaction`, `event.user`. |
| **Send notification к email** | lancerwise.team@gmail.com (or per existing #435759 notification config) |
| **Severity** | High |

### Rate limit

Throttle: **5 minutes** between notifications для same fingerprint, to prevent storm from a runaway cron.

### Alert name

`proposals-table-missing` (slug-friendly for inclusion в Sentry inbox filters)

---

## Expected first trigger date

**2026-05-28 to 2026-05-31** — when `/api/cron/monthly-revenue-forecast` fires (`schedule: "0 8 28-31 * *"` per `vercel.json`).

This is the canary: if the alert fires before launch, then a test deploy hit the broken refs (good — caught early). If it fires post-launch only on May 28-31, that confirms expected behavior.

---

## What this alert protects against

| Scenario | What user-impact would have been без alert |
|---|---|
| External API consumer hits `/api/v1/proposals/[id]/accept` | 500 returned к caller, no internal signal |
| Monthly revenue forecast cron crashes | Missing or incomplete monthly email; no immediate signal until users notice |
| AI advisor's smart-brief silently degrades | Users get poor advice; no signal at all |
| Manual test / QA flow hits broken path | Sentry catches it within seconds |

---

## When к remove this alert

After #112 closed (refactor of 18 backend refs lands). The error should never fire post-fix.

Recommendation: keep alert in place 7 days after #112 merge — if no events, delete.

---

## Cross-references

- Issue [#112](https://github.com/fer-fer-code/lancerwise/issues/112) — the underlying drift
- `backlog_sentry_token_event_admin.md` — why Sentry API config requires UI
- `feedback_telegram_notify.md` — Telegram webhook convention
- Existing Sentry alert #435759 (P95 > 3s) — pattern reference for notification config
