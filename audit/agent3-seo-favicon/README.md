# [AGENT 3] SEO — Google SERP brand logo fix

## TL;DR

Google's "lancerwise" search result was showing the OLD circular blue
logo because the schema.org `Organization.logo` URL declared in the
homepage JSON-LD pointed to `/logo.png` — **a file that did not
exist** (HTTP 404). Google fell back to `og-image.png`, which still
ships the old branding (P2 backlog item, separate fix). One-line fix:
create `public/logo.png` from the existing `public/icon-512.png`
(current purple lightning-bolt branding). Verified 200 in production.

## Source

| Field | Value |
| ----- | ----- |
| Private repo | `fer-fer-code/lancerwise` |
| Commit | [`08fcf2fc`](https://github.com/fer-fer-code/lancerwise/commit/08fcf2fc) — "seo: fix Organization schema logo 404" |
| Files | `+ public/logo.png` (copy of `public/icon-512.png`, 14,993 bytes) |
| Deploy | Vercel production `READY @ commit 08fcf2fc` (triggered manually — git→vercel still disconnected) |

## Per-asset investigation

| Asset | Status | Branding |
| ----- | ------ | -------- |
| `/favicon.ico` (32×32) | 200, 599 B | ✓ current purple lightning bolt |
| `/favicon-16x16.png` | 200, 323 B | ✓ current |
| `/favicon-32x32.png` | 200, 599 B | ✓ current |
| `/apple-touch-icon.png` (180×180) | 200, 3166 B | ✓ current |
| `/icon-192.png` | 200, 3362 B | ✓ current |
| `/icon-512.png` | 200, 14993 B | ✓ current |
| `/icon.svg` | 200, 211 B | ✓ current |
| `/og-image.png` (1200×630) | 200, 36246 B | **✗ OLD circular blue branding** (P2 backlog) |
| `/logo.png` (before fix) | **404** | n/a — referenced by JSON-LD `Organization.logo` but file missing |
| `/logo.png` (after fix) | **200**, 14993 B | ✓ current (copy of icon-512.png) |

## How Google ended up serving the old logo

1. `src/app/layout.tsx:97` declares schema.org `Organization.logo` as `https://www.lancerwise.com/logo.png`
2. Google crawls homepage HTML, parses JSON-LD, follows the logo URL
3. The URL returns HTTP 404 (no `public/logo.png` shipped)
4. Per Google's fallback chain for SERP brand display: when `Organization.logo` is missing, the `og:image` meta is the next candidate
5. `og:image` points to `/og-image.png` which serves the OLD circular blue branding (P2 known issue)
6. SERP renders the old logo

Fixing the schema URL alone restores correct branding without touching og-image. og-image upgrade is its own follow-up (designed 1200×630 with new branding + wordmark).

## Verification

```
PRE-FIX:
  $ curl -sI https://www.lancerwise.com/logo.png
  HTTP/2 404
  content-type: text/html

POST-FIX (after commit 08fcf2fc + Vercel deploy):
  $ curl -sI https://www.lancerwise.com/logo.png
  HTTP/2 200
  content-type: image/png
  content-length: 14993
  last-modified: Sat, 16 May 2026 06:09:54 GMT
```

JSON-LD on homepage still declares the same URL — now backed:
```html
<script type="application/ld+json">
  {"@context":"https://schema.org","@type":"Organization","name":"LancerWise",
   "url":"https://www.lancerwise.com","logo":"https://www.lancerwise.com/logo.png",...}
</script>
```

## Visual proof

- `logo-prod-after-fix.png` — what `https://www.lancerwise.com/logo.png` serves now (the purple rounded-square lightning bolt — current branding)
- `og-image-current-old-branding.png` — what `https://www.lancerwise.com/og-image.png` STILL serves (the OLD circular blue logo with LancerWise wordmark — needs designed replacement, P2 backlog)
- `favicon-ico-rendered.png` — favicon.ico rendered as PNG (32×32 purple lightning, current)
- `apple-touch-icon-current.png` — apple-touch-icon (180×180 purple lightning, current)
- `curl-before-after.txt` — full curl + investigation evidence

## Expected SERP timeline

Google re-fetches Organization.logo on next homepage crawl pass (typically 1–7 days). After re-fetch, the "lancerwise" SERP knowledge panel + result thumbnails will show the current purple branding.

GSC Outdated Content tool is **not** used here — the tool verifies content removal by missing-word-in-snippet, which doesn't apply to image asset swaps. Natural recrawl is the correct path.

If after 7 days the SERP still shows the old logo, options:
1. Verify GSC property for `www.lancerwise.com` (via DNS or HTML token) and use URL Inspection → Request Indexing on the homepage. Faster than outdated-content for asset changes.
2. Submit the homepage URL to Google's outdated content tool with a verifier word that's been REMOVED from the homepage HTML (only works if homepage text actually changed).

## Deferred follow-up — og-image.png upgrade

Per memory `backlog_seo_og_image_design_upgrade.md`: replace `public/og-image.png` (currently 36 KB, old circular blue branding) with a designed 1200×630 image showing the new purple rounded-square lightning + LancerWise wordmark + tagline. P2. Not part of this commit.

## Cross-links

- [`curl-before-after.txt`](curl-before-after.txt) — full investigation evidence
- Sibling: [`../agent3-seo-vercel-noindex/`](../agent3-seo-vercel-noindex/) — the *.vercel.app indexing fix
- Memory: `backlog_seo_og_image_design_upgrade.md` (P2 og-image upgrade — deferred)
