# [AGENT 3] SEO indexing audit — 2026-05-18

**Report**: site reportedly not appearing in Google search.

## Verdict: **C — SLOW INDEXING (no blocks, no regression)**

All technical SEO surfaces are clean and properly configured. Google simply has not yet crawled + indexed the new pages. Recommended action: submit sitemap to Google Search Console + use URL Inspection tool to accelerate per-page indexing.

Earlier middleware-regression hypothesis (`*.vercel.app → noindex` rule possibly over-firing on canonical host) was investigated and **fully refuted** — see §"Hypothesis ruled out" below.

## What was checked

| Surface | Status | Evidence |
|---------|--------|----------|
| `robots.txt` | ✓ `Allow: /` for `*` and `Googlebot`; only private routes Disallowed | [`robots-txt-content.txt`](robots-txt-content.txt) |
| HTTP response headers on `/`, `/pricing`, `/faq`, `/blog` | ✓ NO `X-Robots-Tag` header | [`http-headers-by-host.txt`](http-headers-by-host.txt) |
| HTML `<meta name="robots">` | ✓ `index, follow` | [`homepage-meta-tags.html`](homepage-meta-tags.html) |
| HTML `<meta name="googlebot">` | ✓ `index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1` (max rich-result coverage) | same |
| `<link rel="canonical">` | ✓ `https://www.lancerwise.com` | same |
| GSC ownership verification | ✓ `google-site-verification` meta present (token `poET7-NKe6xbwpV5jDcoYrkpksxqhSFD-Ijjqn6oUmw`) | same |
| `sitemap.xml` | ✓ Live, valid XML, 18 marketing URLs | [`sitemap-content.xml`](sitemap-content.xml) |
| Schema.org JSON-LD | ✓ Organization + WebSite + SoftwareApplication (3 blocks) | same |
| OpenGraph + Twitter cards | ✓ All present, 1200×630 OG image | same |
| Apex `lancerwise.com` → `www.lancerwise.com` | ✓ HTTP 308 permanent redirect | [`http-headers-by-host.txt`](http-headers-by-host.txt) |
| HSTS + security headers | ✓ HSTS preload, X-Frame-Options, nosniff, Permissions-Policy, Referrer-Policy | same |
| `src/middleware.ts` | ✓ `CANONICAL_HOSTS` includes both `www.lancerwise.com` AND `lancerwise.com`; noindex only stamped on non-canonical hosts | [`middleware-snippet.ts`](middleware-snippet.ts) |
| `src/app/layout.tsx` `metadata.robots` | ✓ `{ index: true, follow: true, googleBot: { ... } }` | code inspection |
| `next.config.ts` | ✓ Headers function only sets security headers, no robots overrides | code inspection |

**Zero blocks at any layer.** Site is exactly as indexable as it should be.

## Hypothesis ruled out (my earlier middleware concern)

Per my pre-audit note: my own earlier work on `*.vercel.app` noindex middleware *might* have over-fired on the canonical host. Result: **NO**, the logic is correct.

`src/middleware.ts` lines 20-26:
```typescript
const CANONICAL_HOSTS = new Set(['www.lancerwise.com', 'lancerwise.com'])

function shouldNoIndex(host: string | null): boolean {
  if (!host) return true
  const h = host.toLowerCase().split(':')[0] // strip port
  return !CANONICAL_HOSTS.has(h)
}
```

Lines 169-171:
```typescript
if (noIndex) {
  supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
}
```

For `www.lancerwise.com` → `CANONICAL_HOSTS.has('www.lancerwise.com')` returns `true` → `noIndex = false` → header NOT set.

Confirmed empirically:
```
curl -I https://www.lancerwise.com/
→ HTTP/2 200, NO X-Robots-Tag
curl -I https://www.lancerwise.com/pricing
→ HTTP/2 200, NO X-Robots-Tag
curl -I https://www.lancerwise.com/faq
→ HTTP/2 200, NO X-Robots-Tag
```

So the canonical host is properly indexable. Defense-in-depth on `*.vercel.app` is intact and working.

## Yellow flag noted (NOT a block — but worth fixing post-launch)

`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` is set on every marketing page (`/`, `/pricing`, `/faq`, `/blog`).

**Cause**: Next.js default for dynamic-rendered routes. The middleware runs `supabase.auth.getUser()` on every request (line 75), forcing every route to be dynamic SSR. This means:
- No edge/CDN cache benefit
- Higher TTFB (Server Side Render on every hit)
- Google may treat as low-quality / non-cacheable
- Increases Vercel function invocation costs

