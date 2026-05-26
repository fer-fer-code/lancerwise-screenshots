# Dashboard i18n verification — commit `2e744ed6`

**Commit:** `2e744ed6` — `fix(dashboard i18n): cash-flow week label + activity feed + install prompt`
**Production HEAD (at verify):** `a3e3200a` (work/time ErrorBoundary fix #237 landed after — `2e744ed6` is in deploy chain)
**Vercel deploy for `2e744ed6`:** ✅ READY (`Fqep5u5boGshGRSBWYTqu7v6JoxP`)
**Required gates:** ✅ `gate / eslint i18n` = success, ✅ `gate / locale-purity (ru)` = success
**Verification status:** ✅ deploy live + source code matches commit intent; ⚠️ **authed visual screenshot BLOCKED** (Turnstile, same pattern as cb2a86d3/a1bb3d19)

---

## Three fixes — all confirmed deployed (✅)

### Fix 1: Cash-flow weekLabel — server EN → client-side locale-aware

| Check | Result |
|---|---|
| `/api/analytics/cash-flow` returns `lowestBalanceWeekStart` (ISO) | ✅ `src/app/api/analytics/cash-flow/route.ts:282` — `lowestBalanceWeekStart: lowestWeek?.weekStart ?? ''` |
| `/api/analytics/cash-flow` returns `lowestBalanceWeekIndex` | ✅ `src/app/api/analytics/cash-flow/route.ts:283` — `lowestBalanceWeekIndex: lowestWeek ? weeks.indexOf(lowestWeek) : -1` |
| `CashFlowWidget` consumes new fields | ✅ Lines 17-18 typed, 43-44 read from JSON, 61-65 ternary build `localizedWeekLabel` |
| `widget.cashFlow.thisWeek` key | ✅ RU `На этой неделе` / EN `This week` (both present) |
| Locale-aware `toLocaleDateString` | ✅ Line 64 — `new Date(...).toLocaleDateString(monthLocale, { month: 'short', day: 'numeric' })` where `monthLocale = locale === 'ru' ? 'ru-RU' : 'en-US'` |

**Behavior:** When `lowestBalanceWeekIndex === 0` → renders `t('thisWeek')` ("На этой неделе" in RU). Otherwise formats `lowestBalanceWeekStart` ISO date via user's locale → "27 мая" in RU, "May 27" in EN.

### Fix 2: `/api/dashboard/stats` activity descriptions → getTranslations

| Check | Result |
|---|---|
| `getTranslations` imported | ✅ Line 4 |
| `getRequestLocale` imported | ✅ Line 5 |
| `formatMinutes` helper imported | ✅ Line 6 |
| 3 namespaces awaited (activity/common/format) | ✅ Lines 13-16 |
| Invoice activity uses `tActivity(statusKey, { number })` | ✅ Line 147 — `statusKey` resolves to `invoicePaid` / `invoiceOverdue` / `invoiceDraft` / `invoiceSent` |
| Project activity uses `tActivity(projectKey, { title })` | ✅ Line 158 — `projectKey` resolves to `projectCompleted` / `projectActive` |
| Proposal activity uses `tActivity('proposalSent', { number })` | ✅ Line 166 |
| Time entry uses `tActivity('timeLogged', { formatted, description })` | ✅ Line 178 |
| `tCommon('untitled')` fallback for empty descriptions | ✅ Line 175 |
| Hardcoded EN string leftover grep | ✅ 0 hits for `'Invoice |"Invoice |'Project |"Project |'Logged |"Logged |'Proposal:|"Proposal:` |

All 8 i18n keys present in `messages/ru.json` with proper translations:
- `activity.invoiceDraft` → "Счёт {number} в черновиках"
- `activity.invoicePaid` → "Счёт {number} оплачен"
- `activity.invoiceOverdue` → "Счёт {number} просрочен"
- `activity.invoiceSent` → "Счёт {number} отправлен"
- `activity.projectActive` → "Проект «{title}» активен"
- `activity.projectCompleted` → "Проект «{title}» завершён"
- `activity.proposalSent` → "Предложение {number} отправлено"
- `activity.timeLogged` → "Учтено {formatted}: {description}"
- `common.untitled` → "без названия"

`format.minutesShort` ("{count} мин") + `format.hoursPlural` (ICU plural: один/нескольких часов) used by `formatMinutes` helper — both present with proper Russian pluralization.

### Fix 3: InstallPrompt — i18n + canonical palette

| Check | Result |
|---|---|
| `useTranslations('installPrompt')` wired | ✅ Line 5 import, Line 13 hook |
| `t('title')` / `t('subtitle')` / `t('install')` / `t('dismiss')` | ✅ All 4 keys consumed |
| Card chrome: `bg-card border border-subtle` | ✅ Line 55 |
| `text-text-primary` / `text-text-muted` | ✅ |
| `hover:bg-elevated/40` (was `hover:bg-slate-700/50`) | ✅ |
| Grep palette leftovers | ✅ 0 hits for `bg-slate|text-slate|border-slate` |

All 4 i18n keys present in `messages/ru.json`:
- `installPrompt.title` → "Добавить на главный экран"
- `installPrompt.subtitle` → "Используйте LancerWise как приложение"
- `installPrompt.install` → "Установить"
- `installPrompt.dismiss` → "Закрыть"

---

## What's BLOCKED (⚠️) — authed Playwright screenshot

Production `/dashboard` requires auth. Same Turnstile gap as PR #231 / cb2a86d3 / a1bb3d19 verifies:

1. **CDP shared profiles** — no CDP port open (9222, 59736, 21000, 24000, 9332 all closed).
2. **MCP playwright `mcp-chrome-d284463` profile** — `Browser is already in use` (locked by another concurrent agent).
3. **Isolated Chrome via `launchPersistentContext`** — Turnstile widget on `/login` stayed `disabled` for 60s+. Submit never enabled. No pre-warmed cookies, no captured session.

Production reachability confirmed via HEAD probes:
- `/dashboard` → HTTP 307 → `/login` (auth gate working, deploy live, `server: Vercel` header)
- `/api/dashboard/stats` → HTTP 401 (auth required, route exists, JSON response shape preserved)
- `/api/analytics/cash-flow` → HTTP 401 (same)

Login redirect screenshot captured (`01-login-blocked.png`) — confirms RU locale rendering + canonical violet palette on adjacent public chrome.

---

## Recommendation

**Visual verification deferred to Ramiz directly** (your browser has an authed session). Hard refresh `https://www.lancerwise.com/dashboard` with NEXT_LOCALE=ru and confirm:

### CashFlow widget (if cash crunch is currently projected)
- Should show "Прогноз кассового разрыва — баланс может упасть до {amount} в период На этой неделе" (if crunch is this week) OR "...в период 27 мая" (RU-formatted date for future week)
- No "This Week" or "Jun 23" English leak

### Activity feed (recent entries)
- "Счёт INV-1234 в черновиках" (not "Invoice INV-1234 draft")
- "Проект «My Project» активен" (not `Project "My Project" active`)
- "Предложение Web Design отправлено" (not "Proposal: Web Design (pending)")
- "Учтено 1 ч 30 мин: без названия" or "Учтено 45 мин: <description>" (not "Logged 90m: untitled")

### InstallPrompt (only visible on mobile/PWA-eligible browsers)
- Title: "Добавить на главный экран" (not "Add to Home Screen")
- Subtitle: "Используйте LancerWise как приложение"
- Install button: "Установить"
- Dismiss aria-label: "Закрыть"

### Out-of-scope EN that may persist
- Per commit message: AI next-action `action.action` field stays EN ("Bill X for Y hours of unbilled time..."). This is the prompt template for `/api/ai/next-action` — locale-aware prompt is a separate task.
- SuperDashboardClient widgets (separate work).

If any in-scope string still renders EN on the live page, ping with the specific element and I'll trace the source.

---

## Cross-references

- Commit: `2e744ed6d4d84031640e17cd6e56a714a1d6c04f` — 6 files, +54/-11
- Production HEAD: `a3e3200a` (`work/time` ErrorBoundary wrap)
- Vercel deploy: `vercel.com/fer-fer-codes-projects/lancerwise/Fqep5u5boGshGRSBWYTqu7v6JoxP` (READY)
- Production URL: `https://www.lancerwise.com/dashboard`
- Memory: `feedback_perimeter_x_bypass`, `feedback_supabase_captcha_dashboard`
- Worktree: `/Users/myoffice/lancerwise-agent4-contracts` (dedicated, no contamination)
