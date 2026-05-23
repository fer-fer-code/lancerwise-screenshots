#!/usr/bin/env node
// Palette consistency sweep via raw CDP against existing Chrome session.
// Reuses authenticated lancerwise tab — no re-login required.

import WebSocket from '/Users/myoffice/lancerwise-agent6/node_modules/ws/wrapper.mjs';
import fs from 'fs';
import path from 'path';
import http from 'http';

const CDP_HOST = 'localhost';
const CDP_PORT = 59736;
const OUT_DIR = '/Users/myoffice/lancerwise-screenshots/audit/agent6-palette-sweep-2026-05-23';
const PROBES_DIR = path.join(OUT_DIR, 'probes');
const BASE = 'https://www.lancerwise.com';

const ROUTES = [
  { slug: 'landing', url: BASE + '/' },
  { slug: 'pricing', url: BASE + '/pricing' },
  { slug: 'login', url: BASE + '/login' },
  { slug: 'dashboard', url: BASE + '/dashboard' },
  { slug: 'clients', url: BASE + '/clients' },
  { slug: 'projects', url: BASE + '/projects' },
  { slug: 'invoices', url: BASE + '/invoices' },
  { slug: 'work-time', url: BASE + '/work/time' },
  { slug: 'tasks', url: BASE + '/tasks' },
  { slug: 'analytics-forecast', url: BASE + '/analytics/forecast' },
  { slug: 'settings', url: BASE + '/settings' },
  { slug: 'upgrade', url: BASE + '/upgrade' },
];

