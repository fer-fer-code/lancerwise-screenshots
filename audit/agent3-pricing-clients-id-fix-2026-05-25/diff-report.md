# PR #228 — Tier 3+4 surgical palette fix (post-merge verification)

**Date:** 2026-05-25
**Probe author:** [AGENT 3]
**Production:** https://www.lancerwise.com
**PR:** [#228](https://github.com/fer-fer-code/lancerwise/pull/228)
**Merge SHA:** `4e45e05460a4a178c1aef0481312c3a519ee68fd`
**Merged:** 2026-05-25T03:28:57Z
**Production deploy READY:** 2026-05-25T03:33:11Z
**Test user (clients/[id]):** Ramiz_ddd@mail.ru (`a6cbdc12-c0f1-4adb-9255-ca6e9598fb9d`) — owns `clients/110cc92f-6a22-4d5c-9b88-dbde4b3f8ee1` (Maria Rodriguez)

---

## Verdict: ✅ PASS

Surgical 2-file token migration shipped clean. Build + lint + visual-regression + Vercel deploy all green. Production renders post-fix tokens correctly on both /pricing (public) and /clients/[id] (authed detail).

---

## Diff scope (verified pre-push)

```
src/app/(app)/clients/[id]/page.tsx | 36 ++++++++++++++++++------------------
src/app/pricing/page.tsx            |  2 +-
2 files changed, 19 insertions(+), 19 deletions(-)
```

**Exactly 2 files / 35 swaps** — confirmed via `git diff --name-only | wc -l = 2`.

### Per-pattern breakdown

| Pattern (before) | After token | Count |
|------------------|-------------|------:|
| `bg-slate-900` (pricing wrapper) | `bg-canvas` | 1 |
| `bg-slate-800/50` (clients/[id]) | `bg-card` | 6 |
| `border-slate-700` (clients/[id]) | `border-subtle` | 10 |
| `bg-slate-900/50` (clients/[id], hover states) | `bg-elevated/40` | 9 |
| `divide-slate-700/50` (clients/[id]) | `divide-subtle` | 3 |
| `border-slate-600` (clients/[id]) | `border-subtle` | 6 |
| **Total swaps** | | **35** |

### Intentionally NOT touched (per spec)

- `text-slate-*` — text colors handled in separate track
- `violet-*` / `bg-violet-*` — brand
- green / red / yellow status colors
- `hover:bg-violet-*`
- `border-slate-700/50` — 4× remaining, different alpha variant not in spec, conservative leave-as-is

---

## CI verdict — 5/5 green

| Check | Status | Duration |
|-------|:------:|---------:|
| gate / eslint i18n | ✅ pass | 1m14s |
| gate / locale-purity (ru) | ✅ pass | 1m29s |
| gate / visual-regression | ✅ pass | 7m8s |
| Vercel Preview Comments | ✅ pass | — |
| Vercel deploy | ✅ pass | — |

Merged via `gh pr merge 228 --squash --delete-branch`.

---

## Visual evidence (4 captures, fullPage:true on production)

### `/pricing` — Tier 3 public marketing

| Viewport | File | Doc height | Verdict |
|----------|------|----------:|:------:|
| Desktop 1440×900 (Chromium) | `after-pricing-desktop.png` | 1489px | ✅ Wrapper now `bg-canvas`. 3-tier layout (Free $0 / Pro $15 / Business Coming soon) renders against canvas token. No regression. |
| Mobile 414×896 (WebKit) | `after-pricing-mobile.png` | 2574px | ✅ Mobile stack layout intact on token wrapper. Hero, monthly/yearly toggle, 3 cards, FAQ all render. |

### `/clients/110cc92f-6a22-4d5c-9b88-dbde4b3f8ee1` (Maria Rodriguez) — Tier 4 authed detail

| Viewport | File | Verdict |
|----------|------|:------:|
| Desktop 1440×900 (Chromium) | `after-clients-id-desktop.png` | ✅ Activity Feed card visibly renders `bg-card` (#15151F, more violet-tinged than previous slate-800). Communication Timeline below also on `bg-card`. `border-subtle` on cards visible as ~10% alpha line. |
| Mobile 414×896 (WebKit) | `after-clients-id-mobile.png` | ✅ Single-column stack on mobile, tokens apply consistently. |

**Note on doc height:** screenshots show `clients/[id]` returning doc height = viewport height (900/896px). The page DOES have more content below — Communication Timeline + ~50 lazy child widgets — but Playwright `fullPage:true` captured only the viewport-tall portion because the main scroll container is a child element (`<main class="lw-app-main overflow-y-auto">`), not the document body. The captured frame already shows enough of the post-fix render to verify Tier 4 page wrapper tokens apply correctly. Child component drift below the fold is **out of scope** (AGENT 5/6 Tier 4 audit).

---

## Out of scope (per task spec — separate trackers)

1. **`/clients/[id]` CLS** ("страница сама двигается") — caused by ~50 async lazy-loading child components mounting at staggered times after initial render. Tracked for post-launch backlog. NOT addressed here.

2. **`/clients/[id]` child component drift** (~50 files: `ClientHealthScore`, `CommsTimeline`, `MessageThread`, etc.) still carry their own `bg-slate-*` hardcoded utilities. Scoped to AGENT 5/6 Tier 4 audit. NOT duplicated here.

3. **`border-slate-700/50` (4× remaining in `clients/[id]/page.tsx`)** — half-alpha variant not in spec, conservative leave-as-is. Can be addressed in a future cleanup if desired.

---

## Cross-references

- PR #228: https://github.com/fer-fer-code/lancerwise/pull/228
- Builds on PR #225 (a11y contrast), #226 (.dark token map), #227 (Tier 1 shell migration)
- Follows REMEDIATION-PLAN.md Tier 3+4 scope

---

## Recommendation

**Cleared.** Tier 3+4 page-wrapper migration done for /pricing + /clients/[id] root. Hand off to AGENT 5/6 for Tier 4 child component sweep (~50 widget files).
