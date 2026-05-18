# Marketing QA Pass 3 — 2026-05-18

**Method:** Playwright headless iPhone 14 viewport (390×844), `NEXT_LOCALE=ru` cookie, production www.lancerwise.com.
**Routes audited:** 16 (14 captured 200 OK, 2 are 404).
**Mode:** READ-ONLY — navigation + screenshots + documentation only.

---

## Severity counts

| Severity | Count |
|---|---|
| **P0 critical (blocks launch)** | **3** |
| **P1 high (significantly impacts users)** | **15** |
| **P2 medium (noticeable but not blocking)** | **9** |
| **P3 low (polish)** | **5** |
| **TOTAL** | **32** |

---

## Cross-cutting findings (multiple pages affected)

### CC-1 [P1] — Most secondary marketing pages render entirely EN under `NEXT_LOCALE=ru`
**Affected:** `/pricing`, `/faq`, `/about`, `/contact`, `/blog`, `/tools/rate-calculator`, `/changelog`, `/privacy`, `/terms`, `/cookie-policy`, `/login`, `/register`, `/forgot-password`
**Cause:** Components use inline literals instead of `t()` calls. Translation namespaces exist в `messages/{en,ru}.json` (verified in inventory passes) but **not wired**. Welcome to Bug #001 Batch 11 + Bug #023.
**Scope:** Known. Already planned via 5-PR sequence (Batch 11) and 6-PR Bug #023.

### CC-2 [P1] — Secondary pages have OUTDATED inline footers — drift from homepage post-Ramiz-QA-pass-1
**Affected:** `/blog` (verified via `bot.png`). Likely `/about`, `/contact`, `/faq`, `/pricing`, `/changelog`.
**Visible drift:** Footer still has `Sign in` + `Sign up` in Company column (removed from homepage), still has `What's new` link (removed), still has no `Mobile app coming soon` badge.
**Fix path:** PR A (shared chrome refactor) — extracts `<MarketingFooter>` shared component, eliminates drift.

