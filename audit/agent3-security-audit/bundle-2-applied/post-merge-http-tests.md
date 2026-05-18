# Post-merge HTTP exploit verification — Bundle 2 (P1-3)

PR #31 merged as `99255f19` at 2026-05-18T03:05:46Z. Production deploy
landed READY shortly after. Below: live HTTP tests against
`https://www.lancerwise.com` — the actual production endpoint now
runs the new server-bound state nonce code.

All 5 exploit scenarios from the [README](README.md) re-verified at the HTTP layer.

## Result: 5/5 PASS

| # | Scenario | Expected redirect | Observed | Verdict |
|---|----------|-------------------|----------|---------|
| 1 | `GET /api/gmail/callback?code=fake&state=non-existent-1779073858` | `Location: …/settings?gmail=invalid_state` | `Location: https://www.lancerwise.com/settings?gmail=invalid_state` HTTP 307 | ✓ |
| 2 | `GET /api/outlook/callback?code=fake&state=non-existent-1779073858` | `?outlook=invalid_state` | `Location: https://www.lancerwise.com/settings?outlook=invalid_state` HTTP 307 | ✓ |
| 3 | Insert state with `expires_at = now - 5min`, hit `/api/gmail/callback` with it | `?gmail=expired_state`; row consumed | `?gmail=expired_state` HTTP 307; DB row count after = 0 | ✓ |
| 4a | Insert fresh state, FIRST hit `/api/gmail/callback` (fake code) | State consumed atomically before Google exchange; redirect after exchange-fail = `?gmail=error` | `?gmail=error` HTTP 307; DB row count after = 0 | ✓ |
| 4b | Same state — REPLAY (second hit) | `?gmail=invalid_state` (state already consumed) | `?gmail=invalid_state` HTTP 307 | ✓ |
| 5 | Insert state with `provider='gmail'`, hit `/api/outlook/callback` with it | `?outlook=invalid_state`; gmail row NOT consumed (provider filter scoped the DELETE) | `?outlook=invalid_state` HTTP 307; DB row count after = 1 (preserved) | ✓ |

## Why TEST 4a returns `?gmail=error` instead of `?gmail=invalid_state`

The handler validates state SUCCESSFULLY (row found, not expired) and proceeds to the Google token-exchange step. The fake code "fake-code" fails Google's OAuth `code → tokens` exchange, so the handler returns `?gmail=error` (Google exchange failure path), not `?gmail=invalid_state` (state lookup failure path). This is the CORRECT behavior for a "legit state + bad code" scenario and demonstrates that the handler reaches the post-state-validation code path only when state is genuinely valid.

The critical security property is verified by TEST 4b (replay): the state was DELETED on first hit even though the request as a whole failed → subsequent replays cannot succeed regardless of what `code` value is used. **Single-use enforced atomically.**

## Why TEST 5 leaves the row in DB

The handler's DELETE has both `state` and `provider` predicates:
```typescript
.from('oauth_states')
.delete()
.eq('state', state)
.eq('provider', 'outlook')   // ← provider scoped
```

When a gmail-provider state hits the outlook callback, the predicate mismatches → 0 rows DELETED → 0 rows RETURNING → handler treats as "missing state" and redirects with `invalid_state`. The original gmail row stays untouched (correct — it's still valid for its intended gmail callback). If the legitimate user later completes their gmail flow, the row will be properly consumed then.

## Exploit window for the original P1-3 vulnerability

Original vulnerability: `state` was used directly as `user_id` for the `*_connections` upsert. With the new code:
- Attacker who tries to forge a callback with `state=<victim_uuid>` → row not found (because the random nonces stored in oauth_states are crypto.randomUUID, never plain UUIDs) → `?invalid_state` redirect → no token write.
- Attacker who somehow obtained a real nonce (eg. by intercepting victim's init-redirect URL — already a TLS-broken scenario) → can only use it once before it's consumed; max 10 min TTL window; can only use it for the matching provider.

Original `gmail_connections` / `outlook_connections` rows are untouched by this Bundle 2 fix — any existing connections established under the old vulnerable code remain. Recommendation in a Bundle 5 follow-up: optionally re-verify ownership of all currently-connected gmail/outlook accounts by sending a confirmation email or auto-revoking, but this is out of scope for the P1-3 nonce fix itself.

## DB state during the run

Used:
- Real `auth.users` user_id `367d62fc-a790-4ffb-b627-32db0df9b34e` for FK satisfaction
- Test state names prefixed `test-prod-` (cleaned up via `DELETE FROM oauth_states WHERE state LIKE 'test-prod-%'` at end of run)
- All test inserts via service-role `psql` (anon role couldn't insert anyway — oauth_states has zero RLS policies)

Final cleanup successful: `DELETE 1` (the test-prod-cross gmail row preserved by TEST 5).

## Cross-link

- PR (merged): https://github.com/fer-fer-code/lancerwise/pull/31
- Merge commit: `99255f19`
- Pre-merge SQL verification: see [`README.md`](README.md) § "SQL-level verification (5/5 pass)"
