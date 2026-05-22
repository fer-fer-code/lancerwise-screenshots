# P1-6 — i18n coverage matrix (audit guide) [QA-009]

## Severity
**P1 audit guide** — meta-finding mapping P1-1's symptoms across all authed surfaces

## Summary
A per-route coverage breakdown for the i18n gap, intended as a CHECKLIST for [AGENT 2] to verify completeness after applying P1-1 + P1-2. This document is the master quality-gate audit grid.

## How to use this document
1. After fixing each authed route, re-run probe (see commands below)
2. Mark column ✅ when 95%+ of strings render in Russian for `NEXT_LOCALE=ru`
3. Don't ship P1 batch until every row is ✅

## Coverage matrix (observed 2026-05-22)

| Route | Sidebar | Page heading | Body content | Sub-nav | CTAs/buttons | Coverage |
|-------|:------:|:-----:|:-----:|:-----:|:-----:|:-:|
| `/dashboard` | ✅ | ✅ "Главная" | partial — Welcome tour modal translated ✓ but KPI labels English | n/a | partial | ~50% |
| `/clients` | ✅ | ✅ "Клиенты" | ❌ table headers + filter chips + KPIs all English | ✅ "Все клиенты / Воронка" | ❌ "New Client" English | ~30% |
| `/projects` | ✅ | ✅ "Проекты" | ❌ KPIs + status pills + filter chips + view tabs all English | ✅ "Проекты / Задачи / Учёт времени" | ❌ "New Project" English | ~30% |
| `/invoices` | ✅ | ✅ "Счета" | ❌ KPIs + filter chips + status badges + banner all English | ✅ "Счета / Recurring / Расходы" partial | ❌ "New Invoice" English | ~30% |
| `/proposals` | ✅ | ✅ "Коммерческие предложения" | ❌ entire Proposal Generator form English | n/a | ❌ all CTAs English | ~10% |
| `/contracts` | ✅ | ❌ "Contracts" English | ✅ empty-state body translated ✓ | ✅ "Все договоры / Создать / Шаблоны / Подписки" | ❌ "New Contract / Generate AI / More" English | ~50% |
| `/work/time` | ✅ | ✅ "Учёт времени" | ❌ Timer/Timesheet/Analytics tabs + Time Tracker + all buttons English | n/a | ❌ Pomodoro/Invoice Time/Export CSV English | ~20% |
| `/analytics` | ✅ | ✅ "Аналитика" | partial — KPI cards translated ✓, heatmap chart card NOT translated | ❌ subnav (Overview/Time/Forecast/...) English | ✅ tab labels translated | ~50% |
| `/settings` root | ✅ | ✅ "Настройки" | ✅ Profile + Appearance translated | n/a | ✅ "Сохранить профиль" translated | ~95% — only "Profile Photo / JPG, PNG or WebP" caption English |
| `/settings/api` | ✅ | ❌ "API Keys" English | ❌ all English (1053 endpoints, API Reference, BASE URL etc.) | n/a | ❌ "+ New Key" English | ~5% (acceptable — API docs convention?) |
| `/settings/digest` | ✅ | ❌ "Weekly Digest Settings" English | ❌ Delivery Settings / Sections to Include / Revenue Summary etc. English | n/a | ❌ Save Settings English | ~5% |
| `/settings/reminders` | ✅ | ❌ "Payment Reminder Automation" English | ❌ all English | n/a | ❌ Save Settings English | ~5% |
| `/settings/availability` | ✅ | ❌ "Availability Manager" English | ❌ STATUS labels + day buttons English | n/a | n/a | ~5% |
| `/settings/items-library` | ✅ | ❌ "Items Library" English | ❌ Service/Subscription headers English, prices in $ | n/a | ❌ "+ Add Item" English | ~5% |
| `/settings/export` | ✅ | ❌ "Data Export" English | ❌ all category names + record counts English | n/a | ❌ "Download CSV" English | ~5% |
| `/settings/late-fees` | ✅ | ❌ "Late Fee Automation" English | ❌ toggle label + Save English | n/a | ❌ "Save Settings" English | ~5% |
| `/settings/public-profile` | ✅ | ❌ "Public Profile" English | ❌ all form labels English | n/a | n/a | ~5% |
| `/settings/tags` | ✅ | ❌ "Project Tags" English | ❌ empty state English | n/a | ❌ "+ Add Tag" English | ~5% |
| `/settings/email-preview` | ✅ | ❌ "Weekly Digest Preview" English | ❌ all English | n/a | ❌ "Send Test Email" English | ~5% |
| `/upgrade` | ✅ | ❌ all English | ❌ all English | n/a | ❌ all English | ~5% (see P1-2 dedicated doc) |
| `/clients/new` | ✅ | n/a | ❌ wizard step labels + form fields English | n/a | ❌ "Next / Cancel" English | ~5% |
| `/invoices/new` | ✅ | n/a | ❌ form labels + Line Items table English | n/a | ❌ all English | ~5% |
| `/projects/new` | ✅ | n/a | ❌ all form fields English | n/a | ❌ "Generate" / "AI Milestones" English | ~5% |
| `/contracts/new` | ✅ | n/a | ❌ all form fields English | n/a | ❌ "Load Template" English | ~5% |
| `/proposals/generate` | ✅ | n/a | ❌ AI Proposal Generator form English | n/a | ❌ all English | ~5% |
| `/clients/pipeline` | ✅ | ✅ "Воронка" | ❌ stage column headers (Lead/Contacted/Proposal Sent/Won/Lost) English, "Drop leads here" English | n/a | ❌ "+ New Lead / Export CSV / Move →" English | ~30% |

