# Footer "Mobile app coming soon" — Audit

**Date:** 2026-05-19
**Status:** ✅ ALREADY SHIPPED — no code change needed

## Finding
Task asked to add subtle "Mobile app coming soon" text в footer. **Already implemented** в shared `MarketingFooter` component as part of trust badges row (post-Ramiz-QA-pass-1 layout).

## Location
`src/components/marketing/MarketingFooter.tsx:82-85`

```tsx
<div className="flex items-center gap-1.5">
  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
  <span>{t('marketingFooter.badges.mobileAppComingSoon')}</span>
</div>
```

Trust badges row layout: 🔒 SSL Encrypted · 🛡 GDPR Compliant · 📱 Mobile app coming soon

## Translation keys
- `messages/en.json:1360` → `"mobileAppComingSoon": "Mobile app coming soon"`
- `messages/ru.json:1360` → `"mobileAppComingSoon": "Скоро мобильное приложение"`

## Prod DOM verification (Playwright)
```
en desktop: badge="Mobile app coming soon"
ru desktop: badge="Скоро мобильное приложение"
en mobile:  badge="Mobile app coming soon"
ru mobile:  badge="Скоро мобильное приложение"
```

## Visual confirmation (4 PNGs)
- `footer-en-desktop.png` / `footer-en-mobile.png`
- `footer-ru-desktop.png` / `footer-ru-mobile.png`

## Styling
- Font size: `text-xs` (12px)
- Color: `text-slate-500` (subtle, not distracting)
- Icon: lucide `Smartphone` w-3.5 h-3.5
- Placement: trust badges row, between GDPR Compliant and copyright
- Mobile: row wraps gracefully via `flex-wrap`

Acceptance criteria met:
- ✅ Footer shows "Mobile app coming soon" subtly
- ✅ Both RU and EN versions
- ✅ Mobile + desktop work
- ✅ No layout regression
- ✅ Translation keys в proper namespace (`marketingFooter.badges`)

## Action: none
No new PR needed. Branch `feat/footer-mobile-app-coming-soon` will be discarded.
