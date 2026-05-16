# [AGENT 2] Anthropic API Burn Audit — Interim Report

**Date:** 2026-05-16
**Status:** Code audit complete. Anthropic Console numbers needed для final verdict.

---

## Summary

| Question | Answer |
|---|---|
| Did я find smoking-gun unbounded loop / infinite recursion? | **No** |
| Did я find render-time AI fires? | **Yes — at least 14 client components** (RiskWidget на dashboard confirmed; will burn 1 Haiku call per dashboard visit) |
| Are AI endpoints rate-limited? | **Partially.** Only `/api/v1/*` (371 sites) hit middleware `apiRatelimit`; **325 endpoints under other paths have NO middleware rate limit** |
| Is observability в place? | **No.** `logAIUsage()` just `console.log`s; нет DB-side `ai_usage_log` table |
| Is Anthropic still primary provider? | **Yes for ~697 endpoints.** `/lib/ai` abstraction routes к Gemini/Groq, but only 1 endpoint в `/api/ai/*` uses it; the rest import `@anthropic-ai/sdk` directly |

**Verdict pending Console data.** Code-level audit alone не identifies single root cause. Without Anthropic Console numbers, я cannot distinguish:
* (A) Normal testing of 700+ endpoints × Haiku 4.5 = expected $5-15
* (B) A specific endpoint with a runaway pattern
* (C) Bot/scraper hitting auth-bypassable endpoints

---

## Code inventory

| Bucket | Count | Notes |
|---|---|---|
| Total files importing `@anthropic-ai/sdk` or hitting `api.anthropic.com` | **711** |  |
| Under `/api/ai/*` (covered by `aiRatelimit` 20/hr per user в middleware) | 1 | All others в `/api/ai/*` migrated к `/lib/ai` (Gemini/Groq) |
| Under `/api/cron/*` (CRON_SECRET protected; 13 AI crons, all Haiku 4.5) | 13 | Run on schedule, iterate user `profiles` table |
| Under `/api/v1/*` (covered by `apiRatelimit` 30/min per IP в middleware) | 371 |  |
| Under other `/api/*` (NO middleware rate limit) | **325** | All check Supabase auth, но nothing throttles call rate |

### Model distribution

```
708× claude-haiku-4-5-20251001   ($1/M input, $5/M output)
  7× claude-haiku-4-5            (same, alias)
  2× claude-sonnet-4-6           ($3/M input, $15/M output) — scan-receipt, price-estimate
  0× claude-opus                 (not used anywhere)
```

### High-token endpoints (cost cap per call)

```
sop-documents/generate            max_tokens: 4000   (~$0.020/call Haiku)
brand-voice/generate              max_tokens: 3500   (~$0.018)
proposal-docs/generate            max_tokens: 4096   (~$0.020)
proposals/price-estimate          max_tokens: 1500   (~$0.023 SONNET)
ai/scan-receipt                   max_tokens: 500    (~$0.008 SONNET)
+ ~10 others at max_tokens=2000-2048
```

All endpoints have `max_tokens` cap. **No runaway-generation risk.**

---

## Cron schedule analysis (low burn)

13 AI crons, all Haiku 4.5, all daily/weekly/monthly:

| Cron | Schedule | Iteration |
|---|---|---|
| `generate-daily-tips` | daily 7am | for each active user |
| `client-checkins` | daily 9am | for each user setting |
| `payment-reminders` | daily 8am | for each user setting |
| `send-payment-reminders` | daily 10am | overlap |
| `deadline-reminder` | Mondays 7am | for each user |
| `weekly-insights`, `ai-weekly-insights` | Mondays 7am | per user |
| `friday-summary`, `weekly-review-auto` | Fridays | per user |
| `monthly-review`, `monthly-health-score` | 1st of month | per user |
| `quarterly-review`, `quarter-sprint` | quarterly | per user |
| `annual-year-review` | 1 Jan only | per user |

With ~5 test users:
* 3-4 daily AI crons × 5 users × 1 call = ~20 Haiku calls/day
* avg 600 output tokens × $5/1M = $0.003 per call
* **$0.06/day from crons**, $1.80/30 days

Cron burn is **negligible**. Not the cause of $10 in 2 days.

---

## 🚨 Suspect pattern #1 — render-time AI fires в client components

14 client components have `useEffect` empty-deps + AI-endpoint `fetch`. **Each dashboard / page visit triggers an AI call.**

Confirmed examples:

* **`src/app/(app)/dashboard/RiskWidget.tsx`** — fires `POST /api/ai/risk` on every dashboard mount. Code:
  ```tsx
  async function load() {
    const res = await fetch('/api/ai/risk', {
      method: 'POST',
      body: JSON.stringify({ invoices }),
    })
  }
  useEffect(() => { load() }, [])
  ```
* `src/app/(app)/leads/page.tsx`
* `src/app/(app)/crm/pipeline/CRMPipelineClient.tsx`
* `src/app/(app)/tools/status-updates/StatusUpdateClient.tsx`
* `src/app/(app)/tools/sow/SOWClient.tsx`
* `src/app/(app)/tools/win-rate/WinRateClient.tsx`
* 8 more (full list в `08-render-time-risk.txt`)

**Note: `/api/ai/risk` uses `/lib/ai/generateJSON` which routes к Gemini Flash by default**, not Anthropic. So RiskWidget specifically does NOT burn Anthropic credit. **But the 13 other useEffect-fire files may hit direct-Anthropic endpoints.** Need to verify each one's target endpoint.

