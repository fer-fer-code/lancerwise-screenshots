# Privacy / ToS / Cookie — Current State

**Investigator:** [AGENT 1]
**Date:** 2026-05-20
**Mode:** Read-only investigation. Production curl + code inspection.

---

## Production page existence

| Path | HTTP | Body size | Status |
|---|---|---|---|
| `/privacy` | 200 | 128,931 bytes | ✅ Live |
| `/terms` | 200 | 125,715 bytes | ✅ Live |
| `/cookie-policy` | 200 | 112,736 bytes | ✅ Live |
| `/privacy-policy` | 404 | — | Not used (correct — `/privacy` is canonical) |
| `/tos` | 404 | — | Not used |
| `/legal` | 404 | — | No combined legal hub |
| `/cookies` | 404 | — | Not used |

**All 3 legal pages are deployed и accessible.**

---

## Content quality

### `/privacy/page.tsx`
- **954 words**, hardcoded English
- 9 sections:
  1. Introduction
  2. Data We Collect
  3. How We Use Your Data
  4. Third-Party Services
  5. Data Security
  6. Data Retention
  7. Your Rights (GDPR)
  8. Cookies
  9. Contact
- Sub-processors disclosed: **Supabase, Vercel, Resend, Stripe, Google Analytics**
- GDPR rights enumerated (Access, Correct, Export, Delete, Object)
- Contact: `legal@lancerwise.com` (5 mentions)
- Last updated: **April 26, 2026** (~3 weeks ago at time of audit)

### `/terms/page.tsx`
- **892 words**, hardcoded English
- 10 sections:
  1. Acceptance of Terms
  2. Description of Service
  3. Free and Paid Plans
  4. Account Responsibilities
  5. Prohibited Uses
  6. Intellectual Property
  7. Limitation of Liability
  8. Termination
  9. Governing Law (Khanh Hoa Province, Vietnam)
  10. Contact
- 30-day money-back guarantee disclosed
- Contact: `legal@lancerwise.com` (3 mentions across templates)
- Last updated: **April 26, 2026**

### `/cookie-policy/page.tsx`
- **792 words**, hardcoded English
- Covers: Essential cookies, Analytics cookies, consent mechanism

---

## Translation status — i18n

**All 3 legal pages: hardcoded English. ZERO `t()` translation calls.**

```
src/app/privacy/page.tsx       : 0 t() calls
src/app/terms/page.tsx         : 0 t() calls
src/app/cookie-policy/page.tsx : 0 t() calls
```

Russian user navigating ru-locale homepage:
1. Footer link → "Политика конфиденциальности" (translated link label ✓)
2. Click → Lands on `/privacy` (correct URL ✓)
3. Page renders **in English** ❌

This is the headline gap.

**Note:** Bug #024 (resolved 2026-05-19) migrated /privacy + /terms from light → dark theme + shared MarketingNavbar/Footer chrome. Content translation was explicitly out-of-scope; Bug #024 scope was theme-only.

---

## Footer links

`MarketingFooter.tsx` references все 3 pages:
```tsx
<li><a href="/privacy">{t('marketingFooter.links.privacyPolicy')}</a></li>
<li><a href="/terms">{t('marketingFooter.links.termsOfService')}</a></li>
<li><Link href="/cookie-policy">{t('marketingFooter.links.cookiePolicy')}</Link></li>
```

Labels translated. URLs work. Discovery path: footer → 1 click к legal text.

---

## Cookie consent banner

### Implementation
- Component: `src/components/analytics/CookieConsent.tsx` (249 LOC)
- Wrapper: `src/components/analytics/AnalyticsProvider.tsx`
- Storage: `localStorage['cc_consent']` с 6-month expiry
- Banner namespace: `cookieBanner.*` в messages — **21 translation calls** (fully i18n'd EN + RU)

### Behaviour
- Shows when `consent === null` (no decision yet)
- Three actions: **Accept All**, **Reject All**, **Customize**
- Customize toggles single `analytics` boolean (currently single category)
- Decision persisted к localStorage
- 6-month expiry → re-prompt
- "Cookie policy" link inside banner → /cookie-policy

### Geo handling
**No geo-detection.** Banner shows for ALL visitors (EU + non-EU + RU). Conservative GDPR-safe approach.

### Consent gating
`AnalyticsProvider.tsx` checks `consent?.analytics === true` before rendering `<GoogleAnalytics>`. Confirmed via curl: **homepage HTML contains zero tracking scripts on initial visit**:
- No `gtag` references
- No `googletagmanager` script tags
- No `posthog` initialization
- No `fbq`, `hotjar`, `mixpanel`, или other tracking

✅ Confirmed: nothing tracks until user opts in.

---

## Cookies set on initial visit

```bash
curl -sI https://www.lancerwise.com/ | grep -i set-cookie
# (no output — zero cookies set on anon homepage visit)
```

Server-side does NOT drop session, tracking, or analytics cookies before consent. Confirmed clean default state.

---

## Sub-processor disclosure

Privacy policy § 4 lists:
- **Supabase** — database + auth (PostgreSQL with row-level security)
- **Vercel** — application hosting + edge delivery
- **Stripe** — payment processing (Pro plan + client invoice payments). LemonSqueezy is the actual SaaS billing per [Decisions/2026-05-12-LEMONSQUEEZY-OVER-STRIPE](../../lancerwise-knowledge/Decisions/2026-05-12-LEMONSQUEEZY-OVER-STRIPE) — **Privacy needs update к remove Stripe-as-billing claim, add LemonSqueezy**
- **Resend** — transactional email
- **Google Analytics 4** — anonymous usage analytics, IP anonymised, consent-gated

**Action item:** Privacy § 4 references Stripe as the SaaS billing path. Actual SaaS billing is LemonSqueezy. Update needed pre-launch — false statement about payment processor.

---

## Summary

| Item | Status |
|---|---|
| Pages exist on production | ✅ |
| Footer links wired | ✅ |
| Content substantive (>700 words each) | ✅ |
| GDPR sections present (Privacy § 7) | ✅ |
| Sub-processors disclosed | ✅ (с one stale mention — Stripe vs LemonSqueezy) |
| Contact email present | ✅ legal@lancerwise.com |
| Cookie banner exists | ✅ |
| Banner i18n EN + RU | ✅ |
| Banner gating (no track без consent) | ✅ verified |
| No cookies set без consent | ✅ verified |
| **Legal pages translated к RU** | ❌ **English-only content** |
| LemonSqueezy mentioned (vs stale Stripe SaaS claim) | ⏳ needs update |
| Last-updated date fresh | ✅ April 26, 2026 |

## Cross-references

- `GDPR-ASSESSMENT.md` — compliance gaps
- `LAUNCH-BLOCKER-DETERMINATION.md` — yes/no decision
- `RECOMMENDATIONS.md` — action items
