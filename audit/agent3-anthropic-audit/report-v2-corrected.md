# [AGENT 2] Anthropic Burn Audit — Corrected v2

**Date:** 2026-05-16
**Status:** Code audit complete с corrections. Browser locked → Anthropic Console capture deferred.

---

## ⚠️ Corrections к interim report

Two "suspect patterns" flagged earlier turned out to be **false alarms** on closer inspection. Honest correction:

### ❌ False alarm #1 — useEffect-AI-fire components

Original claim: "14 client components fire AI on render."

**Reality:** 13 of 14 useEffect-on-mount calls fire LIST loads (cheap), не AI generate endpoints:

| Component | useEffect calls | Endpoint actually hit | AI fire on mount? |
|---|---|---|---|
| `dashboard/RiskWidget.tsx` | `load()` | `/api/ai/risk` | **YES** — but routes к Gemini Flash via `/lib/ai`, not Anthropic |
| `settings/GmailConnect.tsx` | `fetchConnection()` | `/api/gmail/connection` | No (OAuth state, no AI) |
| `tools/status-updates/...` | `loadHistory()` | `/api/status-updates` | No (list endpoint) |
| `tools/retainer-manager/...` | `load()` | `/api/retainer-manager` | No (list) |
| `tools/opportunity-eval/...` | `loadHistory()` | `/api/opportunity-eval` | No (list) |
| `tools/press-kit/...` | `loadSavedKits()` | `/api/press-kits` | No (list) |
| `tools/project-velocity/...` | `load()` | `/api/project-velocity` | No (list) |
| `tools/sow/SOWClient.tsx` | `fetchDocs()` | `/api/tools/sow` | No (list) |
| `tools/late-fees/...` | (localStorage only) | none | No |
| `tools/win-rate/...` | `load()` | `/api/win-rate` | No (list) |
| `tools/proposals/...` | `loadProposals()` | `/api/proposals/v2` | No (list) |
| `leads/page.tsx` | input focus | none | No |
| `crm/pipeline/...` | `loadLeads()` | `/api/crm/leads` | No (list) |
| `time-tracker/WeeklySummaryEmail.tsx` | `setMounted(true)` | none | No |

**Net Anthropic burn from render-time useEffect: zero.** RiskWidget DOES fire AI на mount, но it routes к Gemini.

Evidence: `14-useeffect-fires-detail.txt`.

### ❌ False alarm #2 — Loop-driven AI calls

Original claim: "19 endpoints fire AI inside loops, 1 request → many calls."

**Reality:** Loops are data-aggregation, not AI-fire iteration. Each endpoint makes **one** `messages.create` call с the loop's output used to BUILD the prompt.

Sample inspection:

* `v1/projects/[id]/notes/summary` — uses `noteArr.map(n => \`[${i+1}] ${n.title}: ${n.content}\`).join('\n').slice(0, 3000)` to format prompt, then ONE Haiku call.
* `v1/smart-brief` — uses `overdueRes.data.map(...)` to build invoice list, ONE Haiku call.
* `v1/ai/year-end-tax-summary` — `for (const e of expenses)` to aggregate by category, ONE Haiku call.
* `v1/ai/work-from-home-routine` — `timeArr.map(...)` to extract start times, ONE Haiku call.

My grep `for (` / `.map(` within 600 chars before `messages.create` caught these aggregation patterns. Pattern was over-broad.

**Net Anthropic burn per request: 1 call per endpoint per user action.** Standard pattern.

---

## Confirmed (post-correction) audit state

### Where Anthropic actually fires

1. **13 cron jobs** — daily/weekly/monthly schedule, Haiku 4.5, iterate ~5 test users:
   * ~20 calls/day total across all crons
   * × $0.005/call (Haiku 4.5)
   * **= $0.06/day, $0.42/week, $1.80/month from crons**

2. **697 user-facing endpoints** — fire on explicit user action (button click, form submit). Distribution:
   * 695 use Haiku 4.5 (~$0.005-0.020 per call depending on max_tokens cap)
   * 2 use Sonnet 4.6 (~$0.008-0.023 per call)
   * All have `max_tokens` caps
   * All check Supabase auth

3. **1 endpoint в `/api/ai/*`** (rate-limited 20/hr per user by middleware aiRatelimit) — but routes к Gemini Flash via `/lib/ai`, no Anthropic burn.

### Burn estimate для observed test pattern

24-widget CP-A redo + 12 AI features × 2 days =

* **Optimistic** (5 AI clicks per widget × 24 widgets, all Haiku) = 120 calls × $0.008 avg = **~$1**
* **Realistic** (10-15 AI tests per widget on average + cron overhead + retries) = ~500 calls × $0.008 = **~$4**
* **Heavy testing** (rapid iteration с 30+ calls per widget + Sonnet receipt scan / price-estimate clicks) = ~1000 calls × $0.010 avg = **~$10**

