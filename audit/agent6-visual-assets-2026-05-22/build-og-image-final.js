#!/usr/bin/env node
/**
 * Build production Open Graph image (1200×630) for Lancerwise launch.
 *
 * Pattern reuses build-twitter-banner.js (v3):
 *   - Render through headless Chromium (Playwright) so Inter 800 loads from
 *     Google Fonts CDN with a single family / single weight (avoids macOS
 *     librsvg per-glyph fallback observed in v1/v2 banner attempts).
 *   - `await document.fonts.ready` before screenshot so Chromium never paints
 *     a fallback frame.
 *   - Single flexbox column with `align-items:center` → CENTER_X = 600 by
 *     construction. Self-check verifies wordmark + tagline within ±2px of 600.
 *
 * Brand reference (from /Users/myoffice/lancerwise/src/app/globals.css):
 *   linear-gradient(135deg, #483ACC 0%, #935AF0 50%, #F897FE 100%)
 *
 * Layout safety: critical content kept inside a 100px safe-zone from every
 * edge (1000×430 inner box) so Twitter / LinkedIn / Slack chrome overlays
 * never clip the wordmark or tagline.
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('/Users/myoffice/lancerwise/node_modules/playwright')
const sharp = require('/Users/myoffice/lancerwise/node_modules/sharp')

const ROOT = __dirname
const OUT_FINAL = path.join(ROOT, 'og-image-final-1200x630.png')
const OUT_ZOOM = path.join(ROOT, 'og-final-zoom-check.png')
const OUT_REPORT = path.join(ROOT, 'og-final-self-check.json')

const W = 1200
const H = 630
const CENTER_X = W / 2 // 600

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Lancerwise OG 1200x630</title>
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

    /* Dark backdrop + radial halos using brand colors (same as v3 banner) */
    background:
      radial-gradient(ellipse at 18% 30%, rgba(147,90,240,0.55) 0%, rgba(147,90,240,0) 50%),
      radial-gradient(ellipse at 82% 75%, rgba(248,151,254,0.32) 0%, rgba(248,151,254,0) 50%),
      radial-gradient(ellipse at 50% 50%, rgba(72,58,204,0.18) 0%, rgba(72,58,204,0) 65%),
      linear-gradient(135deg, #0f0726 0%, #2d1b4e 40%, #4c1d95 80%, #6d28d9 100%);

    /* Centered column for all content */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 32px;
    position: relative;
  }

  /* ---- Row 1: bolt icon + Lancerwise wordmark ---- */
  .wordmark-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 28px;
  }
  .bolt {
    width: 104px;
    height: 104px;
    border-radius: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #F897FE 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 32px rgba(248, 151, 254, 0.35),
                0 2px 8px rgba(15, 7, 38, 0.4);
  }
  .bolt svg { display: block; }

  .wordmark {
    font-family: 'Inter', sans-serif;
    font-weight: 800;
    font-size: 112px;
    line-height: 1;
    letter-spacing: -0.025em;
    background: linear-gradient(135deg, #ffffff 0%, #F897FE 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
    font-feature-settings: "kern" 1, "liga" 1;
  }

  /* ---- Row 2: tagline ---- */
  .tagline {
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 42px;
    line-height: 1.15;
    letter-spacing: -0.005em;
    color: #e9d5ff;
    max-width: 900px;
  }

  /* ---- bottom-right URL watermark (absolute so it doesn't shift centering) ---- */
  .url {
    position: absolute;
    right: 100px;
    bottom: 60px;
    font-family: 'Inter', sans-serif;
    font-weight: 500;
    font-size: 24px;
    color: #c4b5fd;
    letter-spacing: 0.06em;
  }
</style>
</head>
<body>
  <div class="wordmark-row">
    <div class="bolt">
      <svg width="64" height="64" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <path d="M 26 4 L 12 38 L 28 38 L 20 60 L 48 24 L 32 24 L 40 4 Z" fill="#0f0726"/>
      </svg>
    </div>
    <div class="wordmark">Lancerwise</div>
  </div>

  <div class="tagline">All-in-one CRM for freelancers</div>

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

  await page.evaluate(async () => {
    await document.fonts.ready
    document.body.offsetHeight
  })
  await page.waitForTimeout(300)

  // Initial screenshot (uncompressed PNG from Chromium)
  const rawBuffer = await page.screenshot({ omitBackground: false, type: 'png' })

  // Capture bboxes for self-check + zoom crop
  const grab = sel => page.evaluate(s => {
    const el = document.querySelector(s)
    const r = el.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, sel)
  const wordmarkBox = await grab('.wordmark')
  const wordmarkRowBox = await grab('.wordmark-row')
  const taglineBox = await grab('.tagline')

  await browser.close()

  // Compress through sharp with quantized palette. Brand purple gradient is
  // smooth and tolerates 256-color quantization well; quality:80 typically
  // lands the file under 100 KB while preserving Inter 800 anti-aliasing.
  // Fallback: if quantized file ends up larger than lossless (rare on noisy
  // gradients), we keep whichever is smaller.
  const losslessBuf = await sharp(rawBuffer)
    .png({ compressionLevel: 9, palette: false, adaptiveFiltering: true })
    .toBuffer()
  // Try a few quantization profiles, keep the smallest that still validates.
  const variants = []
  for (const opts of [
    { quality: 85, dither: 1.0 },
    { quality: 80, dither: 0.5 },
    { quality: 75, dither: 0.0 },
  ]) {
    const buf = await sharp(rawBuffer)
      .png({ compressionLevel: 9, palette: true, effort: 10, ...opts })
      .toBuffer()
    variants.push({ opts, size: buf.length, buf })
  }
  variants.sort((a, b) => a.size - b.size)
  const quantBuf = variants[0].buf
  console.log(`[compress.variants] ${variants.map(v => `q${v.opts.quality}/d${v.opts.dither}=${(v.size / 1024).toFixed(1)}KB`).join('  ')}`)
  const chosen = quantBuf.length < losslessBuf.length ? quantBuf : losslessBuf
  fs.writeFileSync(OUT_FINAL, chosen)
  console.log(`[compress] lossless=${(losslessBuf.length / 1024).toFixed(1)}KB  quant=${(quantBuf.length / 1024).toFixed(1)}KB  chosen=${chosen === quantBuf ? 'quant' : 'lossless'}`)

  // Verify exact dimensions
  const meta = await sharp(OUT_FINAL).metadata()
  if (meta.width !== W || meta.height !== H) {
    throw new Error(`Dimension mismatch: got ${meta.width}×${meta.height}, expected ${W}×${H}`)
  }
  const stat = fs.statSync(OUT_FINAL)
  const fileSizeKB = +(stat.size / 1024).toFixed(2)

  // ---- alignment self-check ----
  const check = (box, label) => {
    const center = box.x + box.w / 2
    const delta = Math.abs(center - CENTER_X)
    return { label, center: +center.toFixed(2), delta: +delta.toFixed(2), ok: delta <= 2 }
  }
  // NOTE: we only check the visual row centers, not the .wordmark text alone.
  // "Lancerwise" sits next to the bolt inside .wordmark-row, so its standalone
  // bbox center is intentionally offset to the right by (bolt + gap)/2 — that
  // is the design, not a bug. The unit that must be centered is the row.
  const results = [
    check(wordmarkRowBox, 'wordmark-row (bolt+text)'),
    check(taglineBox, 'tagline'),
  ]
  console.log(`[OK] ${path.basename(OUT_FINAL)} — ${meta.width}×${meta.height} (${fileSizeKB} KB)`)
  console.log(`\nAlignment self-check (CENTER_X=${CENTER_X}, tolerance ±2px):`)
  for (const r of results) {
    console.log(`  ${r.ok ? 'YES' : 'NO '} — ${r.label}: center=${r.center}, delta=${r.delta}px`)
  }
  const allOk = results.every(r => r.ok)
  console.log(`\nOverall: ${allOk ? 'PASS' : 'FAIL'}`)

  // ---- 400% zoom crop on wordmark for typography QA ----
  const padX = 24
  const padY = 16
  const left = Math.max(0, Math.floor(wordmarkBox.x - padX))
  const top = Math.max(0, Math.floor(wordmarkBox.y - padY))
  const width = Math.min(W - left, Math.ceil(wordmarkBox.w + padX * 2))
  const height = Math.min(H - top, Math.ceil(wordmarkBox.h + padY * 2))
  await sharp(OUT_FINAL)
    .extract({ left, top, width, height })
    .resize(width * 4, height * 4, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(OUT_ZOOM)
  console.log(`[OK] ${path.basename(OUT_ZOOM)} — 400% zoom of wordmark (${width}×${height} → ${width * 4}×${height * 4})`)

  // ---- self-check report ----
  const report = {
    file: path.basename(OUT_FINAL),
    dimensions: `${meta.width}×${meta.height}`,
    fileSizeBytes: stat.size,
    fileSizeKB,
    centerX: CENTER_X,
    safeZoneMarginPx: 100,
    typography: {
      family: 'Inter',
      wordmarkWeight: 800,
      wordmarkSizePx: 112,
      taglineWeight: 500,
      taglineSizePx: 42,
      gradientFill: 'linear-gradient(135deg, #ffffff 0%, #F897FE 100%)',
    },
    alignmentChecks: results,
    pass: allOk,
    boxes: {
      wordmarkRow: wordmarkRowBox,
      wordmark: wordmarkBox,
      tagline: taglineBox,
    },
  }
  fs.writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2))
  console.log(`[OK] ${path.basename(OUT_REPORT)}`)

  if (!allOk) process.exit(2)
}

build().catch(e => { console.error(e); process.exit(1) })
