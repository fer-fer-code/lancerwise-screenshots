# Onboarding — Current Behaviour

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Mode:** Read-only audit. Code analysis only — fresh-signup flow не reproduced live (would require new test account creation, hits anti-pattern memo of polluting prod accounts).

## TL;DR

The codebase **clearly intends** `/onboarding` for fresh users. There are **three** gates that should funnel new users there:

1. **Register page** sets `emailRedirectTo: /auth/callback?next=/onboarding`
2. **Auth callback** redirects к `next` param (so confirmed-email landing IS /onboarding)
3. **Dashboard page** has a server-side redirect к /onboarding if `!profile.full_name && !profile.onboarding_completed_at`

[AGENT 3]'s Flow G report ("fresh user lands /dashboard напрямую") is most likely a **test fixture artifact** — likely caused by admin-created test users that bypass email confirm and either set `full_name` immediately or have profile row in non-null state.

## What the code says

### 1. Register page — sets next=/onboarding

`src/app/(auth)/register/page.tsx:60` (around line 60):
```tsx
options: {
  data: {
    full_name: fullName,
    marketing_consent: marketingOptIn,
    tos_accepted_at: new Date().toISOString(),
  },
  emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
  captchaToken: captchaToken || undefined,
}
```

Sign-up form passes `full_name` к `user_metadata` (Supabase auth metadata, not `profiles` table). Email confirmation link points к `/auth/callback?next=/onboarding`.

### 2. Auth callback — honours `next` param

`src/app/auth/callback/route.ts:175-203`:
```tsx
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  // ...exchange code, send welcome email, redirect:
  return NextResponse.redirect(`${origin}${next}`)
}
```

- If `next=/onboarding` (from register), redirects there
- If `next` missing (e.g. magic-link login без custom next), defaults к `/dashboard`

### 3. Dashboard page — defensive redirect к /onboarding

`src/app/(app)/dashboard/page.tsx:11-25`:
```tsx
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Redirect first-time users to onboarding wizard if they haven't set their name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, onboarding_completed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile && !profile.full_name && !profile.onboarding_completed_at) {
    redirect('/onboarding')
  }
  // ...continues к dashboard render
}
```

The condition `profile && !profile.full_name && !profile.onboarding_completed_at` requires:
- `profile` row exists (если null → no redirect, falls through к dashboard)
- `full_name` IS empty
- `onboarding_completed_at` IS empty

### 4. Wizard finish — marks completion

`src/app/(app)/onboarding/OnboardingWizard.tsx` (per git log of commit `6c0ba226`):
```tsx
async function handleFinish() {
  ONBOARDING_STEPS.forEach(s => markStepComplete(s.id))
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles')
        .update({ onboarding_completed_at: new Date().toISOString() })
        .eq('id', user.id)
    }
  } catch { /* non-critical */ }
  router.push('/dashboard')
}
```

When user clicks "Finish" в wizard, `onboarding_completed_at` is set. Subsequent dashboard visits skip the redirect.

## What this means для fresh signup

Real signup path:
1. User fills `/register` form, submits → Supabase creates auth user (с `full_name` в `user_metadata`)
2. Email confirmation sent. User clicks link.
3. Browser navigates к `/auth/callback?code=...&next=/onboarding`
4. Auth callback exchanges code → session, redirects к `/onboarding`
5. User completes wizard → `onboarding_completed_at` set → wizard pushes к `/dashboard`
6. Dashboard sees `onboarding_completed_at` non-null → renders normally

If the profiles row hasn't been created at step 3 yet (no DB trigger found в migrations), the dashboard redirect gate would short-circuit on `profile && ...` — which means even direct `/dashboard` access at step 4 wouldn't redirect.

## What AGENT 3 probably saw

[AGENT 3]'s test fixture (admin-created user with cookie injection, see `BASELINE-METHODOLOGY.md` "Test user has ZERO CRM data"):

- Admin createUser bypasses email confirmation → never hits /auth/callback с next=/onboarding
- Profile row may or may not exist (no trigger в migrations searched)
- If profile created with `full_name` set (matching the user_metadata), redirect gate в dashboard fails → land /dashboard ✅
- Welcome Tour overlay (component `WelcomeTour.tsx` rendered at `dashboard/page.tsx:48`) appears, which is what AGENT 3 captured

This is **expected behaviour for an admin-fixtured test user**, не a regression in production user flow.

## Welcome Tour vs /onboarding wizard

These are **two different mechanisms**:

| Mechanism | Trigger | Purpose | UI |
|---|---|---|---|
| `/onboarding` wizard | Server redirect from `/dashboard` for fresh user | First profile setup (name, brand, 1st client, 1st invoice) | Full-page wizard, 5 steps |
| Welcome Tour | Mounted on `/dashboard` for ALL users until localStorage flag set | Feature walkthrough overlay | driver.js popovers over dashboard widgets |

Wizard runs once при signup. Welcome Tour runs once per browser/device. Independent.

## Repo evidence (commit history)

- `6c0ba226` (2026-04-29): "feat: auto-redirect new users к onboarding wizard + mark completion в DB" — installs the dashboard redirect gate
- `257aab36` (2026-04-26): "feat: 5-step onboarding wizard with profile, branding, client, invoice, и explore steps" — initial wizard build
- `6bf50290`: "Task C: onboarding polish — welcome tour + PostHog setup tracking" — confirms tour is *additional* k wizard, не replacement

Intent is **clear and consistent** в commit messages: wizard is the canonical first-time experience, tour is supplementary.

## What I can't verify from code alone

1. Whether profile row gets auto-created on auth.users INSERT (no `handle_new_user` trigger found в `supabase/migrations/` — could be:
   - Set up via Supabase Dashboard UI (не captured в repo)
   - Missing — profile created lazily on first update
   - Created в a migration with a non-obvious filename pattern
2. Whether [AGENT 3]'s test fixture writes `full_name` directly к profiles, bypassing the wizard intent
3. Whether the actual fresh-signup-from-email-confirm path is currently working (would need fresh email + email confirm clickthrough)

These three uncertainties are addressed в `INTENDED-BEHAVIOR-EVIDENCE.md`, `THREE-SCENARIOS.md`, and `RECOMMENDED-RESOLUTION.md`.
