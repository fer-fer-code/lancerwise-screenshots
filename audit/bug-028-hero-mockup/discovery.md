# Bug #028 — Hero Mockup Translation Discovery

**Date:** 2026-05-19
**Branch:** `fix/bug-028-hero-mockup-translation`
**Agent:** [AGENT 1]
**Worktree:** `/Users/myoffice/lancerwise-agent1/`

---

## Component
`src/components/marketing/HeroShowcaseMockup.tsx` (108 LOC, `'use client'`)

Renders a mocked "app.lancerwise.com" dashboard preview inside the homepage hero, showing:
- Status indicator + "Year to date" label
- $48,240 YTD revenue + +34% delta + "Earned this year — on track for $72k" caption
- 12-bar monthly chart (Jun → May)
- 3-card metrics: Clients / Saved / On-time

## Caller
`src/app/page.tsx:14` (import), `src/app/page.tsx:199` (render).

## Strings to translate (12 unique)

| Line | EN | Target RU |
|---|---|---|
| 27 | `Year to date` | `С начала года` |
| 41 | `Earned this year — on track for $72k` | `Заработано в этом году — путь к $72k` |
| 61-72 | `Jun`/`Jul`/`Aug`/`Sep`/`Oct`/`Nov`/`Dec`/`Jan`/`Feb`/`Mar`/`Apr`/`May` | `Июн`/`Июл`/`Авг`/`Сен`/`Окт`/`Ноя`/`Дек`/`Янв`/`Фев`/`Мар`/`Апр`/`Май` |
| 81 | `Clients` | `Клиенты` |
| 84 | `+3 this month` | ICU plural `+3 в этом месяце` |
| 90 | `Saved` | `Сэкономлено` |
| 92 | `d` suffix (after `12`) | `д` |
| 93 | `on admin work` | `на админ-работу` |
| 99 | `On-time` | `Вовремя` |
| 102 | `payment rate` | `процент оплат` |

Mocked numeric values (`$48,240`, `14`, `12d`, `96%`, `+3`, `+34%`, `$72k`) are visual demo only — kept identical в RU так как валюта $.

## Plan
- Add `homeHero.mockup.*` namespace (~15 keys)
- Convert `<HeroShowcaseMockup>` to use `useTranslations('homeHero.mockup')`
- ICU plural для `clientsThisMonth({count})` чтобы Russian grammar correct
- Month abbreviations as 12-entry array `months.{0..11}` — RU date conventions, no Latin alphabet leaks

## Risks
1. `'use client'` — uses `useTranslations`, locale must be set via cookie via `next-intl` provider (already wired для other client-side marketing components)
2. Component width — RU labels (e.g. "Сэкономлено") могут быть длиннее EN ("Saved"). Verify card layout doesn't overflow at 320px/sm breakpoint
3. Visual-regression CI gate likely fails (intentional text change) → admin-merge expected

## Files audited
- `src/components/marketing/HeroShowcaseMockup.tsx` (108 LOC) — translation target
- `src/app/page.tsx` (1 import + 1 render) — caller, no edit needed

ESLint i18n baseline на target file: **22 errors**.
