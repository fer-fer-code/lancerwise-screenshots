# /api/ai/risk persistent failure — RESOLVED via `force-dynamic` export

**Date:** 2026-05-17
**Resolution PR:** #28 (commit `adb137e98f83dfe2410a7af57f2bd5147623a3ee`)
**Resolution deploy:** `dpl_HECNSDycb7drZb2oCZMidJjVPbdx` — READY 14:51:08 UTC
**First post-fix success:** 14:51:08 + ~1h29m → 16:20:56 UTC (reviewer-triggered traffic)

---

## Final result

```
SELECT count(*) FILTER (WHERE error_code IS NULL) AS successes,
       count(*) FILTER (WHERE error_code IS NOT NULL) AS failures,
       min(occurred_at), max(occurred_at),
       array_agg(DISTINCT provider), array_agg(DISTINCT model)
FROM ai_usage_log
WHERE feature='risk-assessment' AND occurred_at > '2026-05-17 14:51:08+00';
→ successes=1 failures=0
  first/last call=2026-05-17 16:20:56.319395+00
  providers={gemini-flash} models={gemini-2.5-flash}
```

Pre-fix window (same 4h pre-deploy, no auth flow change):
```
→ successes=0 failures=370 (100%)
  error_code = 'GEMINI_API_KEY not configured' (370/370)
  affected_user = test-phase10@example.com (single user, dashboard polling)
```

---

## What combination actually worked

The full chain applied across this incident:

| # | Fix | PR | Effect on /api/ai/risk |
|---|-----|----|----|
| A0 | Lazy SDK init `getAI()` (per-call env re-read) | #15 | gemini.ts module healed for SOME routes; /api/ai/risk still failing |
| A1 | Same lazy pattern for groq.ts | #16 | groq.ts healed (fallback chain still warm); /api/ai/risk still failing |
| B | `VERCEL_FORCE_NO_BUILD_CACHE=1` env var (project-wide) | (env config) | Forces fresh bundles per build; /api/ai/risk still failing |
| C | Hot-touch comment в /api/ai/risk/route.ts changing bundle hash | #16,#17 | /api/ai/risk still failing |
| D | Cluster 8 hot-touch (B2 cluster touched many /lib/ai consumers) | #26 | Still no recovery for /api/ai/risk |
| **A** | **`export const dynamic = 'force-dynamic'` on /api/ai/risk + /api/ai/budget** | **#28** | **✅ FIXED — first success 16:20:56 UTC** |

**Minimal sufficient fix (suspected):** A (force-dynamic export).
**Could not isolate cleanly:** B + D were already applied when A landed, so we can't 100% prove A alone suffices. But: B+D were live for >2h before A and produced zero recoveries (370 failures, 0 success). The only state-change between "100% fail" and "100% success" was deploying A. Strong inference: A is the load-bearing fix.

---

## Root cause (working hypothesis)

Next.js 15 App Router has implicit static-render inference for Route Handlers. When the handler's module graph appears not to depend on any dynamic functions/request-time signals during Next's analysis, the route can be **pre-rendered at build time**. For a Route Handler that's pre-rendered, `process.env.X` reads execute at build time too — they're captured INTO the route bundle as the env values the build environment saw.

If during the build environment the env var binding was transiently missing (e.g. cold-start race on the build worker itself, or rotation gap), the route bundle PERMANENTLY embeds `apiKey = undefined` for the lifetime of that bundle. The lazy `getAI()` in /lib/ai/gemini.ts couldn't help, because `process.env.GEMINI_API_KEY` in the FROZEN BUNDLE always returned the build-time captured value (undefined).

`export const dynamic = 'force-dynamic'` opts the route out of static-render inference entirely. The route is now guaranteed to evaluate `process.env.GEMINI_API_KEY` at request time, picking up the live encrypted-env value from the running function instance.

**Why /api/cron/* and /api/comms-draft worked all along:** those route bundles had dynamic signals (request body parsing, cookies, etc.) that Next.js's inference treated as request-time dependencies, automatically opting them out of static render. /api/ai/risk and /api/ai/budget did not have such signals strong enough for inference — both are simple POST/GET that the inference treated as static-capable.

---

## New per-cluster invariant (added to migration playbook)

After each cluster's deploy reaches READY, agent MUST self-trigger a verification probe before moving к next cluster:

1. Pick а cron route that touches /lib/ai (e.g. `/api/cron/weekly-insights`).
2. Hit it with `Authorization: Bearer $CRON_SECRET`:
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" https://lancerwise.com/api/cron/weekly-insights
   ```
3. Then query ai_usage_log for the past 5 min:
   ```
   SELECT count(*) FILTER (WHERE error_code IS NULL),
          count(*) FILTER (WHERE error_code IS NOT NULL),
          max(error_code)
   FROM ai_usage_log
   WHERE occurred_at > now() - interval '5 minutes';
   ```
4. ANY failure with `error_code LIKE '%API_KEY not configured%'` → STOP, suspect static-render inference, add `force-dynamic` to recently-touched routes.
5. Pass = proceed к next cluster.

Cron routes always work (they explicitly use dynamic signals + `dynamic = 'force-dynamic'` is already standard in /api/cron/*). They serve as а reliable health-check proxy for /lib/ai.

---

## Backlog (post-launch cleanup)

Once all clusters are migrated and the incident dust settles, audit /api/ai/* AND /api/v1/ai/* для routes that may be silently susceptible to the same static-render inference trap:

* Look for handlers WITHOUT: `cookies()`, `headers()`, `request.json()`, `request.formData()`, `searchParams`, or `dynamic = 'force-dynamic'`.
* Such routes are candidates for the same failure mode.
* Recommendation: add `export const dynamic = 'force-dynamic'` to ALL /api/ai/* routes preemptively (cheap, prevents recurrence).

---

## Coordination

[AGENT 2] resuming B2 cluster 9 (files 201-225, range: `late-fee-notice` → `niche-positioning`, 25 endpoints).
[AGENT 1] working Bug #001 batches 7-11 (no overlap).
[AGENT 3] P1 security fixes (no overlap).
