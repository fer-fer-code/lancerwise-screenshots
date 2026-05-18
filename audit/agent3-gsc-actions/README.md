# [AGENT 3] TASK 2 — GSC sitemap + URL Inspection (post P1-1 fix)

Browser-driven actions in Google Search Console for `https://www.lancerwise.com/`. Executed 2026-05-18.

## Status

| Item | Result |
| ---- | ------ |
| Login required | NO — Chrome session already authenticated as `lancerwise.team@gmail.com` from earlier work |
| GSC property | `https://www.lancerwise.com/` URL-prefix property — exists + has full access |
| Sitemap.xml submission | ✓ **ALREADY DONE by Ramiz** May 9 2026; last processed today (May 18); status `Успешно`; 18 pages discovered |
| Indexed today | **3 / 18** pages |
| Not indexed today | **15 / 18** pages — single reason category: "Discovered/Crawled — currently not indexed" (Google queue) |
| URL Inspection on 5 priority URLs | partial — **2/5 completed**, then Google rate-limited the session |

## Key finding: Google indexing is NORMAL, not blocked

Per GSC "Why these pages aren't indexed" panel, the 15 non-indexed URLs have one of two states:
1. **"Обнаружена, не проиндексирована"** (Discovered – currently not indexed): Google found the URL via sitemap, hasn't crawled yet (queued)
2. **"Страница просканирована, но пока не проиндексирована"** (Crawled – currently not indexed): Google crawled but hasn't indexed yet (pending evaluation)

**Neither is a technical block.** Both are normal Google states for a new domain (`lancerwise.com` was registered 2026-04-24). Google's natural cycle for new domains: 60–90 day sandbox + 1–2 weeks for initial crawl + 2–4 weeks for indexing of sitemapped URLs.

This fully confirms **SEO audit Verdict C** ([`audit/agent3-seo-indexing-audit/README.md`](../agent3-seo-indexing-audit/README.md)): slow indexing, no blocks.

## URL Inspection results (per priority URL)

| # | URL | Indexed? | Last crawl | Request indexing |
|---|-----|----------|------------|-------------------|
| 1 | `https://www.lancerwise.com/` | ✅ YES (in index) | — | ✓ submitted ("Отправлен запрос на индексирование") |
| 2 | `https://www.lancerwise.com/pricing` | ✅ YES (in index) | — | ✓ submitted |
| 3 | `https://www.lancerwise.com/faq` | ✗ NO ("Discovered, not indexed") | **Отсутствует** (never crawled) | ✘ Google rate-limited (2 retries both error: "Произошла ошибка / Повторите попытку позже") |
| 4 | `https://www.lancerwise.com/blog` | _not tested_ | _N/A_ | _skipped — rate-limit would persist_ |
| 5 | `https://www.lancerwise.com/tools/rate-calculator` | _not tested_ | _N/A_ | _skipped — rate-limit would persist_ |

## Rate limit hit

After successfully submitting URL #1 (`/`) for re-indexing, URL #2 (`/pricing`) for re-indexing, and 2 retries on `/faq`, GSC returned:

```
Произошла ошибка
Ошибка при отправке запроса на индексирование. Повторите попытку позже.
```

This is GSC's per-property daily limit on "Request indexing" (typically ~10 URLs/day, but per-session throttling can fire earlier on rapid-fire requests).

**Recommended**: Ramiz retries the remaining 3 URLs (`/faq`, `/blog`, `/tools/rate-calculator`) tomorrow OR from his own Chrome session right now (the property-level limit may be session-bound).

## Bonus discovery — referring pages on `/faq`

The /faq inspection panel showed referring pages already known to Google:
- `https://www.lancerwise.com/blog/how-to-write-freelance-contract`
- `https://www.lancerwise.com/jobs/skill/html5`
- `http://www.lancerwise.com/privacy` *(http, not https — historical)*
- `http://www.lancerwise.com/project/we-need-a-new-cto` *(http — possibly old/dead URL)*

The last two http URLs are concerning — they suggest Google has crawled some pages under the previous `http://lancerwise.com` namespace. Those URLs return 404 today (verified earlier in SEO audit — apex redirects to https://www.). Worth a note: Google may have leftover cache entries pointing to those URLs. They'll fall out of cache naturally over the next few weeks.

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — task summary + URL Inspection results + rate-limit note |
| [`gsc-01-sitemaps-before.png`](gsc-01-sitemaps-before.png) | sitemap.xml status (already submitted, 18 discovered) |
| [`gsc-02-indexing-status.png`](gsc-02-indexing-status.png) | "Не проиндексированы 15 / Проиндексированы 3" tile |
| [`gsc-03-indexing-reasons.png`](gsc-03-indexing-reasons.png) | "Почему эти страницы не индексируются" panel |
| [`gsc-04-reasons-list.png`](gsc-04-reasons-list.png) | reasons rows (Discovered, Crawled — Google queue) |
| [`gsc-04b-reasons-after-scroll.png`](gsc-04b-reasons-after-scroll.png) | continuation with full reasons list visible |
| [`gsc-url1-homepage.png`](gsc-url1-homepage.png) | `/` inspection — INDEXED, FAQ rich snippet detected |
| [`gsc-url1-homepage-after-request.png`](gsc-url1-homepage-after-request.png) | "Отправлен запрос на индексирование" success dialog |
| [`gsc-url2-pricing.png`](gsc-url2-pricing.png) | `/pricing` inspection — INDEXED |
| [`gsc-url2-pricing-after-request.png`](gsc-url2-pricing-after-request.png) | post-request state |
| [`gsc-url3-faq.png`](gsc-url3-faq.png) | `/faq` inspection — NOT indexed, never crawled |
| [`gsc-url3-faq-after-request.png`](gsc-url3-faq-after-request.png) | rate-limit error dialog (first attempt) |
| [`gsc-url3-faq-retry.png`](gsc-url3-faq-retry.png) | rate-limit error dialog (retry) |

## Remaining Ramiz actions (~5 min total, tomorrow or different session)

1. https://search.google.com/search-console (lancerwise.com property already selected)
2. Top URL Inspection bar → enter `https://www.lancerwise.com/faq` → Enter
3. Click "ЗАПРОСИТЬ ИНДЕКСИРОВАНИЕ" → confirm dialog "Отправлен запрос..."
4. Repeat for `/blog` and `/tools/rate-calculator`
5. Limit ~10 requests/day, so all 3 should fit in one session

Optionally also re-request from the 12 other non-priority sitemap URLs (/about, /contact, /demo, /privacy, /terms, /api-docs, /changelog, /n8n-templates, etc.).

## Realistic timeline (re-stated)

Even with all URL Inspection requests submitted:
- Indexed URLs (`/`, `/pricing`, +1 third) may move in SERP within days
- "Discovered/not-indexed" URLs typically take **1-2 weeks** after Request Indexing to actually appear in index
- New-domain sandbox effect continues for **60-90 days** total (since 2026-04-24 registration) — ranking signals will be weak until ~mid July 2026

## Cross-links

- TASK 1 (Supabase Confirm Email): [`../agent3-supabase-confirm-email/README.md`](../agent3-supabase-confirm-email/README.md)
- Earlier SEO audit: [`../agent3-seo-indexing-audit/README.md`](../agent3-seo-indexing-audit/README.md)
- Earlier vercel.app removal (related GSC work): [`../qa-infra-step4-evidence/`](../qa-infra-step4-evidence/) (from earlier session)
