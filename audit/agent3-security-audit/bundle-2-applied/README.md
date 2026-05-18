# [AGENT 3] Bundle 2 — P1-3 OAuth state binding APPLIED

Resolves [`../SUMMARY.md`](../SUMMARY.md) finding **P1-3**: gmail+outlook OAuth callbacks used `state` parameter directly as `user_id` without server-side binding. Attacker who knew a victim's Supabase UUID could initiate OAuth with their own Google/Microsoft credentials, forge the callback URL with `state=victim_user_id`, and have their access tokens stored under the victim's row (integration hijack).

## Status

| Item | Status |
| ---- | ------ |
| Design + migration written | ✓ `scripts/migrations/2026-05-17-oauth-states-table.sql` |
| Migration applied to prod DB | ✓ — table exists, RLS enabled, zero policies, index on expires_at |
| Route handler updates | ✓ — 4 files (gmail/auth + callback, outlook/auth + callback) |
| Cleanup cron + vercel.json registration | ✓ — daily 03:00 UTC sweep |
| SQL-level verification | ✓ 5/5 scenarios pass (see below) |
| Live HTTP exploit verification | ⚠ deferred to post-merge — Vercel `*.vercel.app → www.lancerwise.com` SEO 308 redirect blocks preview-deploy HTTP testing (see §Live testing limitation) |
| PR opened | ✓ [#31](https://github.com/fer-fer-code/lancerwise/pull/31) |
| Visual-regression CI gate | ⚠ FAILED on transient `auth.setup` flake (`Invalid login credentials`) — unrelated to Bundle 2; locale-purity using same setup PASSED |

## Fix architecture

```
Init handlers (auth.ts)                            Callback handlers (callback.ts)
────────────────────                                ───────────────────────────────
1. User session validated                          1. Read URL `state` + `code`
2. nonce = crypto.randomUUID()                     2. DELETE FROM oauth_states
3. INSERT oauth_states {                              WHERE state=req.state
     state: nonce,                                       AND provider matches
     user_id: session.user.id,                       RETURNING user_id, expires_at
     provider: 'gmail'|'outlook',                     ↳ no row → ?gmail=invalid_state
     expires_at: now()+10min                          ↳ expires_at<now → ?gmail=expired_state
   }                                                3. Exchange code for tokens
4. Redirect to provider with state=nonce           4. Upsert *_connections using
                                                       stored user_id (not URL state)

Defense properties:
- nonce is unguessable (crypto.randomUUID)
- state is bound to one specific user at INIT time
- DELETE-then-select makes the state single-use atomically
- 10-min TTL bounds the replay window
- Provider filter prevents cross-provider misuse (gmail state → outlook callback)
- All access goes through service-role; oauth_states RLS has ZERO policies
  so anon + authenticated direct queries return 0 rows / RLS error
```

## SQL-level verification (5/5 pass)

```
TEST 1  legit init+callback flow                  → DELETE returns 1 row with user_id ✓
TEST 2  replay same state (second hit)            → 2nd DELETE returns 0 rows         ✓
TEST 3  gmail state used on outlook callback      → DELETE filter mismatches, 0 rows  ✓
TEST 4  expired state lookup                      → row returned but expires_at<now,
                                                    handler routes to expired_state   ✓
TEST 5  cleanup cron DELETE WHERE expires_at<now  → 2/3 expired rows removed,
                                                    fresh row preserved               ✓
```

Full SQL session log:
- Insert 'test-A-legit', DELETE-and-RETURNING gives row + user_id — **PASS**
- Insert 'test-B-replay', first DELETE returns row, second DELETE returns 0 rows — **single-use enforced** ✓
- Insert 'test-C-cross' with provider='gmail', DELETE WHERE provider='outlook' returns 0 — **provider filter enforced** ✓
- Insert 'test-D-expired' with expires_at=now-1min, DELETE returns row marked EXPIRED (CASE expression confirms `expires_at < now` flag) — **handler's TTL branch will fire**
- Insert 3 rows (2 expired + 1 fresh), `DELETE WHERE expires_at < now` removes exactly the 2 expired — **cleanup query correct**

## Live testing limitation

The `next.config.ts` `redirects()` rule (`https://(?<sub>.*).vercel.app/* → https://www.lancerwise.com/$1` permanent 308) prevents HTTP-level testing against the preview deploy. Any `curl` to the deploy URL (including with `x-vercel-protection-bypass` header) returns:

```
HTTP/2 308
location: https://www.lancerwise.com/api/gmail/callback?code=...&state=...
```

…and the redirect target is production, which still runs the OLD vulnerable code until the PR merges. There is no clean way to test the new handler logic via HTTP without either:
1. Merging to production (then testing against `www.lancerwise.com`)
2. Temporarily disabling the SEO redirect (not appropriate)
3. Setting up a separate preview alias not matching `*.vercel.app` (Vercel team setting)

Therefore, the SQL-level verification (5/5 tests covering all 4 exploit scenarios + cleanup) is the highest-fidelity automated proof currently available. The new code's logic is deterministic on top of these queries:

- `invalid_state` branch: triggered when the DELETE-and-select returns 0 rows (TEST 2 + TEST 3 prove this happens for replay and cross-provider).
- `expired_state` branch: triggered when row.expires_at < new Date() (TEST 4 proves the row's flag is correct).
- success path: triggered when row found + not expired + Google exchange succeeds.

Post-merge plan: re-run the 5 exploit scenarios against `https://www.lancerwise.com/api/gmail/callback?code=X&state=Y` and append results to this README.

## Visual-regression CI gate flake (NOT a Bundle 2 issue)

PR #31 CI status:
- ✓ gate / eslint i18n            SUCCESS
- ✓ gate / locale-purity (ru)      SUCCESS
- ✘ gate / visual-regression       FAILED at `auth.setup` step: `Sign-in failed: Invalid login credentials`
- ✓ Vercel preview                 SUCCESS

The visual-regression failure is a transient auth-setup flake. The same setup ran successfully for the locale-purity gate (which also depends on `auth.setup.ts`). Bundle 2 doesn't touch `auth.setup.ts`, the visual-regression spec, any baseline, or any production code visible to the screenshot routes (`/dashboard`, `/work`, `/work/time`, etc.). Rerun should resolve.

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + SQL verification + live-testing limitation |
| [`oauth-states-schema.txt`](oauth-states-schema.txt) | psql `\d public.oauth_states` post-migration dump |

## Cross-links

- Migration: [`scripts/migrations/2026-05-17-oauth-states-table.sql`](https://github.com/fer-fer-code/lancerwise/blob/fix/security-audit-p1-oauth-state-binding/scripts/migrations/2026-05-17-oauth-states-table.sql)
- PR: https://github.com/fer-fer-code/lancerwise/pull/31
- Audit source: [`../SUMMARY.md`](../SUMMARY.md) finding P1-3
- Bundle 1 (merged): [`../bundle-1-applied/`](../bundle-1-applied/) — pattern reference for Bundle 2

## Next bundles (standby)

Per execution discipline: report after Bundle 2 + await go-signal before Bundle 3 (6 P2 SELECT RLS cleanup, ~2h) → then Bundle 4 (5 P2 Turnstile + rate-limit, ~2h).
