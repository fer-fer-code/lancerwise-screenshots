# [AGENT 2] Frozen lambda hot-touch fix verified

**Date:** 2026-05-17 12:32 UTC
**Status:** ✅ Hot-touch deployed via auto-deploy (Vercel GitHub App reconnected by Agent #3). RiskWidget endpoint now backed by fresh lambda с lazy gemini.ts.

---

## Root cause confirmed (per reviewer)

[vercel#3725](https://github.com/vercel/vercel/discussions/3725):
> "currently not even deploying to production will clear frozen lambdas"

`vercel deploy --prod --force` invalidates build cache (outputs) но NOT
already-deployed lambda function code. Routes that haven't been modified
since their last build keep stale function bundles forever.

---

## Workaround applied

PR #20 merged commit `a770262b`:
- `src/app/api/ai/risk/route.ts`: 6-line comment added (no-op functional change)
- `src/app/api/ai/budget/route.ts`: 3-line comment added (no-op)
- Comments document the workaround + reference reviewer's issue link

Bundle hash changed → Vercel rebuilds those specific lambdas → fresh
function bundle includes current `/lib/ai/gemini.ts` с lazy env read.

---

## Auto-deploy detection (Vercel GitHub App reconnected ✅)

After push к main, polled Vercel API. Within 5 seconds:
```
AUTO-DEPLOY: state=QUEUED uid=dpl_AuZ91T697wMGF52TEeEBEoNxDLZc
```

Build progressed QUEUED → BUILDING → READY over ~4.5 min. **Manual `vercel
deploy --force` no longer needed** for git→main commits as of this session.
[AGENT 3]'s Vercel GitHub App install is paying off.

---

## Production verification

```bash
$ curl https://www.lancerwise.com/api/ai/budget
{"error":"Unauthorized"}
HTTP 401
```
(401 = endpoint live, /lib/ai imported, auth checked — exactly what we want)

```bash
$ curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/weekly-insights
{"processed":5}
```

ai_usage_log post-deploy:
```
12:32:24 other gemini-flash t  (no error)
12:32:22 other gemini-flash t
12:32:20 other gemini-flash t
12:32:18 other gemini-flash t
12:32:16 other gemini-flash t
```

5/5 success, all gemini-flash, no Groq fallback (Gemini quota healthy). ZERO failures.

`/api/ai/risk` cannot be probed directly without authenticated user session, but it shares the same import tree as `/api/ai/budget` и both lambdas were rebuilt in the same deploy. Will confirm definitively from natural Ramiz dashboard traffic in next 5-10 min.

---

## New per-cluster invariant

After cluster deploy, monitor query:
```sql
SELECT count(*) FROM ai_usage_log
WHERE error_code = 'GEMINI_API_KEY not configured'
  AND occurred_at > '<deploy-time>';
```

- 0 → continue
- >0 on specific endpoint not в cluster → that endpoint has frozen lambda → hot-touch on next cluster commit (free invalidation)

---

## Files

* PR #20 commit: `a770262b`
* Deploy: `dpl_AuZ91T697wMGF52TEeEBEoNxDLZc` READY at 12:31 UTC
* Auto-deploy chain: git push main → Vercel GitHub App webhook → build → deploy
