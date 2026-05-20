# Follow-up: Supabase Auth Email Templates — `redirect_to` PKCE migration

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Status:** P3 backlog (post-launch hardening)
**Trigger:** PR #117 closes #114 via defence-in-depth fragment handler. This document describes the cleaner long-term fix.

---

## Current state (post #117 merge)

| Email type | Supabase template's `redirect_to` | Delivery format | Handler in app |
|---|---|---|---|
| signup verification | `https://www.lancerwise.com` (Site URL) | `#access_token=...&type=signup` (implicit grant) | `AuthHashHandler` client component |
| password recovery | same | `#access_token=...&type=recovery` (implicit) | same |
| magic link | same | `#access_token=...&type=magiclink` (implicit) | same |
| email change | same | `#access_token=...&type=email_change` (implicit) | same |

**Issue:** implicit grant flow exposes access_token + refresh_token via URL fragment. While fragments are not sent в server logs (modulo browser/proxy behaviour), this is less robust than PKCE (`?code=...` query, single-use opaque code exchanged server-side).

---

## Recommended long-term migration

Update Supabase Dashboard → Auth → Email Templates → `redirect_to` field:

| Template | New `redirect_to` |
|---|---|
| Confirm signup | `https://www.lancerwise.com/auth/callback?next=/onboarding` |
| Reset password | `https://www.lancerwise.com/auth/callback?next=/reset-password` |
| Magic link | `https://www.lancerwise.com/auth/callback?next=/onboarding` |
| Change email | `https://www.lancerwise.com/auth/callback?next=/settings` |

Existing `src/app/auth/callback/route.ts` already handles `?code=` PKCE flow. After this change, all auth emails will route through that route. The `AuthHashHandler` от #117 remains in place as defence-in-depth (handles any legacy email links still in user inboxes).

---

## Effort

~5 min in Supabase Dashboard. No code change required.

## Risk

- Low. The PKCE `/auth/callback` route is already production-tested.
- Worst case: user has old email link in inbox с old redirect_to → fragment handler catches it. Defence-in-depth works.

## Acceptance

- [ ] New signup → email link points к `/auth/callback?next=/onboarding` → user lands in onboarding с session
- [ ] New password reset → email link points к `/auth/callback?next=/reset-password` → user lands в reset form с session
- [ ] AuthHashHandler still works для any cached/old email links

## Cross-references

- PR [#117](https://github.com/fer-fer-code/lancerwise/pull/117) — defence-in-depth fragment handler (immediate fix)
- Issue [#114](https://github.com/fer-fer-code/lancerwise/issues/114) — original blocker
- Memory: `project_lancerwise_supabase_auth_emails.md` (auth email branding tracker)
