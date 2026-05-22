# P1-4 — Timezone hardcoded UTC on /settings/digest + /settings/reminders [QA-011]

## Severity
**P1 broken UX** — global user confusion, will cause "my emails arrived at wrong time" complaints

## Summary
Email delivery + reminder timing UI shows "UTC" labels everywhere instead of converting to user's local timezone. A user in Bangkok (UTC+7) reading "Runs daily at 10:00 AM UTC" thinks emails arrive at 10 AM local, but actually they arrive at 5 PM Bangkok time. Cron jobs CAN stay UTC server-side; the display layer must localize.

## Steps to reproduce

### /settings/digest
1. Sign in
2. Navigate to `/settings/digest`
3. Observe "Delivery Time (UTC)" label above the dropdown
4. Open dropdown — all options formatted "08:00 UTC / 09:00 UTC / 10:00 UTC..."

### /settings/reminders
1. Navigate to `/settings/reminders`
2. Observe under "AUTOMATION SETTINGS" the helper text reads:
   > "Runs daily at 10:00 AM UTC — sends emails to clients with overdue invoices"

## Expected behavior
- Labels should show "Delivery Time (your local time, {userTz})" or similar
- Dropdown options should display in user's local timezone (e.g. "06:00 PM (your time)" for a UTC+8 user picking 10:00 UTC)
- "Runs daily at..." text should compute local equivalent: "Runs daily at 6:00 PM (your local time) — sends emails..."

Cron can still SCHEDULE in UTC; only the DISPLAY needs locale-aware conversion.

## Actual behavior
Both routes hardcode the literal "UTC" string.

## Screenshot reference
- `EVIDENCE/page-screenshots/settings_digest_chromium_en_desktop_above-fold.png` — "Delivery Time (UTC)" label
- `EVIDENCE/page-screenshots/settings_reminders_chromium_en_desktop_above-fold.png` — "Runs daily at 10:00 AM UTC" text

## Suspect file locations (verified via grep)

### `src/app/(app)/settings/digest/DigestConfigClient.tsx`
- Line 244: `<label style={label}>Delivery Time (UTC)</label>`
- Line 262: `{String(h).padStart(2, '0')}:00 UTC` (dropdown option label)

### `src/app/(app)/settings/reminders/ReminderSettings.tsx`
- Line 157: `Runs daily at 10:00 AM UTC — sends emails to clients with overdue invoices`

## Quick fix hypothesis

Helper to detect + format:
```ts
// lib/timezone.ts
export function userTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone // e.g. "Europe/Moscow"
}

export function utcHourToLocal(utcHour: number): { hh: number; mm: number; tzLabel: string } {
  const d = new Date()
  d.setUTCHours(utcHour, 0, 0, 0)
  const local = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })
  const tzLabel = userTimezone()
  return { display: local, tzLabel }
}
```

### digest fix:
```diff
- <label>Delivery Time (UTC)</label>
+ <label>{t('settings.digest.deliveryTime', { tz: userTimezone() })}</label>

- {String(h).padStart(2, '0')}:00 UTC
+ {utcHourToLocal(h).display} ({utcHourToLocal(h).tzLabel})
```

### reminders fix:
```diff
- Runs daily at 10:00 AM UTC — sends emails to clients with overdue invoices
+ {t('settings.reminders.runsDaily', {
+   localTime: utcHourToLocal(10).display,
+   tz: userTimezone()
+ })}
```

Translation keys:
```json
{
  "settings": {
    "digest": { "deliveryTime": "Delivery Time ({tz})" / "Время отправки ({tz})" },
    "reminders": { "runsDaily": "Runs daily at {localTime} ({tz}) — sends emails to clients with overdue invoices" }
  }
}
```

## Verification after fix
1. Set browser/OS timezone to a non-UTC zone (e.g. Asia/Bangkok)
2. Reload `/settings/digest` — dropdown should show hours in Bangkok time
3. Reload `/settings/reminders` — helper text shows local equivalent of 10:00 UTC

## Estimate
~1-2h (small touch, 2 files, 3 hit locations + new helper + i18n keys)

## Cross-references
- Pre-existing memory `backlog_timezone_hardcoded` P1 — re-confirmed
- Pre-existing memory `backlog_date_format_localization` P1 — separate but related (Intl.DateTimeFormat for dates)
- P1-1 (i18n gap general) — add timezone keys here too
