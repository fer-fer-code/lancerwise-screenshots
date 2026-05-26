# Slate-800 Legacy Palette Pattern — Discovery Report

**Date:** 2026-05-27
**Author:** [AGENT 1] — pure discovery (NO code changes)
**lancerwise main HEAD at scan:** `a3e3200a`
**Patterns scanned:** `bg-slate-800/50`, `bg-slate-800` (exact-bound), `bg-slate-900/50`, `border-slate-700`, `border-slate-800`
**Scope:** `src/app/(app)/clients/` + `src/app/(app)/money/` only
**Out of scope:** `/work/*` ([AGENT 5] active), `/dashboard` widgets (separate work), marketing/landing pages

---

## TL;DR

| Surface | Files с hits | Total hits | Status |
|---|---:|---:|---|
| `/clients/*` | **65** | **342** | needs full sweep |
| `/money/*` | **0** | **0** | ✅ already clean (AGENT 3 palette sweep covered) |
| **Total scope** | **65 files** | **342 occurrences** | post-launch backlog |

**Estimated effort (1 agent):** **~10-14 hours focused work** depending on complexity-aware batching strategy.

---

## Complexity distribution

342 hits across 65 files. Per-file count distribution:

| Tier | Hits per file | File count | Total hits | Avg fix time per file | Cumulative |
|---|---:|---:|---:|---:|---:|
| **Heavy** | 10+ hits | 10 | 130 | ~30 min | ~5 h |
| **Medium** | 4-9 hits | 28 | 161 | ~12 min | ~5.5 h |
| **Trivial** | 1-3 hits | 27 | 51 | ~4 min | ~1.8 h |
| **TOTAL** | — | **65** | **342** | — | **~12 h** |

---

## Top 10 heaviest files (10+ hits)

| # | File | Hits | Notes |
|---|---|---:|---|
| 1 | `clients/win-back/page.tsx` | **22** | Heaviest single file. Table layout + modal + filters — full palette migration |
| 2 | `clients/intake/page.tsx` | **13** | ModalBackdrop usage + form panels |
| 3 | `clients/[id]/ClientContacts.tsx` | **13** | Contact-book CRUD с table + cards |
| 4 | `clients/import/page.tsx` | **12** | CSV import flow с panels |
| 5 | `clients/[id]/statement/StatementView.tsx` | **12** | Invoice statement view widget |
| 6 | `clients/[id]/communications/page.tsx` | **12** | Communications log table |
| 7 | `clients/[id]/history/page.tsx` | **10** | Client history timeline |
| 8 | `clients/[id]/OnboardingEmailSequence.tsx` | **10** | Sequence editor с steps |
| 9 | `clients/[id]/MeetingLog.tsx` | **10** | Meeting list + add modal |
| 10 | `clients/[id]/ClientAnalytics.tsx` | **10** | Analytics widget set |

Heavy-tier total: **130 hits / 10 files** (38% of total scope concentrated в 15% of files).

---

## Medium tier (4-9 hits, 28 files)

| File | Hits |
|---|---:|
| `clients/referral-analytics/page.tsx` | 9 |
| `clients/[id]/EmailComposer.tsx` | 9 |
| `clients/new/page.tsx` | 8 |
| `clients/broadcast/page.tsx` | 8 |
| `clients/[id]/ClientReminders.tsx` | 8 |
| `clients/[id]/time-report/page.tsx` | 7 |
| `clients/[id]/SatisfactionRating.tsx` | 7 |
| `clients/[id]/RetainerTracker.tsx` | 7 |
| `clients/[id]/DocumentVault.tsx` | 7 |
| `clients/[id]/ClientNotesLog.tsx` | 7 |
| `clients/[id]/ClientContactBook.tsx` | 7 |
| `clients/[id]/ReferralTracker.tsx` | 6 |
| `clients/[id]/ClientRiskAssessment.tsx` | 6 |
| `clients/[id]/ClientPortalPanel.tsx` | 6 |
| `clients/[id]/ClientPaymentPreference.tsx` | 6 |
| `clients/[id]/ClientFollowUp.tsx` | 6 |
| `clients/[id]/ClientActivityLog.tsx` | 6 |
| `clients/[id]/CommunicationLog.tsx` | 5 |
| `clients/[id]/ClientValueTier.tsx` | 5 |
| `clients/[id]/ClientBrief.tsx` | 5 |
| `clients/[id]/page.tsx` | 4 |
| `clients/[id]/onboarding/page.tsx` | 4 |
| `clients/[id]/edit/page.tsx` | 4 |
| `clients/[id]/OnboardingChecklist.tsx` | 4 |
| `clients/[id]/ClientProposals.tsx` | 4 |
| `clients/[id]/ClientNPS.tsx` | 4 |
| `clients/[id]/ClientMoodTracker.tsx` | 4 |
| `clients/[id]/ClientHealthScore.tsx` | 4 |

