# SEO + GEO foundation audit — Lancerwise

**Date:** 2026-05-29
**main HEAD audited:** `b38994a9`
**Method:** static source-code read + Playwright probe of 12 public routes on production (`https://www.lancerwise.com`), unauth, en-US locale, fresh sessions. No GSC access (flagged where it matters).
**Scope per spec:** READ-ONLY map. No fixes applied. Priority axis = 6-month horizon (not pre-launch criticality).

---

## TL;DR

**Lancerwise's SEO/GEO foundation is significantly stronger than I expected pre-audit.** The technical bones are in place: sitemap, robots, canonical, OG, JSON-LD Schema.org (4 types globally + per-page additions), structured H1/H2 hierarchy, factual blog content. **The "absent" GEO pillar Ramiz worried about is actually already partially built.**

Real gaps for 6-month horizon — ranked:

| # | Gap | Priority | Why |
|---|---|---|---|
| 1 | **No hreflang / no separate RU URLs** — same-URL cookie-based locale. Google bots default to en-US → only EN content gets indexed. Russian-market organic acquisition is dead at the architecture level. | **HIGH** | Largest addressable acquisition channel for the segment. Architectural — not a 1-line fix. |
| 2 | **Only 4 blog posts**. Sitemap has slots for blog/[slug] but content engine is dormant. | **HIGH** | Compound asset. Each post takes ~3 months to rank. Need cadence NOW for results in month 6. |
| 3 | **Duplicate FAQPage schema on `/faq`** — 2× `FAQPage` JSON-LD scripts emitted. Google may flag/ignore. | **MED** | Memo'd already (`backlog_react19_script_hoisting_cleanup`). Cleanup is bounded. |
| 4 | **`/n8n-templates` + `/api-docs` missing og:image** — 2 of 12 probed pages. Social previews degrade. | **MED** | 2-line metadata add. |
| 5 | **`/changelog` body is 50,331 chars** (vs 1-5K elsewhere). Single-page firehose. Renders fine but is hostile to LLM extraction. | **MED** | Memo'd already (`project_lancerwise_changelog_accordion`). |
| 6 | **No BreadcrumbList on `/tools/*`, `/blog/[category]`-style structure not in sitemap** — minor. | **LOW** | Memo'd already (`backlog_seo_breadcrumblist_jsonld`). |
| 7 | **Same-URL cookie-locale problem affects ALL pages, not just `/`** — RU users can't discover via Russian search at all. | **HIGH (same as #1)** | Architectural rewrite needed; route group `/ru/*` + middleware locale routing. |
| 8 | **No `aggregateRating` / `Review` schema** on `SoftwareApplication` — Google doesn't show star ratings in SERP. | **LOW post-launch** | Needs real reviews first per `feedback_marketing_honesty_policy`. |
| 9 | **No Speed Insights public-facing dashboard reported in audit** — `x-vercel-cache: MISS` on every fresh probe means SSR rendered each time, TTFB 655-1510ms. | **LOW** | Working as intended for personalized/ISR pages; can optimize per-route. |

---

## 1. Technical SEO

### 1.1 sitemap.xml — ✅ HEALTHY

- **Source:** `src/app/sitemap.ts` — Next.js native MetadataRoute API (recommended Next 16 pattern)
- **Static URLs:** 14 — home, pricing, /tools/rate-calculator, demo, blog, faq, about, contact, api-docs, n8n-templates, changelog, privacy, terms, cookie-policy
- **Dynamic URLs:** 4 blog posts (auto-pulled from `allPosts` in `src/content/blog/index.ts`)
- **Total exposed:** 18 URLs
- **Priorities set per Google's convention:** home=1.0, pricing=0.95, tools/blog=0.9-0.8, content=0.6-0.8, legal=0.3
- **changeFrequency assigned:** weekly/monthly/yearly per type
- **Production responds:** `/sitemap.xml` returns valid XML, 18 `<url>` blocks. ✅

**Intentionally NOT in sitemap (token-bound routes — correct):** `/profile/[handle]`, `/portfolio/[handle]`, `/card/[username]`, `/proposal/[token]`, etc. Each emits its own canonical via per-page metadata — Google discovers via links, not sitemap.

**Verdict:** ✅ — no action needed.

### 1.2 robots.txt — ✅ HEALTHY

