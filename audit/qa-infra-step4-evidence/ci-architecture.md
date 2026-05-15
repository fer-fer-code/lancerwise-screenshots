# qa-gates CI Architecture

```
PR opened/synchronized
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│   .github/workflows/qa-gates.yml   (on: pull_request, push)  │
│   permissions: contents:write (for ratchet + baseline-init)  │
│   concurrency: cancel-in-progress per branch                 │
└──────────────────────────────────────────────────────────────┘
         │
         ├─────────────────────┬───────────────────────────────┐
         ▼                     ▼                               ▼
┌──────────────────┐  ┌────────────────────┐  ┌───────────────────────────┐
│ GATE 1           │  │ GATE 2             │  │ GATE 3                    │
│ eslint-i18n      │  │ locale-purity (ru) │  │ visual-regression         │
│ ─────────────    │  │ ─────────────      │  │ ─────────────             │
│ • npm ci         │  │ • npm ci           │  │ • npm ci                  │
│ • eslint with    │  │ • playwright       │  │ • playwright              │
│   standalone     │  │   install chromium │  │   install chromium        │
│   i18n config    │  │ • start `next dev` │  │ • start `next dev`        │
│ • ratchet vs     │  │ • wait HTTP 200    │  │ • wait HTTP 200           │
│   audit/i18n-    │  │ • run setup +      │  │ • IF label                │
│   baseline.json  │  │   locale-purity-ru │  │   `qa-visual-baseline-    │
│ • IF improvement │  │   project          │  │   init` →                 │
│   → write new    │  │ • upload JSON +    │  │   --update-snapshots,     │
│   floor + commit │  │   screenshots      │  │   commit linux baselines  │
│   back to PR     │  │                    │  │ • ELSE compare → upload   │
│ • upload report  │  │                    │  │   HTML report + diffs     │
└──────────────────┘  └────────────────────┘  └───────────────────────────┘
         │                     │                               │
         └─────────────────────┴───────────────────────────────┘
                               │
                               ▼
                  ┌─────────────────────────────┐
                  │ All 3 must be green for     │
                  │ branch-protected merge to   │
                  │ main (rules in §3 below)    │
                  └─────────────────────────────┘
```

## 1. Gate behaviours

### Gate 1 — `eslint-i18n` (ESLint i18next/no-literal-string ratchet)

