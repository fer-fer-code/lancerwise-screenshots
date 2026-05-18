# [AGENT 3] Worktree isolation setup

Triggered after the 5th cross-repo / cross-branch contamination
incident today. Establishes 3 dedicated agent worktrees so each agent
works in a physically separate directory, eliminating "CWD drifted to
wrong repo" and "branch HEAD changed under me" failure modes.

## Final layout

```
/Users/myoffice/lancerwise          ← shared/main worktree (legacy; PRs land here)
/Users/myoffice/lancerwise-agent1   ← [AGENT 1] (Bug #001 batches)
/Users/myoffice/lancerwise-agent2   ← [AGENT 2] (Gemini migration + B2 clusters)
/Users/myoffice/lancerwise-agent3   ← [AGENT 3] (qa-infra, security audit, this directory's owner)
/Users/myoffice/lancerwise-cp-a     ← pre-existing CP-A redo worktree (unrelated)
```

Verification: `git worktree list` shows 5 entries.

## How it was set up

```bash
# From the shared main repo:
cd /Users/myoffice/lancerwise

# 1. Create 3 detached worktrees in parallel. Detached because git
#    refuses to check out 'main' more than once; each agent will
#    `git checkout -b fix/<task>` inside their own worktree when
#    starting a piece of work.
git worktree add --detach /Users/myoffice/lancerwise-agent1 main &
git worktree add --detach /Users/myoffice/lancerwise-agent2 main &
git worktree add --detach /Users/myoffice/lancerwise-agent3 main &
wait

# 2. Copy env (worktrees inherit .git but NOT untracked files)
cp .env.local /Users/myoffice/lancerwise-agent1/
cp .env.local /Users/myoffice/lancerwise-agent2/
cp .env.local /Users/myoffice/lancerwise-agent3/

# 3. Install node_modules per worktree in parallel (each worktree is a
#    full filesystem checkout so node_modules must exist in each)
cd /Users/myoffice/lancerwise-agent1 && npm install --prefer-offline --no-audit --no-fund &
cd /Users/myoffice/lancerwise-agent2 && npm install --prefer-offline --no-audit --no-fund &
cd /Users/myoffice/lancerwise-agent3 && npm install --prefer-offline --no-audit --no-fund &
wait
```

## Per-agent usage pattern

When an agent starts a new task:

```bash
# 1. Switch to your own worktree (use absolute paths in every command)
cd /Users/myoffice/lancerwise-agent3

# 2. Sync your worktree to latest main
git fetch origin
git checkout main 2>/dev/null || git checkout --detach origin/main

# Note: only ONE worktree can be on the main branch at a time. The
# shared /Users/myoffice/lancerwise is on main. Per-agent worktrees
# should stay detached unless they create their own feature branch.

# 3. Create your feature branch INSIDE your worktree
git checkout -b fix/my-task

# 4. Work, commit, push from your worktree
git add -p
git commit -m "..."
git push -u origin fix/my-task

# 5. Open PR (gh works the same way)
gh pr create --base main --head fix/my-task --title "..." --body "..."

# 6. After PR merges, sync your worktree back to main HEAD
git fetch origin
git checkout --detach origin/main  # or merge back into your worktree's HEAD
```

## Why detached HEAD (not branch-per-worktree)

Git rejects `git worktree add <path> main` if another worktree already
has `main` checked out. Options:
- **Detached HEAD per worktree** (chosen) — agents create their own
  feature branch with `git checkout -b` when starting work. No
  cross-contamination because each agent's `main` reference resolves
  to its own physical directory.
- **Per-agent main branch** (`main-agent1`, etc.) — extra branches to
  maintain, more confusing.
- **Branch checkout in shared `/lancerwise`** — defeats the purpose.

Detached HEAD is the lowest-friction choice for "each agent starts
fresh from latest main, creates their own feature branch, pushes from
their own dir".

## Gotchas observed during setup

1. **`git worktree add <path> main` fails if main is checked out elsewhere**
   — solved by adding `--detach` flag. Agents create their own
   feature branches with `git checkout -b` inside their worktree.

2. **`.env.local` is NOT shared via .git** — git tracks only committed
   files. Each worktree needs its own copy of `.env.local`,
   `.env.example` overrides, and any local secrets. Cron job pattern:
   if env vars rotate, update all 3 worktrees + the shared main repo.

3. **`node_modules` is NOT shared** — each worktree has its own copy
   (full ~1.5GB on disk per worktree). Parallel `npm install` takes
   ~1-3 min per worktree; total parallel time ~3 min on M-series
   Mac. Trade-off: 4.5GB extra disk for full isolation.

4. **`.next` build cache is NOT shared** — each worktree builds
   independently. Acceptable since each agent works on their own
   branch and doesn't need to share builds.

5. **`tests/e2e/.auth/storage-state.json`** — produced by Playwright's
   auth.setup test; if present in main worktree, copy to each agent's
   worktree too (Playwright caches Supabase session token here).
   Alternatively each worktree re-runs setup the first time tests run.

6. **Bash CWD does NOT persist between tool invocations** — historic
   pain point. Even with worktree isolation, each agent must `cd`
   into their absolute worktree path explicitly OR pass absolute
   paths to every command. Memory note in `feedback_worktree_isolation_pattern.md`.

## Migration path for in-flight work

If an agent was working in the shared `/Users/myoffice/lancerwise`:
1. Stash or commit any in-flight changes (verify nothing destructive).
2. Push branch if not yet pushed.
3. Switch to the per-agent worktree.
4. `git fetch && git checkout -b <same-branch> origin/<same-branch>` to
   continue from the same state.
5. Verify `.env.local` exists; copy from main worktree if missing.

## Cross-agent coordination

Each worktree's git operations are independent. Coordination via:
- Shared origin (GitHub PRs visible to all)
- Shared production DB (`.env.local` points to same Supabase)
- Shared Vercel project (deploys triggered by any agent's push to main-merged PR)

If two agents push to the SAME branch from different worktrees, the
later push gets rejected as non-fast-forward — this is correct
behavior (caught at git push time, not silently overwritten).

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — layout, setup commands, usage pattern, gotchas |
| [`git-worktree-list.txt`](git-worktree-list.txt) | post-setup verification snapshot |

## Cross-links

- Memory note: `feedback_worktree_isolation_pattern.md` (the lesson for future sessions)
- Trigger context: 5 cross-repo/cross-branch contamination incidents on 2026-05-17 — including:
  - Empty commits landing on bug-001-batch-2-6-footer instead of fix/visual-regression-...
  - psql / curl commands run from wrong CWD failing to find .env.local
  - git push of fix branch with main commits accidentally on top
