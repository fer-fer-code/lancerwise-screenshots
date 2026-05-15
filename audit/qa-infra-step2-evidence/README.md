# QA Infrastructure — Step 2 Evidence

Locale-purity Playwright test baseline + cross-check captures for the
`qa-infrastructure-2026-05` branch. This is the **PRE-CP-A-REDO** state
of production (`https://www.lancerwise.com`).

## Source

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Private repo  | `fer-fer-code/lancerwise` (not viewable by reviewer) |
| Branch        | `qa-infrastructure-2026-05`                          |
| Commit at capture | `f211ae90` (Step 2 baseline) — see Step 2 amendment commit for whitelist update |
| Target        | `https://www.lancerwise.com` (production, current `main`) |
| Viewport      | 1440 × 900                                            |
| Browser       | Chromium (Playwright bundle)                          |
| Locale cookie | `NEXT_LOCALE=ru`                                     |
| Auth method   | Approach B — Supabase session cookie injection (no production code changes) |
| Auth user     | `test-phase10@example.com` (Phase-10 fixture)         |

## Files

| File | What it shows |
| ---- | ------------- |
| `step2-locale-purity-failing.txt` | Terminal output of the Playwright test failing on `/dashboard` with explicit confirmation that all 4 CP-A blind-spot widgets are caught. Reproduces: `node --env-file=.env.local ./node_modules/.bin/playwright test --project=setup --project=locale-purity-ru -g "/dashboard$"` |
| `step2-locale-purity-dashboard-failure-screenshot.png` | Playwright auto-screenshot from the failing test run. Shows the Welcome Tour modal + cookie banner. Captured by Playwright itself on test failure (1280×720, default device). |
| `step2-dashboard-scroll-0.png` | `/dashboard` at scrollTop=0 of the inner `<main>` container. Headerhello + greeting + revenue strip. |
| `step2-dashboard-scroll-600.png` | inner scrollTop=600. Cash flow / revenue widgets. |
| `step2-dashboard-scroll-1200.png` | inner scrollTop=1200. Freelance Health Score row. |
| `step2-dashboard-scroll-1800.png` | inner scrollTop=1800. Client Health Grid + Reconnect widgets. |
| `step2-dashboard-scroll-2400.png` | inner scrollTop=2400. Scope Creep + Active Projects Budget. |
| `step2-dashboard-scroll-bottom.png` | inner scrollTop = 4126 (last viewport before cookie banner). |

> **Important — inner-scroll mechanic.** The dashboard wraps its content in `<main class="flex-1 overflow-y-auto …">` with `scrollHeight=4126`, while the document body scrollHeight is only 900 (viewport). `window.scrollTo()` doesn't change what's visible; you have to set `main.scrollTop`. The 6 captures above each set `main.scrollTop` to the labelled value, then screenshot the 1440×900 viewport.

## 4-widget confirmation (CP-A blind spots)

All four widgets are present in `document.body.innerText` **at every scroll position** in the captures above:

| Widget                                                 | In DOM (innerText) | Captured in screenshot at scrollTop |
| ------------------------------------------------------ | :----------------: | ----------------------------------- |
| Estimated Balance (CashFlowWidget)                     | ✓                  | 0 (visible top-right)               |
| Freelance Health Score                                 | ✓                  | 1200–1800                            |
| Reconnect with Clients                                 | ✓                  | 1800–2400                            |
| Scope Creep Monitor                                    | ✓                  | 2400 — visible mid-screen            |
| Client Health Grid (drift-flag widget)                 | ✓                  | 1800                                 |

## Drift cross-check (response to reviewer)

Reviewer flagged that captures from another agent showed 3 widgets missing (`Freelance Health Score`, `Reconnect with Clients`, `Client Health Grid`). Result from this evidence pack:

**All 3 widgets are present in the live `/dashboard` DOM right now.** The locale-purity Playwright test independently captures these widget titles as offending EN tokens — see `step2-locale-purity-failing.txt`.

Likely cause of the other agent's drift: the Welcome Tour modal (driver.js) was still active when their capture was taken. Driver.js applies an overlay + occludes element visibility, so a naïve `document.body.innerText` extraction returns only the modal + chrome (19 tokens) instead of the full dashboard (220+ tokens). Step 2 spec now explicitly dismisses driver popovers via `.driver-popover-close-btn` + `Escape` before any token extraction or screenshot.

## How to re-run this evidence locally

```bash
cd ~/lancerwise
node --env-file=.env.local ./node_modules/.bin/playwright \
  test --project=setup --project=locale-purity-ru
```

Outputs:
- `audit/locale-purity-baseline-failures.json` (gitignored — full per-token records)
- Per-test screenshots in `test-results/locale-purity-RU-locale-purity-*/test-failed-1.png`
- Per-test failure traces (`trace.zip`)

For just the 6 scroll captures, use `scripts/audit/dashboard-scroll-captures.mjs` (to be added in Step 4 alongside CI integration).

## Cross-links

- Locale-purity summary (in private lancerwise): `audit/locale-purity-summary.md` (110 lines)
- Spec source (in private lancerwise): `tests/e2e/locale-purity.spec.ts`
- Auth setup (in private lancerwise): `tests/e2e/auth.setup.ts`
- CP-A redo evidence dir: `../cp-a-redo-step3-prep/` (other agent's work)

## Step 2 amendments commit (post-review)

The Step 2 amendments commit (subtree skip mechanism via `[data-test-skip-locale-purity="true"]`, `/settings/profile` route fix, keyboard whitelist `Esc/Enter/Tab/Shift/Ctrl/Cmd/Alt`) was pushed as a follow-up to commit `f211ae90`. See top of this README for the latest commit hash.
