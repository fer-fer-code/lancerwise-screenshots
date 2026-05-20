# Preventive N+1 Scan — Results

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Source data:** `audit/agent3-launch-baselines/baselines-raw/` (3-run baseline against prod, commit 6db4647a)
**Method:** Aggregate baseline `supabaseRestCount` per route × engine × locale + code-side widget audit для context

---

## Master scan table

All `(app)/` routes captured в baseline. REST counts per route, 3 runs aggregated.

| Route | Chr-EN REST | Chr-RU REST | WK-EN REST | WK-RU REST | bodyLen (Chr-EN) | Code widgets | useEffect+fetch widgets | Verdict |
|---|---|---|---|---|---|---|---|---|
| `/dashboard` | 0/0/0 | 0/0/0 | 0/0/0 | 0/0/0 | 2370 | — | — | ✅ FIXED (P1-A v2 / #86) |
| `/work/time` | **95/95/95** | **95/95/95** | 1/1/1 | 1/1/1 | 3749 | **101** | **86** | 🚨 **P1 unfixed** |
| `/settings` | **27/27/27** | **27/27/27** | **27/27/27** | **27/27/27** | 24971 | **56** | **41** | 🚨 **P1 unfixed** |
| `/clients` | 3/3/3 | 3/3/3 | 0/3/3 | 3/3/3 | 494 | 7 + `[id]`/* 64 | 3 + 37 | ⚠ P2 latent |
| `/contracts` | 2/2/2 | 2/2/2 | 2/2/2 | 2/2/2 | 513 | 3 + `[id]`/* (n/a) | 1 | ✅ baseline |
| `/invoices` | 2/2/2 | 2/2/2 | 2/2/2 | 2/2/2 | 463 | 9 + `[id]`/* 43 | 1 + 16 | ⚠ P2 latent for `[id]` |
| `/work/projects` | 2/2/2 | 2/2/2 | 2/2/2 | 2/2/2 | 510 | 1 + `[id]`/* (n/a) | 0 | ✅ baseline |
| `/settings/billing` | 2/2/2 | 2/2/2 | 1/1/1 | 1/1/1 | 954 | (in settings/) | (in settings/) | ✅ baseline |

Marketing + auth routes (`/`, `/about`, `/pricing`, `/login`, `/register`) all 0 REST calls. Out of scope.

Legend:
- ✅ = no N+1, OK
- ⚠ P2 latent = small now (empty test data), but high widget count suggests bloom with real data
- 🚨 P1 unfixed = N+1 storm visible in baseline, needs immediate attention

---

## Detail by route

### `/work/time` — confirmed P1 launch blocker

**95 REST calls × 3 runs deterministic.** Re-exports `/time-tracker/page.tsx`, a 1100-LOC client component с **101 widget imports**, of which **86 fire `useEffect(supabase.from(...))` on mount**. Math: 86 × ~1.1 fetches/widget = 95.

WebKit shows 1 call because WebKit's bodyLen 249 (vs Chromium 3749) — the probe hit an auth-skeleton state, не rendered widgets. The 1 call is the auth lookup itself, не a "WebKit doesn't have the bug" signal.

Full investigation: [`../agent1-work-time-investigation/`](../agent1-work-time-investigation/INVESTIGATION-REPORT.md).

### `/settings` — confirmed P1 (already known from BASELINES.md)

**27 REST calls consistent across all 4 cells.** 56 .tsx files под `(app)/settings/`, 41 of which have useEffect+fetch pattern. Same mount-time storm as `/work/time` but at smaller scale (37 widgets do `profiles.select` on overlapping columns; many fetch the same row independently).

bodyLen 24971 confirms the page DOES render — these 27 calls фактически hit during real user mount, не a probe artifact.

Already noted в [AGENT 3]'s BASELINES.md TL;DR #1. This scan confirms it.

### `/clients` — P2 latent (3 calls now, will bloom)

3 REST calls per mount today. The list view itself has 7 .tsx files, only 3 с useEffect+fetch — current baseline shows expected "user profile + clients list + tag library" calls.

**However**, the detail view `/clients/[id]/` has **64 .tsx widget files**, **37 с useEffect+fetch**. Test user had ZERO clients (per BASELINE-METHODOLOGY preconditions), so the detail view was never hit. Once real users open a client detail, expect ~30-40 REST calls on mount — same shape as `/dashboard` pre-P1-A.

**Risk:** мобильный crash potential on iOS Safari при opening client detail с real data — same family as Bug #74.

### `/invoices` — P2 latent (mostly `[id]`)

List shows 2 calls. Detail page `/invoices/[id]/` has **43 .tsx files, 16 с useEffect+fetch**. This is Bug #74 actively в progress (P1-B). Scan confirms scope.

### `/contracts`, `/work/projects` — baseline OK

2 REST calls each. Tiny widget surface, не bloomable. Не a concern.

### `/dashboard` — fixed (control case)

0 calls confirms P1-A v2 migration (PR #86) is doing its job. No regression.

---

## Numeric summary

| Severity | Routes | Reason |
|---|---|---|
| 🚨 P1 active | 2 (`/work/time`, `/settings`) | Visible N+1 storms in baseline, > 25 calls each |
| ⚠ P2 latent | 2 (`/clients/[id]`, `/invoices/[id]`) | Empty fixture masks storm; widget count predicts bloom |
| ✅ baseline | 4 (`/dashboard`, `/contracts`, `/work/projects`, `/settings/billing`) | < 5 calls or fixed |

**Two unfixed P1 + two latent P2.** Pattern: every page с >20 widgets that uses the mount-time fetch antipattern eventually exhibits the storm.

---

## Cross-references

- [`../agent1-work-time-investigation/`](../agent1-work-time-investigation/) — full `/work/time` investigation
- [`../agent3-launch-baselines/BASELINES.md`](../agent3-launch-baselines/BASELINES.md) — source of REST counts
- ROOT-CAUSE-PATTERNS.md — categorization of patterns observed
- LAUNCH-BLOCKER-RANKING.md — crash-risk vs perf-only assessment
