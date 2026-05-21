# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-21 (revised post Stage 2 probe verdict)
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.
**Trajectory:** continuing improvement; Stage 1 v3 PASS; Stage 2 shipped с partial verdict.

**Stage 2 v2 PASS (2026-05-21T13:16 UTC):** PR #129 deployed at commit `23c191fb`. [AGENT 3] final verdict 5/5 PASS — **Chromium fetch count 3** (target <10, **-97% vs baseline ~95**). [AGENT 4] Sentry watch CLEAN. Phase 1 N+1 (#93) **CLOSED**. 80 widgets total migrated across Stages 1+1.5+2+2v2. Residual: 1 out-of-scope (GlobalTimerBar) + 2 P3 polish candidates filed as [#130](https://github.com/fer-fer-code/lancerwise/issues/130) post-launch.

---

## Today's closures (2026-05-20) — 13 items verified shipped (1 reverted)

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
- ❌ ~~B3.1 #93 /work/time Stage 1 — DataProvider + Promise.all infrastructure~~ (PR #119 merged + deployed но [AGENT 3] probe caught 100% Chromium widget tree crash; fix-forward Stage 1 v2 в flight by [AGENT 2])

---

## What remains (revised post Stage 2 v2 PASS)

### Critical path

| Item | Status | Time | Notes |
|---|---|---|---|
| **#94 /settings N+1** | ⏳ **ACTIVE** — diagnosis ready | ~3-4h optimistic / ~7-8h realistic | [AGENT 1] diagnosis в `audit/agent1-94-settings-diagnosis/`. Server-prefetch + initialProps pattern recommended (different от #93 Provider). 28 antipattern widgets, ~59 mount-fetches к eliminate. |
| Final smoke + sign-off | ⏳ post-#94 | ~1-2h | Multiple full-flow checks desktop/mobile/EN/RU |

**Critical-path duration: ~4-6h focused work** (#94 + smoke).

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
| #94 /settings | 3-4h | T+4:00 |
| Re-baseline | 1h | T+5:00 |
| QA campaign sweep (parallel с #94) | overlapping; tail = ~1h | T+5-6:00 |
| Final smoke + sign-off | 1-2h | **T+5-7:00** |

**Optimistic ETA: ~5-7 hours focused work** from 2026-05-21 post-Stage-2-v2-PASS.

### Realistic (с typical retry, rework, surprises)

| Step | Realistic time | Reason for slippage |
|---|---|---|
| #94 /settings N+1 (server-prefetch + initialProps) | 7-8h | 28 widgets across 16 subroutes; Next.js client/server boundary edge cases |
| Re-baseline | 2h | Capture + manual review + commit |
| QA campaign | 12-18h | Typically surfaces 3-5 new P2/P3 items requiring small fixes mid-campaign |
| Last-minute findings | 2-4h | Buffer |
| Final smoke + sign-off | 2-3h | Multiple full-flow checks desktop/mobile/EN/RU |

**Realistic ETA: ~7-10 hours focused work** (#94 + QA campaign tail). About **1-1.5 work-days**.

---

## Critical path bottlenecks (today's view)

1. **#93 Stage 1 v2 fix-forward** — quick unblocker (~30-60 min), но must complete before Stage 2 can start.
2. **#93 Stage 2 widget migration** — biggest single bottleneck remaining. ~3-5h.
3. **QA campaign** — can run в parallel с code work; critical path is slowest tester.
4. **#94 /settings** — parallel к #93 Stage 2, different files.

**No longer на critical path (now closed):**
- ~~S1+S2 Turnstile bypass + server-side CAPTCHA~~
- ~~S3+S4+S5 RLS leaks~~
- ~~S6/I5/I6 PII + Path F~~
- ~~#114 + #115 auth flow~~
- ~~Privacy/ToS GDPR review~~
- ~~S9 #116 middleware bypass~~

---

## Dependencies

```
#94 /settings ─→ Re-baseline ─→ Final smoke ─→ Launch decision
                                    ↑
                                    │
                       QA campaign (memory #11)
                       (runs в parallel с code work)
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

**Sprint 1a (Stage 1 v2 fix-forward — в progress now):**
- [AGENT 2] #93 Stage 1 v2 — restore Provider data-shape contract
- [AGENT 3] post-merge probe (4-cell × 3-run matrix) before declaring PASS

**Sprint 1b (perf cluster — post Stage 1 v2):**
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

**Earliest reasonable launch: ~5-7 hours from now (2026-05-21 evening UTC).**
**Realistic launch: ~7-10 hours focused (2026-05-21 / early 2026-05-22).**

Phase 1 N+1 (#93) closed at Stage 2 v2 PASS — single largest remaining code blocker eliminated. Only #94 /settings stands between current state и feature-complete pre-launch code. QA campaign can run в parallel.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
- [`CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — today's 12 closures inventory
