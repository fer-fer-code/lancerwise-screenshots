# P1-1 — i18n gap on authed routes [QA-001]

## Severity
**P1 broken UX** — RU launch quality risk

## Summary
Russian locale users see English text on most authed surfaces (KPI labels, table headers, status badges, CTAs, form fields) despite the sidebar nav being correctly translated. The `messages/ru.json` catalog has identical line count to `messages/en.json` (1826 lines each) — keys exist, but **components are not using `t()` calls** and instead hardcode English strings.

## Steps to reproduce
1. Sign in as any user
2. Open browser DevTools, set cookie `NEXT_LOCALE=ru` (or navigate to `/clients?locale=ru` if a switcher exists)
3. Hard refresh → `https://www.lancerwise.com/clients`
4. Observe sidebar (Главная, Финансы, Клиенты, etc.) is translated
5. Observe main content area is English: "TOTAL CLIENTS", "ACTIVE", "REVENUE YTD", "WITH OVERDUE", "+ New Client", "Pipeline", "More", filter chips "All Tiers / Gold / Silver / Bronze / New", table headers "CLIENT / TIER / CONTACT / STATUS / TAGS / HEALTH / REVENUE / ADDED / LAST ACTIVE", action "View →"

Repeat on `/invoices`, `/projects`, `/proposals`, `/work/time`, `/contracts`, `/upgrade` — same pattern.

## Expected behavior
All user-visible strings should resolve via `t('key.path')` and translate based on `NEXT_LOCALE` cookie.

## Actual behavior
Strings are hardcoded JSX literals. RU users see English.

## Screenshot reference
- `EVIDENCE/page-screenshots/clients_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/invoices_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/projects_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/proposals_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/work_time_chromium_ru_desktop_above-fold.png`
- `EVIDENCE/page-screenshots/contracts_chromium_ru_desktop_above-fold.png`

Compare to fully-translated surfaces:
- `EVIDENCE/page-screenshots/{root,pricing,about,blog,faq}_chromium_ru_desktop_above-fold.png` — public marketing pages are 100% translated
- `EVIDENCE/page-screenshots/{login,register,forgot-password}_chromium_ru_desktop_above-fold.png` — auth pages 100% translated
- `EVIDENCE/page-screenshots/settings_chromium_ru_desktop_above-fold.png` — /settings root 95% translated

## Suspect file locations
- KPI card components (any `dashboard/widgets/*KpiCard.tsx` or shared `KPICard.tsx`)
- Table column header components in `clients/`, `invoices/`, `projects/`, `proposals/`
- Filter chip components used by `/clients` (tier filter) + `/invoices` (status filter)
- CTAs that say "+ New Client", "+ New Invoice", "+ New Project", "+ New Contract"

A working pattern reference: `/settings/page.tsx` IS translated; mirror its `t()` usage.

## Quick fix hypothesis

The i18n keys may already exist in `messages/{en,ru}.json` (verified: 1826 lines each, `pipelineValue` key exists in both with translations). Most fixes are:

```diff
- <h3>TOTAL CLIENTS</h3>
+ <h3>{t('clients.kpi.totalClients')}</h3>
```

Where missing, add keys to both `en.json` AND `ru.json` simultaneously.

**Audit approach:**
1. `grep -rn '>\s*TOTAL\|>\s*ACTIVE\|>\s*REVENUE\|>\s*PAID\|>\s*PENDING\|>\s*OVERDUE\|>\s*UNBILLED' src/app/`
2. For each hit, decide: extract to existing key OR add new key
3. Verify with `node /tmp/qa_capture.js --engine chromium --locale ru --routes /clients,/invoices,/projects,/proposals --authed true`

## Verification after fix
Re-run probe and confirm RU screenshots show Russian text in main content areas, not just sidebar.

## Estimate
~4-8h (largest scope of P1s). Each route file needs a sweep. Consider parallel agents across `clients/`, `invoices/`, `projects/`, `proposals/`, `work/time/`, `contracts/`, `upgrade/`.

## Cross-references
- See P1-6 (i18n coverage matrix) for per-route coverage percentages
- Pre-existing memory `feedback_marketing_honesty_policy` (general string discipline)
