# Post-launch cleanup todo (agent2 Gemini migration artifacts)

**Status update 2026-05-18:** B2 phase COMPLETE (commit 04fc70bd, deploy dpl_8DuJeiNTwuaZabyFXyAkdXQ1PVsk).
364/364 v1/ai endpoints migrated. /api/ai/risk verified working post-PR-#28.

After Gemini migration complete (cluster 15 deployed) + system stable for 1-2 weeks:

## 1. Remove VERCEL_FORCE_NO_BUILD_CACHE env var

Restore normal build cache behavior. Reduces deploy time ~3 min → ~1.5 min.

```bash
VERCEL_TOKEN="..."
PROJECT_ID="prj_OfYhgE1ONf98IhDzAMzspTr7hC1A"
TEAM_ID="team_1chEHohDYMmF5qKeIHoyczor"
# Find IDs
curl -s ".../v10/projects/$PROJECT_ID/env?teamId=$TEAM_ID" \
  -H "Authorization: Bearer $VERCEL_TOKEN" \
  | python3 -c "import json,sys; [print(e['id']) for e в json.load(sys.stdin)['envs'] if e['key']=='VERCEL_FORCE_NO_BUILD_CACHE']"
# DELETE each (production + preview)
```

## 2. Remove hot-touch comments

Strip `// rebuild touch 2026-05-17` and `// Force rebuild — bundle cache invalidation` comments от:
- `src/app/api/ai/risk/route.ts`
- `src/app/api/ai/budget/route.ts`

(Optional — comments are harmless. Could keep as historical context.)

## 3. Restore standard deploy flow

Drop the `vercel deploy --prod --yes --force` step from cluster invariant.
Auto-deploy via git→Vercel webhook is now reliable (Agent #3 install).

## 4. Migrate remaining direct-Anthropic endpoints

If any endpoints outside `/api/v1/ai/*` still use direct Anthropic SDK
(tools, scattered) — finish them per Phase B4-B5.

## 5. Cleanup migration scripts

Delete `/tmp/migrate-v1-ai.py` (not tracked) — done its job.

## 6. Update CLAUDE.md / memory с findings

Backlog items для memory promotion:
- Vercel CLI v52 AI_AGENT detection issue (still relevant)
- Vercel sensitive vs encrypted env type symptom (probably encrypted is correct default для server-side)
- Vercel/Next.js incremental build cache caveat (this incident)
- Lazy SDK client pattern для all future provider integrations
- Cron-curl probe pattern для verifying production AI calls
- **Force-dynamic invariant for all /api/ai/* and /api/v1/ai/* routes** — already memo'd at `feedback_force_dynamic_invariant.md`

## 7. Preemptive force-dynamic sweep на /api/ai/*

51 routes в `/api/ai/*` import `@/lib/ai` but lack `export const dynamic = 'force-dynamic'`. Not currently failing но theoretically susceptible to the same static-render trap that broke `/api/ai/risk` for 4h.

Single sweep PR, single deploy, single cron-probe. Cheap insurance. List of routes saved at `/tmp/ai_lib_consumers.txt` (regenerate с `find src/app/api/ai -name "route.ts" -exec grep -L "dynamic = 'force-dynamic'" {} \; -exec grep -l "from '@/lib/ai'" {} \;`).

## 8. Fix 386 pre-existing TS errors from clusters 1-8

Migrator (B2 cluster 1-8 runs) converted `const message = await client.messages.create(...)` к `const { text: message } = await generateText(...)` — making `message` а `string`. But some files still reference `message.usage.input_tokens + message.usage.output_tokens` in их `tokens_used:` response field. Each such ref now produces:

```
error TS2339: Property 'usage' does not exist on type 'string'.
```

Cluster 9+ migrator fixes this inline (destructure `tokensUsed` + replace `message.usage.input_tokens + .output_tokens` с `tokensUsed`). Apply same recipe к pre-cluster-9 files. ~190 individual files, can be batched as а single sweep PR.

Vercel build does not enforce strict tsc (it uses Next.js's looser type-check pass), so prod is unaffected. But IDE warnings + future strict-mode adoption blocked. Pre-launch nice-to-have, не blocker.
