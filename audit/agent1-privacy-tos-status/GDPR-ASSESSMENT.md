# GDPR Compliance Assessment

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** Pre-launch readiness check against GDPR + general privacy compliance norms.
**Disclaimer:** Not legal advice. Findings should be reviewed by qualified legal counsel before launch.

---

## Compliance picture — what works

### ✅ Lawful basis для processing (Art. 6)
- Service contract = lawful basis for processing user data (Art. 6(1)(b))
- Analytics requires explicit consent (Art. 6(1)(a)) — gated correctly
- Privacy policy § 3 enumerates uses transparently

### ✅ Information к data subject (Art. 13, 14)
Privacy policy covers:
- Identity of controller (LancerWise)
- Contact details (legal@lancerwise.com)
- Purposes of processing
- Recipients / sub-processors (§ 4)
- Retention period (30 days post-deletion, § 6)
- Data subject rights (§ 7)
- Right to lodge complaint (implied via contact)

Required minimum information present. ✅

### ✅ Data subject rights (Art. 15-22)
Privacy § 7 enumerates:
- Access (Article 15) ✓
- Correct (Article 16) ✓
- Export / portability (Article 20) ✓ — specifically calls out `Settings → Data & Privacy → Download My Data`
- Delete / erasure (Article 17) ✓ — calls out manual deletion path + email request к legal@
- Object (Article 21) ✓ — unsubscribe links в emails

Rights enumeration clean. ✅

### ✅ Security of processing (Art. 32)
Privacy § 5 mentions:
- Encryption in transit (TLS)
- Encryption at rest (AES-256)
- Row-level security policies
- Security patch cadence

