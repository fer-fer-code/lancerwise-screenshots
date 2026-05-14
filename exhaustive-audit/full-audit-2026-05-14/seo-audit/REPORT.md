# SEO Audit Report — LancerWise (2026-05-14)

**Trigger:** Ramiz reported lancerwise.com не появляется в Google search results.

**Verdict:** Site IS technically SEO-ready. Most likely root cause for "not appearing в Google" is **submission timing** + **a few pre-finalization content gaps** (now fixed). Estimated time к first index pass: **3-14 days** after Ramiz submits sitemap.xml в Google Search Console.

---

## 1. Executive Summary

| Metric | State |
|---|---|
| Issues found | **5** (1 critical-content, 1 major-redirect, 3 content-consistency) |
| Critical fixed live | 1 (JSON-LD Schema.org Offer Team→Business) |
| Major fixed live | 1 (/pricing now dedicated SEO target instead of redirect) |
| Content consistency fixed | 3 (Team→Business across /contact, /faq, /about, ContactForm) |
| Manual action by Ramiz | 1 (Google Search Console — submit sitemap.xml) |
| Vercel domain config required | 1 (bare-domain 307→301 redirect) |

**Time к first index pass:** 3-14 days после GSC sitemap submission.

---

## 2. Diagnostic Findings (Phase 1)

### ✅ Working Correctly (most SEO basics already в place)

| Step | Finding |
|---|---|
| 1.1 robots.txt | ✓ Exists с proper `Allow: /` + Disallow rules для private routes (/dashboard, /settings, /api/, etc.) |
| 1.2 sitemap.xml | ✓ Exists, 17 URLs всё returning 200 OK |
| 1.3 Homepage meta tags | ✓ title (50 chars), description (130 chars), canonical, OG image/url/title/description, Twitter card, robots: index follow |
| 1.4 Per-page metadata | ✓ /faq /about /contact /privacy /terms /login /register /blog /demo всё correct |
| 1.5 JSON-LD | ✓ Organization, WebSite (с SearchAction), SoftwareApplication present |
| 1.6 OG image | ✓ 1200×630, 36KB, 200 OK at `/og-image.png` |
| 1.8 SSR | ✓ Googlebot sees 147KB rendered HTML с full content (не CSR blank shell) |
| 1.9 Security headers | ✓ HSTS, x-frame-options SAMEORIGIN, no X-Robots-Tag noindex |
| 1.10 Response time | ✓ TTFB 222ms (excellent) |
| 1.11 GSC verification | ✓ `google-site-verification` tag already present с code `poET7-NKe6xbwpV5jDcoYrkpksxqhSFD-Ijjqn6oUmw` |

### ⚠️ Issues Found

| # | Severity | Finding | Status |
|---|---|---|---|
| SEO-01 | **Critical** | JSON-LD SoftwareApplication Offer used "Team" $39 instead of new "Business" $29 (post-pricing-finalization) | ✅ FIXED — commit `d579e5ac` updated `src/app/layout.tsx` Schema.org Offer |
| SEO-02 | Major | `/pricing` was 308 redirect к `/#pricing` anchor — Google can't index hash anchors as standalone pages | ✅ FIXED — created dedicated `/pricing` page с unique title/description/canonical/OG/Twitter cards; added к sitemap.xml priority 0.95 |
| SEO-03 | Major | Content drift: `/contact`, `/faq`, `/about`, ContactForm option dropdown still mentioned "Team plan" | ✅ FIXED — все renamed к "Business plan" с $29/mo qualifier |
| SEO-04 | Major | FAQ Schema.org Q/A still said "Team plan" — would surface stale text in Google rich-results | ✅ FIXED — FAQPage schema rebuilt с Business plan answer body |
| SEO-05 | Major | Bare-domain redirect chain: `https://lancerwise.com → 307 → https://www.lancerwise.com`. 307 не passes SEO link equity (should be 301 Permanent). Plus `http://lancerwise.com` has 3-hop chain | ⏳ Manual — Ramiz needs к update в Vercel domain dashboard (Settings → Domains → set apex `lancerwise.com` к redirect 301 к `www.lancerwise.com`) |

### ✅ Not Issues (false-alarm checks)

