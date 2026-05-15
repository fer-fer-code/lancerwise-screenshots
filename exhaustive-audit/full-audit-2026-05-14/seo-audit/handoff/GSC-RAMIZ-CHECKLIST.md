# Google Search Console — 5-minute Checklist для Ramiz

**Why I can't do это для you:** Google's web login pipeline detects Playwright (bot signature + captcha + "unusual device" prompt + 2FA). Their Search Console API requires OAuth с `webmasters` scope which не cached locally. So GSC submission is the one SEO action that requires your manual web login.

**Vercel apex 307→301:** ✓ Already done autonomously via Vercel REST API (status code now 308 Permanent, equivalent SEO value к 301).

**IndexNow к Bing/Yandex/DuckDuckGo:** ✓ Already done autonomously (HTTP 202 Accepted for 8 URLs).

**Google Search Console — your 5 minutes:**

## Step 1: Login
1. Open https://search.google.com/search-console
2. Login с `krokusstudia2@gmail.com` (the GSC verification meta tag in site is bound к this account)

## Step 2: Add Property
1. Click "+ Add property" (top-left dropdown)
2. Choose **"URL prefix"** (NOT Domain — faster verification)
3. Enter exactly: `https://www.lancerwise.com`
4. Click "Continue"

## Step 3: Verify Ownership
1. Verification should pass instantly (the `<meta name="google-site-verification" content="poET7-NKe6xbwpV5jDcoYrkpksxqhSFD-Ijjqn6oUmw"/>` tag is already в the site)
2. If asked for verification method choice → click **"HTML tag"** → click "Verify"
3. Should see "Ownership verified" green checkmark

## Step 4: Submit Sitemap
1. Left sidebar → **"Sitemaps"**
2. Enter just: `sitemap.xml`
3. Click "Submit"
4. Status should show "Success" с ~17 URLs discovered (homepage + /pricing + /blog + /faq + /about + /contact + /demo + /tools/rate-calculator + 4 blog posts + ...)

## Step 5: Request Priority Indexing
For each URL below, use the search bar (URL Inspection) at the top of GSC:

1. `https://www.lancerwise.com/`
2. `https://www.lancerwise.com/pricing` ← NEW dedicated route (was redirect)
3. `https://www.lancerwise.com/faq`
4. `https://www.lancerwise.com/blog`
5. `https://www.lancerwise.com/demo`

For each:
- Paste URL into URL Inspection bar
- Wait для GSC к retrieve current state
- Click **"REQUEST INDEXING"** button
- Wait для confirmation (typically 1-2 minutes per URL)

GSC enforces ~10 requests/day. 5 well under limit.

## Step 6 (Bonus): Bing Webmaster Tools

IndexNow already notified Bing for 8 URLs (done autonomously) but Bing Webmaster Tools gives analytics dashboard.

1. Visit https://www.bing.com/webmasters
2. Login с Microsoft OR Google account
3. Click "Import sites from GSC" (uses your existing GSC verification — instant)
4. Submit sitemap: `https://www.lancerwise.com/sitemap.xml`

Time: 2-3 min.

## Expected Outcome

- **3-14 days:** First Google index pass (lancerwise.com starts appearing для site:lancerwise.com queries)
- **2-4 weeks:** Pages start ranking для long-tail queries
- **2-3 months:** Notable organic traffic if content + backlinks accumulate (per `backlog_blog_content_seo_strategy.md`)

## Verification Snapshot

Run these to confirm post-Ramiz-completion:

```bash
# Check apex redirect (already done)
curl -sI https://lancerwise.com | head -3
# Expect: HTTP/2 308 + location: https://www.lancerwise.com/

# Check GSC indexing status (~1-3 days after request)
# Go к GSC → URL Inspection → enter URL → look for "URL is on Google" status
```
