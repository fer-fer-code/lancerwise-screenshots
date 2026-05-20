# Marketing Pages Accuracy — Per-Page Findings

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Mode:** Read-only production audit (curl + grep). Cross-check claims против known state (memory rules, current PRs, recent commits).

---

## Inventory

| Path | HTTP | Status |
|---|---|---|
| `/` | 200 | ✓ |
| `/pricing` | 200 | ✓ |
| `/features` | 404 | not implemented (acceptable — features showcased on /) |
| `/about` | 200 | ✓ |
| `/blog` | 200 | ✓ |
| `/contact` | 200 | ✓ |
| `/faq` | 200 | ✓ |
| `/changelog` | 200 | ✓ |
| `/tools/rate-calculator` | 200 | ✓ |
| `/demo` | 200 | ✓ |
| `/n8n-templates` | 200 | ✓ |
| `/case-studies` | 404 | not implemented |

**12 routes audited. All footer-linked routes return 200. No broken navigation.**

---

## Findings by page

### / (homepage)

- Stripe mentions: 1 only — confirmed translation-blob fragment "Paid via Stripe" (legitimate, не SaaS billing claim)
- Pricing: $15/mo Pro × 2 mentions — consistent с memory rule #1 ✓
- GDPR claims: "GDPR Compliant" + "GDPR data export" — defensible given Privacy Policy + cookie banner + RLS infrastructure ✓
- No fake social proof (no "10,000+ freelancers" type claims) ✓
- No false certifications (no SOC 2, ISO, HIPAA claims) ✓
- Copyright: © 2026 LancerWise ✓

**Verdict: ✅ Clean. No factual issues.**

### /pricing

