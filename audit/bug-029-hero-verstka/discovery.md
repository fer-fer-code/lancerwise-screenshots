# Bug #029 — Hero Mobile RU Verstka Discovery

**Date:** 2026-05-19
**Branch:** `fix/bug-029-hero-mobile-ru-verstka`
**Worktree:** `/Users/myoffice/lancerwise-agent1/`

## Reproduction
Captured 8 mobile screenshots в `before/` at 4 widths × 2 locales (320, 375, 390, 414 × en, ru).

## Bug #029-A — Stats bar value overflow

**File:** `src/app/page.tsx:210-220`
**Component:** `<section>` stats bar after hero block, before features section.

Current markup:
```tsx
<section className="py-12 px-6 border-b border-slate-700/50 bg-slate-900/50">
  <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    {statKeys.map(statKey => (
      <div key={statKey}>
        <div className="text-3xl font-bold text-violet-600 mb-1">{t(`marketingStats.${statKey}.value`)}</div>
        <div className="text-sm text-slate-500">{t(`marketingStats.${statKey}.label`)}</div>
      </div>
    ))}
  </div>
</section>
```

At w390 mobile:
- `grid-cols-2 gap-8` → each column ≈ 155px wide (after 24px page padding)
- `text-3xl` = 30px font size
- RU value "Всё-в-одном" (11 chars at 30px ≈ 180px) wraps awkwardly: `Всё-в-` / `одном`
- "На базе AI" also wraps tight
- EN "All-in-one" (10 chars at 30px ≈ 130px) fits (just) on one line

**Fix:** Reduce mobile value size: `text-3xl` → `text-2xl md:text-3xl`. Also slight gap reduction: `gap-8` → `gap-6 md:gap-8`.

## Bug #029-B — Clients card "+3 в этом месяце" wraps

**File:** `src/components/marketing/HeroShowcaseMockup.tsx:84`
**Component:** First of 3 stat cards inside hero mockup.

Card structure:
```tsx
<div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/30">
  <div className="flex items-center gap-1.5 mb-1">
    <Sparkles className="w-3 h-3" />
    <span className="text-[10px] uppercase tracking-wider">{t('clients')}</span>
  </div>
  <div className="text-xl font-bold">14</div>
  <div className="text-[10px] text-green-400">{t('clientsThisMonth', { count: 3 })}</div>
</div>
```

At w390:
- Mockup container width ~342px (after page padding + mockup outer margins)
- 3-col grid with gap-3: each card ≈ (342 - 32 - 16)/3 ≈ 98px
- Card inner width (after p-3 padding): 98 - 24 = ~74px
- "+3 в этом месяце" (17 chars at 10px ≈ 95px) overflows → wraps к 2 lines

**Fix:** Shorten RU translation: `+3 в этом месяце` → `+3 за месяц` (11 chars, ~62px, single line). Keep ICU plural for grammatical correctness.

## Bug #029-C — Other stat cards tight

Same `HeroShowcaseMockup.tsx`:
- **`saved`**: "СЭКОНОМЛЕНО" (11 chars) tight with adjacent Clock icon
- **`onAdminWork`**: "на админ-работу" (15 chars) wraps к 2 lines acceptably
- **`onTime`/`paymentRate`**: "ВОВРЕМЯ"/"процент оплат" — fits OK с minor wrap

**Fix:** Shorten `saved` к "ЭКОНОМИЯ" (8 chars), keep `onAdminWork` (2-line wrap acceptable for stat sub-label), `paymentRate` keep.

## Fix plan summary

| Bug | File | Change |
|---|---|---|
| #029-A | `src/app/page.tsx` | `text-3xl` → `text-2xl md:text-3xl`, `gap-8` → `gap-6 md:gap-8` на stats grid |
| #029-B | `messages/ru.json` | `clientsThisMonth` ICU value → `+# за месяц` |
| #029-C | `messages/ru.json` | `saved` → "Экономия" (Title Case, uppercase via CSS) |

EN locale untouched — current EN sizing работает fine.

## Verification scope
Mobile widths 320, 375, 390, 414. Both locales. Stats bar + hero mockup. Desktop regression check.
