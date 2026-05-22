# P0 fix — middleware auth cookie parse crash (QA-P0-001)

**Status:** ✅ Fix written + PR open. Pre-merge production crash confirmed.
**PR:** https://github.com/fer-fer-code/lancerwise/pull/147
**Branch:** `fix/p0-middleware-cookie-parse-crash`
**Commit:** `4fe02f05`
**Date:** 2026-05-22
**Author:** [AGENT 2]

---

## Pre-fix baseline (current production `f27bb710`)

```
$ curl -s -o /dev/null -w "HTTP %{http_code}  Redirect: %{redirect_url}\n" \
       -H "Cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=base64-INVALIDCOOKIESTRING" \
       https://www.lancerwise.com/dashboard
HTTP 500  Redirect:
```

Matches [AGENT 3]'s repro exactly — bare Vercel `MIDDLEWARE_INVOCATION_FAILED`.

Control с no cookie:
```
$ curl -s -o /dev/null -w "HTTP %{http_code}  Redirect: %{redirect_url}\n" \
       https://www.lancerwise.com/dashboard
HTTP 307  Redirect: https://www.lancerwise.com/login
```

Expected behavior (no cookie correctly redirects).

---

## Fix mechanism

`src/middleware.ts` line 75 (`supabase.auth.getUser()`) is the throw site —
Supabase SSR library deserializes the `base64-…` prefixed cookie lazily here.
When the decoded bytes aren't valid JSON, `JSON.parse` throws, the throw
escapes the middleware function, and Next.js raises `MIDDLEWARE_INVOCATION_FAILED`.

The patch wraps `getUser()` in try/catch:
- On catch: set `user = null`, set `authCookieCorrupted = true`, log а warning
- After the catch: if `authCookieCorrupted` is set, build redirect-to-login response с DELETE for every `sb-*` cookie from the request. This prevents loop (browser would otherwise keep sending the corrupted cookie forever).
- Edge: если pathname is already /login, redirect к /login again — the response still carries the cookie-clear directives.

```ts
let user = null
let authCookieCorrupted = false
try {
  const result = await supabase.auth.getUser()
  user = result.data.user
} catch (err) {
  authCookieCorrupted = true
  console.warn('[middleware] auth cookie parse failed; clearing + redirect к login', { ... })
}

if (authCookieCorrupted) {
  const target = pathname.startsWith('/login') ? request.url : new URL('/login', request.url)
  const redirect = NextResponse.redirect(target)
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      redirect.cookies.delete(cookie.name)
    }
  }
  return redirect
}
```

---

## Verification status

| Step | Status |
|---|---|
| Pre-fix repro (curl production) | ✅ HTTP 500 confirmed на `f27bb710` |
| TSC parity | ✅ 384/384 (zero new errors) |
| Vercel preview build | ✅ READY (~3min build, deploy ID `dpl_4fTrxp5PgMu1pwUfMxjYBanU5Z96`) |
| Preview curl test | ⚠️ Vercel preview-protection wall returned HTTP 401 (Vercel auth gate, NOT middleware response). `vercel curl` CLI scope-link step had friction (AI_AGENT env detection per memory `feedback_vercel_cli_ai_agent_env`); not fully bypassed. |
| Post-merge production curl re-test | ⏳ pending merge |

---

## Recommended post-merge re-probe

Once #147 merges + deploys:

```bash
# Should redirect (302/307) к /login + clear sb-* cookies
curl -i -s -H "Cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=base64-INVALIDCOOKIESTRING" \
     https://www.lancerwise.com/dashboard | grep -iE "^HTTP|^location:|^set-cookie:"

# Expected response headers:
#   HTTP/2 307
#   location: https://www.lancerwise.com/login
#   set-cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=; Max-Age=0; ...
```

Also re-run all 6 variants from [AGENT 3]'s QA-P0-001 repro matrix к confirm all land at /login без 500.

---

## Files

- `src/middleware.ts` — +35 / -1 lines
- Diff: single function-internal change, no API surface affected

---

## Cross-references

- [AGENT 3] QA finding: `audit/agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` (QA-P0-001)
- PR: https://github.com/fer-fer-code/lancerwise/pull/147
- Memory: `feedback_vercel_cli_ai_agent_env.md` (relevant к Vercel curl friction noted в verification table)
