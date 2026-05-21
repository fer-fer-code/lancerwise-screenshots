# Content-Security-Policy — Design Spec

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Status:** READ-ONLY design only. NOT shipping в this task.
**Companion к:** [`INFRA-CHECKS-2026-05-21.md`](../agent1-infra-verification/INFRA-CHECKS-2026-05-21.md) § 1 (CSP missing finding)
**Filed как:** Issue #132 (post-launch P1 hot follow-up)

---

## Existing security-headers config

`next.config.ts` already emits via `securityHeaders` array:

| Header | Current value | Status |
|---|---|---|
| X-DNS-Prefetch-Control | `on` | ✅ |
| X-Frame-Options | `SAMEORIGIN` | ✅ |
| X-Content-Type-Options | `nosniff` | ✅ |
| Referrer-Policy | `strict-origin-when-cross-origin` | ✅ |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | ✅ |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload` | ✅ |
| **Content-Security-Policy** | **— ABSENT** | ❌ this spec |

---

## Third-party domains inventory

Inventoried via grep + memory cross-reference:

### script-src (executable JS)

| Domain | Reason | Required for |
|---|---|---|
| `'self'` | own scripts | All routes |
| `'unsafe-inline'` | Next.js inline scripts (theme flash prevention, schema.org JSON-LD) | All routes |
| `'unsafe-eval'` | Next.js webpack chunks + Sentry stack-trace | All routes |
| `challenges.cloudflare.com` | Cloudflare Turnstile widget | /register sign-up + protected forms |
| `us.i.posthog.com` | PostHog analytics SDK | All authed routes (consent-gated) |
| `www.googletagmanager.com` | GTM (если used) | All routes (consent-gated) |
| `*.vercel-insights.com` | Vercel Speed Insights | All routes |

**Note:** Sentry uses **tunnel route** `/monitoring-tunnel` per `next.config.ts` line 68 — its events are sent same-origin. **No external Sentry domain needed in CSP** (good — simpler policy).

### connect-src (fetch/xhr/websocket targets)

| Domain | Reason | Required for |
|---|---|---|
| `'self'` | own API endpoints | All routes |
| `*.supabase.co` | Supabase REST + auth | All authed routes |
| `wss://*.supabase.co` | Supabase Realtime | Optional (live invoice updates) |
| `*.lemonsqueezy.com` | LS checkout iframe communication | /upgrade, /settings/billing |
| `challenges.cloudflare.com` | Turnstile verification | /register |
| `us.i.posthog.com` | PostHog events | Authed routes |
| `*.googletagmanager.com` | GTM | All routes |

### frame-src (iframe embeds)

| Domain | Reason |
|---|---|
| `'self'` | Own iframes |
| `challenges.cloudflare.com` | Turnstile iframe |
| `*.lemonsqueezy.com` | LS checkout iframe |

### img-src (image loading)

| Domain | Reason |
|---|---|
| `'self'` | local images |
| `data:` | base64 data URIs (logos, charts) |
| `blob:` | dynamically generated image blobs (uploaded logos) |
| `*.supabase.co` | Supabase Storage (uploaded logos, attachments) |
| `*.googleusercontent.com` | Avatars (если Google OAuth used) |

### style-src

| Domain | Reason |
|---|---|
| `'self'` | own CSS |
| `'unsafe-inline'` | Next.js + Tailwind inline styles |
| `fonts.googleapis.com` | Google Fonts stylesheet |

### font-src

| Domain | Reason |
|---|---|
| `'self'` | Inter font self-hosted (Next.js next/font/google) |
| `fonts.gstatic.com` | Google Fonts CDN fallback |
| `data:` | inline font data |

### form-action

| Domain | Reason |
|---|---|
| `'self'` | own forms |

### object-src + base-uri

- `object-src 'none'` (no `<object>`, `<embed>`, `<applet>`)
- `base-uri 'self'` (lock `<base>` tag)

---

## Proposed CSP spec

### Phase 1 — Report-Only mode (recommended first step, 2 weeks)

```
Content-Security-Policy-Report-Only:
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' challenges.cloudflare.com us.i.posthog.com www.googletagmanager.com *.vercel-insights.com *.vercel-analytics.com;
  connect-src 'self' *.supabase.co wss://*.supabase.co *.lemonsqueezy.com challenges.cloudflare.com us.i.posthog.com *.googletagmanager.com *.vercel-insights.com;
  frame-src 'self' challenges.cloudflare.com *.lemonsqueezy.com;
  img-src 'self' data: blob: *.supabase.co *.googleusercontent.com;
  style-src 'self' 'unsafe-inline' fonts.googleapis.com;
  font-src 'self' fonts.gstatic.com data:;
  form-action 'self';
  object-src 'none';
  base-uri 'self';
  report-uri /api/csp-report
```

