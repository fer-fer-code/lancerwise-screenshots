# Post-Fix Verification — PR #225 codemod text-slate-500 → text-slate-400

Date: 2026-05-24
PR: https://github.com/fer-fer-code/lancerwise/pull/225 (MERGED 16:05:11Z)
Merge commit: `3a1c8ecb95f265e100299915b500e972a048e10d`
Production deploy: Vercel SUCCESS 2026-05-24T16:08:20Z
Method: Lighthouse 11.x desktop preset, production URLs

## Color-contrast violation count — before vs after

| Route | Baseline (commit `1808d82`) | Post-fix (commit `3a1c8ecb`) | Resolved | Δ |
|---|---|---|---|---|
| / (landing) | 52 | **1** | 51 | **−98%** |
| /pricing | 26 | **1** | 25 | **−96%** |
| **Subtotal these 2 routes** | **78** | **2** | **76** | **−97%** |

Other 3 routes from baseline audit (login/register/forgot-password) had 1 each = 3 total. Not re-verified в this pass (out of scope: codemod only targeted `text-slate-500`, and those 1-each violations are different audit categories per prior breakdown).

Total accessibility-category color-contrast violations across 5 routes: **81 → ~5 expected** (78→2 verified + 3 unverified-but-out-of-codemod-scope).

## Accessibility scores

| Route | Baseline | Post-fix | Δ |
|---|---|---|---|
| / | 90 | 90 | 0 (other audits keep cap at 90) |
| /pricing | 90 | 90 | 0 |

Score plateau at 90 expected — remaining points blocked by NON-contrast audits (viewport `maximum-scale=1`, language-switcher aria, etc.) which were explicitly out of scope per Ramiz directive (only quick-win #3 applied).

## Remaining 2 color-contrast violations (post-fix)

Both routes have IDENTICAL single remaining hit:

```html
<a class="text-accent hover:text-accent-hover underline-offset-2 hover:underline"
   href="/cookie-policy">
```

- Foreground: `#6A5AE0` (Phase 1 token `--accent-primary`)
- Background: `#15151F` (Phase 1 token `--card`)
- Computed ratio: **3.58:1**
- WCAG 2.1 AA threshold: 4.5:1 (normal text)
- Verdict: FAIL marginal

### Root cause + recommendation

The cookie-policy link uses `text-accent` (= `--accent-primary` = `#6A5AE0`) on `--card` surface. This is the SAME accent token used for primary CTA buttons, which read white-on-accent (5.06:1 PASS). But used as link text on dark card, it falls short.

**Two paths forward (post-launch backlog):**
1. **Token-side fix** — introduce `--accent-link` token tuned for text-on-dark-card legibility (e.g. `#8B7DEF` or `#9989EC`, ~4.6+:1)
2. **Component-side fix** — keep `text-accent` for CTA backgrounds only, switch cookie-policy + similar links к `text-secondary` (#A0A0AE, 7.02:1 PASS) + decorative accent on hover

Recommendation: **Option 1** — preserves accent-as-link semantic. ~10 min add token + retarget classes.

## Quick-wins #1/#2/#4/#5 status (deferred per directive)

| # | Item | Status |
|---|---|---|
| 1 | Remove `maximum-scale=1` from viewport meta | NOT applied (awaiting separate signal) |
| 2 | Cookie-policy link underline на login/register/forgot | NOT applied |
| 3 | **Codemod text-slate-500 → text-slate-400** | ✅ **APPLIED — этот PR** |
| 4 | Language-switcher aria-label sync | NOT applied |
| 5 | Wrap landing в `<main>` landmark | NOT applied |

## Discipline confirmation

- Only quick-win #3 shipped ✓
- Visual-regression CI passed naturally — color shift below diff threshold ✓
- No new violations introduced ✓
- No Phase 1/2 regression ✓
- Standing by armed для next quick-win signal ✓

## Files

- `/tmp/lh-post-fix-225/landing.report.json` — full Lighthouse JSON
- `/tmp/lh-post-fix-225/pricing.report.json` — full Lighthouse JSON
- Baseline reports: `audit/agent6-lighthouse-wcag-2026-05-23/lh-reports/landing-desktop.report.json` + `pricing-desktop.report.json`
