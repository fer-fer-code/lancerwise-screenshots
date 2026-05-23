# Landing Page Polish Review — 2026-05-23

Target: https://www.lancerwise.com (Russian locale, default)
Method: Chrome CDP (port 59736) → manual WS handshake (Origin header stripped)
Viewports: 1440×900 desktop + 390×844 mobile (iPhone 14)

## Check Results

### 1. Hero gradient
- **Status: DRIFT (cosmetic, on-brand visually)**
- **Implementation:** Tailwind utility chain `bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500`
- **Canonical expected:** `bg-gradient-primary` / `var(--brand-gradient)` = `#483ACC → #935AF0 → #F897FE`
- **Computed background-image (literal from getComputedStyle):**
  `linear-gradient(to right bottom, lab(41.088 68.9966 -91.995) 0%, lab(52.0183 66.11 -78.2316) 50%, lab(56.9303 76.8162 -8.07021) 100%)`
  → decodes к `#7C3AED → #A855F7 → #EC4899` (Tailwind violet-600/purple-500/pink-500)
- **Drift magnitude:** all 3 stops shifted toward higher saturation/brightness; end stop drifts violet→pink (#F897FE expected, #EC4899 actual). Visually punchier than canonical, but breaks single-source-of-truth.
- **Occurrences found on landing:** 4 elements use the 3-stop violet→pink chain (header "Начать" button, "Рассчитать ставку" CTA, the chart bar in the hero mockup, the inline pill anchor). Pro pricing card uses 2-stop `from-violet-600 to-purple-700`. Total: 5 gradient-using elements drift, 0 use canonical `--brand-gradient`.
- **Cross-link:** same Phase-2-style drift pattern as the deferred `gradient hex drift on dashboard widgets` backlog item; landing page belongs in the same sweep.

### 2. CTA buttons
- **Status: DRIFT (color), PASS (no-gradient discipline mostly held)**
- **Buttons inspected:** 13 visible buttons/anchors with styled backgrounds (top ranked by visibility)
- **Pass (solid `#6A5AE0` = `rgb(106, 90, 224)`):** 0
- **Drift — solid `#7C3AED` (violet-600) instead of `#6A5AE0`:** 4 CTAs
  - "Помесячно" (pricing toggle) → `lab(41.088 68.9966 -91.995)` = `#7C3AED`
  - "Начать бесплатно" (Pro plan) → `#7C3AED`
  - "Сообщить, когда станет доступно" (Business plan) → `#7C3AED`
  - All other secondary primary action solid buttons → `#7C3AED`
- **Drift — gradient on primary CTA (anti-pattern per spec):** 2 CTAs
  - Header "Начать" (top-right register) → 3-stop violet→pink gradient
  - "Рассчитать ставку" (tools CTA) → 3-stop violet→pink gradient
- **Pass (intentional white on dark hero):** 3 CTAs
  - "Начать бесплатно" (hero primary) → solid `rgb(255,255,255)` white
  - "Начать бесплатно" (footer CTA) → solid white
  - "Пробный период 14 дней" → solid white
- **Notes:** "Начать бесплатно" white-on-dark in hero is a deliberate choice (white pops more than #6A5AE0 against gradient backdrop). Decision call needed: does brand spec allow white primary on dark sections OR should everything be `#6A5AE0` solid? Memory has no explicit guidance.

### 3. Typography
- **Status: PASS**
- **Desktop:**
  - H1: 60px / lh 75px / weight 700 / Inter — hero "Универсальный бизнес-хаб для фрилансеров"
  - H2: 36px / lh ~ default / weight 700 / Inter — section titles
  - H3: 16px / lh 24px / weight 600 — card titles
  - body (P): 20px / lh 28px / weight 400 — hero sub-headline (lead text)
  - small body: 16px / lh 24px / weight 400 — card body
- **Mobile:**
  - H1 drops к 36px / lh 45px / weight 700 — appropriate downscale
  - H2 stays 48px on hero stat numbers ("$48,240") — intentional emphasis
  - body 16px / lh 24px — meets readability floor
- **Rhythm:** consistent 16px margin-bottom on H2 across sections; sections 643-1287px tall on desktop, well-paced. No micro-rhythm chaos.
- **Font-family:** `Inter, "Inter Fallback"` everywhere — single family, no font-stack drift.
- **Font weights present:** 400 / 600 / 700 (3 tiers, not 9-way chaos) — good.
- **Color tokens:** H1 white `rgb(255,255,255)`; H3 light slate `lab(96.286 -0.852 -2.468)` ≈ `#F1F5F9` (slate-100). Body text uses `lab(84.4329 3.18977 -23.9688)` ≈ a muted violet-tinted slate — consistent.

### 4. Social proof
- **Status: PASS (honest treatment)**
- **Real testimonials displayed:** none
- **Honest treatment:** yes — no fake testimonials, no fabricated star ratings, no synthetic "trusted by N companies" with placeholder logos. Section omitted entirely rather than faked.
- **Probe verification:** scanned all elements with `class*=testimonial|review|customer|rating|stars|trusted` → 0 matches above 50×100px.
- **Hero stat card ($48,240) :** this is a dashboard mockup showing example revenue, not a claim about customer earnings — acceptable as product visualization.
- **Cross-link:** matches `feedback_marketing_honesty_policy.md` + `backlog_real_testimonials_post_launch.md` — restore testimonials only when 20+ real users exist.

### 5. Mobile responsiveness (390×844)
- **Status: PASS**
- **Horizontal scroll:** `documentElement.scrollWidth = 390 == clientWidth = 390` → NO overflow.
- **Touch targets (primary CTAs):** all primary action buttons ≥44px tap height:
  - Hero "Начать бесплатно" → 342×60 ✓
  - "Посмотреть демо" → 342×64 ✓
  - "Рассчитать ставку" → 195×44 ✓ (exactly at floor)
  - Pro "Начать бесплатно" → 284×48 ✓
  - Business plan CTA → 284×48 ✓
  - Footer "Начать бесплатно" → 256×60 ✓
- **Touch targets (small):** 17/26 anchors <44px tall. All are inline text-links (nav menu items, footer links inside paragraphs at 17-20px line-height). This is conventional inline-link spacing per WCAG 2.5.5 exception (text links inline with body text). Not a violation.
- **Font sizes:** H1 36px, body 16px, button 14px → meets readability floor.
- **Stickiness/Bento on mobile:** sections stack to single-column cleanly, hero mockup card scales down to fit.

## Findings

### Quick-wins (≤5 min fixes each) — could ship pre-launch если Ramiz approves

1. **No truly ≤5-min single-line fixes identified.** All 5 dimensions are PASS or in the "cosmetic drift, on-brand visually" bucket that requires `globals.css` token sweep (matches existing deferred backlog from Phase 1/2). The drift IS the same drift the rest of the app has — landing page is consistent with internal app palette state, just not consistent with the canonical CSS-var single-source-of-truth.

   Recommendation: ship as-is. Drift is the same drift on `/dashboard`, `/settings`, and `/work/time` — fixing landing in isolation would create a *new* inconsistency between landing and the rest of the product.

### Post-launch backlog

1. **[P2] Landing gradient/CTA palette → CSS-var migration.** Bundle into the deferred `gradient hex drift on dashboard widgets` ticket OR escalate to a Phase 3 PR that replaces every `bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500` chain on public marketing pages with `bg-gradient-primary` (and primary solid `#7C3AED` → `var(--brand-primary)` = `#6A5AE0`). Estimated scope: 5 landing-page elements + the dashboard widgets already in the backlog. Single PR opportunity.

2. **[P3] Primary CTA color policy decision (white-on-dark vs `#6A5AE0` solid).** Hero "Начать бесплатно" + footer CTA use white background. If brand spec says primary always `#6A5AE0`, swap. If white-on-dark hero is intentional, document in `memory/project_identity.md` or design tokens. Not blocking launch.

3. **[P3] Body root bg `#0A0A0A` → `#0B0B12`.** Already in your backlog (`bg-neutral-950` in `app/layout.tsx`). Confirmed на landing: `body { background-color: rgb(10, 10, 10) }`. Cross-link к existing P3 ticket — same root cause.

4. **[P2] /pricing-section gradient drift — Pro card "rocket" highlight.** Pro plan card uses `from-violet-600 to-purple-700` 2-stop gradient (`#7C3AED → #6D28D9`). If canonical brand gradient is the 3-stop violet/purple/pink, Pro card should match. If Pro card is intentionally darker/restrained, document. Bundle into post-launch palette sweep.

## Aggregate verdict

5 dimensions: **3 PASS** (Typography, Social proof, Mobile responsiveness) / **0 NOTES** / **2 DRIFT** (Hero gradient, CTA colors) / **0 FAIL**

**Pre-launch recommendation: SHIP AS-IS.**

- No FAIL findings.
- All DRIFT is the same drift that's pervasive throughout the app (Tailwind utility chains using `violet-600` / `purple-500` / `pink-500` instead of canonical brand CSS vars). Landing page is *internally consistent* with the rest of the deployed product.
- Fixing landing palette in isolation would create a new inconsistency between landing and `/dashboard`/`/settings`/`/work/time`. Better to do a single Phase 3 sweep post-launch.
- Typography is solid (3 weights, single font family, generous rhythm).
- Mobile renders cleanly (no horizontal scroll, all primary CTAs ≥44px tap target).
- Honest social proof treatment (no fake testimonials/ratings).

**Top 1 most-actionable improvement (post-launch):** consolidate the landing-page Tailwind violet/purple/pink utility chains into `bg-gradient-primary` + `var(--brand-primary)` solid CTA — bundle with the existing dashboard-widget gradient drift ticket as Phase 3 palette sweep.

**Phase 1/2 attribution check:** none of the drift on landing was caused by Phase 1 (PR #203) or Phase 2 (PR #219). The drift is pre-existing Tailwind utility-class usage that the palette refactor PRs did not touch (those PRs focused on `/dashboard` and `/settings` widget surfaces, not public marketing routes). Phase 1/2 sweep was clean for landing — confirmed.
