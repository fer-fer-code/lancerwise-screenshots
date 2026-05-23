#!/usr/bin/env node
/**
 * Build Twitter / X profile header v3 (1500×500) — typography + alignment fix.
 *
 * v3 fixes over v2:
 *   1. ISSUE 1 (mixed font weights): v2 used SVG <text> rendered by librsvg via
 *      `font: 800 96px -apple-system, system-ui, ...`. librsvg routed per-glyph
 *      through macOS font fallback, so some letters resolved to a bold variant
 *      and others to regular → broken wordmark. Fix: render through headless
 *      Chromium (Playwright), load Inter from Google Fonts CDN, wait for
 *      `document.fonts.ready` before screenshot. Single family, single weight.
 *
 *   2. ISSUE 2 (three different horizontal axes): v2 placed wordmark via SVG
 *      `<text x="668">` (left-edge anchor), tagline via `text-anchor="middle"
 *      x="750"`, pills via translate offset → three different centers. Fix:
 *      single flexbox column with `align-items:center; text-align:center` for
 *      every row. CENTER_X = 750 by construction.
 *
 * Brand reference (from /Users/myoffice/lancerwise/src/app/globals.css):
 *   --background-image-gradient-primary:
 *     linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%)
 *
 * Layout safety: Twitter's mobile crop shows ~middle 60% of the banner. All
 * critical content is centered. Avatar overlap zone bottom-left (~140px) is
 * left intentionally empty.
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('/Users/myoffice/lancerwise/node_modules/playwright')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const OUT_BANNER = path.join(ROOT, 'twitter-banner-final-1500x500-v3.png')
const OUT_DEBUG = path.join(ROOT, 'center-line-debug.png')
const OUT_ZOOM = path.join(ROOT, 'zoom-wordmark-check.png')

const W = 1500
const H = 500
const CENTER_X = W / 2 // 750

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Lancerwise Twitter Banner v3</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;

    /* Dark-mode backdrop — matches OG image dark→violet ramp */
    background:
      radial-gradient(ellipse at 18% 40%, rgba(147,90,240,0.55) 0%, rgba(147,90,240,0) 50%),
      radial-gradient(ellipse at 82% 65%, rgba(248,151,254,0.32) 0%, rgba(248,151,254,0) 50%),
      radial-gradient(ellipse at 50% 50%, rgba(72,58,204,0.18) 0%, rgba(72,58,204,0) 65%),
      linear-gradient(135deg, #0f0726 0%, #2d1b4e 40%, #4c1d95 80%, #6d28d9 100%);

    /* The whole banner is one centered column */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 22px;
  }

  /* ---- Row 1: logo bolt + wordmark, centered as a unit ---- */
  .wordmark-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }
  .bolt {
    width: 88px;
    height: 88px;
    border-radius: 20px;
    background: linear-gradient(135deg, #ffffff 0%, #F897FE 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .bolt svg { display: block; }

  .wordmark {
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 96px;
    line-height: 1;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #ffffff 0%, #F897FE 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    /* feature-settings off for stable glyph metrics */
    font-feature-settings: "kern" 1, "liga" 1;
  }

  /* ---- Row 2: tagline, centered ---- */
  .tagline {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 38px;
    line-height: 1.1;
    letter-spacing: -0.005em;
    color: #e9d5ff;
  }

  /* ---- Row 3: pills row, centered as a flex group ---- */
  .pills {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .pill {
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 18px;
    line-height: 1;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.10);
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 21px;
    padding: 12px 22px;
    white-space: nowrap;
  }

  /* ---- bottom-right URL watermark (absolute, doesn't affect centering) ---- */
  .url {
    position: absolute;
    right: 60px;
    bottom: 40px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 22px;
    color: #c4b5fd;
    letter-spacing: 0.06em;
  }
</style>
</head>
<body>
  <div class="wordmark-row">
    <div class="bolt">
      <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M 26 4 L 12 38 L 28 38 L 20 60 L 48 24 L 32 24 L 40 4 Z" fill="#0f0726"/>
      </svg>
    </div>
    <div class="wordmark">Lancerwise</div>
  </div>

  <div class="tagline">All-in-one CRM for freelancers</div>

  <div class="pills">
    <div class="pill">AI-powered</div>
    <div class="pill">Free to start</div>
    <div class="pill">EN + RU bilingual</div>
    <div class="pill">No CC needed</div>
  </div>

  <div class="url">lancerwise.com</div>
</body>
</html>`

async function build() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()

  await page.setContent(HTML, { waitUntil: 'networkidle' })

  // CRITICAL: wait for Inter to actually load before snapshotting.
  // Without this, Chromium will paint the fallback font for the first frame.
  await page.evaluate(async () => {
    await document.fonts.ready
    // Force re-layout once fonts are guaranteed to be loaded.
    document.body.offsetHeight
  })

  // small safety pause to let any font-swap repaint settle
  await page.waitForTimeout(250)

  await page.screenshot({ path: OUT_BANNER, omitBackground: false, type: 'png' })

  // Capture bbox of wordmark for self-check + zoom crop coords
  const wordmarkBox = await page.evaluate(() => {
    const el = document.querySelector('.wordmark')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  const taglineBox = await page.evaluate(() => {
    const el = document.querySelector('.tagline')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  const pillsBox = await page.evaluate(() => {
    const el = document.querySelector('.pills')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })
  const wordmarkRowBox = await page.evaluate(() => {
    const el = document.querySelector('.wordmark-row')
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  })

  await browser.close()

  // Validate dimensions
  const meta = await sharp(OUT_BANNER).metadata()
  if (meta.width !== W || meta.height !== H) {
    throw new Error(`Dimension mismatch: got ${meta.width}×${meta.height}, expected ${W}×${H}`)
  }

  // ---- self-check: are all 3 rows centered on x=750 within ±2px? ----
  const check = (box, label) => {
    const center = box.x + box.w / 2
    const delta = Math.abs(center - CENTER_X)
    const ok = delta <= 2
    return { label, center: center.toFixed(2), delta: delta.toFixed(2), ok }
  }
  const results = [
    check(wordmarkRowBox, 'wordmark-row (logo+text)'),
    check(taglineBox, 'tagline'),
    check(pillsBox, 'pills'),
  ]
  console.log(`[OK] ${path.basename(OUT_BANNER)} — ${meta.width}×${meta.height}`)
  console.log(`\nAlignment self-check (target CENTER_X=${CENTER_X}, tolerance ±2px):`)
  for (const r of results) {
    console.log(`  ${r.ok ? 'YES' : 'NO '} — ${r.label}: center=${r.center}, delta=${r.delta}px`)
  }
  const allOk = results.every(r => r.ok)
  console.log(`\nOverall: ${allOk ? 'PASS ✓' : 'FAIL ✗'}`)

  // ---- debug overlay: red vertical line at x=750 ----
  const lineSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
       <line x1="${CENTER_X}" y1="0" x2="${CENTER_X}" y2="${H}" stroke="red" stroke-width="2" stroke-dasharray="6,4"/>
       <circle cx="${CENTER_X}" cy="${H / 2}" r="4" fill="red"/>
     </svg>`
  )
  await sharp(OUT_BANNER)
    .composite([{ input: lineSvg, top: 0, left: 0 }])
    .png()
    .toFile(OUT_DEBUG)
  console.log(`[OK] ${path.basename(OUT_DEBUG)}`)

  // ---- zoom crop on wordmark for typography check (400% scale) ----
  const padX = 20
  const padY = 12
  const left = Math.max(0, Math.floor(wordmarkBox.x - padX))
  const top = Math.max(0, Math.floor(wordmarkBox.y - padY))
  const width = Math.min(W - left, Math.ceil(wordmarkBox.w + padX * 2))
  const height = Math.min(H - top, Math.ceil(wordmarkBox.h + padY * 2))
  await sharp(OUT_BANNER)
    .extract({ left, top, width, height })
    .resize(width * 4, height * 4, { kernel: 'lanczos3' })
    .toFile(OUT_ZOOM)
  console.log(`[OK] ${path.basename(OUT_ZOOM)} (zoom 400% of wordmark bbox ${left},${top} ${width}×${height})`)

  // Write self-check report
  const report = {
    file: path.basename(OUT_BANNER),
    dimensions: `${meta.width}×${meta.height}`,
    centerX: CENTER_X,
    alignmentChecks: results,
    pass: allOk,
    boxes: { wordmarkRowBox, wordmark: wordmarkBox, tagline: taglineBox, pills: pillsBox },
  }
  fs.writeFileSync(path.join(ROOT, 'v3-self-check.json'), JSON.stringify(report, null, 2))

  if (!allOk) process.exit(2)
}

build().catch(e => { console.error(e); process.exit(1) })
