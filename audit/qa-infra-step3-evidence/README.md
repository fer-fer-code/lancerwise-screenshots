# QA Infrastructure — Step 3 Evidence

Playwright visual-regression baseline suite + demo proving the gate
catches a real UI regression.

## Source

| Field         | Value                                                |
| ------------- | ---------------------------------------------------- |
| Private repo  | `fer-fer-code/lancerwise` (not viewable by reviewer) |
| Branch        | `qa-infrastructure-2026-05`                          |
| Commit        | _filled in when Step 3 commit lands — see top of repo_ |
| Spec          | `tests/e2e/visual-regression.spec.ts`                |
| Snapshot dir  | `tests/e2e/visual-regression.spec.ts-snapshots/`     |
| Target        | `http://localhost:3000` (next dev / Turbopack)        |
| Viewport      | 1440 × 900                                            |
| Browser       | Chromium (Playwright bundle)                          |
| Device scale  | 1                                                     |
| Threshold     | `maxDiffPixelRatio: 0.01` (1% of pixels)             |
| Reduced motion| `prefers-reduced-motion: reduce` (animations frozen)  |
| Animations    | `animations: 'disabled'` (Playwright API)             |
| Auth          | Approach B — Supabase session cookie + `NEXT_LOCALE` |
| Snapshot template | `{testDir}/visual-regression.spec.ts-snapshots/{arg}-{projectName}-{platform}{ext}` — platform-tagged so darwin baselines do not collide with linux CI runs |

## The 24 baseline files

8 routes × 2 locales (en, ru) + 4 time variants × 2 locales (for /dashboard) = 24.

| #  | Filename                                                                       |
| -- | ------------------------------------------------------------------------------ |
| 1  | `visual-dashboard-en-1-visual-regression-darwin.png`                            |
| 2  | `visual-dashboard-ru-1-visual-regression-darwin.png`                            |
| 3  | `visual-work-en-1-visual-regression-darwin.png`                                 |
| 4  | `visual-work-ru-1-visual-regression-darwin.png`                                 |
| 5  | `visual-work-time-en-1-visual-regression-darwin.png`                            |
| 6  | `visual-work-time-ru-1-visual-regression-darwin.png`                            |
| 7  | `visual-clients-en-1-visual-regression-darwin.png`                              |
| 8  | `visual-clients-ru-1-visual-regression-darwin.png`                              |
| 9  | `visual-finances-en-1-visual-regression-darwin.png`                             |
| 10 | `visual-finances-ru-1-visual-regression-darwin.png`                             |
| 11 | `visual-analytics-en-1-visual-regression-darwin.png`                            |
| 12 | `visual-analytics-ru-1-visual-regression-darwin.png`                            |
| 13 | `visual-contracts-en-1-visual-regression-darwin.png`                            |
| 14 | `visual-contracts-ru-1-visual-regression-darwin.png`                            |
| 15 | `visual-settings-en-1-visual-regression-darwin.png`                             |
| 16 | `visual-settings-ru-1-visual-regression-darwin.png`                             |
| 17 | `visual-dashboard-morning-h-8-en-1-visual-regression-darwin.png`                |
| 18 | `visual-dashboard-morning-h-8-ru-1-visual-regression-darwin.png`                |
| 19 | `visual-dashboard-afternoon-h-14-en-1-visual-regression-darwin.png`             |
| 20 | `visual-dashboard-afternoon-h-14-ru-1-visual-regression-darwin.png`             |
| 21 | `visual-dashboard-evening-h-19-en-1-visual-regression-darwin.png`               |
| 22 | `visual-dashboard-evening-h-19-ru-1-visual-regression-darwin.png`               |
| 23 | `visual-dashboard-night-h-23-en-1-visual-regression-darwin.png`                 |
| 24 | `visual-dashboard-night-h-23-ru-1-visual-regression-darwin.png`                 |

Total disk: 2.6 MB. Baselines committed to the private repo under
`tests/e2e/visual-regression.spec.ts-snapshots/`.

> **Important:** baselines are intentionally captured against the CURRENT broken
> state of `main`. After CP-A redo merges, every changed snapshot will be
> regenerated via an explicit `playwright test --update-snapshots` step that is
> reviewed in a follow-up PR. The gate's job today is to lock in the current
> state and flag any unintended visual change between merges.

## Time-variant capture mechanism

`preparePage(page, locale, clockHour)` runs `page.addInitScript()` to patch
`window.Date` so that `new Date()` and `Date.now()` return a fixed timestamp
at the requested hour (with `setHours(hr, 0, 0, 0)`). This freezes:

- The header greeting bucket (`bucketForHour` in `WelcomeBanner.tsx`)
- The "Today: …" date line
- Any `Intl.DateTimeFormat` calls anchored on `Date.now()`

Animations and reduced-motion are also forced so transient frames don't leak
into the diff.

## Three sample baselines (visual verification by reviewer)

