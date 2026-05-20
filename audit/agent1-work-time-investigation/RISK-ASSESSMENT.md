# /work/time — Risk Assessment

## Performance impact

**Chromium /work/time mount produces 95 direct Supabase REST calls.**

| Metric | Observation | Threshold | Verdict |
|---|---|---|---|
| FCP cold | 5264 ms | 2500 ms | **POOR** (red on Web Vitals) |
| FCP steady-state | 2744-3332 ms | 2500 ms | **NEEDS IMPROVEMENT** (yellow) |
| LCP | 2744-5780 ms | 2500 ms | POOR cold, borderline warm |
| supabaseRestCount | 95 / 95 / 95 | <10 ideal | **8.5× worse than `/dashboard` pre-fix (was 22)** |

This is the **most-N+1 page in the app** by absolute call count. `/settings` is the second-worst at 27 calls.

## Cost impact (Supabase)

Per user load of `/work/time`:
- 95 REST calls к Supabase
- At active-user scale (estimate 100 DAU early post-launch): 95 × ~3 page loads/day × 100 users = **28,500 calls/day on this single page**
- Supabase free tier: 50K monthly active users + 500K monthly DB requests
- This page alone could exhaust 1/15 of the monthly DB request budget at 100 DAU
- At 1000 DAU scale: 855K/month on one page → blows free tier

Pricing tier consequence: starts being a real cost line при scale. Not immediate at <100 DAU but compounds.

## UX impact

User experience on `/work/time` page load:

1. **Network tab floods** с 95 simultaneous fetches к Supabase
2. **Browser parallelism caps** at ~6 connections per origin — most fetches queue
3. **JS main thread contention** — each fetch resolution triggers a state update, triggers re-render
4. **Mobile heap pressure** (matches Bug #74 invoice-detail mobile crash pattern) — likely к crash iOS Safari at scale
5. **Visible lag** — UI feels jittery, widgets pop in over 2-5 seconds even on warm load

## Sentry / alerting impact

- No existing alert specifically for `/work/time`. Could be added (#80 backlog) but not pre-launch necessity.
- React error #418 (hydration mismatch) firing consistently — may flood Sentry once `Sentry.captureException` is wired (#82). Worth checking before enabling broad error capture.

## Mobile Safari crash risk

Pattern matches Bug #74 (invoice detail crashed mobile Safari). Higher widget count (101) increases probability:
- Bug #74: ~10-15 widgets → consistent crash on iOS
- `/work/time`: 101 widgets → expect even more aggressive failure mode
- **Probable iOS Safari crash on this route**, even before fully loaded

We can't verify directly from baseline data (WebKit didn't actually render the page — bodyLen 249), but the prediction is high-confidence.

## Launch blocker assessment

**Recommendation: P1 — fix before launch.**

Reasoning:
- Worst N+1 page in the app
- Highly probable iOS Safari crash (pattern match с #74)
- Auth-gated, so all real users hit it (no "fix when traffic justifies it" defer path)
- Russian launch market = mostly mobile users → high crash exposure
- Fix recipe already proven (#73 + #86 + #74 in progress)

Mitigation if пришлось to ship as-is:
- Add iOS Safari detection + show "open on desktop для best experience" banner. Ugly.
- Lazy-load all 101 widgets behind tabs/sections so only ~10 mount initially. Big refactor effort.
- Roll back `/work/time` к a previous simpler version. Untenable — multiple PRs would need reverting.

The clean fix is significantly cheaper than mitigation. Should be P1.

## Launch blocker — comparing severity

| Issue | Severity | Reason |
|---|---|---|
| `/work/time` 95-call storm | P1 | Worst absolute N+1, iOS crash risk, auth-gated |
| `/settings` 27-call storm | P1 (per BASELINES.md TL;DR) | Already flagged; second worst |
| `/clients`, `/invoices`, `/contracts` 2-3 calls + FCP > 3s | P2 | Magnitude lower; should batch but not blocker |
| `/dashboard` 0 calls but FCP > 7s cold | P2 (#90) | Cold-start variance, not call storm |
| `/invoices/[id]` mobile crash | P1 (#74) | Already in flight |

Three P1 perf issues active: `/work/time`, `/settings`, `/invoices/[id]`. Same pattern; same fix recipe. Could be combined into a single sweep PR if resourced.

## Related

- INVESTIGATION-REPORT.md
- HYPOTHESIS-RANKING.md
- RECOMMENDED-FIX-SCOPE.md
- BASELINES.md (parent baseline document)
