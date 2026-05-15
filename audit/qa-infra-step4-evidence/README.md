# QA Infrastructure — Step 4 Evidence

CI integration of the three quality gates. **Partially blocked** on a
single permissions issue — see §"Blocker" below.

## Source

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Private repo  | `fer-fer-code/lancerwise` (not viewable by reviewer) |
| Branch        | `qa-infrastructure-2026-05`                          |
| Step 4 commits (CI components) | `619e4b2a` — i18n config + ratchet + baseline |
|                                | `72cf735e` — workflow YAML shipped as `.txt` |

## Status summary

| Deliverable | Status |
| ----------- | ------ |
| GitHub Actions workflow YAML written | ✓ — content reviewed locally |
| Workflow file at `.github/workflows/qa-gates.yml` on remote | ✗ — **blocked** (workflow OAuth scope missing); shipped as `scripts/qa/qa-gates.workflow.yml.txt` instead |
| Standalone i18n ESLint config (eslint.config.i18n.mjs) | ✓ — pushed at `619e4b2a`, validated locally (current count: 34,615) |
| i18n ratchet script (scripts/qa/i18n-ratchet.js) | ✓ — tested locally on both improvement and regression cases |
| Baseline floor JSON (audit/i18n-baseline.json) | ✓ — locked at 34,615 |
| GitHub Actions secrets provisioned (6 secrets) | ✓ — set via `gh secret set`, listed below |
| Demo CI run — passing PR | ✗ — **blocked** until workflow file is installed |
| Demo CI run — failing PR (eslint regression) | ✗ — **blocked** until workflow file is installed |
| Branch protection rules | ✗ — **deferred** until all gates green on main (see ci-architecture.md §4) |

## What was actually completed in Step 4

**Local validation of the i18n ratchet:**

```
$ npx eslint 'src/**/*.{tsx,jsx}' \
    --config eslint.config.i18n.mjs --no-warn-ignored \
    --format json > /tmp/eslint-i18n-report.json

$ node scripts/qa/i18n-ratchet.js /tmp/eslint-i18n-report.json

i18n ratchet report
  Rule:     i18next/no-literal-string
  Baseline:   34670   ← from Step 1 (main eslint.config.mjs)
  Current:    34615   ← from standalone config (slightly different parser)
  Delta:        -55

✅ Improvement — 55 violations fixed. Baseline lowered to 34615.
   CI workflow will commit the updated audit/i18n-baseline.json
   back to this branch.
ratchet=improve current=34615 baseline=34670 delta=-55
```

**Regression case (manually lowered baseline to 34,000 to simulate):**

```
$ node scripts/qa/i18n-ratchet.js /tmp/eslint-i18n-report.json
…
  Baseline:   34000
  Current:    34615
  Delta:        615

Top offending files:
      153  src/app/(app)/projects/subcontractors/SubcontractorClient.tsx
      132  src/app/(app)/clients/network/NetworkClient.tsx
      120  src/app/(app)/tools/subcontractors/SubcontractorsClient.tsx
      108  src/app/(app)/tools/pipeline/PipelineClient.tsx
      107  src/app/(app)/contracts/builder/ContractBuilderClient.tsx

❌ RATCHET FAILED — 615 new i18n violations introduced.
ratchet=fail current=34615 baseline=34000 delta=+615

(exit 1)
```

The ratchet correctly fails on regression with a useful top-5 offender
list, and correctly auto-lowers the floor on improvement. The CI workflow
calls this script once and decides merge eligibility from its exit code.

## Secrets provisioned (via `gh secret set --repo fer-fer-code/lancerwise`)

```
$ gh secret list --repo fer-fer-code/lancerwise
DATABASE_URL                  2026-05-15T16:52:01Z
NEXT_PUBLIC_SUPABASE_ANON_KEY 2026-05-15T16:51:58Z
NEXT_PUBLIC_SUPABASE_URL      2026-05-15T16:51:57Z
PLAYWRIGHT_TEST_USER_EMAIL    2026-05-15T16:52:02Z
PLAYWRIGHT_TEST_USER_PASSWORD 2026-05-15T16:52:03Z
SUPABASE_SERVICE_ROLE_KEY     2026-05-15T16:51:59Z
```

All sourced from `.env.local` and `/tmp/phase10-test-creds.txt` —
same values that already work for the locale-purity + visual-regression
specs locally.

## Blocker — workflow OAuth scope

The gh CLI session that ran the Step 4 commits has scopes
`gist, read:org, repo` and does NOT carry the `workflow` scope.
GitHub's contents API returns HTTP 404 for any PUT to
`.github/workflows/*` without that scope (security choice — 404 instead
of 403 to avoid leaking workflow existence). Both `git push` (HTTPS
auth) and the `gh api` PUT route are blocked.

