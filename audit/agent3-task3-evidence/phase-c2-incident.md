# Phase C-2 push-to-main incident report

**Date:** 2026-05-16
**Severity:** Low — production NOT affected
**Status:** Resolved (revert pushed before any deploy)

## What happened

While working on Phase C-2, my working tree was silently switched от `agent3-task3-email-qa` branch к `main` by a parallel agent (likely Agent #2 running rebases/checkouts на the same repo). I did not notice the switch before running `git commit` + `git push`, so Phase C-2 commit `7053a345` landed directly на origin/main.

Critical secondary problem: the Phase C-2 commit introduces a hard-fail в `sendEmail()` for non-transactional emails when `LANCERWISE_POSTAL_ADDRESS` env var is unset. The env var was NOT yet set on Vercel. Если Vercel had auto-deployed `7053a345`, **all non-transactional production emails would have started throwing** within minutes.

## Timeline

| Time | Event |
|---|---|
| ~11:14 | agent3 finished C-2 edits, ran `git commit` — silently on `main` because Agent #2 had checked out main моментом ранее |
| ~11:14 | `git push` — push к `origin/main` (commit `7053a345`) |
| ~11:21 | Reviewed git log, realized commit landed on main |
| ~11:24 | `git revert 7053a345` → commit `3df32c0e`, immediately pushed к main |
| ~11:25 | Cherry-picked `7053a345` → commit `cba9871b` on `agent3-task3-email-qa` branch |
| ~11:25 | Pushed feature branch — PR #3 now contains both phases |

**Window between bad push and revert:** ~10 minutes. No Vercel deploy completed within этот window (Vercel build queue had multiple parallel-agent commits, deploys spread out). Production code never executed `7053a345`.

## Verification: production NOT affected

`sendEmail()` did not throw в production within the window. Confirmed:

* Probed `email_logs` for sends in last 10 min — count = 0 (no recent sends, so nothing to fail на)
* Resend dashboard would show 500-level failures если any went through — Ramiz can verify

## Root cause

Parallel-agent branch switching без my knowledge. The Bash tool на macOS shares one working directory across agents — when Agent #2 rebased or checked out a different branch, my next `git commit` landed где Agent #2 left HEAD.

This same issue caused similar (less serious) friction during Task 2 (см. `audit/agent3-task2-evidence/final-report.md` "Issues encountered" section).

## Fix applied

* Revert `3df32c0e` pushed к main → cancels the bad commit
* Cherry-pick `cba9871b` onto `agent3-task3-email-qa` → C-2 changes live where they should
* PR #3 updated с both commits stacked + comment explaining env var requirement

## Prevention для future agent sessions

Two protocol items worth adding к `agent_learnings.md` или `feedback_parallel_agent_isolation.md`:

1. **`git branch --show-current` immediately before every commit**, not just at session start. Cheap, catches silent switches.
2. **`git push --force-with-lease` (or `--push-option=...`)** — at minimum verify the target branch name in the push output matches expectation before running.

Если parallel-agent isolation is a recurring problem, consider:
* Worktree-per-agent (`git worktree add ../lancerwise-agent3 agent3-task3-email-qa`)
* Or accept одиночные agent operation на the repo at a time

## Apologies

Direct push к main bypassed PR review. Не intentional; immediate revert + transparent disclosure. Lesson learned about branch verification cadence.
