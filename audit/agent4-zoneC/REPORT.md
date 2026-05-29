# Zone C visual audit — /settings/* + onboarding + Pro/billing CTAs

**Main HEAD audited:** `e233c946` (prod)
**Date:** 2026-05-29
**Method:** static repo analysis + curl probes + Playwright (login chrome only — Turnstile blocks authed shots, same gap as prior 5 audits) + Vercel runtime logs analysis (probe channel from `feedback_vercel_cli_ai_agent_env`)
**Ground truth:** `next.config.ts` CSP + `src/lib/currencies.ts` (canonical 16-currency enum) + `messages/ru.json` i18n + design tokens (`bg-card`, `border-subtle`, `text-text-*`)

---

## Verdict

🔴 **3 P0 blockers** before launch. Top finding: **`/upgrade` not reachable from sidebar — only linked once from inside Settings page** → in prod telemetry (last 1500 log entries): **170 hits `/settings` → 1 hit `/upgrade` → 0 checkout/subscribe calls**. Real lost revenue path.

🟠 **5 P1** (i18n EN leaks, currency selector chaos)
🟡 **4 P2** (palette, schema mismatch, stub routes, dead code)

Detail below.

---

## P0 — launch-critical

### P0-1. NO Pro/Upgrade CTA in app shell (sidebar) — discoverability broken

**File:** `src/components/layout/Sidebar.tsx` (298 lines)
**Evidence (static):** `grep -c "'/upgrade'|/billing'|'/settings/billing'" Sidebar.tsx → 0`. Nav rendered groups: Home/Money/Clients/Work/Contracts/Insights/Tools/Settings/Help. Crown icon imported (line 9) but not used for a nav item.

**Evidence (runtime — last 1500 prod log entries via Vercel CLI):**
```
Zone C requests seen: 176
Top paths:
  170  /settings
    1  /upgrade
    1  /billing
    4  /onboarding*
Checkout/subscribe hits: 0
```

The ONLY in-app link to `/upgrade` is `SettingsRootClient.tsx:497` — buried inside the settings page, visible only when `plan === 'free'`. User has to navigate to Settings → scroll past 8+ sections → find the Upgrade button. Sidebar bottom (line 230-296) shows only Help / Shortcuts / NotificationBell / DarkModeToggle. No Upgrade CTA banner.

**Cross-link:** memory `backlog_upgrade_path_discoverability` already flagged this as a P1 launch blocker — promoting to P0 with telemetry confirming **0 conversion events in 1500-log window**.

**Fix required:** persistent sidebar "Upgrade to Pro" CTA visible to all free-plan users (e.g. styled banner at sidebar bottom above NotificationBell, link to /upgrade).

---

### P0-2. `/settings/billing` and `/billing` are stub redirects, not actual billing UIs

**Files:**
- `src/app/(app)/settings/billing/page.tsx` (5 lines) — `redirect('/upgrade')` only
- `src/app/(app)/billing/page.tsx` — separate route with `BillingPageClient.tsx` (40 slate-palette leaks per grep)

**Implication:** users who Google-search "lancerwise billing" or follow stale links to `/settings/billing` get bounced to `/upgrade` (sales page) without any "manage subscription / cancel / payment method / invoices history" UI. A paid user has nowhere to update card, view past invoices, or downgrade.

**Cross-link:** memory `backlog_settings_notifications_real_impl` already flagged the same stub-redirect pattern for `/settings/notifications` — broader pattern of "decided routes exist but content not built".

**Fix required:** either (a) build real billing management page (preferred for paid users, post-launch), or (b) consolidate to single `/upgrade` route and remove the dead `/billing` route + redirect entries.

---

### P0-3. Onboarding wizard does NOT ask for currency

**File:** `src/app/(app)/onboarding/OnboardingWizard.tsx` (737 lines, 5 steps)
**Evidence:** `grep -nE 'currency|Currency|USD|EUR|GBP' OnboardingWizard.tsx → 0 hits`

**Impact:**
- Step 1 collects `hourly_rate` as a number with no currency context → DB stores `min_hourly_rate` decoupled from `default_currency`
- Step 4 invoice generation uses `default_currency` from profile = 'USD' hardcoded fallback (`SettingsRootClient.tsx:82`)
- A user from Russia / Thailand / EU completes onboarding, gets their first invoice generated in USD, and only later discovers the currency exists somewhere in Settings (where the selector IS canonical — see §P1-4)

