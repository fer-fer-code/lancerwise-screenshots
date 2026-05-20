# RLS Full Audit — Matrix

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Database:** `skfgwyzarrhhkzvltbgm.supabase.co` (production)
**Mode:** Read-only. Verified each candidate via actual anon-key REST exploit, не assumed от policy text.
**Scope:** ALL 410 public tables (vs earlier preview audit that targeted critical-by-name list)

---

## Methodology

1. Enumerated all 410 public tables from `pg_class`
2. Dumped all 524 RLS policies via `pg_policies`
3. Identified candidate suspicious policies (USING true, IS NOT NULL, no auth.uid check, role=public)
4. **Exploit-tested every single one of 410 tables** via anon-key REST call: `curl -H "apikey: $ANON" /rest/v1/$table?select=id`
5. Logged any table returning > 0 rows к anon as confirmed leak
6. For confirmed leaks, inspected exposed columns
7. For tables с 0 rows in test DB but suspicious patterns, classified as structural vulnerability

---

## Pen-test summary

**410 tables tested. 5 returned non-zero rows к anonymous role:**

| Table | Rows exposed (test DB) | Disposition |
|---|---|---|
| `invoices` | 30 | 🚨 **P0 leak** — already filed [#99](https://github.com/fer-fer-code/lancerwise/issues/99) |
| `proposal_drafts` | 1 | 🚨 **P0 leak** — filing now |
| `comm_templates` | 20 | ✅ Intentional (shipped starter templates, `is_default=TRUE`, `user_id=NULL`) |
| `proposal_templates` | 9 | ✅ Intentional (`is_builtin=TRUE`, `user_id=NULL`) |
| `project_templates_v2` | 4 | ✅ Intentional (`is_builtin=TRUE`, `user_id=NULL`) |

**Structural vulnerabilities** (no rows yet, but pattern is broken):

| Table | Issue | Disposition |
|---|---|---|
| `testimonials` | `is_public` defaults к TRUE + permissive policy `is_public=true` → first testimonial leaks | **P1 file preventive** |
| `subscription_events` | `subscription_id IS NULL OR EXISTS(...)` — NULL path leaks orphan events | **P2 file preventive** |

---

## Confirmed leaks — detail

### 1. `invoices` (filed #99)

Policy `"Portal access by token"` — `USING (portal_token IS NOT NULL)`. Since portal_token auto-generates on insert, every row matches. Anon SELECT * returns all 30 rows с 52 columns including `private_notes`, `payment_instructions`, `stripe_payment_id`, `user_id`. **Verified exploitable.**

### 2. `proposal_drafts` — NEW P0

Policy `"proposal_drafts_public_review"` — `USING (review_token IS NOT NULL)`. **Identical pattern к invoices bug.** Verified anon SELECT returned 1 row с 56 columns:
- Client PII: `client_name`, `client_email`, `client_industry`
- AI-generated proposal: `proposal` (full text), `sections`
- Business intelligence: `budget`, `client_budget`, `won_amount`, `win_probability`, `competitor_count`, `lost_reason`
- Sales pipeline: `status`, `client_decision`, `responded_at`, `accepted_at`, `rejected_reason`, `accepted_by_name`, `accepted_ip`
- User identifier: `user_id`
- Multiple tokens leaking: `portal_token`, `review_token`, `view_token`, `token`, `public_token`

**Exploit reproduction:**
```bash
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/proposal_drafts?select=*&limit=3"
# Returns full proposal records с client PII
```

Fix recipe: same as #99 — drop policy, move review-link access к service_role server-side fetch.

---

## Structural vulnerabilities — detail

### 3. `testimonials` — P1 preventive

4 permissive SELECT policies OR'd together:

```
public  SELECT  ((submitted_at IS NOT NULL) AND (is_public = true))
public  SELECT  (status = 'approved')
public  SELECT  (is_public = true)
public  SELECT  (is_approved = true)
```

`is_public` defaults к **TRUE**. Means **every testimonial с default values matches policy 3** = readable by anon as soon as it exists.

Currently 0 rows so no live leak, but the moment any user creates a testimonial (even draft, even unsubmitted, even unapproved), it becomes anon-readable.

Columns testimonials would expose include `user_id, client_id, client_name, client_company, client_role, client_avatar_url, client_title, content, rating, request_token, collection_token` — token leakage enables anyone к hijack testimonial collection flow.

**Fix recipe:** consolidate policies к single restrictive one. Likely intent was "anyone can read approved+public testimonials": `USING (status='approved' AND is_public=true)`. Drop the other 3 overlapping permissive policies.

### 4. `subscription_events` — P2 preventive

Policy:
```
USING ((subscription_id IS NULL) OR (EXISTS (...subscriptions s WHERE s.user_id = auth.uid())))
```

The `subscription_id IS NULL` path means: any event with NULL subscription_id is readable by anon. Currently 0 such rows. But webhook handlers могут insert events с NULL `subscription_id` (orphan or pre-subscription events), exposing them.

**Fix recipe:** tighten к require subscription_id be non-null, or audit insert paths к ensure subscription_id always set, or add WITH CHECK on inserts.

---

## Intentional public (confirmed safe by inspection)

These returned data к anon BUT data is meant к be public:

| Table | Public access rationale |
|---|---|
| `comm_templates` | Starter email templates shipped с product, `user_id=NULL` |
| `proposal_templates` | Starter proposal templates |
| `project_templates_v2` | Starter project templates |

Not bugs. Confirmed via column inspection (no PII, only template content).

---

## Empty in test DB но pattern needs verification (review с product)

These returned 0 rows because tables are empty в test DB, but policy patterns warrant product confirmation:

| Table | Policy | Verify intent |
|---|---|---|
| `availability_dates` | `SELECT TO public USING true` | Public-bookable calendar feature? |
| `availability_slots` | `SELECT TO public USING true` | Same |
| `availability_settings` | `is_public=true` | Same |
| `case_studies` | `is_public=true` | Public case-study display |
| `pricing_pages` | `is_published=true` | User-shareable pricing pages |
| `project_handoffs` | `is_public=true` | Public handoff doc share |
| `project_updates` | `is_public=true` | Public update feeds |
| `service_packages` | `is_active=true` | Shareable service catalog |
| `portfolio_items` | `SELECT TO public USING true` | Public portfolio display |
| `rate_card_services` | `SELECT TO public USING true` | Shareable rate cards |
| `rate_card_settings` | `SELECT TO public USING true` | Same |
| `intake_responses` | EXISTS (form owner check) | Intake form responses |
| `survey_responses` | EXISTS (survey owner check) | Survey responses |
| `community_messages` | `SELECT TO authenticated USING true` | Community chat global visibility |
| `community_profiles` | `SELECT TO authenticated USING true` | Same |
| `community_rooms` | `SELECT TO authenticated USING true` | Same |

These need a single product walkthrough к confirm intent. None are immediate exploit risk (tables are either empty, или logic-gated correctly, или meant к be public).

---

## Tables c RLS but ZERO policies (locked tight, no leak)

- `email_unsubscribe_log` — service_role-only access (webhook writes)
- `oauth_states` — service_role-only access (short-lived nonces)

Both correct as deny-by-default. Service role bypasses RLS, app code uses createAdminClient for these.

---

## Cross-references

- `PER-TABLE-FINDINGS.md` — detail per problem table
- `LAUNCH-BLOCKERS.md` — consolidated P0 list
- `raw-policies/all-policies.tsv` — full 524-policy dump
- `leak-results.tsv` — pen-test result rows
- `all-tables.txt` — 410-table enumeration
- Earlier preview audit: [`../agent1-rls-preview-audit/`](../agent1-rls-preview-audit/)
- Filed issues: [#99](https://github.com/fer-fer-code/lancerwise/issues/99) (invoices), new P0 (proposal_drafts) — file in this audit