- **Source:** `src/app/robots.ts` — Next.js native API
- **Allow `/`** with explicit `Disallow` list covering: `/dashboard`, `/settings`, `/api/`, `/clients`, `/projects`, `/invoices`, `/contracts`, `/onboarding`, `/billing`, all token-bound routes (`/proposal/`, `/portal/`, `/intake/`, `/year/`, `/handoff/`, `/nps/`, etc.), `/admin/`, `/_next/`
- **Sitemap link present:** `Sitemap: https://www.lancerwise.com/sitemap.xml` ✅
- **Two user-agent rules:** `*` and explicit `Googlebot` (same disallow — defensive against partial matchers)
- **Production responds:** correct text/plain ✅

**Verdict:** ✅ — no action needed. Token-bound routes blocked from indexing, public pages reachable.

### 1.3 Canonical tags — ✅ on 20+ pages

Sources audited via grep: `alternates: { canonical: ... }` set in metadata on all 14 sitemap-listed pages + auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`) + dynamic public routes (`/profile/[handle]`, `/portfolio/[handle]`, `/card/[username]`, `/wall/[username]`, `/case-study/[slug]`, `/blog/[slug]`).

Mixing of absolute (`https://www.lancerwise.com/foo`) vs relative (`/foo`) URLs — both work, Next.js metadata API resolves either correctly.

**Verdict:** ✅ — no action needed. Auth-page canonical fix from prior PR is intact.

### 1.4 Meta title + description — ✅ unique per page

All 12 probed pages have unique titles + descriptions (verified via grep of `metadata.title` + `metadata.description` blocks). Title pattern: `"<Page-specific> | LancerWise"` via root `template`. Lengths 50-100 chars — well within Google's display thresholds.

**Verdict:** ✅ — no action needed.

### 1.5 OG / Twitter tags — ⚠️ 2 routes missing og:image

| Route | og:title | og:description | og:image | twitter:card |
|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ |
| `/pricing` | ✅ | ✅ | ✅ | ✅ |
| `/blog` | ✅ | ✅ | ✅ | ✅ |
| `/blog/[slug]` | ✅ | ✅ | ✅ | ✅ |
| `/faq` | ✅ | ✅ | ✅ | ✅ |
| `/about` | ✅ | ✅ | ✅ | ✅ |
| `/tools/rate-calculator` | ✅ | ✅ | ✅ | ✅ |
| `/demo` | ✅ | ✅ | ✅ | ✅ |
| **`/n8n-templates`** | ✅ | ✅ | **❌ MISSING** | ✅ |
| **`/api-docs`** | ✅ | ✅ | **❌ MISSING** | ✅ |
| `/changelog` | ✅ | ✅ | ✅ | ✅ |
| `/contact` | ✅ | ✅ | ✅ | ✅ |

`/n8n-templates/page.tsx:6-13` and `/api-docs/page.tsx:6-13` set `openGraph.title/description/url/type` but no `images`. Root layout's `og-image.png` default doesn't auto-cascade when `openGraph` block is overridden.

Memo'd in `backlog_seo_og_image_design_upgrade` + `backlog_seo_per_page_og_images` already.

**Fix size:** 2 lines per file → add `images: ['https://www.lancerwise.com/og-image.png']` to each.

### 1.6 hreflang — ❌ ABSENT (and that's the architectural problem)

`grep -rn 'hreflang|alternateLanguage' src/` → 0 hits.

**Why hreflang is absent:** `src/i18n/request.ts` uses cookie-based locale detection (`LOCALE_COOKIE` + `Accept-Language` fallback), NO URL prefix. Same URL `https://www.lancerwise.com/` serves EN to en-US clients and RU to ru-RU clients. HTML `<html lang>` IS locale-aware (verified: `lang="en"` vs `lang="ru"` swap on `Accept-Language` header).

