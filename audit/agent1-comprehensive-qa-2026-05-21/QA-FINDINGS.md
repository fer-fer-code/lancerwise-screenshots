# Comprehensive QA Findings — 2026-05-21 / 22

**Author:** [AGENT 1]
**Date:** 2026-05-22 (batch 1 of comprehensive QA sweep)
**Scope:** Visual regression + RU localization + accessibility + design consistency
**Status:** Batch 1 complete (public/auth pages + mobile). Batches 2-4 deferred к later trigger.

---

## Batch 1 — Public/auth pages (this commit)

### Pages inspected

| Page | Locale | Viewport | Screenshot |
|---|---|---|---|
| / homepage | RU desktop | 1366×768 | `EVIDENCE/ru-localization/homepage-ru-desktop-1366.png` |
| / homepage | EN desktop | 1366×768 | `EVIDENCE/visual-regression/homepage-en-desktop-1366.png` |
| /pricing | EN | 1366×768 | `EVIDENCE/visual-regression/pricing-en-desktop.png` |
| /faq | EN | 1366×768 | `EVIDENCE/visual-regression/faq-en-desktop.png` |
| /privacy | EN | 1366×768 | `EVIDENCE/visual-regression/privacy-en-viewport.png` |
| /register с cookie banner | EN | 1366×768 | `EVIDENCE/overlap/register-en-cookie-banner-overlap.png` |
| /register | EN | iPhone 14 Pro 393×852 | `EVIDENCE/mobile-responsive/register-en-iphone14-393.png` |

---

## Findings

### P0 launch-blockers
**None.**

### P1 fix-before-launch
**None.** (All P1 candidates от smoke testing already resolved per CLOSURES + SMOKE-FINAL-SYNTHESIS.)

### P2 fix-soon-post-launch

**P2-1 — Cookie banner overlaps "Already have an account? Sign in" link on /register**

- **Severity:** P2 (does NOT block CTA, but partially obscures secondary link)
- **Evidence:** [register-en-cookie-banner-overlap.png](EVIDENCE/overlap/register-en-cookie-banner-overlap.png)
- **Route:** `/register` desktop 1366×768
- **Locale:** EN (likely also RU)
- **Description:** "Get started free" purple CTA button renders ABOVE cookie banner (good). "Already have an account? Sign in" link below the button is partially covered by cookie banner. Link text still readable, но visual hierarchy suffers.
- **Suspected fix:** Same `lw-app-main` class pattern that PR #117 used для /onboarding can extend к unauth pages. Add bottom padding (~80px mobile, ~96px desktop) к `<main>` element on /register, /login, /forgot-password when cookie banner is open.
- **Existing precedent:** `globals.css` has `body.cookie-consent-open { padding-bottom: 80px / 96px }` для body-level, but `/register` page structure may have its own scroll container blocking that bubble-up.

### P3 polish (post-launch)

**P3-1 — Cloudflare Turnstile widget i18n locale drift (CF iframe behavior)**

- **Severity:** P3 (Cloudflare iframe responsibility, не LancerWise app code)
- **Evidence:** [register-en-cookie-banner-overlap.png](EVIDENCE/overlap/register-en-cookie-banner-overlap.png) — shows "Успешно" (RU "Success") + "Конфиденциальность" + "Справка" links inside CF iframe on EN page
- **Description:** Cloudflare Turnstile widget auto-detects locale inconsistently. На EN page widget shows RU strings ("Успешно" status text, "Конфиденциальность / Справка" privacy/help links). Same drift in reverse — RU page sometimes shows EN "Verifying...".
- **Suspected fix:** Pass explicit `lang` parameter when initialising Turnstile script (`<script data-lang="en">`). Per Cloudflare Turnstile docs.
- **Cross-reference:** Same finding observed in smoke testing visual review (commit `343b788`). Aggregating.

**P3-2 — Privacy Policy "Last updated: May 20, 2026" date stale**

