# Code References — `public.proposals` Table

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Investigation:** Static inventory of all source-tree references to `public.proposals` table, against confirmed production DB schema state.
**Discipline:** READ-ONLY. No code modified.

---

## Production DB ground truth (confirmed live query)

Queried `information_schema.tables` directly against production DATABASE_URL at ~14:08 UTC.

| Table | Present in prod | Notes |
|---|---|---|
| `proposals` | ❌ **MISSING** | Migration `supabase/migrations/20260510000001_proposals_table.sql` exists in repo but never applied to live DB |
| `proposal_drafts` | ✅ exists | Active table, ~50 columns, 1 row (test data) |
| `proposal_documents` | ✅ exists | |
| `proposal_templates` | ✅ exists | |
| `retainer_proposals` | ✅ exists | |
| `proposal_outcomes` | ❌ MISSING | (also in migration drift; out of scope here) |
| `proposal_followups` | ❌ MISSING | (same) |
| `proposal_analytics` | ❌ MISSING | (same) |

**Confirms [AGENT 3] finding + matches `project_lancerwise_migration_tracking_gap.md` issue** — `schema_migrations` table has only ~3 rows of ~470 applied migrations, so `supabase db push` won't replay missed ones. The `proposals` migration sits in that gap.

---

## Migration file inspected

`supabase/migrations/20260510000001_proposals_table.sql` — 42 lines, defines `proposals` table with:
- FK к `clients(id)` AND `projects(id)` (semantic upgrade vs `proposal_drafts.client_name` string)
- Split `title`/`description` (vs `proposal_drafts.proposal` blob)
- Typed `status` enum (draft/sent/viewed/accepted/declined/expired)
- `total_value` numeric + `currency` text (vs `proposal_drafts.budget`+`amount`+`won_amount`)
- `line_items` JSONB array (vs `proposal_drafts.sections`)
- Single RLS policy `Users manage their proposals` (USING auth.uid()=user_id)
- 4 indexes (user_id, client_id, status, sent_at)

**Interpretation:** the missing migration represents a planned **V2 schema** — a structural upgrade of `proposal_drafts` к a normalized model. Code in `/api/v1/*` was forward-coded against V2 but the table itself was never applied.

---

## Source-tree references к `'proposals'` table (18 files, 18 callsites)

Grep query: `from('proposals')` OR `from("proposals")` in `/src/**`.

### REST API v1 — would 500 when external integrators call

| File | Status | Failure mode |
|---|---|---|
| `src/app/api/v1/proposals/[id]/accept/route.ts` | 18 LOC fetch from proposals + update | 500 `relation "public.proposals" does not exist` |
| `src/app/api/v1/proposals/[id]/reject/route.ts` | similar | 500 |
| `src/app/api/v1/proposals/[id]/duplicate/route.ts` | similar | 500 |
| `src/app/api/v1/proposals/[id]/compare/route.ts` | similar | 500 |
| `src/app/api/v1/clients/[id]/proposals/route.ts` | join clients→proposals | 500 |
| `src/app/api/v1/clients/[id]/activity/route.ts` | aggregates from proposals | 500 |
| `src/app/api/v1/leads/[id]/proposal/route.ts` | upsert/create | 500 |
| `src/app/api/v1/smart-brief/route.ts` | reads proposals for context | 500 OR fail-open empty |
| `src/app/api/v1/search/route.ts` | searches proposals | 500 OR fail-open empty |
| `src/app/api/v1/analytics/proposal-win-rate/route.ts` | aggregates over proposals | 500 |
| `src/app/api/v1/analytics/conversion/route.ts` | similar | 500 |
| `src/app/api/v1/analytics/proposal-conversion-funnel/route.ts` | similar | 500 |

**Auth:** all gated by `authenticateApiKey()` — 3rd-party integrators only. **No customer-facing UI calls /api/v1/proposals/**.

### AI endpoints — silently degraded

| File | Behaviour |
|---|---|
| `src/app/api/ai/smart-brief/route.ts` | Parallel select includes `proposals` branch (line 43). Likely fail-open with empty data → AI advisor gives advice без proposal context |
| `src/app/api/ai/next-action/route.ts` | similar |

**Impact:** AI advisor's "grounded advice" feature won't see proposal data. Quietly degraded, не visibly broken.

### Cron jobs — scheduled, would fail silently or emit corrupted output

| File | Schedule | Risk |
|---|---|---|
| `src/app/api/cron/quarter-sprint/route.ts` | (no schedule in vercel.json — manual?) | runtime error if invoked |
| `src/app/api/cron/monthly-revenue-forecast/route.ts` | `0 8 28-31 * *` (month-end) | Monthly forecast email could be sent с missing proposals revenue OR cron fails fully |
| `src/app/api/cron/monthly-health-score/route.ts` | (no schedule found — manual?) | runtime error if invoked |
| `src/app/api/cron/slow-month-alert/route.ts` | `0 9 8 * *` (8th of each month) | Slow-month detector won't include proposals signal |

---

## Counter-finding: customer-facing UI is unaffected

122 files reference `proposal_drafts` (the live table), including:
- `/(app)/proposals/page.tsx` — main UI list (line 99: `from('proposal_drafts')`)
- `/(app)/proposals/[id]/page.tsx` — detail view
- `/(app)/proposals/generate/page.tsx` — AI generation flow
- `/(app)/proposals/print/page.tsx` — print/PDF
- `/portal/proposal/[token]/page.tsx` — client-facing portal
- `/(app)/dashboard/QuickProposalStats.tsx`, `WinRateWidget.tsx`, `FollowUpReminders.tsx`, `QuickWinWidget.tsx` — all dashboard widgets

**Plus** `/api/proposals/*` route family (different path from `/api/v1/proposals/*`) — uses `proposal_drafts`.

**Net:** the visible product works. The drift only affects:
1. External REST API integrators (zero at launch — no API keys issued)
2. AI advisor grounded data (silent degradation)
3. Cron-driven monthly emails (silent degradation OR cron job failure)

---

## Cross-references

- `project_lancerwise_migration_tracking_gap.md` — explains why `supabase db push` can't replay this migration
- `feedback_adhoc_ddl_pattern.md` — convention for applying schema changes via psql
- [AGENT 3]'s discovery (today) — confirmed via independent live query
- LAUNCH-IMPACT.md — what this means for go/no-go
- RECOMMENDED-DECISION.md — Options A/B/C for Ramiz
