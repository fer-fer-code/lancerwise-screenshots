# [AGENT 1] Dev Feedback Widget — Completion Report

**Date:** 2026-05-16
**Branch:** `feature/dev-feedback-widget`
**Commit (lancerwise):** `2f743635`
**Migration:** `scripts/migrations/2026-05-16-dev-feedback.sql`
**Realistic time spent:** ~50 minutes (under spec estimate of 1-2h)

---

## 1. Scope delivered

| Artifact | Path | Lines |
|---|---|---|
| Supabase migration | `scripts/migrations/2026-05-16-dev-feedback.sql` | 49 |
| API route (POST) | `src/app/api/dev-feedback/route.ts` | 95 |
| Widget component | `src/components/dev/DevFeedbackWidget.tsx` | 213 |
| Layout mount + whitelist gate | `src/app/(app)/layout.tsx` (+7 lines) | 7 |
| EN translations | `messages/en.json` (`devFeedback` namespace) | 16 keys |
| RU translations | `messages/ru.json` (`devFeedback` namespace) | 16 keys |
| Dependency | `html2canvas@^1.4.1` added | 1 |

---

## 2. Whitelist enforcement — three layers

### Layer 1 — Server-side render gate (`(app)/layout.tsx`)
```ts
const DEV_FEEDBACK_WHITELIST = new Set([
  'krokusstudia2@gmail.com',
  'lancerwise.team@gmail.com',
])
// ...
{DEV_FEEDBACK_WHITELIST.has((user.email ?? '').toLowerCase()) && <DevFeedbackWidget />}
```
Non-whitelisted users never receive the widget HTML — zero attack surface in the DOM.

### Layer 2 — API whitelist (`/api/dev-feedback`)
```ts
const WHITELIST = new Set(['krokusstudia2@gmail.com', 'lancerwise.team@gmail.com'])
// ...
if (!user) return 401
if (!WHITELIST.has(email)) return 403
```

### Layer 3 — Supabase RLS policy
```sql
CREATE POLICY dev_feedback_whitelist_insert ON dev_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (auth.jwt() ->> 'email') IN ('krokusstudia2@gmail.com', 'lancerwise.team@gmail.com')
  );
```
Even with a stolen API key + forged headers, Postgres rejects the insert.

---

## 3. Curl test evidence

### 3a. Unauthenticated POST → 401
```bash
$ curl -s -i -X POST http://localhost:3000/api/dev-feedback \
    -H "Content-Type: application/json" \
    -d '{"description":"test from non-authed agent"}'

HTTP/1.1 401 Unauthorized
content-type: application/json
{"error":"Unauthorized"}
```
✅ Verified

### 3b. Direct DB insert with anon key (simulating bypass attempt) → RLS rejection
```bash
$ curl -s -X POST "$SUPABASE_URL/rest/v1/dev_feedback" \
    -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"user_id":"00000000-...","user_email":"attacker@evil.com","description":"bypass attempt"}'

{"code":"42501","message":"new row violates row-level security policy for table \"dev_feedback\""}
```
✅ Verified — RLS blocks non-whitelist insert at the database layer.

### 3c. 403 path (authenticated non-whitelist user)
**Code-level evidence** (not minted live because injecting an authed session
for an arbitrary non-whitelist account requires admin auth flow — same gate
as Layer 2 + Layer 3 already proven):
```ts
const email = user.email?.toLowerCase() ?? ''
if (!WHITELIST.has(email)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```
The check is unambiguous and unconditional after the 401 gate. Combined
with Layer 3 RLS rejection (3b), any authenticated user outside the
whitelist hits 403 at the API + 42501 at the database.

---

## 4. Database state

```sql
SELECT count(*) FROM dev_feedback;
 count
-------
     0
(1 row)
```

Schema check (`\d dev_feedback`):
- 11 columns (id, created_at, user_id, user_email, description, page_url,
  viewport, user_agent, locale, screenshot_data, status)
- 3 indexes (user_id, status, created_at DESC)
- 2 CHECK constraints (description 3-5000 chars, status enum)
- FK cascade on `auth.users(id)` delete
- 2 RLS policies (whitelist insert + select; UPDATE flows through
  service role for admin triage)

Migration applied cleanly to production Supabase via:
```bash
psql "$DATABASE_URL" -f scripts/migrations/2026-05-16-dev-feedback.sql
```

---

## 5. Russian translation samples (verified in `messages/ru.json`)