**Why Report-Only first:**
- CSP violations реported но не block content
- Identifies missed domains BEFORE breaking production
- 2-week observation window catches edge-case third parties (е.g. Twitter embeds, payment-provider iframes)
- Browser console + `/api/csp-report` endpoint logs every violation

### Phase 2 — Enforced mode (post-observation)

Same spec but header changed к `Content-Security-Policy` (enforcement). Drop `'unsafe-eval'` if possible (test Sentry stack traces, webpack chunks).

### Phase 3 — Strict (long-term, post-month-1)

Move к nonce-based `script-src 'nonce-XXX' 'strict-dynamic'` — requires Next.js middleware injecting per-request nonces. Higher effort. Defer.

---

## Trade-offs

### Risks (potential breakage)

| Risk | Mitigation |
|---|---|
| Turnstile iframe blocked | Whitelisted `challenges.cloudflare.com` в frame-src + script-src + connect-src |
| LS checkout iframe blocked | Whitelisted `*.lemonsqueezy.com` |
| PostHog session replay broken | Whitelisted `us.i.posthog.com` |
| GTM tag firing blocked | Whitelisted `*.googletagmanager.com` |
| Vercel Analytics blocked | Whitelisted `*.vercel-insights.com` + `*.vercel-analytics.com` |
| Inline scripts blocked (theme flash) | `'unsafe-inline'` kept в script-src (Phase 1+2; Phase 3 nonce-based) |
| Webpack eval blocked | `'unsafe-eval'` kept в script-src |
| User-uploaded logos blocked | `*.supabase.co` в img-src |

### XSS protection delta

**Without CSP:**
- Inline injection succeeds (script-src not restricted)
- External resource loading unrestricted
- form-action exfiltration unrestricted

**With Phase 1+2 CSP (`unsafe-inline` + `unsafe-eval` retained):**
- External script injection (`<script src="evil.com">`) blocked unless evil.com whitelisted
- Form exfiltration (`action="evil.com"`) blocked via form-action 'self'
- Frame injection (`<iframe src="evil.com">`) blocked
- Img tracker injection (`<img src="evil.com/track.gif">`) blocked unless evil.com whitelisted

**With Phase 3 CSP (nonce-based, no unsafe-inline):**
- Adds inline injection protection (huge XSS защиту)
- Required: Next.js middleware nonce injection

---

## Implementation recommendation

**Defer к post-launch P1 hot follow-up day 1-3** per Ramiz preference (per task brief).

**Reasoning:**
- Pre-launch адding CSP risks breaking smoke tests (#94 work + smoke F1-F11 are critical-path)
- Phase 1 report-only mode is safe but requires monitoring infrastructure (`/api/csp-report` endpoint) — also не yet built
- Post-launch deployment с 2-week observation is the conservative path

### Effort estimate

| Phase | Effort | Risk |
|---|---|---|
| Phase 1 (Report-Only) | ~1h (add к next.config.ts headers + new `/api/csp-report` endpoint to log violations) | Very low |
| Phase 2 (Enforced) | ~30 min к flip header + smoke re-test all F1-F11 flows | Medium (production breakage if missed domain) |
| Phase 3 (Strict nonce-based) | ~3-5h (Next.js middleware nonce injection + remove unsafe-inline + per-route testing) | High (Sentry/Turnstile/LS iframe interaction complex) |

### Acceptance criteria для Phase 1

- [ ] Add CSP-Report-Only header to `next.config.ts` securityHeaders
- [ ] Implement `/api/csp-report` endpoint (Sentry sink или Supabase log table)
- [ ] Deploy + 2-week observation
- [ ] Zero report-uri violations expected for known-domain whitelist (any new violations = filed for CSP tweak)
- [ ] Production smoke F1-F11 unaffected

### Acceptance criteria для Phase 2

- [ ] Phase 1 ran clean 2 weeks
- [ ] Flip к `Content-Security-Policy` (enforced)
- [ ] Production smoke F1-F11 re-run; verify nothing broken
- [ ] [AGENT 4] Sentry watch 24h CLEAN

---

## /api/csp-report endpoint (recommended Phase 1 implementation)

```ts
// src/app/api/csp-report/route.ts (NOT shipping in this task — design only)
import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const report = body['csp-report'] || body
    // Log к Sentry для observability
    Sentry.captureMessage('CSP violation', {
      level: 'warning',
      extra: report,
    })
    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}
```

Tags violations к Sentry inbox с `csp-report` extra payload. Filter via Sentry tags for review.

---

## Cross-references

- [`audit/agent1-infra-verification/INFRA-CHECKS-2026-05-21.md`](../agent1-infra-verification/INFRA-CHECKS-2026-05-21.md) § 1 — finding origin
- Issue #132 (TBD) — implementation tracker
- `next.config.ts` line 7-15 — existing securityHeaders array (insertion point)
- Memory: `feedback_force_dynamic_invariant.md` — applies to new /api/csp-report endpoint
- Memory: `project_lancerwise_email_infrastructure.md` — does NOT affect CSP (server-side)
