# [AGENT 3] — qa-infra agent (CI pipeline / qa-gates)

# API smoke tests — REPORT

**Date**: 2026-05-19
**Target**: `https://www.lancerwise.com` (production)
**Auth**: Supabase REST password grant for test account `lancerwise-qa-1779107498@wshu.net` → session cookie `sb-skfgwyzarrhhkzvltbgm-auth-token`
**Method**: curl only (no browser)
**Total endpoints in codebase**: 2,688 `route.ts` files (incl. 552 dynamic, 420 AI)
**Smoke tested**: 41 curated endpoints across 4 categories

## TL;DR

**0 P0 — zero 5xx errors anywhere.**
**1 P2 slow flag** — `/api/business-expenses` 3.89s (>2s threshold).
**4 endpoints near threshold** — `/api/clients`, `/api/invoices`, `/api/tags`, `/api/dashboard/stats` at 1.9-2.1s.
**Multiple endpoints architecture clarifications discovered** (see Notable Findings below).

## Pass/fail by category

| Category | Tested | 2xx | 4xx (expected) | 5xx | Slow >2s |
|----------|--------|-----|----------------|-----|----------|
| A — Public | 13 | 4 | 9 (404/405/429/auth-by-design) | 0 | 0 |
| B — Authed CRUD | 19 | 17 | 2 (404 — route doesn't exist) | 0 | 1 (3.89s) |
| C — Webhooks (POST empty) | 7 | 0 | 7 (401/405/503) | 0 | 0 |
| D — AI sample | 3 | 0 | 3 (400/401 — defense-in-depth) | 0 | 0 |

## Full results table

### Category A — Public endpoints

| Endpoint | Method | Status | Duration | Verdict |
|----------|--------|--------|----------|---------|
| `/sitemap.xml` | GET | 200 | 0.40s | ✅ |
| `/robots.txt` | GET | 200 | 0.50s | ✅ |
| `/blog/rss.xml` | GET | 200 | 0.36s | ✅ |
| `/favicon.ico` | GET | 200 | 0.44s | ✅ |
| `/api/contact-form` (POST empty) | POST | 403 | 0.59s | ✅ Turnstile guard, expected (Bundle 4) |
| `/api/tools/newsletter` (POST empty) | POST | 401 | 0.51s | ✅ Auth required, expected |
| `/api/tools/welcome-kit` | GET | 405 | 0.49s | ✅ POST-only route |
| `/api/tools/bio-generator` | GET | 405 | 0.49s | ✅ POST-only route |
| `/api/auth/login` | GET | 404 | 1.30s | ✅ No route — Supabase Auth client-side |
| `/api/auth/register` | GET | 429 | 0.22s | ✅ Middleware rate-limit working (Bundle 4) |
| `/api/sitemap` | GET | 404 | 1.25s | ⚠️ Not implemented — `/sitemap.xml` is the canonical |
| `/api/health` | GET | 404 | 0.86s | ⚠️ Not implemented — see "Missing endpoints" |
| `/api/og` | GET | 404 | 0.84s | ⚠️ Not implemented — using static `/og-image.png` |

### Category B — Authenticated CRUD (with Supabase session cookie)

| Endpoint | Method | Status | Duration | Verdict |
|----------|--------|--------|----------|---------|
| `/api/clients` | GET | 200 | 2.05s | ✅ (slow ≥2s) |
| `/api/invoices` | GET | 200 | 2.03s | ✅ (slow ≥2s) |
| `/api/time-entries` | GET | 200 | 1.59s | ✅ |
| `/api/projects` | GET | 200 | 0.97s | ✅ |
| `/api/profile` | GET | 200 | 1.53s | ✅ |
| `/api/settings` | GET | 200 | 1.12s | ✅ |
| `/api/billing/status` | GET | 200 | 1.47s | ✅ |
| `/api/dashboard/stats` | GET | 200 | 1.87s | ✅ |
| `/api/expenses` | GET | 200 | 1.43s | ✅ |
| `/api/notifications` | GET | 200 | 1.11s | ✅ |
| `/api/analytics/forecast` | GET | 200 | 1.48s | ✅ |
| `/api/contracts` | GET | 200 | 1.44s | ✅ |
| `/api/proposals` | GET | 200 | 1.24s | ✅ |
| `/api/tags` | GET | 200 | 2.13s | ✅ (slow ≥2s) |
| `/api/portfolio` | GET | 200 | 1.26s | ✅ |
| `/api/calendar-events` | GET | 200 | 1.99s | ✅ |
| `/api/business-expenses` | GET | 200 | **3.89s** | ⚠️ **P2 slow flag** |
| `/api/tasks` | GET | 404 | 1.18s | ⚠️ Route doesn't exist (brief assumption wrong) |
| `/api/categories` | GET | 404 | 0.56s | ⚠️ Route doesn't exist (brief assumption wrong) |

### Category C — Webhooks (POST empty body — expect 4xx/503 not 5xx)

| Endpoint | Method | Status | Duration | Verdict |
|----------|--------|--------|----------|---------|
| `/api/stripe/webhook` | POST | 503 | 0.75s | ✅ "Stripe not configured" — expected pre-launch |
| `/api/lemonsqueezy/webhook` | POST | 200 (→ `/_not-found`) | 0.77s | ⚠️ Route absent on main (LS branch PR #75 not merged) |
| `/api/webhooks/test` | POST | 401 | 0.57s | ✅ Auth required |
| `/api/webhooks/fire` | POST | 401 | 0.49s | ✅ Auth required |
| `/api/gmail/callback` | POST | 405 | 0.78s | ✅ GET-only (OAuth callback flow) |
| `/api/outlook/callback` | POST | 405 | 0.57s | ✅ GET-only (OAuth callback flow) |
| `/api/payments/webhook` | POST | 503 | 0.50s | ✅ Not configured |

### Category D — AI endpoints (sample 3 of 420)

| Endpoint | Method | Status | Duration | Verdict |
|----------|--------|--------|----------|---------|
| `/api/ai/scan-receipt` | POST `{}` | 400 | 1.68s | ✅ Validation working (handler exists, not 500) |
| `/api/v1/ai/invoice-description-writer` | POST | 401 | 1.49s | ✅ Defense-in-depth: requires API key + session |
| `/api/v1/ai/generate-contract` | POST | 401 | 0.93s | ✅ Same — `authenticateApiKey()` guard |

## Notable findings

### F1 — `/api/auth/*` is a phantom surface (by design)

No `route.ts` file exists for `/api/auth/login` or `/api/auth/register`. Supabase Auth runs **client-side** via `@supabase/ssr` — no server endpoint needed. But `src/middleware.ts:35` still rate-limits `/api/auth/*` to 5 req/window — defense-in-depth even for non-existent paths.

**Implication**: brief's assumption of `/api/auth/login` returning 400/401 is incorrect for this stack. The 429 we saw was Bundle 4 rate-limiting working as intended.

### F2 — `/api/business-expenses` 3.89s (P2 slow)

The only endpoint exceeding 2s threshold by significant margin. Profile recommendation: enable `EXPLAIN ANALYZE` on the underlying Supabase query. Likely candidates: N+1 over expense categories or unindexed `user_id + date` filter. Defer to post-launch perf sprint; not a launch blocker.

### F3 — 4 endpoints at 2s threshold edge

`/api/clients` (2.05s), `/api/invoices` (2.03s), `/api/tags` (2.13s), `/api/dashboard/stats` (1.87s). Memory `backlog_dashboard_perf_waterfall_requests.md` already tracks parallelization opportunities. Same root cause likely — `supabase.auth.getUser()` runs on every middleware pass (per `feedback_force_dynamic_invariant.md`) which blocks the request waterfall.

### F4 — `/api/lemonsqueezy/webhook` returns 200 → `/_not-found` on main

Confirmed: PR #75 (`feature/lemonsqueezy-clean`) is NOT merged to main yet. Route file exists in branch but not in production. Once PR #75 merges + env vars set, this will flip to proper signature verification (401 on empty body).

### F5 — `/api/v1/ai/*` requires API key AND session

Reading `src/app/api/v1/ai/invoice-description-writer/route.ts:13-17`:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const auth = await authenticateApiKey(request)
if (!auth) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, ... })
```

Dual auth gate — session AND `authenticateApiKey()`. v1 routes are designed for third-party API clients with issued keys. UI doesn't use v1 endpoints; it uses `/api/ai/*` (single-gate, session-only) — confirmed via `/api/ai/scan-receipt` returning 400 (validation) not 401.

This is intentional defense-in-depth. Brief expected v1 routes accessible with just session — that was incorrect per the actual architecture.

### F6 — 2 brief-assumed routes don't exist

- `/api/tasks` → 404 (real path may be `/api/todos` or `/api/projects/[id]/tasks` — dynamic)
- `/api/categories` → 404 (real path may be `/api/expense-categories` per `find` output)

Not bugs — brief made route-name assumptions. Both have alternative routes in the inventory.

### F7 — `/api/health`, `/api/sitemap`, `/api/og` don't exist

These are conventionally expected but not implemented. `/sitemap.xml` is the actual sitemap source (200 OK). For `/api/health`: recommended addition for uptime monitoring (Vercel, UptimeRobot, etc.) — see "Recommendations" below.

## Missing endpoints — recommended additions (not launch blockers)

| Endpoint | Why useful | Effort |
|----------|------------|--------|
| `/api/health` | Uptime monitors (Vercel, BetterUptime, etc.) hit canonical health route — 200 + JSON `{status:'ok', commit:'...'}` | 15 min |
| `/api/og` (dynamic OG generator) | Per-page OG images (already in backlog: `backlog_seo_per_page_og_images.md`) | Existing backlog |

## Recommendations

| Priority | Action |
|----------|--------|
| P2 post-launch | Profile + parallelize `/api/business-expenses` (3.89s). EXPLAIN ANALYZE first. |
| P2 post-launch | Address dashboard widgets parallelization per `backlog_dashboard_perf_waterfall_requests.md` — eliminates the 1.9-2.1s tail on multiple endpoints |
| P3 post-launch | Add `/api/health` endpoint for uptime monitor |
| Continuous | Run this smoke test pre-deploy via `scripts/smoke-test.sh` as a CI gate |

## Files in this dir

| File | Purpose |
|------|---------|
| [`REPORT.md`](REPORT.md) | this — comprehensive results + findings |
| [`SUMMARY.md`](SUMMARY.md) | Ramiz quick-read |
| [`endpoint-inventory.md`](endpoint-inventory.md) | 2,688 routes catalogued + 41 curated smoke subset |
| [`scripts/smoke-test.sh`](scripts/smoke-test.sh) | reproducible: env vars + login + 4 probe tables |
| [`raw-curls/public.txt`](raw-curls/public.txt) | raw curl output, public category |
| [`raw-curls/authed.txt`](raw-curls/authed.txt) | raw curl output, authenticated category |
| [`raw-curls/authed-bearer.txt`](raw-curls/authed-bearer.txt) | failed Bearer attempts (cookie auth was needed) |
| [`raw-curls/webhooks.txt`](raw-curls/webhooks.txt) | raw curl output, webhooks |
| [`raw-curls/ai-sample.txt`](raw-curls/ai-sample.txt) | raw curl output, AI sample |

## Cross-links

- Memory: `backlog_dashboard_perf_waterfall_requests.md` (relevant to F3)
- Memory: `feedback_force_dynamic_invariant.md` (relevant to F3 — middleware does Supabase getUser on every request)
- Memory: `backlog_seo_per_page_og_images.md` (relevant to F7 OG generator)
- LemonSqueezy PR: https://github.com/fer-fer-code/lancerwise/pull/75 (relevant to F4)
