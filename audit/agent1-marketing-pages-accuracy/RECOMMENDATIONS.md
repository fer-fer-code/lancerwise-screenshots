# Marketing Pages Accuracy — Recommendations

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Mode:** Read-only. Findings only. Per-task discipline — не creating fixes myself.

---

## Pre-launch — required

### Action 1 — Fix /changelog "LemonSqueezy migration in progress" stale claim

**Why:** Migration is complete (PR #75); public-facing claim is misleading.

**Suggested approach — pick one:**

**A) Minimal edit (recommended for speed):**

Find `src/app/changelog/page.tsx` and modify the Stripe entry:

```diff
- "Stripe payment integration — accept card payments directly through client portal (later removed; LemonSqueezy migration in progress)"
+ "Stripe payment integration — accept card payments directly through client portal (later removed; replaced by LemonSqueezy Merchant of Record для Pro plan billing)"
```

Effort: ~3 min.

**B) Full refresh + new entry (recommended if time available):**

Same edit as A, PLUS add fresh entry at top of changelog:

```ts
{
  date: '2026-05-19',
  title: 'LemonSqueezy now powers Pro plan billing',
  description: 'Pro plan subscriptions are now processed by LemonSqueezy as Merchant of Record. Stripe Connect remains available для users\' clients paying invoices online.',
  type: 'feature' // or whatever type field schema uses
}
```

Plus optional 4-5 more entries для May 11-20 work (P1-A perf migration, mobile crash fix, RLS audit, Privacy Policy corrections).

Effort: ~20-30 min.

**Recommendation: Option A pre-launch + Option B's additional entries как post-launch hygiene PR.**

File as P1 issue → assign owner → fix.

---

## Pre-launch — recommended (not blocking)

### Action 2 — Verify "12 AI tools" claim

**Why:** Multiple pages claim "12 AI tools" в Pro plan. Easy к verify it's accurate.

**Quick audit:**

```bash
find src/app/api/ai -name "route.ts" -type f | wc -l
```

If ≥ 12, claim is satisfied. If <12, copy needs adjustment.

Effort: ~2 min. Recommend before launch к avoid future "false advertising" claims.

### Action 3 — /faq "Stripe integration" clarification

**Why:** Wording could confuse readers between Stripe Connect (user-invoice payments) и SaaS billing (LemonSqueezy).

**Suggested edit к relevant FAQ Q:**

```diff
- "Yes. With Stripe integration on the Pro plan, clients receive a Pay Now button directly on their invoice and can pay by card instantly."
+ "Yes. The Pro plan includes Stripe Connect integration — your clients see a Pay Now button on their invoices and can pay by card instantly. Stripe handles client card payments; LancerWise's own billing is processed by LemonSqueezy."
```

Effort: ~3 min. Reduces user confusion about payment processors.

---

## Post-launch — acceptable timing

### Action 4 — Full changelog refresh

**Why:** 10 days of major work uncovered в changelog.

**Approach:** Add entries для:
- 2026-05-12 LemonSqueezy decision made
- 2026-05-19 LemonSqueezy live + Stripe-as-SaaS-billing removed
- 2026-05-19 Dashboard P1-A perf migration (PRs #84, #86) — 22 → 0 mount-time DB calls
- 2026-05-20 Invoice detail mobile Safari crash fix (PR #91)
- 2026-05-20 RLS cross-tenant security fix (PR #103)
- 2026-05-20 Privacy Policy LemonSqueezy + GDPR Art. 13(2)(d) corrections (PR #105)
- 2026-05-20 Hero verstka mobile RU fix (PR #83 + #105 indirectly)

Effort: ~30 min. Post-launch P2 backlog item.

### Action 5 — Blog post body translation к Russian

**Why:** Currently /blog index translated но individual blog post bodies remain English-only. Same pattern as Privacy/ToS translation gap. Known from Bug #023 series — explicitly deferred at that time.

**Approach:** Same as #106 (Privacy/ToS RU translation) — add namespace + wire через `getTranslations()`.

Effort: ~4-6h per post × N posts. Significant scope.

File as P2 post-launch — should follow #106 timeline.

---

## Cross-references

- PER-PAGE-FINDINGS.md
- LAUNCH-BLOCKERS.md
- #106 — Privacy/ToS RU translation (related blog translation deferral)
