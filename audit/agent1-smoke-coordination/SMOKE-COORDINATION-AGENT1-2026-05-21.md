# Smoke Testing Coordination — [AGENT 1] Tracking Doc

**Author:** [AGENT 1]
**Date:** 2026-05-22 (was 2026-05-21 trigger date — execution starts)
**Role:** Coordinator + visual capture review + email render review + final synthesis writer
**Protocol reference:** [`audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md)

---

## Trigger state

- [AGENT 1] smoke trigger received: ✅ (this task)
- [AGENT 3] expected к receive parallel trigger для browser flows (F1-F11)
- [AGENT 4] expected к receive parallel trigger для Sentry/API/email correlation
- Ramiz watching для P0 escalation

---

## Coordination interface

### Evidence inflow paths I'm watching

| Source agent | Expected output path | What | My action when populated |
|---|---|---|---|
| [AGENT 3] | `audit/agent3-smoke-execution/EVIDENCE/cell_<flow>_<engine>_<locale>.json` | Per-flow metrics | Cross-check against pre-smoke baseline + production curl |
| [AGENT 3] | `audit/agent3-smoke-execution/EVIDENCE/<flow>_<engine>_<locale>_run<n>.png` | Screenshots per cell × run | Visual capture review — flag regressions, layout, locale leaks |
| [AGENT 3] | `audit/agent3-smoke-execution/VERDICT-SMOKE-v1.md` | Per-flow PASS/FAIL verdict | Incorporate в final synthesis |
| [AGENT 4] | `audit/agent4-smoke-execution/SENTRY-CORRELATION.md` | 15-min Sentry watch results | Cross-correlate с [AGENT 3] flow timing |
| [AGENT 4] | `audit/agent4-smoke-execution/API-SAMPLE-CHECKS.md` | Critical API endpoint sample results | Verify against PRELAUNCH I9 + I12 deltas |
| [AGENT 4] | `audit/agent4-smoke-execution/EMAIL-CHANNEL.md` | F9 email send verdict (Resend dashboard correlation) | Pair с my email render review |

### Drop-conditions / surface к Ramiz

I surface к Ramiz via Telegram immediately if:

| Trigger | Severity | Action |
|---|---|---|
| Any [AGENT 3] flow returns P0 verdict (auth dead, RLS leak, payment broken) | P0 | Halt smoke, escalate, do not continue к next flow |
| [AGENT 3] reports browser blocker (MCP issue, captcha trap, etc.) | depends on cause | Surface к Ramiz; assess workaround |
| [AGENT 4] reports Sentry P0 alert firing | P0 | Halt smoke, escalate |
| Either agent silent > 30 min mid-execution | yellow | Ping к Ramiz, may indicate stalled work |
| Critical API sample returns 5xx (auth, dashboard data, time-tracker widget-data, settings, unsubscribe) | P0 | Surface immediately |

---

## My deliverable tasks (sequencing)

### Phase A — Reactive (during [AGENT 3] / [AGENT 4] execution)

- [ ] **A1.** Visual capture review per [AGENT 3] screenshot batch
  - Each screenshot compared к pre-smoke baseline OR design spec
  - Flag any: layout shift, missing assets, broken UI, RU/EN locale leak, mobile responsive break
  - Document per-screenshot finding в tracking table below

- [ ] **A2.** Email render review (post F9 / coordinated с [AGENT 3])
  - Sample transactional email triggered via F9 flow
  - Inbox capture (Gmail/Apple Mail/Outlook web — at least 1 visual capture)
  - Verify: unsubscribe link clicks-through correctly + returns 200 + records в email_unsubscribe_log
  - Render check: dark-mode readable, mobile email client compatible, no broken HTML
  - Document в EMAIL-RENDER-REVIEW table below

- [ ] **A3.** Surface escalations к Ramiz via Telegram (if any P0/P1 triggers per criteria above)

### Phase B — Final synthesis (post [AGENT 3] + [AGENT 4] completion)

- [ ] **B1.** Aggregate all findings into single categorized table (P0/P1/P2/P3)
- [ ] **B2.** Write `SMOKE-FINAL-SYNTHESIS-2026-05-21.md` в `audit/agent1-launch-readiness-master/`
- [ ] **B3.** Final go/no-go recommendation к Ramiz: PROCEED / FIX-FORWARD then LAUNCH / DEFER
- [ ] **B4.** Commit + push synthesis + Telegram notify Ramiz с verdict

---

## Tracking tables (filled as evidence arrives)

### Visual capture review

| Flow | Cell | Run | Screenshot file | Finding | Severity |
|---|---|---|---|---|---|
| (awaiting) | | | | | |

### Email render review

| Email type | Recipient inbox | Render verdict | Unsubscribe verdict | Notes |
|---|---|---|---|---|
| (awaiting F9 execution) | | | | |

### [AGENT 3] per-flow status

| Flow | Status | Verdict | Notes |
|---|---|---|---|
| F1 Sign-up + Turnstile | ⏳ pending | — | — |
| F2 Email verification | ⏳ pending | — | — |
| F3 Sign-in | ⏳ pending | — | — |
| F4 Onboarding wizard | ⏳ pending | — | — |
| F5 Create first entities | ⏳ pending | — | — |
| F6 Dashboard widgets | ⏳ pending | — | — |
| F7 /work/time render | ⏳ pending | — | — |
| F8 /settings render | ⏳ pending | — | — |
| F9 Email send | ⏳ pending | — | — |
| F10 LemonSqueezy redirect | ⏳ pending | — | — |
| F11 Password reset | ⏳ pending | — | — |

### [AGENT 4] per-channel status

| Channel | Status | Verdict | Notes |
|---|---|---|---|
| Sentry 15-min watch | ⏳ pending | — | — |
| Critical API sample (/api/auth/*, /dashboard/widget-data, /time-tracker/widget-data, /settings/*, /unsubscribe) | ⏳ pending | — | — |
| Email channel (Resend dashboard correlation) | ⏳ pending | — | — |
| Vercel logs sample | ⏳ pending | — | — |

---

## Cross-references

- [`SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md) — execution plan
- [`PRELAUNCH-CHECKLIST.md`](../agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md) — pre-smoke checklist
- [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) — triage paths if P0 fires
- [`CLOSURES-2026-05-21.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-21.md) — pre-smoke state (Phase 1 N+1 complete)
