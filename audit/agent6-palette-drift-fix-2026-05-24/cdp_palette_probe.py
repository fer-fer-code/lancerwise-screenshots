#!/usr/bin/env python3
"""Raw CDP — navigate + probe + screenshot к 14 routes. Reuses existing tab."""
import json, base64, time, sys, os, urllib.request
from websocket import create_connection

CDP_PORT = 50565
OUT = "/Users/myoffice/lancerwise-screenshots/audit/agent6-palette-drift-fix-2026-05-24/baseline"
os.makedirs(OUT, exist_ok=True)

# Get tab
tabs = json.loads(urllib.request.urlopen(f"http://localhost:{CDP_PORT}/json/list").read())
page = next(t for t in tabs if t["type"] == "page")
ws_url = page["webSocketDebuggerUrl"]
print(f"Using tab {page['id'][:12]} | {page['url'][:80]}", flush=True)

ws = create_connection(ws_url, timeout=60, header=["Host: localhost"], origin="")
msg_id = 0

def cdp(method, params=None):
    global msg_id
    msg_id += 1
    ws.send(json.dumps({"id": msg_id, "method": method, "params": params or {}}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == msg_id:
            return r

# Enable Page + Runtime
cdp("Page.enable")
cdp("Runtime.enable")
cdp("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})

PROBE_JS = """
(() => {
  const cs = (el) => el ? getComputedStyle(el) : null;
  const body = document.body;
  const html = document.documentElement;
  const main = document.querySelector('main') || document.querySelector('[role=main]');
  const header = document.querySelector('header');
  const sidebar = document.querySelector('aside') || document.querySelector('nav[class*=sidebar]') || document.querySelector('[class*=Sidebar]');
  const cards = Array.from(document.querySelectorAll('.bg-card, [class*=bg-slate-9], [class*=bg-neutral-9]')).slice(0, 3);
  const btn = document.querySelector('button[class*=violet], button[class*=accent], a[class*=violet]');

  const probe = (el, name) => el ? ({
    el: name,
    bg: cs(el).backgroundColor,
    color: cs(el).color,
    classes: (el.className || '').toString().slice(0, 140)
  }) : { el: name, bg: null };

  const dark = html.classList.contains('dark');
  const canvasVar = getComputedStyle(html).getPropertyValue('--canvas').trim();
  const bgVar = getComputedStyle(html).getPropertyValue('--background').trim();

  return {
    url: location.pathname,
    darkClass: dark,
    canvasVar, bgVar,
    body: probe(body, 'body'),
    html: probe(html, 'html'),
    main: probe(main, 'main'),
    header: probe(header, 'header'),
    sidebar: probe(sidebar, 'sidebar'),
    cards: cards.map((c, i) => probe(c, `card${i}`)),
    btn: probe(btn, 'btn'),
    scrollH: document.documentElement.scrollHeight
  };
})()
"""

def slug(path):
    if path == "/": return "home"
    return path.strip("/").replace("/", "-")[:60]

def navigate_and_wait(url):
    cdp("Page.navigate", {"url": url})
    deadline = time.time() + 12
    # wait load
    while time.time() < deadline:
        try:
            r = json.loads(ws.recv())
            if r.get("method") == "Page.loadEventFired":
                break
        except Exception:
            break
    time.sleep(2.2)  # let widgets settle

def probe():
    r = cdp("Runtime.evaluate", {"expression": PROBE_JS, "returnByValue": True, "awaitPromise": False})
    return r.get("result", {}).get("result", {}).get("value")

def shot(name, full_height=None):
    if full_height:
        # resize for full-page
        h = min(full_height, 12000)
        cdp("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": h, "deviceScaleFactor": 1, "mobile": False})
        time.sleep(0.4)
    r = cdp("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True, "clip": {"x":0,"y":0,"width":1440,"height": full_height or 900, "scale":1}} if full_height else {"format":"png"})
    data = r.get("result", {}).get("data")
    if data:
        with open(f"{OUT}/{name}.png", "wb") as f:
            f.write(base64.b64decode(data))
    # restore
    if full_height:
        cdp("Emulation.setDeviceMetricsOverride", {"width": 1440, "height": 900, "deviceScaleFactor": 1, "mobile": False})

# Resolve dynamic IDs via API call from page (after navigating /clients etc)
def resolve_first_id(path_endpoint, key="id"):
    # use fetch from current page
    js = f"""(async () => {{
      try {{
        const r = await fetch('{path_endpoint}', {{ credentials: 'include' }});
        const j = await r.json();
        const arr = Array.isArray(j) ? j : (j.data || j.items || j.results || j.rows || []);
        return arr && arr[0] ? (arr[0].{key} || arr[0].uuid || null) : null;
      }} catch(e) {{ return 'ERR:'+e.message; }}
    }})()"""
    r = cdp("Runtime.evaluate", {"expression": js, "returnByValue": True, "awaitPromise": True})
    return r.get("result", {}).get("result", {}).get("value")

# Step 1: navigate /clients first to get an ID
all_probes = {}
results = []

# Static routes first
routes = [
    "https://www.lancerwise.com/",
    "https://www.lancerwise.com/pricing",
    "https://www.lancerwise.com/login",
    "https://www.lancerwise.com/dashboard",
    "https://www.lancerwise.com/clients",
    "https://www.lancerwise.com/projects",
    "https://www.lancerwise.com/invoices",
    "https://www.lancerwise.com/work/time",
    "https://www.lancerwise.com/tasks",
    "https://www.lancerwise.com/settings",
    "https://www.lancerwise.com/upgrade",
]

for url in routes:
    print(f"→ {url}", flush=True)
    try:
        navigate_and_wait(url)
        p = probe()
        if p:
            all_probes[url] = p
        path = url.replace("https://www.lancerwise.com", "") or "/"
        shot(slug(path))
    except Exception as e:
        print(f"  ERR: {e}", flush=True)

# Dynamic — try to resolve IDs from current page state
# After /clients was loaded, get IDs from list DOM
def resolve_id_from_list(selector_pat):
    js = f"""(() => {{
      const links = Array.from(document.querySelectorAll('a[href*="{selector_pat}/"]'));
      if (!links.length) return null;
      const m = links[0].getAttribute('href').match(/{selector_pat}\\/([^/?#]+)/);
      return m ? m[1] : null;
    }})()"""
    r = cdp("Runtime.evaluate", {"expression": js, "returnByValue": True})
    return r.get("result", {}).get("result", {}).get("value")

for list_url, child in [
    ("https://www.lancerwise.com/clients", "clients"),
    ("https://www.lancerwise.com/projects", "projects"),
    ("https://www.lancerwise.com/invoices", "invoices"),
]:
    print(f"→ resolve {child} ID", flush=True)
    navigate_and_wait(list_url)
    cid = resolve_id_from_list(child)
    if cid:
        detail_url = f"https://www.lancerwise.com/{child}/{cid}"
        print(f"  → {detail_url}", flush=True)
        navigate_and_wait(detail_url)
        p = probe()
        if p:
            all_probes[detail_url] = p
        shot(f"{child}-detail")
    else:
        print(f"  no {child} ID found", flush=True)

with open(f"{OUT}/../probes.json", "w") as f:
    json.dump(all_probes, f, indent=2)
print(f"\nDone. {len(all_probes)} probes captured.", flush=True)
ws.close()