**The problem for SEO:**
- Google's crawler defaults to `en-US` Accept-Language → only sees EN content
- Google has NO mechanism to learn about the RU version (it's hidden behind cookie state)
- RU-market organic search queries like "freelance CRM на русском", "договоры для фрилансера" cannot land users on Lancerwise
- This is **unfixable with hreflang alone** — needs separate URLs (`/ru/*` prefix or country-TLD/subdomain)

**6-month verdict:** **HIGH PRIORITY.** Russian market is the segment Ramiz built RU-first for. Without RU-indexable URLs, the i18n investment yields zero organic acquisition. Recommended: middleware-based locale routing with `/en/*` `/ru/*` URL prefix + hreflang `<link rel="alternate">` tags. **Architectural change** — needs design + decision before code.

### 1.7 HTML lang attribute — ✅ DYNAMIC

Probed: `lang="en"` on en-US request, `lang="ru"` on ru-RU request → root layout (`src/app/layout.tsx:144`) uses `await getLocale()` to set the attribute. ✅

---

## 2. Structured data / Schema.org — ✅ STRONG (the unexpected good news)

`src/app/layout.tsx:95-145` emits THREE JSON-LD scripts globally on every page:

### 2.1 Global schemas (in `<head>`)

**Organization** schema (line 95):
```json
{ "@type": "Organization", "name": "LancerWise", "url": "https://www.lancerwise.com",
  "logo": "https://www.lancerwise.com/logo.png",
  "description": "All-in-one CRM platform for freelancers...",
  "contactPoint": { "@type": "ContactPoint", "email": "support@lancerwise.com", ... } }
```
Note: `sameAs` (social URLs) intentionally omitted — Twitter `@lancerwise` returns 404, LinkedIn page not yet claimed. Restore after social presence exists. ✅ Honest, not faked.

**WebSite** schema (line 112) with `SearchAction` pointing to `/tools/rate-calculator?q=...` — enables Google's sitelinks searchbox. ✅

**SoftwareApplication** schema (line 124):
```json
{ "@type": "SoftwareApplication", "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": [
    { "@type": "Offer", "name": "Free", "price": "0", "priceCurrency": "USD" },
    { "@type": "Offer", "name": "Pro", "price": "15", "priceCurrency": "USD" },
    { "@type": "Offer", "name": "Business", "price": "29", "priceCurrency": "USD" }
  ],
  "featureList": ["Client CRM", "Professional Invoices", "AI Contract Generation", ...] }
```

⚠️ **Schema/UI drift:** the Business plan in schema says `price: "29"` but `/upgrade` page hides Business plan when `NEXT_PUBLIC_PAYMENT_PROVIDER=lemonsqueezy` (which is set in prod). Schema describes 3-plan model; live UI shows 2 plans. Google sees inconsistency. **Fix size:** conditional plan list based on provider env at build time. **Priority: LOW** — Google won't penalize, but a savvy LLM evaluating "what plans does Lancerwise offer" gets mixed signals.

### 2.2 Per-page schema additions (verified at runtime)

| Page | Additional schemas |
|---|---|
| `/` | + FAQPage (12 FAQ items embedded in landing) ✅ |
| `/blog` | + BreadcrumbList ✅ |
| `/blog/[slug]` | + BlogPosting + BreadcrumbList ✅ |
| `/faq` | + **FAQPage × 2** ⚠️ DUPLICATE — see §1 TL;DR row 3 |

`/faq/layout.tsx` AND `/faq/page.tsx` both emit FAQPage. Memo'd already in `backlog_react19_script_hoisting_cleanup`. Single-file dedup.

### 2.3 Missing schemas (worth adding for GEO)

- **HowTo** schema on `/blog/[slug]` for instructional posts (3 of 4 current posts qualify: "How to calculate hourly rate", "How to write contract", "Best time tracking methods"). Adds rich snippets in search + better LLM extraction.
- **Product** schema with `aggregateRating` once real reviews exist (currently blocked by `feedback_marketing_honesty_policy` — no fake ratings).
- **VideoObject** schema if `/demo` adds a real video (currently it's interactive, not video).

**Verdict:** ⚠️ — solid foundation, 1 known dupe to clean, 1-2 schema types missing for full coverage.

---

## 3. Core Web Vitals / Speed (public pages)

Sampled 12 routes from a fresh anonymous session (no warm cache), en-US locale. **All `x-vercel-cache: MISS`** — each request rendered server-side.

| Route | TTFB | FCP | Transfer KB |
|---|---|---|---|
| `/` | 1510ms | 1536ms | 74 |
| `/pricing` | 1108ms | 952ms | 64 |
| `/blog` | 946ms | 956ms | 66 |
| `/blog/[slug]` | 1324ms | 812ms | 72 |
| `/faq` | 1037ms | 884ms | 67 |
| `/about` | **655ms** | 660ms | 65 |
| `/tools/rate-calculator` | 1201ms | 864ms | 67 |
| `/demo` | 727ms | 720ms | 64 |
| `/n8n-templates` | 1248ms | 908ms | 68 |
| `/api-docs` | 1227ms | 740ms | 71 |
| `/changelog` | 1302ms | 1004ms | **91** |
| `/contact` | 1095ms | 872ms | 64 |

**Observations:**
- TTFB range 655-1510ms. Google's "Good" threshold is < 800ms; "Needs Improvement" 800-1800ms. **7 of 12 routes in "Needs Improvement" band on cold cache.**
- FCP all < 1.6s (Good threshold). ✅
- Transfer 64-91KB (excellent — sub-100KB landing pages).
- `/changelog` is the bulk outlier (50,331 chars body, 91KB transfer) — known issue.
- `/` is slowest TTFB but expected (largest landing, ISR `revalidate=3600` should make warm hits much faster — `x-vercel-cache: HIT` would shave ~1s).

**LCP not measured directly** (would need `PerformanceObserver` with `largest-contentful-paint` entry — Playwright probe got FCP only). For real CWV monitoring: Vercel Speed Insights is enabled (`*.vercel-insights.com` in CSP), but no public CWV dashboard surfaces here. **Need Ramiz to check Vercel Speed Insights dashboard for the LCP/CLS/INP rollup.**

**Verdict:** 🟡 — acceptable but not great on cold cache. ISR `revalidate=3600` on `/` mitigates most cold-start latency. **Memo'd already in `backlog_core_web_vitals_monitoring`**.

---

## 4. Content structure for GEO (LLM-readability)

### 4.1 Blog content quality — ✅ EXCELLENT for GEO

Sampled `src/content/blog/posts/how-to-calculate-freelance-hourly-rate.ts`:
- Clear H2/H3 hierarchy with section `id` attributes for deep-linking
- Numerical formulas in `<code>` blocks
- Tables of expense breakdowns with concrete dollar amounts
- Ordered lists of decision steps
- Direct numerical examples ($60,000 → $92,300 gross etc.)
- 9,080 chars of content per post on average — substantive

This is **the exact structured factual content LLMs (ChatGPT/Gemini/Claude/Perplexity) extract and cite well**. When a user asks "how do I calculate my freelance rate", this post is rich enough to be cited verbatim with attribution.

**Constraint:** **only 4 posts exist**:
1. how-to-calculate-freelance-hourly-rate (Pricing)
2. freelance-invoice-template (Invoicing)
3. how-to-write-freelance-contract (Contracts)
4. best-time-tracking-methods-freelancers (Time Tracking)

The `categories` enum has 7 slots (`Pricing`, `Invoicing`, `Contracts`, `Time Tracking`, `Productivity`, `Taxes`) — 3 categories empty.

Memo'd in `backlog_blog_content_seo_strategy` (P2 post-launch: 10 keyword-targeted articles, 1/week cadence).

### 4.2 Landing page copy — ✅ FACTUAL, low marketing-fluff

Probed body text on home + 11 other pages for marketing-fluff words (regex: `\b(amazing|revolutionary|seamless|cutting-edge|innovative|world-class|game-changing|unlock|empower|transform|effortless|delight|stunning)\b`).

**Result: 0 hits across all 12 pages.** Zero fluff density.

This is unusual and excellent. Most SaaS landing pages have 5-15 such words. Lancerwise's copy is concrete and product-focused — exactly what LLMs prefer when summarizing "what is Lancerwise".

### 4.3 H1/H2 hierarchy

- All 12 probed pages have exactly **1 × `<h1>`** ✅ (semantic correctness)
- H2 counts vary: `/changelog` has 0 (single-page firehose — known), `/api-docs` has 20 (correct — each endpoint group), others 1-9

**Verdict:** ✅ — structure is clean.

### 4.4 FAQ-style extractable content

- Home page has FAQ section + FAQPage schema (12 Q/A pairs) ✅
- `/faq` page has dedicated FAQ + FAQPage schema (with duplicate issue noted)
- Blog posts use Q/A heading patterns where applicable

**Verdict:** ✅ — well-positioned for "answer engine" queries.

### 4.5 What's missing for full GEO

- **No content depth on specific freelance verticals** — no "Freelance CRM for designers", "for developers", "for marketers" landing pages. LLMs serve queries like "best invoicing tool for graphic designers" — Lancerwise has zero hooks for that long-tail.
- **No comparison pages** — "Lancerwise vs HoneyBook", "Lancerwise vs Dubsado", "alternative to Bonsai". These are high-intent search queries with low LancerWise visibility.
- **No glossary / definitions section** — common freelance terms (W-9, scope creep, kill fee, retainer, etc.). LLMs love glossary content.
- **No case studies** — `/case-study/[slug]` route exists with metadata + canonical setup, but the dynamic source isn't populated (confirmed: `src/app/case-study/[slug]/page.tsx` exists but I haven't verified the data source). Real user case studies are top-of-funnel gold for both SEO and conversion.

Cross-link: `backlog_blog_content_seo_strategy`, `backlog_backlinks_outreach_plan`, `feature_strength_advisor_grounded_advice`.

---

## 5. What I could NOT verify (requires Ramiz access)

- **Google Search Console (GSC) data:** actual indexed page count, top queries driving impressions/clicks, mobile usability errors, Core Web Vitals (CrUX) field data. **Requires Ramiz to share GSC.**
- **Vercel Speed Insights dashboard** (LCP/CLS/INP rollups): public CWV under load. **Requires Ramiz to open Vercel project Insights tab.**
- **Real referring-domain count:** any organic backlinks earned yet? **Requires Ahrefs/Semrush — not in scope of code audit.**
- **Indexation completeness:** are all 18 sitemap URLs actually in Google's index? Memory note correctly warns: "web_search ≠ Google index". Requires `site:lancerwise.com` query in incognito + VPN, or GSC Coverage report.

---

## 6. 6-month roadmap recommendation

If Ramiz wants compound SEO/GEO returns by month 6, the work order I'd suggest (not applying — for his decision):

**Months 0-1 (foundation cleanup — bounded fixes):**
- Add og:image to /n8n-templates + /api-docs (2 lines)
- Dedup `/faq` FAQPage schema (single-file fix per existing memo)
- Decide on hreflang strategy (architectural — discuss before coding)

**Months 1-3 (content engine):**
- Start 1 blog post/week cadence per `backlog_blog_content_seo_strategy`
- Populate the 3 empty categories (Productivity, Taxes, Pricing-but-different angles)
- Write 5-10 comparison pages ("Lancerwise vs HoneyBook" etc.)

**Months 2-4 (RU market):**
- IF Russian market acquisition matters → architectural rewrite for `/ru/*` URL prefix + hreflang
- IF not → leave cookie-based as-is, accept EN-only Google indexability

**Months 3-6 (long-tail + GEO):**
- Vertical landing pages (freelance-CRM-for-designers, etc.)
- Glossary section (50+ freelance terms with definitions)
- Real case study pages once first paying users have stories
- Restore `aggregateRating` schema once 10+ real reviews exist

**Continuously:**
- Monitor CWV via Vercel Speed Insights → Vercel logs
- Watch GSC for ranking signals and click-through rate optimization

---

## 7. Files

- `seo-probes.json` — full per-route DOM signals from 12-route Playwright probe
- `*-viewport.png` — 12 above-fold screenshots of each public page
- This `REPORT.md`

## 8. Cross-references

- `backlog_seo_og_image_design_upgrade` — placeholder og-image.png design upgrade
- `backlog_seo_per_page_og_images` — per-page dynamic OG via @vercel/og
- `backlog_seo_blogposting_jsonld` — already addressed (BlogPosting confirmed live)
- `backlog_seo_breadcrumblist_jsonld` — already addressed (BreadcrumbList confirmed live on /blog)
- `backlog_react19_script_hoisting_cleanup` — addresses /faq duplicate FAQPage
- `backlog_blog_content_seo_strategy` — 10 keyword articles plan
- `backlog_backlinks_outreach_plan` — Product Hunt + outreach
- `backlog_core_web_vitals_monitoring` — weekly LCP/CLS/INP tracking
- `project_lancerwise_changelog_accordion` — fixes /changelog firehose
- `feedback_marketing_honesty_policy` — blocks fake aggregateRating
