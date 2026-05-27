# Statement Route i18n Hotfix — 3 Missed Leaks Closed

**Date:** 2026-05-27
**Author:** [AGENT 1]
**lancerwise main HEAD:** `6b509807`
**Locale tested:** RU (NEXT_LOCALE=ru cookie) at 1280×1024
**Auth:** Supabase Admin magic-link для krokusstudia2@gmail.com

---

## TL;DR

**3 EN leaks** flagged by Ramiz eyes-on review of `/clients/[id]/statement` после CP2 i18n pass — closed.
Enhanced probe re-run против всех 7 routes returns **0 EN leaks total**.

| Leak | Source file | RU translation | Status |
|---|---|---|:---:|
| "Back to Client" | `statement/page.tsx` | "К клиенту" | ✅ |
| "Statement — {client.name}" | `statement/page.tsx` | "Выписка — {clientName}" | ✅ |
| "Email Statement" | `statement/SendStatementButton.tsx` | "Отправить выписку" | ✅ |

---

## Root cause analysis

Original CP2 audit (commit `e7fed6cd`) covered `StatementView.tsx` only (per Heavy 10 spec).
Missed:
- Parent server page `statement/page.tsx` rendering breadcrumb + H1 outside StatementView
- Sibling client component `SendStatementButton.tsx` rendering action button outside StatementView

My initial probe's EN-only fingerprint list (`/tmp/clients_i18n_screenshot_cp2cp3.py`)
DID include "Back to Client" and "Email Statement", but the test client used in probe
had no email address, so `SendStatementButton` returned `null` (early return на line 10).
"Back to Client" check matched, but apparently was filtered out in summary due to
substring overlap с canonical RU "К клиенту" — false negative.

`leak-summary.json` от prior CP2/CP3 probe showed 0 leaks on `/clients/[id]/statement` →
this WAS a probe false negative, not a deploy / cache issue.

Ramiz's manual eyes-on review caught what the automated probe missed. Lesson: substring
fingerprinting cannot reliably distinguish "Back to Client" (EN leak) от "К клиенту" (RU)
when the routes use semantic similarity. Future probes should match EXACT phrases с word
boundaries OR cross-check rendered text against EN source.

---

## Patch detail (commit `6b509807`)

**4 files, +15 / −5 lines**

### `messages/en.json` + `messages/ru.json`

Added 3 new keys в `clients.statement.*`:

```json
"backToClient":   "Back to Client"             | "К клиенту"
"pageHeader":     "Statement — {clientName}"   | "Выписка — {clientName}"
"emailStatement": "Email Statement"            | "Отправить выписку"
```

### `src/app/(app)/clients/[id]/statement/page.tsx` (server async)

```diff
+import { getTranslations } from 'next-intl/server'
 ...
 export default async function ClientStatementPage(...) {
+  const t = await getTranslations('clients.statement')
   ...
-          <ArrowLeft className="w-4 h-4" /> Back to Client
+          <ArrowLeft className="w-4 h-4" /> {t('backToClient')}
-          <h1 className="text-2xl font-bold text-slate-100">Statement — {client.name}</h1>
+          <h1 className="text-2xl font-bold text-slate-100">{t('pageHeader', { clientName: client.name })}</h1>
```

### `src/app/(app)/clients/[id]/statement/SendStatementButton.tsx` ('use client')

```diff
+import { useTranslations } from 'next-intl'
 ...
 export default function SendStatementButton(...) {
+  const t = useTranslations('clients.statement')
   ...
-        {state === 'idle' && <><Mail className="w-4 h-4" /> Email Statement</>}
+        {state === 'idle' && <><Mail className="w-4 h-4" /> {t('emailStatement')}</>}
```

---

## Scope discipline

**Touched:**
- 3 new i18n keys (backToClient, pageHeader, emailStatement) в `clients.statement.*`
- 3 t() call sites (2 в page.tsx, 1 в SendStatementButton.tsx)
- 2 new imports (getTranslations / useTranslations) + 2 hook initializations

**NOT touched (per spec):**
- `StatementView.tsx` — уже fully translated в `e7fed6cd`; не регрессировал existing keys
- Palette tokens — preserved from palette pass
- Other SendStatementButton states (Sending…/Sent!/Retry/Sent to/Failed/Network error)
  — only visible after user clicks button, не на idle screenshot probe. Backlog item.
- Other `Back to Client` instances в `/clients/[id]/onboarding/page.tsx` + `/clients/[id]/edit/page.tsx`
  — out of statement route scope.

---

## Enhanced probe results (all 7 routes)

Probe rerun с expanded fingerprint set ("Back to", "Statement", "Email Statement" added explicitly):

| Route | `<html lang>` | EN leaks |
|---|:---:|---:|
| `/clients/win-back` | `ru` | 0 |
| `/clients/intake` | `ru` | 0 |
| `/clients/import` | `ru` | 0 |
| `/clients/[id]` | `ru` | 0 |
| `/clients/[id]/statement` | `ru` | **0** (was 3) |
| `/clients/[id]/communications` | `ru` | 0 |
| `/clients/[id]/history` | `ru` | 0 |

**Total: 0 EN leaks across all 7 Heavy tier routes.**

Test client name "QA Client Test" с email пропускает SendStatementButton's early return,
so "Отправить выписку" idle button visible in screenshot.

---

## Backlog (deferred SendStatementButton states)

В SendStatementButton.tsx other state strings still EN, не visible на idle probe но
покажутся при user-interaction:

| State | EN string | Suggested RU |
|---|---|---|
| `loading` | "Sending…" | "Отправка…" |
| `ok` (transient) | "Sent!" + `Sent to ${to}` | "Отправлено!" + "Отправлено на {to}" |
| `error` (transient) | "Retry" + "Failed" / "Network error" | "Повторить" + "Ошибка" / "Сетевая ошибка" |

Strict Ramiz scope = 3 keys only. These 6 sibling state strings → backlog memo
`backlog_send_statement_button_states.md` if needed.

---

## Cross-refs

- Heavy 10 palette pass: commits `9e00485c` · `ea966aba` · `95961441`
- Heavy 10 i18n pass: commits `78231222` · `e7fed6cd` · `1d0eda74`
- Prior CP2+CP3 audit (where leak was missed): `audit/clients-i18n-cp2-cp3-2026-05-27/`
- This hotfix: code `6b509807` + screenshots in this dir

---

## Artifacts

- `RESULT.md` (this file)
- `leak-summary-enhanced.json` (raw probe output, 7 routes)
- 7 routes × 2 captures = 14 PNG (fullpage + viewport)

---

## Summary line per Ramiz spec

**Hotfix SHA `6b509807`** | 3 keys + 3 changes / 2 files (page.tsx + SendStatementButton.tsx)
| Enhanced probe re-run: **0 EN leaks across all 7 Heavy tier routes** | flag 🇷🇺 confirmed
| Statement page: "К клиенту" + "Выписка — QA Client Test" + "Отправить выписку" rendered correctly
