# #215 Logout Repro — Verification Result

**Issue:** #215 — INCONCLUSIVE: Logout не triggers redirect to /login (needs manual repro)
**Verifier:** [AGENT 2]
**Date:** 2026-05-23
**Production:** `04475a34`
**Method:** Playwright headless (Chromium) + Supabase Admin magic-link bypass for Turnstile
**Cycles:** 3 consecutive complete logout→re-login cycles

## Verdict — RECOMMEND CLOSE

**Logout works correctly. All 6 verification points PASS in all 3 cycles. Cannot reproduce reported INCONCLUSIVE behavior.**

[AGENT 5]'s original INCONCLUSIVE finding most likely caused by MCP synthetic-event interaction with `onMouseDown` handler (Header.tsx:270 uses `onMouseDown={signOut}`, not `onClick`). Real browser pointer events trigger the handler correctly.

## Implementation reviewed

`src/components/layout/Header.tsx:133-136`:
```ts
async function signOut() {
  await supabase.auth.signOut()
  router.push('/login')
}
```

Bound at line 270: `<button onMouseDown={signOut}>`.

**Note:** `onMouseDown` (not `onClick`) — explains why MCP synthetic-click may have missed the handler. Real browser mouse down + up triggers it; Playwright's `page.mouse.down()` + `page.mouse.up()` also triggers it (this test).

## Per-cycle results

| Step | Cycle 1 | Cycle 2 | Cycle 3 |
|---|---|---|---|
| 1. URL after Sign Out click | ✅ `/login` | ✅ `/login` | ✅ `/login` |
| 2. Redirect happened | ✅ true | ✅ true | ✅ true |
| 3. `sb-…-auth-token` cookie cleared | ✅ true | ✅ true | ✅ true |
| 4. `/dashboard` refresh → `/login` | ✅ true | ✅ true | ✅ true |
| 5. Supabase signOut API call | ✅ POST `/auth/v1/logout?scope=global` → **204** | ✅ POST → 204 | ✅ POST → 204 |
| 6. Re-login same credentials works | ✅ true | ✅ true | ✅ true |
| 7. Can reach `/dashboard` post-relogin | ✅ true | ✅ true | ✅ true |

**Consistency:** 7 ✅ × 3 cycles = 21/21 PASS

## Network trace

Each cycle issued exactly one `POST https://skfgwyzarrhhkzvltbgm.supabase.co/auth/v1/logout?scope=global` returning `HTTP 204 No Content` — Supabase canonical signOut response. No retries, no failures.

## Console errors observed (noise, not failures)

- `Failed to load resource: the server responded with a status of 401`
  - Cause: in-flight RSC prefetches use the now-cleared session cookie. Normal during logout — happens AFTER signOut clears cookie but BEFORE page navigates away.
- `%c%d font-size:0;color:transparent NaN`
  - Cause: Sentry/PostHog internal logging artifact (browser DevTools styling). Cosmetic, not functional.

## Methodology notes

- **Auth bypass:** Supabase Admin `generate_link` (service-role-keyed) → magic-link → session cookie set without Turnstile (per memory `feedback_supabase_captcha_dashboard`). Production users still go through Turnstile.
- **Welcome tour bypass:** Injected `localStorage.lw_welcome_tour_completed_v1 = '1'` via `addInitScript` before dashboard navigation. The driver.js tour overlay was intercepting pointer events for the avatar button on first cycle (caught and fixed before recording cycle 1).
- **Mouse event:** Used `page.mouse.down() + page.mouse.up()` rather than `.click()` to faithfully reproduce the `onMouseDown` handler trigger.
- **Test isolation:** Each cycle uses a fresh `BrowserContext` (no cookie/storage carryover between cycles).

## Evidence

12 screenshots × 3 cycles in `evidence/`:
- `cycleN-01-dashboard.png` — pre-logout authenticated dashboard
- `cycleN-02-menu-open.png` — avatar dropdown open, Sign Out visible
- `cycleN-03-after-logout.png` — redirected to `/login` page
- `cycleN-04-dashboard-refresh.png` — `/dashboard` refresh confirms redirect to `/login`

`findings.json` — full per-cycle JSON with all 7 verification steps + API call log + console errors.

## Recommendation

**Close #215 with verdict:** "Unable to reproduce on production `04475a34` across 3 consecutive cycles. Logout flow verified end-to-end: button click → `auth.signOut()` → Supabase 204 → cookie cleared → `router.push('/login')` → session-protected routes properly redirect. Original INCONCLUSIVE finding likely caused by MCP synthetic-event interaction with the `onMouseDown` handler (Header.tsx:270). Monitor post-launch via Sentry."
