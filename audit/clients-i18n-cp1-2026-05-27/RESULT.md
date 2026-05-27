# Heavy Tier i18n CP1 — RU Locale Verification

**Date:** 2026-05-27
**Author:** [AGENT 1]
**lancerwise main HEAD:** `78231222`
**Locale tested:** RU (cookie NEXT_LOCALE=ru) at 1280×1024
**Auth:** Supabase Admin magic-link для krokusstudia2@gmail.com

---

## TL;DR

Files 1-3 Heavy tier i18n complete с full EN+RU parity, **0 English leaks** на RU locale.

| Route | File covered | EN leaks | Verdict |
|---|---|---:|:---:|
| `/clients/win-back` | clients/win-back/page.tsx | 0 | ✅ |
| `/clients/intake` | clients/intake/page.tsx | 0 | ✅ |
| `/clients/[id]` | clients/[id]/ClientContacts.tsx (rendered as sub-component) | 0 | ✅ |

`<html lang>` = `ru` confirmed на каждой странице.

---

## Leak scan methodology

JS-side scan via `document.body.innerText` против известных EN-only string set:

```
Win-Back Campaign, Win-Back Candidates, Sent This Month, Reply Rate, Total Campaigns,
Re-engage past clients, Intake Forms, Total Forms, Awaiting review,
Team & Contacts, Add Contact, No contacts added yet,
Make it personal, Offer something new, Keep it short
```

**Result:** 0 matches across all 3 routes.

---

## i18n keys added (full EN/RU parity)

### `clients.winback.*` (~60 keys)

| Sub-namespace | Keys |
|---|---|
| `header` | title, subtitle |
| `controls` | daysInactive {days}, daysShort {days}, refresh, allClients |
| `stats` | candidates, candidatesSub {days}, sentThisMonth, sentThisMonthSub, replyRate, replyRateSub {replied}/{total}, totalCampaigns, totalCampaignsSub |
| `infoBar` | rich() с `<strong>{days} days</strong>` markup |
| `candidates` | title, emptyTitle, emptyDescription {days}, table.{client,lastActivity,daysSilent,action}, contacted, noActivity, ctaEmail, **footer ICU plural one/few/many/other** |
| `activityType` | invoice/project/communication |
| `sentCampaigns` | title, table.{client,subject,sent,replied,daysSince}, yes, noReply, daysAgo {days} |
| `tips.{personal,offer,short}` | title + body × 3 |
| `modal` | title, defaultSubject {name}, subjectLabel, emailLabel, aiWriting, placeholderDrafting, noEmailWarning, sentSuccess, errorGenerate, errorSend, copy, copied, regenerate, send, sending, sent, noEmail |

### `clients.intake.*` (~30 keys)

| Sub | Keys |
|---|---|
| `back` | "К клиентам" / "Back to Clients" |
| `header` | title, subtitle, newButton |
| `status` | pending/submitted/processed |
| `stats` | totalForms, submitted, processed, awaitingReview {count} |
| `create` | title, titleLabel, titlePlaceholder, titleHint, cancel, submit |
| `empty` | title, description, cta |
| `card` | submittedOn {date}, createdOn {date}, copyLink, copied, openForm, viewBrief, toClient, viewClient, deleteTitle |
| `confirmDelete` | "Удалить эту анкету?" |
| `brief` | title, convertToClient, copyBrief, close |

### `clients.contacts.*` (~25 keys)

| Sub | Keys |
|---|---|
| `title` | "Команда и контакты" |
| `addContact`, `addFirst`, `primary` | actions |
| **`count` ICU plural** | one/few/many/other |
| `noneTitle`, `noneHint` | empty state |
| `form` | newTitle, editTitle, namePlaceholder, customRole, email, phone, notes, setPrimary, save, create, cancel, invalidEmail |
| `role` | primary/billing/technical/manager/decision/other — UI-display only; DB stores English label |
| `actions` | edit, setPrimary, delete |

---

## Key technical decisions

### Role keys decoupled from DB labels (ClientContacts)

ROLE_OPTIONS stays English ('Primary Contact', 'Billing Contact', ...) для backwards compat с existing DB rows. UI rendering uses `displayRole(role)` helper:

```ts
const ROLE_KEY: Record<string, RoleKey> = {
  'Primary Contact': 'primary',
  'Billing Contact': 'billing',
  ...
}
function displayRole(role: string): string {
  const key = ROLE_KEY[role]
  return key ? t(`role.${key}` as 'role.primary') : role  // custom roles fall through
}
```

User's custom role (free-text after picking 'Other', e.g. "CFO") shows raw без translation lookup. Existing DB rows с label "Primary Contact" render correctly localized.

### Plural ICU

Two plural rules used:

- `clients.contacts.count`: "1 контакт / 2 контакта / 5 контактов"
- `clients.winback.candidates.footer`: "1 неактивный клиент / 2 неактивных клиента / 5 неактивных клиентов · сортировка по давности"

Both follow established codebase pattern (cf. `clientsCrud.existingClients`, `invoicesCrud.paid/unpaid` в messages/ru.json).

### Date formatting

`new Date(date).toLocaleDateString('en-US', ...)` (× 2 в win-back) заменён на `formatDate(date)` из `@/lib/utils` — auto-locale detection через `document.documentElement.lang` SSR fallback `en-US`.

### Rich text in info banner

`t.rich('infoBar', { days, strong: chunks => <strong>{chunks}</strong> })` для bold {days} в banner. JSON markup использует `<strong>` tags. Same pattern уже используется в `SettingsRootClient.tsx` и `InvoicePreviewModal.tsx`.

---

## Files changed (commit `78231222`)

**5 files, +517 / −167 lines**

| File | Change |
|---|---|
| `src/app/(app)/clients/win-back/page.tsx` | Full rewrite for useTranslations integration в 3 sub-components + main + tips |
| `src/app/(app)/clients/intake/page.tsx` | Full rewrite с translation hooks |
| `src/app/(app)/clients/[id]/ClientContacts.tsx` | Translation hooks + displayRole() decoupling |
| `messages/en.json` | +178 lines (`clients.{winback,intake,contacts}`) |
| `messages/ru.json` | +178 lines (full EN/RU parity) |

---

## Not touched (per spec)

- `text-slate-*` typography colors
- Email body AI output (API response, не UI string)
- Client names, emails, phones, company values (user data)
- Currency symbols
- COUNTRIES arrays (out of scope per directive)
- Palette already swapped (CP1-CP3 of palette pass: `9e00485c` · `ea966aba` · `95961441`)

---

## Artifacts

- `RESULT.md` (this file)
- `clients-winback-RU-{fullpage,viewport}.png`
- `clients-intake-RU-{fullpage,viewport}.png`
- `clients-detail-RU-a9285114-{fullpage,viewport}.png`

---

## Summary line per Ramiz spec

**HEAD SHA `78231222`** | 3 files / ~115 keys EN+RU parity | **0 EN leaks** на RU locale | flag 🇷🇺 confirmed | CP2 (import + statement + communications + history) next
