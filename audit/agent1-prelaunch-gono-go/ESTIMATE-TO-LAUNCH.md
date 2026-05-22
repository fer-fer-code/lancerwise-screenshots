# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-22 evening (🚨 **REVISED** — [AGENT 3] comprehensive QA surfaced 1 P0 + 6 P1)
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.
**Trajectory:** Phase 1 N+1 closed cleanly. **[AGENT 3] QA Sweep surfaced 7 new pre-launch blockers** что reset critical path.

---

## 🚨 CRITICAL RESET — 2026-05-22 evening

**Previous "ready к launch in ~30 min" state has been revised.** [AGENT 3] independent comprehensive QA (commits 95558dc / 8732fc3 / 37784d5 / feda749 / 861812c) surfaced:

- **1 P0 launch-blocker** — [#154](https://github.com/fer-fer-code/lancerwise/issues/154) middleware crash on malformed cookie (~15 min fix)
- **6 P1 broken UX** — [#155](https://github.com/fer-fer-code/lancerwise/issues/155)/[#156](https://github.com/fer-fer-code/lancerwise/issues/156)/[#157](https://github.com/fer-fer-code/lancerwise/issues/157)/[#158](https://github.com/fer-fer-code/lancerwise/issues/158) + FAB ([AGENT 2] in flight)
- **10 P2 + 15 P3** filed as post-launch backlog (#159-#182)

[AGENT 3] verdict: ❌ DO NOT LAUNCH until P0 fixed.

**Revised pre-launch fix sequence + estimate:**

| # | Issue | Time | Owner |
|---|---|---|---|
| 1 | [#154](https://github.com/fer-fer-code/lancerwise/issues/154) P0 middleware cookie crash (1-line try/catch) | ~15 min | TBD |
| 2 | FAB Quick Add backdrop overlap | ~15 min | [AGENT 2] in flight |
| 3 | [#156](https://github.com/fer-fer-code/lancerwise/issues/156) /upgrade Current-plan + Upgrade-to-Pro contradiction | ~30 min | TBD |
| 4 | [#158](https://github.com/fer-fer-code/lancerwise/issues/158) /clients/pipeline NaN + KPI mismatch | ~1-2h | TBD |
| 5 | [#157](https://github.com/fer-fer-code/lancerwise/issues/157) Timezone UTC hardcoded | ~2-4h | TBD |
| 6 | [#155](https://github.com/fer-fer-code/lancerwise/issues/155) i18n authed routes (KPI/headers/CTAs) | ~4-8h | TBD |

**P0 + 6 P1 fix subtotal: ~7.5-15h focused work.**

After fixes:
- Re-run AGENT 3 cookie variant probe (~10 min)
- Re-run smoke test full sequence (~2-3h wall-clock с parallelism)
- Final Ramiz go/no-go sign-off (~30 min)

**Revised earliest realistic launch: Day 2 evening (2026-05-23 evening) OR Day 3 (2026-05-24).**

---

## Phase 1 N+1 — MISSION COMPLETE (2026-05-22):
All 4 hot N+1 routes closed.
- #73 /dashboard (Context Provider, PRs #84+#86) — 22→0
- #74 /invoices/[id] (Server prefetch, PR #91) — 10→0
- #93 /work/time (Context Provider, PRs #119+#126+#127+#129) — 125→**3** (-97%)
- #94 /settings (Server prefetch, PRs #132+#135) — 27→**2** (-93%), WebKit unexpected win preserved
Full synthesis: [`audit/agent1-launch-readiness-master/CLOSURES-2026-05-21.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-21.md). ~~Critical path remaining: smoke testing only.~~ → **Critical path RESET — see 🚨 above.**

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

## Revised timelines (2026-05-22 evening reset)

### Optimistic (parallel fix work, no rework, single round of smoke)

| Step | Time | Cumulative |
|---|---|---|
| P0 #154 middleware cookie fix | 15 min | T+0:15 |
| FAB backdrop ([AGENT 2] in flight) parallel с P0 | 15 min wall (parallel) | T+0:15 |
| P1 #156 upgrade CTA conditional | 30 min | T+0:45 |
| P1 #158 pipeline NaN + KPI alignment | 1h | T+1:45 |
| P1 #157 timezone helper + audit | 2h | T+3:45 |
| P1 #155 i18n authed routes (KPI labels, headers, CTAs) | 4h | T+7:45 |
| Re-run [AGENT 3] cookie variant probe | 10 min | T+7:55 |
| Smoke test full sequence (3-agent parallel) | 2h wall-clock | T+9:55 |
| Final triage + Ramiz go/no-go | 30 min | **T+10:25** |

**Optimistic ETA: ~10-11 hours focused work** от 2026-05-22 evening reset.

### Realistic (с typical rework, multiple smoke iterations, mid-fix discoveries)

| Step | Realistic time | Reason for slippage |
|---|---|---|
| P0 #154 fix + verify | 30 min | confirm cookie regex, write test |
| FAB backdrop fix | 30 min | mobile responsive testing |
| P1 #156 + #158 | 2.5h | combined; pipeline KPI may need data-shape research |
| P1 #157 timezone | 4h | helper + audit + replace ~15-20 surfaces |
| P1 #155 i18n | 6-8h | KPI labels + headers + CTAs + form fields + page titles across 8+ routes; translation review |
| Smoke retest (1st round) | 3h | full coverage; surface mid-run issues likely |
| Mid-smoke hotfix buffer | 1-2h | typical 1-2 P1 polish fixes per smoke iteration |
| Smoke retest (2nd round if needed) | 1.5h | if fixes landed, abbreviated focused retest |
| Final sign-off | 30 min | Ramiz go/no-go |

**Realistic ETA: ~18-22 hours focused work = 1-2 calendar days с typical breaks.**

**Earliest realistic launch trigger: 2026-05-23 evening (Day 2) OR 2026-05-24 (Day 3).**

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

## Honest assessment (2026-05-22 evening reset)

**Earliest reasonable launch: 2026-05-23 evening (Day 2)** — only if P0 + 4 of 6 P1s fix cleanly + first-round smoke passes без mid-run surfaces.

**Realistic launch: 2026-05-24 (Day 3)** — accounts for typical rework + i18n translation review iteration + smoke iteration.

Phase 1 N+1 mission successfully closed earlier today. But [AGENT 3] independent comprehensive QA surfaced **1 P0 launch-blocker + 6 P1 broken-UX items** that reset the critical path. **The P0 alone (bare Vercel 500 on malformed cookie) cannot ship — it strands real users с no recovery CTA.** The 6 P1s (especially the i18n authed-route gap on /upgrade conversion surface) would damage quality perception on launch.

Recommendation: NO LAUNCH until **P0 + ≥4 of 6 P1s fixed + full smoke retest passes**. P3+P2 (#159-#182) deferred к post-launch backlog where they belong.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
- [`CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — today's 12 closures inventory
