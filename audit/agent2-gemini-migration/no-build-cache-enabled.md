# VERCEL_FORCE_NO_BUILD_CACHE=1 enabled (project-wide)

**Date:** 2026-05-17 14:23 UTC
**Status:** Live в production + preview Vercel envs.

## Why

After PR #15 lazy-env hotfix landed, /api/ai/risk endpoint kept failing 100%
of the time с "GEMINI_API_KEY not configured" while cron routes (same
import path, same env) succeeded 100% of the time.

Diagnosis (per audit/agent2-gemini-migration/12-risk-endpoint-still-broken.md):
Vercel/Next.js incremental build cache serves а pre-PR-#15 compiled bundle
для routes whose source files haven't been modified. /api/ai/risk hadn't
been touched since PR #10, so the cached build предшествует PR #15 lazy fix.

Hot-touch worked transiently (PR #20) but subsequent deploys evicted the
fresh bundle и reverted к the cached pre-PR-#15 version.

## Fix applied (Option B from reviewer)

```
$ curl -X POST .../v10/projects/$PID/env -d '{"key":"VERCEL_FORCE_NO_BUILD_CACHE","value":"1","type":"plain","target":["production"]}'
→ id 4jzajAKWSlXQcGOv
$ curl -X POST .../v10/projects/$PID/env -d '{"key":"VERCEL_FORCE_NO_BUILD_CACHE","value":"1","type":"plain","target":["preview"]}'
→ id n94TH5nfmHLYzeGS
$ vercel env pull --environment=production
→ VERCEL_FORCE_NO_BUILD_CACHE=1 ✓
```

Forces Vercel к skip cache lookup и rebuild all routes от source on every deploy.

## Trade-offs

* **Cost:** +3 min per deploy (was ~3 min, now ~8 min observed на cluster 8 build).
* **Benefit:** Persistent fix. No stale bundles. Lazy gemini.ts code reliably ships к every route.
* **Scope:** Production + preview только. Development скан excluded.

## Post-launch cleanup

Once all 364 /api/v1/ai/* endpoints migrate к /lib/ai (cluster 15) и Anthropic
direct calls are eliminated, the lazy fix is universally present и build cache
becomes safe again.

**Then:** delete the env var via:
```
curl -X DELETE .../v10/projects/$PID/env/4jzajAKWSlXQcGOv?teamId=$TID
curl -X DELETE .../v10/projects/$PID/env/n94TH5nfmHLYzeGS?teamId=$TID
```

Deploys go back к ~3 min. Track в `audit/agent2-gemini-migration/post-launch-cleanup-todo.md`.

## Evidence

* Cluster 8 deploy `dpl_7KBqiaTLyqq455YPMVp3tYtpWKxh` first build с VERCEL_FORCE_NO_BUILD_CACHE active
* Build time: ~8 min (vs ~3 min с cache) — confirms cache skip
* Post-deploy probe: 6 cron calls all success (5 Groq fallback от Gemini RPM, 1 Gemini)
* Risk-assessment recovery: pending natural traffic (waiting Ramiz dashboard hit OR cron trigger)
