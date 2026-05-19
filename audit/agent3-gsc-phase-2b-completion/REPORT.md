# [AGENT 3] — qa-infra agent (CI pipeline / qa-gates)

# Phase 2b — GSC URL Inspection + Request Indexing — COMPLETE

**Window**: 2026-05-19 03:22 → 03:33 UTC (~11 min)
**Property**: `https://www.lancerwise.com/`
**Account**: `lancerwise.team@gmail.com`
**Browser**: Playwright MCP (recovered after Claude Code full quit + relaunch)

## Status

**7 / 7 URLs successfully submitted to Request Indexing in single session.**
**0 rate-limit errors.** Daily quota burned: ~7 of ~10 per-property limit.

## Per-URL results

| # | URL | Tier | Pre-status | Click Request Indexing | Confirmation dialog |
|---|-----|------|------------|------------------------|---------------------|
| 1 | `/blog` | Priority 1 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 2 | `/about` | Priority 1 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 3 | `/contact` | Priority 1 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 4 | `/tools/rate-calculator` | Priority 1 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 5 | `/privacy` | Bonus Tier 2 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 6 | `/terms` | Bonus Tier 2 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |
| 7 | `/changelog` | Bonus Tier 2 | "Discovered, not indexed" | ✅ clicked | ✅ "Отправлен запрос на индексирование" |

All 7 pages had identical pre-state:
- **"URL нет в индексе Google"** (URL not in Google index)
- Indexing reason: **"Обнаружена, не проиндексирована"** (Discovered, not indexed)
- Last crawl: **"Отсутствует"** (never crawled)
- Found via sitemap.xml; some had referring pages from old `http://` namespace

All 7 received identical confirmation:
> **"Отправлен запрос на индексирование"**
> "URL добавлен в приоритетную очередь сканирования. Не пытайтесь добавить страницу в индекс несколько раз. Это не повлияет на ее позицию в очереди на сканирование или приоритет."

Translated: "URL added to priority crawl queue. Don't add the page to the index multiple times. This doesn't affect its position in the crawl queue or priority."

## Combined 48h Request-Indexing log

After this session's 7 submissions, the rolling total is **10 URLs** submitted to Request Indexing across 2026-05-18 + 2026-05-19:

| URL | Submitted | Date |
|-----|-----------|------|
| `/` (homepage re-request) | ✅ | 2026-05-18 |
| `/pricing` (re-request) | ✅ | 2026-05-18 |
| `/faq` | ✅ | 2026-05-19 (earlier) |
| `/blog` | ✅ | 2026-05-19 (this session) |
| `/about` | ✅ | 2026-05-19 |
| `/contact` | ✅ | 2026-05-19 |
| `/tools/rate-calculator` | ✅ | 2026-05-19 |
| `/privacy` | ✅ | 2026-05-19 |
| `/terms` | ✅ | 2026-05-19 |
| `/changelog` | ✅ | 2026-05-19 |

## Remaining sitemap URLs (not yet submitted)

Per `audit/agent3-gsc-comprehensive/discovered-urls.txt`, 8 sitemap URLs remain unsubmitted:

| URL | Tier | Recommended action |
|-----|------|---------------------|
| `/api-docs` | 4 (low) | Submit tomorrow if quota allows |
| `/cookie-policy` | 4 (low) | Submit tomorrow |
| `/demo` | 4 (low) | Submit tomorrow |
| `/n8n-templates` | 4 (low) | Submit tomorrow |
| `/blog/best-time-tracking-methods-freelancers` | 3 (blog) | Submit tomorrow |
| `/blog/how-to-write-freelance-contract` | 3 (blog) | Submit tomorrow |
| `/blog/freelance-invoice-template` | 3 (blog) | Submit tomorrow |
| `/blog/how-to-calculate-freelance-hourly-rate` | 3 (blog) | Submit tomorrow |

Plus 2 auth pages from manual augment (lower SEO priority since `index, nofollow` per `src/app/(auth)/layout.tsx`):

| URL | Tier | Recommended action |
|-----|------|---------------------|
| `/login` | 5 (auth entry) | Optional, branded-search value only |
| `/register` | 5 (auth entry) | Optional, branded-search value only |

## Method (reproducible)

For each URL, executed via Playwright MCP:

