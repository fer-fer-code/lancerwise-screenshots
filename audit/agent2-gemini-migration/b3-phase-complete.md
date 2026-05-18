# B3 PHASE COMPLETE — 251/251 streaming endpoints migrated

**Date:** 2026-05-18
**Final commit:** `877e579100b5d76085b38492091b048e6c791813`
**B3a streamText infrastructure:** PR #40 (`7d2732d3`)
**B3b cluster PRs:** #43, #44, #46, #49, #51, #52, #53, #54, #55, #56, #57

---

## Final state

```bash
# /api/ streaming endpoints на @anthropic-ai/sdk
grep -rln "\.messages\.stream(" src/app/api/ | wc -l
→ 0  (was 251 at B3 start)

# /api/v1/ai/ on /lib/ai
grep -rln "from '@/lib/ai'" src/app/api/v1/ai/ | wc -l
→ 364  (100% migrated, B2 phase)

# Total /api/ routes routing к /lib/ai
grep -rln "from '@/lib/ai'" src/app/api/ | wc -l
→ ~680  (massive footprint)

# Remaining non-streaming Anthropic calls outside /v1/ai/ (B4 scope)
grep -rln "\.messages\.create(" src/app/api/ | grep -v "/api/v1/ai/" | wc -l
→ 61
```

---

## Per-cluster journey

| Cluster | PR | Endpoints | Notes |
|--------|----|----|----|
| B3a | #40 | (infra) | Groq streamText + fallback wiring + 2-second integration tests |
| B3b C1 | #43 | 25 | analytics/* → client-appreciation |
| B3b C2 | #44 | 25 | client-avatars → crm/leads |
| B3b C3 | #46 | 25 | crm/proposals → income-diversification; **manual finalText fix** в income-diversification/analyze |
| B3b C4 | #49 | 25 | leads → portfolio; **multi-turn chat fix** в negotiation/chat; **OOM + VERCEL_FORCE_NO_BUILD_CACHE removal** |
| B3b C5 | #51 | 25 | (smooth) |
| B3b C6 | #52 | 25 | **manual finalText fix** в revenue-leaks/recommend |
| B3b C7 | #53 | 25 | (smooth) |
| B3b C8 | #54 | 25 | **6 /tools/* name conflicts fixed** (local streamText vs lib streamText) |
| B3b C9 | #55 | 25 | **8 more /tools/* fixes** + multi-turn fix в negotiation-coach/chat |
| B3b C10 | #56 | 25 | **9 more /tools/* fixes** + win-rate/analyze event-loop pattern fix |
| B3b C11 | #57 | 1 | **FINAL** — work-rhythm/analyze (parallel agents accelerated other clusters before mine) |
| | | **251 total** | |

---

## Critical infrastructure decisions

### B3a — streaming abstraction

