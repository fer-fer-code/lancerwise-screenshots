# Launch Blocker Ranking — N+1 Routes

Severity ranking applied к the 4 unfixed/latent N+1 routes from `SCAN-RESULTS.md`. Decision axis: **likelihood of breaking real-user experience pre-launch**, especially mobile.

---

## Tier 1 — Launch blockers (fix before launch)

### `/work/time` 🚨🚨

| Dimension | Value | Reason |
|---|---|---|
| Severity | **P1 blocker** | Worst N+1 в app |
| Call count | 95 | 8.5× pre-fix `/dashboard` |
| iOS crash risk | **HIGH** | Pattern matches Bug #74 (invoice mobile crash), 101 widgets exceeds it |
| Auth gate | yes | Every Pro/active user hits this |
| User-visible impact | Severe | UI floods, mobile likely crashes, FCP > 5s |
| Fix recipe known | yes | `PROMISE-ALL-SERVER-FETCH` |
| Effort | ~6-8h | Largest of the four |

**Reason for blocker status:** Highest combination of call magnitude + crash risk + auth-gating. Russian launch demographic skews mobile-heavy → exactly the cohort most exposed к iOS Safari crash.

### `/settings` 🚨

| Dimension | Value | Reason |
|---|---|---|
| Severity | **P1 blocker** | Already flagged in BASELINES.md TL;DR #1 |
| Call count | 27 | 2.5× pre-fix `/dashboard` |
| iOS crash risk | Moderate | 27 calls + heavy form rendering, possible memory pressure |
| Auth gate | yes | New users hit this к set up profile/branding |
| User-visible impact | Significant | FCP ~3-5s, settings forms felt slow |
| Fix recipe known | yes | Same as above |
| Effort | ~3-4h | Smaller scope than /work/time |

**Reason for blocker status:** New-user onboarding path hits `/settings` к set profile. First impression matters. 27 calls is well past Web Vitals "Needs Improvement" threshold.

---

## Tier 2 — Pre-launch verify, post-launch fix acceptable

### `/clients/[id]` ⚠

| Dimension | Value | Reason |
|---|---|---|
| Severity | **P2 latent** | Bloom predicted, not yet observed |
| Call count today | 3 (list view) | Detail view не probed (empty fixture) |
| Predicted detail | ~30-40 | 37 widgets с fetch pattern, similar к dashboard pre-fix |
| iOS crash risk | Latent moderate | Becomes real once users have real client data |
| Auth gate | yes | Every active user opens client details |
| Fix recipe known | yes | Same as P1 routes |
| Effort | ~3-4h | 37 widgets к refactor |

**Reason for Tier 2:** Test user had zero clients (baseline pre-condition), so storm не observable yet. Real users will trigger it post-launch when they create clients и view details. Fixable post-launch with normal P2 priority unless crash reports come в.

### `/invoices/[id]` ⚠ (in flight)

Already actively being fixed under Bug #74 / P1-B work cluster. See [`../../lancerwise-knowledge/Bugs/LANCERWISE-4-N-PLUS-ONE-INVOICES.md`](../../lancerwise-knowledge/Bugs/LANCERWISE-4-N-PLUS-ONE-INVOICES.md). Не a new issue.

---

## Decision matrix — what к ship pre-launch

| Priority | Route | Action |
|---|---|---|
| 1 (must fix) | `/work/time` | File P1 issue, assign owner, target merge pre-launch |
| 2 (must fix) | `/settings` | File P1 issue (or confirm BASELINES.md #1 already filed) |
| 3 (let ship) | `/clients/[id]` | File P2 issue, fix post-launch unless real-user reports |
| 4 (in flight) | `/invoices/[id]` | Continue P1-B work, no new issue |
| 5 (deferred) | Onboarding flow clarification | File P3, defer к QA campaign |

## Crash-risk specific concern

The pattern from Bug #74 (mobile Safari `TypeError: Load failed`) was: 10-15 widgets fetching concurrently на mount overwhelmed iOS's smaller JS heap. The order-of-magnitude scaling:

| Widget count | iOS crash probability (estimate) |
|---|---|
| 10-15 | High (proven by #74) |
| 30-40 (`/clients/[id]`) | Very high |
| 56 (`/settings`) | Likely |
| 86 (`/work/time`) | Near-certain |

**`/work/time` should be assumed к crash iOS Safari при actual rendering.** The baseline didn't catch this because WebKit's probe pre-condition skipped the page render entirely (bodyLen 249).

Real-device verification on iOS prior к declaring "fixed" is required for `/work/time` and `/clients/[id]` once refactored.

---

## What's safe к ship as-is

- `/dashboard` ✅ — P1-A v2 complete, 0 REST calls, FCP residual deferred к #90
- `/contracts` ✅ — 2 calls baseline, не bloomable
- `/work/projects` ✅ — 2 calls baseline, не bloomable
- `/settings/billing` ✅ — 2 calls, scoped
- `/contracts/[id]` — not probed, но contracts list shows clean numbers
- All marketing routes — 0 REST calls, n/a
- `/login`, `/register` — 0 REST calls, auth flow only

## Cost of NOT fixing P1 items pre-launch

If shipped as-is:
- `/work/time`: high crash rate on iOS = user can't track time = product unusable для freelancers. **Critical UX failure.**
- `/settings`: new users can't set up profile easily, abandonment risk on first session

If fixed:
- ~10h focused work across two PRs
- Brings two more pages к same shape as `/dashboard` (proven pattern)
- Reduces Supabase usage cost long-term (28K calls/day for `/work/time` alone at modest scale)

Recommended ship plan: **fix `/work/time` + `/settings` pre-launch**. Other items file as post-launch tracked items.

---

## Related

- SCAN-RESULTS.md
- ROOT-CAUSE-PATTERNS.md
- [`../agent1-work-time-investigation/RISK-ASSESSMENT.md`](../agent1-work-time-investigation/RISK-ASSESSMENT.md) — detailed risk for /work/time
- [AGENT 3] `BASELINES.md` — source baseline data
