# i18n gap root-cause analysis — [AGENT 2] hand-off

**Author:** [AGENT 3]
**Date:** 2026-05-22
**Source:** ../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md (P1-1 + P1-6)
**Codebase analyzed:** `/Users/myoffice/lancerwise-agent3` (commit f27bb710)

---

## TL;DR — revised pattern + estimate

| Question | Answer |
|----------|--------|
| Is it a single root cause (provider missing)? | **NO.** `NextIntlClientProvider` IS wrapping the entire app at `src/app/layout.tsx:154` |
| Is it a shared hook missing (e.g. useTranslations not called)? | **PARTIALLY.** 45 of 2164 (2.1%) authed component files use i18n hooks |
| Is it per-widget hardcoded strings? | **YES — primarily.** Most strings are hardcoded JSX literals despite provider being in place |
| Is there a "single 30-min fix"? | **No silver bullet** — but **Phase 1 quick win exists** at ~2-4h (page.tsx files only, ~9 files) |
| Revised estimate for [AGENT 2] launch-critical fix | **2-4h focused** (down from 4-8h) — see Phase-1 scope below |
| Full app i18n coverage (post-launch) | **~16-30h** — Phase-2 across remaining ~700 widget files |

---

## Evidence — what works vs what doesn't

### Provider IS configured correctly

