# [AGENT 2] Gemini Migration — Phase A Inventory

**Date:** 2026-05-17
**Status:** Phase A complete. Awaiting reviewer approval before Phase B (batched migration).

---

## TL;DR

* **687 files** import `@anthropic-ai/sdk` (down from earlier count 697 — some have already moved)
* **No Claude-specific features blocking migration**: zero `tools:` / `tool_use`, zero `cache_control`, zero `max_tokens > 8192`
* **2 capability gaps to address in `/lib/ai` before / during migration:**
  1. **Streaming** (`messages.stream`) — 251 endpoints; `/lib/ai` currently exposes only `generateText`/`generateJSON` (buffered). Need new `streamText()` helper.
  2. **Vision** (image input) — 1 endpoint (`scan-receipt`); `/lib/ai` has no vision wrapper yet.
* **53 endpoints в `/api/ai/*` are already migrated** к `/lib/ai`. Don't touch them.
* **Gemini Flash-Lite smoke test passed** — 2.6s response, returns "Hello" к "say hello" prompt, 9 tokens used. Free tier confirmed working.

---

## A.1 — Inventory totals

| Metric | Count |
|---|---|
| Files importing `@anthropic-ai/sdk` | **687** |
| `new Anthropic()` instantiations | 687 (1-per-file) |
| `.messages.create(...)` calls (buffered) | **441** |
| `.messages.stream(...)` calls (streaming) | **251** |
| `tools:` / `tool_use` (function calling) | **0** |
| `cache_control` / prompt caching | **0** |
| Vision (`image_url`, image input) | **1** |
| `system:` parameter (system prompt) | 229 |
| Already on `/lib/ai` (via `from '@/lib/ai'` import) | **54** |

Notes:
* Zero overlap between "imports Anthropic" and "imports /lib/ai" sets — all 687 Anthropic-importers exclusively use direct SDK.
* All 229 `system:` usages are supported by `/lib/ai` (passes through к `systemPrompt` option).

---

## A.2 — Model distribution

```
683 claude-haiku-4-5-20251001
  7 claude-haiku-4-5            (alias)
  2 claude-sonnet-4-6           (scan-receipt, proposals/price-estimate)
  0 claude-opus*                 (none)
```

99% Haiku 4.5. Migration target: `gemini-2.5-flash-lite` per reviewer spec.

---

## A.3 — max_tokens distribution

```
152× max_tokens: 500
121× max_tokens: 600
101× max_tokens: 400
 39× max_tokens: 1500
 37× max_tokens: 800
 36× max_tokens: 2000
 33× max_tokens: 700
 29× max_tokens: 1200
 21× max_tokens: 1000
 19× max_tokens: 1024
 18× max_tokens: 300
 14× max_tokens: 900
 14× max_tokens: 3000
  9× max_tokens: 2048
  7× max_tokens: 450
  + smaller buckets, smallest 100, largest 4096
```

**Zero endpoints с max_tokens > 8192** (Gemini Flash-Lite output limit). All fit.

---

## A.4 — Priority buckets

### Bucket P0 — Cron jobs (11 endpoints, auto-fire)

These run on schedule per `vercel.json`. Migration here is highest priority because errors are not user-visible (silently fail). Test coverage essential.

```
src/app/api/cron/ai-weekly-insights/route.ts
src/app/api/cron/annual-year-review/route.ts
src/app/api/cron/client-checkins/route.ts
src/app/api/cron/deadline-reminder/route.ts
src/app/api/cron/friday-summary/route.ts
src/app/api/cron/monthly-health-score/route.ts
src/app/api/cron/monthly-review/route.ts
src/app/api/cron/quarter-sprint/route.ts
src/app/api/cron/quarterly-review/route.ts
src/app/api/cron/weekly-insights/route.ts
src/app/api/cron/weekly-review-auto/route.ts
```

(Earlier count was 13 — 2 were already migrated к `/lib/ai`.)

### Bucket P1 — `/api/v1/ai/*` marketplace tools (~364 endpoints)

Largest cluster. Uniform pattern (Phase B template):