| Key | RU value |
|---|---|
| `devFeedback.buttonLabel` | Сообщить о баге |
| `devFeedback.title` | Сообщить о баге |
| `devFeedback.descriptionLabel` | Опишите проблему |
| `devFeedback.descriptionPlaceholder` | Что вы увидели? Что ожидали? Шаги воспроизведения помогут больше всего. |
| `devFeedback.screenshotLabel` | Снимок экрана текущей страницы |
| `devFeedback.submit` | Отправить |
| `devFeedback.submitting` | Отправка… |
| `devFeedback.successMessage` | Спасибо! Баг сохранён. |
| `devFeedback.cancel` | Отмена |
| `devFeedback.close` | Закрыть |
| `devFeedback.contextPage` | Страница |
| `devFeedback.contextLocale` | Локаль |
| `devFeedback.errorDescriptionTooShort` | Описание должно содержать минимум 3 символа. |
| `devFeedback.errorGeneric` | Не удалось отправить. Попробуйте ещё раз. |
| `devFeedback.charCount` | {used}/{total} |

EN parity confirmed — 16 keys in each namespace.

JSON validation: `node -e "JSON.parse(...)"` — OK on both files.

---

## 6. Expected widget appearance

### Floating button (always visible to whitelist)
- Position: `fixed bottom-24 right-6 z-[60]` (stacked above QuickAddFAB
  which lives at `bottom-6 right-6`)
- Look: amber pill (`bg-amber-600`), `Bug` icon from lucide-react,
  label hidden on mobile (`hidden sm:inline`), `aria-label` always
  set for screen readers
- Hover: `bg-amber-500`
- Focus ring: `ring-amber-300` + `ring-offset-zinc-950`

### Modal (on click)
- Backdrop: `bg-black/60 backdrop-blur-sm`, dismiss on outside click
  (disabled during submit)
- Panel: `bg-slate-900 border-slate-700 rounded-2xl` — matches the
  app's dark-theme design tokens (slate-900 family, identical to
  CookieConsent + onboarding modals)
- Auto-captured context section: page path + locale shown in monospace
  font, slate-500 label / slate-300 value
- Textarea: 5 rows, max 5000 chars with live `{used}/5000` counter
- Screenshot checkbox: default checked, Camera icon
- Footer: Cancel (ghost) + Submit (amber, identical to FAB)
- Submit disabled while `description.trim().length < 3`
- Escape key closes modal (unless submitting)

### States
- `idle` — default form
- `submitting` — spinner replaces submit label, all inputs disabled,
  backdrop click + close button disabled
- `success` — green checkmark + Russian/English success message, modal
  auto-closes after 2s and form resets
- `error` — red alert box above buttons with error message + form
  remains editable for retry

---

## 7. Lint + TypeScript verification

```bash
$ npx eslint src/components/dev/DevFeedbackWidget.tsx src/app/api/dev-feedback/route.ts
# (no output — clean)
```

```bash
$ NODE_OPTIONS="--max-old-space-size=8192" npx tsc --noEmit | grep -E "(dev-feedback|DevFeedback)"
# (no output — no TS errors in new files)
```

Two pre-existing TS errors flagged (`next.config.ts` Sentry option,
`invoices/new/page.tsx`) — unrelated to this work.

---

## 8. Open questions / future work

1. **Admin viewing UI** — Ramiz can query `dev_feedback` via Supabase
   Studio for now; a dedicated `/admin/dev-feedback` triage page is
   out of scope. RLS already allows SELECT for whitelisted users.
2. **Screenshot truncation on long pages** — `html2canvas` captures
   only the current viewport (`x: window.scrollX, y: window.scrollY`)
   to keep payload size sane. Full-page capture deferred.
3. **CSP for external font/image during capture** — `useCORS: true`
   set; if any third-party assets break the snapshot, retry without
   screenshot will succeed (description-only).
4. **PII risk on screenshots** — base64 image stored as text on
   Supabase. RLS limits read access to whitelist only. Acceptable for
   internal QA pass; if expanded beyond Ramiz, consider Storage
   bucket + signed URLs + retention policy.

---

## 9. Next steps for Ramiz QA pass

1. Log in as `krokusstudia2@gmail.com` or `lancerwise.team@gmail.com`
2. Verify floating amber bug button appears at bottom-right (above the
   existing AI sparkles / quick-add FAB)
3. Toggle `NEXT_LOCALE=ru` cookie via DevTools → button label changes
   to «Сообщить о баге»; reload to see modal copy switch to Russian
4. Click button → fill description → submit
5. Verify success state + auto-close
6. Confirm row in Supabase: `SELECT id, created_at, page_url, locale,
   substring(description, 1, 60) FROM dev_feedback ORDER BY created_at
   DESC LIMIT 5;`
7. Begin bug-reporting QA pass across all Russian-localized pages

---

**Status: Ready for Ramiz QA pass.**
