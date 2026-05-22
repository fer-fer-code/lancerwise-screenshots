#!/usr/bin/env node
/**
 * Build PH gallery composites:
 *  - ph-05-mobile-responsive (composite phone+tablet+desktop overlap)
 *  - ph-06-multi-language (RU + EN side-by-side)
 *
 * Output: 1270×760 PNG, brand purple gradient background
 */
const fs = require('fs')
const path = require('path')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const HERO = path.join(ROOT, 'hero-screenshots')
const PHDIR = path.join(ROOT, 'ph-gallery')

const W = 1270
const H = 760

const PURPLE_GRADIENT_SVG = (w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1a0b2e"/>
      <stop offset="50%" stop-color="#2d1b4e"/>
      <stop offset="100%" stop-color="#4c1d95"/>
    </linearGradient>
    <radialGradient id="r" cx="0.5" cy="0.5" r="0.7">
      <stop offset="0%" stop-color="#a855f7" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#a855f7" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#r)"/>
</svg>`

const LABEL_SVG = (text, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <style>
    .title { font: 700 36px -apple-system, system-ui, sans-serif; fill: #ffffff; }
    .sub   { font: 500 18px -apple-system, system-ui, sans-serif; fill: #d4b8ff; }
    .bigtag { font: 800 56px -apple-system, system-ui, sans-serif; fill: #ffffff; }
  </style>
  ${text}
</svg>`

async function buildMobileResponsive() {
  const mobile = path.join(HERO, 'hero-dashboard-en-mobile.png')
  const desktop = path.join(HERO, 'hero-dashboard-en-desktop.png')

  const bg = Buffer.from(PURPLE_GRADIENT_SVG(W, H))

  // Resize phone — keep portrait aspect but smaller
  // mobile is 393×852 @3x = 1179×2556
  const phone = await sharp(mobile)
    .resize({ width: 270, withoutEnlargement: false, fit: 'inside' })
    .toBuffer()
  const phoneMeta = await sharp(phone).metadata()

  // Resize desktop screenshot
  const desk = await sharp(desktop)
    .resize({ width: 800, withoutEnlargement: false, fit: 'inside' })
    .toBuffer()
  const deskMeta = await sharp(desk).metadata()

  // Add rounded-corner mask + drop shadow effect (via composite of border)
  const label = LABEL_SVG(
    `<text class="bigtag" x="60" y="120">Works everywhere</text>
     <text class="sub" x="60" y="170">Desktop, tablet, mobile — same data, same experience.</text>`,
    W, H
  )

  await sharp(bg)
    .composite([
      { input: Buffer.from(label), top: 0, left: 0 },
      { input: desk, top: H - deskMeta.height - 40, left: 90 },
      { input: phone, top: H - phoneMeta.height - 30, left: 920 },
    ])
    .png()
    .toFile(path.join(PHDIR, 'ph-05-mobile-responsive.png'))
  console.log('[OK] ph-05-mobile-responsive.png')
}

async function buildMultiLanguage() {
  const enShot = path.join(HERO, 'hero-dashboard-en-desktop.png')
  const ruShot = path.join(HERO, 'hero-dashboard-ru-desktop.png')

  const bg = Buffer.from(PURPLE_GRADIENT_SVG(W, H))

  const enPanel = await sharp(enShot)
    .resize({ width: 590, withoutEnlargement: false, fit: 'inside' })
    .toBuffer()
  const ruPanel = await sharp(ruShot)
    .resize({ width: 590, withoutEnlargement: false, fit: 'inside' })
    .toBuffer()
  const enMeta = await sharp(enPanel).metadata()
  const ruMeta = await sharp(ruPanel).metadata()

  const label = LABEL_SVG(
    `<text class="bigtag" x="60" y="90">English + Russian</text>
     <text class="sub" x="60" y="130">Full bilingual interface. Switch in one click.</text>
     <text x="270" y="${180 + enMeta.height + 30}" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20" fill="#ffffff" text-anchor="middle">EN</text>
     <text x="960" y="${180 + ruMeta.height + 30}" font-family="-apple-system, system-ui, sans-serif" font-weight="600" font-size="20" fill="#ffffff" text-anchor="middle">RU</text>`,
    W, H
  )

  await sharp(bg)
    .composite([
      { input: Buffer.from(label), top: 0, left: 0 },
      { input: enPanel, top: 180, left: 30 },
      { input: ruPanel, top: 180, left: 650 },
    ])
    .png()
    .toFile(path.join(PHDIR, 'ph-06-multi-language.png'))
  console.log('[OK] ph-06-multi-language.png')
}

;(async () => {
  await buildMobileResponsive()
  await buildMultiLanguage()
})()
