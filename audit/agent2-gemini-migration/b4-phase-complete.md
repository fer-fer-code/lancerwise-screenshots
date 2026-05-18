# B4 PHASE COMPLETE — 60 non-streaming endpoints migrated

**Date:** 2026-05-18
**Final commit:** `8b05570adc77091ad13c6818125107361422708b`
**B4 PRs:** #58 (24 /tools/*), #59 (36 other)

---

## Final state

```bash
# Files на @anthropic-ai/sdk
find src/app/api -name "*.ts" -exec grep -l "@anthropic-ai/sdk" {} \; | wc -l
→ 1  (was 312 outside /v1/ai/ before B3+B4)

# The 1 remaining
→ src/app/api/ai/scan-receipt/route.ts  (vision endpoint — B6 scope)

# Total /api/ routes routing к /lib/ai
grep -rln "from '@/lib/ai'" src/app/api/ | wc -l
→ 740
```

---

## Cumulative session totals

| Phase | Endpoints | PRs |
|-------|-----------|-----|
| B2 (v1/ai messages.create) | 364 | #11-#38 |
| B3a infra | 0 | #40 |
| B3b (251 streaming) | 251 | #43, #44, #46, #49, #51-#57 |
| B4 C1 (/tools/* non-streaming) | 24 | #58 |
| B4 C2 (other non-streaming) | 36 | #59 |
| **TOTAL** | **675** | **23+ PRs** |

---

## B4 specifics

### Cluster split

- **C1 (PR #58):** 24 /api/tools/* files — `messages.create` patterns
- **C2 (PR #59):** 36 other files — analytics/, clients/, dashboard/, expenses/scan/, finance/aging/, insights/, intake-forms/, kb/, ltv-predictions/, onboarding/, outreach/, pitch-practice/, project-notes/, projects/, proposals/v2, rate-card/, reports/, risk-analyzer/, subscriptions/, templates/, time-tracker/, v1/{clients,contracts,leads,projects,smart-brief}, weekly-summaries/

### Migrator edge cases handled

| Pattern | Files affected | Fix |
|---|---|---|
| 5 parallel `Promise.all` messages.create | bio-generator | Manual rewrite as 5x generateText |
| 3-variant Promise.all с shared system | cold-pitch/variations | Manual rewrite |
| Hybrid `messages.create({stream: true})` | brand-audit, proposals/v2/generate, weekly-summaries/generate, subscriptions/audit, risk-analyzer/recommend, projects/[id]/scope-message | Convert к streamText (auto-fixed via `/tmp/fix-stream-hybrid.py`) |
| `.find(c => c.type === 'text')` extraction | analytics/income-concentration, analytics/service-revenue, plus 7 others | Replace block с direct `message` access (auto-fixed via `/tmp/fix-find-pattern.py`) |
| Multi-block `.filter().map().join()` | scope-estimator, ltv-predictions | Replace с `message.trim()` |
| Multi-turn messages array | pitch-practice/[id]/message | Compile transcript prompt |
| `parseReceipt(text, currency)` module-level helper accessing `user` | expenses/scan/batch | Added userId param к helper signature |
| `Anthropic.TextBlock` / `Anthropic.Message` type annotations | Various | Auto-fixed via `/tmp/fix-message-extract.py` |

---

## Vercel build OOM — workaround

Mid-B4 C1, preview build hit OOM at "Collecting page data using 3 workers" stage twice (40+min stuck builds). Root cause: codebase grew past 8GB build container memory budget as cumulative force-dynamic + /lib/ai imports across 675 routes saturated the page-data collection phase.

**Fix:** Added `NEXT_PRIVATE_BUILD_WORKERS=1` env var (production + preview + development targets) via Vercel API. Forces Next.js к use 1 build worker instead of 3, reducing peak memory at cost of slower compile.

Build went from OOM-fail к SUCCESS в ~4min after the env var landed. No Enhanced Builds upgrade (paid) needed.

---

## Remaining

### B5 (scattered routes — deferred)

Zero remaining files NOT in /v1/ai/ or /tools/ that use @anthropic-ai/sdk outside B6 scope. B5 essentially absorbed by B3+B4. No additional work.

### B6 (scan-receipt vision — deferred)

`src/app/api/ai/scan-receipt/route.ts` uses Anthropic Sonnet vision (`messages.create` с image content block). Cannot migrate to current `/lib/ai/generateText` since it doesn't support vision yet. Requires:
1. Add `generateVision()` к `/lib/ai/index.ts` (calls Gemini's multimodal API)
2. Migrate scan-receipt к use it

Single endpoint, P3 priority (receipt scanning, not launch-blocking).

### Post-launch cleanup (covered separately в `post-launch-cleanup-todo.md`)

* Strip hot-touch comments from `/api/ai/risk` + `/api/ai/budget`
* Fix 385 pre-existing TS errors from B2 cluster 1-8 migrator's `message.usage` residue
* Audit `/api/ai/*` для missing-force-dynamic preemptive sweep
* Decision point: remove `NEXT_PRIVATE_BUILD_WORKERS=1` post-launch if codebase shrinks OR keep for safety
