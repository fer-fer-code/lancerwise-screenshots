# Functional QA Campaign — Live Coordination Tracker

**Coordinator:** [AGENT 1]
**Master issue:** [#206](https://github.com/fer-fer-code/lancerwise/issues/206) — Pre-launch functional testing — full CRUD coverage all modules
**Campaign start:** 2026-05-23T10:30 UTC
**Expected duration:** ~60 min execution + 15 min aggregation
**Scope:** Watch + aggregate only — [AGENT 1] does NOT execute tests

---

## Pre-campaign baseline (T+0 — 10:35 UTC)

### Issue inventory snapshot

- **Last issue number before campaign:** #206 (master tracking, no comments yet)
- **Pre-existing P0 functional bugs cited в #206 context:**
  - [#204](https://github.com/fer-fer-code/lancerwise/issues/204) — Invoice creation persists $0 (Ramiz manual finding)
  - [#205](https://github.com/fer-fer-code/lancerwise/issues/205) — Project Title input не принимает ввод (Ramiz manual finding)
- **New sub-issues since baseline:** 0 (issues ≥ #207 = none yet)
- **#206 comments:** 0

### Per-agent expected deliverables

| Agent | Area | Expected sub-issue area | Expected deliverable path |
|---|---|---|---|
| [AGENT 2] | Invoices full CRUD | bugs found на invoice create/edit/delete/list | `audit/agent2-functional-qa-invoices-2026-05-23/RESULT.md` |
| [AGENT 3] | Projects + Clients CRUD | bugs на project + client create/edit/delete | `audit/agent3-functional-qa-projects-clients-2026-05-23/RESULT.md` |
| [AGENT 4] | Time tracking + Tasks | bugs на timer / time entries / tasks | `audit/agent4-functional-qa-time-tasks-2026-05-23/RESULT.md` |
| [AGENT 5] | Contracts + Settings | bugs на contract / settings save | `audit/agent5-functional-qa-contracts-settings-2026-05-23/RESULT.md` |
| [AGENT 6] | Analytics + Notifications + Auth | bugs на analytics / notif / auth flows | `audit/agent6-functional-qa-analytics-notif-auth-2026-05-23/RESULT.md` |

### Launch decision threshold (per #206)

| FAIL count | Action |
|---|---|
| 0 P0 | LAUNCH as scheduled (PH Tuesday May 26) |
| ≤ 3 P0 | fix + retest, launch as scheduled |
| > 5 P0 OR any data-loss bug | LAUNCH DELAYED until fix sprint complete |

---

## Live polling log

Polling cadence: T+15 / T+30 / T+45 / T+60 min ticks. Updates appended below.

### T+0 (10:35 UTC) — campaign just started
- Baseline established; no sub-issues yet, no RESULT.md files yet
- All 5 agents в-flight per #206 assignment
- [AGENT 1] coordination role armed

### T+15 (TBD)
*(awaiting poll)*

### T+30 (TBD)
*(awaiting poll)*

### T+45 (TBD)
*(awaiting poll)*

### T+60 (TBD) — aggregation window
*(awaiting all 5 RESULT.md files OR comment surface на #206)*

---

## Aggregated findings (post-T+60)

*(TODO — populates когда all 5 agents report)*

### P0 count
*(TBD)*

### P1 count
*(TBD)*

### P2 count
*(TBD)*

### Areas с most failures
*(TBD ranked)*

### Fix priority recommendation
*(TBD — based on data-loss severity + user-visibility)*

### Launch decision recommendation
*(TBD — applies threshold above)*

---

## Cross-references

- Master issue: [#206](https://github.com/fer-fer-code/lancerwise/issues/206)
- Pre-existing P0s: [#204](https://github.com/fer-fer-code/lancerwise/issues/204) + [#205](https://github.com/fer-fer-code/lancerwise/issues/205)
- Launch runbook: [`audit/agent1-launch-runbook-2026-05-23/LAUNCH-RUNBOOK.md`](../agent1-launch-runbook-2026-05-23/LAUNCH-RUNBOOK.md)
- Worktree pattern note: [`audit/agent1-launch-runbook-2026-05-23/WORKTREE-PATTERN.md`](../agent1-launch-runbook-2026-05-23/WORKTREE-PATTERN.md)
