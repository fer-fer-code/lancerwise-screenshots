# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-21 (revised post Stage 2 probe verdict)
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.
**Trajectory:** continuing improvement; Stage 1 v3 PASS; Stage 2 shipped с partial verdict.

**Phase 1 N+1 — MISSION COMPLETE (2026-05-22):** All 4 hot N+1 routes closed.
- #73 /dashboard (Context Provider, PRs #84+#86) — 22→0
- #74 /invoices/[id] (Server prefetch, PR #91) — 10→0
- #93 /work/time (Context Provider, PRs #119+#126+#127+#129) — 125→**3** (-97%)
- #94 /settings (Server prefetch, PRs #132+#135) — 27→**2** (-93%), WebKit unexpected win preserved
Full synthesis: [`audit/agent1-launch-readiness-master/CLOSURES-2026-05-21.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-21.md). **Critical path remaining: smoke testing only.**

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

## What remains (revised post Phase 1 N+1 COMPLETE)

### Critical path

| Item | Status | Time | Notes |
|---|---|---|---|
| **Smoke testing execution** | ⏳ ACTIVE | ~2-2.5h wall-clock (с 3-agent parallelism) | Protocol designed: [`SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md). 11 flows × 2 locales × 2 viewports × 3 auth states. [AGENT 3] browser flows, [AGENT 4] Sentry correlation, [AGENT 1] visual capture review. |
| Final sign-off | ⏳ post-smoke | ~30 min | Ramiz go/no-go signal based on smoke verdict. |

**Critical-path duration: ~2.5-3h focused work** (smoke + sign-off).

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
| Smoke testing (3-agent parallel) | 2-2.5h wall-clock | T+2:30 |
| Final smoke triage + sign-off | 30 min | **T+3:00** |

**Optimistic ETA: ~2-2.5 hours wall-clock** от Phase 1 closure (2026-05-22).

### Realistic (с typical retry, rework, surprises)

| Step | Realistic time | Reason for slippage |
|---|---|---|
| Smoke testing execution | 2.5-3h wall-clock | 11 flows × varied cells; possible P0/P1 surface findings mid-run |
| Smoke-surface mid-run fixes | 1h buffer | Typical 1-2 P1 polish fixes mid-smoke; hotfix workflow per POST-LAUNCH-DAY-1-RUNBOOK |
| Final smoke triage + sign-off | 30 min | Ramiz go/no-go decision |

**Realistic ETA: ~3-4 hours wall-clock** post Phase 1 closure.

---

## Critical path bottlenecks (today's view)

1. **#94 /settings** — only remaining functional code blocker. ~3-4h optimistic / ~7-8h realistic. Server-prefetch + initialProps pattern (per [AGENT 1] diagnosis).
2. **QA campaign** — can run в parallel с #94; critical path is slowest tester.

**No longer на critical path (now closed):**
- ~~S1+S2 Turnstile bypass + server-side CAPTCHA~~
- ~~S3+S4+S5 RLS leaks~~
- ~~S6/I5/I6 PII + Path F~~
- ~~#114 + #115 auth flow~~
- ~~Privacy/ToS GDPR review~~
- ~~S9 #116 middleware bypass~~
- ~~#93 /work/time N+1 (Phase 1 closed, 80 widgets, 4 PRs, -97% fetch reduction)~~

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

**Earliest reasonable launch: ~2-2.5 hours from now (2026-05-22, post Phase 1 N+1 closure).**
**Realistic launch: ~3-4 hours wall-clock (2026-05-22).**

Phase 1 N+1 MISSION COMPLETE. All 4 hot routes closed. ~184 mount-time REST calls eliminated к 5 across the codebase. WebKit /settings + /work/time render fully restored. **No remaining code blockers.** Only smoke testing protocol execution stands between current state и launch trigger.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
- [`CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — today's 12 closures inventory
