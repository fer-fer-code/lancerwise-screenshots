# Bug #029 — Production Verification

**Date:** 2026-05-19
**PR:** [#83](https://github.com/fer-fer-code/lancerwise/pull/83) — merged 06:06:03 UTC
**Branch:** `fix/bug-029-hero-mobile-ru-verstka` (squashed + deleted)
**Production live:** ~13:00 UTC (delayed propagation due to GH Actions outage; CI quota restored mid-day)

## CI Gates
| Gate | Result | Note |
|---|---|---|
| `gate / eslint i18n` | ✅ success | No new violations |
| `gate / locale-purity (ru)` | ✅ success | Full ICU parity preserved |
| `gate / visual-regression` | ⚠️ failure | INTENTIONAL — stats text size + RU string changes |

Merged via `--admin --squash` per task spec.

## Prod DOM verification (Playwright + cookie NEXT_LOCALE=ru)

All 4 mobile widths × RU verified:

```
w320 ru: allInOne="Всё в одном", clientsSub="+3 за месяц", saved="Экономия"
w375 ru: allInOne="Всё в одном", clientsSub="+3 за месяц", saved="Экономия"
w390 ru: allInOne="Всё в одном", clientsSub="+3 за месяц", saved="Экономия"
w414 ru: allInOne="Всё в одном", clientsSub="+3 за месяц", saved="Экономия"
```

EN locale at all widths — empty matches (correct: EN renders "All-in-one" / "+3 this month" / "Saved", не RU strings).

## Visual confirmation (8 prod PNGs в `prod/`)

### Stats bar w390 RU
- "Всё в одном" — single line ✅
- "На базе AI" — single line ✅
- "Бесплатно" — single line ✅
- "5 мин" — single line ✅
- Labels wrap к 2 lines (acceptable, consistent с EN)

### Hero mockup w390 RU
- Card 1: КЛИЕНТЫ / **14** / +3 за месяц — single line ✅
- Card 2: ЭКОНОМИЯ / **12д** / на админ-задачи — single line label с icon ✅
- Card 3: ВОВРЕМЯ / **96%** / процент оплат

## Bug closure

| Bug | Severity | Pre-fix | Post-fix | Status |
|---|---|---|---|---|
| #029-A | P1 | "Всё-в-одном" wrapped к "Всё-в-" / "одном" | Single line at w375+ | ✅ FIXED |
| #029-B | P2 | "+3 в этом / месяце" 2-line wrap | "+3 за месяц" single line | ✅ FIXED |
| #029-C | P3 | "Сэкономлено" + "на админ-/работу" tight | "Экономия" + "на админ-/задачи" cleaner | ✅ FIXED |

## EN regression check

EN identical к pre-fix on all viewports. `md:text-3xl` preserves original desktop sizing; mobile sizing change is RU-aware but doesn't hurt EN.

## Files modified
- `src/app/page.tsx` (1 line: stats bar mobile sizing)
- `messages/ru.json` (4 string updates)

## Bug #029: CLOSED ✅
