# RLS Post-Fix Independent Verification — PASS

**Verifier:** [AGENT 1] (independent, не self-check)
**Date:** 2026-05-20
**Subject:** PR [#103](https://github.com/fer-fer-code/lancerwise/pull/103) — DROP POLICY для invoices (#99) + proposal_drafts (#100)
**Result:** ✅ **ALL 4/4 PASS — SAFE TO MERGE**

---

## Point 1 ✅ PASS — Anon SELECT invoices

```bash
curl -H "apikey: $ANON_KEY" \
  "https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/invoices?select=id"
```

Response: `HTTP 200`, `content-length: 2` (body `[]`), `content-range: */0`. Zero rows visible к anon — leak closed.

Cross-check: `?select=id&limit=100` also returns 0 rows.

## Point 2 ✅ PASS — Anon SELECT proposal_drafts

```bash
curl -H "apikey: $ANON_KEY" \
  "https://skfgwyzarrhhkzvltbgm.supabase.co/rest/v1/proposal_drafts?select=id"
```

Response: `HTTP 200`, `content-length: 2` (body `[]`), `content-range: */0`. Zero rows visible к anon — sibling leak closed.

## Point 3 ✅ PASS — Authed cross-tenant test

Fresh test user created via `supabase.auth.admin.createUser()` → magic link via `admin.generateLink({type: 'magiclink'})` → session token obtained via `verifyOtp({type: 'magiclink'})`.

Used a different test user (`qa+rlsverify-1779247854607@lancerwise.test`) от [AGENT 2]'s `test-phase10`, к ensure independent observation. Bypassed Turnstile correctly via admin generateLink pattern (per env update from orchestrator).

Query results as authed fresh user:
- `invoices`: **0 rows visible** (correct — fresh user has none)
- `proposal_drafts`: **0 rows visible** (correct — fresh user has none)
- No errors

RLS correctly isolates per-user: authed user sees only their own rows (zero для fresh), не cross-tenant data.

User cleanup: `admin.deleteUser()` successful.

## Point 4 ✅ PASS — Portal smoke

### `/portal/invoices/{portal_token}`
```
HTTP 200, 99,252 bytes
Body contains: "Invoice", "Client" (multiple instances)
```
Server-side service_role fetch works. Portal renders с invoice content.

### `/portal/proposal/{portal_token}`
```
HTTP 200, 114,697 bytes
Body contains: "Proposal", "Maria", "Web Development"
```
Service_role fetch correctly loads proposal record и renders full content к client.

### `/api/proposals/review/{review_token}`
```
HTTP 200, 4,121 bytes
JSON response includes: id, title, content (Executive Summary...)
```
API endpoint works for review-token-based public access.

### Note on `/proposals/review/{review_token}` direct URL
HTTP 307 → /login. This route is **auth-gated user view** (in (app)/ group), не a public portal. Not affected by policy drop. Behavior unchanged.

---

## Verdict

**ALL 4 verification points PASS.** Both anon leaks closed; cross-tenant isolation works; both public portal routes still render correctly via service_role bypass.

**Recommendation: SAFE TO MERGE PR #103.**

## Evidence files

- `anon-invoices-headers.txt` — raw response headers
- `anon-proposal-drafts-headers.txt` — raw response headers
- `cross-tenant-script.mjs` — script used (creates + deletes test user)
- `portal-invoice-200.html` — invoice portal render proof (truncated to first 5KB)
- `portal-proposal-200.html` — proposal portal render proof (truncated)
- `api-review-200.json` — API endpoint response (full body)

## Related

- PR [#103](https://github.com/fer-fer-code/lancerwise/pull/103) — the DROP POLICY fix
- Issue [#99](https://github.com/fer-fer-code/lancerwise/issues/99) — invoices leak (this verifies)
- Issue [#100](https://github.com/fer-fer-code/lancerwise/issues/100) — proposal_drafts leak (this verifies)
- Issue [#101](https://github.com/fer-fer-code/lancerwise/issues/101) — testimonials (still queued, separate fix)
- Issue [#102](https://github.com/fer-fer-code/lancerwise/issues/102) — subscription_events (P2 deferred)
- Earlier audit: [`../agent1-rls-full-audit/`](../agent1-rls-full-audit/)
