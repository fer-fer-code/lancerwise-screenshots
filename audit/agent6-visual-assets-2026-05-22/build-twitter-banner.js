#!/usr/bin/env node
/**
 * Build Twitter / X profile header (1500×500).
 *
 * Brand reference:
 *   - canonical gradient from /src/app/globals.css:
 *     --background-image-gradient-primary:
 *       linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%);
 *   - dark backdrop matches build-og-image.js: #0f0726 → #2d1b4e → #6d28d9
 *   - violet glow shadow: rgb(147 90 240 / 0.20)
 *
 * Tagline: "All-in-one CRM for freelancers"
 *   (shorter variant for header — Twitter banner crops differently on mobile vs desktop)
 *
 * Layout safety: Twitter crops the banner aggressively on mobile (centre ~60% only).
 *   Avatar overlap sits at bottom-left ~120px from left edge.
 *   Therefore the wordmark + tagline are centred horizontally with healthy padding
 *   from all edges, and nothing critical sits in the bottom-left "avatar zone".
 */
const fs = require('fs')
const path = require('path')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const OUT = path.join(ROOT, 'twitter-banner-final-1500x500.png')

const W = 1500
const H = 500

// Dark-mode backdrop — same dark→violet ramp as OG image, just stretched wide.
// Two radial glows give depth (top-left violet halo + bottom-right pink halo).
const BG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0f0726"/>
      <stop offset="40%"  stop-color="#2d1b4e"/>
      <stop offset="80%"  stop-color="#4c1d95"/>
      <stop offset="100%" stop-color="#6d28d9"/>
    </linearGradient>
    <radialGradient id="glowLeft" cx="0.18" cy="0.4" r="0.5">
      <stop offset="0%"   stop-color="#935AF0" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#935AF0" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowRight" cx="0.82" cy="0.65" r="0.5">
      <stop offset="0%"   stop-color="#F897FE" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="#F897FE" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowAccent" cx="0.5" cy="0.5" r="0.65">
      <stop offset="0%"   stop-color="#483ACC" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#483ACC" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glowLeft)"/>
  <rect width="${W}" height="${H}" fill="url(#glowRight)"/>
  <rect width="${W}" height="${H}" fill="url(#glowAccent)"/>
</svg>`

// Foreground — wordmark + tagline + feature pills.
// Centred so Twitter's mobile crop (~middle 60%) still shows the wordmark + tagline.
// Bottom-left ~140px reserved as "avatar safe zone" (Twitter overlaps avatar at bottom-left).
const FG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="wordmarkGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#F897FE"/>
    </linearGradient>
  </defs>
  <style>
    .wordmark { font: 800 96px -apple-system, system-ui, 'SF Pro Display', 'Helvetica Neue', sans-serif; fill: url(#wordmarkGrad); letter-spacing: -0.025em; }
    .tagline  { font: 500 38px -apple-system, system-ui, 'SF Pro Display', 'Helvetica Neue', sans-serif; fill: #e9d5ff; letter-spacing: -0.005em; }
    .pill        { fill: #ffffff; fill-opacity: 0.10; stroke: #ffffff; stroke-opacity: 0.22; stroke-width: 1; }
    .pill-text   { font: 600 18px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #ffffff; }
    .url         { font: 500 22px -apple-system, system-ui, 'SF Pro Display', sans-serif; fill: #c4b5fd; letter-spacing: 0.06em; }
  </style>

  <!-- Logo bolt icon — same recipe as OG image, scaled up -->
  <g transform="translate(560, 90)">
    <rect x="0" y="0" width="88" height="88" rx="20" fill="url(#wordmarkGrad)"/>
    <path d="M 38 16 L 24 50 L 40 50 L 32 72 L 60 36 L 44 36 L 52 16 Z" fill="#0f0726"/>
  </g>

  <!-- Wordmark centred -->
  <text class="wordmark" x="668" y="161">Lancerwise</text>

  <!-- Tagline centred under wordmark -->
  <text class="tagline" x="${W / 2}" y="245" text-anchor="middle">All-in-one CRM for freelancers</text>

  <!-- Feature pills row, centred -->
  <g transform="translate(${(W - 720) / 2}, 290)">
    <rect class="pill" x="0"   y="0" width="170" height="42" rx="21"/>
    <text class="pill-text" x="85"  y="27" text-anchor="middle">AI-powered</text>
    <rect class="pill" x="186" y="0" width="170" height="42" rx="21"/>
    <text class="pill-text" x="271" y="27" text-anchor="middle">Free to start</text>
    <rect class="pill" x="372" y="0" width="170" height="42" rx="21"/>
    <text class="pill-text" x="457" y="27" text-anchor="middle">EN + RU bilingual</text>
    <rect class="pill" x="558" y="0" width="162" height="42" rx="21"/>
    <text class="pill-text" x="639" y="27" text-anchor="middle">No CC needed</text>
  </g>

  <!-- URL — bottom-right (clear of bottom-left avatar zone) -->
  <text class="url" x="${W - 60}" y="${H - 40}" text-anchor="end">lancerwise.com</text>
</svg>`

async function build() {
  const bg = Buffer.from(BG_SVG)
  const fg = Buffer.from(FG_SVG)

  await sharp(bg)
    .composite([{ input: fg, top: 0, left: 0 }])
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
