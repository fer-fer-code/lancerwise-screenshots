# RLS Gaps — Identified

Ranked по severity. Verified exploit attempts noted с anon-key REST calls против production.

---

## P0 LAUNCH BLOCKER — `invoices` table cross-user leak via "Portal access by token" policy

### What

Policy `"Portal access by token"` on `invoices`:
```sql
CREATE POLICY "Portal access by token" ON public.invoices
  FOR SELECT
  TO public
  USING (portal_token IS NOT NULL);
```

`portal_token` is **auto-generated on every invoice insert** (per `src/types/index.ts` Invoice type + INSERT statements в codebase). So **every real invoice has a non-null token**. The policy evaluates `true` для all of them.

Permissive SELECT policies are OR'd. The other invoices policy (`auth.uid() = user_id`) fails для anon role (auth.uid() is null). This portal policy fills the gap with a no-op check.

### Exploit (verified)

```bash
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/invoices?select=*&limit=3"
# Returns 3 invoices с user_id, total, payment_instructions, stripe_payment_id, items, ...
```

Currently exposes **30 invoices** (test data). At launch с real users this would be **every invoice ever created** to **any unauthenticated visitor** of the API.

### Columns exposed (full list)

`id, user_id, client_id, project_id, invoice_number, status, items (JSON), subtotal, total, tax_amount, tax_percent, tax_rate, discount_percent, discount_value, discount_type, currency, exchange_rate, amount_in_base_currency, issue_date, due_date, paid_at, payment_method, payment_reference, payment_terms, payment_instructions, stripe_payment_id, late_fee_amount, late_fee_pct, late_fee_grace_days, late_fee_note, late_fee_applied, late_fee_applied_at, late_fee_percent, notes, private_notes, portal_token, reminder_count, reminder_log, reminder_sent_at, last_payment_reminder_at, last_escalation_at, last_viewed_digest_at, sent_at, sent_to_email, email_count, viewed_at, activity_timeline, disputes, payment_history, nudge_state, payment_plan, platform, tags, created_at, updated_at`

`private_notes` is explicitly named private. `payment_instructions` (bank details, payment method) sensitive. `stripe_payment_id` enables Stripe payment lookup attacks.

### Impact

- **Cross-user data exposure** — any visitor can read all users' invoices, mining business intelligence (revenues, client relationships, payment patterns)
- **User enumeration** — `user_id` exposed enables building list of all freelancers using LancerWise
- **Financial PII leak** — payment details, totals, methods
- **Compliance** — GDPR Article 32 (security of processing) violation за minimum. Privacy Policy "We do not sell or share your data" undermined.

### Intent (what the policy SHOULD do)

Allow a client с the portal URL `https://lancerwise.com/portal/invoices/[token]` к view their **own** invoice without auth. The token is the secret — knowing it should be sufficient.

### Recommended fix (3 options, ranked)

**Option A (preferred) — Server-side fetch only via service_role**

Drop the "Portal access by token" policy entirely. The portal endpoint at `/portal/invoices/[token]/page.tsx` should fetch using service_role server-side, validating the token directly:

```tsx
// server component
const supabase = createAdminClient()  // service_role
const { data: invoice } = await supabase
  .from('invoices')
  .select('*')
  .eq('portal_token', token)
  .maybeSingle()
if (!invoice) notFound()
```

Service_role bypasses RLS entirely. Portal token check happens in application code, not policy. **Most secure** — RLS не has к know about portal logic.

**Option B — Tighten policy к require WHERE clause match**

Change policy к require the request к filter by `portal_token`:

```sql
DROP POLICY "Portal access by token" ON invoices;
CREATE POLICY "Portal access by token" ON invoices
  FOR SELECT TO anon
  USING (portal_token = (current_setting('request.headers.x-portal-token'::text, true)));
```

Pass token via custom header. Anon SELECT requires knowledge of token. PostgREST evaluates `current_setting()` против runtime headers.

More fragile than Option A — depends on PostgREST current_setting behaviour and header injection-resistance.

**Option C — Mirror policy к add token-filter requirement**

Change qual к check token is in the request:

```sql
USING (portal_token IS NOT NULL AND id IN (
  SELECT id FROM invoices WHERE portal_token = current_setting('request.headers.x-token', true)
))
```

Sub-select-based check. Performs worse, same risk profile as B.

**Recommendation: Option A**. Drop the policy, move portal access к server-side service_role fetch. Aligns с existing pattern (admin routes use createAdminClient anyway).

### Acceptance criteria

- [ ] Anon SELECT against `invoices` returns 0 rows
- [ ] `/portal/invoices/[token]` page still works (client opens invoice via emailed link)
- [ ] Penetration re-test confirms exploit blocked

---

## P2 — Duplicate / redundant policies (cleanup, no security risk)

| Table | Duplicate count | Notes |
|---|---|---|
| `time_entries` | 2 policies, identical | "Users manage own time entries" + "Users manage their time entries" |
| `contracts` | 3 policies, all `auth.uid() = user_id` | Three near-identical "Users manage..." policies |
| `availability_blocks` | 2 | Look identical |
| `availability_dates` | 2 | One public-true, one user-scoped |

Cleanup task для post-launch security review. Not blocking.

---

## P3 — `availability_*` tables с blanket SELECT true (verify intent)

Some `availability_*` tables have `SELECT TO public USING (true)`. Returned empty in anon probe (empty tables) but if availability is meant к be private (e.g., showing only the dates you blocked, not the empty slots), policy needs tightening.

**Action:** Product review к confirm:
- `availability_dates` — public availability calendar (client picks time slot)? Intended public, OK.
- `availability_slots` — same.
- If these power /book/[user-slug] flow, policy correct as-is.
- If intended user-private — tighten.

---

## P3 — `community_*` tables `SELECT TO authenticated USING (true)`

Community feature: any authenticated user reads all community messages/profiles/rooms.

**Action:** Confirm with product whether community feature exists and is meant к be globally-visible. If it's not shipped or scoped к specific rooms, policies should reflect that.

---

## Not a gap

- `portfolio_items`, `rate_card_services`, `rate_card_settings` — public SELECT true is intentional (public-shareable resources)
- `contract_signatures INSERT TO public USING true` — intended for portal e-signing
- `intake_responses INSERT TO public USING true` — intended для intake form submissions
- `client_surveys UPDATE WHERE status=pending` — intended public survey response paths

These have rate-limiting + Turnstile elsewhere в the stack (per `src/middleware.ts`). Architectural choice, not RLS bug.

---

## Related

- RLS-COVERAGE-MATRIX.md
- SECURITY-CAMPAIGN-INPUT.md
- `tables-rls-state.tsv`, `all-policies.tsv` — raw data
