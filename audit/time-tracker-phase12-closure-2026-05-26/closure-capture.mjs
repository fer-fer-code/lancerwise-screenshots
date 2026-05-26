// Phase 1+2 closure verification capture — production /work/time
// Uses persistent profile from prior sessions to skip login

import { chromium } from '/Users/myoffice/lancerwise-agent6/node_modules/playwright/index.mjs';

const PROFILE = '/tmp/agent6-tier4-profile';
const BASE = 'https://www.lancerwise.com';
const LOG = (...a) => console.log(new Date().toISOString().slice(11,19), '|', ...a);

(async () => {
  LOG('launching persistent context', PROFILE);
  const ctx = await chromium.launchPersistentContext(PROFILE, {
    headless: true,
    viewport: { width: 1280, height: 1024 },
    deviceScaleFactor: 2,
    locale: 'ru-RU',
    args: ['--no-default-browser-check', '--no-first-run'],
  });
  const page = ctx.pages()[0] || await ctx.newPage();

  LOG('navigating to /work/time');
  await page.goto(BASE + '/work/time', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const url = page.url();
  LOG('final URL:', url);

  if (url.includes('/login')) {
    LOG('AUTH LOST — capturing login page as evidence of limitation');
    await page.screenshot({ path: '/tmp/closure-auth-lost.png', fullPage: true });
    LOG('auth-lost screenshot written');
    await ctx.close();
    process.exit(0);
  }

  // Authed — full page + targeted captures
  await page.waitForTimeout(2000);

  // Full page
  await page.screenshot({ path: '/tmp/closure-fullpage.png', fullPage: true });
  LOG('fullpage written');

  // Viewport top
  await page.screenshot({ path: '/tmp/closure-viewport.png', fullPage: false });
  LOG('viewport written');

  // Try to find live earnings or related zone (search for billable chip / running timer area)
  try {
    const liveEl = await page.locator('text=/Заработано|earned|\\$.*\\/hr|\\$.*\\/час/i').first();
    if (await liveEl.count() > 0) {
      const box = await liveEl.boundingBox();
      if (box) {
        await page.screenshot({
          path: '/tmp/closure-live-earnings.png',
          clip: { x: Math.max(0, box.x - 40), y: Math.max(0, box.y - 60), width: 600, height: 200 },
        });
        LOG('live-earnings targeted shot');
      }
    } else {
      LOG('liveEarnings widget not visible (timer not running) — fullpage suffices');
    }
  } catch (e) {
    LOG('targeted capture skip:', e.message.slice(0, 80));
  }

  await ctx.close();
  LOG('done');
})().catch(e => { console.error('FATAL', e); process.exit(1); });