function httpGet(p) {
  return new Promise((resolve, reject) => {
    http.get({ host: CDP_HOST, port: CDP_PORT, path: p }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    this.ws.on('message', raw => {
      const m = JSON.parse(raw.toString());
      if (m.id && this.pending.has(m.id)) {
        const { resolve, reject } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) reject(new Error(JSON.stringify(m.error)));
        else resolve(m.result);
      } else if (m.method) {
        const hs = this.events.get(m.method) || [];
        hs.forEach(h => h(m.params));
      }
    });
  }
  async ready() {
    if (this.ws.readyState === 1) return;
    return new Promise((res, rej) => {
      this.ws.once('open', res);
      this.ws.once('error', rej);
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  on(ev, h) {
    if (!this.events.has(ev)) this.events.set(ev, []);
    this.events.get(ev).push(h);
  }
  close() { try { this.ws.close(); } catch (e) {} }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function rgbToHex(rgb) {
  if (!rgb) return null;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m) return rgb;
  const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
  const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
  if (a < 1) return `rgba(${r}, ${g}, ${b}, ${a})`;
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('').toUpperCase();
}

// Probe script — sample palette tokens + flag drift.
const PROBE_JS = `(() => {
  function getBg(sel) {
    const el = document.querySelector(sel);
    if (!el) return { selector: sel, found: false };
    const cs = getComputedStyle(el);
    return {
      selector: sel,
      found: true,
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage,
      color: cs.color,
      borderColor: cs.borderColor,
    };
  }
  function sampleAll(sel, max = 10) {
    const els = Array.from(document.querySelectorAll(sel)).slice(0, max);
    return els.map(el => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 200),
        text: (el.textContent || '').trim().slice(0, 60),
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        color: cs.color,
        borderColor: cs.borderColor,
        borderTopColor: cs.borderTopColor,
      };
    });
  }
  function findGradientButtons() {
    const els = Array.from(document.querySelectorAll('button, a[role="button"], a.btn, a[class*="bg-gradient"], button[class*="bg-gradient"]'));
    const out = [];
    for (const el of els) {
      const cs = getComputedStyle(el);
      const bgImg = cs.backgroundImage;
      if (bgImg && bgImg.includes('gradient')) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.className || '').toString().slice(0, 200),
          text: (el.textContent || '').trim().slice(0, 60),
          backgroundImage: bgImg.slice(0, 200),
          backgroundColor: cs.backgroundColor,
          color: cs.color,
        });
      }
    }
    return out.slice(0, 30);
  }
  function findHardcodedClasses() {
    // Look for hardcoded palette utility classes that should have migrated
    const hardcodedSelectors = [
      '[class*="bg-slate-"]',
      '[class*="border-slate-"]',
      '[class*="text-slate-"]',
      '[class*="bg-violet-"]',
      '[class*="border-violet-"]',
      '[class*="text-white"]',
      '[class*="bg-gray-"]',
      '[class*="border-gray-"]',
      '[class*="from-violet"]',
      '[class*="via-purple"]',
      '[class*="to-pink"]',
      '[class*="from-purple"]',
      '[class*="bg-purple-"]',
    ];
    const counts = {};
    for (const sel of hardcodedSelectors) {
      counts[sel] = document.querySelectorAll(sel).length;
    }
    return counts;
  }
  function findPrimaryButtons() {
    // Primary CTAs heuristic
    const candidates = Array.from(document.querySelectorAll('button[type="submit"], a[role="button"], button.btn-primary, .btn-primary, a.btn-primary'));
    return candidates.slice(0, 15).map(el => {
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        cls: (el.className || '').toString().slice(0, 200),
        text: (el.textContent || '').trim().slice(0, 60),
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
      };
    });
  }
  function cssVars() {
    const cs = getComputedStyle(document.documentElement);
    const vars = ['--canvas','--surface','--card','--elevated','--accent-primary','--text-primary','--text-secondary','--text-muted','--border-subtle','--border','--border-strong'];
    const out = {};
    for (const v of vars) {
      out[v] = cs.getPropertyValue(v).trim() || null;
    }
    return out;
  }
  return {
    url: location.href,
    timestamp: new Date().toISOString(),
    title: document.title,
    cssVars: cssVars(),
    body: getBg('body'),
    html: getBg('html'),
    main: getBg('main'),
    sidebar: getBg('[data-sidebar], aside, nav[class*="sidebar"]'),
    header: getBg('header'),
    cards: sampleAll('.bg-card, [class*="bg-card"], .card, [class*="rounded-"][class*="border"]', 8),
    headings: sampleAll('h1, h2, h3', 6),
    paragraphs: sampleAll('p', 6),
    captions: sampleAll('.text-muted, .text-secondary, small, [class*="text-xs"]', 6),
    primaryButtons: findPrimaryButtons(),
    gradientButtons: findGradientButtons(),
    hardcodedClassCounts: findHardcodedClasses(),
    bodyClass: document.body.className.slice(0, 300),
    htmlClass: document.documentElement.className.slice(0, 300),
  };
})()`;

async function audit() {
  fs.mkdirSync(PROBES_DIR, { recursive: true });
  // Find or create a tab to work with — reuse first lancerwise tab if available.
  const tabsRaw = await httpGet('/json');
  const tabs = JSON.parse(tabsRaw).filter(t => t.type === 'page');
  let tab = tabs.find(t => t.url.startsWith('https://www.lancerwise.com'));
  if (!tab) {
    console.log('[!] No lancerwise tab found, using first available tab');
    tab = tabs[0];
  }
  console.log('[+] Using tab:', tab.url);
  const wsUrl = tab.webSocketDebuggerUrl;

  const cdp = new CDP(wsUrl);
  await cdp.ready();
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  // Set viewport
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440, height: 900, deviceScaleFactor: 1, mobile: false,
  });

  const summary = [];

  for (const route of ROUTES) {
    console.log(`\n[*] Auditing ${route.slug} → ${route.url}`);
    try {
      // Wait for load event
      let loadResolve;
      const loadPromise = new Promise(r => { loadResolve = r; });
      const handler = () => { loadResolve(); };
      cdp.on('Page.loadEventFired', handler);
      await cdp.send('Page.navigate', { url: route.url });
      await Promise.race([loadPromise, sleep(20000)]);
      await sleep(2500); // let client render
      // Scroll to bottom progressively to trigger lazy images then back to top
      await cdp.send('Runtime.evaluate', {
        expression: `(async () => { window.scrollTo(0, 0); await new Promise(r=>setTimeout(r,300)); const h=document.documentElement.scrollHeight; for(let y=0;y<h;y+=400){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,80));} window.scrollTo(0,0); })()`,
        awaitPromise: true,
      });
      await sleep(800);

      // Get final URL (catch redirects to /login)
      const urlR = await cdp.send('Runtime.evaluate', { expression: 'location.href' });
      const finalUrl = urlR.result.value;
      console.log(`    final URL: ${finalUrl}`);

      // Run probe
      const probeR = await cdp.send('Runtime.evaluate', {
        expression: PROBE_JS,
        returnByValue: true,
      });
      if (probeR.exceptionDetails) {
        console.log('    probe error:', probeR.exceptionDetails.text || JSON.stringify(probeR.exceptionDetails).slice(0,200));
      }
      const probe = probeR.result.value || { error: 'no value', exception: probeR.exceptionDetails };
      probe.routeSlug = route.slug;
      probe.routeUrl = route.url;
      probe.finalUrl = finalUrl;
      probe.redirected = !finalUrl.includes(new URL(route.url).pathname) && finalUrl !== route.url + '/' && route.url !== finalUrl;

      fs.writeFileSync(path.join(PROBES_DIR, `${route.slug}.json`), JSON.stringify(probe, null, 2));

      // Full-page screenshot
      const layout = await cdp.send('Page.getLayoutMetrics');
      const cssH = Math.ceil(layout.cssContentSize?.height || layout.contentSize?.height || 900);
      const cssW = Math.ceil(layout.cssContentSize?.width || layout.contentSize?.width || 1440);
      const clipH = Math.min(cssH, 8000); // cap at 8000 to avoid OOM
      const shot = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: Math.min(cssW, 1440), height: clipH, scale: 1 },
      });
      fs.writeFileSync(path.join(OUT_DIR, `${route.slug}.png`), Buffer.from(shot.data, 'base64'));
      console.log(`    saved screenshot (${clipH}px) + probe`);

      summary.push({ slug: route.slug, finalUrl, ok: true, probe });
    } catch (e) {
      console.log(`    ERROR: ${e.message}`);
      summary.push({ slug: route.slug, error: e.message });
    }
  }

  fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary.map(s => ({slug: s.slug, finalUrl: s.finalUrl, error: s.error})), null, 2));
  cdp.close();
  console.log('\n[+] Sweep complete');
}

audit().catch(e => { console.error(e); process.exit(1); });