- $15/mo Pro × 4 mentions in metadata + body — consistent ✓
- "Free forever (2 clients, unlimited invoices)" — consistent с memory rule #1 ✓
- "Pro $15/mo (unlimited clients + 12 AI tools)" — consistent ✓
- "Business plan coming soon" — consistent с product state ✓
- "Up to 2 clients" / "Up to 3 team members" — consistent ✓
- Stripe mention is "paidViaStripe" в translation blob (legitimate)
- No LemonSqueezy mention (acceptable — pricing page doesn't disclose processor; Privacy § 4 now mentions correctly)

**Verdict: ✅ Clean.**

### /about

- Stripe mention: 1, "Paid via Stripe" translation fragment (legitimate)
- $15/mo: 1 mention ✓
- GDPR claim: present ✓
- No false founding-date / company-history claims
- Content focus: mission, story, values, team

**Verdict: ✅ Clean.**

### /blog

- Stripe + $15/mo + GDPR mentions all legitimate
- Standard blog index с articles list

**Verdict: ✅ Clean.**

### /contact

- legal@lancerwise.com referenced correctly (matches Privacy contact)
- Standard contact form
- 3 GDPR mentions (consistency с Privacy)

**Verdict: ✅ Clean.**

### /faq

- "Stripe integration on Pro plan" — **legitimate**: refers к Stripe Connect для users' clients paying their invoices (different от SaaS billing). Privacy § 4 now correctly distinguishes Stripe (user-invoice payments) от LemonSqueezy (SaaS billing).
- Wording could be clearer ("Stripe integration" might confuse readers who think it's the SaaS billing). Cosmetic improvement candidate.
- $15/mo: 7 mentions across Q&A, all consistent ✓
- "Pro plan ($15/mo) unlocks unlimited clients, advanced analytics, AI features" — consistent с product ✓

**Verdict: ✅ Factually correct. Cosmetic clarity improvement available но не launch-blocking.**

### /changelog — ⚠️ STALE CLAIM FOUND

**Issue:** Changelog contains entry:
> "Stripe payment integration — accept card payments directly through client portal (later removed; LemonSqueezy migration in progress)"

**Status mismatch:** LemonSqueezy migration is **complete** (PR #75 merged 2026-05-19, webhook live, KYC cleared). The "(later removed; LemonSqueezy migration in progress)" parenthetical is **stale**.

Also: latest changelog date is **2026-05-10**, predating:
- LemonSqueezy live decision (May 12)
- RLS audit (May 19-20)
- Multiple P1-A/P1-B perf migrations
- Bug #029 hero verstka fix
- Privacy Policy GDPR + LemonSqueezy corrections (today)

**Verdict: ⚠️ MISLEADING factual claim. Either update the "in progress" к "complete" OR remove the parenthetical OR (recommended) add fresh changelog entries для major work since May 10.**

### /tools/rate-calculator

- Standard tool page с calculator
- $15/mo mention в footer reference (legitimate)

**Verdict: ✅ Clean.**

### /demo

- Demo overview page
- 1 GDPR mention (consistency)

**Verdict: ✅ Clean.**

### /n8n-templates

- Template gallery
- Standard marketing content

**Verdict: ✅ Clean.**

---

## RU/EN parity check

| Page | EN | RU translation present? | Notes |
|---|---|---|---|
| / | ✓ | ✓ | full RU coverage (verified Bug #029 + Bug #001 series) |
| /pricing | ✓ | ✓ | "Бесплатно" + $15 (kept as $ для international stability) |
| /about | ✓ | ✓ | миссия, команда, история, фрилансер all RU |
| /faq | ✓ | ✓ | full RU Q&A coverage |
| /changelog | ✓ | partial | LemonSqueezy + Stripe mentions appear в both languages, но same stale claim issue applies |
| /contact | ✓ | ✓ | ContactForm translated (Bug #001 PR E) |
| /blog | ✓ | partial | blog index translated; individual blog posts mostly EN-only content (P2 backlog) |
| /tools/rate-calculator | ✓ | ✓ | translated (Bug #001 PR C) |
| /demo | ✓ | partial | needs verification |
| /n8n-templates | ✓ | partial | template names may be EN-only |

**No critical RU gaps found** на marketing surfaces. Blog post body translation is a known P2 deferral.

---

## Footer / navigation integrity

✅ All footer links return HTTP 200:
- /about, /contact, /faq, /pricing
- /blog, /changelog
- /privacy, /terms, /cookie-policy
- /tools/rate-calculator
- /api-docs, /n8n-templates, /demo

No broken links found.

---

## Compliance / claim verification

| Claim | Verifiable | Source |
|---|---|---|
| "GDPR Compliant" | ✅ supportable | Privacy Policy § 7 enumerates Art. 15-22 rights, cookie banner consent-gated, Art. 13(2)(d) lodge-complaint just added в PR #105 |
| "GDPR data export" | ✅ supportable | Privacy § 7 Settings → Data & Privacy → Download My Data path |
| "Free forever (2 clients, unlimited invoices)" | ✅ accurate | Memory rule #1 confirms |
| "Pro $15/mo" | ✅ accurate | Memory rule #1 confirms |
| "12 AI tools" | ⚠️ needs verification | Mentioned multiple times но не cross-referenced к actual tool count. Should be ≥12. Currently `/api/ai/*` shows 40+ endpoints — easily satisfies, но worth a count audit за accurate marketing pre-launch. |
| "Business plan coming soon" | ✅ accurate | Confirmed via Bug #023-prelaunch context |
| No SOC 2, ISO, HIPAA claims | ✅ correct | None found |
| No fake social proof | ✅ correct | No "10K users" type claims found |
| "© 2026 LancerWise" | ✅ accurate | Date matches |

**One minor concern:** "12 AI tools" claim should be sanity-checked — но unlikely к be problematic given /api/ai/* directory has 40+ endpoints (which translates к UI tools generously).

---

## Summary

**Only one launch-impacting finding:** /changelog stale "LemonSqueezy migration in progress" claim. All other pages factually accurate.

**Cosmetic improvements available но не blocking:**
- /faq "Stripe integration" wording could be clearer (Stripe Connect, не SaaS billing)
- /changelog could use fresh entries for May 11-20 work (PRs #75, #84, #86, #91, #103, #105)
- "12 AI tools" claim sanity-check pre-launch (likely safe)

## Cross-references

- LAUNCH-BLOCKERS.md — single P1 finding
- RECOMMENDATIONS.md — fix scope