Workaround applied: workflow YAML committed at
[`scripts/qa/qa-gates.workflow.yml.txt`](https://github.com/fer-fer-code/lancerwise/blob/qa-infrastructure-2026-05/scripts/qa/qa-gates.workflow.yml.txt)
with a 12-line header explaining the relocation. The reviewer is the
only path to install the file at its canonical location.

**One of these two unblocks Step 4 fully:**

### Option A — reviewer refreshes the gh CLI scope (interactive, ~30 s)

```bash
cd ~/lancerwise
gh auth refresh --hostname github.com -s workflow
# follow the browser auth prompt, paste the device code
git checkout qa-infrastructure-2026-05
mkdir -p .github/workflows
tail -n +13 scripts/qa/qa-gates.workflow.yml.txt > .github/workflows/qa-gates.yml
git rm scripts/qa/qa-gates.workflow.yml.txt
git add .github/workflows/qa-gates.yml
git commit -m "ci: install qa-gates workflow"
git push origin qa-infrastructure-2026-05
```

After this, all subsequent gh CLI workflow operations on this machine
also have `workflow` scope — future iterations are unblocked.

### Option B — reviewer adds the workflow file via GitHub web UI (no CLI changes)

1. Open https://github.com/fer-fer-code/lancerwise/new/qa-infrastructure-2026-05?filename=.github/workflows/qa-gates.yml
2. Paste the YAML from
   [`scripts/qa/qa-gates.workflow.yml.txt`](https://github.com/fer-fer-code/lancerwise/blob/qa-infrastructure-2026-05/scripts/qa/qa-gates.workflow.yml.txt)
   below the 12-line header note (start from `name: qa-gates`)
3. Commit directly to `qa-infrastructure-2026-05`
4. Open a tiny PR that removes the `.txt` copy

## After unblock — what runs

Once the workflow YAML is at its canonical path, GitHub Actions picks
it up on the next push to the branch. The qa-gates workflow runs on
`pull_request` to main (and on `push` to main for the post-merge
canary). For the **first run** of `visual-regression` on linux:

1. Open the PR (or `qa-infrastructure-2026-05` → main)
2. Apply label `qa-visual-baseline-init`
3. CI runs visual-regression with `--update-snapshots`, writes
   `*-linux.png` baselines, commits + pushes them back to the PR branch
   as `qa-gates[bot]`
4. Remove the label
5. Subsequent runs use those linux baselines in compare mode

For the first run of `eslint-i18n` and `locale-purity`: no special label —
they run normally on every PR event.

## Branch protection rules — recommended config (deferred)

See [`ci-architecture.md`](ci-architecture.md) §3 for the recommended
GitHub branch protection settings. They are intentionally **not enabled
in Step 4** — Gate 2 will fail on every PR to main until CP-A redo
merges, and enabling protection now would freeze all merges to main.
The right sequence is:

1. Workflow installed (Option A or B above)
2. qa-infrastructure-2026-05 PR opened — confirm Gates 1+3 green on this branch (Gate 2 will be red — that is the point)
3. CP-A redo PR opens, fixes /dashboard locale, Gate 2 goes green on that branch
4. Once both branches green and merged to main, **then** enable branch protection on main with the rule set in ci-architecture.md §3

## Cross-links

- [ci-architecture.md](ci-architecture.md) — full architecture diagram + per-gate detail
- [qa-infra-step1-evidence/](../qa-infra-step1-evidence/) — ESLint baseline
- [qa-infra-step2-evidence/](../qa-infra-step2-evidence/) — locale-purity baseline
- [qa-infra-step3-evidence/](../qa-infra-step3-evidence/) — visual regression baselines

## Open questions for reviewer

1. **Option A vs Option B** for installing the workflow — your call. A is faster; B is one-time but doesn't unblock future iterations.
2. **Demo PR strategy** — once workflow is live, do you want me to (a) open the demo PRs on this same branch via separate commits, or (b) open them on dedicated short-lived branches like `demo/qa-passing` and `demo/qa-failing`? Option (b) is cleaner.
3. **Branch protection enable timing** — confirm "after CP-A redo merges to main" is the right gate, or override with a different trigger.
4. **`qa-gates[bot]` author** — workflow commits ratchet baseline + linux baseline init as a bot. Currently I have it write `user.name "qa-gates[bot]"` and `user.email "qa-gates@users.noreply.github.com"`. If you prefer a real GitHub App identity, that's a follow-up.
