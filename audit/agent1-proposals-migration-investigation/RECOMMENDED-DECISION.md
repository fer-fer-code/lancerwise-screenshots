# Recommended Decision — `public.proposals` Migration Drift

**Author:** [AGENT 1]
**Date:** 2026-05-20
**For:** Ramiz (founder decision)
**Investigation discipline:** READ-ONLY. Migration NOT applied. Code NOT modified.

---

## Recommendation: **Option B — Defer fix к post-launch (week 1)**

Reasoning summary:
1. Customer-facing UI is unaffected (uses `proposal_drafts`, which exists).
2. Applying the migration без backfill creates an empty `proposals` table that solves nothing — UI is не wired к it.
3. Refactoring 18 forward-coded backend refs к use `proposal_drafts` instead is а ~3-6h post-launch task (much less risky than schema change pre-launch).
4. First user-visible delayed signal not until May 28 (end-of-month cron) → 8-day buffer.

---

## Three options analysed

### Option A — Apply migration pre-launch

**Action:**
```bash
psql $DATABASE_URL -f supabase/migrations/20260510000001_proposals_table.sql
```

**Pros:**
- Closes drift в schema
- Backend refs no longer error
- Symmetry restored с repo state

**Cons:**
- ❌ Empty table — does not actually help any feature (UI doesn't write к it)
- ❌ Creates new questions: should `proposal_drafts` data be migrated к `proposals`? If yes — much larger backfill task. If no — what's the actual purpose of two tables?
- ❌ Adds unknown change to launch-window codebase. Per launch-readiness discipline, минимизировать pre-launch deltas.
- ❌ Could obscure a planned V2 architecture decision that Ramiz wanted к make deliberately

**Effort:** ~10 min apply + ~15 min verify
**Risk:** Low for the apply itself, but creates downstream "what now" decision

**Verdict:** **Not recommended** unless Ramiz has concrete plan для V2 schema migration.

---

### Option B — Defer fix к post-launch (RECOMMENDED)

**Action:**
- File issue (e.g., #111) "Migration drift: public.proposals never applied"
- Add Sentry alert rule for `relation "public.proposals" does not exist` (P2 trigger)
- Add к Week-1 backlog: refactor 18 backend refs from `'proposals'` → `'proposal_drafts'` OR delete unused routes

**Pros:**
- ✅ Zero pre-launch risk
- ✅ Clear post-launch path
- ✅ Forces decision on V2 schema deliberately, not under launch pressure
- ✅ Sentry alert catches if hidden user-facing path hits the broken refs

**Cons:**
- AI advisor mildly degraded for ~7-14 days
- Monthly cron на May 28-31 may misbehave (fix before then = 8-day buffer)

**Effort:** ~20 min today (issue + Sentry alert) + ~3-6h post-launch (refactor)
**Risk:** Low

**Verdict:** **RECOMMENDED.**

---

### Option C — "Already aware, не concern"

**Premise:** Ramiz already knew about this and considers it expected behaviour (e.g., dead code paths, planned deprecation).

**If true:** confirm + close investigation. Add memory note к prevent re-investigation:
- `feedback_proposals_v2_intentional.md` — "the 18 backend refs к `'proposals'` table are dead code; planned cleanup post-launch"

**Cons:**
- ❌ AI advisor + cron jobs would still benefit from explicit fix
- ❌ Sentry alert still useful as canary

**Verdict:** Treat as **Option B variant with simpler narrative**. Still file Sentry alert + memory note.

---

## Sub-decision (if Option B chosen): refactor direction

When the post-launch fix lands, 2 sub-directions:

### Sub-B1 — Refactor refs к use `proposal_drafts`

Replace `from('proposals')` с `from('proposal_drafts')` and remap fields:
- `title` → `proposal` (or pluck first line)
- `total_value` → `amount` или `won_amount`
- `client_id` → derived from `client_name` (lossy)
- `line_items` → `sections`

**Pros:** uses existing data immediately
**Cons:** field mismatch creates messy code; some fields are not 1:1; loses semantic upgrade

### Sub-B2 — Apply migration + backfill from `proposal_drafts`

Apply migration THEN write а one-time backfill script:
```sql
INSERT INTO proposals (user_id, client_id, title, total_value, currency, status, sent_at, ...)
SELECT user_id, NULL, proposal, COALESCE(amount, won_amount, 0), currency, status, sent_at, ...
FROM proposal_drafts;
```

**Pros:** semantically clean; future-proof
**Cons:** larger task; risk of data mismatch

### Sub-B3 — Delete the 18 backend refs entirely

If those routes are dead code (never called по production traffic), just delete them.

**Verification needed:** check Sentry/Vercel logs для `/api/v1/proposals/*` request volume in last 30 days. If zero → kill.

**Pros:** simplest; no schema work
**Cons:** loses planned external API surface area

**Recommendation:** Sub-B3 first (audit traffic) → if zero calls, delete. Else Sub-B2 (apply + backfill).

---

## Decision matrix

| Option | Pre-launch effort | Pre-launch risk | Post-launch effort | Cust-visible? |
|---|---|---|---|---|
| A apply migration | 25 min | Low-medium (untested) | Still need backfill OR rewrite | No (immediate) |
| **B defer** | **20 min** | **None** | **3-6h** | **No** |
| C "aware" | 5 min | None | Same as B post-launch | No |

---

## What I need from Ramiz

**ONE answer:**

1. **A** — apply migration now
2. **B** — defer, file issue, set Sentry alert (recommended)
3. **C** — "already aware, close investigation"
4. **B+sub-direction** — pick Sub-B1 / Sub-B2 / Sub-B3 для post-launch

**If B (or no answer in 1h):** I'll proceed с filing #111 + Sentry alert config + adding line к Week-1 backlog. None of that touches code или schema — fully reversible.

---

## Acknowledged constraints

- READ-ONLY investigation per task brief — no migration applied, no code modified
- Drop instantly if #97 critical-path trigger arrives — this investigation lower priority than build infra
- Both findings (TASK A + TASK B) reported in single follow-up message per task discipline

---

## Cross-references

- [`CODE-REFERENCES.md`](./CODE-REFERENCES.md) — file inventory
- [`LAUNCH-IMPACT.md`](./LAUNCH-IMPACT.md) — risk timeline + Tier-2 placement
- `project_lancerwise_migration_tracking_gap.md` — root-cause memory
- [`POST-LAUNCH-WEEK-1-BACKLOG.md`](../agent1-launch-readiness-master/POST-LAUNCH-WEEK-1-BACKLOG.md) — where Day-3-4 fix entry would land
- `feedback_adhoc_ddl_pattern.md` — convention for psql application (NOT executed here)