**Fix path** (defer to post-launch — not an indexing blocker):
- (a) Short-circuit middleware on known-public marketing paths BEFORE the Supabase `auth.getUser()` call
- (b) Or extract a thinner middleware that only runs auth check on `/api/*` + `protectedRoutes`
- (c) Or annotate marketing pages with explicit `export const dynamic = 'force-static'` where possible

Estimated effort: 1-2 hours. Trade-off — done now would force a deploy + verification cycle; better to bundle into a "performance pass" sprint.

## Realistic timeline for Google indexing

Even with zero blocks, expect:
- **1-2 weeks for natural crawl + index** of homepage + sitemapped URLs
- **2-4 weeks for ranking signals** to settle (new domain authority is low)
- **3-6 months for organic traffic** to reach steady-state levels

`lancerwise.com` is a recently-registered domain (per Vercel project creation timestamp 2026-04-24). Google applies a "sandbox effect" / trust-building period — even with perfect technical SEO, indexing is slow for the first 60-90 days.

## Recommended actions (in priority order)

### Immediate (Ramiz, ~5 min total)
1. **Submit sitemap.xml to GSC**:
   - https://search.google.com/search-console/sitemaps (select lancerwise.com property)
   - "Add a new sitemap" → enter `sitemap.xml` → Submit
   - Google will crawl the 18 URLs within 24-72h

2. **Force-index key pages via URL Inspection tool**:
   - https://search.google.com/search-console (lancerwise.com property)
   - For each priority URL (`/`, `/pricing`, `/faq`, `/blog`, `/tools/rate-calculator`):
     - Paste URL into top search bar
     - Click "Test live URL" → wait ~30s
     - Click "Request indexing"
   - Limit ~10 URL requests / day, but this directly triggers Google to crawl
   - Typically indexed within hours of request

3. **Verify GSC property is on `https://www.lancerwise.com` (NOT bare `lancerwise.com` URL prefix)**:
   - Per the canonical, `www.` IS the indexable host
   - GSC property type should be either "Domain" (covers all subdomains) OR "URL prefix `https://www.lancerwise.com/`"
   - If only `https://lancerwise.com/` URL-prefix property exists, add the `www.` one too

### Post-launch (1-2 hours of dev work, defer)
4. Optimize cache-control for marketing pages — short-circuit middleware on public paths, enable static caching, reduce TTFB
5. Add `BlogPosting` schema to `/blog/[slug]` (per memory `backlog_seo_blogposting_jsonld.md`)
6. Add `BreadcrumbList` schema to `/blog/[slug]` + `/tools/*` (per memory `backlog_seo_breadcrumblist_jsonld.md`)
7. Build backlinks per `backlog_backlinks_outreach_plan.md` (target 50+ referring domains by day 90)

### Continuous (post-launch)
8. Monitor Core Web Vitals per `backlog_core_web_vitals_monitoring.md` (LCP/CLS/INP — ranking factor)
9. Publish blog content per `backlog_blog_content_seo_strategy.md` (10 keyword-targeted articles, 1/week)

## Files in this dir

| File | Purpose |
| ---- | ------- |
| [`README.md`](README.md) | this — verdict + recommended actions |
| [`http-headers-by-host.txt`](http-headers-by-host.txt) | `curl -I` output for canonical (4 pages) + apex |
| [`robots-txt-content.txt`](robots-txt-content.txt) | full robots.txt |
| [`homepage-meta-tags.html`](homepage-meta-tags.html) | extracted meta + link tags from homepage HTML |
| [`sitemap-content.xml`](sitemap-content.xml) | full sitemap.xml |
| [`middleware-snippet.ts`](middleware-snippet.ts) | snapshot of `src/middleware.ts` showing CANONICAL_HOSTS logic |

## Cross-links

- Earlier SEO work: `audit/agent3-vercel-reconnect/` + my own `*.vercel.app` indexing-block migration
- Related memory: `backlog_seo_og_image_design_upgrade.md`, `backlog_seo_per_page_og_images.md`, `backlog_seo_blogposting_jsonld.md`, `backlog_seo_breadcrumblist_jsonld.md`, `backlog_blog_content_seo_strategy.md`, `backlog_backlinks_outreach_plan.md`, `backlog_core_web_vitals_monitoring.md`
- Audit verification of vercel.app removal: in-flight per earlier work (GSC removal pending)