1. Set focus on top GSC inspection bar (`combobox[role=combobox]`)
2. Use React-aware setter to populate URL: `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, URL)`
3. Dispatch `input` + `change` events
4. Press Enter to navigate to URL Inspection page
5. Wait 15s for inspection to render
6. Take full-page screenshot (`*-inspect.png`)
7. Locate "Запросить индексирование" button by exact text match (`Запросить индексированиеЗапросить снова`)
8. Click via JS evaluate (avoids ref instability across page transitions)
9. Wait 90s for Google's "Проверяется возможность индексации URL" indexability check
10. Take viewport screenshot of confirmation dialog (`*-requested.png`)
11. Click "Закрыть" to dismiss
12. Repeat with next URL

## Screenshots

| URL | Inspect | Requested |
|-----|---------|-----------|
| `/blog` | [`screenshots/01-blog-inspect.png`](screenshots/01-blog-inspect.png) | [`screenshots/01-blog-requested.png`](screenshots/01-blog-requested.png) |
| `/about` | [`screenshots/02-about-inspect.png`](screenshots/02-about-inspect.png) | [`screenshots/02-about-requested.png`](screenshots/02-about-requested.png) |
| `/contact` | [`screenshots/03-contact-inspect.png`](screenshots/03-contact-inspect.png) | [`screenshots/03-contact-requested.png`](screenshots/03-contact-requested.png) |
| `/tools/rate-calculator` | [`screenshots/04-rate-calculator-inspect.png`](screenshots/04-rate-calculator-inspect.png) | [`screenshots/04-rate-calculator-requested.png`](screenshots/04-rate-calculator-requested.png) |
| `/privacy` | [`screenshots/05-privacy-inspect.png`](screenshots/05-privacy-inspect.png) | [`screenshots/05-privacy-requested.png`](screenshots/05-privacy-requested.png) |
| `/terms` | [`screenshots/06-terms-inspect.png`](screenshots/06-terms-inspect.png) | [`screenshots/06-terms-requested.png`](screenshots/06-terms-requested.png) |
| `/changelog` | [`screenshots/07-changelog-inspect.png`](screenshots/07-changelog-inspect.png) | [`screenshots/07-changelog-requested.png`](screenshots/07-changelog-requested.png) |

## Bonus discovery — referring URLs

GSC's "Ссылающаяся страница" (referring page) data showed for `/blog`, `/about`, `/privacy`, `/terms`, `/changelog`:
```
https://www.lancerwise.com/sitemap.xml
https://www.lancerwise.com/jobs/skill/html5
http://www.lancerwise.com/privacy   ← http, historical
http://www.lancerwise.com/project/we-need-a-new-cto   ← http, historical
```

The two `http://` URLs are historical Google cache entries from before HTTPS migration. They 404 today (verified yesterday). Will fall out of Google's cache naturally over next few weeks. Not actionable.

For `/contact`, referring page was **"Не найдено"** (none) — Google found it only via sitemap.

For `/tools/rate-calculator`, referring page was **`https://lancerwise.com/`** (apex), confirming the homepage CTA link is being followed by Googlebot.

## Timeline expectations

- **24-72h**: Googlebot crawls the priority-queued URLs
- **1-2 weeks**: Submitted URLs evaluated for index inclusion (some indexed, some moved to "Crawled — currently not indexed")
- **2-4 weeks**: Remaining sitemap URLs (8 unsubmitted) get naturally crawled
- **60-90 days**: New-domain sandbox ends → meaningful ranking signals

## Cross-links

- Phase 1 + 2a (URL discovery + HTTP layer): [`../agent3-gsc-comprehensive/FINAL-REPORT.md`](../agent3-gsc-comprehensive/FINAL-REPORT.md)
- Earlier broad SEO audit (Verdict C — no blocks): [`../agent3-seo-indexing-audit/`](../agent3-seo-indexing-audit/README.md)
- Yesterday's partial GSC actions: [`../agent3-gsc-actions/`](../agent3-gsc-actions/README.md)

## Files in this dir

| File | Purpose |
|------|---------|
| [`REPORT.md`](REPORT.md) | this — per-URL results + method + bonus discoveries |
| [`SUMMARY.md`](SUMMARY.md) | short Ramiz quick-read |
| [`screenshots/`](screenshots/) | 14 PNG (7 inspect + 7 requested) |