$10 в 2 days for 24-widget intensive test session **is consistent с normal heavy-testing burn**, not с runaway bug. Sonnet calls (receipt scan, price estimate) would push the average higher если used frequently.

**No code-level smoking gun found.**

---

## What still need Console data к prove

Need from https://console.anthropic.com/settings/usage:

1. **Daily $ для May 14, 15, 16** — confirms whether burn was steady or spike
2. **Top 5 endpoints by token volume** — confirms whether burn is spread across many endpoints (normal testing) или concentrated in one (bug)
3. **Haiku vs Sonnet $ split** — confirms which model class drove the cost
4. **Per-API-key breakdown** — если multiple keys, isolates which one

If Console shows:
* Spread across 10+ endpoints → **NORMAL TESTING**, $10 для 2 days of dev iteration is expected for 24-widget rollout
* Concentrated в 1-2 endpoints with thousand-call counts → **BUG** in that specific endpoint (recursion, retry loop, или unbounded user input)
* Sonnet >70% of spend → user is overusing receipt scan / price-estimate which warrants per-user daily cap
* Identical token counts on each call (e.g. exactly 4096 every time) → hitting max_tokens cap on every call = expensive prompt template

---

## Playwright blocker

```
$ mcp__playwright__browser_tabs --action list
Error: Browser is already in use for /Users/myoffice/Library/Caches/ms-playwright/mcp-chrome-d284463
```

Another agent / process holds the browser lock. To capture Console data:

**Option A** (preferred): Ramiz closes other browser-using agents/sessions, я retry Playwright capture.

**Option B**: Ramiz screenshots Console manually:
* https://console.anthropic.com/settings/usage → set date 14-16 May → screenshot chart + numbers
* Settings → API Keys → screenshot list (mask middle, leave last 4)
* Send screenshots / OCR text

---

## Confirmed pre-launch must-do recommendations (unchanged from interim)

These stand regardless of root cause:

1. **Rate-limit 325 unprotected endpoints.** Extend middleware matcher OR add per-route limiter. Без this, post-launch single-user abuse could burn unbounded credit.

2. **DB-side AI usage logging.** Add `ai_usage_log` table; replace `console.log` в `/lib/ai/usage.ts` с INSERT. Запросто catch future anomalies в SQL вместо ходить в Anthropic Console.

3. **Per-user daily AI budget cap.** Reject AI calls после $0.50/day per user. Defense-in-depth even с rate limits.

4. **Anthropic spend alert.** Set Anthropic Console alert at $5/day / $50/month → email Ramiz on trigger.

5. **Migrate ~697 endpoints from direct Anthropic к `/lib/ai`.** Per existing memory `backlog_anthropic_endpoints_remaining_migration_p2.md`. После migration, default provider = Gemini Flash (cheaper) или Groq (faster). Anthropic stays available via explicit `provider: 'anthropic'` override.

---

## Verdict (provisional, pending Console data)

**Most likely: NORMAL TESTING.** $10 в 2 days from 24-widget rollout + 12 AI feature testing is consistent с moderate-to-heavy iteration. No code-level pattern points to runaway loop or recursion.

**Confidence:** Medium pending Console data. Confidence rises к High если Console shows spend spread across many endpoints / sessions.

**If Console shows specific concentrated endpoint:** that endpoint needs investigation (likely bug in retry logic, или unbounded prompt content from user input).

---

## Monthly cost forecast (если NORMAL TESTING confirmed)

Assumptions:
* 100 users
* 5 AI actions/week per user
* 80% Haiku 4.5 (avg $0.005/call), 20% Sonnet 4.6 (avg $0.020/call)
* Cron overhead: 4 calls/day per user (daily-tips, client-checkins, payment-reminders × 2)

Per user per week:
* 5 manual × (0.8 × $0.005 + 0.2 × $0.020) = 5 × $0.008 = $0.04
* + 28 cron calls × $0.005 = $0.14
* = **$0.18/user/week**

Per month:
* $0.18 × 4.3 weeks × 100 users = **$77/month**

Plus Sonnet vision usage (receipt scans, est. 2/user/week × $0.008) = $7/month
Plus development overhead = $20/month

**Estimated production AI cost: ~$100/month для 100 users.**

If migrated к Gemini Flash via `/lib/ai`: ~$30/month (Gemini Flash is ~3× cheaper input, ~5× cheaper output than Haiku 4.5).

---

## Apology

My interim report flagged "14 useEffect-AI-fire components" и "19 loop-driven endpoints" как critical patterns. After deeper inspection both turned out to be false positives. Original grep patterns were over-broad. Corrected herein.

Key learning: don't trust grep proximity for code-pattern verdicts — read the actual function bodies. Я should've spot-checked 2-3 examples before flagging.

---

## Evidence files

* `14-useeffect-fires-detail.txt` — confirms all useEffects fire list loads, не AI
* `12-loop-recursion.txt` — original false positive (kept for audit trail)
* `report.md` — original interim (kept для audit trail)
* `report-v2-corrected.md` — this document
