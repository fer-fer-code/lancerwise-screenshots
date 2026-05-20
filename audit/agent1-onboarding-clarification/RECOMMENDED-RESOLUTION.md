# Onboarding — Recommended Resolution

## TL;DR

**Most likely Scenario A** (current implementation correct, AGENT 3 saw test-fixture artifact). Recommended actions:

1. **Verify live** — do one real signup-and-confirm-email flow к prove fresh users hit /onboarding
2. **If verified А** — document caveat в `BASELINE-METHODOLOGY.md`, no code change
3. **If NOT verified (Scenario B/C)** — file bug + investigate profile row creation

This is **a Ramiz product decision** к sign off on. My role is к gather evidence; final intent call belongs к product.

---

## Suggested action sequence

### Step 1 — Live signup smoke test (~15 min)

One real signup using a disposable email service (Mailinator, etc.) к verify:

```
1. Visit https://www.lancerwise.com/register
2. Fill form с throwaway email + name "QA Test"
3. Confirm Turnstile, submit
4. Open email confirmation link
5. Observe: do you land on /onboarding wizard or /dashboard?
```

If /onboarding: Scenario A confirmed. Done.
If /dashboard: Scenario B/C — investigate further.

This test creates ONE real user row, but uses a disposable email — minimal pollution. The user_metadata flag `qa-test: true` (если added to fixture) makes it greppable.

### Step 2 — Decision tree

**If signup lands /onboarding (Scenario A):**
- Document в `audit/agent3-launch-baselines/BASELINE-METHODOLOGY.md` под "Pre-conditions":
  > "Note: pre-conditioning `onboarding_completed_at` bypasses the normal first-run experience. Probe baseline measures the **non-fresh** /dashboard state. For first-run UX validation, exercise the live email-confirm flow separately."
- Close [AGENT 3] Flow G as "test fixture artifact, no regression"
- No code change

**If signup lands /dashboard (Scenario B):**
- File P1 bug: "Fresh signup skips /onboarding wizard — profile row creation gap"
- Investigate via Supabase Dashboard:
  - Auth → Triggers — is there a `handle_new_user` trigger?
  - Is profile row created at auth.users INSERT?
- Fix shape: add SQL trigger (or migration). Example:
  ```sql
  CREATE OR REPLACE FUNCTION handle_new_user()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
  END;
  $$;

  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
  ```
- After trigger lands, dashboard redirect gate fires correctly для fresh users
- Re-test live signup

**If signup lands /dashboard + profile row DOES exist with full_name set (Scenario C / variant):**
- The dashboard gate's `!profile.full_name` condition is failing because full_name IS being populated from user_metadata
- Product decision: is wizard supposed к still fire (collect MORE info: brand color, first client, first invoice) или is "name was good enough" the intent?
- If wizard should fire → change gate condition к use `!profile.onboarding_completed_at` alone (drop full_name check)
- If tour-on-dashboard is sufficient → retire `/onboarding` route, document Welcome Tour as canonical

---

## Discipline / scope limits

- **Don't fix /onboarding code today** — Ramiz needs к make the product call (A vs B vs C resolution)
- **Don't touch the wizard component** until decision made
- **Investigation evidence only** — I've laid out the code paths и uncertainty; Ramiz picks scenario

This matches the prior pattern with #90 FCP issue: investigate cleanly, file finding, await direction.

---

## What I'd recommend if forced к pick

**Scenario A с verification step.** Reasoning:

1. The code intent is documented и consistent
2. Test fixture artifacts are a known issue across performance probes (need pre-conditions к isolate variables)
3. The fix-recipe for Scenario B exists (add trigger) but adding a trigger pre-launch is risky (changes data shape for ALL signups, not gated)
4. Live verification takes 15 min vs Scenario B investigation taking ~2h

If verification proves Scenario A: zero code change, just document.
If verification proves Scenario B/C: file as separate post-launch issue (does not block launch — fresh users still GET a dashboard с Welcome Tour; just не the full 5-step wizard).

## Launch blocker assessment

**Not a launch blocker either way.**

- Scenario A: works as intended
- Scenario B: fresh users get /dashboard + Welcome Tour overlay = degraded but functional first-touch
- Scenario C: same — Welcome Tour covers minimum onboarding even if wizard skipped

The wizard collects useful data (brand color, first client, first invoice) but none of that is required к use the app. User can do those operations later from their respective pages.

## Filing recommendation

After Step 1 verification:
- Scenario A → close /Flow G PARTIAL/ as "no defect", document fixture caveat
- Scenario B → file "P2 post-launch: fresh-signup onboarding redirect gap" с this investigation as evidence
- Scenario C → file "P2 post-launch: product decision needed на /onboarding vs Welcome Tour scope"

P2, not P1, because real users still have a functional first-touch experience either way.

## Related

- CURRENT-BEHAVIOR.md
- INTENDED-BEHAVIOR-EVIDENCE.md
- THREE-SCENARIOS.md
- Vault: `Architecture/LANCERWISE-OVERVIEW.md`
