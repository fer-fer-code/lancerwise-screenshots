#!/usr/bin/env python3
"""Score each route against palette spec."""
import json
import os
import re
from pathlib import Path

PROBES = Path('/Users/myoffice/lancerwise-screenshots/audit/agent6-palette-sweep-2026-05-23/probes')

SPEC = {
    'canvas': '#0B0B12',       # rgb(11,11,18)
    'surface': '#11111A',      # rgb(17,17,26)
    'card': '#15151F',         # rgb(21,21,31)
    'elevated': '#1B1B26',
    'accent': '#6A5AE0',       # rgb(106,90,224)
    'text_primary': '#F4F4F6', # rgb(244,244,246)
    'text_secondary': '#A0A0AE', # rgb(160,160,174)
    'text_muted': '#6B6B7B',   # rgb(107,107,123)
}

SPEC_RGB = {
    'canvas': (11, 11, 18),
    'surface': (17, 17, 26),
    'card': (21, 21, 31),
    'accent': (106, 90, 224),
    'text_primary': (244, 244, 246),
    'text_muted': (107, 107, 123),
}

# Gradient-allowed routes (slug)
GRADIENT_ALLOWED = {'landing', 'dashboard', 'upgrade'}

def parse_rgb(s):
    if not s: return None
    m = re.match(r'rgba?\((\d+),\s*(\d+),\s*(\d+)', s)
    if m: return (int(m.group(1)), int(m.group(2)), int(m.group(3)))
    return None

def close(a, b, tol=8):
    if not a or not b: return False
    return all(abs(a[i] - b[i]) <= tol for i in range(3))

def hex_of(rgb):
    if not rgb: return '?'
    return '#%02X%02X%02X' % rgb