**However:** until ~2 hours ago, [#99](https://github.com/fer-fer-code/lancerwise/issues/99) (`invoices` table) и [#100](https://github.com/fer-fer-code/lancerwise/issues/100) (`proposal_drafts`) were active anon-readable. Both verified fixed по [AGENT 1]'s independent re-probe ([`agent1-rls-postfix-verify/`](../agent1-rls-postfix-verify/)). At launch, security claim в Privacy § 5 will be accurate. **But if shipped before #103 merge, claim would be false.**

### ✅ Cookie consent (Art. 7 + ePrivacy)
- Granular consent (currently single "analytics" toggle — acceptable for single GA4 stack)
- Pre-ticked = OFF (opt-in default)
- Equally prominent Accept / Reject paths (banner shows both buttons)
- Consent withdrawable via "Customize" link
- 6-month expiry — re-prompts
- No tracking-without-consent (curl confirmed zero tracking scripts on anon visit)

✅ Better than industry baseline.

### ✅ International data transfers (Art. 44-50)
Sub-processors listed: Supabase, Vercel, Resend, Stripe, Google Analytics. Most are US-based. Standard Contractual Clauses (SCCs) implicit via each vendor's DPA. Mentioned generically in Privacy § 4 ("Each sub-processor is bound by data processing agreements").

⚠️ Minor gap: SCCs not explicitly named. Industry-acceptable but worth noting in future revision.

---

## Compliance picture — gaps

### ❌ GAP 1: Russian users see English-only legal text

**Article 12 GDPR** requires information к data subject be provided:
> "in a concise, transparent, intelligible and easily accessible form, using clear and plain language, in particular for any information addressed specifically to a child."

LancerWise launches с Russian + English locales. Russian-locale user navigates через Russian-translated footer ("Политика конфиденциальности") → lands on **English-only** privacy/terms/cookie pages.

This is **technically a Art. 12 violation** — legal text is not "intelligible" к the data subject in their selected language.

**Mitigation magnitude:**
- Russian-speaking users могут be EU residents (e.g., Russian-speaking Estonia, Latvia, Lithuania, Germany diaspora)
- Or non-EU Russian-speaking (in which case GDPR doesn't apply directly но similar Russian PDP law (152-ФЗ) requires similar standards)
- Either way, the gap is real.

### ⚠️ GAP 2: Stale Stripe-as-SaaS-billing mention в Privacy § 4

Privacy lists:
> "Stripe — payment processing для Pro plan subscriptions and client invoice payments"

Actual state per [Decisions/2026-05-12-LEMONSQUEEZY-OVER-STRIPE](../../lancerwise-knowledge/Decisions/2026-05-12-LEMONSQUEEZY-OVER-STRIPE):
- **LemonSqueezy** is the SaaS billing platform (Pro subscriptions)
- Stripe is for users' clients paying их invoices (different path)

So Privacy misstates the SaaS billing processor. False / outdated information in legal document. **Material accuracy gap.**

Add **LemonSqueezy** к sub-processor list explicitly, scope Stripe к "invoice payments only".

### ⚠️ GAP 3: Privacy/Terms last updated April 26 — pre-LemonSqueezy migration

April 26 is before:
- LemonSqueezy live (May 12-19)
- RLS audit findings (#99, #100 — May 20)
- Multiple architecture changes

The "Last updated" line is misleading к the most-recent state. Should be refreshed simultaneously с LemonSqueezy edit (Gap 2 fix).

### ⚠️ GAP 4: No DPA template available

Many B2B users (especially in EU) request signed Data Processing Agreement before signing up. LancerWise doesn't publish a DPA template.

Not a Art. 28 violation in itself (the controller-processor relationship is between sub-processors AND LancerWise — LancerWise IS the controller для its users). But it's a **commercial blocker** for some B2B prospects.

Industry norm: publish a DPA template at `/dpa` или `/legal/dpa` linkable from Terms. Post-launch is acceptable.

### ⚠️ GAP 5: Single "analytics" consent category, not granular per-vendor

GDPR doesn't strictly require granular per-vendor consent, but European data protection authorities increasingly expect it. Current state: single "analytics" toggle controls Google Analytics 4 only — fine **as long as** no other tracking vendors are added.

If LancerWise adds Hotjar, Mixpanel, Facebook Pixel later, consent banner needs to grow к per-vendor categories.

Not pre-launch blocking.

### ⚠️ GAP 6: Right к lodge complaint with supervisory authority not explicitly stated

GDPR Art. 13(2)(d) requires the controller к inform users of "the right to lodge a complaint with a supervisory authority." Privacy policy doesn't have a dedicated section.

Adding 1-2 sentences к Privacy § 7 (Your Rights):
> "You have the right к lodge a complaint with your local data protection supervisory authority if you believe we are not handling your data lawfully."

Trivial addition. Pre-launch recommended.

---

## Risk-weighted summary

| Gap | GDPR Severity | Likelihood of complaint | Pre-launch action |
|---|---|---|---|
| 1. RU users see EN legal text | High (Art. 12) | Medium | **Fix recommended** — translate or post-launch within 30 days с user-visible notice |
| 2. Stale Stripe billing mention | Medium (factual accuracy) | Low | **Fix before launch** — 5 min edit |
| 3. Last-updated date stale | Low (transparency) | Low | Fix alongside #2 |
| 4. No DPA template | Commercial blocker | B2B-specific | Post-launch acceptable |
| 5. Single analytics category | Low (current stack OK) | Low | Re-assess if vendors added |
| 6. Right к complain not stated | Low (informational) | Low | **Fix before launch** — 2 sentence addition |

---

## Mitigations already в place

- **Cookie banner conservative-by-default** (shows для everyone, no geo cheating)
- **Zero tracking без consent** (verified via curl — confirmed clean)
- **Privacy contact** legal@lancerwise.com prominent
- **GDPR rights** explicitly enumerated
- **Sub-processor disclosure** present (just needs accuracy refresh)

---

## Cross-references

- CURRENT-STATE.md — what exists
- LAUNCH-BLOCKER-DETERMINATION.md — yes/no
- RECOMMENDATIONS.md — specific action items