```ts
const ai = new Anthropic()
const message = await ai.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 500,
  system: 'You are a freelance business consultant. ...',
  messages: [{ role: 'user', content: prompt }],
})
const text = (message.content[0] as { text: string }).text
```

→ becomes:

```ts
import { generateText } from '@/lib/ai'
const { text } = await generateText(prompt, {
  feature: 'other',
  systemPrompt: 'You are a freelance business consultant. ...',
  maxOutputTokens: 500,
  userId,
})
```

Sed-based batch migration viable for buffered (`messages.create`) — half of these are streaming and need different handling.

### Bucket P2 — `/api/tools/*` (~50 endpoints across 18 tools)

Same uniform pattern, smaller batches per-tool:
* `tools/upsell`, `tools/social-content`, `tools/skill-gap`, `tools/scope-estimator`, `tools/scope-creep`, `tools/retainer-proposal`, `tools/rate-increase`, `tools/negotiation-coach`, `tools/icp`, `tools/contract-review`, `tools/cold-pitch`, `tools/client-brief`, `tools/win-back`, `tools/status-update`, `tools/reactivation`, `tools/proposal-followup`, `tools/project-risk`, `tools/price-increase`, `tools/performance-review`, `tools/newsletter`, `tools/meeting-agenda`, `tools/linkedin-post`

### Bucket P3 — Scattered (~260 endpoints)

Top-level `/api/*` routes that don't fit above (e.g. `/api/analytics/*/advice`, `/api/clients/*`, `/api/contracts/*`, `/api/expenses/*`). Heterogeneous patterns. Largest individual subdir is `/api/analytics/*` advice endpoints.

### Bucket E — Edge cases (3 endpoints)

* **`src/app/api/ai/scan-receipt/route.ts`** — Sonnet 4.6 vision (receipt OCR). Gemini Flash supports vision via inline image data — equivalent quality plausible. Migration needs separate vision helper в `/lib/ai`.
* **`src/app/api/proposals/price-estimate/route.ts`** — Sonnet 4.6 buffered. Migration straightforward к Gemini Flash (not Flash-Lite — Flash gives better quality для pricing reasoning). Or keep on Anthropic per reviewer Phase C decision.
* **251 streaming endpoints** — need `streamText()` helper в `/lib/ai/gemini.ts` (Gemini SDK has `generateContentStream`) AND `/lib/ai/index.ts` (passthrough). Add this once, then batch migrate consumers.

---

## A.5 — Capability gaps to close before / during migration

### Gap #1 — Streaming helper в `/lib/ai`

Current `/lib/ai/gemini.ts` exports only `generateText` (buffered). Anthropic consumer pattern:

```ts
const stream = await anthropic.messages.stream({...})
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
    yield chunk.delta.text
  }
}
```

Equivalent Gemini SDK call:

```ts
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash-lite',
  contents: prompt,
  config: { systemInstruction, maxOutputTokens },
})
for await (const chunk of stream) {
  yield chunk.text
}
```

Proposed addition `/lib/ai/index.ts`:
```ts
export async function* streamText(prompt: string, opts: GenerateTextOptions): AsyncIterable<string> { ... }
```

Plus a thin streaming-from-gemini.ts wrapper. Then consumers do:

```ts
for await (const delta of streamText(prompt, opts)) {
  await writer.write(encoder.encode(`data: ${JSON.stringify({chunk: delta})}\n\n`))
}
```

**Reuses budget cap** — `streamText` calls `checkBudget()` like `generateText` does.

### Gap #2 — Vision helper

Only 1 endpoint needs it (`scan-receipt`). Two options:
* (a) Add `generateVisionText(image: Buffer | base64, prompt: string, opts)` к `/lib/ai/gemini.ts` — generic, future-proof
* (b) Inline the Gemini vision call в `scan-receipt/route.ts` only — pragmatic, less new abstraction

Per reviewer "keep it pragmatic" sensibility, recommend (b) for now. Can extract к helper если more vision endpoints emerge.

---

## A.6 — Endpoints to KEEP on Anthropic (Phase C decision)

Reviewer noted: "Endpoints that need Anthropic quality (contracts, risk analysis) — flag as 'keep Anthropic, will revisit post-launch'."

