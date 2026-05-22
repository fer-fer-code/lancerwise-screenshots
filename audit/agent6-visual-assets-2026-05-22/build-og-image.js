#!/usr/bin/env node
/**
 * Build OG / Twitter card image (1200×630).
 * Brand: purple gradient + LancerWise logo + tagline + hero visual element.
 *
 * Tagline source: [AGENT 5] PRODUCTHUNT.md primary recommendation
 *   "All-in-one freelancer CRM with AI that actually saves time"
 */
const fs = require('fs')
const path = require('path')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const HERO = path.join(ROOT, 'hero-screenshots')
const OUT = path.join(ROOT, 'og-images')
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

const W = 1200
const H = 630

// Brand-aligned dark purple gradient — matches Neobrutalism dark theme
const BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f0726"/>
      <stop offset="50%" stop-color="#2d1b4e"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.3" r="0.6">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="0.85" cy="0.85" r="0.5">
      <stop offset="0%" stop-color="#ec4899" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ec4899" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glow2)"/>
</svg>`

// Logo + tagline + brand block (left side)
const TEXT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <style>
    .logo-text { font: 800 64px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #ffffff; letter-spacing: -0.02em; }
    .tagline { font: 600 38px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #ffffff; }
    .subtag { font: 500 22px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #d4b8ff; }
    .url { font: 500 20px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #c4b5fd; letter-spacing: 0.05em; }
    .pill { fill: #ffffff; fill-opacity: 0.12; stroke: #ffffff; stroke-opacity: 0.18; stroke-width: 1; }
    .pill-text { font: 600 16px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #ffffff; }
  </style>

  <!-- Logo bolt icon -->
  <g transform="translate(60, 60)">
    <rect x="0" y="0" width="64" height="64" rx="14" fill="#7c3aed"/>
    <path d="M 28 12 L 18 36 L 30 36 L 24 52 L 44 26 L 32 26 L 38 12 Z" fill="#ffffff"/>
  </g>
  <text class="logo-text" x="140" y="113">LancerWise</text>

  <!-- Tagline -->
  <text class="tagline" x="60" y="270">All-in-one freelancer CRM</text>
  <text class="tagline" x="60" y="320">with AI that actually</text>
  <text class="tagline" x="60" y="370">saves time.</text>

  <!-- Sub tagline -->
  <text class="subtag" x="60" y="430">Invoices · Contracts · Time tracking · CRM · AI Tools</text>

  <!-- Feature pills -->
  <g transform="translate(60, 470)">
    <rect class="pill" x="0"   y="0" width="124" height="38" rx="19"/>
    <text class="pill-text" x="62" y="24" text-anchor="middle">Free to start</text>
    <rect class="pill" x="138" y="0" width="124" height="38" rx="19"/>
    <text class="pill-text" x="200" y="24" text-anchor="middle">AI-powered</text>
    <rect class="pill" x="276" y="0" width="158" height="38" rx="19"/>
    <text class="pill-text" x="355" y="24" text-anchor="middle">EN + RU bilingual</text>
    <rect class="pill" x="448" y="0" width="118" height="38" rx="19"/>
    <text class="pill-text" x="507" y="24" text-anchor="middle">No CC needed</text>
  </g>

  <!-- URL -->
  <text class="url" x="60" y="580">lancerwise.com</text>
</svg>`

async function build() {
  const bg = Buffer.from(BG_SVG)
  const text = Buffer.from(TEXT_SVG)

  // Optional small dashboard inset on right (cropped + rounded)
  const dashScreenshot = path.join(HERO, 'hero-dashboard-en-desktop.png')
  // Resize dashboard to fit right column
  const dashResized = await sharp(dashScreenshot)
    .resize({ width: 600, withoutEnlargement: false, fit: 'inside' })
    .toBuffer()
  const dashMeta = await sharp(dashResized).metadata()

  // Create rounded mask
  const roundedMaskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dashMeta.width}" height="${dashMeta.height}">
    <rect width="${dashMeta.width}" height="${dashMeta.height}" rx="16" ry="16" fill="white"/>
  </svg>`
  const dashRounded = await sharp(dashResized)
    .composite([{ input: Buffer.from(roundedMaskSvg), blend: 'dest-in' }])
    .png()
    .toBuffer()

  const dashLeft = W - dashMeta.width - 50
  const dashTop = Math.floor((H - dashMeta.height) / 2)

  await sharp(bg)
    .composite([
      { input: dashRounded, top: dashTop, left: dashLeft },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(OUT, 'og-image-launch.png'))

  console.log('[OK] og-image-launch.png')

  // Also generate a Twitter-specific variant (same 1200×630 — same image, but copy as twitter-card.png)
  fs.copyFileSync(path.join(OUT, 'og-image-launch.png'), path.join(OUT, 'twitter-card.png'))
  console.log('[OK] twitter-card.png (copy of og-image-launch.png)')

  // Also build a "clean" variant without the dashboard inset (for cases where dashboard data overlaps poorly)
  await sharp(bg)
    .composite([{ input: text, top: 0, left: 0 }])
    .png()
    .toFile(path.join(OUT, 'og-image-clean.png'))
  console.log('[OK] og-image-clean.png (no dashboard inset)')
}

build().catch(e => { console.error(e); process.exit(1) })