| File | What you should see |
| ---- | ------------------- |
| `sample-dashboard-en.png` | `/dashboard` rendered in English — header reads "Dashboard"; greeting reads "Good morning/afternoon/evening, Phase" depending on capture hour; widgets (Estimated Balance, Freelance Health Score, Reconnect with Clients, Scope Creep Monitor, Client Health Grid, Cash Flow) all visible below the header. |
| `sample-dashboard-morning-h-8-ru.png` | `/dashboard` rendered in Russian with `Date.now()` frozen at 08:00. Header reads "Главная"; greeting reads "Доброе утро, Phase". Time-dependent copy reflects the morning bucket. |
| `sample-analytics-ru.png` | `/analytics` rendered in Russian. Used as a control — most analytics widgets still show English chrome (no CP-A redo there yet); locale-purity gate (Step 2) flagged 287 tokens on this route. |

## Demo — the gate fails on a real change

`step3-demo-fail-output.txt` — terminal output of the demo failing run.

Demo procedure (idempotent, no source mutation):

1. Saved baseline: `visual-dashboard-en-1-visual-regression-darwin.png`.
2. Created a temporary spec that loads `/dashboard [en]`, applies
   `page.addStyleTag({ content: 'header { background: #00ff00 !important; }' })`,
   then runs `expect(page).toHaveScreenshot(...)` against the same baseline.
3. Result: **failure** — 81,695 different pixels (0.07 ratio, ~7× the 0.01
   threshold). Exit code 1. CI gate would block merge.
4. Playwright wrote `expected.png` (the baseline), `actual.png` (with green
   header overlay), and `diff.png` (red highlighting the differing pixels).
5. Temporary spec file deleted.

| File | What you should see |
| ---- | ------------------- |
| `step3-demo-fail-expected.png` | Baseline — header is the normal dark slate. |
| `step3-demo-fail-actual.png` | Mutated render — header is bright lime green. |
| `step3-demo-fail-diff.png` | Playwright's red overlay highlighting every differing pixel — header region almost entirely red. |
| `step3-demo-fail-output.txt` | Terminal output of the failing run. |

## Passing run (control)

```
$ BASE_URL=http://localhost:3000 node --env-file=.env.local \
    ./node_modules/.bin/playwright test --project=setup \
    --project=visual-regression
…
  25 passed (4.8m)
```

All 24 baselines reproduce within the 0.01 threshold when no mutation is
applied. The setup project (auth) also passes — 1 setup + 24 baselines = 25.

## How to re-run locally

```bash
cd ~/lancerwise
nohup npm run dev > /tmp/dev_server.log 2>&1 &
until curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ | grep -qE "^(200|307|302)$"; do sleep 1; done
BASE_URL=http://localhost:3000 node --env-file=.env.local \
  ./node_modules/.bin/playwright test \
  --project=setup --project=visual-regression
```

To regenerate baselines (after an approved diff review):

```bash
BASE_URL=http://localhost:3000 node --env-file=.env.local \
  ./node_modules/.bin/playwright test \
  --project=setup --project=visual-regression --update-snapshots
```

## Open questions for reviewer

1. **Platform tagging.** Snapshots are written as `…-darwin.png` because they
   were captured on macOS. CI (linux) will write its own `…-linux.png`
   baselines on first CI run. Plan: in Step 4 the CI workflow writes baselines
   on linux as the canonical reference; darwin baselines stay for local dev
   parity but the CI gate enforces linux. Confirm OK?

2. **Cookie banner / driver-popover masked at capture time.** Spec injects
   `visibility: hidden` for `[data-cookie-banner]`, `[data-tour]`,
   `.driver-popover`, `.driver-overlay`, `.relative-time`,
   `[data-test-skip-locale-purity]` before screenshot. Sample baselines have
   blank space where those elements would be. Reviewer to confirm masking
   list is correct — anything else needs masking?

3. **Page height = 900 (viewport).** The dashboard's inner `<main>`
   `scrollHeight=4126` but the screenshot is `fullPage: false` (viewport
   only). Below-the-fold widgets are NOT in the captured PNG even though
   they are in the DOM. Switching to `fullPage: true` would multiply storage
   per baseline (~5× bigger) and introduce more flakiness from scroll
   behaviour differences. Recommend keeping viewport-only; reviewer to
   override if desired.

4. **Localhost vs production parity.** Baselines were captured against
   `http://localhost:3000` (Turbopack dev). Production builds (`next build`)
   can differ on font loading, image optimization, and dynamic rendering.
   Step 4 CI will run `next build && next start` to get production-mode
   rendering before capture — that may invalidate these darwin baselines
   for direct comparison. The platform tag (`-darwin` vs `-linux`) keeps
   them separate.

## Cross-links

- Spec source (private lancerwise): `tests/e2e/visual-regression.spec.ts`
- Snapshot dir (private lancerwise): `tests/e2e/visual-regression.spec.ts-snapshots/`
- Step 1 evidence: `../qa-infra-step1-evidence/`
- Step 2 evidence: `../qa-infra-step2-evidence/`
- CP-A redo evidence: `../cp-a-redo-step3-prep/`