Medium-tier total: **161 hits / 28 files**.

---

## Trivial tier (1-3 hits, 27 files)

| File | Hits |
|---|---:|
| `clients/[id]/TimezoneTracker.tsx` | 3 |
| `clients/[id]/SurveyLinkButton.tsx` | 3 |
| `clients/[id]/ClientWelcomeKit.tsx` | 3 |
| `clients/[id]/ClientRevenueGoal.tsx` | 3 |
| `clients/[id]/ClientGoalTracker.tsx` | 3 |
| `clients/[id]/Testimonials.tsx` | 2 |
| `clients/[id]/SatisfactionTrend.tsx` | 2 |
| `clients/[id]/SatisfactionHistory.tsx` | 2 |
| `clients/[id]/ReferralEmail.tsx` | 2 |
| `clients/[id]/RecentSurveys.tsx` | 2 |
| `clients/[id]/ClientWinbackEmail.tsx` | 2 |
| `clients/[id]/ClientTimeline.tsx` | 2 |
| `clients/[id]/ClientTags.tsx` | 2 |
| `clients/[id]/ClientSource.tsx` | 2 |
| `clients/[id]/ClientQuickNote.tsx` | 2 |
| `clients/[id]/ClientPrivateNotes.tsx` | 2 |
| `clients/[id]/ClientInvoiceHistory.tsx` | 2 |
| `clients/[id]/ClientCreditLimit.tsx` | 2 |
| `clients/[id]/ClientBudgetSummary.tsx` | 2 |
| `clients/[id]/WelcomeEmailButton.tsx` | 1 |
| `clients/[id]/DeleteClientButton.tsx` | 1 |
| `clients/[id]/ClientTierProgress.tsx` | 1 |
| `clients/[id]/ClientSummaryAI.tsx` | 1 |
| `clients/[id]/ClientRiskScore.tsx` | 1 |
| `clients/[id]/ClientProjectTimeline.tsx` | 1 |
| `clients/[id]/ClientLTVForecast.tsx` | 1 |
| `clients/ImportButton.tsx` | 1 |

Trivial-tier total: **51 hits / 27 files**.

---

## Pattern observations

### Per-pattern frequency (across all 342 hits)

Distribution sampled across heavy files:

| Pattern | Typical use case | Canonical replacement |
|---|---|---|
| `bg-slate-800/50` | Card backgrounds | `bg-card` |
| `bg-slate-900/50` | Hover overlays, table row stripes | `bg-elevated/50` OR `hover:bg-white/[0.04]` |
| `border-slate-700` | Default card border | `border-subtle` |
| `border-slate-700/50` | Soft divider (table row separator, modal section) | `border-subtle` |
| `border-slate-800` | Rare — stronger divider | `border-line` |
| `bg-slate-800` (rare, exact-bound) | Solid card | `bg-card` |

### Frequent multi-line cluster pattern

Most files combine 2-3 patterns per element:
```tsx
className="bg-slate-800/50 rounded-xl border border-slate-700 p-5"
//        ^^^^^^^^^^^^^^^^                    ^^^^^^^^^^^^^^^
//        bg-card                              border-subtle
```

This means swap-per-hit ≠ swap-per-element. Many hits will cluster into а single 2-token edit. Real edit count likely ~200-250 distinct className modifications для full 342-hit migration.