`/lib/ai/streamText` was already а stub что only routed к Gemini (added in PR #15 alongside the lazy-init fix). B3a extended it:

* Added `streamText()` AsyncGenerator к `/lib/ai/groq.ts`, mirroring Gemini's `{ text }` chunk + `{ fullText, tokensUsed, modelVersion }` return shape.
* Wired Gemini → Groq fallback в `/lib/ai/index.ts`: fallback fires только если primary fails BEFORE yielding any chunk AND error is rate-limit (cannot retry mid-stream).
* Added `'anthropic': null` к FALLBACK_CHAIN (closed Record<AIProvider> gap).
* Added integration tests (`streamText.test.ts`) — both providers verified end-to-end in ~2 seconds total с real API keys.

### Mid-phase incident — OOM during build (cluster 4)

Cluster 4 hit OOM at Vercel's "Collecting page data using 3 workers" stage. Root cause: `VERCEL_FORCE_NO_BUILD_CACHE=1` env var was set during the cluster-8 hot-touch era (PR #28 incident) and was now causing every build к скип incremental cache, doubling memory pressure as the codebase grew.

Force-dynamic is the load-bearing fix for the original cluster-8 issue (verified in `risk-fixed-via-force-dynamic.md`), so the no-cache flag was redundant. **Removed VERCEL_FORCE_NO_BUILD_CACHE from both production + preview targets via Vercel API.** Build cache restored, OOM resolved.

### Per-cluster invariant (refined from B2)

Each B3b cluster followed:

1. `git checkout -B agent2-b3b-cluster-N origin/main`
2. Apply migrator script
3. Cleanup: strip leftover `new Anthropic(...)` lines; fix `/tools/*` local-name conflicts; handle `finalText()` consumers и multi-turn message arrays
4. Typecheck (tsc baseline must hold — 385 errors)
5. Commit + push → squash-merge PR
6. Production deploy waiter (auto-retry once on OOM/CANCELED)
7. Cron probe `/api/cron/weekly-insights` → HTTP 200 + zero `'%API_KEY not configured%'` errors

Every cluster passed на first attempt OR after а single OOM auto-retry (clusters 3, 9, 11 each retried once).

---

## What broke + how we fixed it

### Migrator edge cases discovered live

| Issue | Detection | Fix |
|---|---|---|
| `response.finalText()` consumer pattern | Tsc error: `Property 'finalText' does not exist on type 'AsyncGenerator'` | Capture `fullText` during for-await loop instead (income-diversification, revenue-leaks) |
| Multi-turn `messages: [{role, content}, ...]` array | Migrator couldn't extract single prompt | Compile transcript: `${m.role}: ${m.content}` × all messages, append `\n\nAssistant:` (negotiation/chat, negotiation-coach/chat) |
| `/tools/*` local `function streamText(prompt, system)` helper | Name conflict с lib import: `error TS2440: Import declaration conflicts with local declaration of 'streamText'` | Aliased lib import к `libStreamText` + renamed local к `streamSSE` (23 files auto-fixed via `/tmp/fix-tools-streamtext.py`) |
| Migrator regex picked up `string` type annotation instead of variable | `error TS2693: 'string' only refers to а type, but is being used as а value here` | Manual edit to use transcript-compiled prompt (negotiation-coach/chat) |
| Migrator skipped helper with `aiClient` variable name | "no stream call" skip | Manually replaced (covered в B2 C15) |
| Migrator left `event.type === 'content_block_delta'` filter intact when iterator variable was `event` not `chunk` | `error TS2339: Property 'type' does not exist on type 'StreamChunk'` | Simplified к `event.text` direct access (win-rate/analyze) |

### Vercel build OOM

Discussed above. Removed VERCEL_FORCE_NO_BUILD_CACHE.

### Cluster 3 + 9 + 11 transient deploy ERROR/CANCELED

Auto-retry mechanism в watcher script handled these without manual intervention. All retries succeeded on second attempt.

---

## Coordination state

* [AGENT 1] worked Bug #001 batches + marketing pages в parallel (4 PRs merged during B3 — no overlap)
* [AGENT 3] security audit P1 fixes в parallel (RLS, OAuth, Turnstile, contact rate-limit — 5+ PRs merged during B3, no overlap)
* [AGENT 2] B3 done

---

## Post-B3 remaining

### B4 — non-streaming Anthropic calls outside /v1/ai/

61 endpoints still call `client.messages.create(...)` directly outside `/api/v1/ai/*`. These are simpler than streaming (no for-await loop), can reuse the B2 migrator approach. Estimated 3 clusters of 25 each.

### B5 — scattered routes

Whatever doesn't fit B4 buckets — probably small.

### B6 — vision endpoint

`/api/ai/scan-receipt` still uses Anthropic Sonnet vision. Needs `generateVision()` helper в `/lib/ai` first.

### Post-launch cleanup (covered в post-launch-cleanup-todo.md)

* Strip hot-touch comments from `/api/ai/risk` + `/api/ai/budget`
* Fix 385 pre-existing TS errors from B2 cluster 1-8 migrator's `message.usage` residue
* Audit /api/ai/* for the missing-force-dynamic preemptive sweep (51 routes susceptible to static-render trap)
