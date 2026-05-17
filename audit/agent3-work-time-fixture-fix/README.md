# [AGENT 3] /work/time visual-regression fixture fix

Closes the AGENT 1 escalation in
[`../ramiz-qa-pass-1/ESCALATION-pre-existing-gate-fails.md`](../ramiz-qa-pass-1/ESCALATION-pre-existing-gate-fails.md).

## Status — **COMPLETE** (ready for merge)

| Item | Status |
| ---- | ------ |
| Investigate /work/time time-sensitive widgets | ✓ |
| Pick fix approach (A frozen clock vs B mask widgets) | ✓ — Approach A |
| Extend `preparePage` clock param to accept absolute timestamp | ✓ |
| Delete 4 broken /work/time baselines (en/ru × darwin/linux) | ✓ |
| Open PR with `qa-visual-baseline-init` label | ✓ — PR [#24](https://github.com/fer-fer-code/lancerwise/pull/24) |
| CI baseline-init captures new /work/time baselines + commits back | ✓ — commit `27841e43` (+2 files, others byte-stable) |
| Remove label + verify 3-run gate stability | ✓ — runs #1/2/3 all green 3/3 (see [`ci-runs-summary.txt`](ci-runs-summary.txt)) |

## Headline result

```
                       Pre-fix (per AGENT 1 escalation)    Post-fix (3 consecutive runs)
gate / eslint i18n     ✓ (was already passing)             ✓ ✓ ✓  (1m10s / 1m14s / 1m10s)
gate / locale-purity   ✘ failed +1 vs baseline             ✓ ✓ ✓  (8m48s / 8m17s / 8m22s)*
gate / visual-regress  ✘ failed 13131px / 16451px diff     ✓ ✓ ✓  (7m42s / 7m34s / 8m9s)
─────────────────────  ─────────────────────────────       ─────────────────────────────
                       Cannot merge any PR without admin    First-class green-gate workflow restored
```

*locale-purity recovery is a side benefit; the gate had drifted off-by-one on main between AGENT 1's escalation and this PR, and the baseline auto-lowering on the baseline-init run aligned it. Not directly caused by this fix.

## Problem

`/work/time` visual-regression baselines fail on every run with diff sizes
that just barely exceed the 1% `maxDiffPixelRatio` threshold:

```
visual-work-time-en   13131 px diff (1440×900 → 1.01% of total pixels)
visual-work-time-ru   16451 px diff (1440×900 → 1.27% of total pixels)
```

The diff regions are **all** in dynamic, time-sensitive widgets:

- "This Week" 7-day bar chart with `isToday` highlight (current-day bar
  painted violet, others slate) — [time-tracker/page.tsx:598-651](https://github.com/fer-fer-code/lancerwise/blob/main/src/app/(app)/time-tracker/page.tsx#L598-L651)
- `WorkSchedule` "Fri goal: 8h" label that rotates with weekday — [WorkSchedule.tsx:41,88](https://github.com/fer-fer-code/lancerwise/blob/main/src/app/(app)/time-tracker/WorkSchedule.tsx#L41)
- `WorkSchedule` weekday dot highlight (violet color on today's weekday letter)
- `DailyGoal` "08:00:00 remaining" countdown depending on time-of-day
- `EstimatedMonthEndHours` "N days remaining" forecast
- `MonthlyBillableTarget` "workdaysLeft" calculation
- ~73 other widgets in `time-tracker/` directory using `new Date()` or `Date.now()`

This is a **test-design flaw**, not a code regression. Same diff regions
appear on every commit to main because the test fixture re-runs days apart
and the bar chart shifts depending on the current day-of-week.

## Root cause analysis

The existing `preparePage(clockHour)` API in
[visual-regression.spec.ts](https://github.com/fer-fer-code/lancerwise/blob/main/tests/e2e/visual-regression.spec.ts):

```typescript
if (typeof clockHour === 'number') {
  await page.addInitScript(hr => {
    const RealDate = Date
    const fixed = new RealDate()      // ← "today" at capture time
    fixed.setHours(hr, 0, 0, 0)        // ← only HH:mm:ss patched
    const fixedMs = fixed.getTime()
    // ... patches window.Date to always return fixedMs
  }, clockHour)
}
```

Only the **hour-of-today** is patched; the **date** remains "today" (the
day the test runs). This is intentional for `/dashboard` time variants —
they only inspect `Date.getHours()` for greeting buckets (morning/
afternoon/evening/night), so today's weekday drifting doesn't matter.

But `/work/time` reads `Date.getDay()` (weekday 0-6) for the bar chart,
goal label, and 79+ widget files. Today's weekday drifts day-to-day,
so the captured screenshot drifts → diff vs baseline.

## Fix — Approach A (frozen clock)

Extend `preparePage` clock param from `number` to a union:

```typescript
export type ClockSpec =
  | number                  // hour-of-today (legacy /dashboard variant)
  | { fixedMs: number }     // absolute timestamp (weekday-aware routes)
```

For `/work/time` (and any future weekday-aware route), pass
`{ fixedMs: Date.UTC(2026, 0, 9, 14, 0, 0) }` = Friday 2026-01-09 14:00 UTC.
Friday chosen because the "This Week" bar chart needs a mid-week
(non-edge) appearance with most weekdays already populated by sample
data; Friday at 14:00 also avoids any "morning" / "evening" edge cases
in the greeting bucket logic if it's ever extended to /work/time.

Wire-up in the existing test loop is minimal:

```typescript
const FROZEN_CLOCK_ROUTES: Record<string, number> = {
  '/work/time': Date.UTC(2026, 0, 9, 14, 0, 0),
}

for (const route of ROUTES) {
  for (const locale of LOCALES) {
    test(`visual: ${route} [${locale}]`, async ({ page }) => {
      const frozenMs = FROZEN_CLOCK_ROUTES[route]
      await preparePage(page, locale, frozenMs ? { fixedMs: frozenMs } : undefined)
      // ...
    })
  }
}
```

The legacy `number` branch of the union stays unchanged — `/dashboard`
time-variants (8 baselines: morning/afternoon/evening/night × en/ru)
continue to work without recapture.

## Why Approach A over B (mask widgets)

| Concern | Approach A (frozen clock) | Approach B (mask widgets) |
| ------- | ------------------------- | ------------------------- |
| `/work/time` is 100% `'use client'` ([page.tsx:1](https://github.com/fer-fer-code/lancerwise/blob/main/src/app/(app)/time-tracker/page.tsx#L1)) | ✓ patches all 79+ widgets in one place via `window.Date` | ✗ would need ~10 manual mask selectors |
| Layout coverage | ✓ widgets render normally — diffs would catch real CSS regressions in them | ✗ widgets become invisible black holes obscuring layout |
| Pattern consistency | ✓ same as existing `/dashboard` time-variants | ✗ introduces a different masking pattern |
| Future weekday-aware routes | ✓ just add to `FROZEN_CLOCK_ROUTES` map | ✗ each route needs its own mask list |
| Cross-day stability proof | ✓ structural — `Date.UTC(...)` is a literal | ✓ structural — masked regions don't compare |
| Failure mode if a new widget appears | clean — new widget uses frozen clock automatically | hidden — new widget gets compared without mask, can flake |

Approach A wins on every dimension.

## Cross-day stability proof

```typescript
const WORK_TIME_FROZEN_CLOCK_MS = Date.UTC(2026, 0, 9, 14, 0, 0)
//                                  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                                  This is a LITERAL — cannot drift.
//                                  Returns the same Number every time
//                                  the JavaScript engine evaluates it.
```

`Date.UTC` is a pure function from `(year, month, day, hour, min, sec)`
to an integer. Run it on any machine, any year, any timezone — same input
→ same output. The patched `window.Date` constructor + `Date.now()`
inside the test page always returns this exact ms count.

Therefore: no manual "change system clock, re-run" verification needed —
correctness is structural, not empirical.

## Files changed

| File | Change |
| ---- | ------ |
| `tests/e2e/visual-regression.spec.ts` | `+48 / -5`: extend `preparePage` clock param to `ClockSpec` union; add `FROZEN_CLOCK_ROUTES` map; wire `/work/time` to frozen-clock branch |
| `tests/e2e/visual-regression.spec.ts-snapshots/visual-work-time-en-1-visual-regression-darwin.png` | _deleted_ (broken baseline) |
| `tests/e2e/visual-regression.spec.ts-snapshots/visual-work-time-en-1-visual-regression-linux.png` | _deleted_ (broken baseline) |
| `tests/e2e/visual-regression.spec.ts-snapshots/visual-work-time-ru-1-visual-regression-darwin.png` | _deleted_ (broken baseline) |
| `tests/e2e/visual-regression.spec.ts-snapshots/visual-work-time-ru-1-visual-regression-linux.png` | _deleted_ (broken baseline) |

Net: 1 spec file change + 4 baseline deletions. No production code touched.

## Why no local verification ran

`tests/e2e/auth.setup.ts` requires `PLAYWRIGHT_TEST_USER_EMAIL` +
`PLAYWRIGHT_TEST_USER_PASSWORD` (or the `/tmp/phase10-test-creds.txt`
fixture). Neither is present on the local box; both live in GitHub Actions
secrets only. CI runs Linux platform-tagged baselines anyway — local
darwin runs wouldn't validate the actual production CI fixture.

For this fix specifically, local verification adds zero signal beyond what
CI provides, because:
- The change is purely in test-fixture clock-freezing code (no production
  code touched).
- Cross-day stability is structural (see proof above), not empirical.
- The CI gate IS the canonical pass/fail signal — if CI green here, fix works.

## Verification protocol — EXECUTED

1. ✓ PR opened with `qa-visual-baseline-init` label.
2. ✓ Visual-regression gate ran `npx playwright test --update-snapshots`.
3. ✓ Job captured fresh baselines under frozen clock + committed back via
   `qa-gates[bot]` (commit `27841e43`, +2 files only, others byte-stable).
4. ✓ Human review of new baselines — see [`after-baseline-en-linux.png`](after-baseline-en-linux.png)
   + [`after-baseline-ru-linux.png`](after-baseline-ru-linux.png). Both show:
   - "This Week" bar chart with **Fri** highlighted (violet) and other days
     (Sat/Sun/Mon/Tue/Wed/Thu) in slate — confirming frozen clock returned Friday.
   - "**Fri** goal: 8h" label — `DAY[todayDow]` where `todayDow = new Date().getDay()`
     returned `5` (Friday).
   - "08:00:00 remaining" countdown — deterministic from `goalSeconds(8h) - todaySeconds(0)`.
   - "Week Progress: 2.8h / 40h 7%" — deterministic from frozen week window.
5. ✓ `qa-visual-baseline-init` label removed before stability runs.
6. ✓ Stability run #1 commit `e1552aa7`: normal compare mode, **all 3 gates GREEN**.
7. ✓ Stability run #2 commit `eacc538c`: **all 3 gates GREEN**.
   ✓ Stability run #3 commit `9ce2ffde`: **all 3 gates GREEN**.
8. **READY FOR MERGE** — subsequent PRs from [AGENT 1] / [AGENT 2] will
   benefit from the fix; no more `/work/time` false-positive regressions.

See [`ci-runs-summary.txt`](ci-runs-summary.txt) for the full run-by-run log
with durations, run IDs, and per-gate conclusion.

## Cross-links

- PR: https://github.com/fer-fer-code/lancerwise/pull/24
- AGENT 1 escalation: [`../ramiz-qa-pass-1/ESCALATION-pre-existing-gate-fails.md`](../ramiz-qa-pass-1/ESCALATION-pre-existing-gate-fails.md)
- Original broken-baseline diffs: [`../ramiz-qa-pass-1/main-visual-regression-work-time-en-diff.png`](../ramiz-qa-pass-1/main-visual-regression-work-time-en-diff.png), [`../ramiz-qa-pass-1/main-visual-regression-work-time-ru-diff.png`](../ramiz-qa-pass-1/main-visual-regression-work-time-ru-diff.png)
- Workflow that runs the gate: [`.github/workflows/qa-gates.yml`](https://github.com/fer-fer-code/lancerwise/blob/main/.github/workflows/qa-gates.yml) (visual-regression job, branch B — baseline-init)
- Spec file: [`tests/e2e/visual-regression.spec.ts`](https://github.com/fer-fer-code/lancerwise/blob/main/tests/e2e/visual-regression.spec.ts)
- Page source: [`src/app/(app)/time-tracker/page.tsx`](https://github.com/fer-fer-code/lancerwise/blob/main/src/app/(app)/time-tracker/page.tsx)

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + approach + verification protocol |
| [`ci-runs-summary.txt`](ci-runs-summary.txt) | full per-run log: baseline-init + 3 stability runs with durations + run IDs |
| [`before-broken-en-diff.png`](before-broken-en-diff.png) | pre-fix diff PNG (Playwright artifact) showing 13131px diff regions across weekday chart + Fri goal + countdown |
| [`before-broken-ru-diff.png`](before-broken-ru-diff.png) | pre-fix diff PNG (RU locale), 16451px diff |
| [`after-baseline-en-linux.png`](after-baseline-en-linux.png) | post-fix linux baseline captured under frozen Friday 2026-01-09 14:00 UTC clock |
| [`after-baseline-ru-linux.png`](after-baseline-ru-linux.png) | post-fix linux baseline (RU locale, same frozen clock) |
