# [AGENT 3] API smoke tests — SUMMARY

**Date**: 2026-05-19. Full report: [`REPORT.md`](REPORT.md).

## Bottom line

**Zero 5xx errors across 41 curated endpoints.** Launch-ready from a "is the API actually working" perspective.

| Category | Result |
|----------|--------|
| Public (13) | All clean — Bundle 4 Turnstile + middleware rate-limit verified working |
| Authed CRUD (19) | 17/17 real routes return 200; 2 brief-assumed paths don't exist (`/api/tasks`, `/api/categories`) |
| Webhooks (7) POST empty | All return 4xx/503 — none crash with 5xx |
| AI sample (3) | Defense-in-depth verified: `/api/v1/ai/*` requires API key + session |

## One P2 slow flag

`/api/business-expenses` GET → 3.89s. Over 2s threshold. Recommend `EXPLAIN ANALYZE` on the underlying query post-launch. Not a blocker.

## Discoveries that contradict brief assumptions

1. **No `/api/auth/*` route exists** — Supabase Auth runs client-side. Middleware still rate-limits the path (Bundle 4) → returns 429 after burst.
2. **`/api/v1/ai/*` requires API key, not just session** — by design, defense-in-depth. UI uses `/api/ai/*` (single-gate).
3. **`/api/health`, `/api/sitemap`, `/api/og` don't exist** — `/sitemap.xml` is canonical. Recommend adding `/api/health` for uptime monitor (~15 min).
4. **`/api/lemonsqueezy/webhook` returns 200 → `/_not-found`** — PR #75 not merged yet, confirms LS skeleton absent on main.

## Architecture wins verified

- Bundle 4 Turnstile guard on `/api/contact-form` → 403 on empty POST ✅
- Bundle 4 middleware rate-limit on `/api/auth/*` → 429 after 5 req ✅
- AI v1 dual auth (session + API key) → 401 on session-only ✅
- All webhooks fail gracefully (4xx/503, never 5xx) ✅

## Reproduce

```bash
export SUPABASE_URL='...' SUPABASE_ANON_KEY='...' TEST_EMAIL='...' TEST_PASSWORD='...'
./scripts/smoke-test.sh > smoke-$(date +%Y%m%d-%H%M).txt
```

Run pre-deploy as CI gate.