- **Severity:** P3 (acceptable — close to current date)
- **Evidence:** [privacy-en-viewport.png](EVIDENCE/visual-regression/privacy-en-viewport.png)
- **Description:** Privacy Policy header shows "Last updated: May 20, 2026" (matches PR #105 D4 update). Not а regression, just а note that date will need refresh when next legal review happens.
- **Suspected fix:** Bump date when next material policy change ships.

---

## Visual regression — baselines vs current

Compared current production renders vs older baselines (lancerwise-screenshots `exhaustive-audit/batch-*`, `full-audit-2026-05-14`).

### Homepage
- **RU + EN renders are stable.** Layout consistent, hero card "$48,240" hero placeholder unchanged, 9 feature cards intact, 3-step setup ("Get started in minutes" / "Запуск за пару минут"), 3 personas, 3-tier pricing с "Most popular" badge on Pro.
- No regressions detected.

### Pricing page
- **3-tier layout (Free $0 / Pro $15/mo / Business "Coming soon") consistent.** "Most popular" yellow badge на Pro tier. "Save 20%" green badge на Yearly toggle. "Compare all features" link below cards. "30-day money-back guarantee" footnote под Pro.
- Footer trust badges: "SSL Encrypted / GDPR Compliant / Mobile app coming soon"
- No regressions detected.

### FAQ page
- **5 sections (GETTING STARTED / BILLING & PRICING / FEATURES / SECURITY & DATA / ACCOUNT)** с 20 questions total, all accordions collapsed.
- "Still have questions?" CTA с "Email Support" + "Contact Form" buttons.
- No regressions detected.

### Privacy Policy
- "Last updated: May 20, 2026" date.
- 6 data categories enumerated.
- Card-style content с proper hierarchy.
- No regressions detected.

---

## RU localization audit (homepage RU vs EN)

| Aspect | Verdict | Notes |
|---|---|---|
| Hero headline | ✅ Translated | "Универсальный бизнес-хаб для фрилансеров" vs "The All-in-One Business Hub for Freelancers" |
| Hero subhead | ✅ Translated | (both visible in screenshots) |
| Feature pills (4) | ✅ Translated | "Всё в одном / На базе AI / Бесплатно / 5 мин" vs "All-in-one / AI-powered / Free / 5 min" |
| Section: Features grid | ✅ Translated | "Возможности для управления фриланс-бизнесом" vs "Freelance Management Features Built for Independent Professionals" |
| 9 feature cards | ✅ Translated | All section titles в RU |
| Section: Setup steps | ✅ Translated | "Запуск за пару минут" vs "Get started in minutes" |
| 3 setup cards (Шаг 1/2/3) | ✅ Translated | (visible in RU screenshot) |
| Section: Personas | ✅ Translated | "Подходит каждому типу фрилансера" vs "Built for every kind of freelancer" |
| Section: Pricing | ✅ Translated | "Простые и прозрачные тарифы" vs "Simple, transparent pricing" |
| Section: FAQ | ✅ Translated | "Частые вопросы" vs "Frequently asked questions" |
| Bottom CTA | ✅ Translated | "Управляйте фриланс-бизнесом как профи" vs "Run Your Freelance Business Like a Pro" |
| Footer | ✅ Translated | (visible) |

**No EN string leaks detected on homepage RU.** Full localization coverage.

### Caveat (P3)

Page `<title>` tag remains "LancerWise — Free Freelancer CRM, Invoices & AI Contracts" в EN regardless of locale (browser title bar shows EN under RU body). **Pre-existing i18n leak** carried от earlier audits. Not regressed; not introduced by recent work.

---

## Mobile responsive (iPhone 14 Pro 393×852)

### /register mobile
- ✅ Single-column form layout
- ✅ Touch targets adequate (Get started free button ~48px tall)
- ✅ Cookie banner mini variant с "Customize / Accept All / X"
- ✅ No horizontal scroll, no text cut-off
- ⚠️ "Already have an account? Sign in" link visible above mini cookie banner — slight visual proximity на shorter viewports
- ✅ Hero hidden on mobile (form takes full width) — correct responsive behavior

---

## What was NOT covered in this batch (deferred к batch 2-4)

- **Batch 2:** Signed-in flows visual regression (/dashboard, /work/time, /settings + 16 subroutes)
- **Batch 3:** Comprehensive overlap detection (modal backdrops, dropdown overflow, sticky headers, date pickers, toast notifications, mobile bottom nav, tooltips)
- **Batch 4:** Accessibility quick pass (color contrast, alt text, keyboard nav, focus indicators, form labels)
- **Design consistency audit** (typography hierarchy, brand palette compliance, spacing tokens, icon style)

Batch 2-4 require ~2-3h focused work each. Will execute when triggered post-launch OR if pre-launch capacity allows.

---

## Cross-references к other audits

- [`audit/agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md`](../agent3-smoke-execution/SMOKE-RESULTS-AGENT3-2026-05-21.md) — smoke testing browser flows (covered F1-F11 functionally)
- [`audit/agent1-smoke-coordination/SMOKE-COORDINATION-AGENT1-2026-05-21.md`](../agent1-smoke-coordination/SMOKE-COORDINATION-AGENT1-2026-05-21.md) — visual review during smoke (overlapping coverage)
- [`audit/agent1-launch-readiness-master/SMOKE-FINAL-SYNTHESIS-2026-05-21.md`](../agent1-launch-readiness-master/SMOKE-FINAL-SYNTHESIS-2026-05-21.md) — final smoke synthesis (P0/P1/P2/P3 categorization)
- Memory: `feedback_marketing_honesty_policy.md` — applies к pricing/FAQ claims accuracy

---

## Batch 1 summary

- **Pages inspected:** 7 screenshots across 6 routes × 2 locales × 2 viewports
- **P0:** 0
- **P1:** 0 (all resolved pre-batch)
- **P2:** 1 (cookie banner overlap "Sign in" link)
- **P3:** 2 (CF Turnstile locale drift; page title not translated)
- **Visual regressions vs baselines:** None
- **RU localization coverage homepage:** complete
- **Mobile responsive /register:** clean

**Batch 1 verdict:** ✅ no launch-blockers. 1 P2 to file post-launch (cookie banner extending к unauth pages). Continue к batches 2-4 when triggered.
