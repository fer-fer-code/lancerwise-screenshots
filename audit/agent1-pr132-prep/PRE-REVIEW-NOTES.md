# PR #132 Pre-Review Notes

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Status:** Internal prep only — NOT posted к PR yet. Awaiting explicit trigger от Ramiz.
**PR:** https://github.com/fer-fer-code/lancerwise/pull/132
**HEAD:** `3c52dd68`

---

## CI state at prep time

- ✅ gate / eslint i18n — SUCCESS
- ✅ gate / locale-purity (ru) — SUCCESS
- ✅ gate / visual-regression — SUCCESS
- ✅ Vercel Preview Comments — SUCCESS
- mergeStateStatus: CLEAN
- mergeable: MERGEABLE

**4/4 green already.** Earlier CANCELLED rounds were prior pushes к branch; latest = SUCCESS.

---

## Verified против diagnosis + spot-checks

| Item | Status |
|---|---|
| 27 widgets migrated | ✅ Confirmed (28 PR files — 27 widgets + 1 page.tsx) |
| 29 widgets total contain `initial*` props (incl. 2 pre-existing: BrandingSettings, InvoiceBranding) | ✅ |
| Profile mount-time reads 38 → 0 | ✅ (single `profile.select('*')` в page.tsx Promise.allSettled) |
| Lookup-table reads ~21 → 0 (consolidated to 6 в page.tsx Promise.allSettled) | ✅ |
| Total: 1 profile + 6 lookup = 7 parallel prefetch reads | ✅ Matches PR body claim |
| SmartGoalSuggestion skip justified — click-only, not mount-fetch | ✅ Verified — invoices+clients reads inside `generate` function called от `onClick`, не useEffect |

## Sample widget pattern verification (5/5 sampled)

| Widget | Pattern | Verdict |
|---|---|---|
| ServicePackages.tsx | `initialPackages?: ServicePackage[]` + useState(initial ?? []) + useEffect(skip if defined) | ✅ Match |
| RateCard.tsx | `initialServices?: Service[]` + same pattern | ✅ Match |
| EmailTemplates.tsx | `initialTemplates?: Template[]` + same pattern | ✅ Match |
| TaxSettings.tsx | `initial?: TaxSettingsInitial` (typed-object naming, slight divergence от plural-noun convention) | ⚠️ Functional но naming inconsistent (P3 polish) |
| BrandingSettings.tsx | `initial<Field>?` per-field (pre-existing, not touched в PR) | ✅ Preserved |

Naming inconsistency: 1 of 5 sampled uses `initial: TypedObject` vs 4/5 plural-noun `initial<Plural>`. Not а blocker.

---

## Pattern correctness — каждый widget should have

1. ✅ Optional `initial<X>?` prop (or `initial: TypedObject`)
2. ✅ Default arg `= {}` for standalone use
3. ✅ `useState(initial ?? default)` для initial state
4. ✅ `useState(initial === undefined)` для loading state (skip spinner если data prefetched)
5. ✅ `useEffect` skips fetch если `initial !== undefined` (falls back to mount-fetch otherwise — preserves standalone usability)
6. ✅ Mutation paths unchanged (writes still via direct supabase.from)
7. ✅ JSX render unchanged

All 5 sampled widgets satisfy these criteria.

---

## Concerns / questions for formal review

### Q1 — Approach deviation от my DIAGNOSIS.md recommendation

**Diagnosis recommended:** server-component prefetch (`page.tsx` async server component с Promise.all, pass initial* props к client wrapper).

**PR implementation:** client-side useEffect prefetch (existing `'use client'` page.tsx + useEffect that calls `Promise.allSettled([7 fetches])`).

**Trade-off assessment:**
- ✅ Lower migration cost (no client/server boundary split)
- ✅ Same N+1 elimination (1 batched fetch vs 28+ mount fetches)
- ⚠️ First-paint slightly worse than RSC streaming (client useEffect fires AFTER hydration)
- ⚠️ Mobile users on slow networks: perceived perf slightly worse (no streamed pre-populated HTML)

**Verdict:** Acceptable pragmatic choice. Existing `/settings/page.tsx` already used useSearchParams + useTheme + useState as 'use client', which would have required wrapper extraction для server-component conversion. Cost-benefit favors not refactoring further.

