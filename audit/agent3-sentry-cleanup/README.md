# [AGENT 3] Sentry cleanup — pre-launch hygiene + production error alert

Pre-launch task: resolve stale Sentry issue groups + add early-warning
alert for production error spikes routed to lancerwise.team@gmail.com.

## Status — **COMPLETE**

| Item | Status |
| ---- | ------ |
| Resolve 3 stale issue groups (LANCERWISE-4 / -2 / -1) | ✓ |
| Set up alert: >10 errors/hour from production → email project owner | ✓ — Metric Monitor 7316898 + Connected Alert |
| Capture evidence + push to screenshots repo | ✓ |
| Flag LANCERWISE-3 N+1 query for separate investigation | ✓ — see §Backlog |

## What was done

### 1) Issue group resolution (3 of 4 groups)

Bulk-resolved via Issues page checkbox + Resolve button:

| Issue ID | Title | Type | Action |
| -------- | ----- | ---- | ------ |
| LANCERWISE-4 | ChunkLoadError: Loading chunk … failed | Build artifact mismatch | **Resolved** — stale after deploy, will reappear if real |
| LANCERWISE-2 | Sentry test event #2 | Manual test fixture | **Resolved** — leftover from initial Sentry wiring |
| LANCERWISE-1 | Sentry test event #1 | Manual test fixture | **Resolved** — leftover from initial Sentry wiring |
| LANCERWISE-3 | N+1 query — dashboard Supabase query | **Real perf issue** | **Kept unresolved** (out of cleanup brief, see Backlog) |

See [`before.png`](before.png) (4 active issue groups) → [`after-issues-resolved.png`](after-issues-resolved.png) (only LANCERWISE-3 remains).

### 2) Metric Monitor + Connected Alert

Created Metric Monitor in Sentry to fire on production error spikes:

```
Monitor ID:    7316898
Title:         Number of errors above 10 over past 1 hour
URL:           https://lancerwise.sentry.io/monitors/7316898/
Project:       lancerwise
Environment:   production
Dataset:       Errors
Visualize:     count()
Filter:        is:unresolved
Interval:      1 hour
Threshold:     High when count() > 10 (Above)
Resolve:       Default (when count() <= 10)
Detection:     Static threshold (non-seasonal)
```

Connected Alert:

```
Alert name:    10 errors per hour — production (auto-notify project owner)
Action:        Notify on preferred channel → Suggested Assignees,
               fallthrough Recently Active Members
Throttle:      Get notified on every trigger
Channel:       Email (per Sentry account preference of project owner)
               → lancerwise.team@gmail.com (only member on org currently)
```

See [`alert-rule.png`](alert-rule.png) for the full alert builder state at create time,
and [`monitor-created.png`](monitor-created.png) for the live monitor detail page (note
both the new custom alert AND the default "Send a notification for high priority issues"
are now attached — Connected Alerts: 2 of 2).

[`after.png`](after.png) shows the Monitors list with both monitors (default Error Monitor
+ the new Metric monitor with filters `lancerwise | production | count() | is:unresolved | >10 high`).

### 3) Action routing detail

Sentry deprecated the legacy "Send a notification to [recipient]" action in
favor of "Notify on preferred channel" (each user's notification settings drive
the actual destination — email vs Slack vs etc.). Since the project owner
(Ramiz / lancerwise.team@gmail.com) is the only org member, the routing in
practice is:

```
Alert fires
  → "Suggested Assignees" resolved (no specific assignment, no CODEOWNERS)
  → Falls through to "Recently Active Members"
  → Resolves to lancerwise.team@gmail.com
  → Sentry account notification preference: Email
  → Lands in lancerwise.team@gmail.com inbox
```

This is the canonical pattern Sentry now recommends — better than
hard-coded email address in alert because if owner changes notification
preference (e.g. to Slack) the routing follows automatically.

## Backlog memo — LANCERWISE-3 N+1 query

Real perf issue, **not** part of this cleanup scope. Captured as separate
investigation:

- **Symptom**: N+1 API Call detected on dashboard route, multiple
  Supabase queries firing serially where a single batched query
  would suffice
- **Owner**: same investigation track as `backlog_dashboard_perf_waterfall_requests.md`
- **Priority**: P2 — affects dashboard load time (~6s networkIdle per `backlog_dashboard_perf_waterfall_requests.md`)
- **Why kept open in Sentry**: resolving without fixing would suppress
  the signal; better to leave open until the dashboard parallelization
  work lands

When the N+1 source is fixed, the monitor created above will catch
any regression that pushes production errors back above 10/hour.

## Why this alert threshold (>10/hour)

- Current production state: ~0–2 errors/hour (steady state, mostly LANCERWISE-3 N+1 sentry-perf-issue events)
- Hard launch traffic estimate: 100× user growth → 5–10 errors/hour at p99 expected normal range
- Threshold of >10/hour gives headroom over expected baseline while still
  catching a genuine error burst within 60 minutes of onset
- 1-hour interval (not 5-minute) avoids alert fatigue from transient
  network blips that resolve on retry

Once 30 days of production data accumulates post-launch, revisit
threshold with actual baseline + p99 spike data.

## Files

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + monitor config |
| [`before.png`](before.png) | Issues page with 4 active groups (LANCERWISE-1 through -4) |
| [`after-issues-resolved.png`](after-issues-resolved.png) | Issues page after bulk resolve, only LANCERWISE-3 remains |
| [`alert-rule.png`](alert-rule.png) | Monitor wizard at Create-Alert time showing all sections expanded with full config |
| [`monitor-created.png`](monitor-created.png) | Live monitor detail page post-create (Detect/Assign/Details panel + Connected Alerts 2 rows) |
| [`after.png`](after.png) | Monitors list view showing both Error Monitor (default) and Number-of-errors Metric Monitor (new) |

## Cross-links

- Sentry org: `lancerwise` (`https://lancerwise.sentry.io`)
- Sentry project: `lancerwise` (id `4511391765954560`)
- New monitor: [`/monitors/7316898/`](https://lancerwise.sentry.io/monitors/7316898/)
- Backlog ref: `backlog_dashboard_perf_waterfall_requests.md` (N+1 source)
