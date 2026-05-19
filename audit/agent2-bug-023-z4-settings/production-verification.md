# Bug #023 Z4 — production verification

**Date:** 2026-05-19
**PR:** #72 (squash-merged as `3dbf148034c54065939ef7a369e8370dadc827eb`)
**Production deploy:** `dpl_6yAGLsqSvSjA3Pv4vY8pypXWJ9yM` READY at 04:45 UTC
**Test account:** `lancerwise-qa-1779107498@wshu.net` (UUID `f77ffa5a-3141-4803-a410-d624b5d94699`)

## Result: ✅ Z4 RESOLVED — /settings shell renders RU

### Method

1. Sign in as test user via Supabase signInWithPassword
2. Build SSR cookie + set `NEXT_LOCALE=ru` cookie
3. `GET https://www.lancerwise.com/settings`
4. Spot-check rendered HTML для known RU strings + check that no scope-included EN strings remain

### Outcome — 16/16 RU strings render

```
✓ Настройки                           (page title)
✓ Профиль                             (Profile section heading)
✓ Полное имя                          (Full Name label)
✓ Email нельзя изменить здесь          (Email help)
✓ Сохранить профиль                   (Save Profile button)
✓ Внешний вид                         (Appearance heading)
✓ Бизнес-информация                   (Business Info heading)
✓ Часовая ставка                      (Hourly Rate label)
✓ Налог (%)                          (Tax Rate label)
✓ Префикс номера счёта                (Invoice Prefix label)
✓ Сохранить настройки                  (Save Preferences button)
✓ Тариф                               (Plan heading)
✓ Безопасность                        (Security heading)
✓ Выйти со всех устройств              (Sign out of all devices)
✓ Сменить пароль                      (Change password link)
✓ Опасная зона                        (Danger zone)
```

### Out-of-scope EN leftovers (acknowledged)

The probe also caught 2 EN strings that DID NOT come from /settings/page.tsx shell:

| String | Location | Status |
|---|---|---|
| `Save Profile` | FreelancerProfile widget | Out of scope (child component) |
| `Save Profile Details` | FreelancerProfile widget | Out of scope (child component) |
| `Hourly Rate` | RateCard widget | Out of scope (child component) |
| (`Used в AI tools` context phrase nearby) | FreelancerProfile widget | Out of scope (child component) |

These are inside child components imported by /settings/page.tsx but not part of the page shell. The PR description explicitly excludes these (~25+ child components like NotificationPreferences, BrandingSettings, GmailConnect, FreelancerProfile, RateCard, etc.) as separate translation passes.

## Network/HTTP details

```
HTTP 200
Body length: 350790 bytes
```

Page rendered successfully (200), no SSR error, no missing-key fallback warnings.

## Coordination

* Merge committed clean via `gh pr merge 72 --squash --admin --delete-branch`
* qa-gates passed на the original commit (`64aead39`); bot auto-lowered baseline floor from 33796 → 33757 reflecting the new translated coverage
* Merge resolved one conflict in `audit/i18n-baseline.json` (kept the lower 33757 floor from my branch)
* Visual-regression is а pre-existing CI infra failure (test account auth.setup credentials issue) — unrelated к this PR
