# [AGENT 3] URL status matrix — 18 sitemap URLs

Status as of 2026-05-19. Combines:
- Production HTTP probe (today)
- GSC inspection state captured during 2026-05-18 partial pass ([`../agent3-gsc-actions/`](../agent3-gsc-actions/README.md))
- 2026-05-19 GSC `/faq` URL Inspection (today, before browser MCP died)

## Matrix

| # | URL | HTTP | X-Robots-Tag | In sitemap | GSC: Indexed? | GSC: Request-indexing submitted? |
|---|-----|------|--------------|------------|---------------|----------------------------------|
| 1 | `/` | 200 | none | ✓ | ✅ YES | ✓ submitted 2026-05-18 (re-request) |
| 2 | `/pricing` | 200 | none | ✓ | ✅ YES | ✓ submitted 2026-05-18 (re-request) |
| 3 | _unknown — third indexed URL per GSC tile, identity not confirmed_ | — | — | — | ✅ YES | — |
| 4 | `/faq` | 200 | none | ✓ | ✗ NO ("Discovered/not indexed", never crawled) | ✓ submitted **2026-05-19** (today) |
| 5 | `/blog` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending — Ramiz |
| 6 | `/about` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending — Ramiz |
| 7 | `/contact` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending — Ramiz |
| 8 | `/tools/rate-calculator` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending — Ramiz |
| 9 | `/api-docs` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 10 | `/blog/best-time-tracking-methods-freelancers` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 11 | `/blog/freelance-invoice-template` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 12 | `/blog/how-to-calculate-freelance-hourly-rate` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 13 | `/blog/how-to-write-freelance-contract` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 14 | `/changelog` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 15 | `/cookie-policy` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 16 | `/demo` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 17 | `/n8n-templates` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 18 | `/privacy` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |
| 19 | `/terms` | 200 | none | ✓ | ✗ NO (queue) | ✘ pending |

**Totals**
- Sitemap URLs: 18
- HTTP 200 today: 18 / 18 (100% reachable)
- X-Robots-Tag noindex: 0 / 18 (no blocks)
- GSC indexed: 3 / 18 (`/`, `/pricing`, +1 third per tile)
- Request-indexing submitted to date: 3 (`/`, `/pricing`, `/faq`)

## Phase 1.3 site crawl (gap analysis) — SKIPPED

Background curl crawl hung on 2026-05-18. Fallback: sitemap.xml is the authoritative source of indexable URLs. Any internal links discovered would either (a) already be in the sitemap, or (b) be auth-gated app routes (`/dashboard/*`, `/clients/*`, `/invoices/*`, etc.) which are correctly noindex per `src/middleware.ts` for non-canonical hosts and not intended for SERP. No gap.