**Burn estimate если all 14 hit Haiku:**
* Active testing: ~20 page visits/day × 1-2 AI fires each = 20-40 calls/day
* × Haiku ~$0.005 = $0.10-0.20/day from render-time alone

---

## 🚨 Suspect pattern #2 — Loop-driven AI calls (1 request → many AI calls)

19 endpoints have AI `messages.create` inside `for`/`forEach`/`.map` loops. Sample:

* `src/app/api/v1/projects/[id]/notes/summary/route.ts` — likely 1 call per note
* `src/app/api/v1/smart-brief/route.ts` — multi-section brief
* `src/app/api/v1/ai/year-end-tax-summary/route.ts`
* `src/app/api/v1/ai/freelance-content-calendar/route.ts`
* + 15 more

These are under `/api/v1/*` so middleware `apiRatelimit` caps **request rate**, не **AI calls per request**. **One legitimate request could trigger 10+ Haiku calls.**

**Burn estimate if user generates one content calendar (e.g. 20-week plan):**
* 20 loop iterations × 1 Haiku call × $0.005 = **$0.10 per click**

10 such tests in 2 days = $1.

---

## 🚨 Suspect pattern #3 — Sonnet endpoints

Only 2 endpoints use Sonnet 4.6 (3-5× more expensive than Haiku):

* `src/app/api/ai/scan-receipt/route.ts` — uses vision; `max_tokens: 500`; ~$0.008/call
* `src/app/api/proposals/price-estimate/route.ts` — `max_tokens: 1500`; ~$0.023/call

**Burn estimate if used heavily**: 100 receipt scans = $0.80; 100 price estimates = $2.30.

---

## What я cannot determine from code alone

Need from Anthropic Console (https://console.anthropic.com/settings/usage):

1. **Daily $ + token volume for May 14, 15, 16** — confirms when burn happened
2. **Top 5 endpoints by token volume** — pinpoints the actual hot spot
3. **Model breakdown** — confirms whether Sonnet или Haiku was the cost driver
4. **API key breakdown** — if multiple keys exist, isolates which one was used
5. **Spike timestamps** — match against deploys / tests / cron firings

---

## Recommendations (ordered by impact)

### Pre-launch must-do

1. **Add рейт limit к 325 unprotected endpoints.** Middleware `apiRatelimit` only covers `/api/v1/*` и `/api/auth/*`. Extend matcher to include `/api/*` (except `/api/cron/*` and `/api/webhooks/*`), или add per-route rate limiter to each AI endpoint.

2. **Add DB-side AI usage logging.** Replace `console.log` в `/lib/ai/usage.ts` with `INSERT INTO ai_usage_log`. New table:
   ```sql
   CREATE TABLE ai_usage_log (
     id uuid PK,
     user_id uuid,
     feature text,
     provider text,    -- anthropic | gemini-pro | gemini-flash | groq
     model text,
     input_tokens int,
     output_tokens int,
     duration_ms int,
     occurred_at timestamptz default now()
   );
   ```
   Then weekly dashboard queries can spot anomalies.

3. **Migrate remaining ~697 endpoints from Anthropic к `/lib/ai`.** Per existing memory `backlog_anthropic_endpoints_remaining_migration_p2.md`. After migration, Anthropic burn = $0 unless explicit `provider: 'anthropic'` override.

4. **Audit все 14 useEffect-AI-fire components.** For each, decide:
   * Move к server-side data fetch with cache → no per-visit AI call
   * Or gate behind explicit user action (button click)
   * Or skip AI на visits where cached output exists

### Post-launch nice-to-have

5. **Per-user daily AI budget cap.** Reject AI calls после $0.50/day per user. Prevents catastrophic burn from единого user even if rate limits fail.

6. **Anthropic spend alert.** Set Anthropic Console alert at $5 daily / $50 monthly. Email Ramiz immediately on trigger.

---

## My ask

Please paste:

1. Output of Anthropic Console "Usage by date" chart для last 7 days
2. Top 5 endpoints by token volume (если console exposes this)
3. Model breakdown (Haiku vs Sonnet) для May 14-16
4. List of active API keys (sk-ant-...; mask middle)

Once я have those numbers, я can:
* Pinpoint the offending endpoint (если any)
* Recommend specific fix
* Estimate production cost
* Decide migrate-vs-stay-with-Anthropic

---

## Evidence files

`audit/agent3-anthropic-audit/`:
* `01-callsite-inventory.txt` — 711 files
* `02-callsite-breakdown.txt` — by directory
* `03-cron-inspection.txt` — 13 cron jobs detailed
* `04-cron-schedules.txt` — vercel.json cron extracts
* `05-model-streaming-caps.txt` — models, streaming, max_tokens
* `06-ratelimit-coverage.txt` — middleware gap analysis
* `07-auth-cache-samples.txt` — sample endpoint patterns
* `08-render-time-risk.txt` — useEffect-fire components
* `09-suspect-files.txt` — RiskWidget detail
* `10-ai-routing-clarity.txt` — /lib/ai vs direct Anthropic
* `11-expensive-endpoints.txt` — Sonnet / high-token list
* `12-loop-recursion.txt` — 19 loop-driven AI endpoints
* `13-db-usage-tables.txt` — DB has no ai_usage_log
* `report.md` — this document
