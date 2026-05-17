# Post-launch cleanup todo (agent2 Gemini migration artifacts)

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
