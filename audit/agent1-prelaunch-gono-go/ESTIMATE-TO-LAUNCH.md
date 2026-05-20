# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20 (revised T+19:15 UTC — evening snapshot)
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.
**Trajectory:** dramatically improved since morning estimate — see "Today's closures" below.

**Evening update:** 2 additional closures shipped between 18:00 and 19:15 UTC — PR #119 (#93 Stage 1 infrastructure) + PR #122 (#116 next 16.2.6 middleware bypass cluster). Production now serving `9d54ff73`. Total today's closures: **14**.

---

## Today's closures (2026-05-20) — 14 items shipped

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
- ✅ **S9 #116 Next.js 16.2.4 → 16.2.6 middleware bypass cluster** (PR #122, deployed `9d54ff73` 18:14 UTC)
- ✅ **B3.1 #93 /work/time Stage 1 — DataProvider + Promise.all infrastructure** (PR #119, same deploy)

---

## What remains (revised T+19:15 evening)

### Critical path

| Item | Status | Time | Notes |
|---|---|---|---|
| #93 /work/time Stage 2 (widget migration к provider consumer) | ⏳ [AGENT 2] in flight | ~3-5h focused | Stage 1 infrastructure landed via #119. Stage 2 = migrating 95+ widgets к consume the new DataProvider context. |
| #94 /settings N+1 | ⏳ queued | ~3-4h | Can ship parallel к #93 Stage 2 (different files) |
| Final smoke + sign-off | ⏳ post-fixes | ~1-2h | Multiple full-flow checks desktop/mobile/EN/RU |

**Critical-path duration: ~6-8h focused work** (assumes #93 Stage 2 ⊕ #94 parallel — max(#93 Stage 2, #94) + smoke).

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
| #93 Stage 2 + #94 в parallel (max=#93 Stage 2) | 3-5h | T+5:00 |
| Re-baseline | 1h | T+6:00 |
| QA campaign sweep (parallel) | overlapping; tail = ~1h after #93 | T+6-7:00 |
| Final smoke + sign-off | 1-2h | **T+7-9:00** |

**Optimistic ETA: ~6-8 hours focused work** from 2026-05-20T19:15 UTC. **Within а work-day** with parallel agents.

### Realistic (с typical retry, rework, surprises)

| Step | Realistic time | Reason for slippage |
|---|---|---|
| #93 Stage 2 widget migration | 5-7h | 95+ widgets к refactor к provider consumer; iOS real-device validation adds time |
| #94 /settings N+1 | 5-6h | Settings has 41 widgets across many sub-pages; testing surface broad |
| Re-baseline | 2h | Capture + manual review + commit |
| QA campaign | 12-18h | Typically surfaces 3-5 new P2/P3 items requiring small fixes mid-campaign |
| Last-minute findings | 3-5h | Buffer for unforeseen issues |
| Final smoke + sign-off | 2-3h | Multiple full-flow checks desktop/mobile/EN/RU |

**Realistic ETA: ~10-15 hours focused work** (assumes #93 Stage 2 + #94 parallel, QA campaign tail). About **1.5-2 work-days**.

---

## Critical path bottlenecks (today's view)

1. **#93 Stage 2 widget migration** — biggest single bottleneck remaining. Foundation set by Stage 1; Stage 2 is the widget refactor.
2. **QA campaign** — can run в parallel с code work; critical path is slowest tester.
3. **#94 /settings** — parallel к #93 Stage 2, different files. Should ship before final smoke.

**No longer на critical path (now closed):**
- ~~S3+S4+S5 RLS leaks~~
- ~~S6/I5/I6 PII + Path F~~
- ~~#114 + #115 auth flow~~
- ~~Privacy/ToS GDPR review~~
- ~~S9 #116 middleware bypass~~
- ~~B3.1 #93 Stage 1 infrastructure~~

---

## Dependencies

```
#94 /settings ────────────────┐
#93 Stage 2 (widget migration)┼─→ Re-baseline ─→ Final smoke ─→ Launch decision
                              ┘                        ↑
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

**Sprint 1 (perf cluster — Stage 2 в progress now):**
- [AGENT 2] #93 /work/time Stage 2 (widget migration к DataProvider consumer)
- TBD #94 /settings (start parallel когда [AGENT 2] capacity allows)

**Sprint 2 (QA campaign — parallel с Sprint 1):**
- Memory #11 trigger met
- All 4 agents в parallel surfaces (with PR #88 draft fixtures)

**Sprint 3 (final smoke + launch):**
- Re-baseline performance
- Verify все security re-probe (anon SELECT each affected table)
- Sign-off

---

## Honest assessment

**Earliest reasonable launch: ~7-9 hours from now (2026-05-21 morning UTC, before noon).**
**Realistic launch: ~1-1.5 calendar days (2026-05-21).**

This is а **dramatic improvement** от morning estimate (which had ~36-50h realistic). Today's 14 closures collapsed nearly the entire blocker stack — only #93 Stage 2 + #94 remain on critical path, plus QA campaign.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
- [`CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — today's 12 closures inventory
