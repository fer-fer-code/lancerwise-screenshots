# [AGENT 2] /api/ai/risk persistent failure — hot-touch fix didn't stick

**Date:** 2026-05-17 14:08 UTC
**Status:** Cluster 7 + Bug #001 + qa-gates fix all deployed via Vercel auto-deploy.
**Issue:** /api/ai/risk endpoint failing 100% on production despite all prior fixes.

---

## Failure pattern (4-hour window)

```
hr       fails  succ  feature(s)
12:00    146    15    risk-assessment fails, others succeed
13:00    108     0    risk-assessment only (270 в 13h hr)
14:00      8     5    risk-assessment fails, others succeed

Total: 262 failures, 20 successes
- 270 failures from feature='risk-assessment' (/api/ai/risk)
- 20 successes от feature='other' (cron routes through /lib/ai)
- 0 successes от risk-assessment
```

100% failure rate on /api/ai/risk. 100% success rate on cron routes.

---

## What I've tried

1. ✅ Lazy `getAI()` re-read pattern в gemini.ts (PR #15)
2. ✅ Lazy `getGroq()` pattern в groq.ts (PR #16)
3. ✅ Sensitive→encrypted GEMINI_API_KEY env conversion (PR #20 sidecar)
4. ✅ Multiple `vercel deploy --prod --yes --force` deploys
5. ✅ Hot-touch `/api/ai/risk/route.ts` с no-op comment (PR #20)
6. ✅ Hot-touch `/api/ai/budget/route.ts` с no-op comment (PR #20)
7. ✅ Multiple subsequent deploys (clusters 5, 6, 7 + agent #1 + agent #3)

Result: failures continue.

---

## Verified state

* `vercel env pull --environment=production`: `GEMINI_API_KEY` length=39, suffix=`UNw4xAc4` ✓
* Source on main has lazy fix (gemini.ts getAI() helper) ✓
* /api/ai/risk imports from /lib/ai correctly ✓
* No runtime config override (no `export const runtime = 'edge'` etc.) ✓
* Same import path as cron routes which work ✓

So:
* Env IS set
* Code IS correct
* Cron routes (same imports) work
* /api/ai/risk fails consistently

---

## Hypothesis

Vercel/Next.js incremental build cache is serving а stale compiled bundle для /api/ai/risk that pre-dates PR #15 lazy fix. PR #20 hot-touch worked transiently но subsequent deploys (which didn't touch /api/ai/risk source) reverted к the cached pre-PR-#15 version.

Why cron routes work: each cluster's B1/B2 commits MODIFY cron routes' bundles indirectly OR each cluster deploy gets а fresh build за cron paths.

Why /api/ai/risk fails: it hasn't been modified since PR #10 (months ago). The cached pre-PR-#15 build keeps getting served despite multiple `--force` deploys.

---

## Options к unstick

### A) Per-route opt-out of build cache

Add к `/api/ai/risk/route.ts`:
```ts
export const dynamic = 'force-dynamic'
// OR
export const revalidate = 0
// OR force runtime regeneration
```

Risk: doesn't address root cause; may need для every route that imports /lib/ai.

### B) Project-wide cache disable

Add к Vercel env:
```
VERCEL_FORCE_NO_BUILD_CACHE=1
```

Causes full rebuild on every deploy. Slower (~+3 min per deploy) but reliable. Recommended by reviewer's earlier note: "VERCEL_FORCE_NO_BUILD_CACHE=1 env var exists as alternative но expensive".

### C) Repeated hot-touch

Touch /api/ai/risk + /api/ai/budget с а fresh hash on EVERY cluster commit. Tedious и doesn't scale.

### D) Migrate /api/ai/risk source file as part of cluster

Since cluster 8 onwards still has ~189 endpoints to touch, include /api/ai/risk hot-touch в cluster 8 commit. Bundle gets rebuilt fresh с current /lib/ai code.

---

## Recommendation

**B (VERCEL_FORCE_NO_BUILD_CACHE=1) + D (hot-touch с cluster 8)**.

B is the durable fix. D is the immediate fix для this specific endpoint.

The +3 min per deploy cost от B is acceptable given:
- We're shipping ~15 deploys/day during migration
- Failed dashboards = silent breakage для users
- Cluster pace already ~5-10 min per cluster

Once migration is complete (cluster 15) и all 596 direct-Anthropic routes are migrated, the cache invalidation becomes natural и we can remove VERCEL_FORCE_NO_BUILD_CACHE.

---

## Pausing cluster 8 для reviewer decision

Options A-D differ в risk и persistence. Reviewer should pick before I proceed.

Cluster 8 ready к include /api/ai/risk + budget re-touch as part of its commit IF reviewer chooses D.
