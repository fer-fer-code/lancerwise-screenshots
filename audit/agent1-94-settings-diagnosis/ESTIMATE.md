# #94 /settings N+1 — Effort Estimate

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Companion к:** [DIAGNOSIS.md](./DIAGNOSIS.md)

---

## Scope summary

- **28 antipattern widgets** (createClient + useEffect + mount-fetch)
- **~59 mount-time `.from()` calls** к eliminate
- **16 subroutes** to convert (root + 15 sub-pages OR consolidate down)
- **38 profile reads** ⟶ 1 (single per-subroute Promise.all fetch)
- **6 lookup-table reads** (service_packages, rate_card_services, line_item_templates, email_templates, rate_history, discount_codes) — bundle с profile fetch where co-located

---

## Approach: server-component prefetch + initialProps (not Provider)

Per [DIAGNOSIS.md](./DIAGNOSIS.md) — different от Stage 1 pattern, but cheaper и more idiomatic для /settings's subroute-heavy shape.

---

## Effort breakdown (optimistic)

| Step | Time | Notes |
|---|---|---|
| Convert /settings/page.tsx client → server + Promise.all | 30 min | Read user → batched fetch profile + 4 heavy lookup tables → pass props к client child |
| Extract `<SettingsRootClient>` containing existing client logic | 30 min | Move 'use client' boundary to dedicated wrapper |
| Migrate 12 root-page widgets к accept initial* props | 1.5h | Mechanical: each widget gets initial prop, uses for initial state, drops mount-fetch |
| Migrate /settings/items-library (3 heavy widgets) | 45 min | ServicePackages + RateCard + LineItemTemplates batch |
| Migrate /settings/digest + /availability + /late-fees (smaller surfaces) | 1h | 6-8 widgets across 3 subroutes |
| Migrate remaining 8 subroutes (mostly 0-1 antipattern widgets each) | 30 min | Trivial |
| New probe protocol on /settings (4-cell × 3-run matrix per Stage 1 v2 precedent) | 30 min | Match [AGENT 3]'s probe pattern |

**Optimistic total: ~3.5-4 hours focused work**

Matches original #94 estimate of 3-4h despite higher fetch count (because pattern is more mechanical when initialProps precedent already exists).

---

## Effort breakdown (realistic, с rework)

| Step | Realistic time | Slippage cause |
|---|---|---|
| Root page server-component conversion | 1h | Discover edge case: e.g. `useSearchParams` (line 4 of page.tsx) needs к stay client-side → require Suspense boundary |
| Root client wrapper extraction | 45 min | TypeScript prop drilling friction |
| 12 root-page widget migrations | 2.5h | Each widget needs careful state-management refactor (initial state vs re-fetch on event); discover edge cases с `useCallback`-wrapped load functions |
| Subroute migrations | 2h | Each subroute может have unique mid-tier patterns |
| Visual-regression baseline drift | 30 min | Server-prefetch might change first-paint timing; baseline may need refresh |
| Probe protocol (new) — Chromium + WebKit × authed + anon | 1h | Build out for /settings root + most-visited subroutes |
| Last-minute findings | 30 min | Buffer |

**Realistic total: ~7-8 hours focused work** (~2× optimistic — typical for refactors hitting Next.js client/server boundary).

---

## Critical risks

| Risk | Probability | Mitigation |
|---|---|---|
| Data-shape regression (same class as Stage 1 v1) | low-medium | Server returns arrays directly via `.select()` без single(); widgets type-check initial props at compile-time |
| `useSearchParams` / `useRouter` clash с server-component conversion | medium | Wrap client logic в `<Suspense fallback={...}>` if hydration boundary needed; existing /settings uses `useSearchParams` for tab routing |
| Visual-regression flakes | medium | Refresh baseline if first-paint shifts; PR #98 precedent makes this routine |
| /settings/export subroute has 6 fetches | low | Larger batch fetch; manageable in scope |
| Pre-existing LW-9-class latent widget bug surfacing | low-medium | Probe protocol per Stage 1 v2 lessons-learned; 4-cell × 3-run matrix catches |

---

## Comparison к Stage 1 (#93)

| Dimension | #93 /work/time | #94 /settings |
|---|---|---|
| Antipattern widgets | 31 migrated в #127 + 7 deferred | 28 |
| Fetches eliminated | ~95 | ~59 |
| Pattern chosen | Context Provider | Server-prefetch + initialProps |
| Single-route or multi-route | Single (/work/time + /time-tracker) | 16 subroutes |
| Existing precedent в codebase | Provider (Dashboard PR #84/#86) | initialProps (BrandingSettings) |
| Hours focused (realistic) | 8-12h | 7-8h |
| iOS real-device validation required | Yes (matched #74 pattern) | No (no matching mobile-crash history) |
| Stage split needed? | Yes (Stage 1 infra + Stage 2 widgets) | No (single PR feasible — subroute scope smaller per page) |

---

## Recommended sequencing

**Single-PR feasible** (vs #93's Stage 1+2 split) because:
- Pattern doesn't require а dedicated "Provider infrastructure" PR
- Each subroute migration is independent of others
- Mid-PR rollback safe (subroutes ship independently)

**But:** if [AGENT 2] prefers staging (e.g. ship /settings root first, then subroutes), pattern still works — every subroute is а self-contained migration.

---

## Probe protocol recommendation

Per Stage 1 v2 lessons-learned:

1. **Pre-merge probe** — local browser + Vercel preview build
2. **Post-merge probe** — production deploy + 4-cell matrix:
   - Chromium авth/+ anon
   - WebKit auth+/anon
   - 3 runs each
3. **Acceptance:** zero widget tree crashes; fetch count drops от ~59 к ~16 (1 per subroute Promise.all)

---

## Cross-references

- [DIAGNOSIS.md](./DIAGNOSIS.md) — fetch surface analysis
- Issue [#94](https://github.com/fer-fer-code/lancerwise/issues/94)
- `audit/agent3-93-stage-1-verify/LESSONS-LEARNED.md` — probe protocol precedent
- `audit/agent2-worktime-phase-2-plan/STAGE-2-WIDGET-MIGRATIONS-PLAN.md` — Stage 2 mechanics reference
