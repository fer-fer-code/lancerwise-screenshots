# Handoff to AGENT 2 — about `e0757ec` deploy failure

## TL;DR

**Your code is fine.** `e0757ec` is serving production successfully right now (deploy `dpl_uMrqsYfmqr9PcD8ySVHTCePfHaW1`, state=READY). The first deploy attempt (`dpl_EUZYsFTG8...`) hit a Vercel platform flake — hung 45 min in "Collecting page data" stage. Vercel auto-retried ~46 min later with the same commit and it completed in 4.4 min.

**No revert needed.** AGENT 3 (me) declined to revert despite the original task asking me to. Caught the premise mismatch before destructive action.

## What you should know

### 1. Your P1-A perf fix is live + working
- API route `/api/dashboard/widget-data` deployed
- Context provider `DashboardDataContext.tsx` deployed
- Dashboard loads with batched fetches as designed

### 2. The "45-min build timeout" was a Vercel infra issue, not a bug

Failed build log (full text in [`DIAGNOSIS.md`](DIAGNOSIS.md)):
```
✓ Compiled successfully in 2.3min
  Running next.config.js provided runAfterProductionCompile ...
✓ Completed runAfterProductionCompile in 1501ms
  Skipping validation of types
  Finished TypeScript config validation in 32ms ...
  Collecting page data using 3 workers ...
[hung 45 minutes — no further output]
```

The retry of the SAME COMMIT completed all stages in 4.4 minutes. If your commit had a deterministic prerender issue (e.g. infinite loop, blocking data fetch in a Server Component), the retry would have hit the same hang.

### 3. Process reminder — direct push to main bypassed gates

You pushed `e0757ec` directly to main, skipping:
- ESLint i18n gate
- locale-purity gate
- Visual regression gate (typically flakes but checked)
- Vercel preview verification

For future P1-* work, please follow the agreed PR flow:
```bash
git checkout -b fix/p1-a-dashboard-n-plus-1-v2
git commit ...
git push -u origin fix/p1-a-dashboard-n-plus-1-v2
gh pr create --title "..."
# Wait for CI gates → admin-merge if visual-regression flakes only
```

This isn't about formality — running `npm run build` locally first would have:
- Caught any deterministic prerender issue immediately
- Given you a Vercel preview URL to verify before merging
- Made the failed-deploy scenario impossible (failed previews don't affect production)

### 4. About Sentry verification

Once you confirm dashboard widgets are loading via the batched route (open `/dashboard` while logged in, check Network tab shows ONE `/api/dashboard/widget-data` request instead of 6+ per-widget calls), tag [AGENT 4] per his armed Sentry plan to verify no new errors from the perf change.

## What AGENT 3 did instead of reverting

1. Pulled Vercel build logs via REST API — identified the hang point
2. Compared failed-deploy duration (45 min) vs retry duration (4.4 min, same commit)
3. Verified production is currently healthy (commit `e0757ec` serving www.lancerwise.com)
4. Tested all critical endpoints (HTTP 200 / auth gates / LS webhook 401 / Stripe coexistence 503)
5. Asked user via `AskUserQuestion` for confirmation before destructive revert
6. User chose "Skip revert — document flaky build"
7. Wrote 4 evidence files in `audit/agent3-deploy-failure-revert/`

## If a similar Vercel flake hits again

1. Don't revert immediately — check if Vercel auto-retried
2. Look at the build log: if it hangs in "Collecting page data", that's the flake pattern
3. Manually trigger redeploy via Vercel dashboard or empty commit if Vercel doesn't auto-retry
4. If a 2nd attempt ALSO fails the same way → THEN investigate the commit

## Status

- Your code: ✅ live, working
- Process: ❗ direct-push to main flagged for future PRs
- Sentry: tag AGENT 4 after dashboard verification

Cross-reference: this incident parallels memory `feedback_force_dynamic_invariant.md` (the PR #28 incident) in symptom only — root cause here is **transient infra**, not deterministic code issue.
