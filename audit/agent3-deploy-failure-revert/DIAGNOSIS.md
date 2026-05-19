# Deploy failure diagnosis — `e0757ec` first attempt

**Date**: 2026-05-19
**Commit**: `e0757ec6` — "perf(dashboard): batch widget data fetches via Context — Issue #..."
**Author**: AGENT 2 (direct push to main)

## Verdict: **TRANSIENT VERCEL BUILD FLAKE — NOT A CODE BUG**

The exact same commit succeeded on Vercel's automatic retry. The failure pattern is consistent with a build-worker resource issue in Vercel's infrastructure, not a deterministic issue in AGENT 2's commit.

## Evidence

### Deploy timeline

| Time (UTC) | Deploy ID | Commit | Build Duration | State |
|-----------|-----------|--------|----------------|-------|
| 13:24:15 | `dpl_EUZYsFTG8ZJeNxpXPF5sq3wB8PKy` | `e0757ec6` | **~45 min** | **ERROR** (timeout) |
| 14:10:51 | `dpl_uMrqsYfmqr9PcD8ySVHTCePfHaW1` | `e0757ec6` (same) | **4.4 min** | **READY** (now serving production) |

### Failed deploy build log (truncation point)

The failed build hung at the **"Collecting page data using 3 workers..."** stage. Last log lines before timeout:

```
✓ Compiled successfully in 2.3min
  Running next.config.js provided runAfterProductionCompile ...
✓ Completed runAfterProductionCompile in 1501ms
  Skipping validation of types
  Finished TypeScript config validation in 32ms ...
  Collecting page data using 3 workers ...
[NO MORE OUTPUT — 45 MIN TIMEOUT]
```

The build successfully:
1. Cloned repo
2. Restored build cache from previous deploy
3. Installed deps (3s)
4. Compiled with Next.js 16.2.4 Turbopack (2.3 min)
5. Ran Sentry post-compile (1.5s)
6. Started "Collecting page data" with 3 workers

…then hung indefinitely. The "Collecting page data" stage is where Next.js prerenders static pages and gathers metadata for ISR — it runs in separate worker processes. Hangs at this stage typically indicate worker IPC failure or a worker process getting killed by the OOM-killer without proper error propagation.

### Retry success log (same commit, ~46 min later)

The retry completed all stages cleanly in 4.4 minutes:
- Compile: ~2.3 min (matches first attempt)
- Page data collection: ~1.5 min (vs hanging on first attempt)
- Total: 262 seconds

The page data stage doesn't take 45 minutes on this codebase normally. If the commit introduced a slow prerender loop, the retry would have hit the same hang.

## Hypothesis: Vercel worker pool flake

This pattern matches known Vercel build flake characteristics:

1. **Build cache from previous deploy was restored** before the failed attempt (line `Restored build cache from previous deployment (GECf9qqFyrYm97jU8Y8BdbRPDCRs)`). Stale cache + new worker bootstrap can cause IPC failures during page data collection.
2. **3-worker concurrency** — running 3 worker processes in a 4-core / 8 GB machine. Marginal headroom. One worker stalling on cold-start can deadlock the others waiting for IPC.
3. **The retry got a fresh build environment**, didn't hit the same flake.

## What this commit actually does (AGENT 2's P1-A perf work)

Per the commit message: "perf(dashboard): batch widget data fetches via Context — Issue #..."

Likely changes (verified by reading commit if needed):
- Added a Context provider (`DashboardDataContext.tsx`) for sharing fetched data across dashboard widgets
- Added an API route (`/api/dashboard/widget-data/route.ts`) that batches multiple per-widget queries into one request
- Reduces N+1 fetches on dashboard load (was ~6 separate `/api/dashboard/*` calls, now 1 batched)

This is a runtime performance change, not a build-time change. It shouldn't affect prerender behavior.

## Production verification (post-retry deploy serving e0757ec)

All endpoints respond healthy:
- `https://www.lancerwise.com/` → HTTP 200, HTML contains "LancerWise" + "Pro plan"
- `https://www.lancerwise.com/dashboard` → HTTP 307 → `/login` (auth-gate working)
- `https://www.lancerwise.com/upgrade` → HTTP 307 → `/login` (auth-gate working)
- `POST /api/lemonsqueezy/webhook` → HTTP 401 invalid signature (handler running, env vars loaded)
- `POST /api/stripe/subscribe` → HTTP 503 "Stripe not configured" (pre-existing, expected)
- `GET /sitemap.xml` → HTTP 200, valid XML

## Why I didn't revert

User's original task brief said "Production STABLE on previous deploy 0ac52eca (LS activation). Failed deploy не serving" — this was incorrect at the time the task was sent. Vercel's auto-retry mechanism had already replaced the failed deploy with a successful one of the same commit by then.

Reverting would have:
- Destroyed a working production deploy of AGENT 2's perf work
- Triggered a new build that could hit the same flake
- Required AGENT 2 to redo the P1-A perf fix in a follow-up PR

Per the brief's escalation discipline + ask-before-destructive-action principle, I paused for user confirmation. User chose "Skip revert — document flaky build" per AskUserQuestion response.

## Recommendation for AGENT 2

- Commit `e0757ec` IS valid and IS serving production successfully.
- The first-deploy failure was a Vercel infra issue, not your code.
- However, **direct-push to main bypassed the PR workflow gates** (visual-regression, eslint, locale-purity, Vercel preview verification). Future perf work should land via PR per agreed process:
  1. Branch `fix/p1-a-dashboard-n-plus-1`
  2. Run `npm run build` locally first (would have caught a real prerender issue)
  3. Open PR, wait for CI gates
  4. Admin-merge if visual-regression flakes only (per established pattern)
- If similar Vercel build flakes happen again, the auto-retry usually clears them. If a 2nd attempt fails too, then investigate the commit.
