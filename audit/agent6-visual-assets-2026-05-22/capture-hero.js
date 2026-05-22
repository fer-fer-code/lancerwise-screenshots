#!/usr/bin/env node
/**
 * Hero screenshots capture for launch day visual assets
 * Captures 1440x900 desktop + 393x852 mobile across routes, RU + EN locales
 * Dismisses welcome tour + cookie banner + sets dark theme
 *
 * Usage:
 *   node capture-hero.js
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('/Users/myoffice/lancerwise/node_modules/playwright')

const COOKIE_VALUE = fs.readFileSync('/tmp/qa_comprehensive_cookie.txt', 'utf8').trim()
const COOKIE_NAME = 'sb-skfgwyzarrhhkzvltbgm-auth-token'
const BASE = 'https://www.lancerwise.com'

const SAMPLE_INVOICE_ID = '40cef5fd-0012-4fda-8b13-aaf236971ef5'

const ROUTES = [
  { name: 'dashboard',          url: '/dashboard' },
  { name: 'clients',            url: '/clients' },
  { name: 'clients-pipeline',   url: '/clients/pipeline' },
  { name: 'invoices',           url: '/invoices' },
  { name: 'invoice-detail',     url: `/invoices/${SAMPLE_INVOICE_ID}` },
  { name: 'work-time',          url: '/work/time' },
  { name: 'proposals',          url: '/proposals' },
  { name: 'contracts',          url: '/contracts' },
  { name: 'settings',           url: '/settings' },
]

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile',  width: 393,  height: 852 },
]

const LOCALES = ['en', 'ru']

const OUT_DIR = path.join(__dirname, 'hero-screenshots')
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

async function dismissOverlays(page) {
  // Dismiss cookie consent — click "Reject" or set localStorage flag
  try {
    await page.evaluate(() => {
      try {
        localStorage.setItem('cookie-consent-v1', JSON.stringify({
          status: 'accepted',
          essential: true,
          analytics: false,
          marketing: false,
          ts: Date.now(),
        }))
        // Common keys used in repo
        localStorage.setItem('cookieConsent', 'accepted')
        localStorage.setItem('lw-cookie-consent', 'accepted')
      } catch {}
    })
  } catch {}

  // Dismiss welcome tour by setting completed flag in localStorage
  try {
    await page.evaluate(() => {
      try {
        localStorage.setItem('welcome-tour-completed', 'true')
        localStorage.setItem('lw-welcome-tour-completed', 'true')
        localStorage.setItem('lw-welcome-tour-dismissed', 'true')
        localStorage.setItem('welcome_tour_completed_at', new Date().toISOString())
      } catch {}
    })
  } catch {}

  // Try clicking close buttons on any visible modals
  try {
    const closeButtons = await page.$$('button[aria-label*="close" i], button[aria-label*="Close" i]')
    for (const btn of closeButtons) {
      try {
        await btn.click({ timeout: 500 })
      } catch {}
    }
  } catch {}

  // Press Escape to close any modal
  try {
    await page.keyboard.press('Escape')
  } catch {}
}

async function captureOne(browser, route, viewport, locale) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.name === 'mobile' ? 3 : 1,
    isMobile: viewport.name === 'mobile',
    hasTouch: viewport.name === 'mobile',
    userAgent: viewport.name === 'mobile'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      : undefined,
    locale: locale === 'ru' ? 'ru-RU' : 'en-US',
    extraHTTPHeaders: {
      'Accept-Language': locale === 'ru' ? 'ru-RU,ru;q=0.9' : 'en-US,en;q=0.9',
    },
  })

  await ctx.addCookies([
    { name: COOKIE_NAME, value: COOKIE_VALUE, domain: '.lancerwise.com', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'NEXT_LOCALE', value: locale, domain: '.lancerwise.com', path: '/', secure: true, sameSite: 'Lax' },
    // Cookie-consent cookies
    { name: 'cookie-consent-v1', value: 'accepted', domain: '.lancerwise.com', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'cookieConsent', value: 'accepted', domain: '.lancerwise.com', path: '/', secure: true, sameSite: 'Lax' },
    { name: 'lw-cookie-consent', value: 'accepted', domain: '.lancerwise.com', path: '/', secure: true, sameSite: 'Lax' },
  ])

  const page = await ctx.newPage()

  // Set localStorage BEFORE navigating to suppress welcome tour
  // We'll do this via addInitScript so it runs on every page load
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem('welcome-tour-completed', 'true')
      localStorage.setItem('lw-welcome-tour-completed', 'true')
      localStorage.setItem('lw-welcome-tour-dismissed', 'true')
      localStorage.setItem('welcome_tour_completed_at', new Date().toISOString())
      localStorage.setItem('cookie-consent-v1', JSON.stringify({
        status: 'accepted', essential: true, analytics: false, marketing: false, ts: Date.now(),
      }))
      localStorage.setItem('cookieConsent', 'accepted')
      localStorage.setItem('lw-cookie-consent', 'accepted')
    } catch {}
  })

  const fname = `hero-${route.name}-${locale}-${viewport.name}.png`
  const fpath = path.join(OUT_DIR, fname)

  try {
    await page.goto(BASE + route.url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})
    await page.waitForTimeout(1500)

    // Second pass of dismissals (in case modal hydrated late)
    await dismissOverlays(page)
    await page.waitForTimeout(700)

    // Hide any remaining overlays (welcome tour, cookie banner, dev widgets, etc.)
    await page.addStyleTag({
      content: `
        /* hide cookie banner */
        [class*="cookie-banner" i], [class*="CookieBanner" i],
        [data-testid*="cookie" i],
        [role="dialog"][aria-label*="cookie" i],
        [role="region"][aria-label*="cookie" i] { display: none !important; }
        /* hide welcome tour */
        [class*="welcome-tour" i], [class*="WelcomeTour" i],
        [data-testid*="welcome-tour" i],
        [role="dialog"][aria-label*="welcome" i],
        [role="dialog"][aria-label*="tour" i] { display: none !important; }
        /* hide intercom/help bubbles */
        [class*="intercom" i], [id*="intercom" i] { display: none !important; }
        /* hide notification setup badge bottom-left "4/7 setup" pill if it's just an overlay */
      `,
    }).catch(() => {})

    await page.waitForTimeout(300)
    await page.screenshot({ path: fpath, fullPage: false })
    console.log(`[OK]   ${fname}`)
  } catch (e) {
    console.log(`[FAIL] ${fname} → ${e.message.split('\n')[0]}`)
  } finally {
    await ctx.close()
  }
}

;(async () => {
  console.log(`Capturing ${ROUTES.length} routes × ${VIEWPORTS.length} viewports × ${LOCALES.length} locales = ${ROUTES.length * VIEWPORTS.length * LOCALES.length} screenshots`)
  const browser = await chromium.launch({ headless: true })
  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      for (const locale of LOCALES) {
        await captureOne(browser, route, viewport, locale)
      }
    }
  }
  await browser.close()
  console.log('done.')
})()