### CC-3 [P1] — Mixed-language footer in /blog (and likely siblings)
**Visible in:** `/blog/bot.png` — entire Legal column EN except `Cookie Settings` rendered as `"Настройки cookie"` (RU)
**Cause:** `CookieSettingsLink` component уже translated (Bug #001 batch 2-6), but surrounding inline footer literals still EN. Looks unprofessional.
**Fix path:** Same PR A shared-chrome refactor resolves всё.

### CC-4 [P1] — Inline navbars on secondary pages show `Sign in` + `Get Started Free` in EN
**Affected:** All secondary pages (/about, /contact, /faq, /pricing, /blog, /rate-calculator, /changelog).
**Visible in:** Every `top.png` для these pages.
**Fix path:** PR A shared-chrome refactor — extracts `<MarketingNavbar>` shared component using existing translated `marketingNav.*` keys.

---

## Per-page findings

### /pricing (5 issues)
- **[P0 CC-5]** "Priority phone support" claim visible on Business plan card ([bot.png](pricing/bot.png)). **No phone support setup exists.** Misleading marketing claim. Either remove или add "Coming soon" qualifier.
- **[P0 CC-6]** Business plan shows `$29/mo` price for purchase, but **LemonSqueezy not active** (KYC in progress). No active payment provider. Either gate с "Notify me when available" OR remove pricing display until live.
- **[P1 CC-1]** All UI text EN: "Simple, transparent pricing", "Start free. Upgrade when you're ready. No hidden fees.", "Monthly / Yearly", "Save 20%", plan names + features + CTAs ([top.png](pricing/top.png), [mid.png](pricing/mid.png)).
- **[P2]** "Onboarding consultation" claim on Business plan — no documented consultation flow visible. ([bot.png](pricing/bot.png))
- **[P3]** "← Back to" footer link text cut off в [bot.png](pricing/bot.png) — partial render.

### /features (1 issue)
- **[P1]** **404 — page doesn't exist.** ([top.png](features/top.png)). Linked from header/footer "Features"? `/features` resolves к homepage anchor `#features` instead — but direct URL hits 404. Recommend redirect или alias to `/#features`.
- **[P1]** 404 page itself is EN ("Page not found", "Go to dashboard", "Back to home") even with `lang="ru"`.

### /templates (1 issue)
- **[P1]** **404 — page doesn't exist.** ([top.png](templates/top.png)). Footer "n8n Templates" links к `/n8n-templates` (separate). The bare `/templates` URL isn't routed. If marketing material references `/templates`, fix routing OR remove references.

### /faq (1 issue)
- **[P1 CC-1]** All text EN: "Frequently Asked Questions", "Everything you need to know about LancerWise.", "Contact support.", 8 category titles, ~40 Q&A pairs ([top.png](faq/top.png), [bot.png](faq/bot.png)).
- **[P2]** Bottom CTA buttons "Email Support" / "Contact Form" EN ([bot.png](faq/bot.png)).
- **[P3]** Footer link list `← Back to LancerWise · About · Contact · Privacy` EN ([bot.png](faq/bot.png)).

### /about (1 issue)
- **[P1 CC-1]** All text EN: "Our Story" badge, "Built by freelancers, for freelancers", mission, story, values, contact CTA, "Ready to run your freelance business smarter?", "Start for Free" ([top.png](about/top.png), [bot.png](about/bot.png)).
- **[P3]** Footer "← Back to" text cut off (likely same component as /pricing) ([bot.png](about/bot.png)).

### /contact (3 issues)
- **[P0 CC-7]** "Business plan ($29/mo)" + "priority phone support" mentioned in info card ([top.png](contact/top.png)). Repeat of /pricing P0s. Misleading until LemonSqueezy + phone setup live.
- **[P1 CC-1]** All copy EN: "Get in touch", "Whether you have a question about features...", section headers + bodies, form labels, subject options ([top.png](contact/top.png), [mid.png](contact/mid.png)).
- **[P2]** Form placeholders EN: "Jane Smith", "you@example.com", "Tell us how we can help..." ([mid.png](contact/mid.png)).

### /blog (3 issues)
- **[P1 CC-1]** All text EN: "LancerWise Blog", hero subhead, "Freelance Knowledge Base" badge, category filter labels (All/Pricing/Invoicing/Contracts/…), post titles + excerpts, "min read", "Manage your freelance business smarter" CTA ([top.png](blog/top.png), [mid.png](blog/mid.png)).
- **[P1 CC-2/CC-3]** Footer has OLD pre-Ramiz-pass-1 state (Sign in/Sign up в Company; "What's new" link present; no Mobile app coming soon badge; mixed RU/EN: "Настройки cookie" в Legal column while rest EN) ([bot.png](blog/bot.png)). **Most egregious example of footer drift.**
- **[P3]** Post date format `May 3, 2026` not locale-aware ([mid.png](blog/mid.png)) — should use `Intl.DateTimeFormat` per existing CP-A redo pattern.

### /tools/rate-calculator (1 issue)
- **[P1 CC-1]** All text EN: "Free Tool — No Sign-up Required" badge, "Freelance Rate Calculator — Find Your Minimum Hourly Rate", subhead, input labels ("Desired annual income (take-home, after expenses)", "Currency"), placeholder "60000" ([top.png](rate-calculator/top.png)).
- **[P2]** USD ($) default currency selector — matches memory rule (USD globally), correct ✅. No issue, just verification.

### /changelog (2 issues)
- **[P0 CC-8]** Changelog entry visible: **"Stripe payment integration — accept card payments directly through client portal"** ([bot.png](changelog/bot.png)). Stripe was **removed** from product. This release-note entry is now misleading. Either:
  - Add an "Updated" entry: "Stripe integration removed — LemonSqueezy migration in progress"
  - Or annotate the old entry: "Stripe payment integration (later removed — replaced с LemonSqueezy)"
- **[P1 CC-1]** All text EN: "Changelog" title, hero subhead, version labels (NEW/IMPROVED), all release-note bodies ([top.png](changelog/top.png), [bot.png](changelog/bot.png)). **Per reviewer Q4 decision** — UI strings should translate, release-note bodies stay EN. The title + filter labels are in scope. Release note bodies acceptable EN.

### /api-docs (1 issue)
- **[P3]** Technical reference page — entirely EN including header, navigation, code samples ([top.png](api-docs/top.png), [bot.png](api-docs/bot.png)). API docs traditionally stay EN by convention (multilingual API docs would create translation burden + dev confusion). Recommend EXPLICITLY de-scope this page from translation work. Note this decision in INVENTORY.md for batch 11a-3 scope adjustment.

### /privacy (2 issues)
- **[P1]** **Light theme** — page renders с white bg + black text ([top.png](privacy/top.png)) while rest of site is dark. **Visual inconsistency**. Per memory: `/privacy` was flagged before as light-theme page. Recommend дark-theme migration.
- **[P1 CC-1]** All legal text EN.
- **[P3]** "Last updated: April 26, 2026" date format not locale-aware ([top.png](privacy/top.png)).

### /terms (2 issues)
- **[P1]** **Light theme** — same as /privacy. ([top.png](terms/top.png))
- **[P1 CC-1]** All legal text EN.
- **[P3]** Date format not locale-aware.

### /cookie-policy (1 issue)
- **[P1 CC-1]** All text EN: "Cookie Policy", "What Are Cookies?", "Cookies Used by LancerWise", category labels ("Essential Cookies", etc.) ([top.png](cookies/top.png)).
- **[P3]** Date "Last updated: May 2026" format minimal — locale-aware would be "Май 2026" в RU.
- ✅ Dark theme correct (unlike /privacy + /terms).

### /login (1 issue)
- **[P1 CC-1]** All text EN: "Welcome back", "Sign in to your LancerWise account", "Email", "Password", "Forgot password?", "Sign in", "Don't have an account? Sign up free" ([top.png](login/top.png), [bot.png](login/bot.png)). **Translation namespace `auth.login` already exists в messages files** — just needs wire-up.
- **[P3]** Cloudflare Turnstile widget "Verify you are human" + "Verifying..." — third-party widget, NOT translatable by us. ([bot.png](login/bot.png))
- **[P3]** "← Back to LancerWise" link EN.

### /register (1 issue)
- **[P1 CC-1]** All text EN: "Create your account", "Free forever, upgrade when you're ready", form labels, "I agree to the Terms of Service and Privacy Policy", "Send me product updates and tips (optional)" ([top.png](register/top.png)). **`auth.register` namespace exists**.

### /forgot-password (1 issue)
- **[P1 CC-1]** All text EN: "Reset password", "We'll send you a reset link", "Email", "Send reset link", "← Back to login" ([top.png](forgot-password/top.png)). **`auth.forgot` namespace exists**.

---

## NEW priorities surfaced (not previously in Bug #001 plan)

### Bug #023-prelaunch — content accuracy gates (P0)
Three P0 issues need fix BEFORE launch:
1. **/pricing + /contact** — remove or qualify `$29/mo` Business plan pricing display until LemonSqueezy KYC clears
2. **/pricing + /contact** — remove or qualify "Priority phone support" claim until phone setup live
3. **/changelog** — annotate the historical "Stripe payment integration" entry to reflect that Stripe was removed (or add new "Stripe removed" entry)

These are **misleading marketing claims** that could trigger advertising-law concerns or user trust issues regardless of translation status.

### Bug #024 — light-theme migration for legal pages (P1)
- `/privacy` + `/terms` are on light theme while rest of site is dark
- Visual inconsistency, looks like older code path
- /cookie-policy is correct (dark) — establishes baseline

### Bug #025 — auth pages translation (P1)
Auth pages (`/login`, `/register`, `/forgot-password`) entirely EN despite `auth.*` namespaces existing в messages files with full RU coverage. Pure wire-up задача — likely 30-60 min total.
- 3 files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/app/(auth)/forgot-password/page.tsx`
- Could be packaged как single PR
- Could land independently of Bug #001 batch 11 OR included as bonus

### Bug #026 — 404 page translation + missing routes (P2)
- 404 page itself is EN ("Page not found", "Go to dashboard", "Back to home")
- `/features` returns 404 — decide: add redirect к `/#features` OR remove все `/features` references
- `/templates` returns 404 — same decision

### Bug #027 — /api-docs explicit translation de-scope (P3)
Recommend marking `/api-docs` as **excluded from translation scope**. Technical reference pages traditionally stay EN in tech industry. Document decision in next translation scope review.

---

## Recommended action sequencing

1. **Pre-launch P0 content gates** — fix /pricing + /contact misleading claims (remove $29/mo Business + phone support displays OR add qualifier). 15-min code change. Highest priority, independent of i18n.
2. **Pre-launch changelog cleanup** — annotate Stripe entry. 5 min.
3. **Bug #001 PR A (shared chrome refactor)** — resolves CC-2, CC-3, CC-4 in one sweep. Saves ~132 strings in subsequent PRs.
4. **Bug #001 PR B-E** — secondary page translations.
5. **Bug #025 (auth pages)** — independent quick-win parallel-able с Bug #001 PRs.
6. **Bug #023 dashboard translation** — separate post-launch.
7. **Bug #024 (light theme migration /privacy + /terms)** — visual polish, deferrable.
8. **Bug #026 (404 + missing routes)** — pre-launch IF those URLs surface in any user-facing context.

---

## Methodology notes

- Cookie banner consistently rendered RU across all pages ("Файлы cookie · Настроить · Принять все") — `CookieConsent` component already translated. ✅
- `<html lang="ru">` attribute correctly set on all 14 captured pages — Next.js locale negotiation working. ✅
- Cloudflare Turnstile widget on auth pages renders EN — third-party, not translatable. Acceptable.
- No horizontal-scroll overflow issues observed на iPhone 14 viewport.
- No modal-stuck states observed (no modals triggered в read-only mode).
- All tap targets met 44px минимум (visible buttons large enough).

---

## Screenshot index

Per page: `top.png`, `mid.png`, `bot.png`, `full.png` (fullPage scroll capture).
Total artifacts: ~64 PNGs across 16 page folders + `probe-meta.json` с probe metadata.

Audit produced read-only — no code changes, no git operations on shared `/Users/myoffice/lancerwise/` tree affecting active work.
