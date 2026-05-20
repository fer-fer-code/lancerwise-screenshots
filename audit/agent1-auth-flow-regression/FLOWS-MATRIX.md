# Auth Flow Regression Matrix — Pre-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Method:** READ-ONLY production audit via Playwright + Supabase Admin API. 2 test users (`test-auth-en-{ts}` + `test-auth-ru-{ts}` @lancerwise.test). All test users cleaned up post-audit.

---

## Summary

| # | Flow | EN | RU | Notes |
|---|---|---|---|---|
| A | Sign-up via /register | ⚠️ partial | ⚠️ partial | Form renders correctly; CAPTCHA gates server-side; `.test` TLD rejected; success path not reached due к CAPTCHA token reuse and admin user already present |
| B | Sign-up RU locale | ⚠️ partial | ✅ | Locale auto-detection via navigator.language → ru-RU default works; cookie banner localized |
| C | Email verification | ❌ **BLOCKER** | ❌ **BLOCKER** | JWT issued by Supabase, but token-in-fragment lands on `/` homepage without exchange logic; localStorage empty; user has dead end |
| D | Password reset link | ❌ **BLOCKER** | ❌ **BLOCKER** | Same root cause as C; recovery JWT lands on `/`, not `/reset-password`; user can't set new password |
| E | Login existing user | ✅ | ✅ (form text only) | Login → `/onboarding` redirect works; invalid creds → "Invalid login credentials" clean error; NO Turnstile on /login (only /register) |
| F | Onboarding wizard | ⚠️ UX bug | ⚠️ UX bug | 5-step wizard navigation works; Back disabled on step 1; Skip setup → /dashboard works. **BLOCKER:** cookie consent dialog overlaps "Continue" button on first load (pointer events blocked) |
| G | Logout + session expiry | ⚠️ discoverability | ⚠️ discoverability | Single "Sign out of all devices" button on /settings → /login; post-logout /dashboard → /login confirmed. **No simple "Sign out" anywhere** |

**Launch blockers: 2** (Flow C + D share the same root cause)
**P1 UX issues: 1** (Flow F cookie overlap)
**P2 polish: 4** (logout discoverability, i18n title leak, Turnstile widget lang, /login no Turnstile)
**Console noise: 1** (15 CF Turnstile CSP/TrustedHTML errors — external)

---

## Flow-by-flow detail

### Flow A — Sign-up EN /register

**State observed:**
- Page title: "Create Your Free Account | LancerWise"
- Hero: "Run your freelance business like a pro" — CRM, invoices, contracts, time tracking
- 4 value props listed (Free forever — up to 2 clients, AI contract generation, Client portal included, No credit card required)
- Form: Full name, Email, Password, Terms checkbox, optional updates checkbox, "Get started free" button (disabled until form valid)
- Cloudflare Turnstile widget renders + auto-passes ("Успешно" — see i18n note below)
- Cookie banner с 4 buttons (Customize / Reject / Accept All / Reject all and close)

**Submission attempts:**
- 1st attempt: `test-auth-form-{ts}@lancerwise.test` → error "Email address ... is invalid" → Supabase Auth rejects `.test` TLD on public sign-up ✅ (admin API bypasses this; expected security behavior)
- 2nd attempt: `test-auth-form-{ts}@example.com` → error "captcha protection: request disallowed (timeout-or-duplicate)" → CAPTCHA token reuse correctly blocked ✅

