#!/usr/bin/env node
/**
 * Build Twitter / X profile avatar (400×400).
 *
 * Brand reference:
 *   - canonical gradient from /src/app/globals.css:
 *     linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%);
 *   - OG image recipe (build-og-image.js): violet square #7c3aed + white lightning bolt
 *
 * Design choices:
 *   - 400×400 exact (Twitter circle-crops to ~360×360 visible area inside frame)
 *   - Full-bleed violet gradient (matches site brand + twitter banner exactly).
 *   - White lightning-bolt mark centred, sized so it survives circle crop.
 *   - We render the bolt directly via SVG (not loading public/logo.png) because the
 *     production PNG uses indigo-blue #6366f1 — that clashes against the violet brand
 *     gradient. The bolt SHAPE is the brand mark; we re-render it on-brand violet so
 *     the avatar + banner harmonize.
 *   - Bolt path traced from the OG image recipe, scaled up for crisp 400×400 output.
 */
const path = require('path')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const OUT = path.join(ROOT, 'twitter-avatar-400x400.png')

const W = 400
const H = 400

// Brand violet gradient background — matches lancerwise.com primary gradient.
// White lightning bolt centred, sized so it remains intact under Twitter's circle crop.
const AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#483ACC"/>
      <stop offset="55%"  stop-color="#935AF0"/>
      <stop offset="100%" stop-color="#F897FE"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#1a0b2e" flood-opacity="0.35"/>
    </filter>
  </defs>

  <!-- Full-bleed gradient (Twitter will circle-crop) -->
  <rect width="${W}" height="${H}" fill="url(#grad)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>

  <!--
    White lightning bolt — same proportions as OG image recipe:
      original path d="M 28 12 L 18 36 L 30 36 L 24 52 L 44 26 L 32 26 L 38 12 Z"
      defined on a 64×64 grid. Scale 4× → 256×256 bolt centred in 400×400 frame.
      Translate to centre: (400-256)/2 = 72 on both axes.
  -->
  <g transform="translate(72, 72) scale(4)" filter="url(#softShadow)">
    <path d="M 28 12 L 18 36 L 30 36 L 24 52 L 44 26 L 32 26 L 38 12 Z" fill="#ffffff"/>
  </g>
</svg>`

async function build() {
  await sharp(Buffer.from(AVATAR_SVG))
    .png()
    .toFile(OUT)

  // Verify exact dimensions
  const meta = await sharp(OUT).metadata()
  if (meta.width !== W || meta.height !== H) {
    throw new Error(`Dimension mismatch: got ${meta.width}×${meta.height}, expected ${W}×${H}`)
  }
  console.log(`[OK] ${path.basename(OUT)} — ${meta.width}×${meta.height}`)
}

build().catch(e => { console.error(e); process.exit(1) })
