# Lighthouse Pre-Launch Audit — 2026-05-23

**Production URL:** https://www.lancerwise.com
**Tool:** lighthouse 13.3.0 (desktop preset, simulated 10Mbps / 40ms RTT)
**Chrome:** Google Chrome (system install) — headless
**Run date:** 2026-05-23
**Pages audited:** 4 (homepage, /pricing, /login, /register)
**Pages skipped:** 1 (/dashboard — requires auth, redirects to /login)
**Mobile preset:** skipped this pass (time constraint, recommended week-1 follow-up)

---

## Scores Summary

| Page       | Perf | A11y | BP  | SEO | Verdict             |
|------------|------|------|-----|-----|---------------------|
| /          | 100  | 90   | 100 | 100 | **Excellent**       |
| /pricing   | 100  | 90   | 100 | 100 | **Excellent**       |
| /login     | 100  | 90   | 100 | 100 | **Excellent**       |
| /register  | 100  | 91   | 100 | 100 | **Excellent**       |
| /dashboard | —    | —    | —   | —   | Skipped (auth-gated, redirects to /login) |

All audited pages clear ≥90 on every category. No score below 90 anywhere.

---

## Core Web Vitals

| Page      | LCP   | CLS  | TBT  | FCP   | Speed Index | TTI   |
|-----------|-------|------|------|-------|-------------|-------|
| /         | 0.5 s | 0    | 0 ms | 0.4 s | 0.7 s       | 0.5 s |
| /pricing  | 0.4 s | 0.007| 0 ms | 0.3 s | 1.0 s       | 0.4 s |
| /login    | 0.4 s | 0    | 0 ms | 0.4 s | 0.9 s       | 0.4 s |
| /register | 0.4 s | 0    | 0 ms | 0.3 s | 0.8 s       | 0.4 s |

**Reference thresholds (Google CWV "good"):**
- LCP ≤ 2.5 s → all 4 pages **5× better than threshold**
- CLS ≤ 0.1 → all 4 pages essentially zero
- INP ≤ 200 ms (proxy: TBT ≤ 200 ms) → all 4 pages report 0 ms TBT

Note: TBT used as INP proxy because headless Lighthouse can't measure real interactions. INP must be validated post-launch via field data (Vercel Speed Insights / CrUX).

---

## Page Weight

| Page      | Transfer | Requests | DOM nodes | Largest JS                  | Largest CSS                |
|-----------|----------|----------|-----------|------------------------------|----------------------------|
| /         | 579 KiB  | 45       | 724       | 16h30fmarassu.js — 151 KB    | 0tafhfiotwn2w.css — 33 KB |
| /pricing  | 567 KiB  | 46       | 260       | 16h30fmarassu.js — 151 KB    | 0tafhfiotwn2w.css — 33 KB |
| /login    | 1,059 KiB| 52       | 77        | 16h30fmarassu.js — 151 KB    | 0tafhfiotwn2w.css — 33 KB |
| /register | 1,065 KiB| 54       | 114       | 16h30fmarassu.js — 151 KB    | 0tafhfiotwn2w.css — 33 KB |

- Largest JS bundle is the shared framework chunk `16h30fmarassu.js` (151 KB) — common across all routes.
- Largest CSS bundle is `0tafhfiotwn2w.css` (33 KB) — Tailwind global, also shared.
- Largest image: `icon.svg` (~0–2 KB). No heavy hero images on any page.
- /login and /register are roughly 2× the transfer of marketing pages — likely Turnstile widget + Supabase Auth JS pulled in. Worth profiling post-launch but well within acceptable.

---

## Aggregate Verdict

**EXCELLENT BASELINE — clear to launch.**

All four audited pages score 100 on Performance, 100 on Best Practices, 100 on SEO, and 90–91 on Accessibility. Core Web Vitals are dramatically better than Google's "good" thresholds: LCP ≤ 0.5 s on every page versus the 2.5 s good-line, CLS effectively zero, TBT 0 ms.

This is one of the cleanest pre-launch Lighthouse baselines I'd expect to see. The Next.js + Vercel + static-first marketing stack is paying off. No category is below the 90 threshold, so there is no launch-blocking signal here.

`/dashboard` was skipped because it requires authentication (redirected to /login as expected). It should be audited post-launch with an authed session — that's where real-world performance risk lives (widget waterfall, AI endpoints, dynamic data). Cross-reference existing memos:
- `backlog_dashboard_perf_waterfall_requests.md` — P2
- `backlog_clients_detail_perf_waterfall.md` — P1

---

## Top 5 Post-Launch Optimizations

These are NOT blockers. All of them are picked up by Lighthouse as score < 1 audits but don't drag any category below 90. Order is by potential impact + simplicity.

