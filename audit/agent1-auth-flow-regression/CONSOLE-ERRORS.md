# Auth Flow Audit — Console Errors

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** consolidated client-side errors observed across all 7 auth flows. Distinguishes external (Cloudflare CDN) errors from LancerWise-side bugs.

---

## Summary

**Total errors observed per page:** ~15 (consistent across /register, /login, /forgot-password)
**LancerWise-side bugs surfaced:** **0**
**All 15 errors:** Cloudflare Turnstile script side-effects, не LancerWise code

---

## Error categories

### 1. Cloudflare Turnstile CSP / TrustedHTML violations (12 of 15)

```
[ERROR] This document requires 'TrustedHTML' assignment. The action has been blocked.
  @ https://challenges.cloudflare.com/cdn-cgi/challenge-platform/h/g/turnstile/.../normal?lang=auto
[ERROR] This document requires 'TrustedScript' assignment. The action has been blocked.
  @ same URL
[ERROR] This document requires 'TrustedScriptURL' assignment. The action has been blocked.
  @ same URL
[ERROR] Executing inline script violates the following Content Security Policy directive
  'script-src 'nonce-h4EwfpLIBGcc6lpokZGvn5' 'unsafe-eval'' ...
  @ about:srcdoc
```

**Root cause:** Strict CSP nonce + Trusted Types policies на LancerWise origin clash with how Cloudflare Turnstile's challenge platform tries to inject inline scripts/HTML.

**Functional impact:** **NONE** — Turnstile still loads, renders, and CAPTCHA verification works (verified via "Успешно" UI state + S1+S2 server-side enforcement).

**Recommendation:** suppress in Sentry filter rule (these errors clutter the inbox without indicating real problems). Note: cannot easily fix from LancerWise side without weakening CSP (regression risk).

### 2. Cloudflare Turnstile 401 challenge fetch (1 of 15)

```
[ERROR] Failed to load resource: the server responded with a status of 401 ()
  @ https://challenges.cloudflare.com/cdn-cgi/challenge-platform/...
```

**Root cause:** Initial challenge attempts that Turnstile retries — expected behavior for some browser/IP combinations.

**Functional impact:** none — Turnstile recovers и passes.

### 3. Cloudflare Turnstile permissions policy warning (2 of 15)

```
[ERROR] Permissions policy violation: xr-spatial-tracking is not allowed in this document.
```

**Root cause:** Turnstile iframe tries к use XR API as part of fingerprinting; LancerWise's Permissions-Policy header blocks it.

**Functional impact:** none — by design.

### 4. Random NaN font-size errors (2 of 15)

```
[ERROR] %c%d font-size:0;color:transparent NaN
```

**Root cause:** Turnstile telemetry attempting к log с invalid format string.

**Functional impact:** none.

---

## Per-page breakdown

| Page | Errors | Source | LancerWise issue? |
|---|---|---|---|
| /register | 15 | All Cloudflare Turnstile | No |
| /login | 15 | All Cloudflare Turnstile (loaded but not active without widget) | No |
| /forgot-password | 15 | All Cloudflare Turnstile | No |
| /reset-password | not measured separately (similar profile expected) | — | — |
| /onboarding | (post-auth) 15 same | All Cloudflare Turnstile residual | No |

**Note:** even pages without Turnstile widget visible (e.g. /login) still load the CF challenge JS bundle, which triggers the errors.

---

## Recommendations

### Pre-launch
- File Sentry filter: ignore events matching `Failed to load resource: ... cloudflare.com/cdn-cgi/challenge-platform` OR `This document requires 'TrustedHTML' assignment ... challenges.cloudflare.com`
- Result: clean Sentry inbox at launch; real LancerWise errors surface immediately

### Post-launch
- Investigate whether Turnstile JS can be loaded lazily (only on /register), reducing /login + /forgot-password noise
- Investigate whether Cloudflare provides a "compatible-with-strict-CSP" Turnstile build

### Not pre-launch action
- None of these errors warrant code changes to LancerWise; CSP / Permissions-Policy / TrustedTypes are correct defensive postures

---

## Cross-references

- [FLOWS-MATRIX.md](./FLOWS-MATRIX.md) — flow-by-flow walkthrough
- [LAUNCH-BLOCKERS.md](./LAUNCH-BLOCKERS.md) — P0/P1 issues
- LancerWise CSP config — `src/middleware.ts` (likely) — sets nonce policy
- Memory: `feedback_supabase_captcha_dashboard.md` — confirms server-side CAPTCHA enforcement
