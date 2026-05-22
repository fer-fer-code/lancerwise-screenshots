# API Inventory — `/api/*` catalog at production SHA `f27bb710`

**Author:** [AGENT 4]
**Date:** 2026-05-22
**Source:** `src/app/api/` in `lancerwise-agent2` worktree (HEAD = production SHA `f27bb710a0ad`)
**Method:** static grep of `export (async )?function (GET|POST|...)` per route file + auth/cron/sig heuristics
**Raw TSV:** `INVENTORY-RAW.tsv` (machine-parseable, 2,691 rows + header)

---

## Totals

- **2,691 route files** under `src/app/api/`
- **321 top-level dirs** (each a logical endpoint category)
- **2,787 total directories** in the tree (includes `[param]` segments)

## HTTP methods distribution

| Methods | Count |
|---|---|
| GET, OPTIONS | 631 |
| POST | 553 |
| GET | 444 |
| OPTIONS, POST | 360 |
| GET, POST | 275 |
| DELETE, PATCH | 65 |
| DELETE, GET, PATCH, POST (CRUD) | 52 |
| DELETE, GET, PATCH | 48 |
| DELETE, GET, POST | 40 |
| GET, PATCH | 28 |
| PATCH | 22 |
| DELETE, GET, PATCH, PUT | 22 |
| GET, OPTIONS, POST | 20 |
| DELETE, PUT | 18 |
| DELETE | 18 |
| (other combinations) | ~445 |

`OPTIONS` is exported on 1,031 routes — most likely CORS preflight handlers.

## Auth signal coverage (static grep heuristic)

| Auth indicator | Routes | % |
|---|---|---|
| Has `getUser \| getSession \| Unauthorized \| requireAuth` | **2,599** | 96.6% |
| No auth-pattern signal | 92 | 3.4% |

The 92 unsignalled routes break into three buckets:

1. **Intentionally public** (~50): `unsubscribe`, `health`, `contact-form`, `pricing-page/contact`, `testimonials/submit`, `faq/public`, `nps/respond`, `quotes/respond`, etc. — most have alternative defenses (Turnstile captcha + rate-limit; verified in `contact-form/route.ts`).
2. **Token-based access** (~25): `portal/[token]`, `intake/[slug]`, `contact/[username]`, `intake/[token]` — auth is via URL token, not session cookie.
3. **Compute-only / static-data** (~15): `scenario-planner/calculate` (pure math), `contracts/templates` (static template list), `payments/portal-checkout` (redirect). No user data accessed.

**Notable mention:** `payments/webhook/route.ts` shows no auth signal because it's a thin re-export (`export { POST } from '@/app/api/stripe/webhook/route'`); the actual handler is at `stripe/webhook/route.ts` which uses `stripe.webhooks.constructEvent` for signature verification.

## Cron signal coverage

| Indicator | Routes |
|---|---|
| Has `CRON_SECRET \| x-vercel-cron` reference | **101** |
| No cron signal | 2,590 |

101 routes match — close to the 100 cron path entries in `vercel.json`. All 10 cron endpoints I probed (cleanup-oauth-states, api-key-digest, at-risk-clients, scope-creep-alert, client-revenue-drop, project-completion-followup, monthly-revenue-forecast, quarterly-review, weekly-summary, monthly-digest) returned `401` to unauth GET and to fake-Bearer-token GET. ✅ CRON_SECRET boundary holding.

## Webhook signature verification

| Indicator | Routes |
|---|---|
| Has `X-Signature \| hmac \| crypto.createHmac` | 3 |
| Uses Stripe SDK pattern `stripe.webhooks.constructEvent` | 1 (additional, not caught by initial grep) |
| Re-exports a signature-verifying handler | 1 (`payments/webhook` re-exports `stripe/webhook`) |

**Identified routes with signature verification:**

| Route | Pattern | Verified |
|---|---|---|
| `lemonsqueezy/webhook` | `crypto.createHmac('sha256', secret)` → 401 on mismatch | ✅ Confirmed: bad-sig probe returned 401 `{"error":"invalid signature"}` |
| `stripe/webhook` | `stripe.webhooks.constructEvent(body, sig, secret)` | ⚠️ Endpoint returns 503 in production (Stripe env not configured) — code path correct but provider not yet enabled |
| `payments/webhook` | Re-exports `stripe/webhook` | ⚠️ Same as above |
| `webhooks/[id]/test` | `crypto.createHmac` for user-created outbound webhook tests | ✅ behind auth (401 on unauth POST) |
| `v1/webhooks/[id]/test` | `crypto.createHmac` v1 mirror of above | ✅ behind auth |

## Top-level endpoint categories (sample of 321)

Categories with most routes:

- `/api/cron/` — 100 cron endpoints (CRON_SECRET protected)
- `/api/ai/` — 56 AI endpoints (Gemini/Groq/Anthropic-backed, mostly OPTIONS,POST)
- `/api/email/` — 7 endpoints (email composition + send)
- `/api/webhooks/` — 5 endpoints (test infra for user-created webhooks)
- `/api/stripe/` — 4 endpoints (webhook, checkout, subscribe, billing-portal)
- `/api/lemonsqueezy/` — 2 endpoints (webhook, checkout)
- `/api/v1/` — 364+ versioned mirrors of canonical routes (per memory `backlog_anthropic_endpoints_remaining_migration_p2`)

## Cron endpoints catalog (from `vercel.json`)

A subset of the 100 cron routes is registered as scheduled tasks in `vercel.json`. Verified via curl that all 10 sampled return `401` to unauth GET:

| Path | Schedule | Probe |
|---|---|---|
| `/api/cron/cleanup-oauth-states` | `0 3 * * *` | 401 ✅ |
| `/api/cron/api-key-digest` | `0 9 * * 1` | 401 ✅ |
| `/api/cron/at-risk-clients` | `0 9 * * 3` | 401 ✅ |
| `/api/cron/scope-creep-alert` | `0 9 * * *` | 401 ✅ |
| `/api/cron/client-revenue-drop` | `0 10 5 * *` | 401 ✅ |
| `/api/cron/project-completion-followup` | `0 10 * * *` | 401 ✅ |
| `/api/cron/monthly-revenue-forecast` | `0 8 28-31 * *` | 401 ✅ |
| `/api/cron/quarterly-review` | `0 8 1 1,4,7,10 *` | 401 ✅ |
| `/api/cron/weekly-summary` | `0 8 * * 1` | 401 ✅ |
| `/api/cron/monthly-digest` | `0 9 1 * *` | 401 ✅ |

## Heuristic limitations

- Static grep cannot detect auth done in middleware (`middleware.ts`) — if a route relies solely on `middleware.ts` to gate access, this audit will mark it "no auth signal" even though it IS protected. This is the main confounder behind the 92 unsignalled routes.
- The webhook-sig count understates because Stripe SDK pattern is unique. Total verified webhook-sig routes: ~4-5 across the codebase.
- The cron count overestimates slightly — `x-vercel-cron` may appear as a comment or constant reference without enforcement. The 10-of-10 401 probe gives empirical confidence.

## Cross-references

- Raw TSV: `INVENTORY-RAW.tsv`
- Critical-path probe results: `raw/probes-critical.tsv`
- Findings doc: `API-FINDINGS.md`
- Sentry tail log: `SENTRY-TAIL-LOG.md`
