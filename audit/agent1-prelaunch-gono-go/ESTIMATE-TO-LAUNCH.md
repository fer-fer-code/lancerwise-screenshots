# Estimate-to-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Method:** Sum hours from open blockers; identify critical path; surface dependencies.

---

## Optimistic timeline (everything goes well, no rework)

Assumes: PR #103 merges cleanly, PR #97 merges cleanly, fixes pass CI first try, no unforeseen security/perf findings during final smoke.

| Step | Time | Cumulative |
|---|---|---|
| PR #103 merge (#99 + #100 RLS) | ~30 min (post-verification approval done) | T+0:30 |
| PR #97 merge (PII scrub + #87 Path F) | ~30 min | T+1:00 |
| #101 testimonials fix (drop 3 policies, change default, deploy) | ~1h | T+2:00 |
| #94 /settings N+1 (3-4h focused) | 3-4h | T+5-6:00 |
| #93 /work/time N+1 (6-8h focused) | 6-8h | **T+11-14:00** |
| Re-baseline post-perf-fixes ([AGENT 3]) | ~1h | T+12-15:00 |
| QA campaign sweep (memory #11) | 6-10h focused across 4 agents | T+18-25:00 |
| Final smoke + sign-off | ~1-2h | T+20-27:00 |

**Optimistic ETA: ~20-27 hours focused work от 2026-05-20 03:50 UTC.** Roughly **1.5-2 work-days** if все agents parallel and no surprises.

---

## Realistic timeline (с typical retry, rework, surprises)

Assumes: 30-40% overhead from CI flakes, baseline drift, last-minute findings, scope reconciliation.

| Step | Realistic time | Reason for slippage |
|---|---|---|
| PR #103 merge | ~1h | Branch protection + CI gates can flake on visual-regression |
| PR #97 merge | ~1h | Same |
| #101 testimonials fix | ~2h | Includes regression check on testimonial display pages + schema migration tracking quirks |
| #94 /settings N+1 | 5-6h | Settings has 41 widgets across many sub-pages; testing surface broad |
| #93 /work/time N+1 | 8-12h | 101 widgets is the biggest refactor of this class. Real-device iOS validation adds time. |
| Re-baseline | ~2h | Capture + manual review + commit |
| QA campaign | 12-18h | Typically surfaces 3-5 new P2/P3 items requiring small fixes mid-campaign |
| Last-minute findings | 4-6h | Buffer for unforeseen issues that surface during campaign |
| Final smoke + sign-off | 2-3h | Multiple full-flow checks across desktop/mobile/EN/RU |

**Realistic ETA: ~36-50 hours focused work.** Roughly **3-4 work-days** with parallel agents.

---

## Critical path bottlenecks

The chain that determines fastest-possible launch:

1. **#93 /work/time N+1 (6-8h optimistic, 8-12h realistic)** — the **biggest single bottleneck**. 101 widgets. Cannot be parallelised because it's all one file/route. Must serialise on one engineer.
2. **QA campaign (6-10h optimistic, 12-18h realistic)** — must follow code-freeze of перf fixes. Can be parallelised across agents, но critical path is the slowest tester.
3. **PR #103 merge** — gates next #101 fix (similar surface area, want к deploy in sequence к isolate diff effects).

**Other items are parallel и not on critical path:**
- #97 PII scrub — independent, can ship anytime
- #94 /settings — can ship in parallel с #93 (different files)
- D2/D3 (runbooks) — documentation, не gating
- D4 (legal review) — out-of-band, can run async

---

## Dependencies

```
PR #103 (#99 + #100) ─┐
PR #97 (PII scrub) ───┼─→ Final smoke ─→ Launch decision
#101 testimonials ────┤
#94 /settings ────────┤
#93 /work/time ────────┘
       ↓
   QA campaign (memory #11)
       ↓
   re-baseline ([AGENT 3])
       ↓
   Sign-off
```

#103 has my approval comment posted; awaits [AGENT 2] merge action. Once merged, #101 should follow within the same security-fix sprint.

---

## What could push timeline out further

| Risk | Probability | Cost |
|---|---|---|
| #93 fix introduces new regression (React error #418 fix complicates) | medium | +4-6h |
| QA campaign surfaces new P1 (not just P2/P3) | low-medium | +8-12h |
| Visual-regression baseline drifts again post-fix | medium | +2h per re-baseline |
| Legal review of Privacy/ToS surfaces blocking change | low | +2-4h |
| LemonSqueezy live-payment issue with first real customers | low | +emergency cycle (~1-2h) |
| iOS real-device test on /work/time still crashes (different cause) | low-medium | +unknown, would need re-investigation |

---

## Recommended sequence

Given the dependencies and critical path:

**Sprint 1 (security cluster) — within hours:**
- Merge PR #103 (S3 + S4)
- Merge PR #97 (S6 + I5 + I6)
- Fix + ship #101 (S5)
- All under [AGENT 2] + [AGENT 4]

**Sprint 2 (performance cluster) — same day:**
- #94 /settings (~4h) — start as soon as PR #103 merged
- #93 /work/time (~8h, parallel) — same start

**Sprint 3 (QA campaign) — next 1-2 days:**
- Memory #11 trigger
- All 4 agents в parallel surfaces
- Fixtures ready (PR #88 draft)

**Sprint 4 (final smoke + launch):**
- Re-baseline performance
- Verify все security re-probe (anon SELECT each affected table)
- Sign-off

---

## Honest assessment

**Earliest reasonable launch: ~2 calendar days от now (2026-05-22).**
**Realistic launch: ~3-4 calendar days (2026-05-23 к 2026-05-24).**

If forced к launch sooner с some items deferred, см. RISK-ACCEPTANCE.md для what's safe vs not.

## Cross-references

- PRELAUNCH-CHECKLIST.md — full item status
- RISK-ACCEPTANCE.md — what's defer-able с monitoring
