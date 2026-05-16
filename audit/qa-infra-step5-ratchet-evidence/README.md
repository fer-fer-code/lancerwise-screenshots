# [AGENT 3] qa-gates Step 5 — locale-purity ratchet (Path 2)

Reviewer chose Path 2 (locale-purity ratchet, symmetric to the existing
eslint i18n ratchet) from the three open-questions paths in the Step 4
CP-A canary report.

## Status

| Item | Status |
| ---- | ------ |
| Build locale-purity ratchet script + baseline file | ✓ |
| Wire ratchet into qa-gates workflow Gate 2 | ✓ |
| Push to main + canary verify all 3 gates green | ✓ |
| Demo PR pair (pass + fail) verified | ✓ |
| Surface + fix commit-back race bug found during demo | ✓ |
| Enable branch protection on main per ci-architecture.md §3 | ✗ **blocked** — GitHub free plan disallows branch protection on private repos. Needs GitHub Pro OR repo public. |

## Headline result

After commit `f3f7b8eb` landed on `main` and the post-merge canary ran
([run 25961380671](https://github.com/fer-fer-code/lancerwise/actions/runs/25961380671)):

```
  ✓ gate / eslint i18n       pass   ratchet=improve current=34466 baseline=34670 delta=-204
  ✓ gate / locale-purity ru  pass   ratchet=improve current=2512 baseline=2517 delta=-5
  ✓ gate / visual-regression pass

  conclusion: success — first all-green canary on main
```

This is the Q3 step 5 ("post-merge canary all 3 green") signal. Step 6
(enable branch protection) is blocked by repo plan — see §"Branch
protection blocker" below.

## Files

| Path | Source repo |
| ---- | ----------- |
| `audit/locale-purity-baseline.json` | private lancerwise — floor 2,517 (post-CP-A canary count); workflow auto-lowers on improvement |
| `scripts/qa/locale-purity-ratchet.js` | private lancerwise — exit 1 on regression, exit 0 + rewrite-floor on improvement |
| `.github/workflows/qa-gates.yml` | private lancerwise — Gate 2 rewired: playwright `\|\| true` + ratchet step + `set -o pipefail` + auto-commit-back |
| `locale-purity-baseline.json` | this dir — snapshot at post-push state |
| `locale-purity-ratchet.js` | this dir — snapshot of the ratchet script |
| `qa-gates-workflow.yml` | this dir — snapshot of the workflow at the post-fix state (after commit-back race fix) |
| `ratchet-runs.txt` | this dir — verbose run summary (canary + both demo PRs + local 3-case validation) |

## Demo PR pair — both flows verified

### DEMO 1 — `demo/qa-pass` (PR [#7](https://github.com/fer-fer-code/lancerwise/pull/7), closed)

Mutation: trivial README addition (no source effect).

| Gate | Result |
| ---- | ------ |
| eslint i18n | ✓ pass — ratchet=improve, baseline 34670 → 34466 |
| locale-purity ru | ✓ pass — ratchet=improve, baseline 2517 → 2516 |
| visual-regression | ✓ pass |

Both ratchet steps auto-committed the lower baselines back to the PR
branch (commit-back race bug had been fixed in `fa1d5aa0` between the
first attempt and this run).

### DEMO 2 — `demo/locale-fail` (PR [#8](https://github.com/fer-fer-code/lancerwise/pull/8), closed)

Mutation: replaced 6 `messages/ru.json` keys (`dashboard.greeting.*`
+ `dashboard.today`) with deliberate English phrases like "Demo English
Good Morning Phrase". The eslint rule doesn't scan translation JSON,
so Gate 1 sees no .tsx change — only Gate 2 should catch the regression.

| Gate | Result |
| ---- | ------ |
| eslint i18n | ✓ pass (correctly — .json not in scan scope) |
| locale-purity ru | **✘ FAIL** — `ratchet=fail current=2521 baseline=2517 delta=+4` |
| visual-regression | ✓ pass |

The locale-purity ratchet caught a regression that eslint can't see —
exactly the kind of bug class this gate exists to prevent.

## Pre-fix bug found during demo (commit-back race)

The first attempt at the demo pair surfaced a real workflow bug. Both
ratchet jobs (`gate / eslint i18n` and `gate / locale-purity ru`) ran
in parallel and each tried to commit + push the lowered baseline back
to the PR branch. The slower push lost the fast-forward race:

```
! [rejected]        HEAD -> demo/locale-pass (fetch first)
hint: Updates were rejected because the remote contains work that you
hint: do not have locally.
##[error]Process completed with exit code 1.
```

Effect: gate / eslint i18n showed `FAIL` despite `ratchet=improve` —
which is bad UX (PR author confused about what failed) and would have
been a false-positive merge blocker once branch protection enables.

Fix in commit `fa1d5aa0`:
- `continue-on-error: true` on both commit-back steps (ratchet result
  is the gate decision; auto-commit is best-effort)
- `git pull --rebase origin <head_ref> || true` before push (so a
  parallel commit from the other ratchet doesn't reject the push)

Re-run after fix: demo/locale-pass clean all-green; demo/locale-fail
correctly fails Gate 2 only.

## Local 3-case ratchet validation (ran before push)

```
$ node scripts/qa/locale-purity-ratchet.js <failures.json>

case A — current 2517 == baseline 2517:
  ✅ Ratchet OK — current count matches baseline.
  ratchet=ok current=2517 baseline=2517 delta=0
  exit 0

case B — current 2400 < baseline 2517 (improvement):
  ✅ Improvement — 117 fewer locale-purity violations. Baseline lowered to 2400.
  ratchet=improve current=2400 baseline=2517 delta=-117
  exit 0  (and rewrites audit/locale-purity-baseline.json in place)

case C — current 2600 > baseline 2517 (regression):
  ❌ RATCHET FAILED — 83 new locale-purity violations introduced.
  Routes with most tokens:
    2600  /dashboard
  Top offending tokens (count across routes):
       1  "Token0"
       1  "Token1"
       ...
  ratchet=fail current=2600 baseline=2517 delta=+83
  exit 1
```

## Branch protection blocker

GitHub returned:

```
$ gh api -X PUT repos/fer-fer-code/lancerwise/branches/main/protection ...
{
  "message": "Upgrade to GitHub Pro or make this repository public to enable this feature.",
  "status": "403"
}
```

The same applies to the Rulesets API.

Branch protection rules + repository rulesets require **GitHub Pro
($4/user/month)** for **private** repos. The lancerwise repo is
private and the org is on the free plan.

Three options for reviewer:

| Option | Cost | Tradeoff |
| ------ | ---- | -------- |
| **A. Upgrade to GitHub Pro** | $4/month per repo collaborator | Enables branch protection AND rulesets; no code visibility change |
| **B. Make repo public** | $0 | Enables branch protection for free, but exposes source code (Supabase URL/key, business logic, ratchet baseline numbers etc.). Pre-launch — risky. |
| **C. Stay on free + manual enforcement** | $0 | Gates still run on every PR and visibly show pass/fail. Reviewer manually refuses to merge if any gate red. No technical lock — admin can still merge red. |

Recommended: **A** (upgrade) for pre-launch confidence. Option C is
adequate for solo development; Option B is acceptable post-launch
when the SaaS is mature.

Until decision: the workflow runs on every PR and provides the green/red
signal. Three gates have been demonstrated to fail correctly on real
regressions. The enforcement layer is the only missing piece.

## Cross-links

- Step 4 evidence (CI bootstrap + bootstrap proof): [`../qa-infra-step4-evidence/`](../qa-infra-step4-evidence/)
- Step 1/2/3 baselines: [`../qa-infra-step1-evidence/`](../qa-infra-step1-evidence/), [`../qa-infra-step2-evidence/`](../qa-infra-step2-evidence/), [`../qa-infra-step3-evidence/`](../qa-infra-step3-evidence/)
- CP-A canary report: [`../qa-infra-step4-evidence/ci-runs-summary.txt`](../qa-infra-step4-evidence/ci-runs-summary.txt)
- Architecture spec (incl. branch protection rule set ready to apply when plan upgrades): [`../qa-infra-step4-evidence/ci-architecture.md`](../qa-infra-step4-evidence/ci-architecture.md) §3

## Backlog memos (per reviewer's bottom-of-message)

1. **og-image.png redesign** — P2. Designer task, not agent. Needs 1200×630 PNG with current purple branding + LancerWise wordmark + tagline. Tracked in memory `backlog_seo_og_image_design_upgrade.md`. Until done, Twitter cards / social shares / some Google fallbacks still show old circular blue logo.

2. **git → Vercel reconnect** — separate task in standby queue. Currently every push to main needs manual `vercel --prod --yes` to deploy. Vercel project shows `git type: None` — link was severed (when/why TBD). Investigation in next standby cycle: probably wants Vercel dashboard → Settings → Git → Connect to GitHub repo.

3. **GitHub plan upgrade decision** — blocks ACTION 2 (branch protection). See §"Branch protection blocker" above.
