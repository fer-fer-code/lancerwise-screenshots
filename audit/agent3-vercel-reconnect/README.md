# [AGENT 3] Vercel project ↔ GitHub repo link investigation

Investigation of why `git push origin main` does not auto-deploy on Vercel, and a self-contained action sheet for Ramiz to complete the fix.

## Status

| Item | Status |
| ---- | ------ |
| Diagnose current state | ✓ |
| Identify root cause | ✓ — `(a)` from the 5-candidate list, with strong evidence |
| Apply fix | ✗ — requires interactive OAuth handshake on Ramiz's GitHub account; documented as 5-min click sequence in `ramiz-action-needed.md` |
| Verify reconnect (test commit + auto-deploy watch) | Pending Ramiz "vercel connected" signal |

## TL;DR

The Vercel project was created via `vercel deploy` (CLI bootstrap) at project createdAt 2026-04-24 10:50 UTC. The Vercel GitHub App was never installed on the `fer-fer-code` GitHub account, so Vercel has zero visibility into any of the user's GitHub repos. This is a **set up from scratch** situation, not a "reconnect" — there was nothing to reconnect from.

100% of 825 historical deploys came via `source=cli`. Zero git-source deploys ever. Confirms the link was never established at any point.

## Evidence — diagnostic snapshot

See [`before.txt`](before.txt) for the full diagnostic output. Headline facts:

| Check | Result | What this means |
| ----- | ------ | --------------- |
| Vercel project `link` field (REST v9) | `None` | No git provider connection |
| Vercel project `deployHooks` count | 0 | No webhook receivers configured |
| Past 825 deployments | 100% `source=cli` | Project never received a git push trigger |
| GH repo webhooks (`/repos/fer-fer-code/lancerwise/hooks`) | 0 | No Vercel webhook installed on the repo |
| Vercel `git-namespaces?provider=github` | 0 visible | Vercel doesn't see ANY GH namespace for this account |
| Vercel `git-search/github?slug=fer-fer-code/lancerwise` | 404 not_found | Vercel can't find the specific repo either |

Cross-cuts: 5 of 5 diagnostic signals point to "GitHub App was never installed". Singular root cause, not multiple overlapping issues.

## Root cause vs the 5 candidates in the brief

| # | Candidate | Match? |
| - | --------- | ------ |
| a | Vercel GitHub App uninstalled from repo | **✓ stronger form** — never installed at all (not just uninstalled) |
| b | Auth token expired | ✗ — no auth was ever made; no token to expire |
| c | Repo renamed/transferred | ✗ — repo name has been stable since project creation |
| d | Manual unlink at some point | ✗ — never linked, so couldn't be unlinked |
| e | Permissions issue with GitHub org | ✗ — would only matter post-install; install hasn't happened |

## Why agent can't complete this

Three reasons documented in `ramiz-action-needed.md` §"Why this requires you (not me)":

1. GitHub App install requires GitHub user consent — separate from the OAuth scopes the agent's `gh` CLI already has.
2. The Chrome session's Vercel side could be driven by the agent, but the redirect to GitHub's consent screen needs a human approval click.
3. Splitting halves of a 5-min task between agent and human is more error-prone than handing the whole thing to Ramiz.

## Next action

→ **Read [`ramiz-action-needed.md`](ramiz-action-needed.md)** — 5-minute, browser-only click sequence. Reply with `[AGENT 3] vercel connected` when done.

After signal: [AGENT 3] will re-check link field, push a test commit, watch auto-deploy fire, and write `after.txt` + `test-deploy.log` to this directory.

## Coordination

- [AGENT 2] is running B2 cluster 3 migrations. The CLI-deploy chain still works for parallel B2 PRs — no disruption from this investigation (read-only, no changes pushed).
- [AGENT 1] in standby for QA bugs. Same — no disruption.
- The Vercel API checks did not modify any project state.

## Stopping condition triggered

Per brief: "Pause and report immediately if … GitHub App permissions need org-level approval that requires Ramiz". This is exactly that — flagged here, no destructive action taken, no production deploy invalidated.

## Files

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — status overview + diagnosis summary |
| [`ramiz-action-needed.md`](ramiz-action-needed.md) | 5-minute click sequence for Ramiz to complete the GitHub App install + git link |
| [`before.txt`](before.txt) | full diagnostic output (API calls + results) before the fix |
| `after.txt` | pending — written after Ramiz signal + verification |
| `test-deploy.log` | pending — auto-deploy log of the verification commit |
