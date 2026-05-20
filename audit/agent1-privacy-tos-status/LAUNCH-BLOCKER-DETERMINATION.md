# Launch Blocker Determination — Privacy / ToS

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Subject:** Is D4 (Privacy / Terms / Cookie compliance) a launch blocker?

---

## TL;DR

**Two items are launch blockers. Two are recommended pre-launch fixes. Two are post-launch acceptable.**

| Item | Decision | Reason |
|---|---|---|
| Stale Stripe-as-SaaS-billing mention в Privacy § 4 | **🚨 BLOCKER** | Factually false statement in legal document. Material misrepresentation. ~5 min to fix. |
| Right to lodge complaint statement (Privacy § 7) | **🚨 BLOCKER** | Art. 13(2)(d) explicit requirement. 2-sentence addition. |
| Russian translation of legal pages | **⚠️ Recommended** | Art. 12 violation. Mitigation possible с notice + 30-day commitment. |
| "Last updated" date refresh | **⚠️ Recommended** | Transparency. Fix alongside § 4 edit. |
| DPA template | **✅ Post-launch acceptable** | Commercial-only; B2B-specific. |
| Granular consent categories | **✅ Post-launch acceptable** | Only relevant if more tracking vendors added. |

---

## Detailed reasoning per item

### 🚨 Item 1 — Privacy § 4 stale Stripe-as-SaaS-billing

**Severity:** BLOCKER

**Current text (paraphrased):**
> "Stripe — payment processing для Pro plan subscriptions and client invoice payments"

**Actual state:** LemonSqueezy is the SaaS billing processor for Pro subscriptions. Stripe is only the rail for users' clients paying their invoices.

**Why blocker:**
- Privacy policy is а **binding legal document**. Statements about who handles user data must be accurate. Naming Stripe but actually using LemonSqueezy is misleading.
- Hidden cost: при GDPR data subject access request, user might ask "what data does Stripe have about me?" Answer: "actually, the data is at LemonSqueezy." Material mismatch.
- При regulatory scrutiny (data protection authority complaint), accuracy of sub-processor list is checked first.

**Fix:**
1. Edit § 4 к add **LemonSqueezy** entry: "LemonSqueezy — Merchant of Record + payment processing for Pro plan subscriptions. Stripe handles card payments к users' invoices (sent by freelancer to their client)."
2. Update "Last updated" date к match.

Effort: ~5 minutes.

### 🚨 Item 2 — Right к lodge complaint missing

**Severity:** BLOCKER

**Why:** GDPR Art. 13(2)(d) explicitly requires informing users of "the right к lodge а complaint with a supervisory authority." This is not in current Privacy § 7.

**Fix:** Add к Privacy § 7 (Your Rights):

> "Right to complain: You have the right к lodge a complaint with your local data protection supervisory authority if you believe we are not handling your data в accordance with applicable law. For EU/EEA residents, contact your national Data Protection Authority. For Russian residents, contact Roskomnadzor."

Effort: ~2 minutes.

### ⚠️ Item 3 — Russian translation of legal pages

**Severity:** RECOMMENDED PRE-LAUNCH (per GDPR Art. 12 strict reading)
**Severity:** ACCEPTABLE с MITIGATION (per common industry practice)

**Why this is the hardest call:**

Strict GDPR reading: Art. 12 requires legal text be "intelligible" к the data subject. Russian-locale user receiving English-only legal text is technically не "intelligible." That's the GDPR ideal.

Industry practice for early-stage SaaS:
- Many SaaS launch с English-only legal documents and translate later (within 60-90 days)
- Acceptable if: (a) user can easily contact for clarification, (b) language is "plain English" not legalese, (c) commitment к translation is documented

LancerWise's privacy is plain-English (954 words, не obfuscated), legal@lancerwise.com responds к queries, и this gap is identified pre-launch. Mitigation path is clear.

**Two scenarios:**

**Scenario A — Launch с English legal pages + mitigation:**
- Add notice on Russian-locale page header: "Этот документ доступен только на английском языке. Свяжитесь с legal@lancerwise.com для уточнений."
- Commit к Russian translation within 30 days post-launch
- File P2 issue после launch к track
- **Acceptable approach** для early-stage launch

**Scenario B — Block launch until translated:**
- Estimated effort: ~3-4h focused translation work (3 pages × ~900 words each)
- Best for risk-averse compliance posture
- Delays launch by half a day

**[AGENT 1] recommendation:** Scenario A (launch с mitigation), file as P1 post-launch к translate within 30 days. Document the mitigation в next privacy version.

### ⚠️ Item 4 — "Last updated" date refresh

**Severity:** RECOMMENDED

Date is April 26, 2026. Material changes since:
- LemonSqueezy live (May 12-19)
- RLS fixes (May 20)
- Architecture decisions

Updating к match current state is honest. Fix alongside item 1.

Effort: 30 seconds.

### ✅ Item 5 — DPA template

**Severity:** POST-LAUNCH ACCEPTABLE

B2B-only concern. LancerWise targets individual freelancers. Enterprise/agency clients може ask, but не common for early launch. File as P2 post-launch backlog. Industry norm: 1-2 weeks к provide on request.

### ✅ Item 6 — Granular consent categories

**Severity:** POST-LAUNCH ACCEPTABLE

Single "analytics" boolean covers current stack (GA4 only). If Hotjar/Mixpanel/Facebook Pixel added later, refactor consent banner.

---

## Bundled fix scope

If items 1+2+4 are bundled into a single Privacy/Terms edit:

| Item | Effort |
|---|---|
| Privacy § 4 LemonSqueezy correction | 5 min |
| Privacy § 7 right-к-complain addition | 2 min |
| Privacy + Terms "Last updated" date bump | 30 sec |
| Optional: notice banner на RU legal pages | 10 min |
| **Total bundled effort** | **~20 min** |

Single small PR. Can ship immediately. **Strongly recommended before launch.**

---

## Final determination

**D4 IS partially a launch blocker:**
- Items 1+2 = ~7 minutes к fix. **Block launch until fixed.**
- Item 3 = Scenario A acceptable с mitigation. **Не a launch blocker.**
- Items 4-6 = post-launch acceptable.

**Total launch-blocking fix scope: ~7 minutes.**

This is not а ~3-4h Privacy/ToS rewrite — it's two minimal edits to make existing text accurate + GDPR-Art.13-complete.

Russian translation is а separate track, recommended post-launch with mitigation notice on the EN pages для Russian-locale users.

---

## Cross-references

- CURRENT-STATE.md — what exists today
- GDPR-ASSESSMENT.md — full compliance picture
- RECOMMENDATIONS.md — exact text edits suggested
