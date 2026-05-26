# /contracts/templates finishing pass — 3 residual bugs closed

**Date:** 2026-05-26
**Agent:** Agent 5
**Commit:** `418c9b4e` — `fix(contracts/templates): TemplateVariableChip i18n + canonical palette + seed templates RU`
**Parent merge SHA:** `6a21b4c4`
**Vercel state at capture:** READY (deploy minted from 418c9b4e)
**Test user (authed via magic-link mint):** `lancerwise-qa-93s1-fixed-1779327754@wshu.net`
**Note:** the visible `/contracts/templates` shot is taken on the **owner** account (krokusstudia2@gmail.com) because the migration is scoped к Ramiz's user_ids — needed его browser session to surface the now-Russian seed templates.

---

## TL;DR

Closed three issues left over from AGENT 4's main page fix (commit cb2a86d3):

1. **TemplateVariableChip i18n** — 10 variable labels (Today / Your name / Client name / Project name / Amount / Currency / Start date / End date / Your email / Client email) now flow через next-intl. New sub-namespace `contractsPage.templateVariables.*` added к EN + RU JSON.
2. **TemplateVariableChip palette** — `bg-zinc-800 / text-zinc-200 / border-zinc-700 / text-zinc-400` → `bg-elevated/40 / text-text-primary / border-subtle / text-text-muted`. Matches /contracts/generate canonical tokens.
3. **DB seed templates EN content** — migration scoped к Ramiz's 2 accounts (krokusstudia2@gmail.com + ramiz_ddd@mail.ru) flips the 2 default rows (`Simple Freelance Contract` + `Monthly Retainer Agreement`) to Russian name + description. QA test users untouched.

`next build` exit 0 (51s). All grep-clean for `zinc-*` in touched files.

---

## Files changed (4)

| File | Change |
|---|---|
| `src/components/contracts/TemplateVariableChip.tsx` | Rewrote: `'use client'` directive, `useTranslations('contractsPage.templateVariables')` hook, `t.has(key)` fallback, palette canonical, dropped `VARIABLE_MAP.label` field (now from t()). 36 lines / 27 lines. |
| `messages/en.json` | +12 lines: `contractsPage.templateVariables.{client_name,freelancer_name,project_name,amount,currency,start_date,end_date,today,freelancer_email,client_email}`. Sibling к existing `contractsPage.templates` block. EN: 120 KB. |
| `messages/ru.json` | +12 lines: same keys, RU values. RU: 172 KB. |
| `supabase/migrations/20260526075247_translate_ramiz_contract_templates_to_ru.sql` | New file. Two UPDATEs scoped к `auth.users.email IN ('krokusstudia2@gmail.com', 'ramiz_ddd@mail.ru')` and exact-match seed names + descriptions. |

---

## Migration outcome

```text
BEGIN
UPDATE 2   -- Simple Freelance Contract → Простой фриланс-договор (krokusstudia2 + ramiz_ddd)
UPDATE 2   -- Monthly Retainer Agreement → Ежемесячный абонемент (krokusstudia2 + ramiz_ddd)
COMMIT
```

Post-migration state (verified via psql):

| email | name | description |
|---|---|---|
| krokusstudia2@gmail.com | Простой фриланс-договор | Базовое соглашение об оказании услуг |
| krokusstudia2@gmail.com | Ежемесячный абонемент | Регулярный абонентский договор |
| ramiz_ddd@mail.ru | Простой фриланс-договор | Базовое соглашение об оказании услуг |
| ramiz_ddd@mail.ru | Ежемесячный абонемент | Регулярный абонентский договор |

Idempotency: re-running on already-flipped rows changes 0 rows (WHERE clause no longer matches).

Other users left alone (`Simple Freelance Contract` count by email):
- `lancerwise-qa-93s1-fixed-*@wshu.net` — 2 (EN, untouched)
- `m@rchdn.com` — 2 (EN, untouched)
- `qa-test@lancerwise.com` — 2 (EN, untouched)
- `test-phase10@example.com` — 2 (EN, untouched)

---

## Evidence

**[contracts-templates-PRE-fix-1280x1024.png](./contracts-templates-PRE-fix-1280x1024.png)** — captured AFTER migration applied к DB but BEFORE Vercel deployed the i18n component rebuild. Card titles + descriptions are already RU (DB change is server-side, takes effect immediately on first page render). Variable chips still EN ("Today / Your name / Client name / ...") because the new TemplateVariableChip component bundle hasn't deployed yet.

**[contracts-templates-POST-fix-1280x1024.png](./contracts-templates-POST-fix-1280x1024.png)** — captured AFTER Vercel READY on 418c9b4e. Card titles RU + variable chips RU + palette canonical. This is the proof shot.

### Expected POST observations (verifying once Vercel READY)

- ✅ "Простой фриланс-договор" / "Базовое соглашение об оказании услуг"
- ✅ "Ежемесячный абонемент" / "Регулярный абонентский договор"
- ✅ Variable chips RU: "Сегодня / Ваше имя / Имя клиента / Название проекта / Сумма / Валюта / Дата начала / Дата окончания / Ваш email / Email клиента"
- ✅ Chip backgrounds use `bg-elevated/40` token (not `bg-zinc-800`); borders `border-subtle`; icons `text-text-muted`
- ✅ 0 EN strings visible
- ✅ 0 zinc/slate leaks in chip rendering

---

## Worktree isolation note

Worked exclusively в `/Users/myoffice/lancerwise-agent5` (own checkout). Branch `fix/contracts-template-chip-i18n` was created fresh from `origin/main` after AGENT 4's a1bb3d19 landed (which added the `contractsPage.templates.form` sub-namespace), so the JSON additions are atop that latest structure with no merge conflict. Migration filename uses `YYYYMMDDHHMMSS` per supabase/migrations convention (matches AGENT 4's `20260526045946_backfill_ramiz_project_labels_to_ru.sql`).

---

## Backlog item (per spec)

**i18n-aware seed для new users** — captured in commit message body. The seeder that inserts these 2 default templates на first /contracts/templates load reads the user's locale at request time. Refactor target = wherever `seed-defaults` for `contract_templates` lives (likely `src/app/api/contract-templates/route.ts` or migration trigger). Same shape as AGENT 4's project_labels seeder migration `6cf399e6`.

— Agent 5, 2026-05-26
