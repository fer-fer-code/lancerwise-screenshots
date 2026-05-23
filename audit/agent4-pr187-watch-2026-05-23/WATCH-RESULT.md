# PR #187 (Upgrade CTA fix) — 15-min post-deploy Sentry watch

**Author:** [AGENT 4]
**Deploy:** `04f28ee49ac7c6cff8b7cc8e4e87825307097b2c`
**Sentry release dateReleased:** 2026-05-23T04:42:36Z
**Vercel READY:** 2026-05-23T04:44:16Z
**Watch window:** 2026-05-23T04:53:50Z → 2026-05-23T05:10:09Z (16m 19s, 12 iter × 75s)
**Time gap deploy → watch start:** 9m 34s (timely)
**Verdict:** ✅ **CLEAN — PR #187 ships safely**

---

## Iteration table

| iter | UTC | LW-5 | LW-6 | LW-9 | LW-A | LW-B | mw | PlansGrid | tier | api | new |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 04:53:50 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 2 | 04:55:15 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 3 | 04:56:40 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 4 | 04:58:06 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 5 | 04:59:31 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 6 | 05:00:56 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 7 | 05:02:24 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 8 | 05:04:19 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 9 | 05:05:45 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 10 | 05:07:10 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 11 | 05:08:42 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |
| 12 | 05:10:09 | 7 | 7 | 15 | 3 | 3 | 0 | 0 | 0 | 0 | 0 |

**Pure-flat every metric across all 12 iterations.**

---

## Signal-by-signal verdict

| Signal | Threshold | Observed | Result |
|---|---|---|---|
| New LANCERWISE-* with `firstSeen >= 04:44:16Z` | 0 = pass | 0 (12/12) | ✅ PASS |
| Issues tagged to `04f28ee4...` SHA | 0 = pass | 0 | ✅ PASS |
| MIDDLEWARE_INVOCATION_FAILED count | 0 | 0 throughout | ✅ P0 #154 holding **~29h** |
| **PlansGrid_iss (NEW)** | **0 = pass** | **0** throughout | ✅ PlansGrid.tsx not throwing |
| **tier_iss (NEW — null tier handling)** | **0 = pass** | **0** throughout | ✅ null tier guards working |
| LW-9 reactivation | count > 15 = FAIL | 15 (frozen) | ✅ |
| LW-6 reactivation | count > 7 = FAIL | 7 (frozen) | ✅ |
| LW-A reactivation | count > 3 = FAIL | 3 (frozen) | ✅ |
| LW-B passive monitoring | freeze at 3 | **3** (frozen) | ✅ UTF-8 fix holding ~12h 15m post-#185 |
| LW-5 metric_issue | informational | 7 (no ticks this watch) | ℹ️ quiet window |
| `/api/*` 5xx anomalies | 0 = pass | 0 throughout | ✅ |

---

## Baseline noise — LW-7 (pre-existing /upgrade error)

A baseline query for `upgrade` returned 1 issue: **LANCERWISE-7** (TypeError: Load failed @ /upgrade, lastSeen 2026-05-19T18:55:45Z — 4 days old). This is the same pre-existing issue from prior watches, **not caused by PR #187** and not active during this window. Treat as baseline noise, not a signal.

---

## Streaks confirmed

- **P0 #154 middleware fix: 8 successive deploy watches with `mw_iss=0`** (P0 → #184 → #186 → #185 → #188 → #189 → #190 → #193 → #187). ~**29h** of accumulated production stability.
- **LW-B Upstash UTF-8 fix: ~12h 15m clean** post-#185 deploy. Triple-lock intact. T+24h confirmation watch (~17:00Z today, ~12h from now) approaching.
- **6 successive deploys clean** (#185 → #188 → #189 → #190 → #193 → #187).

---

## Verdict

✅ **CLEAN — PR #187 (Upgrade CTA fix) ships safely.** Both new signals (PlansGrid_iss + tier_iss) at zero — PlansGrid.tsx renders without throwing, null tier handling works. All 5 canaries frozen.

---

## Standby — open active watches

- **LW-B T+24h confirmation watch (~2026-05-23T17:00Z, ~12h from now)** — single per-issue GET. If count still 3 + lastRelease still `f27bb710`, archive LW-B `by_release` against `4b860e2a`.
- **Pre-launch final monitoring (T-30 min)**
- **Launch-day continuous Sentry watch**
- **First real LemonSqueezy purchase post-launch**

---

## Cross-references

- `audit/agent4-launch-day-runbook/POST-DEPLOY-VERIFICATION-15-MIN.md` — protocol
- `audit/agent4-pr193-watch-2026-05-22/WATCH-RESULT.md` — prior CLEAN (Organization schema)
- `audit/agent4-pr185-watch-2026-05-22/WATCH-RESULT.md` — LW-B fix verification
- Raw log: `audit/agent4-pr187-watch-2026-05-23/iterations.log`
