# [AGENT 1] Escalation — PR #17 blocked by pre-existing main failures

**Date:** 2026-05-17
**PR:** https://github.com/fer-fer-code/lancerwise/pull/17
**Branch:** `bugfix/ramiz-qa-pass-1`
**Commit:** `e633a77d`

## Status summary

| Gate | PR #17 result | main HEAD (bbceb945) result | Verdict |
|---|---|---|---|
| eslint i18n | ✅ success | ✅ success (after my dev-feedback baseline lowering) | Clean |
| locale-purity (ru) | ❌ failure (2517 vs baseline 2516, +1) | ❌ failure (2517 vs baseline 2516, +1) | **Pre-existing on main** |
| visual-regression | ❌ failure (work-time-en + work-time-ru) | ❌ failure (SAME tests) | **Pre-existing on main** |

**My PR introduces ZERO new failures.** The exact same locale-purity counts and visual-regression test names fail on the latest main commit (`bbceb945`) before my branch existed.

## Evidence

### Locale-purity — identical breakdown PR #17 vs main HEAD
Both show `current=2517`, baseline=2516 (delta=+1). Per-route counts:
```
/dashboard:                62
/work:                     69
/work/time:               395
/clients:                  64  (baseline expected 65 per notes; -1)
/finances:                 18
/analytics:               274
/analytics/forecast:       66
/contracts:                19
/settings:               1492  (baseline expected 1491 per notes; +1)
/settings/public-profile:  58
```

The discrepancy is `/settings +1` and `/clients -1` — net +0 in raw delta but the baseline note's per-route totals don't match the recorded `violations: 2516`. **The baseline was inconsistent before my PR even existed.** Some upstream commit between baseline timestamp (2026-05-16, `qa-gates-ci@3e6160bc`) and main HEAD `bbceb945` shifted these numbers.

### Visual-regression — non-deterministic snapshot
`visual-work-time-en` + `visual-work-time-ru` diffs (13131px / 16451px = 0.02 ratio) are all in dynamic, time-sensitive widgets on `/work/time`:
- Week-of-day bar chart (red rects on weekday bars) — fixture data has a fixed timestamp but Playwright runs map to the current day-of-week relative to that
- "Fri goal: 8h" / "Sat goal" label rotates with weekday
- "08:00:00 remaining" countdown depends on time-of-day

This is a **test-design flaw** (non-frozen clock + day-aware UI), not a code regression. Same diff regions appear on main HEAD run.

Visual artifacts in this dir:
- `main-visual-regression-work-time-en-diff.png`
- `main-visual-regression-work-time-ru-diff.png`

## Proposed paths forward

### Option 1 — Bump locale-purity baseline to 2517 (recommended; smallest change)
```json
"violations": 2517
```
Acknowledges current main reality. Doesn't paper over my PR — confirmed identical state to main HEAD. Workflow's ratchet auto-bump-down will catch real improvements later.

### Option 2 — Admin-merge bypass
Use `gh pr merge --admin` since my PR introduces no new regressions. Pre-existing failures on main are upstream's responsibility.

### Option 3 — Defer PR until [AGENT 3] / qa-infra fixes the underlying gates
- locale-purity baseline desync (above)
- visual-regression /work/time non-determinism (mock the clock OR mask the dynamic widgets OR exclude from snapshot)

### My recommendation
**Option 1 + Option 2.** Bump locale-purity baseline to 2517 to reflect current main reality (single line edit in `audit/locale-purity-baseline.json` with a `notes` paragraph explaining), then admin-merge if visual-regression remains red. Visual-regression flag goes to [AGENT 3] qa-infra as a separate ticket — they own the snapshot fixture.

## Awaiting reviewer guidance

Tag [AGENT 1] in response. Will proceed once direction confirmed.
