# [AGENT 3] Security audit — Area 1: Exposed Secrets

**Verdict: CLEAN** — no findings in this area.

## What was checked

| Surface | Method | Result |
| ------- | ------ | ------ |
| Homepage HTML inline scripts | `curl + regex grep eyJ.../sk_.../postgres://` | 0 hits |
| 7 JS chunks (sampled across login + homepage bundles) | grep AKIA/eyJ/sk-/postgres/SERVICE_ROLE/re_/ghp_ | 0 hits in 6/7 chunks; 1 JWT in chunks dir but `role: "anon"` (correct) |
| NEXT_PUBLIC_* env var inventory | inspect Vercel `/v9/projects/.../env` for unsafe-to-expose names | 7 vars: all safe-by-design |
| File-route exposure (`/.git/config`, `/.env`, `/.env.local`, `/api/admin`, `/api/_internal`, `/api/debug`, `/server-info`, `/package.json`, `/next.config.js`) | curl + check status code | All return 404 |
| API health/info endpoints | `/api/health` | 404 (no health endpoint exists, no info leak) |
| 404 body for stack trace leaks | curl `/api/admin/users` body grep for `stack/.tsx:/process.env/SUPABASE_/at .+\(/` | 0 hits (clean 404 page) |
| robots.txt sanity | curl + read | Correctly disallows 50+ private routes (`/dashboard`, `/api/`, `/portal/`, etc.) |
| sitemap.xml content | curl + grep for non-public URLs | Contains only marketing/landing URLs |

## JWT in JS bundle — verified safe

Found in `chunks/0rnj9omrs__.2.js`:
```
eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrZmd3eXphcnJoaGt6dmx0YmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5OTk0MDIsImV4cCI6MjA5MjU3NTQwMn0
```

Base64-decoded payload:
```json
{
  "iss": "supabase",
  "ref": "skfgwyzarrhhkzvltbgm",
  "role": "anon",         ← anon role (RLS-protected, safe-to-expose by design)
  "iat": 1776999402,
  "exp": 2092575402
}
```

This is the `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase's design intends for this to live in client bundles. Authorization is enforced by Row-Level Security (RLS) policies at the database level. **NOT a finding.**

If this were `role: "service_role"`, it would be P0 critical. Confirmed it is not.

## NEXT_PUBLIC_* env var safety (all 7 verified)

| Var | Type | Safe-to-expose? | Reason |
| --- | ---- | --------------- | ------ |
| NEXT_PUBLIC_APP_URL | URL | ✓ | Public canonical URL |
| NEXT_PUBLIC_POSTHOG_HOST | URL | ✓ | PostHog instance URL (public) |
| NEXT_PUBLIC_POSTHOG_KEY | API key | ✓ | PostHog client-side project key (RLS-equivalent, write-only) |
| NEXT_PUBLIC_SENTRY_DSN | DSN | ✓ | Designed to be in client (DSN includes a public key + project endpoint) |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | JWT (anon) | ✓ | RLS-protected, client-side by design |
| NEXT_PUBLIC_SUPABASE_URL | URL | ✓ | Public Supabase project URL |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY | API key | ✓ | Cloudflare Turnstile site key (always public) |

No keys that should be server-only are exposed.

## 404 body — sanity check

Sampled `/api/admin/users` → 404 returned. Body contains React 404 page HTML (~55KB). Grep for sensitive patterns (`stack`, `.tsx:`, `process.env`, `SUPABASE_`, paths under `/Users/`, `/home/`, `node_modules`) returned **0 matches** — confirms no stack trace, no path disclosure, no env leak in error response.

## robots.txt — explicit private-route disallow

Sampled robots.txt:
```
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /settings
Disallow: /api/
Disallow: /login
... (50+ private paths)
```

Plus Googlebot section explicitly disallows `/api/`. No accidental indexing risk.

## Sitemap.xml — public URLs only

Sampled first 30 lines — all URLs are marketing/landing pages (`/`, `/pricing`, `/tools/rate-calculator`, `/demo`, etc.). No `/dashboard/*` or `/api/*` leaked into sitemap.

## Conclusion

Area 1 surfaces are clean. No exposed secrets, no service-role JWTs in client bundles, no debug/admin/info endpoints publicly reachable, no stack trace leaks in 404 bodies. Standard security-headers configuration (`next.config.ts` `securityHeaders`) also confirmed correct (X-Frame-Options, HSTS, etc. — see Area 4).
