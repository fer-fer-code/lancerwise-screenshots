# Gemini migration — FINAL completion

**Date:** 2026-05-19
**Final commit:** `b180c3127e4098783c5f3538db83723cb7be5505` (PR #66, B6)
**Final deploy:** `dpl_3QbFfCNMVQZVA2RprVv7LhMpgDJh`

## **0 routes on `@anthropic-ai/sdk` in `src/app/api/`**

```bash
$ find src/app/api -name "*.ts" -exec grep -l "@anthropic-ai/sdk\|new Anthropic" {} \;
$ # (no output — migration complete)
```

---

## Cumulative migration totals

| Phase | Endpoints migrated | PRs | Approx. session duration |
|---|---|---|---|
| B2 (v1/ai non-streaming) | 364 | #11–#38 | ~6 hours |
| B3a (streamText infra) | 0 (helper) | #40 | ~30 min |
| B3b (streaming) | 251 | #43, #44, #46, #49, #51–#57 | ~4 hours |
| B4 (other non-streaming) | 60 | #58, #59 | ~1 hour |
| **B6 (vision)** | **1** | **#66** | **~1 hour** |
| **TOTAL** | **676** | **27+ PRs** | **~13 hours across сессии** |

---

## Architecture state

### `/lib/ai` surface area

* `generateText(prompt, options)` — text completion с budget cap, usage logging, Gemini→Groq fallback chain
* `generateJSON(prompt, options)` — JSON-output wrapper around generateText
* `streamText(prompt, options)` — streaming counterpart (AsyncGenerator) с budget cap, usage logging, Gemini→Groq fallback (pre-chunk only)
* `generateVision(prompt, imageBase64, options)` — multimodal (image+text → text) с budget cap, usage logging, **Gemini-only** (no Groq fallback — Llama doesn't support vision)

### Provider routing

| Bucket | Default | Override env |
|---|---|---|
| `default` (most features) | gemini-2.5-flash | `AI_PROVIDER_DEFAULT` |
| `contract` (long-form legal) | gemini-2.5-pro | `AI_PROVIDER_CONTRACT` |
| `fast` (chat, name-generator) | groq llama-3.3-70b | `AI_PROVIDER_FAST` |
| vision (via generateVision) | gemini-2.5-flash | none (Gemini-only) |

### Fallback chain (rate-limit recovery)

```
gemini-pro     → gemini-flash
gemini-flash   → groq
gemini-flash-lite → groq
groq           → gemini-flash
anthropic      → null  (deprecated — no fallback target в routed code anymore)
```

### Cost cap

`DAILY_BUDGET_USD = 0.50` per user (configurable via env). Enforced via `checkBudget(userId)` at the start of every routed AI call.

---

## Anthropic billing impact

### Pre-migration (early B2 era)

* ~676 endpoints × Anthropic Sonnet/Haiku across all surfaces
* Burn rate exposed full revenue к API costs
* No fallback chain, no budget cap

### Post-migration (post-B6)

* ZERO calls к Anthropic API from `/api/*` source code
* All AI through Gemini Flash (free tier 1500 RPD per project) + Groq (free tier 14400 RPD per project)
* Free-tier sufficient для launch traffic estimates
* `DAILY_BUDGET_USD` cap prevents individual user runaway costs

`process.env.ANTHROPIC_API_KEY` remains set в Vercel (для historical compatibility) but no code reads it. Can be removed post-launch once we confirm no legacy fallback paths reference it.

---

## Lessons documented в memory

* `feedback_force_dynamic_invariant.md` — All `/api/ai/*` and `/api/v1/ai/*` routes must export `dynamic = 'force-dynamic'` к prevent Next.js static-render inference from freezing build-time `process.env` values
* `backlog_force_dynamic_preemptive_sweep.md` — 51 routes в `/api/ai/*` still need the export preemptively (P2 polish)

## Open backlog (covered в `post-launch-cleanup-todo.md`)

* Strip hot-touch comments from `/api/ai/risk` + `/api/ai/budget`
* Fix 385 pre-existing TS errors from B2 cluster 1-8 migrator's `message.usage` residue
* Decide `NEXT_PRIVATE_BUILD_WORKERS=1` permanent or revert
* Remove `process.env.ANTHROPIC_API_KEY` from Vercel (cosmetic)
* Audit `/api/ai/*` for missing `force-dynamic` preemptive sweep
