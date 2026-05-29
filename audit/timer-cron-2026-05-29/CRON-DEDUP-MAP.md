# Cron dedup map — pre-launch hygiene

**Date:** 2026-05-29
**Agent:** Agent 5
**Scope:** identify cron name overlap в `vercel.json` (97 entries), recommend dedup actions
**Decision rule:** read-only audit — NO automatic deletions. Each pair flagged для Ramiz code review.

---

## Why this matters

Vercel Observability for last 7 days showed **only 10 / 97 crons actually fired** на schedule (see TIMER-DIAGNOSIS.md). `auto-stop-timers` (a daily cleanup cron) had **zero scheduled invocations** — manual curl confirmed handler is correct, route handler returns 200 в 1.2s, so the failure mode is the Vercel scheduler, not the code. Reducing the cron count below the Pro plan's effective ceiling (current best estimate: ~40 concurrent / daily total) is the proven mitigation.

---

## Confirmed singular/plural pairs (4)

Each pair has a distinct route handler с different size + imports — **not auto-deduplicate-safe.** Recommend code review per pair.

| Pair | Handler sizes | Distinguishing imports | Likely action |
|---|---|---|---|
| `payment-reminder` ↔ `payment-reminders` | 105 vs **428 lines** | Plural adds `generateJSON, BudgetExceededError from @/lib/ai` | Plural is the post-AI-migration successor (batch B1, PR #246). Keep plural, drop singular if not still wired anywhere. |
| `budget-alert` ↔ `budget-alerts` | 168 vs 156 lines | Plural drops some logic | Compare scheduling: singular runs `0 9 * * *`, plural runs `30 8 * * *`. Likely overlapping coverage — confirm whether both target same user set or split by feature. |
| `proposal-followup` ↔ `proposal-followups` | 104 vs 132 lines | Plural adds `richSummaryTemplate`, `buildUnsubscribeUrl` | Plural has unsub + summary refactor. Singular probably legacy. |
| `milestone-reminder` ↔ `milestone-reminders` | 89 vs 129 lines | Same imports, just larger | Plural likely extends singular. Confirm with diff. |

**Each pair has been kept в repo для history; this map is a review prompt, not a delete order.** Per Ramiz's "do not destruct" rule for shared state, the dedup PR (if any) must be a code-review PR с explicit choice per pair.

---

## Suspect triplets / quads (overlapping function names)

These are name-similarity hits — semantic overlap is plausible но not confirmed без reading code.

### Invoice reminder family (4 candidates)

```
invoice-reminders         0 9 * * *
invoice-reminders-auto    0 10 * * *
auto-invoice-reminders    0 9 * * *
send-payment-reminders    0 10 * * *
```

Same hour buckets (0 9 / 0 10), names suggest "reminders" + "auto" suffix prefix-collision. High dedup probability if 2-3 are wrappers around the same business logic.

### Recurring invoice generation (2 candidates)

```
recurring-invoices            0 6 * * *
generate-recurring-invoices   0 6 * * *
```

Identical schedule `0 6 * * *` + nearly-identical purpose names. **Very high probability one is dead duplicate.**

### Weekly recap (3 candidates)

```
weekly-summary  0 8 * * 1
weekly-digest   0 8 * * 1
friday-summary  0 16 * * 5
```

`weekly-summary` + `weekly-digest` identical schedule (Monday 08:00) — almost certainly overlapping. `friday-summary` independent (Friday end-of-week).

### Greetings (3 candidates)

```
client-greetings         0 8 * * *
special-dates-greeting   0 8 * * *
client-anniversary       0 8 * * *
```

All daily 08:00 — different events (birthday vs anniversary vs holidays), but may consolidate to one orchestrator route + per-type triggers internally.

### Renewal family (3 candidates)

```
renewal-alerts             0 9 * * *
renewal-reminders          0 8 * * *
contract-renewal-alerts    0 8 * * *
```

`contract-renewal-alerts` likely subsumes `renewal-alerts`. `renewal-reminders` may be different (user-facing nudge vs ops alert).

---

## Proposed dedup target (estimated)

Conservative scenario (only singular/plural drops + recurring-invoices dup) → **97 → ~92** (drop 5). Не радикально, but easy win.

Aggressive scenario (full review of triplets/quads + family consolidation) → **97 → ~65-70** (drop ~25-30). Material headroom for cron quota.

Either way, the **bigger fix** is restoring scheduled execution для всех crons — dedup alone won't help if Vercel scheduler caps fire-rate independently of count. Recommend opening Vercel support ticket с screenshots from TIMER-DIAGNOSIS.md showing 10/97 fire-rate.

---

## What I did NOT do

- Did NOT delete any cron entry from `vercel.json` (would risk losing live business logic; needs per-pair code review).
- Did NOT delete any `src/app/api/cron/*` route handler (same risk).
- Did NOT modify Vercel project settings (cron toggle, deployment protection, env vars).
- Did NOT force-push to existing branches.
- Did NOT trigger any cron manually via Vercel UI Run button (browser click was logged, but no notification side-effect appeared — likely UI throttled or required confirmation dialog которое не появилось).

---

## Recommended next steps for Ramiz

1. **Vercel support ticket** — ask why only 10/97 scheduled crons fire on Pro plan. Screenshots в `cron-04-7d-window.png` + `cron-05-7d-only-10-of-97.png`. Lever: this affects billing-critical jobs (`auto-stop-timers`, `auto-invoice-reminders`, etc.).

2. **Per-pair dedup PR** — `chore(crons): dedupe singular/plural duplicates`. Touch 4 pairs explicitly. Each entry в PR description: "kept X because [reason]; dropped Y because [reason]".

3. **Investigate recurring-invoices duplicate** — same schedule, near-identical name. Very likely safe drop.

4. **24h GlobalTimerBar warning shipped** в branch `timer-defensive` (commit `94023639`) — defensive surface against ANY future cron drop, не зависит от scheduler fix.

— Agent 5, 2026-05-29
