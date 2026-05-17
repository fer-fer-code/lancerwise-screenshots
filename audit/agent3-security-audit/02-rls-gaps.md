# [AGENT 3] Security audit — Area 2: RLS Policy Gaps

**Findings**: 2 × P1, 5 × P2, 0 × P0

## Coverage baseline

```sql
SELECT COUNT(*) FROM pg_tables
WHERE schemaname='public' AND rowsecurity=true;
→ 407

SELECT COUNT(*) FROM pg_tables
WHERE schemaname='public' AND rowsecurity=false;
→ 0
```

**100% RLS coverage on public schema tables.** No table is left RLS-disabled.

## P1 findings — Permissive `ALL` policies with `qual=true`

### P1-A: `portal_messages` — Public access portal messages (CRUD)

```sql
-- pg_policies row:
tablename     = 'portal_messages'
policyname    = 'Public access portal messages'
cmd           = 'ALL'
qual          = true
with_check    = true
```

**What it does**: Grants the anonymous (anon) role permission to SELECT/INSERT/UPDATE/DELETE
**any** row in `portal_messages` with no filter whatsoever. The other 4 policies on the
same table (user-scoped, sender='client'-scoped) are irrelevant — PostgreSQL combines
RLS policies with OR, so this permissive one wins for any operation.

**Exploit**:
```javascript
// Attacker code, using public NEXT_PUBLIC_SUPABASE_ANON_KEY:
const supabase = createClient(SUPABASE_URL, ANON_KEY)

// Read ALL messages across ALL portals:
const { data } = await supabase.from('portal_messages').select('*')

// Modify any specific message:
await supabase.from('portal_messages')
  .update({ message: 'malicious content' })
  .eq('id', '<victim_message_id>')

// Or delete-bomb the whole table:
await supabase.from('portal_messages').delete().neq('id', '<random>')
```

**Current exposure**: Table has **0 rows** at audit time (pre-launch). Zero data exposed today, but exploit becomes immediate the moment first client portal goes live.

**Recommended fix**:

```sql
-- Drop the permissive policy
DROP POLICY "Public access portal messages" ON public.portal_messages;
DROP POLICY "Public can read messages by token" ON public.portal_messages;  -- same issue (SELECT qual=true)

-- The existing "Public can insert client messages" (INSERT with_check sender='client') stays.
-- For public READ, gate on token via a function/header rather than RLS=true:
CREATE POLICY "Public read by portal_token header" ON public.portal_messages
  FOR SELECT TO anon
  USING (
    portal_token = (current_setting('request.headers', true)::jsonb ->> 'x-portal-token')
  );
```

OR — and this is the more typical pattern — disallow the anon role entirely on
portal_messages, route ALL public access through `/api/portal/[token]/messages`
which uses `createAdminClient()` (service_role) + validates token in code.

**Effort**: 30 min (drop 2 policies + add server-side validation in the 1 known route handler).

---

### P1-B: `project_surveys` — Anyone can view and submit survey by token (ALL)

```sql
tablename     = 'project_surveys'
policyname    = 'Anyone can view and submit survey by token'
cmd           = 'ALL'
qual          = true
with_check    = true
```

**Same pattern as P1-A.** Policy name claims token-scoping but neither qual nor
with_check enforces it.

**Current exposure**: Table has 0 rows. Same pre-launch shielding as P1-A.

**Recommended fix**: Same as P1-A — drop the permissive policy, gate via service-role
route handler + token validation in code. Or rewrite RLS to use
`current_setting('request.headers', true)::jsonb ->> 'x-survey-token'`.

**Effort**: 30 min.

---

## P2 findings — Permissive SELECT policies (anonymous data enumeration)

These tables allow ANY anonymous request to SELECT (read) ALL rows. The
"token" gating exists only in policy NAME, not in policy SQL. Defense depends
entirely on the app code consistently filtering by token — bypass with direct
Supabase client query is trivial.

