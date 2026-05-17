# [AGENT 2] Persistent /api/ai/risk failures — STOP for escalation

**Date:** 2026-05-17 12:15 UTC
**Status:** Cluster 5 deployed. /api/ai/risk endpoint continues к fail despite:

1. ✅ gemini.ts lazy fix in main (PR #15)
2. ✅ groq.ts lazy fix in main (PR #16)
3. ✅ Multiple `vercel deploy --prod --force` cycles
4. ✅ Confirmed source on main has correct lazy code
5. ✅ Verified deploy aliases point к latest deploy
6. ✅ Cron routes (/api/cron/weekly-insights) WORK с lazy code
7. ❌ /api/ai/risk continues throwing `GEMINI_API_KEY not configured`

## Pattern

| Route | Bundle | Status |
|---|---|---|
| `/api/cron/weekly-insights` | My touches via B1 migration | ✅ WORKS |
| `/api/cron/friday-summary` | My touches via B1 | ✅ WORKS |
| `/api/v1/ai/* (B2 c1-5 endpoints)` | My touches via B2 migrations | ✅ WORKS (verified в smoke probes) |
| `/api/ai/risk` | NOT touched by me since PR #10 | ❌ FAILS |

Smoking gun: routes I'VE TOUCHED в recent commits work. Routes I HAVEN'T touched continue failing.

## Hypothesis

Vercel's function bundle cache is keyed by route source file mtime/hash. If а route file hasn't been modified, Vercel reuses а cached bundle that includes а STALE copy of gemini.ts (the version from when /api/ai/risk's bundle was last built).

`vercel deploy --prod --force` is documented к invalidate cache, but appears к invalidate only the build outputs, не the cached function bundles in lambda layer storage.

## Workaround к unblock production

Touch `/api/ai/risk/route.ts` with а no-op change (whitespace, comment) к force its bundle к rebuild. Same для other untouched routes if needed.

But ALSO — there are 596 direct-Anthropic endpoints (most of B2-B5 backlog) whose function bundles probably ALL have stale gemini.ts dependency. As я migrate each batch, the bundles for THAT batch get rebuilt и pick up lazy gemini.ts. So the migration plan itself is the long-term fix. Until migration completes, untouched-yet routes will have stale gemini.ts. 

For routes already on /lib/ai but не touched by B2 (just /api/ai/risk + /api/ai/budget — 2 endpoints), apply hot-touch fix immediately.

## Immediate proposed action

1. Make а no-op touch к /api/ai/risk/route.ts (add comment) к force its function bundle rebuild
2. Same для /api/ai/budget/route.ts
3. Deploy с --force
4. Verify failures stop
5. Resume B2

## Stop condition met — escalate

Per reviewer protocol "Stop and report immediately if [...] Production endpoint returns 5xx (any rate)" — /api/ai/risk is the dashboard's RiskWidget endpoint, failing for every authenticated user hitting dashboard.

Awaiting reviewer green light for the hot-touch workaround OR alternative direction.
