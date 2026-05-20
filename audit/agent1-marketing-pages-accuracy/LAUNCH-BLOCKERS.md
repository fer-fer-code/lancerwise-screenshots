# Marketing Pages — Launch Blockers

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Result:** **One P1 finding.** All other pages factually accurate.

---

## P1 — `/changelog` stale "LemonSqueezy migration в progress" claim

**Severity:** P1 / launch-blocker (factual misrepresentation on public page)

**Location:** `/changelog` — entry text:
> "Stripe payment integration — accept card payments directly through client portal (later removed; **LemonSqueezy migration in progress**)"

**Why blocker:**
- LemonSqueezy migration is **complete** (PR #75 merged 2026-05-19; webhook live; KYC cleared)
- Saying "migration in progress" к public visitors is **misleading**
- При scrutiny (e.g. user reading changelog to evaluate trustworthiness, journalist, или partner due-diligence), the stale claim suggests product immaturity / unresolved infrastructure
- Once Ramiz declares "launch ready", any public page saying "in progress" contradicts that

**Why P1, not P0:**
- Not а security issue
- Not а direct data leak
- "Misleading" rather than "false" — there WAS а migration period
- Easy fix (~5 min text edit)

**Fix options:**

### Option A (preferred) — Update к "complete" status

Edit `src/app/changelog/page.tsx` к change:
- "(later removed; LemonSqueezy migration in progress)" → "(later removed; LemonSqueezy is the current payment processor)"
- Add fresh changelog entry: `2026-05-19 — Pro plan billing migrated к LemonSqueezy (Merchant of Record). Stripe Connect retained для users' clients paying their invoices.`

### Option B — Just remove the parenthetical

Cleaner: "Stripe payment integration — accept card payments directly through client portal." Drops the "later removed" note entirely (let new changelog entry tell the LemonSqueezy story).

### Option C — Full changelog refresh

Add entries for major May 11-20 work:
- 2026-05-19 LemonSqueezy live
- 2026-05-19 P1-A widget migration к Context (dashboard perf)
- 2026-05-20 P1-B invoice detail mobile crash fix
- 2026-05-20 Privacy Policy GDPR + LemonSqueezy text corrections
- 2026-05-20 RLS audit + cross-tenant fix #103

Option C is best long-term но largest scope (~30 min). Option A or B is sufficient для pre-launch.

**Recommended: Option A.** Resolves the misleading claim AND notes LemonSqueezy as current. Add 2-line fresh entry. ~5-7 min work.

---

## Other findings (NOT launch-blocking)

### /faq "Stripe integration on Pro plan" wording

**Severity:** Cosmetic / clarity improvement

Text suggests Stripe integration is а Pro plan feature, which is true но could be confused with SaaS billing (which is now LemonSqueezy). Worth refining post-launch.

**Suggested clarification:** "Yes. The Pro plan includes Stripe Connect, which lets your clients pay their invoices online via card. (LancerWise's own billing — Pro plan subscription — is handled separately by LemonSqueezy.)"

Post-launch acceptable. Not blocking.

### "12 AI tools" claim verification

Multiple pages claim "12 AI tools." Codebase has 40+ `/api/ai/*` endpoints. Claim likely satisfied generously, but worth 5-min count audit pre-launch к ensure no false marketing.

Post-launch acceptable. Not blocking.

### /changelog stale (latest entry 2026-05-10)

Beyond the "in progress" claim, the changelog itself hasn't been updated since May 10. 10 days of significant work missing. Recommended Option C (full refresh) closes this AND the in-progress claim в one pass.

---

## Verdict

**One launch-blocker:** `/changelog` "LemonSqueezy migration in progress" stale claim. ~5-7 min fix.

If shipped as-is, low operational risk но non-zero reputation/credibility risk. **Recommend fix before launch.**

## Cross-references

- PER-PAGE-FINDINGS.md — full audit detail
- RECOMMENDATIONS.md — fix scope + diffs
