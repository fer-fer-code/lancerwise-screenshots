# SEO setup guide — Lancerwise launch

**Date:** 2026-05-23
**Filed by:** [AGENT 6] visual+seo sprint
**Status:** ready for Ramiz-day-1 setup

This guide walks through the manual SEO setup tasks that require Owner credentials and cannot be automated by code. Run through after deploy завтра.

---

## 1. Google Search Console (GSC)

### 1.1 Verify ownership
The HTML meta verification tag is **already in production** (`src/app/layout.tsx`):

```tsx
verification: {
  google: "poET7-NKe6xbwpV5jDcoYrkpksxqhSFD-Ijjqn6oUmw",
},
```

Steps:
1. Sign in to https://search.google.com/search-console with the same Google account that owns the verification code
2. Add a property: choose **URL prefix** type
3. Enter `https://www.lancerwise.com`
4. Choose **HTML tag** verification method — GSC will detect the existing meta and confirm ownership
5. Also add `https://lancerwise.com` (non-www) as a separate property if Vercel serves both

### 1.2 Submit sitemap
1. In GSC sidebar → **Sitemaps**
2. Submit URL: `sitemap.xml`
3. GSC will fetch `https://www.lancerwise.com/sitemap.xml` and start indexing
4. Confirm status = **Success** within ~24h (usually faster)

### 1.3 Request initial indexing (optional, speed up first crawl)
For the top revenue-driving pages, use **URL Inspection**:
- `https://www.lancerwise.com/`
- `https://www.lancerwise.com/pricing`
- `https://www.lancerwise.com/blog/how-to-calculate-freelance-hourly-rate`
- `https://www.lancerwise.com/blog/best-time-tracking-methods-freelancers`
- `https://www.lancerwise.com/tools/rate-calculator`

Click **Request Indexing** on each. Limit: ~10/day.

---

## 2. Bing Webmaster Tools

1. Sign in to https://www.bing.com/webmasters
2. Click **Import from Google Search Console** (one-click after step 1 above)
3. This automatically adds the property + sitemap + verification

---

## 3. Twitter Card Validator

After [AGENT 2] deploys the new OG image (see `backlog_og_image_launch_replacement.md`):

1. https://cards-dev.twitter.com/validator
2. Enter `https://www.lancerwise.com` → click **Preview card**
3. Should render `summary_large_image` with the new branded OG (purple gradient + dashboard inset)
4. If stale, the validator will re-fetch and Twitter's CDN will refresh within minutes

---

## 4. LinkedIn Post Inspector

1. https://www.linkedin.com/post-inspector/inspect/https%3A%2F%2Fwww.lancerwise.com
2. Click **Inspect**
3. Verify Open Graph preview matches Twitter card output
4. If stale, click **Refresh share content**

---

## 5. Facebook Sharing Debugger

1. https://developers.facebook.com/tools/debug/
2. Enter `https://www.lancerwise.com` → **Debug**
3. Click **Scrape Again** to force OG re-fetch
4. Verify image, title, description picked up

---

## 6. Google Rich Results Test (Schema validation)

After PR #193 merges:

1. https://search.google.com/test/rich-results
2. Enter `https://www.lancerwise.com` → **Test URL**
3. Expected entities detected:
   - Organization
   - WebSite (with SearchAction)
   - SoftwareApplication (with Free/Pro/Business offers)
   - FAQPage (on homepage)
4. **Zero errors** required. Warnings about missing optional fields (`aggregateRating`, `review`) are acceptable post-launch — see `backlog_real_testimonials_post_launch.md`.

---

## 7. Open Graph debugger

For any new public page (e.g. blog posts):

1. https://www.opengraph.xyz/
2. Enter URL → renders all platform-specific previews (Twitter, FB, LinkedIn, Slack, Discord, iMessage)

---

## 8. LinkedIn Insight Tag (analytics) — POST-LAUNCH

Defer until LinkedIn Company Page is created (currently no `linkedin.com/company/lancerwise`).

Once live:
1. Create Insight Tag at https://www.linkedin.com/campaignmanager
2. Add the tag snippet to `src/components/analytics/AnalyticsProvider.tsx`
3. Tag ID format: `<script>_linkedin_partner_id = "XXXXXXX"; ...</script>`

---

## 9. X/Twitter handle — PRE-LAUNCH BLOCKER

**[AGENT 6] verified 2026-05-23 via fxtwitter API: `@lancerwise` does NOT exist.**

Action для Ramiz:
1. Claim handle https://x.com/lancerwise
2. Set bio + profile pic (use logo + tagline from [AGENT 5] kits)
3. Pin tweet announcing launch (templates in `audit/agent5-marketing-prep-2026-05-22/TWITTER.md`)
4. After claim: re-add `sameAs` array in `src/app/layout.tsx` Organization schema:
   ```ts
   sameAs: ["https://twitter.com/lancerwise", "https://www.linkedin.com/company/lancerwise"],
   ```

PR #193 (this sprint) intentionally omitted `sameAs` until handles are claimed.

---

## Verification checklist (run завтра evening)

- [ ] GSC property added (www + non-www)
- [ ] Sitemap submitted, 0 errors in 24h
- [ ] Bing imported from GSC
- [ ] Twitter Card validator: new OG renders
- [ ] LinkedIn Post Inspector: preview correct
- [ ] FB Sharing Debugger: scrape clean
- [ ] Rich Results Test: 4 entities detected, 0 errors
- [ ] X/Twitter handle claimed → re-add sameAs in PR follow-up