**Verdict:** Form-level + CAPTCHA + email-validation defenses all functional. Success path not reached due к CAPTCHA reuse, но this proves S1+S2 (memory rule #18) is server-enforced.

**Screenshot:** [A-register-EN.png](SCREENSHOTS/A-register-EN.png), [A-captcha-reuse-block.png](SCREENSHOTS/A-captcha-reuse-block.png)

---

### Flow B — Sign-up RU /register

**Locale detection:** No NEXT_LOCALE cookie; navigator.language=ru-RU → RU rendered by default. ✅

**RU strings observed:**
- "Назад в LancerWise"
- "Ведите фриланс-бизнес как профи"
- "CRM, счета, договоры, учёт времени — всё в одном месте."
- "Создайте аккаунт"
- "Бесплатно навсегда, перейдёте на Pro, когда будете готовы"
- Form labels: Полное имя / Email / Пароль / Я принимаю Условия использования и Политику конфиденциальности

**Cookie banner RU:** "Файлы cookie: Мы используем файлы cookie..." / Buttons: Настроить / Отклонить / Принять все

**i18n leak:** Page `<title>` stays "Create Your Free Account | LancerWise" (EN-only metadata) regardless of body locale.

---

### Flow C — Email verification (BLOCKER P0)

**Setup:** admin-created user; `admin.generateLink({type:'signup'})` produced verify URL.

**Walk:**
1. Navigate to `https://skfgwyzarrhhkzvltbgm.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https://www.lancerwise.com`
2. Supabase verifies token → issues JWT → 302 redirect к `https://www.lancerwise.com/#access_token=eyJ...&type=signup`
3. Page lands: title "LancerWise — Free Freelancer CRM, Invoices & AI Contracts" (homepage)
4. Body: marketing page с "Run Your Freelance Business Like a Pro" + "Start for Free" CTA pointing back к /register
5. After 3+ sec wait — URL unchanged, no automatic redirect к /onboarding

**Session check (`localStorage`):**
- `sb-*` keys: EMPTY array
- `authStorage` value: null
- → **JWT in URL fragment was NOT exchanged к session**

**Confirmation:** navigated к `/dashboard` → 302 redirect к `/login` (no session).

**Net impact:** newly-verified user has NO session, is on homepage, has no indication anything happened. Most likely behaviour: user clicks Sign In → re-enters credentials (works) → reaches /onboarding. So Flow C is recoverable through manual login but not auto-flowing.

**Root cause hypothesis:** Supabase email template redirect_to is set к `https://www.lancerwise.com` (Site URL only); homepage doesn't include `supabase.auth.getSession()` token-fragment processing. Standard Next.js+Supabase pattern requires `/auth/callback` route OR root-level `<AuthProvider>` calling `detectSessionInUrl`.

**Severity:** **P0 launch blocker** — first-time users complete email verify but cannot reach product. They'll either re-enter credentials (works, recoverable) or assume the link is broken and abandon. Loss of conversion likely.

---

### Flow D — Password reset (BLOCKER P0, same root cause as C)

**Setup:** admin-generated recovery link for RU user (EN user's link already OTP-consumed by signup verify — Supabase normal behavior, not a bug).

**Walk:**
1. Navigate к recovery URL
2. Supabase exchanges token → 302 к `https://www.lancerwise.com/#access_token=...&type=recovery`
3. Lands on homepage (NOT /reset-password)
4. /reset-password route exists and renders form when manually visited
5. /forgot-password route exists with "Send reset link" disabled-until-email-filled

**Net impact:** user clicks "Reset password" link in email → arrives at marketing homepage → confused. Manual nav к /reset-password shows form но без session token tied к it.

**Severity:** **P0 launch blocker** — locked-out users cannot recover access. Worse than Flow C because no obvious recovery path.

**Same root-cause fix as Flow C** — one change closes both.

---

### Flow E — Login + invalid creds

**Login success:** admin-created EN user → /onboarding redirect ✅

**Invalid credentials:**
- Email correct, wrong password
- Returns: "Invalid login credentials" (red inline message, не crash) ✅
- Form remains usable, retry possible

**Turnstile NOT present on /login** — only on /register. May be intentional design (anti-bot focus on sign-up flood prevention) но worth noting if [pen-tester report or memory rule #18 implies broader coverage].

**RU locale `/login`:**
- "Назад в LancerWise" / "С возвращением" / "Войдите в свой аккаунт LancerWise" / "Войти" / "Нет аккаунта?" / "Регистрация бесплатно" ✅
- `<title>` still EN ("Sign in | LancerWise") — same i18n leak as Flow B

---

### Flow F — Onboarding wizard (P1 UX BUG)

**Wizard layout:**
- 5-step indicator (1 2 3 4 5)
- Step 1: "Set Up Your Profile" — Full Name (required), Business Name (optional), Hourly Rate (optional), Country (combobox с 33 countries + Other)
- Step 2: "Brand Your Invoices" — Upload logo + brand color
- Validation: "Full name is required" error before allowing Continue ✅
- Skip setup → link к /dashboard ✅
- Back button disabled on step 1 ✅
- Step 1 indicator converts к checkmark on step 2 ✅

**P1 UX BUG:** Cookie consent dialog is `position: fixed` at bottom and OVERLAPS the "Continue" button on first-time user flow. Pointer events blocked. Reproducible: fresh signup → /onboarding → click Continue → ignored.

**Repro evidence (Playwright):**
```
- waiting for element to be visible, enabled and stable
- element is visible, enabled and stable
- <div ...subtree intercepts pointer events>
  role="dialog" aria-label="Cookie consent"
```

**Mobile risk:** even worse on mobile — banner takes more vertical space.

**Workaround:** user must dismiss cookie banner first. Не obvious к first-time user.

**Severity:** **P1 launch UX** — first-time user blocked on Continue button. Probable abandonment в first 30 sec.

---

### Flow G — Logout + session expiry

**Logout discovery:**
- No "Sign out" в global header (user "U" icon doesn't open menu in this audit run)
- No "Sign out" в sidebar
- Only "Sign out of all devices" button on /settings — semantic mismatch (this should be specific security feature, not the primary logout)

**Logout works:**
- Click "Sign out of all devices" → /login (302)
- Subsequent /dashboard nav → 302 к /login ✅
- Session destroyed ✅

**Severity:** P2 UX — logout works, but discoverability poor. A user wanting to "sign out from this device" sees only "all devices" wording which carries unintended implication (kicks them out of all other sessions too).

---

## Cross-references

- [LAUNCH-BLOCKERS.md](./LAUNCH-BLOCKERS.md) — Flow C + D + F detailed
- [CONSOLE-ERRORS.md](./CONSOLE-ERRORS.md) — 15 CF Turnstile CSP errors analysed
- SCREENSHOTS/ — captured viewport PNGs (A-register-EN, A-captcha-reuse-block, F-onboarding-step1)
- Setup script: [`scripts/auth-audit-setup.mjs`](../../../lancerwise/scripts/auth-audit-setup.mjs) (lancerwise-agent1 worktree)
- Memory references: `backlog_test_account_email_domain.md` (confirmed `.test` TLD rejected), `feedback_supabase_captcha_dashboard.md` (S1+S2 verified)
