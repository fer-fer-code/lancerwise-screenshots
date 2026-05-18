# [AGENT 3] TASK 1 — Supabase "Confirm email" toggle (P1-1 fix) via Management API

Closes P1-1 from [`audit/agent3-logged-in-qa/FINDINGS.md`](../agent3-logged-in-qa/FINDINGS.md): Supabase Auth was auto-confirming new signups, allowing impersonation + spam vector.

## Status — ✅ **APPLIED + verified end-to-end on production**

Approach: Supabase Management API (not browser) — atomic PATCH, no login flow, no fragile UI automation.

## Change summary

| Field | Before | After |
|-------|--------|-------|
| `mailer_autoconfirm` | `True` (auto-confirm, security hole) | `False` (requires email confirmation) |
| `site_url` | `http://localhost:3000` (broken in prod!) | `https://www.lancerwise.com` |
| `uri_allow_list` | `""` (empty) | `https://www.lancerwise.com,https://www.lancerwise.com/auth/callback,https://www.lancerwise.com/auth/confirm,https://www.lancerwise.com/login,https://www.lancerwise.com/dashboard` |

## Bonus discovery during BEFORE state inspection

`site_url` was set to **`http://localhost:3000`** — this means even if `mailer_autoconfirm` had been toggled by Ramiz alone via the dashboard, the resulting confirmation emails would have contained `http://localhost:3000/auth/confirm?token=...` links that real users can't click. Toggling `mailer_autoconfirm` AND fixing `site_url` atomically was the correct end-state.

## API call

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/skfgwyzarrhhkzvltbgm/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_autoconfirm": false,
    "site_url": "https://www.lancerwise.com",
    "uri_allow_list": "https://www.lancerwise.com,https://www.lancerwise.com/auth/callback,https://www.lancerwise.com/auth/confirm,https://www.lancerwise.com/login,https://www.lancerwise.com/dashboard"
  }'
→ HTTP 200
```

## Production end-to-end verification

Signup attempt via Supabase Auth REST with fresh mail.tm address:

```bash
curl -X POST "https://skfgwyzarrhhkzvltbgm.supabase.co/auth/v1/signup" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"lancerwise-confirm-verify-1779119137@wshu.net","password":"..."}'
```

**Response (post-fix)**:
```
HTTP 200
{
  "session": null,                  ← was: <object> (auto-confirmed before)
  "user": {
    "confirmed_at": null,           ← was: <timestamp> before
    "email_confirmed_at": null,     ← was: <timestamp> before
    ...
  }
}
```

`session: null` confirms email confirmation is now required before login is allowed.

**Inbox check (mail.tm) after 8s wait**:
```
Total messages: 1
  from:    noreply@mail.app.supabase.io
  subject: Confirm Your Signup
  at:      2026-05-18T15:45:42+00:00
```

Compare to pre-fix:
```
Total messages: 0 (no email sent — auto-confirmed silently)
```

**Verdict**: full email-verification flow now working end-to-end on production. New signups must click the link in the "Confirm Your Signup" email before they can authenticate.

## Side notes (non-blocking)

1. **Email template is still the default Supabase one** — per memory `project_lancerwise_supabase_auth_emails.md`, the templates live in the Supabase Dashboard (not in the repo). The `mailer_templates_confirmation_content` from the Management API GET shows the default `<h2>Confirm your signup</h2>...` template. Branding pass is a separate post-launch task (`backlog_supabase_password_reset_branding.md`).

2. **Sender domain**: emails come from `noreply@mail.app.supabase.io` (Supabase's domain). Migrating to `noreply@lancerwise.com` (via Resend / SMTP custom) is another post-launch backlog item.

3. **`smtp_admin_email: None`** — no admin email configured for delivery alerts. Worth setting for production monitoring.

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + API + verification |
| [`before.json`](before.json) | full GET response BEFORE PATCH (mailer_autoconfirm=true, site_url=localhost) |
| [`after.json`](after.json) | full GET response AFTER PATCH (mailer_autoconfirm=false, site_url=https://www.lancerwise.com) |
| [`patch-response.json`](patch-response.json) | response body from the PATCH call |

## Cross-links

- P1-1 origin: [`../agent3-logged-in-qa/FINDINGS.md`](../agent3-logged-in-qa/FINDINGS.md) finding P1-1
- Supabase Management API endpoint: `https://api.supabase.com/v1/projects/{ref}/config/auth` (GET + PATCH)
- TASK 2 (GSC actions, parallel): [`../agent3-gsc-actions/README.md`](../agent3-gsc-actions/README.md)
- Related memory: `project_lancerwise_supabase_auth_emails.md`, `backlog_supabase_password_reset_branding.md`