### Files с table-heavy patterns

Table layouts use 4-6 slate hits each (header bg + row hover + dividers):
- `win-back/page.tsx` — full client table c filter dropdown
- `referral-analytics/page.tsx` — analytics breakdown table
- `[id]/ClientContactBook.tsx`, `[id]/MeetingLog.tsx`, `[id]/CommunicationLog.tsx` — paginated lists

These are **highest-risk** для visual regression — table grids amplify visible drift if any swap goes wrong.

---

## Estimated effort scenarios

### Scenario A — Single agent, sequential

Per-file effort:
- Heavy (10+ hits): ~25-40 min с TSC + visual spot-check
- Medium (4-9): ~10-15 min
- Trivial (1-3): ~3-5 min

| Tier | Files | Min effort | Max effort |
|---|---:|---:|---:|
| Heavy (10) | 10 | 250 min | 400 min |
| Medium (4-9) | 28 | 280 min | 420 min |
| Trivial (1-3) | 27 | 80 min | 135 min |
| **Total** | **65** | **~10 h** | **~16 h** |

**Realistic central estimate: ~12 hours focused work** by а single agent с no parallelism.

### Scenario B — Two agents parallel (heavy + medium split от trivial)

- Agent A: heavy + half medium (24 files, ~6 h)
- Agent B: trivial + half medium (41 files, ~5 h)
- Wall-clock: ~6-7 hours

### Scenario C — Pure codemod (RISKY, не recommended)

Sed-like global swap could process 342 hits в minutes, **but:**
- `bg-slate-900` is contextual (sometimes page wrapper → `bg-canvas`, sometimes card → `bg-card`, sometimes hover → `bg-elevated/50`)
- `border-slate-700` vs `border-slate-700/50` distinguishes card border (subtle) vs row separator (also subtle, но may be different design intent)
- Semantic status tints (e.g. `bg-blue-900/20`) NOT in our pattern set, но adjacent slate hits may co-occur c них и need careful preservation

Per [AGENT 6] palette sweep precedent — `NO codemod` per Ramiz directive holds для this pattern set too. Eyes-on per file.

---

## Recommended sequencing

Per Ramiz's general post-launch backlog priorities:

1. **Phase 1 (Quick wins, ~3 h):** All 27 trivial files. High morale boost, low risk. Can run в evening session.
2. **Phase 2 (Medium tier, ~5 h):** 28 medium files. Break into 2 sub-batches by route group (`/clients/[id]/*` analytics widgets vs `/clients/[id]/*` actions/edits).
3. **Phase 3 (Heavy, ~5 h):** 10 heavy files. Most-visible surfaces (win-back, intake, communications). Pair с visual regression spot-checks per file.

**Total realistic single-agent ETA: ~13 hours over 2-3 focused sessions.**

---

## Out-of-scope confirmations

- `/work/*` routes: **NOT scanned per Ramiz directive** — [AGENT 5] active there
- `/money/*`: scanned, **0 hits** — already clean via prior AGENT 3 sweep (7 tsx files в `money/expenses`, `money/invoices`, `money/reports` + `money/page.tsx`)
- `/dashboard`, marketing pages, etc.: **not scanned**

---

## Cross-references

- Prior AGENT 3 palette sweep: commit `5f5a8fd5` (covered blue/teal/cyan но missed slate-undertone)
- Prior AGENT 5 work на `/work/time`: ~23 files с identical pattern (active, не included here)
- This discovery: **inventory only**, no fix recommendations beyond complexity tier guidance

---

## Artifacts

- `RESULT.md` (this file)
- `slate-clients-raw-hits.txt` — full 342-line `grep -rEn ...` output для backlog ticket reference

---

## Summary line per Ramiz spec

**Total scope: 65 files / 342 hits** — `/clients/*` only (`/money/*` already clean) | **Top 5 heaviest:** win-back (22), intake (13), ClientContacts (13), import (12), StatementView (12) | **ETA full sweep (1 agent): ~12 hours focused** (range 10-16h)
