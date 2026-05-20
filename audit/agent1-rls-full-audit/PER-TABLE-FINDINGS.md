# Per-Table Findings — RLS Full Audit

Detailed findings per problem table. Issues already filed get `[FILED #X]` marker. New issues filed в same batch as this report.

---

## 🚨 P0 leaks (verified anon SELECT exploit)

### `invoices` — [FILED #99]

Status: **Filed**. Fix recipe: drop policy + service_role portal route. See [#99](https://github.com/fer-fer-code/lancerwise/issues/99).

### `proposal_drafts` — NEW P0

**Verified exploit:**
```bash
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/proposal_drafts?select=*&limit=3"
# 1 row currently — full proposal record exposed
```

**Faulty policy:**
```sql
CREATE POLICY "proposal_drafts_public_review" ON proposal_drafts
  FOR SELECT TO public
  USING (review_token IS NOT NULL);
```

`review_token` is generated for every proposal draft on insert. Policy evaluates true для все rows.

**Exposed columns (56 total):**
- **Client PII:** `client_name`, `client_email`, `client_industry`
- **Proposal content:** `proposal` (full AI-generated text), `sections`, `service_type`, `job_description`, `cover_color`, `pdf_theme`
- **Financial:** `budget`, `client_budget`, `amount`, `won_amount`, `currency`
- **Sales pipeline:** `status`, `client_decision`, `responded_at`, `accepted_at`, `accepted_by_name`, `accepted_ip`, `rejected_reason`, `decided_at`, `lost_reason`, `outcome`
- **Analytics:** `view_count`, `first_viewed_at`, `last_viewed_at`, `client_viewed_at`, `response_time_hours`, `competitor_count`, `win_probability`, `expected_close_date`
- **Follow-up state:** `follow_up_count`, `follow_up_sent_at`, `last_followup_at`, `client_response`, `client_response_note`, `client_responded_at`
- **Tokens (multiple!):** `portal_token`, `review_token`, `view_token`, `token`, `public_token` — any of these would allow direct portal hijack
- **User identifier:** `user_id` (full user enumeration)
- **AI flag:** `ai_generated`
- **Other:** `auto_archive`, `expires_at`, `sent_at`, `created_at`, `is_public`, `proposal_length`, `platform`, `project_type`

**Impact:**
- Competitive intelligence theft: rivals see all proposals' content, budgets, win_probability ratings
- Client PII leak: `client_name`, `client_email` exposed for every prospect
- Sales pipeline leak: `lost_reason`, `client_decision`, `rejected_reason` reveal business performance
- Token theft: any of 5 tokens enables direct portal access к "view as client" mode
- GDPR + Privacy Policy violation
- User enumeration via `user_id`

**Fix:** drop policy, use service_role server-side fetch в portal route. Same recipe as #99. Effort ~1h.

---

## P1 structural vulnerability (no live exploit, but pattern broken)

### `testimonials` — NEW P1

Currently 0 rows so no live leak, BUT structurally vulnerable. **Will leak as soon as первый testimonial created.**

**Multiple overlapping permissive SELECT policies (4 OR'd together):**

```sql
"Public can read submitted testimonials": ((submitted_at IS NOT NULL) AND (is_public = true))
"Public can view approved testimonials":  (status = 'approved'::text)
"Public can view public testimonials":    (is_public = true)
"Public view approved testimonials 797":  (is_approved = true)
```

**Default values:** `is_public DEFAULT TRUE`, `is_approved DEFAULT FALSE`, `status DEFAULT 'pending'`.

So **any new testimonial с defaults** matches policy `is_public=true` → readable by anon. Doesn't require submission, approval, или any explicit action.

**Schema (would-be-exposed columns):**
- `id, user_id, client_id, project_id` (user enumeration)
- `client_name, client_company, client_role, client_avatar_url, client_title, company` (full client PII)
- `content` (testimonial text)
- `rating, platform, project_type, project_name`
- `request_token, collection_token` ← **token theft enables hijacking testimonial-collection form**
- `is_public, is_featured, is_approved, featured, status, source`
- `submitted_at, request_sent_at, received_at, collected_at, created_at`

**Fix:** consolidate к one restrictive policy. Likely intent: "anyone can read approved AND public testimonials":
```sql
DROP POLICY "Public can read submitted testimonials" ON testimonials;
DROP POLICY "Public can view approved testimonials" ON testimonials;
DROP POLICY "Public can view public testimonials" ON testimonials;
DROP POLICY "Public view approved testimonials 797" ON testimonials;
CREATE POLICY "Public read approved public testimonials" ON testimonials
  FOR SELECT TO public
  USING (is_approved = true AND is_public = true AND status = 'approved');
```

Plus: change `is_public DEFAULT TRUE` → `DEFAULT FALSE` so opt-in not opt-out.

---

## P2 structural vulnerability

### `subscription_events` — NEW P2

```sql
USING ((subscription_id IS NULL) OR (EXISTS (... s.user_id = auth.uid())))
```

The `subscription_id IS NULL` clause means events without a subscription_id are readable by anyone (including anon). Currently 0 such rows.

**Risk profile:**
- LemonSqueezy webhook handler inserts subscription_events. Если any code path inserts с NULL subscription_id (e.g., webhook handling pre-subscription event), it becomes anon-readable.
- Low immediate risk because current code likely doesn't insert NULL rows, но defensive coding suggests tightening.

**Exposed if pattern broken:**
- Event type (subscription.created, payment.succeeded, etc.)
- raw_payload (webhook body — could include customer email, transaction amounts)
- subscription_id (NULL by definition в leak path)
- created_at

**Fix:** require subscription_id NOT NULL, или remove the `IS NULL` branch from policy:
```sql
DROP POLICY "users read own subscription events" ON subscription_events;
CREATE POLICY "users read own subscription events" ON subscription_events
  FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.id = subscription_events.subscription_id
      AND s.user_id = auth.uid()
  ));
-- (drops the unconditional IS NULL OR branch)
```

---

## Intentional public access (confirmed safe)

These tables returned data к anon but are **product-intentional**:

| Table | Why exposed | Verified safe |
|---|---|---|
| `comm_templates` | Starter email templates shipped с product (`is_default=TRUE`, user_id=NULL) | ✓ no PII |
| `proposal_templates` | Starter proposal templates (`is_builtin=TRUE`, user_id=NULL) | ✓ no PII |
| `project_templates_v2` | Starter project templates (`is_builtin=TRUE`, user_id=NULL) | ✓ no PII |

These are essentially product seed data. Not a bug.

---

## Empty in test DB — verify intent with product

These returned 0 rows during pen-test because empty в test DB, но policy patterns warrant product walkthrough:

| Table | Policy | Likely product intent |
|---|---|---|
| `availability_dates` | `SELECT TO public USING true` | Public-bookable calendar (clients pick slots) |
| `availability_slots` | `SELECT TO public USING true` | Same |
| `availability_settings` | `is_public=true` | Show user's calendar availability publicly |
| `case_studies` | `is_public=true` | Public case-study display |
| `pricing_pages` | `is_published=true` | User-shareable pricing pages |
| `project_handoffs` | `is_public=true` | Shareable handoff docs |
| `project_updates` | `is_public=true` | Public client updates |
| `service_packages` | `is_active=true` | Shareable service catalog |
| `portfolio_items` | `SELECT TO public USING true` | Public portfolio display |
| `rate_card_services` | `SELECT TO public USING true` | Public rate card sharing |
| `rate_card_settings` | `SELECT TO public USING true` | Same |
| `intake_responses` | EXISTS (form owner) | Owner-only reads + public submission |
| `survey_responses` | EXISTS (survey owner) | Same |
| `community_messages` | `SELECT TO authenticated USING true` | Community chat (если shipped) |
| `community_profiles` | `SELECT TO authenticated USING true` | Same |
| `community_rooms` | `SELECT TO authenticated USING true` | Same |

**Action:** Ramiz product walkthrough к sign off on each. Likely all intentional, но worth 30-min review since the `is_public=true` family is exactly the pattern that bit invoices и proposal_drafts (although these are correctly logic-gated, не token-gated).

---

## Tables RLS-enabled but zero policies (locked, no leak)

- `email_unsubscribe_log` — service_role writes only (CF Email Routing webhook receiver)
- `oauth_states` — service_role short-lived nonces

Correct deny-by-default; service_role bypasses.

---

## Cross-references

- FULL-AUDIT-MATRIX.md — top-level summary
- LAUNCH-BLOCKERS.md — consolidated P0/P1 list
- raw-policies/all-policies.tsv — full 524-policy data
- leak-results.tsv — pen-test row counts
- Filed issues: [#99](https://github.com/fer-fer-code/lancerwise/issues/99) (invoices) + new P0/P1/P2 от this audit
