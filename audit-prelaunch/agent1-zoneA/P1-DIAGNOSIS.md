# Zone A P1 Diagnosis — Code+Data Evidence

**Date:** 2026-05-29
**Author:** [AGENT 1]
**HEAD:** `e233c946` (same as Zone A audit)
**Method:** code trace + Supabase Admin REST probe of `user_id 367d62fc-a790-4ffb-b627-32db0df9b34e` (krokusstudia2@gmail.com)
**Scope:** diagnosis only — no fixes applied

---

## P1#1 — `/clients` HEALTH column shows identical "F · 10" for all visible rows

### Diagnosis: **NOT a bug — correct computed value for empty-data clients**. UX gap, not algorithm gap.

### Source trace

1. `/clients/page.tsx:153` → renders `<ClientAdvancedFilters clients={…} />` (does NOT pass any health data)
2. `ClientAdvancedFilters.tsx:509` → table cell renders `<ClientHealthBadge clientId={c.id} />` (one fetch per row)
3. `src/components/clients/ClientHealthBadge.tsx:50-55` → `fetch('/api/clients/' + clientId + '/health')` returns `{score, grade, label, color, bgColor, breakdown}`. Display string: `{data.grade} · {data.score}` (line 79)
4. `src/app/api/clients/[id]/health/route.ts` → server-side aggregates invoices + projects + comms for the client → calls `calcClientHealth()`
5. `src/lib/clientHealthScore.ts` → pure function:

```
score = payment(0-40) + activity(0-30) + revenue(0-20) + reliability(0-10)
- payment = paymentRate*25 + speed bonus (max 40, capped)
- activity = bucketed by daysSinceLastActivity
- revenue = bucketed by totalInvoiced
- reliability = 10 if overdueCount===0 else …

grade: ≥85 A, ≥70 B, ≥50 C, ≥30 D, else F
```

### Data evidence (`/tmp/p1_1_clients_evidence.json`)

| # | name | invoices | projects | comms | created | status |
|---|---|---:|---:|---:|---|---|
| 1 | QA Test Client | 0 | **3** | 0 | 34d ago | active |
| 2 | Stripe Corp | 0 | 0 | 0 | 34d ago | active |
| 3-10 | (8 QA prospects) | 0 | 0 | 0 | 20-21d ago | prospect |

### Local simulation of `calcClientHealth()` per row

```
name                       score  grade  breakdown (P/A/R/Rel)  days_since
QA Test Client                35  D      0/25/0/10              21.9
Stripe Corp                   10  F      0/0/0/10               9999
QA Round2 v3                  10  F      0/0/0/10               9999
QA Test Client                10  F      0/0/0/10               9999
QA Test Client                10  F      0/0/0/10               9999
QA New Spec Client            10  F      0/0/0/10               9999
QA Final Spec Client          10  F      0/0/0/10               9999
QA UserSpec Client            10  F      0/0/0/10               9999
QA Test Client Delete         10  F      0/0/0/10               9999
QA Client Test                10  F      0/0/0/10               9999
```

### Why `score=10` for 9 of 10 clients

For a client with 0 invoices, 0 projects, 0 comms:
- `totalInvoiced = 0` → `revenue = 0`
- `timestamps = []` → `daysSinceLastActivity = 9999` → `activity = 0` (else-branch in 6-bucket cascade)
- `avgDaysToPay = null` + `paymentRate = 0` → `payment = 0`
- `overdueCount = 0` (no invoices) → **`reliability = 10`** ← the only positive contributor
- `score = 0 + 0 + 0 + 10 = 10` → grade F (score < 30)

### Why my eyes-on missed Client #1's D 35

- DB order (`order=created_at desc` likely): #1 QA Test Client is OLDEST (34d ago)
- Visible viewport on my Zone A screenshot showed 6 rows starting с newest (`QA Client Test`, `QA Test Client Delete`, …)
- Client #1 (`QA Test Client` с 3 projects → D 35) sits в later viewport, off-screen в my capture
- Audit memo for next time: re-check `clients-fullpage.png` to verify variance (not just viewport)

### Verdict

**NOT a bug.** Algorithm produces different scores when data varies. The 9 displayed clients all have score=10 because they have **zero meaningful engagement signal** (no invoices, no projects, no comms), and `reliability=10` triggers as a vacuous "no overdue" condition. The 10th client (с projects) correctly scores D 35.

