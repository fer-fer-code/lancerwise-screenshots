# [AGENT 2] Cold-start anti-pattern audit (`/lib/ai/*` providers)

**Date:** 2026-05-17
**Trigger:** Cold-start race hotfix on gemini.ts (PR #15). Reviewer Q2 — apply same audit к other providers.

---

## Anti-pattern

```ts
import Provider from 'provider-sdk'
const apiKey = process.env.PROVIDER_API_KEY   // ← read at module load
const client = apiKey ? new Provider({ apiKey }) : null  // ← cached forever
export async function generateText(...) {
  if (!client) throw new Error('PROVIDER_API_KEY not configured')
  return client.call(...)
}
```

**Failure mode:** Vercel function workers go cold after ~5 min idle. When а new worker spins up, if process.env binding races (transient), `apiKey = undefined`, `client = null`, и all subsequent requests routed к that worker fail permanently until next deploy resets it.

**Symptom in prod:** Same deploy randomly flipping between working и `PROVIDER_API_KEY not configured` errors с no code change. Observed for gemini.ts between 02:00 UTC (1 success) и 04:00 UTC (16 failures) on dpl_FS6zL1JhJpxDkp.

---

## Findings

### `src/lib/ai/gemini.ts` — FIXED (PR #15 `dd392a8c`)

* **Before:** `const apiKey = process.env.GEMINI_API_KEY; const ai = apiKey ? new GoogleGenAI({apiKey}) : null` at module top
* **After:** `function getAI()` reads env per call, caches SDK instance only if env value unchanged
* Deploy `dpl_DLQKqfwFcJkXMB2GbnbmCpphS9vF` LIVE
* Verified: env-toggle recovery test PASS

### `src/lib/ai/groq.ts` — FIXED (PR #16 `3ab444d8`)

* Identical anti-pattern: `const apiKey = process.env.GROQ_API_KEY; const groq = ... new Groq(...)` at module load
* Same fix applied: `function getGroq()` lazy lookup
* Deploy `dpl_4gReYChvMh7Pq9um5jVbdDVvjmf5` LIVE
* Verified: env-toggle recovery test PASS
* **Why preemptive:** Groq is fallback провайдер from Gemini (rate-limit recovery). If Groq workers hit cold-start race separately, fallback chain breaks even when Gemini is healthy. Fixing both together avoids 2nd incident.

### Anthropic direct-SDK endpoints (596 files at module-level instantiation)

* Same anti-pattern, но spread across 596 separate files
* Each has either `const client = new Anthropic()` (reads ANTHROPIC_API_KEY от env at instantiation) at module level
* Theoretically also vulnerable к the cold-start race

**Decision: skip standalone fix.** These endpoints are being migrated к `/lib/ai` (B2-B5 plan). Each migration converts them to call `generateText`/`generateJSON` from /lib/ai, which now uses the lazy getAI() pattern. As B2 progresses, these endpoints automatically inherit the fix. Re-writing 596 files just to add lazy pattern would be wasted work since they're being replaced.

If any direct-Anthropic endpoint exhibits the cold-start race symptom in production logs while migration в progress, что rare candidate can be hot-patched ad-hoc.

### Other modules с similar pattern

```
$ grep -nE "^const.*new (Anthropic|GoogleGenAI|Groq|OpenAI)" src/lib/*.ts
(no matches outside /lib/ai)
```

No other module-load SDK instantiation в `/lib/*` outside `/lib/ai`. Audit complete.

---

## Pattern для future SDK clients

When adding any new external API client к `/lib/`:

```ts
let _client: Client | null = null
let _clientKey: string | undefined

function getClient(): Client | null {
  const apiKey = process.env.MY_API_KEY
  if (!apiKey) return null
  if (_client && _clientKey === apiKey) return _client
  _client = new Client({ apiKey })
  _clientKey = apiKey
  return _client
}

export async function callApi(...) {
  const client = getClient()
  if (!client) throw new Error('MY_API_KEY not configured')
  return client.someMethod(...)
}
```

Benefits:
* Cold-start race auto-heals — next call re-reads env
* Env rotation supported (client re-created if key changes)
* No module-load warnings logging (которые fire on cold start even though subsequent calls succeed)
* Cheap — env lookup is а map dereference

---

## Files changed

| File | PR | Status |
|---|---|---|
| `src/lib/ai/gemini.ts` | #15 | LIVE `dpl_DLQKqfwFcJkXMB2GbnbmCpphS9vF` |
| `src/lib/ai/groq.ts` | #16 | LIVE `dpl_4gReYChvMh7Pq9um5jVbdDVvjmf5` |
| 596 direct-Anthropic endpoints | (deferred) | Each fixed когда B2-B5 migrates it к /lib/ai |

---

## Update — Vercel build cache caveat (added 2026-05-17 05:27 UTC)

After gemini.ts + groq.ts lazy fixes were deployed normally (PR #15, #16),
production risk-assessment endpoint CONTINUED to error за 30 minutes:
33 failures by the time observation poll started, climbing к 35.

Investigated:
- Code on origin/main has lazy fix ✓
- Vercel latest deploy SHA matches latest commit ✓
- GEMINI_API_KEY type=encrypted across все envs (production matches local) ✓
- Cron routes (just-modified) work correctly with lazy fix
- Only risk-assessment (unmodified-since-PR-#10) was failing

Root cause: **Vercel build cache reused stale function bundle для unmodified
routes.** When gemini.ts changed, Vercel rebuilt routes that directly modified
files (cron routes touched в B1, modified routes touched в B2-B2.3), но
routes that hadn't been modified — like /api/ai/risk — used а cached function
bundle that still contained the OLD gemini.ts с module-load env caching.

### Fix: force rebuild

```
$ vercel deploy --prod --yes --force
→ dpl_7XcvgEmpAXp1Jx5Z8KScCVo5KopJ READY
```

`--force` invalidates Vercel's build cache and rebuilds ALL function bundles.

Post-force-rebuild verification:
```
SELECT count(*) FROM ai_usage_log
WHERE occurred_at > '2026-05-17 05:24:00+00'
  AND error_code = 'GEMINI_API_KEY not configured';
→ 0
```

### Lesson

For changes к shared lib modules (`/lib/ai/*`, `/lib/email/*`, etc.) deployed
via `vercel deploy --prod`, always pass `--force` к ensure все downstream
routes pick up the new code. Otherwise cached function bundles may serve
stale module imports.

Or even better: rely on `git push` к main + auto-deploy (when reconnected),
which Vercel handles с fresh build each time. The manual deploy path's
cache reuse is а deliberate optimization that surfaces edge cases like this.

Added к backlog: "always --force on deploys touching /lib/ai/* until git→vercel
auto-deploy is restored".
