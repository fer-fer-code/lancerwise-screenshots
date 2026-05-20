# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20 (revised T+18:00 UTC)
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.
**Trajectory:** dramatically improved since morning estimate — see "Today's closures" below.

---

## Today's closures (2026-05-20) — 12 items shipped

Documented в [`audit/agent1-launch-readiness-master/CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md). Highlights:

- ✅ S1+S2 Turnstile / server CAPTCHA enforcement
- ✅ I1+I2 CI auth + branch protection + 3 required gates
- ✅ I3 visual baseline refresh (PR #98)
- ✅ S3+S4 RLS #99/#100 anon-leak (PR #103)
- ✅ S5 #101 testimonials structural leak (PR #107)
- ✅ D4 Privacy/ToS GDPR Art. 13(2)(d) (PR #105)
- ✅ S6+I5+I6 PII scrub + source maps + Path F build (PR #97)
- ✅ #114 + #115 auth fragment handler + onboarding cookie banner (PR #117)
- ✅ #110 changelog stale text (deployed via #117 cascade)
- ✅ I8 Vercel Enhanced Builds / build memory (Path F validated post-deploy)
- ✅ Auth flow regression audit (7 flows × 2 locales)
- ✅ #112 + #113 follow-up investigations filed

---

## What remains (revised T+18:00)

### Critical path

| Item | Status | Time | Notes |
|---|---|---|---|
| #93 /work/time N+1 | ⏳ Phase 1 Stage 1 in progress ([AGENT 2]) | ~6-8h focused | Biggest single bottleneck — 101 widgets one route. Serialised on one engineer. |
| #94 /settings N+1 | ⏳ queued | ~3-4h | Can ship parallel к #93 (different files) |
| #116 next 16.2.6 middleware bypass | ⏳ needs owner | ~30 min | Quick fix; cluster с next minor security cascade |
| Final smoke + sign-off | ⏳ post-fixes | ~1-2h | Multiple full-flow checks desktop/mobile/EN/RU |

**Critical-path duration: ~7-10h focused work** (assumes #93 and #94 parallel — max(#93,#94) + #116 + smoke).

### Important но не strict blockers

| Item | Status | Time | Notes |
|---|---|---|---|
| QA campaign (memory #11) | ❌ not started | 6-10h parallel | Triggers met (LemonSqueezy live + P1-A done + auth audit done) |
| Re-baseline post-#93/#94 | ⏳ scheduled | ~1h | Capture + commit |
| D2 + D3 ([AGENT 4] runbooks) | ⏳ awaiting push | — | Minimal viable substitutes already в `audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md` |

QA campaign can run в parallel с #93/#94 work since it covers different surfaces. Re-baseline runs post-perf-fixes.

---

## Revised timelines

### Optimistic (everything goes well, parallel work)

| Step | Time | Cumulative |
|---|---|---|
| #93 + #94 в parallel (max=#93) | 6-8h | T+8:00 |
| #116 (concurrent с above) | 30 min | T+8:00 |
| Re-baseline | 1h | T+9:00 |
| QA campaign sweep (parallel) | overlapping; tail = ~1h after #93 | T+9-10:00 |
| Final smoke + sign-off | 1-2h | **T+10-12:00** |

**Optimistic ETA: ~7-10 hours focused work** from 2026-05-20T18:00 UTC. About **1 work-day** with parallel agents.

### Realistic (с typical retry, rework, surprises)

| Step | Realistic time | Reason for slippage |
|---|---|---|
| #93 /work/time N+1 | 8-12h | 101 widgets is biggest refactor of this class; iOS real-device validation adds time |
| #94 /settings N+1 | 5-6h | Settings has 41 widgets across many sub-pages; testing surface broad |
| #116 middleware bypass | 1h | npm upgrade + visual-regression baseline check |
| Re-baseline | 2h | Capture + manual review + commit |
| QA campaign | 12-18h | Typically surfaces 3-5 new P2/P3 items requiring small fixes mid-campaign |
| Last-minute findings | 4-6h | Buffer for unforeseen issues |
| Final smoke + sign-off | 2-3h | Multiple full-flow checks desktop/mobile/EN/RU |

**Realistic ETA: ~15-20 hours focused work** (assumes #93/#94 parallel, QA campaign tail). About **2 work-days**.

---

## Critical path bottlenecks (today's view)

1. **#93 /work/time N+1** — still biggest single bottleneck. Phase 1 Stage 1 in progress. Cannot be parallelised.
2. **QA campaign** — can run в parallel с code work; critical path is slowest tester.
3. **#116 middleware bypass** — quick when started, just needs owner picked up.

**No longer на critical path (now closed):**
- ~~S3+S4+S5 RLS leaks~~
- ~~S6/I5/I6 PII + Path F~~
- ~~#114 + #115 auth flow~~
- ~~Privacy/ToS GDPR review~~

---

## Dependencies

```
#94 /settings ────┐
#93 /work/time ───┼─→ Re-baseline ─→ Final smoke ─→ Launch decision
#116 next 16.2.6 ─┘                        ↑
                                            │
                              QA campaign (memory #11)
                              (runs в parallel)
```

---

## What could push timeline out

| Risk | Probability | Cost |
|---|---|---|
| #93 fix introduces new regression | medium | +4-6h |
| QA campaign surfaces new P0/P1 (not just P2/P3) | low-medium | +8-12h |
| Visual-regression baseline drifts again post-fix | medium | +2h per re-baseline |
| iOS real-device test on /work/time still crashes (different cause) | low-medium | +unknown, would need re-investigation |
| Vercel `runAfterProductionCompile` flake recurs | low | +retry-cycle (~30min) — monitored post-#97 incident |

---

## Recommended sequence

**Sprint 1 (perf cluster — in progress now):**
- [AGENT 2] #93 /work/time (Phase 1 Stage 1 → Stage 2)
- TBD #94 /settings (start parallel когда [AGENT 2] capacity allows)
- TBD #116 middleware-bypass upgrade (can start anytime, 30 min)

**Sprint 2 (QA campaign — parallel с Sprint 1):**
- Memory #11 trigger met
- All 4 agents в parallel surfaces (with PR #88 draft fixtures)

**Sprint 3 (final smoke + launch):**
- Re-baseline performance
- Verify все security re-probe (anon SELECT each affected table)
- Sign-off

---

## Honest assessment

**Earliest reasonable launch: ~10-12 hours from now (2026-05-21 morning UTC).**
**Realistic launch: ~1-2 calendar days (2026-05-21 к 2026-05-22).**

This is а **dramatic improvement** от morning estimate (which had ~36-50h realistic). Today's 12 closures collapsed most of the blocker stack — only the perf cluster (#93/#94) + #116 remain on critical path, plus QA campaign.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
- [`CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — today's 12 closures inventory
