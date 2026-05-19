# Bug #023 Z4 — settings translation discovery

**Date:** 2026-05-19
**PR:** #72
**Scope:** /settings index shell only (sub-routes all redirect к /settings)

## Page tree

```
src/app/(app)/settings/
├── page.tsx                          (680 lines — the actual UI shell ← THIS PR)
├── account/page.tsx                  (6 lines — redirect к /settings)
├── notifications/page.tsx            (5 lines — redirect)
├── billing/page.tsx                  (5 lines — redirect к /upgrade)
├── integrations/page.tsx             (6 lines — redirect к /settings)
├── security/page.tsx                 (6 lines — redirect)
├── api/page.tsx                      (16 lines — own page)
├── digest/page.tsx                   (own page, скилл not in PRIMARY scope)
├── availability/page.tsx
├── email-preview/page.tsx
├── export/page.tsx
├── items-library/page.tsx
├── late-fees/page.tsx
├── public-profile/page.tsx
├── reminders/page.tsx
├── tags/page.tsx
└── upgrade/page.tsx
```

## Child components imported by /settings/page.tsx (out of scope)

~55 components total, e.g.:
- BrandingSettings, PortalBrandingSettings, InvoiceBranding (logo + color pickers)
- NotificationPreferences (per-channel toggles)
- IntegrationsHub, GmailConnect, OutlookConnect, SmtpConnect (OAuth connect cards)
- ExportCenter, DataPrivacy (data export + GDPR controls)
- TwoFactorSettings, DeleteAccount (security widgets)
- RateCard, DiscountCodes, EmailTemplates, ServicePackages (templates)
- + ~40 more

Each has independent string sets — separate translation pass needed.

## Existing settings namespace (pre-PR)

`messages/{en,ru}.json` had а minimal `settings.*` block:
- `title`, `tabs.{account,billing,notifications,integrations,team,security,api,dangerZone}`, `account.{title,fullNameLabel,emailLabel,languageLabel,languageHelp,currencyLabel,timezoneLabel}`, `danger.{deleteAccount,deleteWarning}`

This PR extends с: `savedToast`, `saving`, `profile.*`, `appearance.*`, `business.*`, `plan.*`, `items.*`, `apiKeys.*`, `exportCenter.*`, `security.*`, `dangerZone.*`, `oauth.*`.

## Translation pattern

Standard `useTranslations('settings')` namespace from next-intl. ICU features used:
- `{plan}` variable interpolation в `plan.upgradeSuccessToast`
- `<yearTag></yearTag>` + `<example></example>` rich-tags в `business.invoicePrefixHelp` (для inline `<code>` styled tokens)

Loop iter variable renamed from `t` к `opt` в the theme picker map к avoid shadowing the translation function.

## Terminology consistency

Reuses Bug #023 conventions from Z1-Z3:
- "Клиент" not "Заказчик"
- "Счёт" for invoice
- "Договор" for contract
- USD stays $

## Verification

- Tsc baseline 385 preserved
- JSON parses (en + ru)
- 30+ EN strings replaced
- No orphan keys (every key has both en + ru)