### P2-A: `client_portals` — Public view portal by token (SELECT)
```sql
qual = true (SELECT only — INSERT/UPDATE/DELETE properly scoped to auth.uid)
```
**Impact**: Anyone can enumerate ALL client portal records (token, user_id, client_id, settings, etc.) using the public anon key.
**Fix**: Drop policy; route public read through `/api/client-portals/public/[token]` with service role.

### P2-B: `client_surveys` — Public can view surveys by token (SELECT)
Same shape as P2-A. Anyone can enumerate ALL surveys.

### P2-C: `portal_files` — Public view portal files (SELECT)
Same shape. Anyone can enumerate ALL portal file metadata (filename, size, owner).

### P2-D: `survey_responses` — Public can view responses by token (SELECT)
Same shape. Anyone can enumerate ALL customer survey responses across all users — privacy leak.

### P2-E: `testimonial_requests` — Public submit via token 797 (SELECT)
Same shape. Anyone can enumerate all pending testimonial requests.

### P2-F: `quotes` — Public view quotes by token (SELECT)
```sql
qual = (status = ANY (ARRAY['sent'::text, 'accepted'::text, 'declined'::text]))
```
Slightly better than `qual=true` — at least filters by status — but still allows
enumeration of ALL sent/accepted/declined quotes across all users. Quote details
(client, total amount, line items) leak.

**Effort for all 6**: 1 hour to drop policies + audit corresponding `/api/.../public/[token]/route.ts` handlers ensure they all use admin client + token equality filter.

---

## Acceptable wide-open SELECT policies (NOT findings — intentional public)

These also have `USING (true)` for SELECT but are public-by-design:

| Table | Why public is correct |
| ----- | -------------------- |
| `availability_dates` | Public availability calendar (`/available/[handle]`) |
| `availability_slots` | Same |
| `portfolio_items` | Portfolios shown at `/wall/[username]` are public profiles |
| `rate_card_services` | Public rate cards at `/rates/[slug]` |
| `rate_card_settings` | Same |
| `community_messages` | Community feature, auth-required (`TO authenticated`) |
| `community_profiles` | Same |
| `community_rooms` | Same |
| `profiles` (INSERT) | "Service role can insert profiles" — only service_role bypasses; effectively no-op for anon |

These DO NOT need fixing. The exploit-relevant ones are the 7 above (P1×2 + P2×5+1).

---

## INSERT-NULL policies (low risk if validated in code)

Several tables allow public INSERT with `with_check=true`:

```
contract_signatures | Anyone can create a signature | INSERT | with_check=true
intake_responses    | Public submit responses        | INSERT | with_check=true
portal_messages     | Public can insert client msgs  | INSERT | with_check=(sender='client')
survey_responses    | Public can insert responses    | INSERT | with_check=true
community_messages  | Auth users can insert messages | INSERT | with_check=NULL → ✓ (auth-required)
```

These are intentional public-submit endpoints (form submissions, survey responses,
contract signing). Safe IF the corresponding API routes validate:
- Token presence (matches a known parent row)
- Rate limiting (anti-spam)
- Input sanitization

Mostly OK — but pair with Area 3 finding "contact forms have no rate-limit / Turnstile"
for spam-write-amplification scenario.

---

## Methodology

Queries used:

```sql
-- 1. Tables without RLS
SELECT tablename FROM pg_tables
WHERE schemaname='public' AND rowsecurity=false;
-- 0 rows

-- 2. Overly permissive policies (qual=true OR with_check NULL)
SELECT schemaname || '.' || tablename || ' | ' || policyname || ' | cmd=' || cmd
     || ' | qual=' || COALESCE(qual::text, 'NULL')
FROM pg_policies
WHERE schemaname='public'
  AND (qual::text = 'true' OR qual IS NULL OR with_check::text = 'true')
ORDER BY tablename, policyname;
-- 24 rows returned, categorized above

-- 3. ALL-cmd permissive (highest risk)
SELECT tablename, policyname, cmd, qual::text, with_check::text
FROM pg_policies
WHERE schemaname='public' AND cmd='ALL'
  AND (qual::text = 'true' OR qual IS NULL);
-- 2 rows: portal_messages + project_surveys (the P1 findings)
```

Raw output saved next to this file (see `02-rls-raw-policies.txt`).
