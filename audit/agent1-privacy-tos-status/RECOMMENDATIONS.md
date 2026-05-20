# Recommendations — Privacy / ToS

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** Specific action items для Ramiz decision. Не self-executable per task discipline (read-only investigation; do не create Privacy/ToS content).

---

## Pre-launch — required (~7 minutes total)

### Action 1 — Privacy § 4 LemonSqueezy correction

**Why:** Stale Stripe-as-SaaS-billing reference is factually false. Material legal-doc inaccuracy.

**Suggested edit** to `src/app/privacy/page.tsx` around the "Third-Party Services" section:

```diff
- <li><strong>Stripe</strong> — payment processing for Pro plan subscriptions and client invoice payments (Pro plan only). Stripe handles card data directly; LancerWise never stores card numbers.</li>
+ <li><strong>LemonSqueezy</strong> — Merchant of Record + payment processing for Pro plan subscriptions. LemonSqueezy handles billing, tax, and refunds directly; LancerWise receives only customer email and subscription status.</li>
+ <li><strong>Stripe</strong> — payment processing for client invoices (when your client pays you via online card). Stripe handles card data directly; LancerWise never stores card numbers.</li>
```

Effort: ~5 minutes.

### Action 2 — Privacy § 7 right-к-lodge-complaint

**Why:** GDPR Art. 13(2)(d) explicit requirement. Currently missing.

**Suggested addition** к Privacy § 7 (Your Rights) — append last bullet:

```diff
  <li><strong>Object</strong> to processing for direct marketing (unsubscribe link in every email).</li>
+ <li><strong>Lodge a complaint</strong> with your local data protection supervisory authority if you believe we are not handling your data в accordance with applicable law. For EU/EEA residents, contact your national Data Protection Authority. For Russian residents, contact Roskomnadzor.</li>
```

Effort: ~2 minutes.

### Action 3 — "Last updated" date bump

**Why:** Material changes since April 26. Bump к match current state.

Edit both `src/app/privacy/page.tsx` AND `src/app/terms/page.tsx`:

```diff
- <p className="text-sm text-slate-500">Last updated: April 26, 2026</p>
+ <p className="text-sm text-slate-500">Last updated: May 20, 2026</p>
```

Effort: 30 seconds.

---

## Pre-launch — recommended (separate fix bundle, optional)

### Action 4 — Russian-locale notice banner on legal pages

**Why:** Russian users seeing English-only legal text technically violates Art. 12. Notice banner mitigates while preserving launch timeline.

**Suggested addition** к top of `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, `src/app/cookie-policy/page.tsx`:

```tsx
// near top, conditionally render для RU locale
import { getUserLocale } from '@/lib/i18n/server-locale'

const locale = await getUserLocale()

{locale === 'ru' && (
  <div className="bg-violet-900/30 border border-violet-700/30 rounded-xl p-4 mb-6 text-sm text-slate-200">
    Этот документ временно доступен только на английском языке. Полный русский перевод появится в течение 30 дней. Если у вас есть вопросы или вы хотите получить документ на русском уже сейчас — напишите на <a href="mailto:legal@lancerwise.com" className="text-violet-400 underline">legal@lancerwise.com</a>.
  </div>
)}
```

Effort: ~10 minutes per page × 3 pages = ~30 min total.

Provides documented mitigation for the Art. 12 concern. Commits к 30-day translation timeline.

---

## Post-launch — tracked separately

### Action 5 — Full RU translation of legal pages

**Why:** Permanent fix for Art. 12. Should land within 30 days of public launch per Action 4 commitment.

**Approach:**
1. Translate 3 pages (~2640 words total) к Russian. Estimated by professional translator: ~2-3 hours.
2. Wire `useTranslations()` / `getTranslations()` к pull from `messages/en.json` + `messages/ru.json`.
3. Refactor pages к match existing Bug #023 pattern (hardcoded strings → `t('privacy.X')` etc.).
4. Update or remove Action 4 notice banner.

Effort: ~3-4 hours focused work + legal review of RU translation.

File as P1 post-launch issue.

### Action 6 — DPA template

**Why:** B2B prospects may request. Industry norm.

**Approach:**
- Create `/dpa` или `/legal/dpa` page с template DPA
- Standard Mutual Sub-Processor agreement template
- Linkable от Terms of Service

Effort: ~2-4 hours including legal review.

File as P2 post-launch.

### Action 7 — Per-vendor cookie consent categories

**Why:** Only relevant if more tracking vendors added.

**Trigger condition:** any new tracking SDK added (Hotjar, Mixpanel, Facebook Pixel, etc.). Refactor consent banner к expose per-vendor toggles.

Pre-requisite: документировать в product memo "we don't add tracking без updating consent categories."

Effort: ~2 hours when triggered.

File as P3 placeholder.

---

## Summary suggested filing

After Ramiz approves:

| Action | When | Track as |
|---|---|---|
| 1+2+3 (legal text edits) | **Pre-launch** | Single PR, ~7 min. |
| 4 (RU notice banner) | Pre-launch если time, else within 7d post-launch | Single PR, ~30 min. |
| 5 (full RU translation) | Within 30 days post-launch | P1 issue, file pre-launch. |
| 6 (DPA template) | Post-launch | P2 issue. |
| 7 (per-vendor consent) | Triggered | P3 placeholder. |

---

## DISCIPLINE adhered

Per task spec:
- ✅ READ-ONLY investigation
- ✅ Did NOT create Privacy/ToS content myself
- ✅ Did NOT install cookie banner (already exists)
- ✅ Findings only, action items for Ramiz decision

Ramiz decision required для:
1. Approve Actions 1-3 для pre-launch PR
2. Decide Action 4 timing (pre-launch vs first week post)
3. Approve Action 5 post-launch commitment
4. Set timing for Actions 6-7

---

## Cross-references

- CURRENT-STATE.md
- GDPR-ASSESSMENT.md
- LAUNCH-BLOCKER-DETERMINATION.md