def analyze(probe):
    slug = probe.get('routeSlug') or probe.get('slug') or 'unknown'
    out = {'slug': slug, 'finalUrl': probe.get('finalUrl'), 'issues': [], 'pass': {}}

    # Check 1 — CSS vars themselves
    vars_ = probe.get('cssVars', {})
    canvas_var = vars_.get('--canvas', '')
    if canvas_var.lower() == '#0b0b12':
        out['pass']['css_var_canvas_defined'] = True
    else:
        out['issues'].append(f"--canvas var = '{canvas_var}' (expected #0B0B12)")

    # Check body background
    body_bg = parse_rgb((probe.get('body') or {}).get('backgroundColor', ''))
    if body_bg:
        # Most pages render `bg-canvas` semantic — body itself may or may not have it
        if close(body_bg, SPEC_RGB['canvas']):
            out['pass']['canvas'] = True
        elif body_bg == (10, 10, 10):
            out['issues'].append(f"body bg = rgb(10,10,10) #0A0A0A — Tailwind default 'bg-neutral-950'? expected canvas #0B0B12")
        else:
            out['issues'].append(f"body bg = rgb{body_bg} {hex_of(body_bg)} — expected canvas #0B0B12")

    # Check sidebar surface
    sb_bg = parse_rgb((probe.get('sidebar') or {}).get('backgroundColor', ''))
    if sb_bg:
        if close(sb_bg, SPEC_RGB['surface']):
            out['pass']['sidebar_surface'] = True
        else:
            out['issues'].append(f"sidebar bg = rgb{sb_bg} {hex_of(sb_bg)} — expected surface #11111A")

    hd_bg = parse_rgb((probe.get('header') or {}).get('backgroundColor', ''))
    if hd_bg:
        if close(hd_bg, SPEC_RGB['surface']):
            out['pass']['header_surface'] = True
        else:
            out['issues'].append(f"header bg = rgb{hd_bg} {hex_of(hd_bg)} — expected surface #11111A")

    # Check cards (sample 5)
    cards = probe.get('cards', [])
    card_hits = 0
    card_misses = []
    for c in cards:
        bg = parse_rgb(c.get('backgroundColor', ''))
        if not bg: continue
        if close(bg, SPEC_RGB['card']):
            card_hits += 1
        else:
            # Allow transparent or radial gradient overlays (greeting hero) only for allowed
            cls = c.get('cls', '')
            bg_img = c.get('backgroundImage', '')
            if 'radial-gradient' in bg_img or 'linear-gradient' in bg_img:
                if slug in GRADIENT_ALLOWED:
                    card_hits += 1  # accepted exception
                else:
                    card_misses.append(f"card '{c.get('text','')[:30]}' gradient on non-allowed route ({bg_img[:80]})")
            elif bg == (0, 0, 0) or bg[0] < 5:
                # transparent — ignore (chip/inline)
                pass
            elif 'bg-slate' in cls or 'bg-violet' in cls or 'bg-purple' in cls:
                card_misses.append(f"card cls '{cls[:80]}' bg={hex_of(bg)}")
            else:
                # alt surface like elevated
                if not close(bg, (27, 27, 38), tol=6):  # elevated
                    card_misses.append(f"card bg={hex_of(bg)} expected #15151F or #1B1B26")

    if card_hits > 0 and not card_misses:
        out['pass']['cards'] = True
    elif card_misses:
        out['issues'].extend([f"CARD: {m}" for m in card_misses[:5]])

    # Check 2 — Accent / gradient buttons
    grad_btns = probe.get('gradientButtons', [])
    if grad_btns and slug not in GRADIENT_ALLOWED:
        out['issues'].append(f"GRADIENT BTN: {len(grad_btns)} gradient buttons on non-exception route")
        for gb in grad_btns[:3]:
            out['issues'].append(f"  - '{gb.get('text','')[:30]}' cls={gb.get('cls','')[:80]}")
    elif grad_btns:
        out['pass']['gradient_btns_allowed'] = f"{len(grad_btns)} (allowed)"

    primary_btns = probe.get('primaryButtons', [])
    accent_hits = 0
    accent_misses = []
    for b in primary_btns:
        bg = parse_rgb(b.get('backgroundColor', ''))
        bg_img = b.get('backgroundImage', '')
        if bg_img and 'gradient' in bg_img and slug not in GRADIENT_ALLOWED:
            accent_misses.append(f"'{b.get('text','')[:40]}' has gradient on non-exception route")
        elif bg and close(bg, SPEC_RGB['accent']):
            accent_hits += 1
        elif bg and bg != (0,0,0):
            # ignore secondary buttons that are intentionally surface
            pass

    if accent_misses:
        out['issues'].extend([f"PRIMARY BTN: {m}" for m in accent_misses[:3]])

    # Check 3 — Hardcoded class counts
    hc = probe.get('hardcodedClassCounts', {})
    hc_total = 0
    hc_breakdown = []
    for key, n in hc.items():
        if n > 0:
            hc_total += n
            hc_breakdown.append(f"{key.replace('[class*=\"','').replace('\"]','')}={n}")
    if hc_total > 0:
        # not a hard fail — but list it
        out['hardcoded_total'] = hc_total
        out['hardcoded_breakdown'] = hc_breakdown

    # Check 4 — Text colors on headings
    headings = probe.get('headings', [])
    text_drift = []
    for h in headings:
        col = parse_rgb(h.get('color', ''))
        if not col: continue
        # Allow text-primary white (244) or pure white (255) — pure white is acceptable on hero/cards
        if close(col, SPEC_RGB['text_primary']) or col == (255, 255, 255):
            pass
        elif col[0] > 200 and col[1] > 200 and col[2] > 200:
            pass  # near-white
        else:
            text_drift.append(f"heading '{h.get('text','')[:30]}' color={hex_of(col)} (cls={h.get('cls','')[:60]})")
    if text_drift:
        out['issues'].extend([f"TEXT: {t}" for t in text_drift[:3]])

    return out

def main():
    results = []
    for probe_file in sorted(PROBES.glob('*.json')):
        with open(probe_file) as f:
            probe = json.load(f)
        results.append(analyze(probe))

    # Summary
    print('='*100)
    print('PALETTE SWEEP — Per-route results')
    print('='*100)
    for r in results:
        n_issues = len(r['issues'])
        n_pass = len(r['pass'])
        status = 'PASS' if n_issues == 0 else ('NOTES' if n_issues <= 3 else 'DRIFT')
        print(f"\n[{status}] {r['slug']:<25} final={r['finalUrl']}")
        print(f"  passes: {list(r['pass'].keys())}")
        if 'hardcoded_total' in r:
            print(f"  hardcoded utility hits: {r['hardcoded_total']} ({', '.join(r['hardcoded_breakdown'])})")
        for issue in r['issues']:
            print(f"  • {issue}")

    # Write JSON summary
    out_path = '/Users/myoffice/lancerwise-screenshots/audit/agent6-palette-sweep-2026-05-23/analysis.json'
    with open(out_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\n→ analysis.json written: {out_path}")

if __name__ == '__main__':
    main()
