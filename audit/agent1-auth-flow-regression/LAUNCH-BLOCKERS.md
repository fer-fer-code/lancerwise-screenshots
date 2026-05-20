# Auth Flow — Launch Blockers

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Severity discipline:** P0 = cannot launch; P1 = ship-with-monitoring acceptable but visible UX bug; P2 = polish.

---

## P0 BLOCKER #1 — Email verification token not exchanged к session

**Flow affected:** C — email verification (after sign-up)

**Symptom:** newly-verified user lands on public homepage with `#access_token=...&type=signup` fragment в URL; no session created; subsequent /dashboard navigation routes back к /login.

**Evidence:**
- `localStorage` after redirect: empty `sb-*` keys
- Cookie storage: no auth session cookie
- /dashboard navigation: 302 к /login

**Root cause hypothesis:** Supabase email template `redirect_to` parameter points к `https://www.lancerwise.com` (Site URL). Homepage at `/` does not include client-side logic to detect access_token in URL fragment and call `supabase.auth.setSession()`. Standard Next.js+Supabase remediation: either (a) change Supabase template's redirect_to к `/auth/callback` route с code exchange OR (b) add token-detection middleware к root layout.

**User impact:** first-time conversion path broken at the most fragile moment. After clicking verification email, user expects to land in product; instead sees marketing homepage. Likely to either re-enter credentials manually (recoverable) or assume broken and abandon (lost).

**Fix scope estimate:** ~2-4h. Two paths:
- **Path 1 (recommended):** add `/auth/callback` route handler that exchanges code OR processes hash, then redirects к /onboarding. Update Supabase email templates' redirect_to. Tests: cypress E2E on signup→verify→dashboard.
- **Path 2 (quick patch):** add `useEffect` к root layout that reads `location.hash`, calls `supabase.auth.setSession(parseHash())`, then `router.push('/onboarding')`. Hacky но closes blocker fast.

**Risk если ships как is:** estimated 30-50% first-time user abandonment from email verify path. Could explain any unusually low day-1 activation rate.

---

## P0 BLOCKER #2 — Password reset link lands on homepage instead of /reset-password

**Flow affected:** D — password reset

**Symptom:** clicking "Reset password" email link → Supabase exchanges token → 302 к `https://www.lancerwise.com/#access_token=...&type=recovery` → homepage. User sees marketing site, не password-set form.

**Evidence:** /reset-password route exists и renders form when manually visited, но recovery link does not route to it.

**Root cause:** same as #1 — Supabase email template redirect_to points к Site URL only; no handling of `type=recovery` к route к /reset-password.

**User impact:** locked-out users cannot recover access. Worse than #1 because there's no obvious workaround — user can't just "log in" since they don't know their password.

**Fix scope estimate:** ~1h (if Path 1 from #1 already addresses recovery type) OR ~2h (if separate handler needed). Same fix as #1 closes both blockers.

**Risk если ships as is:** account lockouts = ticket burden + churn. Particularly harmful at launch when users still trying their first password.

---

## P0 BLOCKER #3 — Cookie consent dialog overlaps onboarding "Continue" button

**Flow affected:** F — onboarding wizard

**Symptom:** first-time post-signup user lands on /onboarding → Continue button blocked by cookie consent dialog. Pointer events intercepted. User cannot proceed.

**Evidence:** Playwright timeout reproducing — cookie banner `<div role="dialog" aria-label="Cookie consent">` and its inner padding container both intercept pointer events targeting the form's Continue button.

**Reproducer:** fresh first-time user lands on /onboarding; cookie banner has not been dismissed yet (default state on first visit); the button is at bottom of content area, overlapped by `position: fixed` banner.

**User impact:** literally cannot complete onboarding without first dismissing cookie banner. User has to figure out why Continue is unresponsive. Probable first-30-sec abandonment.

**Fix scope estimate:** ~30 min. Either:
- Add bottom padding к onboarding `<main>` element equal to cookie banner height
- Lower z-index of cookie banner OR raise onboarding content z-index
- Re-arrange layout (wizard content within scrollable container с bottom-anchored CTA above the fold)

**Risk если ships as is:** P0 first-time UX blocker. Defended by "user knows к dismiss banner first" but не safe assumption — banner copy doesn't communicate that.

---

## P1 — No simple "Sign out" button

**Flow affected:** G — logout

**Symptom:** only logout entry is "Sign out of all devices" on /settings. No quick logout in global header/sidebar/user menu.

**User impact:** privacy/security best practice violated. Most apps offer one-click sign out near user avatar. Power users + privacy-conscious users notice this gap.

**Fix scope:** ~1-2h. Add "Sign out" к header user menu (the "U" button), keep "Sign out of all devices" в /settings as advanced option.

**Risk if shipped as is:** не launch-blocking. Minor friction.

---

## P2 — i18n leaks

| Item | Where | Severity |
|---|---|---|
| Page `<title>` not translated | All authenticated and unauth routes (/login, /register, etc.) | P2 — affects SEO + browser tab labels |
| Cloudflare Turnstile widget lang attr | EN /register shows "Успешно" instead of "Success" | P3 — Cloudflare side, may need explicit `lang` prop |

---

## P2 — /login has no Turnstile (sign-up only)

**Observation:** /register shows Cloudflare Turnstile widget; /login does not.

**Interpretation:** likely intentional (CAPTCHA targets sign-up flood, не sign-in brute force). If brute-force protection desired on login, need separate rate-limiting (Supabase Auth has built-in `max_attempts` per IP).

**Action:** verify rate-limiting is enabled in Supabase Auth → Settings → "Brute force protection" OR file backlog for evaluation.

---

## Cross-references

- [FLOWS-MATRIX.md](./FLOWS-MATRIX.md) — full flow walkthrough
- [CONSOLE-ERRORS.md](./CONSOLE-ERRORS.md) — Cloudflare Turnstile noise analysis
- `feedback_supabase_captcha_dashboard.md` — S1/S2 server-side enforcement confirmed
