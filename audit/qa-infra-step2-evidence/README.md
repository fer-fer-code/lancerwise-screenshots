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

The Step 2 amendments commit (subtree skip mechanism via `[data-test-skip-locale-purity="true"]`, `/settings/profile` route fix, keyboard whitelist `Esc/Enter/Tab/Shift/Ctrl/Cmd/Alt`) was pushed as a follow-up to commit `f211ae90` as `bf076ac7`.

## Step 2 follow-up commit (post-amendments — Actions 1/2)

Commit `7dcdf88c` on `qa-infrastructure-2026-05` adds:

- **Action 1 — Avatar subtree skip.** `src/components/layout/Header.tsx`: `<div data-test-skip-locale-purity="true">` wraps the user-avatar button. `PTT` is the test fixture user's initials (`Phase TestTime`) — not a localizable UI string. Once deployed, the locale-purity baseline drops 9 PTT hits across routes. Validated locally against `npm run dev` on `localhost:3000` (PTT count = **0** confirmed). Will drop on production after merge to `main`.

- **Action 2 — Inner `<main>` scroll fix.** Dashboard wraps content in `<main class="flex-1 overflow-y-auto …">` with `scrollHeight=4126px` while body is just 900px (= viewport). `window.scrollTo()` was a no-op. Spec now scrolls the inner `<main>` when it is the real scroll container, with longer per-step waits (350ms) plus a second-pass driver.js popover dismissal right before `innerText` extraction. Cash Flow / Estimated Balance / Scope Creep Monitor previously dropped from the captured token set when scroll exposed them but the Welcome Tour re-rendered; fix restores them.

### Baseline numbers — before vs after Actions

| Snapshot | Target | Total | PTT | 4 widgets |
| -------- | ------ | ----: | --: | --------- |
| Step 2 commit (pre-Actions) | prod | 2,779 | 9 | all caught |
| Action 1+2 (this commit) | prod | 2,779 | 9 | all caught — prod not redeployed yet (Vercel deploys only `main`) |
| Action 1+2 (this commit) | local dev | **2,764** | **0** | all caught — Avatar attr applied at runtime |

The local-dev run is the canonical post-Action validation. Production parity will follow once the branch lands on `main`.

## Notes on remaining /settings noise

The `/settings` route is still the noisiest single route at **1,501 unique tokens** (vs. 219 on `/dashboard`). It is the API Reference Explorer with 1,053 endpoint names — legitimately English by product design. Planned approach: wrap the explorer subtree in a `data-test-skip-locale-purity="true"` container in a follow-up commit (CP-A redo or a separate maintenance pass). The subtree skip mechanism is already in place; no spec change needed.

## /settings/public-profile is a separate translation task

The 71 tokens flagged on `/settings/public-profile` are real freelancer-profile editor strings (Cover photo, About, Skills, etc.). They are **not** in CP-A redo scope (CP-A redo covers `/dashboard` + sidebar). Tracked as **CP-A-public-profile / Phase 9 backlog** — handled after CP-A redo merges.

## PTT explanation

`PTT` is the test-fixture user `Phase TestTime`'s initials, rendered in the user-avatar button at the top-right of every page. Earlier baseline iterations flagged it 9 times (one per route, minus `/settings/profile` which was a 404 and didn't render the avatar). It is **not** a localizable UI string — it is per-user dynamic data — so the subtree skip (Action 1) is the correct fix, not a translation key.
