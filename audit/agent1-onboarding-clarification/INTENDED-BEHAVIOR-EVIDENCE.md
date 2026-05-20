# Onboarding — Intended Behaviour Evidence

Code history clues showing what was originally intended versus what's currently observable.

## Primary commit evidence

### `6c0ba226` (2026-04-29) — Ramiz

> **feat: auto-redirect new users to onboarding wizard + mark completion in DB**
>
> - Dashboard now checks profiles.full_name + onboarding_completed_at и redirects к /onboarding if both are empty (first-time login)
> - handleFinish() in OnboardingWizard now updates onboarding_completed_at в Supabase so the redirect doesn't fire on subsequent logins
> - **Register already redirects to /onboarding after sign-up (no change needed)**

This is **the** clearest statement of intent. Ramiz wanted:
- /onboarding = canonical first-time experience
- Dashboard = home for completed users
- The redirect is **defensive** — even если user navigates direct к /dashboard, server-side check sends them к /onboarding

### `257aab36` (2026-04-26) — Ramiz

> **feat: 5-step onboarding wizard with profile, branding, client, invoice, and explore steps**
>
> - New /onboarding route с guided 5-step wizard (profile, branding, client, invoice, explore)
> - Step 1: profile (full name, company, hourly rate, country) saved via Supabase client
> - Step 5: celebration с feature grid AND **dashboard redirect**

Workflow intent: `/register → confirm email → /onboarding wizard → /dashboard (post-celebration)`.

### `6bf50290` — Ramiz

> **Task C: onboarding polish — welcome tour + PostHog setup tracking**

Welcome Tour is an **add-on** к wizard, не a replacement. The PR title says "polish" — confirms tour is supplementary UX.

### `4387c156` (2026-05-19) — Bug #023 Z5 i18n

> **i18n(z5): translate onboarding wizard (all 5 steps + nav) (#67)**

Active i18n work on /onboarding wizard ~9 days before launch confirms wizard is still considered the canonical route for new users — otherwise no reason to translate it.

## Code-level intent signals

### Register form has `full_name` field

```tsx
options: {
  data: {
    full_name: fullName,  // user-provided at signup time
    ...
  }
}
```

If wizard were the only place к set name, register form wouldn't ask. The user_metadata.full_name is **redundant** к profile.full_name unless there's an auto-copy mechanism. This redundancy hints at design tension: either (a) wizard should be skipped if full_name already collected, or (b) full_name field в register is vestigial.

### Dashboard redirect uses BOTH checks

```tsx
if (profile && !profile.full_name && !profile.onboarding_completed_at) {
  redirect('/onboarding')
}
```

Two checks because:
- `!profile.full_name` — catches fresh users
- `!profile.onboarding_completed_at` — catches users who skipped wizard but later set name some other way

Both checks needed because path through email confirm sets user_metadata.full_name but не profile.full_name (no observed trigger). So a profile row WITH name set + onboarding_completed_at null would happen if user did wizard step 1 (which writes к profile.full_name) but bailed before step 5 (which writes onboarding_completed_at).

The compound check `!a && !b` means **wizard skipped at any post-step-1 point still completes onboarding for the redirect's purposes**. That's reasonable UX.

### Wizard `markStepComplete('explore')` persists к localStorage

The wizard has BOTH localStorage AND DB tracking:
```ts
localStorage.setItem('lw_onboarding_v2', JSON.stringify(progress))
// AND
await supabase.from('profiles').update({ onboarding_completed_at: new Date().toISOString() })
```

Defensive — if DB write fails (offline, RLS issue), localStorage still notes user saw wizard. Subsequent dashboard hits с the localStorage flag will use OnboardingBanner's auto-hide.

## What the i18n series confirms

Bug #023 Z5 (PR #67, merged 2026-05-19) translated the entire `/onboarding` wizard к Russian. ~270 i18n violations eliminated. Active investment в this route as recently as 1 day pre-launch confirms it's not dead code.

If `/onboarding` were legacy/dead, that work wouldn't have happened.

## Test fixture difference (suspected AGENT 3 issue)

I don't have access к AGENT 3's `auth-flows.ts` fixture file (likely в `/tmp/baseline_probe.js` or similar, not committed к the screenshots repo). But based on baseline methodology doc:

> Pre-conditions для valid baseline:
> - Test user exists с `onboarding_completed_at` set (else probe gets stuck on tour)
> - Test user has ZERO CRM data

**The first bullet is the smoking gun.** AGENT 3 explicitly required `onboarding_completed_at` set on the test user before probing. This is a probe-correctness requirement (otherwise routes would redirect away from the measured page), не a statement of intended user behaviour.

When [AGENT 3]'s Flow G review noted "fresh user lands /dashboard not /onboarding," that was likely observing the probe's pre-conditioned state, не a fresh user's actual journey.

## Scenarios derived from evidence

Three scenarios laid out в [[THREE-SCENARIOS]]. Code evidence strongly favors Scenario A (intent is /onboarding, current behaviour for real users matches intent, test fixture artifacts don't).

## Related

- CURRENT-BEHAVIOR.md
- THREE-SCENARIOS.md
- RECOMMENDED-RESOLUTION.md
