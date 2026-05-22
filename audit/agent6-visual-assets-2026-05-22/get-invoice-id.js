const fs = require('fs')
const { chromium } = require('/Users/myoffice/lancerwise/node_modules/playwright')
const COOKIE_VALUE = fs.readFileSync('/tmp/qa_comprehensive_cookie.txt', 'utf8').trim()

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  })
  await ctx.addCookies([{
    name: 'sb-skfgwyzarrhhkzvltbgm-auth-token',
    value: COOKIE_VALUE,
    domain: '.lancerwise.com',
    path: '/',
    secure: true,
    sameSite: 'Lax',
  }])
  const page = await ctx.newPage()
  await page.goto('https://www.lancerwise.com/invoices', { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForTimeout(2000)
  // Find first invoice link
  const ids = await page.$$eval('a[href*="/invoices/"]', as =>
    as.map(a => a.getAttribute('href')).filter(h => h && /\/invoices\/[0-9a-f-]{20,}/.test(h)).slice(0, 5)
  )
  console.log('invoice URLs:', ids)
  await browser.close()
})()
