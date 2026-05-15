# Sidebar Stability — Diagnosis & Fix

## Symptom

Reviewer flagged that the Step 3 baselines (`sample-dashboard-en.png`, `sample-dashboard-morning-h-8-ru.png`, `sample-analytics-ru.png`) showed only the bottom-left `N` avatar and no navigation sidebar, while the demo-fail `actual.png` showed the full sidebar (`LancerWise` logo, Home / Money / Clients / Work / Contracts / Insights / Settings, Notifications, 4/7 setup). Two captures of the same page rendered different DOM — guaranteed false-positive flood on every PR.

## Diagnosis

Both captures used identical auth (Approach B storageState), identical viewport (1440 × 900), identical wait strategy. The divergence was a single line in the masking step.

[`tests/e2e/visual-regression.spec.ts`](https://github.com/fer-fer-code/lancerwise) `settleAndDismissModals` injected this stylesheet before the screenshot:

```css
[data-cookie-banner], #cookie-banner, .cookie-banner,
[data-tour], .driver-popover, .driver-overlay,
.relative-time, [data-relative-time],
[data-test-skip-locale-purity]
{ visibility: hidden !important; }
```

The intent of `[data-tour]` was to hide driver.js tour anchors (`<button data-tour="quick-actions">`). But [`src/components/layout/NewSidebar.tsx:188`](https://github.com/fer-fer-code/lancerwise) carries the same attribute on the whole sidebar:

```html
<aside data-tour="sidebar-nav" class="hidden md:flex w-56 …">
```

The blanket attribute selector hid the entire sidebar in every baseline capture. The demo-fail spec did **not** apply this masking (it called `addStyleTag` only for `header { background: #00ff00 }`), so its `actual.png` still rendered the sidebar — hence the divergence.

## Root cause: 1-line over-broad selector. Fix: 1-line replacement.

Removed `[data-tour]` from the mask. The driver.js popover and overlay (the actual tour UI) are still hidden via their own classes (`.driver-popover`, `.driver-overlay`). The sidebar — whose content is stable and IS what visual regression should detect changes in — is no longer masked.

Additional fixes shipped in the same commit:

1. **Cookie banner mask was a no-op.** The real banner component (`src/components/analytics/CookieConsent.tsx:111`) is a `<div role="dialog" aria-label="Cookie consent">` with no `data-cookie-banner` attribute and no `.cookie-banner` / `#cookie-banner` class. The previous mask selectors matched zero elements. New mask: `[role="dialog"][aria-label="Cookie consent"]`.

2. **Sidebar hydration wait.** Added an explicit `await page.locator('aside[data-tour="sidebar-nav"]').waitFor({ state: 'visible', timeout: 8_000 })` before the dismissal/scroll loop. Soft-fails if sidebar absent (some future embedded view may have no sidebar) — but at least logs a warning. This is the primary anti-flake guard.

3. **`preparePage` + `settleAndDismissModals` are now exported** from `visual-regression.spec.ts`. The demo-fail spec now imports them, so the demo capture path matches the baseline capture path bit-for-bit. This is what would have caught the original sidebar divergence in code review.

## Verification

| Check | Result |
| ----- | ------ |
| 3-run stability check (`/dashboard [en]`) — identical MD5 across runs? | ✓ All 3 runs MD5 `3f0a11ac264bf4ca8da2bde9dd6f42aa`, byte-identical 179,875 bytes |
| Sidebar visible in regenerated baseline? | ✓ See `sample-dashboard-en.png` — LancerWise logo + 7 nav items + Notifications + 4/7 setup all present |
| Cookie banner masked? | ✓ `[role="dialog"][aria-label="Cookie consent"]` hides the entire banner including Customize/Reject/Accept All buttons |
| Full 24-baseline regeneration | ✓ `25 passed (5.3m)` (1 setup + 24 baselines written) |
| Stability re-run on regenerated baselines | ✓ `25 passed (5.3m)` (no `--update-snapshots` — all within 0.01 threshold) |
| Demo fail re-run against new baseline | ✓ Fails with 65,078 px diff (ratio 0.06, 6× over 0.01 threshold). Diff PNG (`step3-demo-fail-diff.png`) shows the diff is **isolated to the header bar only** — sidebar region is rendered transparent in the diff = identical between expected and actual. |

The previous demo run reported 81,695 px diff. The new demo reports 65,078 px — slightly less because the user avatar area (top-right) is now uniformly masked in both expected and actual via the kept `[data-test-skip-locale-purity]` rule, so that region no longer contributes to the diff.

## Files changed

In private repo (`fer-fer-code/lancerwise`):

- `tests/e2e/visual-regression.spec.ts`
  - Mask: removed `[data-tour]`, removed dead `[data-cookie-banner]` / `#cookie-banner` / `.cookie-banner`, added `[role="dialog"][aria-label="Cookie consent"]`
  - Added `await page.locator('aside[data-tour="sidebar-nav"]').waitFor(...)` before modal dismissal
  - Exported `preparePage` and `settleAndDismissModals` so demos reuse the same flow
- `tests/e2e/visual-regression.spec.ts-snapshots/*.png` — all 24 baselines regenerated

In public repo (`fer-fer-code/lancerwise-screenshots`):

- `audit/qa-infra-step3-evidence/sidebar-diagnosis.md` — this file
- `audit/qa-infra-step3-evidence/sample-dashboard-en.png` — replaced with new (sidebar-included) version
- `audit/qa-infra-step3-evidence/sample-dashboard-morning-h-8-ru.png` — replaced
- `audit/qa-infra-step3-evidence/sample-analytics-ru.png` — replaced
- `audit/qa-infra-step3-evidence/step3-demo-fail-expected.png` — new baseline (sidebar visible)
- `audit/qa-infra-step3-evidence/step3-demo-fail-actual.png` — new mutation render
- `audit/qa-infra-step3-evidence/step3-demo-fail-diff.png` — new diff (header-only red region)

## Lesson logged

`[attr]` style selectors that match component-internal hooks (`data-tour`, `data-testid`, `data-onboarding`, etc.) are dangerous when used for masking — they will catch unintended elements as the codebase evolves. Future masking should prefer:

1. Explicit component-root selectors (`[role="dialog"][aria-label="…"]`)
2. Classes that are clearly owned by the dynamic element (`.driver-popover`, `.driver-overlay`)
3. A bespoke `data-test-mask` attribute applied explicitly to elements that should be hidden, never inherited from existing tour/testid attributes

This rule is now documented inline in the spec's masking block.