## Counterexamples — ALREADY translated (use as reference patterns)

| Route | Coverage | What works |
|-------|:--------:|------------|
| `/` (homepage) | ✅ 100% | Full hero + dashboard mockup + CTAs in RU |
| `/pricing` (public) | ✅ 100% | All tier names, prices, features, badges in RU |
| `/about` | ✅ 100% | Mission + Our Story in RU |
| `/contact` | ✅ 100% | Form + sidebar info in RU |
| `/blog` | ✅ 100% | Blog hero + category chips in RU |
| `/faq` | ✅ 100% | Section headers in RU (questions may be EN — verify per-question) |
| `/register` | ✅ 100% | All form fields + benefits + CTAs in RU |
| `/login` | ✅ 100% | All copy in RU |
| `/forgot-password` | ✅ 100% | All copy in RU |
| `/settings` root | ✅ 95% | Only Profile Photo caption EN |
| `/privacy`, `/terms` | ⚠️ 10% | Legal docs in EN (acceptable convention BUT see QA-018 P2 — GDPR risk if RU users targeted) |

## Verification commands

After [AGENT 2] applies P1-1 + P1-2 fixes, re-run for each fixed route:

```bash
# Per-route RU probe
node /tmp/qa_capture.js \
  --engine chromium --locale ru --viewport desktop \
  --routes /clients,/invoices,/projects,/proposals,/work/time,/upgrade \
  --authed true
```

Then visually compare:
- `EVIDENCE/page-screenshots/{route}_chromium_ru_desktop_above-fold.png` BEFORE
- New probe screenshot AFTER

Score each row in matrix above. Ship when all "30%" rows → "95%+".

## Quick fix hypothesis (meta)

Same as P1-1 — find hardcoded English strings, replace with `t('...')` calls. Add missing keys to BOTH `messages/en.json` and `messages/ru.json` to keep parity (currently both 1826 lines — preserve symmetry).

**Suggested parallelization:**
- 5 parallel sub-agents, one per route bucket:
  - bucket A: /clients + /clients/new + /clients/pipeline
  - bucket B: /invoices + /invoices/new + /proposals + /proposals/generate
  - bucket C: /projects + /projects/new + /contracts + /contracts/new
  - bucket D: /work/time + /analytics
  - bucket E: /upgrade + /settings/* (excluding root)

Each agent owns their bucket end-to-end (find hardcoded strings → key extraction → en.json + ru.json sync → component edits → verify).

## Estimate (matrix wide)
~4-8h total (parallelized: ~2h if 5 agents work simultaneously)

## Cross-references
- P1-1 (i18n gap general) — this matrix is its supporting evidence
- P1-2 (upgrade RU) — single highest-priority row (revenue path)
- P1-4 (timezone UTC) — overlaps with /settings/digest + /settings/reminders rows here
- Pre-existing memory `feedback_marketing_honesty_policy` — string discipline
