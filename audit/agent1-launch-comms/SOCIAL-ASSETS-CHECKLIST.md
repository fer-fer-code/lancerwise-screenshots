# Social Assets — Launch Checklist

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Status:** Inventory. Not creating assets — flagging what exists vs needs creation.

---

## Required asset sizes per platform

| Platform | Asset | Size (px) | Format | Notes |
|---|---|---|---|---|
| Twitter / X | Header card image | 1500 × 500 | JPG / PNG | Optional but recommended on launch tweet |
| Twitter / X | Inline post image | 1200 × 675 (16:9) | JPG / PNG / GIF | Up к 4 images per tweet |
| Twitter / X | Profile pic | 400 × 400 | PNG with transparent | Should already be set |
| LinkedIn | Personal post image | 1200 × 627 (1.91:1) | JPG / PNG | One image per post optimal |
| LinkedIn | Company page banner | 1128 × 191 | PNG | If company page exists |
| Product Hunt | Gallery cover | 1635 × 1080 | PNG / JPG | First image users see |
| Product Hunt | Gallery additional | 1635 × 1080 each | PNG / JPG / GIF | 4-6 total recommended |
| Product Hunt | Logo (square) | 240 × 240 | PNG transparent | Required для maker profile |
| Reddit | Post image | 1200 × 630 | JPG / PNG | Subreddit-dependent; often best as link-card metadata |
| Hacker News | Text-only (no image) | — | — | Show HN convention: text post с link in body |
| OG image (universal) | Default share card | 1200 × 630 | PNG | Used когда post shared / link previewed |

---

## Inventory: what exists в repo

| Asset | Where | Status |
|---|---|---|
| Favicon set (16, 32, 48, 192, 512) | `public/favicon-*.png` + `public/icon.svg` | ✅ Exists |
| Apple touch icon | `public/apple-touch-icon.png` | ✅ Exists |
| OG image (default site share card) | `public/og-image.png` (36 KB) | ⚠️ Exists но flagged as placeholder per `backlog_seo_og_image_design_upgrade.md` |
| Manifest + PWA icons | `public/manifest.json` | ✅ Exists |
| Logo SVG | `public/icon.svg` | ✅ Exists |
| Per-page OG images (dynamic) | None | ❌ Tracked в `backlog_seo_per_page_og_images.md` (P2 post-launch via @vercel/og) |
| Twitter card images per page | Same OG | ⚠️ Uses default site OG для all pages |
| Demo video / GIF | None | ❌ Not built |
| Screenshot collection (dashboard, invoices, contracts) | Per-page audit screenshots в `audit/agent3-*/`, `audit/agent4-*/` | ⚠️ Audit screenshots exist но not branded for launch |
| Founder photo (Ramiz) | Not в repo | ❓ Source-of-truth = Ramiz's personal photo |

---

## What needs creation (priority order)

### Tier 1 — pre-launch (essential)

1. **Updated OG image (1200 × 630)** — replace placeholder
   - Current: `public/og-image.png` is а basic placeholder
   - Recommendation: branded version showing LancerWise logo + tagline "All-in-One Hub for Freelancers" + dashboard screenshot detail
   - Owner: Ramiz OR design contractor
   - Time: ~30 min in Figma OR ~5 min via Canva template
   - Why needed: every shared link to lancerwise.com previews with this image. Default placeholder = poor first impression

2. **Twitter inline post image (1200 × 675)** — launch tweet visual
   - Content: hero shot of dashboard OR product photo с tagline
   - Could re-use OG image cropped к 16:9
   - Time: ~10 min crop / adjust

3. **LinkedIn post image (1200 × 627)** — launch post visual
   - Same as Twitter, near-identical aspect ratio (1.91:1)

### Tier 2 — recommended (if time available)

4. **Demo video (30-60 sec, 1920×1080 OR 1080×1920 vertical)**
   - Shows: sign-up → create client → generate contract → send invoice
   - Can record screen-cap via QuickTime + iMovie / Loom
   - Time: ~2 hours including recording, editing, voiceover (optional)
   - Use for: Twitter, LinkedIn, Product Hunt gallery, landing-page above-the-fold (future)

5. **Product Hunt gallery (4-6 images, 1635 × 1080)** — required if launching PH
   - Image 1: hero shot (logo + tagline + dashboard preview)
   - Image 2: CRM / pipeline view
   - Image 3: Invoice editor + PDF preview
   - Image 4: AI contract generator
   - Image 5: Time tracker
   - Image 6: Mobile responsive view
   - Each captioned with feature name
   - Time: ~2-3 hours (screenshots + branded overlays)

### Tier 3 — post-launch (for ongoing comms)

6. **Per-page OG images via @vercel/og** — tracked в `backlog_seo_per_page_og_images.md`
7. **Branded screenshots library** (consistent style для blog posts, social, support docs)
8. **Animated demo GIFs** (silent 5-10 sec loops для tweet replies / blog posts)

---

## Asset creation tools / templates

| Need | Tool option (free/cheap) | Tool option (paid/pro) |
|---|---|---|
| OG image generation | Canva (free template) | Figma + custom brand kit |
| Screenshot + annotation | macOS screenshot + Preview markup | CleanShot X ($29/yr), Shottr |
| Demo video | QuickTime + iMovie | Loom, ScreenStudio |
| Animated GIFs | Kap (free), GIF Brewery | Adobe After Effects |
| Per-page OG (dynamic) | @vercel/og (free, code-based) | — |

---

## Existing brand reference

Pull from `globals.css` + component palette:
- Primary violet: `#6366f1` (matches \`brandColor\` default)
- Gradient: `from-violet-600 via-purple-500 to-pink-500`
- Dark background: `#0f172a` (slate-950) / `#1e293b` (slate-800)
- Text on dark: `#f1f5f9` (slate-100)
- Accent green (success): `#16a34a`
- Logo: lightning bolt ⚡ + "LancerWise" wordmark

---

## Cross-references

- `backlog_seo_og_image_design_upgrade.md` — placeholder OG flagged
- `backlog_seo_per_page_og_images.md` — per-page dynamic OG (post-launch)
- `backlog_homepage_feature_icon_variation.md` — icon style consistency
- `feedback_marketing_honesty_policy.md` — НЕТ fabricated screenshots в assets
- ANNOUNCEMENT-DRAFT.md — copy that references these assets