**Cross-link:** memory `backlog_currency_hardcoded` (currency $ hardcoded everywhere, needs formatCurrency() helper + user.currency) — onboarding is the gateway making this worse.

**Fix required:** add currency dropdown to Step 1 (after hourly rate field), wire to `profiles.default_currency`, default to currency hint based on `tax_country` if possible (US→USD, UK→GBP, DE→EUR, RU→RUB, TH→THB, etc.).

---

## P1 — pre-launch i18n / palette / currency chaos

### P1-1. `/upgrade` page title hardcoded EN

**File:** `src/app/(app)/upgrade/page.tsx:19-23`
```tsx
<h1 className="text-2xl font-bold text-slate-100">Upgrade your plan</h1>
<p className="text-slate-400 mt-2 text-sm">
  {currentPlan === 'free'
    ? "You're on the Free plan. Upgrade to unlock unlimited clients, AI features, and more."
    : `You're on the ${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.`}
</p>
```
**Impact:** RU users see "Upgrade your plan" and the subtitle in EN. The `PlansGrid` component below uses `useTranslations('upgradePage')` so plan names/CTAs are RU, but the parent page title is not.

**Fix:** wrap in `useTranslations('upgradePage.heading')` namespace (file is server component → use `getTranslations`).

---

### P1-2. `/upgrade` price labels hardcode `$`

**File:** `src/app/(app)/upgrade/PlansGrid.tsx:90-99`
```tsx
function priceLabel(plan: Plan) {
  if (plan.monthly === 0) return { amount: '$0', period: t('forever'), note: '' }
  if (billing === 'monthly') {
    return { amount: `$${plan.monthly}`, period: t('perMonth'), note: '' }
  }
  const perMonth = Math.round(plan.yearly / 12)
  …
  return { amount: `$${perMonth}`, period: t('perMonth'), note: t('billedAnnually', { amount: plan.yearly, savings }) }
}
```
**Impact:** even when user's `profiles.default_currency='EUR'`, the upgrade page always shows `$0/$15/$45`. Plan prices are TRULY USD (LemonSqueezy invoice in USD), but the page doesn't even attempt local-currency hint.

**Fix:** add a small "≈ €13 / mo at today's FX" or just acknowledge billing currency = USD in the heading. Either way, replace hardcoded `$` with `formatCurrency(amount, 'USD')` so symbol matches Intl rendering.

---

### P1-3. `priceLabel` `note` mixes `t('billedAnnually')` with raw `{amount: plan.yearly, savings}`

Same file, line 99. The translation key `billedAnnually` receives raw numeric `amount` (no currency formatter applied) — RU template would render `"Оплата 144 в год"` instead of `"Оплата $144 в год"`. The `$` precedes only the per-month amount, not the per-year amount.

**Fix:** pass `amount: '$' + plan.yearly` or use `formatCurrency()` to render before passing to ICU.

---

### P1-4. Currency selector cardinality **chaos** across UI

Canonical enum: `src/lib/currencies.ts` — 16 codes (USD, EUR, GBP, CAD, AUD, CHF, JPY, CNY, INR, BRL, MXN, RUB, TRY, SEK, THB, SGD).

Audit of every `<select>` currency selector in the app:

| File | Code list shown | Uses canonical enum? |
|---|---|---|
| `settings/SettingsRootClient.tsx:424` (default_currency) | `CURRENCIES.map(c => <option …>{c.code} — {c.name}</option>)` | ✅ all 16 |
| `settings/PublicRates.tsx:147` | `['USD','EUR','GBP','RUB','AED','CAD','AUD']` | ❌ 7 hardcoded — **AED not in canonical enum** |
| `settings/RateNegotiationHelper.tsx:63` | `['USD','EUR','GBP','RUB','AED']` | ❌ 5 hardcoded — **AED not in canonical enum** |
| `settings/PriceIncreaseEmail.tsx:70` | `{CURRENCIES.map(c => <option key={c}>{c}</option>)}` | ❌ **BUG**: renders `[object Object]` — `c` is `{code,symbol,name}` object, not string |
| `tools/revenue-goals/RevenueGoalsClient.tsx:611` | `{CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}` | ❌ **SAME BUG**: renders `[object Object]` for value AND label |
| `tools/scenario-planner/ScenarioPlannerClient.tsx:649` | `['USD','EUR','GBP','AED','THB']` | ❌ 5 hardcoded |
| `tools/onboarding-flows/OnboardingFlowsClient.tsx:529` | (different pattern, not extracted — verify separately) | ❓ |
| `tools/wfh-deductions/WFHDeductionsClient.tsx:513` | (style-only render, options likely from constant) | ❓ |
| `tools/project-risk/ProjectRiskClient.tsx:294` | `['USD','EUR','GBP']` | ❌ 3 hardcoded |
| `tools/email-composer/EmailComposerClient.tsx:642` | `['$','€','£','₽','฿','¥']` | ❌ **6 SYMBOLS not codes** — value is symbol char, not ISO code |
| `tools/cashflow/CashFlowClient.tsx:1067` | `['USD','EUR','GBP','THB','AED']` (+ another `'USD'`-only fallback) | ❌ 5 hardcoded incl. AED |
| `tools/milestone-billing/MilestoneBillingClient.tsx:651` | `['USD','EUR','GBP','RUB','THB']` | ❌ 5 hardcoded |
| `contracts/generate/page.tsx:132` | `<option value="USD">…</option><option value="EUR">…</option><option value="GBP">…</option><option value="RUB">…</option>` | ❌ 4 hardcoded |
| `contracts/new/page.tsx:201` | `['USD','EUR','GBP','RUB','AED','THB']` | ❌ 6 hardcoded incl. AED |

**Summary:**
- **2 BUGGY render sites**: `PriceIncreaseEmail.tsx:70` and `RevenueGoalsClient.tsx:611` will produce literal `[object Object]` text or save objects to DB
- **AED appears in 5 sites** (PublicRates, RateNegotiationHelper, ScenarioPlanner, CashFlow, contracts/new) but is **NOT in the canonical 16-code enum** — saving AED to DB and reading back will fall through `formatCurrency`'s `try/catch` to fallback (lib/currencies.ts:32-44)
- **EmailComposer uses SYMBOLS not CODES** — completely incompatible with the rest of the schema; saved value `'$'` ≠ `'USD'`
- **Only 1 of 14 sites uses the canonical enum correctly** (Settings → default_currency)

**Cross-link:** Ramiz mentioned "smart UI с GBP/THB вне enum" — GBP and THB ARE in the canonical enum (verified `currencies.ts:4,16`). The actual outlier is **AED** (5 sites) which is NOT in the enum.

**Fix path:** replace all 14 selectors with a shared `<CurrencySelect />` component that reads from `CURRENCIES` and respects `profiles.default_currency` as the default. P1 because the BUGGY `[object Object]` renders will look broken to any user touching `/settings/price-increase` or `/tools/revenue-goals`.

---

### P1-5. `plan` enum mismatch — `'team'` exists in DB but not in `PlansGrid` UI

**Files:**
- `src/app/(app)/settings/PortalBrandingSettings.tsx:45` — `const isPro = plan === 'pro' || plan === 'team'`
- `src/app/(app)/upgrade/PlansGrid.tsx:27` — `id: 'free' | 'pro' | 'business'`

`plan` is read from `profiles.plan`. If a user is on `'team'` (legacy or test data), Upgrade page renders subtitle `"You're on the Team plan."` but no `'team'` entry exists in `PLANS` array → upgrade options shown will not include their actual plan as "current" → confusing CTA state.

**Fix:** decide canonical: drop `'team'` (migrate DB rows to closest) OR add `'team'` to `PLANS` enum. Pre-launch decision.

---

## P2 — backlog material (not launch blockers)

### P2-1. Palette slate-leak counts on Zone C files

Grep `bg-slate|border-slate|text-slate|bg-blue-[0-9]|bg-purple-[0-9]|text-indigo`:

| File | Hits |
|---|---|
| `settings/SettingsRootClient.tsx` | **58** |
| `onboarding/OnboardingWizard.tsx` | **57** |
| `billing/BillingPageClient.tsx` | **40** |
| `settings/PriceIncreaseEmail.tsx` | 21 |
| `settings/PublicRates.tsx` | 20 |
| `contracts/new/page.tsx` | 15 |
| `upgrade/PlansGrid.tsx` | 14 |
| `settings/RateNegotiationHelper.tsx` | 13 |
| `contracts/generate/page.tsx` | 0 ✅ (fixed in prior PR `633f6caa`) |
| `upgrade/UpgradeButton.tsx` | 0 ✅ |
| `tools/cashflow/CashFlowClient.tsx` | 0 ✅ |

Total Zone C palette debt: ~250 slate-class occurrences across 8 files. Already aligned with backlog memos `backlog_button_color_inconsistency` and `backlog_label_casing_consistency`.

### P2-2. `/settings/api` rendered 1053 endpoints with no search/filter

Cross-link memory `backlog_settings_api_endpoints_ux`. Confirmed unchanged on this main HEAD.

### P2-3. `/settings/notifications` is a 5-line redirect

Cross-link memory `backlog_settings_notifications_real_impl`. Confirmed unchanged.

### P2-4. Onboarding `COUNTRIES` hardcoded list (33 entries) — not i18n

`OnboardingWizard.tsx:23-29`: EN country names hardcoded. RU user sees "United States / United Kingdom / Canada…" Should be i18n'd or use ISO-3166 codes with translated rendering.

---

## What I could NOT verify (auth gate)

Same Turnstile pattern as prior 5 audits (cb2a86d3 / a1bb3d19 / dashboard / CSP / Tier A). No SENTRY_TOKEN; mcp-chrome-d284463 locked by other agent; isolated Playwright profile blocked by Turnstile widget on /login.

Captured fallback evidence:
- `00-login-RU-chrome.png` — login redirect with violet palette + RU strings → deploy live
- 6× `{route}-final.png` — all 6 Zone C routes correctly 307 → /login (no 404, no 5xx)

What this means in practice for Zone C: I could NOT visually verify:
- Settings tab layout on authed view
- Billing tabs UI (paid users only)
- Onboarding wizard step UI / step transitions
- /upgrade plan grid rendering
- Hover/focus/error states on currency selectors
- Console errors that may only fire when authed (e.g., the buggy `[object Object]` render in PriceIncreaseEmail — I see the BUG in code but can't see the broken DOM)

Recommend Ramiz hits `/settings/price-increase` and `/tools/revenue-goals` in his authed browser to verify the `[object Object]` BUG manifests (high confidence it does based on code).

---

## Runtime probes (Vercel logs, last 1500 entries via CLI)

```
/settings           170 hits, all 200 OK
/onboarding/checklist 2 hits
/onboarding           2 hits
/billing              1 hit (which 307s to /upgrade)
/upgrade              1 hit ← THE PROBLEM
Checkout/subscribe    0 hits
```

5xx errors across Zone C in window: **0**.
401/4xx flagged in console during probe: Cloudflare Turnstile challenge POST (not real error, expected client-side gate).

---

## Cross-references to existing backlog memos

- [Upgrade path discoverability](backlog_upgrade_path_discoverability.md) — **promoted from P1 to P0 with telemetry**
- [Currency hardcoded P0](backlog_currency_hardcoded.md) — **expanded with 14 selector inventory**
- [Settings notifications stub](backlog_settings_notifications_real_impl.md) — **same pattern affects /settings/billing**
- [Button color inconsistency](backlog_button_color_inconsistency.md) — Zone C contributes 250 occurrences
- [Settings API endpoints UX](backlog_settings_api_endpoints_ux.md) — unchanged
- [Payment provider decision](backlog_payment_provider_decision.md) — LemonSqueezy creds verified set on Vercel (production+preview encrypted)

---

## Apply / not-apply per spec

**NOT applied.** Report only per Ramiz: "НЕ чини — отчёт зоны C с классификацией + скриншоты."

Recommended apply order if Ramiz approves:
1. P0-1 first (sidebar Pro CTA) — single component change, biggest revenue impact
2. P1-4 currency selectors — shared `<CurrencySelect />` component touching 14 files; tag P0 the 2 buggy renders (`PriceIncreaseEmail.tsx:70`, `RevenueGoalsClient.tsx:611`)
3. P0-3 onboarding currency step — Step 1 wizard amendment
4. P1-1/P1-2/P1-3 `/upgrade` i18n + currency labeling

P0-2 (real billing UI) and P2 items defer post-launch.
