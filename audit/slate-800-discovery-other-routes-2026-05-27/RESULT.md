# Slate-800 legacy palette discovery — non-/clients, non-/money, non-/work-time routes

**Date:** 2026-05-27
**Agent:** [AGENT 2]
**Main HEAD scanned:** `a3e3200a`
**Scope:** Pure inventory — zero code changes.

## Search parameters

Routes scanned (parallel-agent ownership split):
- `src/app/(app)/contracts/`
- `src/app/(app)/sales/`
- `src/app/(app)/tools/`
- `src/app/(app)/settings/`
- `src/app/api-docs/`
- `src/app/changelog/`
- `src/app/(app)/onboarding/`

**Excluded** (other agents' scope):
- `/clients/*` + `/money/*` — [AGENT 1]
- `/work/time` — [AGENT 5]
- `/dashboard/*` — separate
- `src/components/*` — shared component scope, separate

Regex pattern (5 legacy palette anchors):
```
bg-slate-800/50  |  bg-slate-800\b  |  bg-slate-900/50  |  border-slate-700  |  border-slate-800
```

## Top-line scope

| Route | Files touched | Lines with ≥1 hit | Notes |
|---|---:|---:|---|
| `/tools/*` | **15** | **173** | Heaviest |
| `/contracts/*` | **17** | **81** | Most files (but lighter density) |
| `/settings/*` | **10** | **65** | Medium |
| `/onboarding/*` | **1** | **20** | Single dense file (OnboardingWizard) |
| `/sales/*` | 0 | 0 | Clean ✓ |
| `/api-docs/` | 0 | 0 | Clean ✓ |
| `/changelog/` | 0 | 0 | Clean ✓ |
| **TOTAL (touched routes)** | **43** | **339** | |

## Pattern variant breakdown (across all 4 routes-with-hits)

Counted as individual pattern occurrences (a single source line can have multiple).

| Pattern | Occurrences |
|---|---:|
| `border-slate-700` | 268 |
| `bg-slate-800` (bare, word-boundary) | 168 |
| `bg-slate-800/50` | 142 |
| `bg-slate-900/50` | 36 |
| `border-slate-800` | 2 |
| **Total pattern hits** | **616** |

Note: total pattern hits (616) > total lines with hits (339) because multiple legacy patterns commonly co-occur on a single classname string (e.g., `<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">` = 2 patterns on 1 line).

## Top 5 heaviest files (by primary-pattern line count)

| File | Primary hits | text-slate-* | hover-slate | i18n wired | Total LOC |
|---|---:|---:|---:|---:|---:|
| `tools/proposal-templates/page.tsx` | 21 | 40 | 3 | ❌ | 706 |
| `onboarding/OnboardingWizard.tsx` | 20 | 54 | 5 | ⚠️ partial (2) | 737 |
| `tools/budgets/BudgetsClient.tsx` | 18 | 45 | 2 | ❌ | 304 |
| `tools/welcome-kit/page.tsx` | 17 | 34 | 4 | ❌ | 768 |
| `tools/faq-builder/page.tsx` | 15 | 42 | 9 | ❌ | 675 |

**Implication:** Top files have ~2× the primary-pattern count in additional `text-slate-*` companion drift. Real conversion cost ≈ **(primary hits) × 2** per file when you include text colors. Most files are also missing i18n entirely — would need both palette swap AND useTranslations wiring if scope expands beyond palette-only.

## Per-route file breakdown (sorted by hit count)

### `/contracts/*` — 17 files, 81 hits

| File | Hits |
|---|---:|
| `contracts/page.tsx` | 12 |
| `contracts/renewals/RenewalCenterClient.tsx` | 11 |
| `contracts/analyze/ContractAnalyzer.tsx` | 7 |
| `contracts/[id]/ContractRenewal.tsx` | 7 |
| `contracts/[id]/SignatureTracker.tsx` | 5 |
| `contracts/[id]/ShareLinkButton.tsx` | 5 |
| `contracts/[id]/SendSigningLinkButton.tsx` | 5 |
| `contracts/new/page.tsx` | 4 |
| `contracts/[id]/page.tsx` | 4 |
| `contracts/[id]/ContractRiskAnalysis.tsx` | 4 |
| `contracts/[id]/ContractAmendment.tsx` | 4 |
| `contracts/expiry/page.tsx` | 3 |
| `contracts/[id]/edit/page.tsx` | 3 |
| `contracts/[id]/ContractActions.tsx` | 3 |
| `contracts/ContractValueSummary.tsx` | 2 |
| `contracts/new/ContractTemplates.tsx` | 1 |
| `contracts/[id]/ContractChecklist.tsx` | 1 |

### `/tools/*` — 15 files, 173 hits

| File | Hits |
|---|---:|
| `tools/proposal-templates/page.tsx` | 21 |
| `tools/budgets/BudgetsClient.tsx` | 18 |
| `tools/welcome-kit/page.tsx` | 17 |
| `tools/faq-builder/page.tsx` | 15 |
| `tools/complexity-estimator/page.tsx` | 15 |
| `tools/client-intelligence/ClientIntelligenceClient.tsx` | 15 |
| `tools/roi-calculator/page.tsx` | 11 |
| `tools/runway/page.tsx` | 10 |
| `tools/pricing-optimizer/page.tsx` | 9 |
| `tools/client-brief/page.tsx` | 9 |
| `tools/capacity/page.tsx` | 8 |
| `tools/timezone/page.tsx` | 7 |
| `tools/objection-handler/page.tsx` | 7 |
| `tools/call-prep/page.tsx` | 7 |
| `tools/work-life/WorkLifeClient.tsx` | 4 |

### `/settings/*` — 10 files, 65 hits

| File | Hits |
|---|---:|
| `settings/items-library/page.tsx` | 14 |
| `settings/availability/page.tsx` | 12 |
| `settings/reminders/ReminderSettings.tsx` | 9 |
| `settings/api/APIKeysClient.tsx` | 8 |
| `settings/public-profile/PublicProfileEditorFull.tsx` | 7 |
| `settings/late-fees/LateFeeSettings.tsx` | 5 |
| `settings/tags/page.tsx` | 4 |
| `settings/export/page.tsx` | 3 |
| `settings/email-preview/page.tsx` | 2 |
| `settings/InvoiceBranding.tsx` | 1 |

### `/onboarding/*` — 1 file, 20 hits

| File | Hits |
|---|---:|
| `onboarding/OnboardingWizard.tsx` | 20 |

## Per-route hour estimate

Based on /analytics-widget pace (~3-5 tool calls per file for palette swap + companion text-slate cleanup, plus build verify + commit):

| Route | Files | Primary hits | Complexity | Hours (palette-only) | Hours (palette + i18n) |
|---|---:|---:|---|---:|---:|
| `/tools/*` | 15 | 173 | Heavy: large `page.tsx` server components, 5-7 files >10 hits each. No i18n. | **3.5–4.5h** | **8–11h** |
| `/contracts/*` | 17 | 81 | Medium: many small files, mostly `<div>` wrapper + button classes. Mix of `[id]/*` server + client. | **2–2.5h** | **5–6h** |
| `/settings/*` | 10 | 65 | Medium: settings forms, dense in `items-library` + `availability`. | **1.5–2h** | **3.5–4.5h** |
| `/onboarding/*` | 1 | 20 | Concentrated: one 737-LOC wizard. Already has 2 `useTranslations` references — partial-i18n state. | **0.5h** | **1–1.5h** |
| **Total** | **43** | **339** | | **7.5–9.5h** | **17.5–23h** |

**Hour estimate basis:**
- Palette-only swap: ~5 min per simple file, ~15 min per file > 10 hits + companion text-slate cleanup
- Palette + i18n full conversion: ~25–35 min per simple file, ~1–1.5h per heavy file (require new namespace design + per-string translation)

## Recommendations to Ramiz

1. **Sales / api-docs / changelog already canonical** — zero scope. ✓

2. **Onboarding is single-file high-priority** — `OnboardingWizard.tsx` is a 737-LOC dense file with 20 primary + 54 text-slate hits. New user first-experience page. Already partial-i18n (2 hooks). Strong candidate for **first fix-now**: palette + finish i18n in single session (~1.5h). Single PR, single owner.

3. **Tools is the largest scope** — 15 files, 173 primary hits, no i18n at all. If full-conversion: 8–11h ≈ 2–3 [AGENT 2] sessions. If palette-only (defer i18n post-launch): 3.5–4.5h ≈ 1 session.

4. **Contracts has lots of small files** — 17 files, but median file has 3–5 hits. Mostly button hover/border legacy. Palette-only sweep could be done as a regex-driven batch with manual review (~2h).

5. **Settings is medium scope** — 10 files, 65 hits. Most heavy in `items-library` + `availability` (26 of 65 hits). Could split: palette pass first, then i18n later.

6. **Suggested execution order** (if Ramiz approves fix-now):
   - Phase A (1.5h, 1 file): **Onboarding** — palette + i18n complete
   - Phase B (3.5–4.5h, 15 files): **Tools** — palette-only sweep
   - Phase C (2h, 17 files): **Contracts** — palette-only sweep
   - Phase D (1.5–2h, 10 files): **Settings** — palette-only sweep
   - Phase E (post-launch backlog): i18n wiring for tools/contracts/settings

   Total palette-only across all 4 routes: **~8.5h** ≈ 2–3 [AGENT 2] sessions.

## Verification

```bash
# Reproduce inventory
PATTERN='bg-slate-800/50|bg-slate-800\b|bg-slate-900/50|border-slate-700|border-slate-800'
grep -rEn "$PATTERN" \
  'src/app/(app)/contracts/' \
  'src/app/(app)/sales/' \
  'src/app/(app)/tools/' \
  'src/app/(app)/settings/' \
  'src/app/api-docs/' \
  'src/app/changelog/' \
  'src/app/(app)/onboarding/' | wc -l
# Expected: 339
```

## Artifacts

- `RESULT.md` — this report
- `full-inventory.txt` — complete `grep -rEn` output for every hit (347 lines incl. headers), grouped by route, sorted alphabetically. Useful for fix agents to consume.

## Out of scope (per directive)

- Actual fixes (inventory only)
- `/clients/*` + `/money/*` (AGENT 1)
- `/work/time` (AGENT 5)
- `/dashboard/*` (separate)
- `src/components/*` shared components (separate)
