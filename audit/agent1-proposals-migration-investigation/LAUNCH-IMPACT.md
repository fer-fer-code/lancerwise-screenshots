# Launch Impact — `public.proposals` Migration Drift

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Question:** Does this drift block launch? Quietly degrade post-launch? Or zero impact?

---

## TL;DR

**Not a launch blocker.** Customer-facing UI uses `proposal_drafts` (which exists), so the visible product works. The drift causes:

- **0 customer-visible breakage** (UI/portal/PDF/email все routed through `proposal_drafts`)
- **3 silent degradations:** AI advisor context, monthly cron reports, external REST API
- **0 immediate functional regression** at launch
- **Monthly delayed signal** — first failed cron will fire May 28-31 (revenue-forecast) or June 8 (slow-month-alert)

---

## Surface-by-surface assessment

### 1. Public-facing marketing site

**Searched:**
- `/pricing` — no claim about "Proposals" tied к new `proposals` schema
- `/features` — feature copy describes proposal generation (works через `proposal_drafts`)
- `/faq` — no schema-tied claims
- `/changelog` — no claim about the missing migration

**Verdict:** ✅ No marketing copy depends on the missing table.

### 2. Onboarding / sign-up flow

**Checked:** new-user flow does not insert into `proposals` table. Onboarding hits:
- `clients` (real table, exists)
- `projects` (exists)
- `profiles` (exists)
- `proposal_drafts` (exists, optional, used during proposal generation)

**Verdict:** ✅ No onboarding requirement on `proposals`.

### 3. Customer dashboard widgets

Dashboard reads:
- `QuickProposalStats` → `proposal_drafts` ✅
- `WinRateWidget` → `proposal_drafts` ✅
- `FollowUpReminders` → `proposal_drafts` ✅
- `QuickWinWidget` → `proposal_drafts` ✅
- `ClientPipelineValue` → `proposal_drafts` ✅
- `ProposalPipelineValue` → `proposal_drafts` ✅
- `ProposalAnalytics` → `proposal_drafts` ✅
- `FreelancerScorecard` → `proposal_drafts` ✅

**Verdict:** ✅ Dashboard widgets all wired to live table.

### 4. /(app)/proposals UI

The main proposals UI (`/(app)/proposals/page.tsx`) uses `proposal_drafts` directly:
- Line 99: list query
- Line 175: detail prefetch
- Line 204: update
- Line 209: delete

Also calls REST `/api/proposals/*` (not `/api/v1/proposals/*`) for templates, followups, PDF tokens, review tokens — those routes also use `proposal_drafts`.

**Verdict:** ✅ Full UI flow works.

### 5. Client portal (/portal/proposal/[token])

Uses `proposal_drafts.portal_token` (column exists) for token-based client access.

**Verdict:** ✅ Client review/accept/reject flow works.

### 6. AI advisor (Grounded Advice)

**Affected:** `/api/ai/smart-brief` + `/api/ai/next-action` query `proposals` in their parallel `Promise.all` fetches.

**Behaviour analysis:**
- Supabase JS `from('proposals').select()` against non-existent table returns `{ data: null, error: { code: 'PGRST205', message: 'relation "public.proposals" does not exist' } }`
- AI endpoints likely treat `error` as fail-open (continue с empty array), since they fetch from many tables и degrade gracefully

**Impact на user experience:**
- AI gives advice based on `clients`, `invoices`, `time_entries`, `projects` (all present) — proposal context missing
- User won't see "your last proposal was ____" — but advisor still functional

**Severity:** Low — degraded feature, не broken. Differentiator weakened (см. `feature_strength_advisor_grounded_advice.md`).

### 7. Monthly cron reports

**Most exposed:** `/api/cron/monthly-revenue-forecast` runs end-of-month (28-31).

**First trigger date:** May 28, 2026 (8 days after launch).

**Behaviour:** depends on error handling в route. If catch-all `try/catch` wraps proposals fetch, monthly email lands sans proposals revenue forecast. If no catch, cron job fails → no monthly email at all.

**Impact:** First post-launch month, users get incomplete OR missing monthly email. Recoverable.

### 8. External REST API (/api/v1/proposals/*)

**Affected:** 4 endpoints + 8 indirect.

**Auth:** all gated by API key via `authenticateApiKey()`.

**Active integrators at launch:** **0** (no API keys issued yet — feature exists but no documentation/onboarding).

**Verdict:** ✅ Zero impact at launch. Would only matter post-launch if API key program opens.

---

## Risk timeline

| Day | Risk surface | Impact if hit |
|---|---|---|
| Day 0 (launch) | UI/portal/dashboard | None — all wired to `proposal_drafts` |
| Day 0+ | AI advisor | Silent degradation; no user complaint expected immediately |
| Day 8 (May 28-31) | monthly-revenue-forecast cron | First user-visible email anomaly OR missing email |
| Day 19 (June 8) | slow-month-alert cron | Second cron failure if not fixed |
| Day 30+ | quarter-sprint cron | Quarterly report would fire (if scheduled) |
| Day N | external REST API consumer | 500 if 3rd-party integration ever attempted (0 expected) |

---

## Comparison к other Tier-2 risks

This drift sits comfortably в Tier 2 (ship-с-monitoring) per [`RISK-PROFILE.md`](../agent1-launch-readiness-master/RISK-PROFILE.md):

| Tier 2 risk | Severity comparison |
|---|---|
| #95 /clients/[id] latent N+1 | Similar — silent until real users accumulate |
| #104 LANCERWISE-7 polling | Similar — silent until cron fires |
| #102 subscription_events policy branch | Similar — defensive only |
| **proposals drift** | **Similar — degraded AI + delayed cron failures** |

Acceptable post-launch fix window: **within 7-14 days** (before second cron iteration June 8).

---

## What this changes in launch readiness

Adding к pre-existing risk profile:

- Add **#111** к open issue tracker (or equivalent): "Migration drift: `public.proposals` missing in prod"
- Add Sentry alert rule: `error.message contains 'relation "public.proposals" does not exist'` → P2 severity
- Update [`POST-LAUNCH-WEEK-1-BACKLOG.md`](../agent1-launch-readiness-master/POST-LAUNCH-WEEK-1-BACKLOG.md) с new Day-3-4 entry: "resolve proposals migration drift"

---

## Cross-references

- [`CODE-REFERENCES.md`](./CODE-REFERENCES.md) — full file inventory
- [`RECOMMENDED-DECISION.md`](./RECOMMENDED-DECISION.md) — Options A/B/C for Ramiz
- `project_lancerwise_migration_tracking_gap.md` — root-cause memory
- [`POST-LAUNCH-WEEK-1-BACKLOG.md`](../agent1-launch-readiness-master/POST-LAUNCH-WEEK-1-BACKLOG.md) — where fix work would land