Provisional candidates pending reviewer approval:
* `/api/proposals/price-estimate` — Sonnet 4.6 для pricing reasoning; financial accuracy matters.
* `/api/contracts/*` (5 endpoints) — legal language analysis where Claude tends к outperform.
* `/api/ai/contract-risk` — already on Anthropic; keep.

These ~10 endpoints would stay dormant до paid tier resumes. Add inline `// AGENT 2: keep on Anthropic — better legal/financial reasoning quality. Revisit post-launch.` comment.

Reviewer approve / reject this list before Phase B.

---

## A.7 — Pricing comparison (already in /lib/ai/usage.ts COST_PER_M_TOKENS)

```
Provider                        Input rate ($/M)  Output rate ($/M)
gemini-2.5-flash-lite          0.075             0.30
gemini-2.5-flash               0.075             0.30
gemini-2.5-pro                 1.25              5.00
groq llama-3.3-70b-versatile   0 (free tier)     0 (free tier)
claude-haiku-4-5               1.00              5.00
claude-sonnet-4-6              3.00              15.00
```

After migration:
* Per-call cost drops 13-17× from Haiku к Flash-Lite (output)
* Combined с per-user $0.50/day budget cap + free tier 1500 RPD limit, total exposure is bounded к $0 (free tier exhaustion → /lib/ai fallback to Groq Llama which is also free)
* Realistic monthly cost для 100 users at 5 actions/week: **near $0 while на free tier**

---

## A.8 — Smoke test result

```bash
$ npx tsx scripts/gemini-smoke-test.ts
{
  "text": "Hello",
  "tokensUsed": 9,
  "modelVersion": "gemini-2.5-flash-lite",
  "duration_ms": 2641
}
```

Free tier reachable, response shape correct.

---

## A.9 — Proposed Phase B execution plan

Ordered by priority + risk:

| Batch | Scope | Files | Approach |
|---|---|---|---|
| **B0** | Add `streamText()` к `/lib/ai` | 2 (gemini.ts, index.ts) | New helper, no migration yet |
| **B1** | 11 cron jobs (P0) | 11 | Migrate buffered + streaming patterns, verify via cron-trigger smoke |
| **B2** | `/api/v1/ai/*` buffered (~225 of 364) | ~225 | sed-template, 15-per-commit |
| **B3** | `/api/v1/ai/*` streaming (~139 of 364) | ~139 | streamText migration, 15-per-commit |
| **B4** | `/api/tools/*` buffered + streaming | ~50 | 10-per-commit |
| **B5** | Scattered top-level routes | ~260 | 10-per-commit, by subdir |
| **B6** | Vision `scan-receipt` | 1 | Inline Gemini vision call |
| **C** | Anthropic-retained endpoints (~10 with reviewer approval) | ~10 | Add comment, leave SDK in place |

**Estimated effort:** Phase B is ~50-70 commits across several batches. Per reviewer "4-8 hours per batch", multi-day work. I'll push per batch, не bundle.

---

## Open questions для reviewer

1. **Confirm Phase B order** — start with B0 (streaming helper) + B1 (cron) since cron is highest auto-fire risk?
2. **Confirm Anthropic-retained candidates** (price-estimate + contracts + contract-risk = ~10 endpoints)? Or migrate ALL к Gemini Flash-Lite + Flash для quality-sensitive ones?
3. **Should I remove `@anthropic-ai/sdk` from `package.json`** at end of migration, или keep installed since some endpoints stay on Anthropic?
4. **Fallback strategy если Gemini free tier hits 1500 RPD limit:** /lib/ai already chains к Groq. OK к keep this as the rate-limit-fallback, or pause AI features completely в that case?

Standing by для approval on Phase B kickoff.

---

## Evidence files

`audit/agent2-gemini-migration/`:
* `01-inventory-overview.txt` — file counts + pattern distribution
* `02-call-features.txt` — model, max_tokens, system, caching, vision
* `03-priority-buckets.txt` — cron list + /api/v1/ai sample + /lib/ai already-migrated
* `04-streaming-pattern.txt` — typical streaming consumer
* `endpoint-inventory.md` — this document
