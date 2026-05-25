# PR #231 post-merge verification — `/work/projects` i18n + canonical palette

**Merged:** 2026-05-25T16:24:45Z — SHA `8c4ebe649c46aec960fe35a61986374e9103df52`
**Vercel deploy READY:** 2026-05-25T16:26:58.989Z → `vercel-production`
**Verification status:** ✅ deploy live; ⚠️ **visual verification BLOCKED**

---

## What was verified (✅)

| Check | Result |
|---|---|
| Squash merge to `main` | ✅ `8c4ebe64` ([PR #231](https://github.com/fer-fer-code/lancerwise/pull/231)) |
| Vercel production deploy READY | ✅ 16:26:58Z, ~2 min after merge |
| Sentry release tagged | ✅ `8c4ebe64...` deploy_env=`vercel-production` |
| Production `/work/projects` reachable | ✅ HTTP 307 → `/login` (correct auth gate for unauth) |
| `server: Vercel` + `x-vercel-id` headers present | ✅ |
| Source code on `main` matches my diff | ✅ commit visible in `git log origin/main` |
| JSON parity post-rebase (en + ru `projectsPage` children) | ✅ same 13 children both sides |

## What is BLOCKED (⚠️) — Ramiz's specific visual checks

| Asked | Status |
|---|---|
| "Завершённые" pill is NOT blue | ⚠️ cannot verify visually |
| Timeline bars without neon blue/yellow/green | ⚠️ cannot verify visually |
| Filters render in Russian | ⚠️ cannot verify visually |
| dueBadge shows "просрочено на N дн." / "через N дн." | ⚠️ cannot verify visually |

## Why the visual gap

`/work/projects` requires authentication. Two paths tried:

1. **CDP-shared MCP Chrome at port 59736** — `ECONNREFUSED`. Shared profile not running.
2. **Isolated Chrome via `launchPersistentContext`** — login submit button stayed disabled. Turnstile widget on `/login` requires either a valid Turnstile token OR pre-warmed cookies. Fresh isolated profile has neither.

Per memory `feedback_supabase_captcha_dashboard.md` + `feedback_perimeter_x_bypass.md`, the documented workarounds are:
- Reuse existing Chrome tab via CDP — **shared profile is down right now**
- Session cookie injection — **no captured cookie available in my workspace**
- Persistent profile that's already logged in — **AGENT 3/6 own the only one**

## Static (code-level) verification — confirms the visual changes ARE shipped

Since I can't render visually, here's what the merged code at `8c4ebe64` proves about the visual changes (these are deterministic outcomes of the static code):

### Status pill "completed" no longer blue
Before (off-brand): `bg-blue-500/10 text-blue-300 border-blue-500/20`
After (canonical): `bg-success-bg text-success border-success/20` → resolves to `#43C97A` green per globals.css `--success`.

### Timeline `STATUS_COLORS` not neon
Before: `bg-blue-400, bg-yellow-400, bg-green-400, bg-slate-600`
After: `bg-accent, bg-warning, bg-success, bg-white/[0.10]` → all canonical tokens. Neon-blue/yellow/green-400 strings GONE.

### Russian strings present in messages/ru.json
Verified parity post-rebase. RU keys exist:
- `projectsPage.projectFilters.filtersButton` = "Фильтры"
- `projectsPage.projectFilters.clearFilters` = "Очистить фильтры"
- `projectsPage.projectsBoard.dueBadge.overdueByDays` = "просрочено на {days} дн."
- `projectsPage.projectsBoard.dueBadge.dueInDays` = "через {days} дн."

The TSX files call `useTranslations('projectsPage.projectFilters')` etc., so when the page renders for a RU-locale authed user, these strings resolve from `ru.json` (next-intl middleware reads the locale cookie).

### Aggressive grep clean
Zero `(slate|zinc|neutral|amber|emerald|green|yellow|red)-[0-9]` Tailwind classes remain in the 6 affected files.

## Pricing page (public, as auxiliary evidence)

Captured `/pricing` (RU) screenshot at `05-pricing-public.png`. Pricing page wasn't part of this PR, but it shares the marketing chrome (Navbar/Footer) that was untouched — serves as a sanity check the rest of the app still renders.

## Recommendation

**Visual verification deferred to Ramiz directly** (you have an authed browser session). Open `https://www.lancerwise.com/work/projects` after switching to RU and confirm:
- Status pill "Завершённые" — green, not blue
- Timeline legend — violet/green/red, not blue/yellow/green-neon
- Filter button reads "Фильтры"; "Очистить фильтры" link
- Project cards with past due dates show "просрочено на N дн." or "Срок сегодня"

If anything renders wrong, the fix is bounded to the 4 status-color mapping declarations (page.tsx activePill, ProjectTimeline STATUS_COLORS, ProjectStatusOverview statuses, ProjectBoard dueBadgeClass) — easy follow-up PR.

## Cross-references

- Merge: https://github.com/fer-fer-code/lancerwise/pull/231
- Merge SHA: `8c4ebe649c46aec960fe35a61986374e9103df52`
- Deploy URL: `https://lancerwise-16mn213mv-fer-fer-codes-projects.vercel.app`
- Production: `https://www.lancerwise.com`
- Screenshots: this dir (`01-initial`, `02-login-filled`, `05-pricing-public`)
- Memory: `feedback_perimeter_x_bypass`, `feedback_supabase_captcha_dashboard`
