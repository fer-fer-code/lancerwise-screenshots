# Launch Blockers — Consolidated

What MUST be resolved before public traffic. Filed as GitHub issues. Cross-references к PER-TABLE-FINDINGS.md для detail.

---

## Tier 1 — Active anon SELECT exploits (cannot ship)

### #99 — `invoices` table leak

**Status:** Filed 2026-05-20 [AGENT 1]. Awaiting fix.
**Severity:** P0 / launch blocker
**Verified exploit:** ✓ — 30 rows currently exposed, 52 columns including `private_notes`, `payment_instructions`, `stripe_payment_id`
**Fix recipe:** drop `"Portal access by token"` policy, move `/portal/invoices/[token]` к service_role server-side fetch
**Effort:** ~1h
**See:** [#99](https://github.com/fer-fer-code/lancerwise/issues/99) + `../agent1-rls-preview-audit/GAPS-IDENTIFIED.md`

### NEW — `proposal_drafts` table leak

**Status:** Filing as separate issue in this batch.
**Severity:** P0 / launch blocker
**Verified exploit:** ✓ — 1 row currently exposed, 56 columns including full proposal text + client PII + 5 tokens
**Faulty policy:** `proposal_drafts_public_review` using `(review_token IS NOT NULL)` — identical pattern к #99
**Fix recipe:** same — drop policy + service_role server-side fetch для review URL
**Effort:** ~1h (single file change + policy drop)
**See:** PER-TABLE-FINDINGS.md § proposal_drafts

---

## Tier 2 — Structural vulnerability (no live exploit, would leak on first row)

### NEW — `testimonials` table

**Status:** Filing P1 в this batch.
**Severity:** P1 / pre-launch fix recommended (currently 0 rows, but pattern broken)
**Issue:** `is_public DEFAULT TRUE` + permissive `USING (is_public=true)` policy. First testimonial created leaks к anon (client name, email, content, request tokens).
**Fix recipe:** drop 3 of 4 overlapping policies, keep restrictive one. Change column default to FALSE. Effort ~30min.
**Why pre-launch:** Russian launch will produce testimonials early (marketing-encouraged) — leak goes live immediately.

---

## Tier 3 — Structural risk (file as P2 post-launch)

### NEW — `subscription_events` table

**Severity:** P2 / post-launch acceptable
**Issue:** Policy `(subscription_id IS NULL) OR (EXISTS ...)` — orphan events с NULL subscription_id readable by anon.
**Currently:** 0 rows match. Risk is forward-looking — depends on webhook handler insert behaviour.
**Fix:** drop `IS NULL` clause from policy. Effort ~10min, low risk.

---

## Combined pre-launch fix scope

| Issue | Effort | Owner |
|---|---|---|
| #99 invoices | ~1h | [AGENT 2] (assigned) |
| NEW proposal_drafts | ~1h | TBD |
| NEW testimonials | ~30min | TBD |
| **Total** | **~2.5h** | |

Plus #93 (/work/time N+1) and #94 (/settings N+1) from earlier preventive scan, both pre-launch:
- #93: ~6-8h
- #94: ~3-4h

**Full pre-launch security + perf backlog: ~12-15h focused work.**

---

## Acceptance criteria (cross-cutting)

After all fixes:
- [ ] Re-run 410-table pen-test (script outline in PER-TABLE-FINDINGS.md) — confirm only intentional public tables return rows
- [ ] Anon SELECT on `invoices`, `proposal_drafts`, `testimonials` returns 0 rows
- [ ] `/portal/invoices/[token]` and review-link URLs (`/proposals/review/[token]`) still work
- [ ] Sentry capture instrumented (#82 dependency, або at least manual verification)
- [ ] Penetration-test as final gate, не RLS reading alone

---

## Not on this list

- Public-intentional tables (`portfolio_items`, `rate_card_*`, `comm_templates`, etc.) confirmed safe
- Authenticated-only tables (`community_*`) — verify product intent post-launch
- "Empty in test DB" tables — verify with product walkthrough, no immediate exploit risk

---

## Cross-references

- FULL-AUDIT-MATRIX.md — complete inventory
- PER-TABLE-FINDINGS.md — detail per table
- raw-policies/all-policies.tsv — source data (524 policies)
- leak-results.tsv — pen-test output
- Earlier preview audit: `../agent1-rls-preview-audit/`