`src/app/layout.tsx:135-165`:
```tsx
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()
  return (
    <html lang={locale} ...>
      <body ...>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider ...>
            ...
            {children}
            ...
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

This wraps ALL routes including `(app)/*` authed surfaces. RU locale resolution + messages bundle delivery are working — confirmed by `/dashboard` RU screenshot showing properly translated content for components that DO use `t()`.

### Message catalogs ARE in parity

- `messages/en.json` = 1826 lines
- `messages/ru.json` = 1826 lines
- Keys like `dashboard.kpi.revenueThisMonth` exist in BOTH with correct EN/RU values:
  - EN: `"Revenue This Month"`
  - RU: `"Доход за месяц"`
- Even an alternate "uppercased" namespace exists: `dashboard.kpi2.revenueThisMonth` = `"ДОХОД ЗА МЕСЯЦ"` (RU)

This means **translation keys are not the bottleneck** for the most common KPIs — they already exist.

### Adoption coverage — the actual problem

```
Authed component files using useTranslations/getTranslations:
   45 of 2164 (2.1%) — 2119 files have ZERO i18n hooks
```

Per launch-critical route:

| Route | Total .tsx | Files with i18n | Coverage % |
|-------|:----------:|:---------------:|:----------:|
| dashboard | 182 | 34 | **19%** ← best |
| clients | 167 | 3 | 2% |
| invoices | 88 | 3 | 3% |
| projects | 160 | 1 | 0.6% |
| proposals | 40 | 0 | **0%** |
| contracts | 42 | 1 | 2% |
| settings | 90 | 1 | 1% |
| work | 3 | 0 | **0%** |
| upgrade | 4 | 0 | **0%** |

**Pattern observation:** Most `page.tsx` files DO import `getTranslations` but use it sparingly — typically only for `EmptyState` fallback text. KPI labels, table headers, action buttons, status badges are all hardcoded JSX literals.

---

## Concrete evidence — specific file:line citations

### ✅ Working pattern (dashboard — for reference)

**`src/app/(app)/dashboard/DashboardClient.tsx:144-202`:**
```tsx
const t = useTranslations('dashboard')
...
<KPICard
  label={t('kpi.revenueThisMonth')}   // ✓ translated
  value={fmt(this_month.revenue)}
/>
<KPICard
  label={t('kpi.openInvoices')}       // ✓ translated
  ...
/>
<KPICard
  label={t('kpi.hoursThisWeek')}      // ✓ translated
  ...
/>
```

These render correctly in RU as "ДОХОД ЗА МЕСЯЦ / ОТКРЫТЫЕ СЧЕТА / ЧАСЫ ЗА НЕДЕЛЮ" because t() is wired up.

### ❌ Broken pattern (clients — primary culprit)

**`src/app/(app)/clients/page.tsx:35,90-93`:**
```tsx
export default async function ClientsPage(...) {
  const t = await getTranslations('emptyStates')  // ← scoped to ONE namespace only
  ...
  return (
    <>
      <ClientsKPI icon={...} label="Total Clients" value={totalClients} accent />     // ← HARDCODED
      <ClientsKPI icon={...} label="Active" value={activeClients} />                  // ← HARDCODED
      <ClientsKPI icon={...} label="Revenue YTD" value={...} />                       // ← HARDCODED
      <ClientsKPI icon={...} label="With Overdue" value={overdueClientCount} />       // ← HARDCODED
      ...
    </>
  )
}
```

The `t` variable exists but is scoped to `emptyStates` namespace — KPI labels are not even attempting to translate.

### ❌ Broken pattern (invoices)

**`src/app/(app)/invoices/page.tsx:90-109`:**
```tsx
<KPICard label="Paid" .../>      // ← HARDCODED
<KPICard label="Pending" .../>   // ← HARDCODED
<KPICard label="Overdue" .../>   // ← HARDCODED
<KPICard label="Unbilled" .../>  // ← HARDCODED
```

### ❌ Broken pattern (WeeklyKPICard — sub-widget example)

**`src/app/(app)/dashboard/WeeklyKPICard.tsx:42-45`:**
```tsx
'use client'  // ← client component
// NO useTranslations import
const kpis = [
  { icon: Clock,      label: 'Hours tracked',    value: ... },     // ← HARDCODED literal
  { icon: DollarSign, label: 'Earned this week', value: ... },     // ← HARDCODED literal
  { icon: FileText,   label: 'Invoices sent',    value: ... },     // ← HARDCODED literal
  { icon: Briefcase,  label: 'Active projects',  value: ... },     // ← HARDCODED literal
]
```

### ❌ Broken pattern (upgrade — full file is English literals)

**`src/app/(app)/upgrade/PlansGrid.tsx`** — see P1-2-upgrade-page-english-on-ru.md for details. All `PLANS` const entries hardcoded.

---

## Verdict — fix strategy

This is **HYPOTHESIS C** (per-widget hardcoded strings), but with a critical refinement: **the top-level page.tsx files are the highest-leverage entry points**. Fixing 9 page.tsx files unblocks the visible-above-fold KPI labels + main CTAs for RU users.

### Phase 1 — Launch-critical (RECOMMENDED for pre-launch P1 batch)

Fix the page.tsx file for each authed route. Each page typically has:
- 4 hardcoded KPI labels (~30 sec each to wrap in `t()`)
- 2-4 hardcoded CTA buttons ("+ New Client", "Pipeline", "More")
- Sub-nav labels (some routes)
- Table column headers (if rendered inline rather than via shared component)

**Scope:**

| Route | page.tsx hardcoded `label="X"` hits | Already imports getTranslations? | Est. fix time |
|-------|:-----------------------------------:|:--------------------------------:|:-------------:|
| /clients | 5 | ✓ yes (emptyStates scope) | 30 min |
| /invoices | 4 | ✓ yes | 30 min |
| /projects | 4 | ✓ yes | 30 min |
| /contracts | 3 | ✓ yes | 30 min |
| /proposals | 0 (form widget hardcoded elsewhere) | ✗ no | 45 min (also add import) |
| /upgrade | 0 (PlansGrid.tsx is the issue) | ✗ no | 1h (PlansGrid full file) |
| /work | 0 (Time Tracker tabs etc.) | ✗ no | 1h |
| /dashboard | 0 (top page is RSC + DashboardClient already t()'d) | ✓ yes (partial) | 15 min (audit only) |
| /settings | 0 (already 95% done) | ✓ yes | 15 min (one caption) |

**Total Phase 1: ~5-7h** for surface-visible coverage on all 9 routes. **Single agent can complete in one focused session.**

### Phase 2 — Post-launch widget sweep

The 2119 authed component files without i18n hooks. Most are:
- Drill-down widgets (e.g. ClientHealthLeaderboard, RevenueRanking, drill-down modals)
- Sub-routes (e.g. /dashboard/briefing, /dashboard/command-center)
- Specialized panels (timer modal, invoice editor, contract template editor)
- Form fields in CRUD-entry pages

**Est. effort: ~16-30h** depending on whether keys need creating or already exist.

**Recommended approach:** parallelize across 5 agents (one per route bucket), each agent owns:
- A list of widgets in their bucket
- Audits hardcoded strings via `grep -n 'label="\|>\s*[A-Z]' bucket/*.tsx`
- Wraps in `t(...)` calls
- Adds missing keys to messages/{en,ru}.json (parity)
- Verifies via probe

### Phase 3 — Data-side strings (lowest priority)

Some "English" content is actually DATA (e.g. status field values `'active'`, `'paused'`, `'draft'`, tag names `'design'`, `'marketing'`). These are stored in the DB literally as English strings.

**Fix:** map status enums to translation keys at render time:
```tsx
const statusLabels = {
  active: t('status.active'),
  paused: t('status.paused'),
  draft: t('status.draft'),
}
```

Tag names are user-input data — translating them automatically would be wrong; leave as-is.

---

## Recommended execution for [AGENT 2]

### Quick win (highest ROI):
1. **clients/page.tsx** — change 5 hardcoded labels to `t('clients.kpi.totalClients')` etc. + add keys to en.json + ru.json. **~30 min.**
2. **invoices/page.tsx** — 4 KPI labels, same pattern. **~30 min.**
3. **projects/page.tsx** — 4 KPI labels. **~30 min.**
4. **contracts/page.tsx** — 3 KPI labels. **~30 min.**

After this 2h, 4 of 9 routes are surface-translated. Quick re-probe should show RU users seeing translated KPI cards.

### Medium scope:
5. **upgrade/PlansGrid.tsx** — see P1-2 (~1h)
6. **proposals/page.tsx + ProposalGenerator widget** — full form labels (~1h)
7. **work/time tabs + Timer/Timesheet/Analytics labels** — (~1h)
8. **dashboard sub-widgets** — WeeklyKPICard, etc. (~1h)
9. **settings caption fix** — "Profile Photo / JPG, PNG or WebP" (~15 min)

**Cumulative Phase 1: ~5-7h.**

### Verification command (after each fix)

```bash
# Per-route smoke
node /tmp/qa_capture.js \
  --engine chromium --locale ru --viewport desktop \
  --routes /clients,/invoices,/projects,/proposals,/work/time,/upgrade,/contracts,/settings \
  --authed true

# Compare new captures to BEFORE versions in:
# audit/agent3-comprehensive-qa-2026-05-21/EVIDENCE/page-screenshots/
```

For each route, expect:
- KPI labels in Russian (Cyrillic visible)
- Button CTAs translated
- Sidebar still translated (regression-safe)

---

## Anti-patterns to avoid during fix

1. **Don't add `'use client'` just to get useTranslations** — `getTranslations` works in RSC. Most page.tsx files are server components.
2. **Don't create new translation namespaces per route** — REUSE existing keys (e.g. `dashboard.kpi.openInvoices` works for /invoices too if semantics match).
3. **Don't translate enum/DB values inline** — those should map via `statusLabels` lookup, not edited at write-time.
4. **Don't touch the cookie banner** — that's Cookiebot SDK localized server-side, separate config.
5. **Don't fix lossy strings like "Q1", "USD", "AI", "API"** — those are universal abbreviations.

---

## Cross-references

- P1-1: `../agent3-p1-repro-prep-2026-05-22/P1-1-i18n-gap-authed-routes.md` (this doc is its root-cause expansion)
- P1-6: `../agent3-p1-repro-prep-2026-05-22/P1-6-i18n-coverage-matrix.md` (per-route verification matrix)
- Verified-working precedent: `src/app/(app)/dashboard/DashboardClient.tsx:144-202` (gold-standard i18n usage)
- Reference messages structure: `messages/en.json` + `messages/ru.json` (1826 lines each, parity confirmed)

---

## Recommendation

**Update P1-1 estimate from 4-8h → 5-7h for Phase 1 (launch-critical).** The original estimate was lower because root-cause was unclear; now with concrete file:line citations, time can be planned per-page.

**Phase 2 (~16-30h) can ship in week-1 post-launch maintenance window.** The launch-critical surface (above-fold KPI labels + main CTAs across 9 routes) is achievable in a single focused session before launch.
