# [AGENT 3] qa-gates merge-ref auto-commit-back fix

Cross-team coord note from [AGENT 1] surfaced an incomplete fix in
the qa-gates ratchet auto-commit-back path. This is the resolution.

## Source

| Field | Value |
| ----- | ----- |
| Private repo | `fer-fer-code/lancerwise` |
| Fix commit | [`4108d94c`](https://github.com/fer-fer-code/lancerwise/commit/4108d94c) — "ci(qa-gates): pin checkout ref to PR head SHA (fix merge-ref push reject)" |
| Verification PR | [#9](https://github.com/fer-fer-code/lancerwise/pull/9) `demo/ratchet-merge-ref-fix` — closed, branch deleted |
| Verification run | [25966815382](https://github.com/fer-fer-code/lancerwise/actions/runs/25966815382) — all 3 gates green; auto-commit-back succeeded |
| Bot commit | [`e48f5c7`](https://github.com/fer-fer-code/lancerwise/commit/e48f5c7) by `qa-gates[bot]` — proves the auto-commit-back path now works end-to-end |

## Root cause (per AGENT 1's analysis, confirmed by log inspection)

On `pull_request` events, `actions/checkout@v4` with no `ref:`
checks out `refs/pull/N/merge` — a synthetic merge of the PR head
and the PR base. HEAD is detached at this merge commit, which is
NOT on the PR's head branch.

When the ratchet auto-commit-back step then does:

```
git add audit/i18n-baseline.json
git commit -m "..."
git push origin HEAD:${{ github.head_ref }}
```

It tries to push the (merge + new commit) onto the branch tip. The
merge commit's parent is the PR base, not the prior PR head — so
it's NOT a fast-forward of the head branch and the push is rejected:

```
! [rejected] HEAD -> feature/dev-feedback-widget (fetch first)
hint: Updates were rejected because the remote contains work that
hint: you do not have locally.
```

(captured on PR #6 run 25961406561, commit 2f743635)

## Earlier fix attempt (incomplete — `fa1d5aa0`)

My earlier commit `fa1d5aa0` added `continue-on-error: true` and
`git pull --rebase origin <head_ref>` before push. That worked on
`demo/locale-pass` because the demo branched from a then-current
main where the rebase resolved into a sensible state. But on PRs
where the rebase target diverges, the underlying mismatch (HEAD =
merge ref, not branch tip) remained.

`continue-on-error: true` masked the failure but the baseline never
actually committed back — defeating the ratchet's auto-track purpose.

## This fix (`4108d94c`) — AGENT 1's suggestion #1

Pin the checkout ref explicitly:

```yaml
- name: Checkout
  uses: actions/checkout@v4
  with:
    ref: ${{ github.event.pull_request.head.sha || github.sha }}
```

- On `pull_request`: `pull_request.head.sha` resolves to the head
  branch tip commit. HEAD now traces that branch, so a later
  `git push HEAD:branch` is a clean fast-forward.
- On `push` / `workflow_dispatch`: the head.sha context is empty;
  fallback to `github.sha` (the actual commit being pushed). HEAD
  matches the branch state of the push event.

Applied to all 3 jobs (eslint-i18n, locale-purity, visual-regression)
since all three may auto-commit-back (i18n + locale baselines, plus
visual baseline init when `qa-visual-baseline-init` label is on).

The `git pull --rebase` step from `fa1d5aa0` stays in place — it
guards against a DIFFERENT race: when Gate 1 and Gate 2 both detect
improvements in the same run, they auto-commit-back in parallel. The
second push needs to rebase onto the first to land. That race is
real and the rebase is still the right defence.

## Verification — fresh PR with real improvement

`demo/ratchet-merge-ref-fix` branched from main with an artificial
baseline bump (locale-purity floor 2,517 → 9,999) so the next ratchet
run sees a guaranteed real improvement (delta ~-7,483):

```
locale-purity ratchet report
  Rule:     locale-purity-ru (tokens of 3+ Latin chars on RU locale)
  Baseline:   9999
  Current:    2516
  Delta:     -7483
  Routes flagged: 10

✅ Improvement — 7483 fewer locale-purity violations. Baseline lowered to 2516.
   CI workflow will commit the updated audit/locale-purity-baseline.json back to this branch.
ratchet=improve current=2516 baseline=9999 delta=-7483
```

Auto-commit-back log:

```
[detached HEAD <new-sha>] ci(qa-gates): lower locale-purity baseline floor
 1 file changed
   70314fe..e48f5c7  HEAD -> demo/ratchet-merge-ref-fix
```

**Clean fast-forward push** — `70314fe..e48f5c7`, no `[rejected]`.

The auto-commit-back commit on the PR branch:

```
$ gh api repos/fer-fer-code/lancerwise/commits/e48f5c7
sha:     e48f5c75f7
author:  qa-gates[bot]
message: ci(qa-gates): lower locale-purity baseline floor
```

## Side effect — was demo's i18n ratchet exercised?

No. `gate / eslint i18n` for the demo run showed `Baseline: 34466
Current: 34466 Delta: 0` — already at floor (the i18n baseline was
auto-lowered to 34466 on an earlier improvement run on main). So
the i18n commit-back step short-circuited via the "Baseline unchanged"
branch and never tried to push. Only the locale-purity ratchet
exercised the auto-commit-back path on this demo.

If a future PR introduces TSX-level i18n improvement, the same
pinned-ref path will let Gate 1's commit-back succeed too. Same code
path, same fix.

## Cross-links

- [AGENT 1] coord note triggered this fix (Phase C-2 widget PR #6
  with manual baseline bump workaround in commit `a567f315`)
- Sibling: [`../qa-infra-step5-ratchet-evidence/`](../qa-infra-step5-ratchet-evidence/) — the original locale-purity ratchet implementation
- Sibling: [`../qa-infra-step4-evidence/`](../qa-infra-step4-evidence/) — CI bootstrap proof
- Architecture: [`../qa-infra-step4-evidence/ci-architecture.md`](../qa-infra-step4-evidence/ci-architecture.md)

## Status

Auto-commit-back works on `pull_request` events with real improvements.
Future PRs that lower either ratchet baseline will land the lowered
floor automatically — no more manual baseline bumps by PR authors.

Branch protection still pending Ramiz's GitHub Pro upgrade signal
(separate workstream — see Step 5 evidence README §"Branch protection
blocker").
