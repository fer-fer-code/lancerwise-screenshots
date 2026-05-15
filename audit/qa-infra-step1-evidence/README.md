# QA Infrastructure — Step 1 Evidence

ESLint `eslint-plugin-i18next` `no-literal-string` rule wired into the
`lancerwise` flat config + baseline scan of the codebase.

## Source

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Private repo  | `fer-fer-code/lancerwise` (not viewable by reviewer) |
| Branch        | `qa-infrastructure-2026-05`                          |
| Commit        | `516eebba` (amended)                                  |
| Plugin        | `eslint-plugin-i18next@6.1.4`                         |
| Rule          | `i18next/no-literal-string` (error level)            |
| Files scope   | `src/**/*.{tsx,jsx}` with `ignores` for emails/tests/demos/stories |

## Files

| File | What it shows |
| ---- | ------------- |
| `step1-eslint-demo-output.txt` | Terminal output of ESLint failing on a hand-crafted bad component (5 errors) and passing on a good component (0 errors). Confirms the rule loads, plugin is wired, and flags the expected user-facing string types: JSX children, aria-label, title, placeholder. |

## Baseline numbers

| Metric                                            | Value  |
| ------------------------------------------------- | ------ |
| Files scanned                                     | 2,408  |
| Files with i18n violations                        | 1,450  |
| Total `i18next/no-literal-string` violations      | **34,670** |
| Dashboard subset (NOT modified in this branch)    | 1,301 in 173 files |

All 4 CP-A blind-spot widgets confirmed flagged by the static rule
— full per-line records gitignored in private repo and published as
a CI artifact by Step 4.

## Cross-links

- Summary (private lancerwise): `audit/eslint-i18n-summary.md`
- Config (private lancerwise): `eslint.config.mjs`
- Step 2 evidence: `../qa-infra-step2-evidence/`