| Check | Why не issue |
|---|---|
| Public pages CSR | All public pages are server components rendering full HTML for Googlebot |
| Auth pages indexable | /login и /register set `robots: index, nofollow` — entry points OK для branded search |
| Missing meta description | All public pages have unique descriptions 100-160 chars |
| Missing OG image | Present, 1200×630 (36KB) |
| Missing JSON-LD | 3 schemas present (Organization, WebSite, SoftwareApplication) — homepage will surface в Google's Knowledge Graph |

---

## 3. Manual Actions Required (Ramiz)

### 3.1 Google Search Console (CRITICAL — submit sitemap)

GSC verification meta tag already in place. Ramiz needs к complete:

1. Visit **https://search.google.com/search-console/**
2. Click "Add property" → **URL prefix** → enter `https://www.lancerwise.com`
3. Choose verification method: **HTML tag** — the meta tag is already in the site (`poET7-NKe6xbwpV5jDcoYrkpksxqhSFD-Ijjqn6oUmw`). Click "Verify".
4. After verified, в left sidebar → **Sitemaps** → enter `sitemap.xml` → submit
5. Bonus: в **URL Inspection** request indexing для top pages:
   - `/`
   - `/pricing`
   - `/faq`
   - `/blog`
   - `/demo`
   - `/tools/rate-calculator`
6. **Wait 3-14 days** для first index pass.

### 3.2 Vercel Domain Config (MAJOR — fix 307 redirect к 301)

1. Visit Vercel project dashboard → Settings → Domains
2. Find `lancerwise.com` (apex domain) entry
3. Ensure it has "Redirect к www.lancerwise.com" set к **Permanent (301)** не Temporary (307)
4. Save и test: `curl -sI https://lancerwise.com` should show `301` instead of `307`

### 3.3 Bing Webmaster Tools (BONUS — DuckDuckGo picks up from Bing)

1. Visit **https://www.bing.com/webmasters**
2. Add site `https://www.lancerwise.com`
3. Verify via the existing GSC tag (Bing accepts it) OR XML file
4. Submit `sitemap.xml`

---

## 4. Long-Term SEO Strategy (Phase D Backlog Post-Launch)

Files filed в memory:
- `backlog_blog_content_seo_strategy.md` — keyword targeting plan
- `backlog_backlinks_outreach_plan.md` — Indie Hackers / Product Hunt / Twitter strategy
- `backlog_core_web_vitals_monitoring.md` — weekly LCP/CLS/INP tracking

**Top priorities post-launch:**
1. Write 3-5 anchor blog posts targeting competitor keywords ("HoneyBook alternative", "Dubsado alternative", "freelancer CRM AI", "best invoicing software for freelancers")
2. Launch on Product Hunt — typically generates 30-50 do-follow backlinks
3. Indie Hackers thread documenting build journey
4. Reddit r/freelance / r/SaaS strategic comments (no spam)
5. Twitter founder build-in-public series

---

## 5. Final Deployment State

**Commit:** `d579e5ac` (deployed к production via Vercel)

**Files modified:**
- `src/app/layout.tsx` — SoftwareApplication Offer Team→Business $29
- `src/app/contact/page.tsx` + `ContactForm.tsx` — Team→Business plan references
- `src/app/about/page.tsx` — CTA text update
- `src/app/faq/page.tsx` + `faq/layout.tsx` — Q/A Team→Business + Schema.org FAQPage
- `src/app/pricing/page.tsx` — **NEW dedicated /pricing route** с unique metadata
- `src/app/sitemap.ts` — added /pricing entry priority 0.95
- `next.config.ts` — removed `/pricing → /#pricing` redirect

**Verified live:**
- ✓ `/pricing` returns 200 (was 308 → /#pricing)
- ✓ Homepage JSON-LD shows `"name":"Business","price":"29"`
- ✓ Sitemap includes /pricing
- ✓ robots.txt unchanged (correct configuration)
- ✓ Canonical, OG, Twitter card data на /pricing

---

## 6. Evidence Files (this folder)

| File | Source |
|---|---|
| `robots-FINAL.txt` | `curl -s https://www.lancerwise.com/robots.txt` |
| `sitemap-FINAL.xml` | `curl -s https://www.lancerwise.com/sitemap.xml` |
| `homepage-metatags-FINAL.html` | extracted meta/link/script tags |
| `REPORT.md` | this document |

---

*Audit completed 2026-05-14. Audit script execution + commit + deploy + verification: ~1 hour. Phase 1 conclusion: site is technically SEO-ready; first index pass starts after Ramiz submits sitemap к GSC.*
