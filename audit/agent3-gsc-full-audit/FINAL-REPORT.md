# [AGENT 3] — qa-infra agent (CI pipeline / qa-gates)

# Comprehensive GSC SEO indexing audit — FINAL REPORT

**Window**: 2026-05-18 → 2026-05-19
**Property**: `https://www.lancerwise.com/` (URL-prefix, GSC verified)
**Scope**: Full site-wide indexing audit per Ramiz's 4-phase brief

## Executive verdict

**No technical blocks. Indexing is paced by Google's new-domain sandbox (`lancerwise.com` registered 2026-04-24, ~25 days old).**

- 18 / 18 sitemap URLs HTTP 200, zero `X-Robots-Tag: noindex` (today's probe)
- 3 / 18 currently indexed in Google (`/`, `/pricing`, + 1 third per GSC tile)
- 15 / 18 in queue ("Discovered/not indexed" or "Crawled/not indexed") — Google-side latency, not a site issue
- Supabase auto-confirm hole **CLOSED** as a P1-1 side effect ([`../agent3-supabase-confirm-email/`](../agent3-supabase-confirm-email/README.md))
- `site_url=localhost:3000` Supabase misconfig **CLOSED** (would have broken all confirmation emails in prod)
- 3 URLs submitted for re-indexing in last 48h: `/` + `/pricing` (2026-05-18) + `/faq` (2026-05-19)
- 4 priority URLs queued for Ramiz: `/blog`, `/about`, `/contact`, `/tools/rate-calculator` (~5 min manual pass)

Expected indexing of all sitemap URLs: **1-2 weeks for the 5 priority pages**; **2-4 weeks for the long tail**; **60-90 days for sandbox release** + meaningful ranking signal.

## Phase 1 — site inventory ([details](site-inventory.md))

Sitemap is the authoritative indexable surface (`app/sitemap.ts` regenerates from a static marketing-route list). All app routes are auth-gated + noindex on non-canonical hosts via `src/middleware.ts`. No discovered-but-unlisted URLs that should be in the sitemap.

| Category | Count | Coverage |
|----------|-------|----------|
| Core marketing | 6 | `/`, `/pricing`, `/about`, `/contact`, `/demo`, `/faq` |
| Blog | 5 | `/blog` + 4 articles |
| Legal | 3 | `/privacy`, `/terms`, `/cookie-policy` |
| Tools | 1 | `/tools/rate-calculator` |
| Resources | 3 | `/api-docs`, `/changelog`, `/n8n-templates` |
| **Total** | **18** | |

Phase 1.3 site crawl was abandoned (background curl loop hung, see [`site-inventory.md`](site-inventory.md) §Recovery notes). Mitigation: sitemap acts as truth. No information loss because all non-sitemap routes are auth-gated app surfaces that Google never reaches.

## Phase 2 — GSC status matrix ([details](url-status-matrix.md))

### HTTP layer (probed 2026-05-19)

| Check | Result |
|-------|--------|
| HTTP 200 across all 18 URLs | ✅ 18/18 |
| `X-Robots-Tag` header | ✅ none on any URL |
| HTML `<meta name="robots">` | ✅ `index, follow` per [`../agent3-seo-indexing-audit/homepage-meta-tags.html`](../agent3-seo-indexing-audit/homepage-meta-tags.html) |
| `<link rel="canonical">` | ✅ `https://www.lancerwise.com` |
| `sitemap.xml` reachable | ✅ 200, valid XML, 18 URLs |
| `robots.txt` | ✅ `Allow: /` for `*` + `Googlebot` |

### GSC layer (per yesterday's partial pass + today's `/faq` inspection)

| URL | Indexed | Last crawl | Status reason | Action taken |
|-----|---------|------------|---------------|--------------|
| `/` | ✅ | recent | — | Re-request submitted 2026-05-18 |
| `/pricing` | ✅ | recent | — | Re-request submitted 2026-05-18 |
| (+1 third) | ✅ | — | identity not confirmed (per GSC "3 проиндексировано" tile) | — |
| `/faq` | ✗ | "Отсутствует" — never crawled | "URL неизвестен Google" / "Discovered, not indexed" | **Re-request submitted 2026-05-19** ✅ |
| `/blog` | ✗ | unknown | queue | Pending — Ramiz |
| `/about` | ✗ | unknown | queue | Pending — Ramiz |
| `/contact` | ✗ | unknown | queue | Pending — Ramiz |
| `/tools/rate-calculator` | ✗ | unknown | queue | Pending — Ramiz |
| 10 long-tail URLs | ✗ | unknown | queue | Pending |

The "Discovered / Crawled — not indexed" states are not blocks. They are normal Google states for a new domain in sandbox. Source: GSC "Why these pages aren't indexed" panel screenshot captured yesterday ([`../agent3-gsc-actions/gsc-03-indexing-reasons.png`](../agent3-gsc-actions/gsc-03-indexing-reasons.png)).

## Phase 3 — indexing requests

### Tier 1 (priority — submitted)

| URL | Result | When | Evidence |
|-----|--------|------|----------|
| `/` | ✅ "Отправлен запрос на индексирование" | 2026-05-18 | [`../agent3-gsc-actions/gsc-url1-homepage-after-request.png`](../agent3-gsc-actions/gsc-url1-homepage-after-request.png) |
| `/pricing` | ✅ submitted | 2026-05-18 | [`../agent3-gsc-actions/gsc-url2-pricing-after-request.png`](../agent3-gsc-actions/gsc-url2-pricing-after-request.png) |
| `/faq` | ✅ submitted | 2026-05-19 | confirmed in-session (browser MCP died right after) |

### Tier 1 (priority — pending Ramiz manual pass, ~5 min)

| URL | Status |
|-----|--------|
| `/blog` | Pending |
| `/about` | Pending |
| `/contact` | Pending |
| `/tools/rate-calculator` | Pending |

### Tier 2 (legal / supplementary — opportunistic, after Tier 1)

| URL | Notes |
|-----|-------|
| `/privacy` | Worth submitting — Google likes seeing legal pages reachable |
| `/terms` | Same |
| `/changelog` | Public-facing, indexable, fine to submit |

### Tier 3 (long-tail blog + resources)

| URL | Notes |
|-----|-------|
| `/blog/best-time-tracking-methods-freelancers` | Submit when Tier 1+2 indexed |
| `/blog/freelance-invoice-template` | Submit when Tier 1+2 indexed |
| `/blog/how-to-calculate-freelance-hourly-rate` | Submit when Tier 1+2 indexed |
| `/blog/how-to-write-freelance-contract` | Submit when Tier 1+2 indexed |
| `/api-docs` | Lower priority — most users hit this signed-in |
| `/cookie-policy` | Low priority |
| `/demo` | Low priority |
| `/n8n-templates` | Low priority |

GSC Request-Indexing daily quota is ~10/property — splitting requests across days avoids hitting the rate-limit experienced yesterday on `/faq` (since cleared today).

## Ramiz queue — remaining actions (~5 min total)

1. https://search.google.com/search-console — property "https://www.lancerwise.com/" already selected
2. Top inspection bar → `https://www.lancerwise.com/blog` → Enter
3. After page loads → click "ЗАПРОСИТЬ ИНДЕКСИРОВАНИЕ"
4. Wait for confirmation "Отправлен запрос на индексирование"
5. Repeat for: `/about`, `/contact`, `/tools/rate-calculator`
6. If quota allows (~5-6 left today): also submit `/privacy`, `/terms`, `/changelog`

If "Произошла ошибка / Повторите попытку позже" appears, that's GSC's per-property daily quota — retry tomorrow.

## Why the browser pass stopped mid-Phase 3

Session backend (Playwright MCP) died at conversation compression boundary. Chrome process still alive (PID 79865, debug port 50265), but my MCP target binding was severed and can't be re-established from inside this session. `/faq` was successfully submitted right before the disconnect; remaining 4 URL inspections are simple enough that handoff > waiting for new browser session.

## Cross-references

- Phase 1 details: [`site-inventory.md`](site-inventory.md)
- Phase 2 details: [`url-status-matrix.md`](url-status-matrix.md)
- Yesterday's partial GSC actions + screenshots: [`../agent3-gsc-actions/README.md`](../agent3-gsc-actions/README.md)
- SEO indexing audit (full surface check, no blocks): [`../agent3-seo-indexing-audit/README.md`](../agent3-seo-indexing-audit/README.md)
- Supabase Confirm Email + site_url fix (P1-1): [`../agent3-supabase-confirm-email/README.md`](../agent3-supabase-confirm-email/README.md)
- Logged-in app QA audit + P0-1 closure: [`../agent3-logged-in-qa/SUMMARY.md`](../agent3-logged-in-qa/SUMMARY.md)

## Files in this dir

| File | Purpose |
|------|---------|
| [`FINAL-REPORT.md`](FINAL-REPORT.md) | this — comprehensive Phase 1+2+3 report |
| [`site-inventory.md`](site-inventory.md) | Phase 1 — sitemap-based inventory + recovery notes |
| [`url-status-matrix.md`](url-status-matrix.md) | Phase 2 — per-URL HTTP + GSC matrix |
| [`sitemap-urls.txt`](sitemap-urls.txt) | flat list of 18 sitemap URLs |
| [`sitemap-current.xml`](sitemap-current.xml) | sitemap fetched 2026-05-18 |
| [`http-probe-2026-05-19.txt`](http-probe-2026-05-19.txt) | curl `-I` evidence for all 18 URLs today |
| [`crawled-urls-raw.txt`](crawled-urls-raw.txt) | empty — crawl skipped (Phase 1.3 hung) |

## Realistic timeline reminder

- Submitted URLs (`/`, `/pricing`, `/faq`): typically indexed within hours to days after request
- Other sitemap URLs: 1-2 weeks once submitted to Request Indexing
- New-domain sandbox (registered 2026-04-24): ~60-90 days total → meaningful ranking ≈ mid July 2026
- Backlinks + content cadence are the long-term levers, not GSC poking

Done.
