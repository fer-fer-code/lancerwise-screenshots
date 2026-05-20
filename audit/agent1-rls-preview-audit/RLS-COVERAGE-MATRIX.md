# RLS Coverage Matrix

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Database:** `skfgwyzarrhhkzvltbgm.supabase.co` (production)
**Mode:** Read-only audit via session pooler. No mutations.
**Method:** `pg_class` + `pg_policies` introspection + anon-key exploit verification

---

## Top-line numbers

| Metric | Count |
|---|---|
| Public tables | **410** |
| Tables с RLS enabled | **410 (100%)** |
| Tables с RLS but ZERO policies | **2** (effectively locked для all roles except service_role) |
| Tables exposing data к anon role | **1 (`invoices`) — confirmed P0 leak** |
| Total policies | 524 |

RLS coverage is **excellent** structurally — every public table has RLS enabled. The vulnerability is in policy logic, not coverage.

---

## Tables с RLS but no policies (potential UX bug, not leak)

- `email_unsubscribe_log` — likely accessed only by edge function с service_role (which bypasses RLS). Benign.
- `oauth_states` — short-lived OAuth nonces; service_role-only writes/reads. Benign.

Neither exposes data; both work as intended (deny-by-default).

---

## Critical tables — policy summary

### Healthy patterns

| Table | Policies | Pattern |
|---|---|---|
| `profiles` | 3 | SELECT/UPDATE gated by `auth.uid() = id`; INSERT for service_role |
| `clients` | 1 | ALL gated by `auth.uid() = user_id` |
| `time_entries` | 2 (duplicate) | ALL gated by `auth.uid() = user_id` |
| `contracts` | 3 (triplicate!) | ALL gated by `auth.uid() = user_id` |
| `invoice_payments` | (covered) | Gated by inherited invoice user_id |
| `subscriptions` | (covered) | Gated by user_id |
| `ai_usage_log` | 1 | SELECT gated by `auth.uid() = user_id` |
| `projects` | (covered) | Gated by user_id |

Cleanup opportunity: **duplicate policies на `time_entries` (2) and `contracts` (3)** add no security value, just review surface. Not a leak.

### `invoices` — 🚨 P0 LEAK

Two policies:

1. **`Users manage own invoices`** — `ALL` cmd, `auth.uid() = user_id`. Correct.
2. **`Portal access by token`** — **`SELECT` cmd, `(portal_token IS NOT NULL)`** — **❌ ALLOWS ANON TO SELECT ALL INVOICES**

Policies on `cmd = SELECT` are PERMISSIVE (ORed). For anon role attempting `SELECT * FROM invoices`:
- Policy 1 fails (auth.uid() is null для anon)
- Policy 2 evaluates `portal_token IS NOT NULL` against every row — true для все real invoices (token auto-generated on insert)
- Anon receives **all invoices** в the DB

Verified exploit:
```bash
curl -H "apikey: $ANON_KEY" \
  https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/invoices?limit=3
# Returns 3 invoices с user_id, total, items, payment_instructions, etc.
```

Total rows currently exposed: 30 (test data). At production scale this would be every invoice ever created.

### Tables с blanket-true policies (potentially OK)

| Table | Role | Cmd | Notes |
|---|---|---|---|
| `availability_dates` | public | SELECT `true` | Empty в practice (returned []) — but policy needs review |
| `availability_slots` | public | SELECT `true` | Same |
| `community_messages` | authenticated | SELECT `true` | Intended public community feed |
| `community_profiles` | authenticated | SELECT `true` | Same |
| `community_rooms` | authenticated | SELECT `true` | Same |
| `portfolio_items` | public | SELECT `true` | Intentional — portfolio is public-facing |
| `rate_card_services` | public | SELECT `true` | Likely intentional — rate cards are shareable |
| `rate_card_settings` | public | SELECT `true` | Same |

These all returned empty arrays via anon query (probably empty tables or other implicit filters). **Worth manual product review** к confirm intent matches policy.

### Public INSERT policies (write-side)

| Table | Cmd | Notes |
|---|---|---|
| `contract_signatures` | INSERT | "Anyone can create a signature" — intended for portal e-sign flow |
| `intake_responses` | INSERT | Intake form submissions от public |
| `client_surveys` | UPDATE | Status=pending updates by public — intake/survey flows |

These are intended public-write endpoints. Review к confirm input validation prevents abuse (rate-limit, captcha).

---

## Detailed table → RLS state inventory

Full data in `tables-rls-state.tsv` (410 rows × 4 columns: name, rls_enabled, rls_forced, policy_count). All 524 policy definitions в `all-policies.tsv`.

## Related

- `GAPS-IDENTIFIED.md` — the P0 + secondary issues with remediation
- `SECURITY-CAMPAIGN-INPUT.md` — feeds into future security campaign scope
