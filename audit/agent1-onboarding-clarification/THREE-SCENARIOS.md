# Onboarding — Three Scenarios

[AGENT 3] flagged: "Flow G (onboarding) PARTIAL — fresh user lands на /dashboard напрямую, не /onboarding. Needs product clarification (tour-on-dashboard intent vs URL redirect intent)."

Three product intent scenarios derived from code + commit history. Evidence-weighted ranking below.

---

## Scenario A — INTENT IS /onboarding wizard (current implementation correct)

**Story:** Wizard is the canonical first-touch. AGENT 3's observation is a test-fixture artifact, not a regression.

**Evidence for:**
- Commit `6c0ba226` explicitly: "auto-redirect new users to onboarding wizard"
- Commit `257aab36`: built the full 5-step wizard as "the" onboarding experience
- Register page sets `emailRedirectTo: ?next=/onboarding`
- Auth callback honours `next` param
- Dashboard server-side redirect к /onboarding when profile gates trigger
- Bug #023 Z5 (PR #67) actively translated wizard к Russian 1 day pre-launch — wouldn't happen on dead code
- AGENT 3 baseline methodology requires test users have `onboarding_completed_at` SET — that's a probe pre-condition, не a fresh-user state observation

**Evidence against:** None observed in code/history.

**Implication:**
- AGENT 3's observation reflects test fixture, not real user flow
- Real fresh users (real signup → real email confirm clickthrough) DO see /onboarding
- No code change needed; може быть worth adding a comment к BASELINE-METHODOLOGY.md clarifying that the pre-condition bypasses real onboarding flow

**Action if Scenario A:** None. Document caveat в audit methodology. Re-test fresh signup live к verify.

---

## Scenario B — INTENT IS /onboarding redirect, but BROKEN

**Story:** Wizard was the intent, но something в the chain broke. Real users currently land /dashboard напрямую.

**Evidence for:**
- No `handle_new_user` trigger found в `supabase/migrations/` — if profile row doesn't get created until first explicit update, the dashboard redirect gate is неэффективен (`if (profile && ...)` short-circuits)
- Auth callback only redirects к `/onboarding` if `next` param is set — magic-link login, OAuth login, или any path that doesn't preserve `next` would default к `/dashboard`
- Email confirm link с `next=/onboarding` works only on email-password signup. Other signup methods would skip onboarding silently.

**Evidence against:**
- Code paths intended for fresh signup DO route к /onboarding
- The redirect gate exists и uses `maybeSingle()` (так что null profile correctly falls through)
- Welcome Tour is described as "polish" supplementary, не replacement

**Implication if confirmed:**
- Fresh users в production are landing /dashboard skipping wizard
- They see Welcome Tour overlay but не full wizard
- Data they would have entered (name, brand colour, first client, first invoice) becomes manual setup later, increasing friction

**Action if Scenario B:**
1. Verify profile row creation mechanism (migration, trigger, или first-write?)
2. If trigger missing → add `handle_new_user` trigger that creates blank profile row at auth.users INSERT
3. After fix, dashboard redirect gate fires correctly для users that bypass `?next=/onboarding` path
4. Re-test fresh signup от scratch

---

## Scenario C — HYBRID / EVOLVED

**Story:** /onboarding wizard was first design, Welcome Tour added later (per `6bf50290` "polish"). Product evolved toward "all signup → /dashboard с tour overlay" but /onboarding wasn't removed because it works для users who hit it explicitly via email confirm.

**Evidence for:**
- Both mechanisms exist в production
- /onboarding has rich 5-step wizard (does more than tour)
- Welcome Tour shows on /dashboard for every user until localStorage flag set
- Commit history shows tour was added AFTER wizard ("polish")

**Evidence against:**
- No commit explicitly removes /onboarding route or its redirect gate
- Bug #023 Z5 i18n investment confirms /onboarding is still active

**Implication:**
- Wizard path = email-confirm signup users (canonical)
- Tour path = login users, magic-link users, social-auth-в-future users
- Coexistence is intentional, не drift
- But the dual paths create QA confusion (which one is "the" onboarding?)

**Action if Scenario C:**
- Document clearly: wizard = first-touch from email-confirm signup. Tour = supplementary для everyone.
- Standardize: either retire wizard к dashboard-with-tour (simpler) или make wizard fire for ALL fresh users regardless of auth path (more complete).
- Product decision required — Ramiz call.

---

## Likelihood ranking

| Scenario | Likelihood | Rationale |
|---|---|---|
| **A** (intent correct, test artifact) | **★★★★☆ Most likely** | Strong code evidence + clear commit intent. AGENT 3's specific finding has plausible test-fixture explanation. |
| C (hybrid evolved) | ★★★ Possible | Welcome Tour DOES exist alongside wizard. But intent commits don't acknowledge evolution. |
| B (broken implementation) | ★★ Plausible but unconfirmed | Hinges on whether profile row gets auto-created. Cannot verify без DB inspection. |

## What's needed to disambiguate

The decision tree:

```
Q1: Does a fresh email-confirm signup actually hit /onboarding wizard в production?
├── YES → Scenario A confirmed. AGENT 3 saw fixture state. No code change.
└── NO  → Q2: Does profile row exist immediately after auth.users INSERT?
          ├── YES (e.g. via Supabase Dashboard-configured trigger) →
          │       The dashboard redirect logic has a bug (full_name is set from user_metadata?).
          │       Investigate gate condition. Scenario B variant.
          └── NO → Profile row missing → gate short-circuits. Add trigger. Scenario B.
```

Answering Q1 requires a real signup flow с email confirmation. Cannot do from code alone (testing on production would create a real user row + send a real email).

Answering Q2 requires SQL access к auth schema. Sample:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.triggers
  WHERE event_object_schema = 'auth' AND event_object_table = 'users'
);
```

## Related

- CURRENT-BEHAVIOR.md
- INTENDED-BEHAVIOR-EVIDENCE.md
- RECOMMENDED-RESOLUTION.md