| Aspect | Detail |
| ------ | ------ |
| Config | `eslint.config.i18n.mjs` (standalone — does NOT load Next.js's full ruleset, so the 1,624 `no-explicit-any` / 644 `react-hooks/set-state-in-effect` violations on `main` do **not** block this gate) |
| Scope | `src/**/*.{tsx,jsx}`, with the same `ignores` block as the main config (emails, tests, demos, stories) |
| Baseline file | `audit/i18n-baseline.json` — current floor: **34,615** |
| Ratchet script | `scripts/qa/i18n-ratchet.js` |
| **Pass** | `current ≤ baseline` |
| **Fail** | `current > baseline` — exits 1, lists top 5 offending files |
| **Improvement** | `current < baseline` → ratchet writes the new floor; CI step commits + pushes `audit/i18n-baseline.json` back to the PR branch under `qa-gates[bot]` |
| Artifact | `eslint-i18n-report.json` (30 day retention) |
| Average runtime | ~1.5 min |

### Gate 2 — `locale-purity` (Playwright RU locale-purity)

| Aspect | Detail |
| ------ | ------ |
| Spec | `tests/e2e/locale-purity.spec.ts` |
| Auth | `tests/e2e/auth.setup.ts` (Approach B — Supabase session cookie injection) |
| Routes | 10 protected routes — `/dashboard`, `/work`, `/work/time`, `/clients`, `/finances`, `/analytics`, `/analytics/forecast`, `/contracts`, `/settings`, `/settings/public-profile` |
| Baseline | 2,764 EN tokens on the **current** broken state of main (after Step 2 amendments + Action 1 deployed) |
| **Pass** | Every checked token is either pure-non-latin, in the whitelist (brand, currency codes, keyboard hints, fixture names), or skipped via `data-test-skip-locale-purity="true"` |
| **Fail** | Any non-whitelisted Latin word of length ≥ 3 found on a RU-locale render |
| Artifact | `audit/locale-purity-baseline-failures.json` + `test-results/` (30 day retention) |
| Average runtime | ~5 min |

> **Important caveat for the baseline-period.** Today's `main` will fail this gate the moment branch protection is enabled — that is by design, since the locale is genuinely broken. The gate ships in a "block all merges until CP-A redo lands" mode and is what drives the CP-A redo work. Reviewers should NOT enable branch protection on `main` until CP-A redo merges and `main` itself reaches gate-green.

### Gate 3 — `visual-regression` (Playwright `toHaveScreenshot`)

| Aspect | Detail |
| ------ | ------ |
| Spec | `tests/e2e/visual-regression.spec.ts` |
| Auth | same as Gate 2 |
| Captures | 24 baselines — 8 routes × 2 locales + 4 time variants × 2 locales |
| Threshold | `maxDiffPixelRatio: 0.01` (1% of pixels) |
| Snapshot path | `tests/e2e/visual-regression.spec.ts-snapshots/<arg>-<projectName>-<platform>.png` — `darwin` for local capture, `linux` for CI capture |
| **First-run policy** | PR labeled `qa-visual-baseline-init` triggers `--update-snapshots`; new `-linux.png` baselines are committed back to the PR branch as `qa-gates[bot]`. Without the label, the job runs in compare mode. |
| **Pass** | Every screenshot matches its stored baseline within threshold |
| **Fail** | Any single capture exceeds threshold |
| Artifact | `playwright-report/` HTML report + diffs (30 day retention) |
| Average runtime | ~6 min |

## 2. Secrets and env

Provisioned in `fer-fer-code/lancerwise` repo secrets (via `gh secret set` from a session with admin role):

| Secret | Used by | Sourced from |
| ------ | ------- | ------------ |
| `NEXT_PUBLIC_SUPABASE_URL` | Gates 2, 3 (dev server + auth.setup) | `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Gates 2, 3 | `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Gates 2, 3 (some server routes import it at boot) | `.env.local` |
| `DATABASE_URL` | Gates 2, 3 (direct pg queries during render) | `.env.local` |
| `PLAYWRIGHT_TEST_USER_EMAIL` | Gates 2, 3 (Approach B sign-in) | `/tmp/phase10-test-creds.txt` |
| `PLAYWRIGHT_TEST_USER_PASSWORD` | Gates 2, 3 | `/tmp/phase10-test-creds.txt` |

No additional API keys are needed by the gates themselves. If a route renders content that needs Stripe / Anthropic / Groq / Resend keys, the dev server will swallow the failure (best-effort fallback) — the gate's only requirement is that the route html-renders, not that all features work at runtime.

## 3. Branch protection rules (NOT enabled yet — see §4)

Recommended rule set on `main`:

```
Settings → Branches → Branch protection rules → main
  ☑ Require a pull request before merging
      ☑ Require approvals: 1
      ☑ Require review from Code Owners (optional)
  ☑ Require status checks to pass before merging
      ☑ Require branches to be up to date before merging
      Required status checks:
        ☑ gate / eslint i18n
        ☑ gate / locale-purity (ru)
        ☑ gate / visual-regression
  ☑ Require conversation resolution before merging
  ☑ Do not allow bypassing the above settings
  ☑ Restrict who can push to matching branches
      Allowlist: (empty — everything goes through PRs)
  ☑ Allow force pushes: NO
  ☑ Allow deletions: NO
```

## 4. Why branch protection is NOT enabled in this commit

User hard-rule: "НЕ enable branch protection до того как все 3 gates green на current main (или ratcheted to known baseline). Иначе никакой PR не сможет merge."

Current state of `main`:

- Gate 1: **green** (current = baseline = 34,615; ratchet OK)
- Gate 2: **red** (2,764 EN tokens — locale is broken; this is the whole point of CP-A redo)
- Gate 3: needs first-run init on linux runner (label-triggered, see §1) before it can compare

Enabling protection now would lock everyone out of `main` until CP-A redo lands. The right sequence is:

1. Install the workflow file (currently shipped as `scripts/qa/qa-gates.workflow.yml.txt` — see "blocker" below)
2. Open the qa-infrastructure-2026-05 PR; verify Gates 1 + 2 + 3 run (Gate 2 will be red until CP-A redo merges)
3. Apply `qa-visual-baseline-init` label to that PR once → CI commits `-linux.png` baselines → label removed → subsequent runs compare against them
4. Once CP-A redo merges to main, re-run; Gate 2 should go green
5. THEN enable branch protection (Settings → Branches → main → enable required checks)

## 5. Blocker — workflow file not yet at `.github/workflows/qa-gates.yml`

The Step 4 commits push the standalone i18n config, the ratchet script, the baseline JSON, and the workflow YAML — but the YAML lives at `scripts/qa/qa-gates.workflow.yml.txt` instead of its canonical location.

**Why:** the gh CLI OAuth token in the session that ran Step 4 carries scopes `gist, read:org, repo` — no `workflow` scope. Without `workflow`, GitHub returns 404 on any PUT to a path under `.github/workflows/*` (per docs: "security — 404 instead of 403 to avoid leaking workflow file existence"). The non-workflow files all pushed cleanly.

**Reviewer one-shot to unblock:**

```bash
cd ~/lancerwise
git fetch origin qa-infrastructure-2026-05
git checkout qa-infrastructure-2026-05
mkdir -p .github/workflows
# Strip the 12-line header note from the .txt and write to the real location
tail -n +13 scripts/qa/qa-gates.workflow.yml.txt > .github/workflows/qa-gates.yml
git rm scripts/qa/qa-gates.workflow.yml.txt
git add .github/workflows/qa-gates.yml
git commit -m "ci: install qa-gates workflow at canonical path"
git push origin qa-infrastructure-2026-05
```

Or, via the GitHub web UI: Add file → Create new file → path `.github/workflows/qa-gates.yml`, paste the YAML block from `scripts/qa/qa-gates.workflow.yml.txt` (everything below the header note), commit to `qa-infrastructure-2026-05`.

Either path produces the same result. Once the workflow lives in its canonical location, GitHub Actions will pick it up on the next PR event (it may need a synchronize event to register — pushing one trivial commit on the branch is enough).

## 6. Cross-links

- Workflow source: `scripts/qa/qa-gates.workflow.yml.txt` (private lancerwise)
- ESLint i18n config: `eslint.config.i18n.mjs` (private lancerwise)
- Ratchet script: `scripts/qa/i18n-ratchet.js` (private lancerwise)
- Baseline floor: `audit/i18n-baseline.json` (private lancerwise)
- Step 1 evidence: `../qa-infra-step1-evidence/`
- Step 2 evidence: `../qa-infra-step2-evidence/`
- Step 3 evidence: `../qa-infra-step3-evidence/`
