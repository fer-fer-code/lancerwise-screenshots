# Sidebar logo block alignment — 8px step removed

**Date:** 2026-05-26
**Agent:** Agent 5
**Commit:** `0c23066e` — `fix(sidebar): align logo block left padding с nav items — remove 8px step`
**Files changed:** 2 (2 insertions, 2 deletions — 1 line each in `Sidebar.tsx` + `NewSidebar.tsx`)
**Vercel state at capture:** READY (deploy minted from 0c23066e)

---

## TL;DR

Logo block was `p-5` (20px on all sides); nav items use `px-3` (12px). Result: visible 8px step on the left edge between the logo lockup and the first nav pill.

Fix: switched logo container to `px-3 py-5` — same horizontal padding as nav, keep generous vertical padding. Both `Sidebar.tsx` (legacy, behind `lw_new_nav=false` cookie) and `NewSidebar.tsx` (default-enabled) patched.

DOM-measured proof:
- **Pre-fix:** logo `<a>` left = 20px, "Главная" nav item left = 12px → 8px step
- **Post-fix:** both = 12px → 0px step

---

## Root cause (one-line patch each file)

### `src/components/layout/Sidebar.tsx` line 150

```diff
-      <div className="p-5 border-b border-white/5">
+      <div className="px-3 py-5 border-b border-white/5">
```

### `src/components/layout/NewSidebar.tsx` line 178

```diff
-      <div className="p-5 border-b border-subtle">
+      <div className="px-3 py-5 border-b border-subtle">
```

Other blocks in both sidebars already use `p-3` or `px-3` so they already align:

| Block | Class | Left padding |
|---|---|---|
| Logo (pre-fix) | `p-5` | **20px** ← outlier |
| Search container | `px-3 pt-3 pb-1` | 12px |
| Nav | `flex-1 p-3` | 12px |
| Footer (notifications + theme toggle) | `p-3 border-t` | 12px |
| Nav item Link | `px-3 py-2` | inherits 12px from nav parent |

Logo was the lone outlier. Patching it brings every left edge into one column.

---

## Verification

### Pre-fix DOM probe (production /dashboard, RU locale, lw_new_nav=false → renders legacy `Sidebar.tsx`)

```js
const aside = document.querySelector('aside[data-tour="sidebar-nav"]');
const links = aside.querySelectorAll('a[href="/dashboard"]');
// → 2 links: LancerWise lockup + "Главная" nav item
[{ left: 20, text: "LancerWise" },
 { left: 12, text: "Главная" }]
```

8px step observable in **[sidebar-PRE-fix-1280x1024.png](./sidebar-PRE-fix-1280x1024.png)** — purple Zap-icon container's left edge is 8 pixels right of "Главная" pill's left edge.

### Post-fix DOM probe (same page after Vercel READY)

```js
[{ left: 12, text: "LancerWise" },
 { left: 12, text: "Главная" }]
step = 0
```

**[sidebar-POST-fix-1280x1024.png](./sidebar-POST-fix-1280x1024.png)** — Zap-icon container's left edge now flush with "Главная" pill's left edge. No visible step.

---

## What I did NOT change

- Vertical padding `py-5` (= 20px) preserved on the logo block — keeps generous breathing room above/below the wordmark
- Border-bottom (`border-b border-white/5` / `border-subtle`) preserved
- Logo content (Zap icon size, gap-2.5 between icon + wordmark, text-lg font-bold) untouched
- Nav item padding (`px-3 py-2`) untouched
- No other sidebar blocks touched

`next build` exit 0 (51s). 2 files, 2 lines changed total.

---

## Notes

- Ramiz's account renders the legacy `Sidebar.tsx` (flat violet square logo, no gradient). Default for new users is `NewSidebar.tsx` (gradient logo). Same patch applied к both — no matter which is enabled via the `lw_new_nav` cookie.
- The user-side cookie can be flipped per-account; the fix doesn't depend on cookie state.

— Agent 5, 2026-05-26
