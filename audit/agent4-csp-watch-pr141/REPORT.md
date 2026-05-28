# CSP Report-Only watch — PR #141 post-merge

**PR #141 squash SHA:** `6d5a6c4d` — `feat(security): CSP Report-Only header + violation sink (#133 Phase 1)`
**Merged at:** 2026-05-28T16:02:09Z
**main HEAD at watch start:** `6d5a6c4d`
**Vercel deploy:** ✅ READY (`CF8mg9CADuFiNcEm4pWnVXZqLLnq`)
**CSP header confirmed live on production:** ✅ (curl -I returns `content-security-policy-report-only: …` on both `/` and `/login`)
**Watch verdict:** 🟢 **Normal — 0 violations across synthetic browser observation of 13 routes**

---

## Methodology pivot

Original plan was to poll Vercel runtime logs for POST `/api/csp-report` count over 30 min. That failed:

1. **Vercel REST API does not expose runtime logs.** `/v3/deployments/{id}/events` returns build-time stdout only, all entries `type=stdout/info.type=build`. Runtime function invocations are only accessible via the dashboard UI, Log Drains (none configured), or the undocumented internal CLI endpoint.
2. **`vercel logs` CLI blocked** per memory `feedback_vercel_cli_ai_agent_env.md` — CLI detects `AI_AGENT` env var and refuses interactive log streaming.
3. **No `SENTRY_TOKEN` available locally** — CSP violations get forwarded to Sentry as `info`-level messages by the route handler (`src/app/api/csp-report/route.ts:99`), but the org API requires a token I don't have.

**Pivoted to higher-signal approach:** synthetic browser observation. A Playwright session loaded 13 public/auth-redirect routes, listening for `securitypolicyviolation` DOM events — these are the SAME events that real browsers POST to `/api/csp-report`. This tells me WHICH directives and HOSTS are failing the whitelist, not just count. Higher signal than aggregate POST volume.

---

## Functional probe

- `POST https://www.lancerwise.com/api/csp-report` with sample legacy-format body → **HTTP 204** ✅
- Sentry sink line confirmed in `src/app/api/csp-report/route.ts:99` (`Sentry.captureMessage('CSP violation: …', { level: 'info', tags: { csp_directive, csp_blocked_uri_host, csp_document_path }, … })`)

---

## CSP directive on production

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  challenges.cloudflare.com us.i.posthog.com www.googletagmanager.com
  *.vercel-insights.com *.vercel-analytics.com;
connect-src 'self' *.supabase.co wss://*.supabase.co *.lemonsqueezy.com
  challenges.cloudflare.com us.i.posthog.com *.googletagmanager.com
  *.vercel-insights.com;
frame-src 'self' challenges.cloudflare.com *.lemonsqueezy.com;
img-src 'self' data: blob: *.supabase.co *.googleusercontent.com;
style-src 'self' 'unsafe-inline' fonts.googleapis.com;
font-src 'self' fonts.gstatic.com data:;
form-action 'self';
object-src 'none';
base-uri 'self';
report-uri /api/csp-report
```

Whitelist matches Ramiz's expected list:
- ✅ `challenges.cloudflare.com` — Turnstile
- ✅ `us.i.posthog.com` — PostHog (note: `eu.i.posthog.com` NOT listed; check region routing)
- ✅ `*.supabase.co` — DB + auth (+ wss for realtime)
- ✅ `*.lemonsqueezy.com` — checkout iframe
- ✅ `*.vercel-insights.com` + `*.vercel-analytics.com` — speed insights
- ✅ `fonts.googleapis.com` + `fonts.gstatic.com` — Google Fonts
- ⚠️ `ingest.sentry.io` / `sentry.io` NOT in connect-src — the Sentry client beacon will be blocked when error events fire from the browser (DSN endpoint sends to `o*.ingest.sentry.io`)

---

## Synthetic observation — 13 routes

| Route | Status | Violations |
|---|---|---|
| `/` | loaded | 0 |
| `/pricing` | loaded | 0 |
| `/login` | loaded | 0 |
| `/register` | loaded | 0 |
| `/about` | loaded | 0 |
| `/blog` | loaded | 0 |
| `/faq` | loaded | 0 |
| `/tools` | loaded | 0 |
| `/wall` | loaded | 0 |
| `/dashboard` → /login | redirect captured | 0 |
| `/contracts` → /login | redirect captured | 0 |
| `/invoices` → /login | redirect captured | 0 |
| `/clients` → /login | redirect captured | 0 |

**Total violations:** 0
**Unexpected hosts blocked:** 0

Observer was sanity-checked separately by injecting `https://evil.example.com/x.js` via DOM script tag → captured as `script-src-elem` violation, `disposition: report`. Tool is functional; the zero result on real routes is genuine.

---

## Verdict

**🟢 Normal flow — Report-Only deployment safe.** No legitimate resources are being blocked on the surfaces I can observe. Whitelist as configured is comprehensive for marketing + auth-redirect chrome.

### Caveats (honest)

1. **Authed dashboard not observed** — `/dashboard`, `/contracts`, `/invoices`, `/clients` all redirect to `/login` since I have no auth session (same Turnstile gap as cb2a86d3/a1bb3d19/dashboard-i18n-verify-2026-05-27). The pages WHERE PostHog session replays / LemonSqueezy embeds / heavy third-party widgets actually fire were not inspected. Real-user violations could surface only on authed surfaces.

2. **No real-traffic baseline** — synthetic observation reflects MY browser session, not the full population of users. PostHog feature flag fetches that vary by user, A/B test variants, or LemonSqueezy checkout flows triggered only by Pro users could surface different violation patterns.

3. **Sentry connect-src gap (possible false negative)** — `ingest.sentry.io` is NOT in the `connect-src` directive. If a JS error fires in a user's browser, Sentry's `fetch` beacon to its ingest endpoint would be blocked in Report-Only mode (and will be in enforced mode). Worth confirming whether Sentry uses a same-origin tunnel proxy (which would be fine) or direct ingest. Easy to check by triggering a console.error on an authed page and watching for the violation.

4. **Region drift on PostHog** — only `us.i.posthog.com` listed; if any traffic is routed to `eu.i.posthog.com` (EU users / GDPR routing), it'll show up as a violation.

### Recommended follow-up before flipping to enforced CSP

- 24-48h Report-Only window with real authed traffic (need SENTRY_TOKEN for me to monitor) → catch the patterns synthetic visits missed
- Verify Sentry ingest goes through same-origin tunnel (or add `*.ingest.sentry.io` to connect-src)
- Confirm whether `eu.i.posthog.com` is ever hit
- Verify Stripe iframes (if LemonSqueezy proxies to Stripe under the hood) aren't tripping frame-src

If Ramiz provides `SENTRY_TOKEN` I can poll org events filtered to `csp_directive` tag for the next 24h and produce real-traffic counts.

---

## Cross-references

- PR: https://github.com/fer-fer-code/lancerwise/pull/141
- Merge commit: `6d5a6c4d`
- Vercel deploy: https://vercel.com/fer-fer-codes-projects/lancerwise/CF8mg9CADuFiNcEm4pWnVXZqLLnq
- Sink: `src/app/api/csp-report/route.ts` (Sentry `level:info` messages tagged with directive + host)
- Header source: `next.config.ts:36`
- Issue #133 Phase 1 (per commit message)
- Memory: `feedback_vercel_cli_ai_agent_env.md`, `backlog_sentry_token_event_admin.md`