### Suggested fix (UX, not algorithm)

The current behaviour is technically correct but UX-misleading: a brand-new client с 0 data shows "F · At Risk · red badge" which suggests user has done something wrong / is being warned. Two recommendations:

**Option A (smallest change, lib-only):**
In `calcClientHealth()`, return a special "no-data" state when input is fully empty:

```ts
if (input.totalInvoiced === 0 && input.totalProjects === 0 && input.daysSinceLastActivity === 9999) {
  return {
    score: 0, grade: 'NEW' as any, label: 'New client',
    color: 'text-slate-300', bgColor: 'bg-slate-800/60',
    breakdown: { payment: 0, activity: 0, revenue: 0, reliability: 0 }
  }
}
```

UI displays "NEW · 0" instead of "F · 10". (Type widening для `grade` field needed, or add a separate sentinel field.)

**Option B (algo fix, better long-term):**
The `reliability=10` default for `overdueCount===0` is the trap — a client с no invoices at all can't be "reliable" (nothing to measure). Gate the reward:

```ts
// reliability requires at least 1 invoice to mean anything
if (input.totalInvoiced > 0) {
  if (input.overdueCount === 0) reliability = 10
  else if (input.overdueCount === 1) reliability = 5
  else reliability = 0
}
// else: reliability stays 0 (no data → no credit)
```

Now an empty-data client would score 0/0/0/0 → 0 → grade F. Still "F" но score=0 is honest signal "no data". Badge could then check `score === 0 && totalInvoiced === 0` для "NEW" override at display time.

**Recommendation:** Option B. Simpler invariant ("no invoices → no reliability credit"), no special-case logic в algo. Display fallback handled в `ClientHealthBadge.tsx` ("show `—` when score === 0 and breakdown is all zeros").

---

## P1#2 — Dashboard "Today's Agenda" shows 2 vs NotificationCenter shows 17

### Diagnosis: **NOT a cap bug.** Two different queries against `invoices` table — strict status enum vs broad date+exclude filter. Likely **NotificationCenter over-includes drafts**.

### Source trace

**TodayAgenda** (`src/app/(app)/dashboard/TodayAgenda.tsx:16-23`):

```ts
supabase.from('invoices')
  .eq('user_id', userId)
  .eq('status', 'overdue')          // ← strict: literal 'overdue' enum value
  .order('due_date', { ascending: true })
  .limit(5)                          // ← cap 5
```

Plus: projects due TODAY (`due_date = today`, status in active/pending) + invoices sent due TODAY.

**NotificationCenter** (calls `/api/notifications/smart` → `src/app/api/notifications/smart/route.ts:24-30`):

```ts
supabase.from('invoices')
  .eq('user_id', uid)
  .lt('due_date', new Date().toISOString())               // ← past due
  .not('status', 'in', '("paid","cancelled")')            // ← exclude only paid + cancelled
  .order('due_date', { ascending: true })
  .limit(20)                                              // ← cap 20
```

Plus other types in subsequent blocks (due-soon, milestones, proposals, followups — explaining the +1 between 16 invoices and 17 alerts).

### Data evidence

| Query | Result count | Status distribution |
|---|---:|---|
| TodayAgenda — `status='overdue'` (literal) | **2** | `{'overdue': 2}` |
| NotificationCenter — past due_date + status not (paid,cancelled) | **16** | `{'draft': 14, 'overdue': 2}` |
| Overlap (rows in both) | 2 | — |
| In NotifCenter but NOT TodayAgenda | **14** | All `status='draft'`, due 2026-05-20 / 05-21 |

The 14 invisible-on-Agenda invoices are all **DRAFTS** (`INV-001` through `INV-012` plus `INV-2026-2037`/`3871`) that passed their `due_date` but remain в `'draft'` status — never sent to clients, never auto-flipped to `'overdue'`.

The 17th NotificationCenter alert (vs 16 invoice rows in Query B) comes from another block in `/api/notifications/smart` (due-soon-sent, milestones, proposals, или followups — line 60+ of the same file).

### Why this matters

The two widgets show different conceptual things despite labelling both as "alerts requiring attention":