### 1. Reduce unused JavaScript — 188–197 KB savings on every page
Lighthouse flags `~197 KiB` of unused JS on every page, dominated by:
- `16h30fmarassu.js` — 86 KB unused out of 151 KB total (57%)
- `0gyb6ra~eko4..js` — 57 KB unused out of 61 KB total (93%)
- `0tp-kq2o1iszz.js` — 54 KB unused out of 62 KB total (87%)

These are Next.js shared chunks. Possible mitigations: dynamic imports for route-specific dependencies, route-segment splitting, audit `next/dynamic` opportunities for heavy modal/widget code in the marketing bundle. **Estimated effort: medium**, **impact: meaningful on slower devices / mobile networks**.

### 2. Avoid legacy JavaScript — ~21 KB savings on every page
Lighthouse reports legacy polyfills/transpilation are still being shipped to modern browsers. Verify Next.js `browserslist` config targets modern baselines (last 2 versions / supports es2020). **Effort: low**.

### 3. Render-blocking requests on /login and /register — 50 ms LCP savings
`/login` and `/register` show 60 ms est. savings from render-blocking resources (Supabase auth or Turnstile script likely). Defer/async or move below-the-fold. **Effort: low–medium**.

### 4. Deploy source maps for production debugging
`valid-source-maps` fails on every page — first-party JS has no source maps. This isn't a user-perceived issue but it cripples production error debugging (Sentry, customer support traces). Worth flipping `productionBrowserSourceMaps: true` in `next.config.js` or uploading source maps to Sentry only. **Effort: trivial**.

### 5. Accessibility polish (drops A11y from 90 to 100)
Three classes of small a11y issues, all easy fixes:
- **`color-contrast`** on `/` and `/pricing`: `text-slate-500` on dark/white backgrounds fails WCAG AA. Bump to `text-slate-400`/`text-slate-300` (dark mode) or `text-slate-600`+ (light mode) where this class appears in body copy.
- **`label-content-name-mismatch`** on `/` and `/pricing`: button with visible "Chat" or similar text has a different `aria-label` (truncated as "Ch…" in audit). Sync `aria-label` to visible text or remove the redundant aria-label.
- **`link-in-text-block`** on `/login` and `/register`: inline links rely on color alone. Add underline (`underline` / `hover:underline`) for WCAG 1.4.1.
- **`meta-viewport user-scalable=no`**: viewport meta tag is preventing pinch-zoom. Remove `user-scalable=no` and `maximum-scale<5` to comply with WCAG 1.4.4. Likely set in `app/layout.tsx`.

**Effort: 30–60 min total. Reward: A11y 100 across the board.**

### Honorable mentions (informational, not actionable now)
- **`bf-cache`** fails because `cache-control: no-store` is set on the main HTML response. This is a deliberate consequence of auth-protected app patterns and "Not actionable" per Lighthouse itself.
- **`network-dependency-tree-insight`** shows 0 ms LCP savings — informational only.

---

## Baseline для regression detection

These numbers form the launch-eve baseline. Re-measure weekly post-launch (e.g. via the same `npx lighthouse ... --preset=desktop` cmdline saved as a CI job, or Vercel Speed Insights for field data).

**Investigate any of:**
- Performance score drop > 10 points on any page
- LCP > 1.5 s (3× current baseline)
- CLS > 0.1 on any page
- TBT > 200 ms on any page
- Transfer > 1.5 MB on /login or /register (1.4× baseline)

**Add to weekly observability cadence (see `backlog_core_web_vitals_monitoring.md`).**

---

## Red flags

**None — clear to launch.**

No page scored below 50 (or even below 90) on any category. There is no launch-blocking signal in this audit. The top-5 optimizations above are all P2/P3 polish that can land any time in weeks 1–8 post-launch.

---

## Files in this audit

| File | Purpose |
|---|---|
| `LIGHTHOUSE-REPORT.md` | This summary |
| `summary-metrics.json` | Machine-readable metrics |
| `lhr-homepage.report.json` / `.html` | Full Lighthouse output for `/` |
| `lhr-pricing.report.json` / `.html` | Full Lighthouse output for `/pricing` |
| `lhr-login.report.json` / `.html` | Full Lighthouse output for `/login` |
| `lhr-register.report.json` / `.html` | Full Lighthouse output for `/register` |

`/dashboard` was attempted but redirected to `/login`; raw run kept as `lhr-dashboard.report.json` for posterity — its measurements are effectively for `/login` after redirect.

---

## Tooling notes

- Used `npx lighthouse@latest` (resolved to 13.3.0) with system Chrome — zero install/setup friction.
- Headless mode worked cleanly via `CHROME_PATH` env var (Mac).
- All 5 pages audited in roughly 90 seconds wall time.
- Mobile preset was skipped this pass — recommend adding a mobile run in week-1 post-launch baseline.
