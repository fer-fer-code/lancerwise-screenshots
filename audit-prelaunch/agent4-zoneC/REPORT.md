# Zone C visual audit — /settings/* + onboarding + /dashboard + Pro/billing CTAs

**Main HEAD audited:** `e233c946` (prod, 2026-05-29)
**Auth method:** service-role mint (admin.generateLink → verifyOtp → cookie inject — `tests/e2e/auth.setup.ts` pattern). Bypasses Turnstile. User `ramiz_ddd@mail.ru`.
**Viewports:** mobile 414×896 + desktop 1280×1024
**Screenshot mode:** `fullPage: true`
**Routes probed:** 22 routes × 2 viewports = 44 screenshots
**Runtime errors:** 0 console errors / 0 network 4xx-5xx across 44 probes
**Locale:** `ru` (cookie + Accept-Language)

---

## Pro/Upgrade CTA — dedicated verdict

**🔴 P0 launch-blocker confirmed**: NO Pro/Upgrade CTA in the persistent app shell.

| Surface | Pro CTA presence |
|---|---|
| **Sidebar nav** (all routes) | **0 links** to `/upgrade` or `/billing` from sidebar |
| **`/dashboard` main content** | 0 visible upgrade CTAs in main, header, or sidebar (programmatically probed after dismissing welcome modal) |
| **`/dashboard/command-center`** | 0 upgrade CTAs |
| **`/settings` hub** (and tabs that render the hub content) | ✅ 2 visible CTAs: `Перейти на Pro` → `/upgrade` + `Подробности оплаты →` → `/billing` |
| **`/settings/api,availability,digest,export,items-library,late-fees,public-profile,reminders,tags`** | 0 upgrade CTAs (sub-pages don't render the hub Pro banner) |
| **`/upgrade`** | ✅ `Перейти на Pro` button — works |
| **`/billing`** | ✅ `Upgrade to Pro →` button (but label EN — see P0-2) |
| **`/onboarding`** wizard | 0 upgrade CTAs |
| **`/onboarding/checklist`** | 0 upgrade CTAs |

**Checkout target verification** (without clicking — too high-risk for a synthetic probe):
- `UpgradeButton.tsx` uses `NEXT_PUBLIC_PAYMENT_PROVIDER` env to pick `'lemonsqueezy'` vs `'stripe'`. Vercel envs confirm `NEXT_PUBLIC_PAYMENT_PROVIDER` is set in production + LemonSqueezy creds (API key, store ID, webhook secret) all encrypted on production+preview.
- Per `PlansGrid.tsx:10-12`: when LS is active provider, `business` plan is filtered out (Issac approval scope 2026-05-19). Only Free + Pro shown — visible in `/upgrade` desktop screenshot ✅.
- Implication: when user clicks `Перейти на Pro`, request goes to `/api/lemonsqueezy/checkout` (NOT stripe). End-to-end verification needs an actual click + LS sandbox webhook trace — NOT done in this audit (defer to QA / Ramiz on Free→Pro test purchase).

**Telemetry from prior Zone C audit (`audit/agent4-zoneC/REPORT.md`):** Vercel runtime logs last 1500 entries showed **170 hits `/settings` → 1 hit `/upgrade` → 0 checkout/subscribe calls**. The persistent sidebar gap = real conversion loss.

---

## Bug table

URL → element → bug type → severity → known/new

| Route | Element | Bug type | Severity | known/new |
|---|---|---|---|---|
| **Sidebar (global)** | Bottom utility row (Help/Shortcuts/Bell/DarkMode) | NO Pro/Upgrade CTA visible to Free users | **P0** | Known — `backlog_upgrade_path_discoverability` (promoted P1→P0 with telemetry yesterday) |
| `/dashboard` | Sidebar + header + main | NO Pro CTA anywhere | **P0** | Known (same as above) |
| `/dashboard` | Welcome tour modal on EVERY load | UX: modal blocks dashboard on every visit, not just first-load. Persistent dismissal not implemented (or `localStorage` flag missing) | **P1** | NEW |
| `/billing` | H1 `Billing & Subscription`, all section labels | Page-wide EN leak in RU locale (~12 strings) | **P0** | NEW — page IS a real billing UI (not stub as my prior audit assumed); just untranslated |
| `/billing` | "Upgrade to Pro →" button | EN string + arrow glyph (RU should be «Перейти на Pro») | **P0** | NEW |
| `/billing` | Usage bar "Invoices this month 5/5" RED | ✅ functional — quota meter renders, free-tier limit enforced visually. Just needs i18n | (informational) | NEW |
| `/onboarding/checklist` | **Entire page** — H1, subtitle, 7 task labels, progress text | Page-wide EN leak (`Welcome to LancerWise`, `Add your first client`, `Create your first invoice`, `Log time on a project`, `Calculate your ideal rate`, `Check your Health Score`, `Send your first proposal`, `Set up your portfolio page`, `2 of 7 complete`, `29%`, `GETTING STARTED`) | **P0** | NEW — critical user-onboarding surface |
| `/upgrade` | H1 `Upgrade your plan` + subtitle `You're on the Free plan. Upgrade to unlock unlimited clients, AI features, and more.` | EN leak (page chrome not i18n'd, child PlansGrid IS i18n'd — partial) | **P1** | Known — flagged in prior audit |
| `/upgrade` | `Free` and `Pro` plan name labels in price cards | EN leak (RU should be "Бесплатный" / "Pro" — Pro is OK as brand, Free is not) | **P1** | NEW |
| `/upgrade` | Plan prices `$0`/`$15/мес` | Hardcoded `$` regardless of user's `default_currency` | **P2** | Known — `backlog_currency_hardcoded` |
| `/onboarding` (wizard) | Step 1 profile form | NO currency selector — user enters `hourly_rate` with no currency context | **P0** | NEW (re-confirmed from prior audit) |
| `/onboarding` (wizard) | `COUNTRIES` list (33 entries) | Hardcoded EN country names — RU user sees "United States / United Kingdom / Canada..." | **P2** | NEW |
| `/dashboard/command-center` | H1 + all card labels | **Entire page EN**: `Good afternoon, ramiz_ddd`, `Friday, May 29, 2026`, `Business is ON TRACK 🟢`, `REVENUE PULSE`, `Month-to-date vs last month`, `0% MoM`, `Active Projects/Open Proposals/Leads in Pipeline/Monthly Retainer MRR`, `ACTION ITEMS DUE TODAY`, `UPCOMING MEETINGS`, `WELLBEING & BURNOUT RISK`, `Start Tracking`, etc. | **P0** | NEW — high-visibility hub |
| `/settings/hub` (and 4 sub-tabs rendering same content: account/security/notifications/integrations) | "Profile Photo / JPG, PNG or WebP" labels | EN leak | **P1** | NEW |
| `/settings/hub` | "Save Branding" button | EN leak (other save buttons RU: "Сохранить профиль" — inconsistent) | **P1** | NEW |
| `/settings/hub` | `Welcome Message(0/300)` field label | EN leak | **P1** | NEW |
| `/settings/hub` | "Pro/Team feature to hide..." badge | EN leak — also references "Team" plan which doesn't exist in PLANS enum (only free/pro/business) | **P1** | NEW |
| `/settings/hub` | "Try new navigation / 7-section redesign with new URL structure" feature toggle | EN leak — looks like a dev/internal toggle exposed to all users (unintentional?) | **P1** | NEW |
| `/settings/hub` Currency section | **5 different currency selectors rendered simultaneously** with 5 different option lists: 16/7/5/7/6 codes. Labels mixed: 1 "Валюта" (canonical), 3 "Currency" (EN leak), 1 unlabeled | UX inconsistency + i18n leak + accessibility (unlabeled) | **P1** | Known — `backlog_currency_hardcoded` expanded |
| `/settings/api` | H1 `API Keys` + sub-headings `Your API Keys / API Reference / BASE URL / AUTHENTICATION / AVAILABLE ENDPOINTS (1053)` | Page chrome EN leak | **P1** | Known + new (chrome was assumed EN, but in RU mode it's actually visible) |
| `/settings/api` | 1053 endpoint rows | No search/filter (memo `backlog_settings_api_endpoints_ux`) + endpoint descriptions remain EN. | **P2** | Known |
| `/settings/api` | Revoked key shows `Revoked` `read` badges | EN labels | **P2** | NEW |
| `/settings/availability` | "Add time off", "No time off scheduled", "Save Changes" | EN leak | **P1** | NEW |
| `/settings/digest` | "Weekly Digest Settings", "Delivery Settings", "Send To", "Your account email — change it in Profile settings", "Save Preferences" | EN leak (full page) | **P1** | NEW |
| `/settings/items-library` | "Settings", "Add Item" buttons | EN leak | **P1** | NEW |
| `/settings/late-fees` | "Save Settings" | EN leak | **P1** | NEW |
| `/settings/public-profile` | H1 `Public Profile` + `Create a shareable profile page to showcase your services to prospects.` + `Profile Photo URL`, `Profile Slug`, `Save Profile` | Full-page EN leak | **P1** | NEW |
| `/settings/reminders` | `Save Settings`, `No reminders sent yet. Enable auto reminders and they will appear here.` | EN leak | **P1** | NEW |
| `/settings/tags` | `Add Tag`, `No projects` (×4) empty-state | EN leak | **P1** | NEW |
| `/settings/export` | `Business expenses and receipts` | EN leak (1 line spotted) | **P2** | NEW |
| Mobile viewports (all routes) | Running-timer FAB overlay (`60:25:15`) positioned over content (~bottom-center, large pill) | Layout overlap on mobile — covers cards/buttons | **P2** | NEW |
| `/dashboard` (every load) | Welcome onboarding modal renders on EVERY page open | Modal not persistently dismissed (no localStorage cookie remembering "skipped") | **P1** | NEW |

---

## Currency selector chaos — confirmed via runtime probe

Visible on `/settings` (hub), 5 distinct selectors with different option counts side-by-side:

| Section / control | Label | Option count | Options |
|---|---|---|---|
| Business defaults (canonical) | **Валюта** (RU) ✅ | **16** | USD/EUR/GBP/CAD/AUD/CHF/JPY/CNY/INR/BRL/MXN/RUB/TRY/SEK/THB/SGD |
| Some Smart UI #1 | `Currency` (EN ❌) | 7 | USD/EUR/GBP/RUB/THB/AUD/CAD |
| Rate Negotiation | `Currency` (EN ❌) | 5 | USD/EUR/GBP/RUB/**AED** ← not in enum |
| Some Smart UI #2 | `Currency` (EN ❌) | 7 | USD/EUR/GBP/RUB/THB/AUD/CAD |
| Some Smart UI #3 | (no label ❌) | 6 | USD/EUR/GBP/RUB/**AED**/THB ← AED not in enum |

**`[object Object]` runtime bug NOT observed** — my prior static-code prediction was wrong; either fixed between yesterday and today, or my reading of the code was misinterpreted. Runtime is clean here.

**`AED` is the actual outlier** (5 sites) — not GBP/THB as Ramiz initially recalled. GBP and THB ARE in the canonical enum (lines 4 + 16 of `src/lib/currencies.ts`).

Other tools (separate from /settings):
- `/tools/revenue-goals`: 5 codes `USD/EUR/GBP/AED/THB`
- `/tools/cashflow`: 5 codes `USD/EUR/GBP/THB/AED`
- `/contracts/new`: 6 codes `USD/EUR/GBP/RUB/AED/THB` + **NO LABEL** on the select (accessibility)
- `/contracts/generate`: 4 codes `USD/EUR/GBP/RUB` + label `Валюта` ✅ (the route i18n'd in cb2a86d3)

---

## Onboarding flow — checked end-to-end

| Step | URL | Visual state | Issues |
|---|---|---|---|
| `/onboarding` (wizard entry) | `/onboarding` | H1 = `LancerWise / Настройте профиль` (RU ✅) | **No currency selector** (P0 above). COUNTRIES list hardcoded EN (P2) |
| `/onboarding/checklist` (gamified 7-step) | `/onboarding/checklist` | H1 = `LancerWise / Welcome to LancerWise` (EN ❌) | **Entire page EN** (P0 above) |
| `/onboarding/checklist/{step}` flows | Not probed in this run (would need to click into each step) | — | Recommend follow-up by Ramiz: click each of 7 steps to verify destinations exist (avoid `/sign-in` → 404 pattern AGENT 5 found elsewhere) |

No 404 / 5xx on either onboarding entry. Both wizards reachable and render content.

---

## Test-data sightings (informational — AGENT 2 owns cleanup)

- `/settings` profile shows `QA Test User` as full name, `ramiz_ddd@mail.ru` as email — test user data. Visible in screenshot `desktop-settings-hub.png` line item.
- `/dashboard` greeting: `Добрый день, QA` — picks up test profile name.
- `/billing` usage meter: `Invoices this month 5/5` (RED, hit the limit) — populated test invoices.
- `/dashboard/command-center` greeting: `Good afternoon, ramiz_ddd` — uses email prefix.

Not diagnosed — flagged for AGENT 2.

---

## Console errors / network 4xx-5xx

**0 across all 44 probes.** Routes 100% healthy from a runtime perspective. All bugs above are visual / i18n / UX, not functional crashes.

---

## What I could verify NEW with authed mint

This audit produced ~25 NEW bugs that the prior unauthed Zone C audit (`/audit/agent4-zoneC/REPORT.md`) couldn't see:
- All P0 EN leaks (`/dashboard/command-center`, `/onboarding/checklist`, `/billing` full page, settings inline sections)
- Mobile FAB overlap
- Welcome modal persistence bug
- 5-simultaneous-currency-selectors view on `/settings`
- `Try new navigation` toggle exposure
- `/settings/api` Revoked/read badge labels
- Specific test-data sightings

Prior audit's static-code predictions about `[object Object]` were retracted (not observed at runtime). All other prior findings re-confirmed.

---

## Files

- 44 fullPage screenshots in this directory (mobile-*.png, desktop-*.png)
- `probes.json` — full DOM signal capture per route per viewport
- `extras/` — bug spot-check screenshots for /tools/revenue-goals, /tools/cashflow, /contracts/new etc.
- `extras/bug-spotcheck.json` — currency selector deep-probe results
- `extras/desktop-dashboard-noModal.png` — /dashboard captured AFTER dismissing welcome modal

---

## Cross-references

- Prior unauthed Zone C report: `lancerwise-screenshots/audit/agent4-zoneC/REPORT.md` (681ee40)
- Auth mint pattern: `tests/e2e/auth.setup.ts` (line 8-131)
- Memory: `feedback_supabase_captcha_dashboard` (Turnstile bypass via service_role), `feedback_vercel_cli_ai_agent_env` (Vercel logs after `unset AI_AGENT`), `backlog_upgrade_path_discoverability`, `backlog_currency_hardcoded`, `backlog_settings_api_endpoints_ux`
- Service-role mint script (reusable): `/tmp/agent4-service-role-mint.mjs` (storage state at `/tmp/agent4-storage-state.json`, ~2h expiry; re-mint anytime)
