# Dashboard ↔ Landing harmonization — banner + sidebar active + RU date

**Date:** 2026-05-26
**Agent:** Agent 5
**Source commit:** `c83698c1` — `feat(dashboard): banner matches landing hero + sidebar feature-card active (both variants) + RU date`
**Production deploy:** `22301d3d` Vercel READY (Vercel cancelled my own `c83698c1` build mid-flight when the next commit landed; the resulting build off `22301d3d` includes my changes plus a separate work/projects layout fix)
**Test user:** `ramiz_ddd@mail.ru` (Ramiz's secondary account — surfaces the RU locale + Ramiz-personal `lw_new_nav=false` legacy preference)

---

## TL;DR

Banner now uses the EXACT 4-radial gradient recipe from landing hero. Both sidebar variants (legacy `Sidebar.tsx`, default `NewSidebar.tsx`) drop their `bg-violet-600 solid` / `bg-accent` active state in favor of the landing feature-card tonal recipe `bg-violet-500/15 text-violet-300 border border-violet-500/20`. Date string switched к next-intl `getLocale()` → renders "вторник, 26 мая 2026 г." on Ramiz's RU account.

`next build` exit 0 (47s). DOM-verified on production after `22301d3d` Vercel READY.

---

## Files changed (4)

| File | Change |
|---|---|
| `src/components/dashboard/WelcomeBanner.tsx` | 4-radial gradient (violet 0.95 / pink 0.55 / blue 0.45 / deep-violet 0.4, base `#090918`) — mirrors `src/app/page.tsx:96-103`. `border-line` → `border-white/10`. Date paragraph `text-slate-400` → `text-indigo-200`. Dot-grid overlay preserved. |
| `src/components/layout/Sidebar.tsx` | 4 active-state pills: group direct link, expandable header, sub-item, bottom utility. All four converted к `bg-violet-500/15 text-violet-300 border border-violet-500/20`. Inactive gains `border border-transparent` to prevent 1px hover shift. |
| `src/components/layout/NewSidebar.tsx` | 3 active-state pills: top leaf, child sub-item, bottom Notifications. Same recipe, replaces `bg-accent text-white shadow-md hover:bg-accent-hover`. globals.css `--accent` token untouched. |
| `src/app/(app)/dashboard/page.tsx` | Import switched from `getUserLocale + localeMeta` → next-intl `getLocale`. New `localeIso = locale === 'ru' ? 'ru-RU' : 'en-US'` ternary feeds `Intl.DateTimeFormat`. Unused imports removed. |

Diff size: `4 files changed, 25 insertions(+), 24 deletions(-)`.

---

## Evidence

### Landing hero reference (untouched)

**[landing-hero-reference.png](./landing-hero-reference.png)** — `/` at 1280×1024. Vivid violet → pink top, deep blue bottom-left, deep-violet bottom-right. This is the visual recipe banner must mirror.

### NewSidebar variant (default — lw_new_nav undefined or 'true')

| Before | After |
|---|---|
| **[PRE-dashboard-new-sidebar.png](./PRE-dashboard-new-sidebar.png)** | **[POST-dashboard-new-sidebar.png](./POST-dashboard-new-sidebar.png)** |
| Banner: muted 2-radial gradient on `#14101e`, `border-line` | Banner: vivid 4-radial gradient on `#090918`, `border-white/10` |
| Date: `Tuesday, May 26, 2026` (EN), `text-slate-400` | Date: `вторник, 26 мая 2026 г.` (RU), `text-indigo-200` |
| Active "Главная" pill: `bg-accent` solid violet | Active "Главная" pill: `bg-violet-500/15 text-violet-300 border-violet-500/20` (tonal) |

### Legacy Sidebar variant (lw_new_nav=false — Ramiz's account default)

| Before | After |
|---|---|
| **[PRE-dashboard-legacy-sidebar.png](./PRE-dashboard-legacy-sidebar.png)** | **[POST-dashboard-legacy-sidebar.png](./POST-dashboard-legacy-sidebar.png)** |
| Active "ГЛАВНАЯ" group label: `bg-violet-500/10 text-indigo-300` | Active "ГЛАВНАЯ" group label: `bg-violet-500/15 text-violet-300 border-violet-500/20` |
| Active "Главная" sub-item: `bg-violet-600 text-white` solid | Active "Главная" sub-item: `bg-violet-500/15 text-violet-300 border-violet-500/20` (tonal) |
| Banner + date: same as new variant pre-fix | Banner + date: same as new variant post-fix (consistent across cookie state) |

### Banner closeup

**[POST-banner-closeup.png](./POST-banner-closeup.png)** — scrolled-to-top view. 4-radial gradient covers full banner width with smooth violet ↔ pink ↔ blue blend identical к landing hero corners. Dot-grid overlay visible at 40% opacity.

---

## DOM probe results

Run on production after `22301d3d` Vercel READY:

```js
// dashboard locale + sidebar variant detection
{
  isNew: true,                                    // NewSidebar rendering with gradient logo
  logoClass: "bg-gradient-to-br from-violet-600 via-purple-500 to-pink-500 ...",
  dateText: "вторник, 26 мая 2026 г."             // RU locale ✓
}

// after document.cookie = "lw_new_nav=false; ..." + reload
{
  isLegacy: true,
  logoClass: "bg-violet-600 ...",                 // flat violet square, no gradient
  dateText: "вторник, 26 мая 2026 г."             // same RU date
}
```

Both cookie paths render the harmonized banner + tonal active pill. Cookie-agnostic fix confirmed.

---

## Honest non-overclaim

- `c83698c1` Vercel build was CANCELED when the next commit (`22301d3d`, an unrelated `/work/projects` layout fix) landed seconds later — Vercel kills in-flight builds for stale commits. The production deploy that's actually serving is built from `22301d3d`, which INCLUDES my 4 files. Verified via DOM probe + visual diff.
- Side-by-side тab comparison (landing.png vs banner-closeup.png) shows the banner gradient is structurally identical к landing hero — same 4 radial-gradients, same base color `#090918`, same color stops. Both ellipses sized to render at banner aspect ratio (banner is ~96:78px = 12:1, much wider than tall vs landing hero which is ~viewport-sized) — so the gradient distribution looks compressed but the recipe is the same.
- Active sub-item background opacity stepped from `bg-violet-600` (100% violet) к `bg-violet-500/15` (15% violet over canvas) — a significant tonal de-emphasis, which is exactly the landing feature-card style.
- I did NOT touch globals.css `--accent` token — `bg-accent` overrides happened only at the affected call sites; other consumers of `bg-accent` (buttons, CTAs, etc.) remain solid violet as before.
- `next build` локально exit 0, no TS errors. `localeMeta`/`getUserLocale` imports cleanly removed (verified via grep — no other consumers in dashboard/page.tsx).

— Agent 5, 2026-05-26
