# TASK A — PR #110 Deploy Status

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Question:** Why is the changelog fix from PR #110 (merged 05:47 UTC) not visible on production?

---

## Verdict

**Deploy FAILED with OOM SIGKILL.** Production still serving old (cached + non-redeployed) bundle с stale "LemonSqueezy migration in progress" text. Known issue per `#97 Path F` (build infra hardening) — predicted к happen until enhanced build machines OR build optimization lands.

---

## Evidence

### PR + merge
- **PR:** [#110](https://github.com/fer-fer-code/lancerwise/pull/110)
- **State:** MERGED
- **Merge SHA:** `046bb0e31d0296b250138747610cb670ecf37d82`
- **Merged at:** 2026-05-20T05:47:26Z

### Vercel deployment record
- **Deployment ID:** `dpl_7V7JLU5JYUQD5Mi46yPXQPvs5Lv5`
- **GitHub deployment id:** `4752160299`
- **Environment:** Production
- **State:** `failure`
- **Created at:** 2026-05-20T06:30:21Z (~43 min after merge — Vercel queue lag)

### Failure cause (Vercel build logs)

```
2026-05-20T06:26:53Z  Cloning github.com/fer-fer-code/lancerwise (Branch: main, Commit: 046bb0e)
2026-05-20T06:26:57Z  Restored build cache from previous deployment
2026-05-20T06:26:57Z  Running "vercel build"
2026-05-20T06:26:58Z  Installing dependencies... up to date
2026-05-20T06:26:59Z  Detected Next.js version: 16.2.4
2026-05-20T06:27:00Z  ▲ Next.js 16.2.4 (Turbopack)
2026-05-20T06:27:01Z  Creating an optimized production build ...
2026-05-20T06:30:19Z  Error: Command "npm run build" exited with SIGKILL
2026-05-20T06:30:20Z  ▲ Build system report
2026-05-20T06:30:20Z  • At least one "Out of Memory" ("OOM") event was detected during the build.
2026-05-20T06:30:20Z  • This occurs when processes ... completely fill up the available memory (RAM)
2026-05-20T06:30:20Z  • To expand machine size ... enable Enhanced Builds
status   ● Error
```

Build machine config: **4 cores, 8 GB** — insufficient for Turbopack + Sentry + Next.js 16 production build.

Build time before kill: ~3 min 22 sec (within RAM-pressure window typical of large Next.js apps).

---

## What's live in production right now

Last successful production deploy: PR #107 (`7d36649c`) at 05:41 UTC.

This means:
- PR #103 (RLS hot-fix #99/#100) — ✅ deployed
- PR #105 (Privacy Policy + GDPR Art 13(2)(d)) — ✅ deployed (via #107's chain)
- PR #107 (testimonials RLS) — ✅ deployed
- **PR #110 (changelog fix) — ❌ NOT deployed** ← this one

Production curl confirms: `grep "in progress" /changelog → 1 match` (the line that PR #110 was supposed к remove).

---

## Recommended action

**Per Ramiz's task brief: "If failed OOM → known issue, document, retry после #97 Path F lands."**

### Action 1 — Do nothing immediate (recommended)
Mark deploy as known-OOM, document как pending until #97 Path F (enhanced build / Turbopack memory tuning) lands. Production continues serving стейл changelog text — minor cosmetic issue, не launch blocker.

### Action 2 — Manual retry (low value)
`vercel redeploy` против same commit would likely OOM again — memory ceiling didn't change. Unless an unrelated process competed для memory in the original build (rare), retry expected к fail same way.

### Action 3 — Workaround (if #110 desperately needed pre-launch)
- Enable Vercel Enhanced Builds (higher memory tier) — requires plan upgrade $$$
- OR cherry-pick the 1-line changelog change ONTO #107 base + push as а tiny patch that triggers another deploy attempt (risk: cumulative changes might still OOM)
- OR set `NODE_OPTIONS=--max-old-space-size=...` in Vercel env BUT 8GB ceiling is process-level, не V8-heap-level — won't help

### Action 4 — Wait for #97 Path F
[AGENT 4]'s build infra cluster #97 (per launch-readiness-master) addresses this. Path F specifically targets OOM patterns. Recommend prioritising #97 then retrying #110 as part of that batch.

---

## What I changed in operational docs

Adding к [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md):
- Build-OOM is а known prod-deploy failure mode — operators should not retry blindly
- Until #97 Path F: any merge к main has nontrivial chance of OOM on first build
- Mitigation: bundle commits into fewer pre-launch merges; defer cosmetic fixes к post-#97

This was not previously surfaced explicitly in operational runbooks; surfacing now.

---

## Severity assessment

| Dimension | Severity |
|---|---|
| Production user-visible impact | Low (cosmetic copy on /changelog page) |
| Launch blocker | No |
| Recurrence likelihood | High (until #97 lands) |
| Workaround available | Yes (defer) |
| Cost к fix vs cost к accept | Cost к fix > cost к accept (until #97) |

**Recommendation:** Defer. Add Sentry-equivalent "build failure" notification к Telegram so future OOMs are visible immediately rather than discovered hours later by chance verification (like today).

---

## Cross-references

- LAUNCH-READINESS-MASTER.md — #97 Path F context
- [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) — operational impact
- [Vercel deploy](https://lancerwise-tcbfmdz4k-fer-fer-codes-projects.vercel.app) — failed deployment URL (private)
- Inspect command: `npx vercel inspect dpl_7V7JLU5JYUQD5Mi46yPXQPvs5Lv5 --logs`