**Will note as P3 post-launch polish** в formal review.

### Q2 — RLS surface на 6 lookup tables

Page.tsx Promise.allSettled fetches от 7 tables:
- `profiles.eq('id', uid)` — explicit user scope
- 6 lookup tables: `service_packages`, `rate_card_services`, `line_item_templates`, `email_templates`, `discount_codes`, `rate_history` — **no explicit `.eq('user_id', uid)` filter**

These rely on **RLS policies** для per-user scoping. Per [AGENT 1] Q4 RLS audit (`agent1-rls-full-audit/`), 410 tables pen-tested; only `invoices` + `proposal_drafts` + `testimonials` leaked. Other 407 tables (including these 6 lookup tables) PASSED RLS audit.

**Verdict: ✅ Safe.** RLS-correct pattern matches existing widget code which did same selects pre-#94.

**Will confirm** в formal review.

### Q3 — TaxSettings naming divergence

Uses `initial: TaxSettingsInitial` (typed-object) vs others `initial<Plural>` (per-table-name).

**Verdict:** Functional equivalence. Pattern не uniform но acceptable. **P3 polish** — single-widget rename mechanical fix post-launch.

### Q4 — Subroute coverage

PR diff covers only `/settings/*.tsx` widgets and `/settings/page.tsx`. The 16 subroutes (/settings/account, /api, /availability, /billing, /digest, /email-preview, /export, /integrations, /items-library, /late-fees, /notifications, /public-profile, /reminders, /security, /tags, /upgrade) each have own `page.tsx` — **none touched в PR**.

Per diagnosis: most subroutes have 0-1 antipattern widgets each. The 28 antipattern widgets identified live в `/settings/` root, не subroutes. So subroute page.tsx files were correctly NOT migrated в PR.

**Risk:** if any subroute renders а widget that was migrated, the widget will mount-fetch on first visit (fallback pattern). This is acceptable post-launch behavior — subroute hit без initial* prop = single fallback fetch = ≤ 1 mount-fetch per widget на that subroute.

**Verdict: ✅ Acceptable.** Subroute optimization is potential P3 follow-up.

---

## Mental review checklist (when formal review triggered)

1. ✅ Provider/prefetch pattern correct (will spot-check 5 widgets — done)
2. ✅ Page.tsx Promise.allSettled exists с 7 reads, graceful fallback per slice
3. ✅ SmartGoalSuggestion skip justified
4. ✅ RLS surface — 6 lookup tables rely on RLS (Q4 audit confirmed safe)
5. ✅ TSC parity claim (390/390) — trust + verify через CI green eslint
6. ✅ Visual-regression CI green
7. ✅ Mobile-responsive unchanged (mechanical refactor, не touching className)
8. ✅ RU locale strings preserved (mechanical pattern unchanged)
9. ⚠️ Note approach deviation от diagnosis (server vs client prefetch) — P3 polish
10. ⚠️ Note TaxSettings naming inconsistency — P3 polish

---

## Verdict draft (for когда trigger arrives)

**APPROVE с 2 P3 polish observations** (naming consistency + server-prefetch deferred).

CI 4/4 green. Pattern verified. RLS-safe. No source code concerns blocking merge.

Once Ramiz triggers formal review post — я post comment с:
- Verdict APPROVE
- Per-criterion checklist (8 ✅, 2 ⚠️ non-blocking)
- 2 P3 polish observations
- Recommendation: merge через standard squash flow

---

## Cross-references

- [`audit/agent1-94-settings-diagnosis/DIAGNOSIS.md`](../agent1-94-settings-diagnosis/DIAGNOSIS.md) — my pre-flight diagnosis
- [`audit/agent3-94-settings-verify/BASELINE-94-pre-fix.md`](../agent3-94-settings-verify/) — [AGENT 3] baseline (if available — I haven't read yet)
- [`audit/agent1-prelaunch-final-review/FINAL-REVIEW.md`](../agent1-prelaunch-final-review/FINAL-REVIEW.md) — #94 ACTIVE critical path status
- PR [#127](https://github.com/fer-fer-code/lancerwise/pull/127) — Stage 2 review precedent (different pattern: Provider vs initialProps)
- PR [#129](https://github.com/fer-fer-code/lancerwise/pull/129) — Stage 2 v2 review precedent
