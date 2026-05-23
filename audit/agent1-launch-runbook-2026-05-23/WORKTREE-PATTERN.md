# Git Author Pattern в Shared Worktree

**Author:** [AGENT 1]
**Date:** 2026-05-23 (pre-launch security review follow-up)
**Status:** Accepted convention — documented для onboarding clarity

---

## Context

`lancerwise-screenshots` repo is а **single shared physical worktree** на Ramiz's Mac, used by 6 agents в parallel ([AGENT 1] through [AGENT 6]). Git config in that worktree is set once и applies к all commits regardless of which agent is committing:

```bash
$ cd /Users/myoffice/lancerwise-screenshots
$ git config user.email
marketing-agent@lancerwise.com
$ git config user.name
agent5-marketing
```

This config was originally set by [AGENT 5] (marketing) when the worktree was first provisioned. Subsequent agents inherit the same git identity.

## Implication

The `author` field в commit metadata reflects the **worktree-owner pseudonym** (`agent5-marketing`), NOT the specific `[AGENT N]` that authored the commit. This is а deliberate consequence of the single-worktree pattern, NOT а misattribution bug.

Verified observation from security review (2026-05-23, post-launch-runbook task):

| Commit SHA | `[AGENT N]` prefix (subject) | git author field |
|---|---|---|
| `b303188` | `[AGENT 1] LAUNCH-RUNBOOK §5 URLs` | `agent5-marketing <marketing-agent@lancerwise.com>` |
| `5e640f1` | `[AGENT 1] Launch-day operational runbook` | same |
| `d987760` | `[AGENT 4] Historical Sentry review 7d` | same |
| `d1bb5ad` | `[AGENT 3] FINAL pre-launch smoke 11/11 PASS` | same |
| (all other audit commits since [AGENT 5] worktree setup) | various | same |

The code repo (`lancerwise`) has а separate config (`user.email = krokusstudia2@gmail.com`, `user.name = Ramiz Fiziev`) — used для code merges, NOT shared с the audit worktree.

## Convention

**Agent identity is attributed через `[AGENT N]` prefix в the commit message subject line, никогда не через git author fields.**

- ✅ Correct: `git commit -m "[AGENT 1] LAUNCH-RUNBOOK update — ..."` — agent identity в subject
- ❌ Incorrect: assuming `git log --author=agent1@...` will find [AGENT 1] commits — it won't, because all agents share the same author field

## Audit queries

| Query | Works? |
|---|:---:|
| `git log --grep '\[AGENT 1\]'` | ✅ |
| `git log --grep '\[AGENT [0-9]\]'` (all agents) | ✅ |
| `git log --author='agent1'` | ❌ all commits return same author |
| `git log --author='marketing-agent'` | ⚠️ matches ALL audit commits regardless of agent |

For per-agent activity reports OR ownership tracking, use `--grep '\[AGENT N\]'` exclusively.

## Decision rationale

Three options were considered during 2026-05-23 security review:

| Option | Action | Trade-off | Choice |
|---|---|---|---|
| 1. Leave as-is | Accept current config silently | Cheap но opaque к future maintainers | ❌ |
| 2. Per-agent worktree split | Each agent gets own `lancerwise-screenshots-agentN/` worktree с distinct git config | High infrastructure cost, не worth для current scale | ❌ |
| 3. Document convention | Accept current pattern + document explicitly | Cheap, removes future confusion | ✅ **adopted** |

Option 3 chosen — current scale (6 agents, single Mac, pre-launch sprint) doesn't justify per-agent worktree split. If scale grows (10+ agents OR multi-developer setup), reconsider option 2.

## When this pattern breaks

Two cases where the shared-worktree-shared-author pattern WOULD become а problem:

1. **Compliance requires per-commit user attribution** (e.g., regulated industry, SOC2 with strict author verification). Not applicable currently.
2. **GitHub OR downstream tooling parses author email для billing OR access control**. Not currently relevant — GitHub treats all commits as Ramiz's repo activity regardless of git author field, since the push token belongs к Ramiz's account.

If either becomes true, escalate к Ramiz + reconsider option 2.

## Cross-references

- Security review report: 2026-05-23 — see commit `b303188` follow-up Telegram thread
- `.gitignore` defensive update: commit `2d33ca8` (same review)
- Worktree pattern memory candidate: `feedback_worktree_shared_author_convention` (TODO if memory needed)
