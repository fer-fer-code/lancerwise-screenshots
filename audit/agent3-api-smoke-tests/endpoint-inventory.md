# API endpoint inventory — smoke test scope

**Total routes discovered**: 2,688 `route.ts` files under `src/app/api/` (per `find src/app/api -name route.ts`).
**Of which static (no `[param]`)**: 2,136
**Of which dynamic (`[id]`, `[token]`, etc.)**: 552
**Of which AI**: 420 routes under `/api/ai/*` and `/api/v1/ai/*`

This audit smokes a **curated subset of 30-40 endpoints** representing each access tier + critical user flows. Not all 2,688 can be tested manually — the curated set acts as a tripwire: if any of these fail, broader regression is likely.

## Category A — Public (no auth)

| Endpoint | Method | Expected on prod | Smoke test? |
|----------|--------|------------------|-------------|
| `/sitemap.xml` | GET | 200, XML | ✓ |
| `/robots.txt` | GET | 200, text | ✓ |
| `/api/og` | GET | 200, PNG | ✓ |
| `/api/sitemap` | GET | 200 if exists | ✓ |
| `/api/health` | GET | 200 if exists; 404 otherwise | ✓ |
| `/api/auth/login` | POST (no body) | 400/401 | ✓ |
| `/api/auth/register` | POST (no body) | 400/401 | ✓ |
| `/api/contact` | POST (no body) | 400/401 (rate-limited) | ✓ |
| `/api/newsletter` | POST (no body) | 400/401 | ✓ |
| `/api/blog/rss.xml` | GET | 200 if exists | ✓ |

## Category B — Authenticated (test account)

Test account: `lancerwise-qa-1779107498@wshu.net`. Session via Supabase Auth REST `/auth/v1/token?grant_type=password`.

| Endpoint | Method | Expected | Smoke test? |
|----------|--------|----------|-------------|
| `/api/clients` | GET | 200 | ✓ |
| `/api/invoices` | GET | 200 | ✓ |
| `/api/time-entries` | GET | 200 | ✓ |
| `/api/projects` | GET | 200 | ✓ |
| `/api/profile` | GET | 200 | ✓ |
| `/api/settings` | GET | 200 | ✓ |
| `/api/billing/status` | GET | 200 | ✓ |
| `/api/dashboard/stats` | GET | 200 | ✓ |
| `/api/expenses` | GET | 200 | ✓ |
| `/api/analytics/forecast` | GET | 200/302 | ✓ |
| `/api/notifications` | GET | 200 | ✓ |

## Category C — Webhooks (POST no payload — expect 4xx not 5xx)

| Endpoint | Expected | Smoke test? |
|----------|----------|-------------|
| `/api/stripe/webhook` | 400/401 | ✓ |
| `/api/webhooks/resend` (if exists) | 400/401 | ✓ |
| `/api/lemonsqueezy/webhook` | 404 (LS branch not merged) OR 401 if accidentally deployed | ✓ |
| `/api/gmail/callback` | 400/401 | ✓ |
| `/api/outlook/callback` | 400/401 | ✓ |
| `/api/webhooks/fire` (internal sender) | 401 (auth required) | ✓ |

## Category D — AI endpoints (sample 2-3 of 420)

| Endpoint | Method | Expected | Smoke test? |
|----------|--------|----------|-------------|
| `/api/v1/ai/invoice-description-writer` | POST (sample payload) | 200 stream OR 401 unauth | ✓ |
| `/api/v1/ai/generate-contract` | POST (sample payload) | 200 stream OR 401 unauth | ✓ |
| `/api/ai/scan-receipt` | POST (sample payload) | 200 OR 401 unauth — post-B6 Gemini | ✓ |

## NOT in scope

- 552 dynamic-param routes (need real IDs from DB)
- 2,000+ tail of endpoints (vendors, surveys, niche tools) — sampled by category instead
- Any DELETE/PUT/PATCH (read-only smoke)
- Payment endpoints with real charges
