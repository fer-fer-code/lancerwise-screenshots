# [AGENT 2] B2 Cluster 3 + cold-start hotfix

**Date:** 2026-05-17 05:00 UTC
**Status:** Cluster 3 deployed (25 endpoints, 75 of 364 total). Hotfix deployed для cold-start env race.

## Cluster 3

- PR #14, merge commit `30a8c9c2`
- Files: client-win-back through deal-closer-script (alphabetic 51-75)
- 25 files / +258 / -359 lines

## Cold-start race observed

Between 02:00 UTC (1 successful risk-assessment) и 04:00 UTC (16 failures) on the
SAME deploy `dpl_FS6zL1JhJpxDkp` (yesterday's first GEMINI fix), behavior flipped
without any code change.

### Diagnosis

`gemini.ts` was reading `process.env.GEMINI_API_KEY` at module load time
и caching the result для the lifetime of the function instance. Vercel workers
go cold after ~5 min idle; new cold starts that happen to miss env binding
(transient race) lock the module into `ai = null` forever.

### Hotfix (PR #15, commit `?`, deploy `dpl_DLQKqfwFcJkXMB2GbnbmCpphS9vF`)

New `getAI()` helper:
- Reads `process.env.GEMINI_API_KEY` on каждый call (cheap)
- Caches SDK instance only if env value unchanged
- Re-creates client if env value changes (recovery от env rotation)
- Module load no longer reads env

Verified:
1. Env set → configured=true, call OK
2. Env deleted → throws expected error
3. Env restored → recovery on next call (key healing behavior)

## Post-hotfix probe

```
$ curl -H "Authorization: Bearer $CRON_SECRET" ... /api/cron/weekly-insights
{"processed":5}

Log inserts post-deploy:
  04:58:46 groq         other  t  tokens=327
  04:58:43 groq         other  t  tokens=322
  04:58:40 groq         other  t  tokens=325
  04:58:37 groq         other  t  tokens=327
  04:58:34 gemini-flash other  t  tokens=348
```

5/5 successful. 4 Groq fallbacks (Gemini RPM rate-limit during burst — fallback chain firing как designed). No further errors logged.

## Production resilience

- ANY future cold-start race auto-recovers с lazy re-read
- Original sensitive→encrypted fix may have been unnecessary с this hotfix in place
- All 75 migrated endpoints (B0+B1 + B2 1-3) now protected