- **TodayAgenda**: "Invoices in `'overdue'` state" — depends on a cron / status-transition job auto-flipping past-due sent invoices to `'overdue'`. ONLY 2 sent invoices have been flipped так far.
- **NotificationCenter**: "Invoices past due_date that aren't paid or cancelled" — does NOT exclude drafts. Treats a draft с due_date = 2026-05-21 (8 days ago) as a "high severity" alert даже though it was never sent к client.

A draft invoice is the **user's own todo** ("send this invoice"), not a "client is overdue" alert. Calling it "Invoice #INV-001 overdue — 9 days overdue — total 500 USD" is misleading: the client never saw it.

### Verdict

**Functional defect — NotificationCenter over-includes drafts.** TodayAgenda's strict `status='overdue'` filter is correct for the "Today's Agenda" concept. NotificationCenter's broader filter мispresents drafts as client-overdue alerts.

Alternative reading: **Today's Agenda relies on a lagging cron transition**. If the cron job that flips past-due sent invoices to `status='overdue'` has lagged, TodayAgenda misses real overdues. But evidence shows the 14 unflipped invoices are all DRAFTS (not sent), so cron lag doesn't explain it.

### Suggested fix

**Option A (recommended):** In `/api/notifications/smart` line 28, **exclude drafts** alongside paid+cancelled:

```diff
- .not('status', 'in', '("paid","cancelled")')
+ .not('status', 'in', '("paid","cancelled","draft")')
```

Now NotificationCenter counts:
- 2 `status='overdue'` (matches TodayAgenda)
- 0 drafts (correctly ignored)
- Future sent invoices past due before cron flip → still surfaced

Both widgets become aligned at 2 invoice alerts on this test account, +1 other notification → 3 total в NotifCenter (still > 2 in Agenda because Agenda only shows invoices, no milestones/proposals/followups).

**Option B (alternative):** Add a separate "Drafts past planned date — send these" section in NotificationCenter (lower severity, different copy: "Draft #INV-001 — planned due 9 days ago, never sent"). Distinguishes "your own todo" vs "client behaviour" alerts.

**Recommendation:** Option A. Smaller change, immediate consistency. Option B is a P2 follow-up if product wants to surface user-side draft hygiene.

### Side note — cron presence

Worth verifying: is there a scheduled job (Vercel cron or Supabase pg_cron) that flips past-due sent invoices to `status='overdue'`? If yes, run frequency matters for TodayAgenda freshness. If no, manual user actions are the only way to get a record into `status='overdue'`. Out of P1 scope but flag for owner.

---

## Combined recommendation

Both P1s are **not page/critical flow bugs** (no broken render, no JS error, no 5xx). They're **data-modelling / UX consistency issues** that compound on test data and become visible only on real production accounts.

| # | Severity (revised) | Action |
|---|---|---|
| P1#1 (clients HEALTH=F·10) | **P2 / UX** | Algorithm correct. Fix display fallback so empty-data clients show "NEW / —" instead of "F · 10 At Risk". |
| P1#2 (Agenda 2 vs NotifCenter 17) | **P1 / data-criterion** | NotificationCenter over-includes drafts as overdue. Tighten `/api/notifications/smart` to exclude `status='draft'`. |

P1#1 not a launch blocker — current display is technically correct, just unfriendly. Safe для post-launch UX polish.
P1#2 IS more sensitive — production users will see "17 overdue invoices" on first login while only 2 are actually client-facing overdue. Recommend pre-launch fix.

---

## Artifacts

- `P1-DIAGNOSIS.md` (this file)
- `/tmp/p1_1_clients_evidence.json` — per-client engagement aggregate (10 rows)
- `/tmp/diag_p1_1_check_client1.py` — local simulation script reproducing `calcClientHealth()`
- `/tmp/diag_p1_2_agenda_vs_notif.py` — DB probe comparing TodayAgenda vs NotificationCenter queries

---

## Summary line per Ramiz spec

**P1#1 verdict: NOT a bug** — algorithm correct, empty-data clients legitimately score 10; UX fallback recommended (option A or B above).
**P1#2 verdict: data-criterion divergence** — TodayAgenda strict (status='overdue', 2 rows), NotificationCenter broad (past due + not paid/cancelled, 16 rows incl 14 drafts). Fix: exclude `'draft'` from smart endpoint.
