# PR #189 Timezone local-time alongside UTC fix re-verify

**Verdict:** ✅ **PASS — dual-format implemented + 1 minor edge-case caveat (UTC user redundant display)**
**Date:** 2026-05-23
**PR merge SHA:** `599c91fd`
**Vercel deploy READY:** 2026-05-22T18:15:35Z
**Probe author:** [AGENT 3]
**Original bug:** QA-011 in `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md`

---

## TL;DR

PR #189 successfully implements dual-format time display across both `/settings/digest` and `/settings/reminders`. Format: `"<TIME> UTC (<TIME> <LOCAL-TZ>)"`. User's local timezone (EDT in this probe via `timezoneId: 'America/New_York'`) is correctly converted from UTC and rendered in parentheses.

**1 edge case caveat:** When user's local timezone IS UTC, format renders redundantly as `"10:00 UTC (10:00 UTC)"` instead of collapsing to single `"10:00 UTC"`. Minor cosmetic issue, not blocking.

---

## Verdict matrix

| # | Test | Pre-fix | Post-fix | Verdict |
|---|------|---------|----------|:------:|
| 1 | /settings/digest dropdown: dual format | "10:00 UTC" only | "10:00 UTC (06:00 EDT)" | ✅ FIX |
| 2 | /settings/digest label: "Delivery Time (UTC)" | "(UTC)" suffix | "Delivery Time" (suffix dropped — values carry format) | ✅ improved |
| 3 | /settings/reminders helper text dual format | "Runs daily at 10:00 AM UTC — ..." | "Runs daily at 10:00 AM UTC (06:00 EDT) — ..." | ✅ FIX |
| 4 | EN locale dual-format rendering | n/a | EDT correctly computed | ✅ |
| 5 | RU locale dual-format rendering | n/a | Same EDT format (page content still English per separate i18n gap) | ✅ tz logic locale-independent |
| 6 | Edge case: user TZ = UTC | n/a | "10:00 UTC (10:00 UTC)" — redundant | ⚠️ **caveat** |

**Aggregate:** ✅ **5 of 6 PASS + 1 minor caveat.**

---

## Critical evidence — Dual-format implementation

### /settings/digest dropdown (EN locale, EDT user)

`EVIDENCE/after-pr189-settings-digest-en.png` shows Delivery Time dropdown value: **"08:00 UTC (04:00 EDT)"**

Full dropdown options inventory (from select.options):
```
06:00 UTC (02:00 EDT)
07:00 UTC (03:00 EDT)
08:00 UTC (04:00 EDT)
09:00 UTC (05:00 EDT)
10:00 UTC (06:00 EDT)
11:00 UTC (07:00 EDT)
12:00 UTC (08:00 EDT)
13:00 UTC (09:00 EDT)
... (13 options total spanning common work hours UTC)
```

### /settings/reminders helper text (EN)

`EVIDENCE/after-pr189-settings-reminders-en.png` shows:
> "Runs daily at 10:00 AM UTC (06:00 EDT) — sends emails to clients with overdue invoices"

Same dual-format applied to the cron-schedule disclosure text.

### Pre-fix comparison

From `../agent3-comprehensive-qa-2026-05-21/EVIDENCE/page-screenshots/settings_digest_chromium_en_desktop_above-fold.png` + memory `backlog_timezone_hardcoded`:
- Label was: "Delivery Time (UTC)"
- Dropdown options were: "08:00 UTC / 09:00 UTC / 10:00 UTC / ..." (UTC only, no local conversion)
- /settings/reminders helper was: "Runs daily at 10:00 AM UTC — sends emails..."

Now: full dual-format with local conversion. UX win for global users.

---

## RU locale verification

`EVIDENCE/after-pr189-settings-digest-ru.png`:
- Sidebar IS in Russian (Главная / Финансы / Клиенты / Работа / Договоры / Аналитика / Настройки)
- "Delivery Time" dropdown value: **"08:00 UTC (04:00 EDT)"** — same dual format
- Page content body (Weekly Digest Settings / Delivery Settings / Delivery Day / Delivery Time / Send To / Sections to Include) remains English

**The timezone fix logic is locale-independent and works correctly.** The RU-locale page-content English bleed-through is the pre-existing P1-1 i18n gap (unrelated to PR #189) — see `../agent3-p1-repro-prep-2026-05-22/P1-1-i18n-gap-authed-routes.md`.

---

## Edge case — user TZ = UTC (caveat)

When probe Chrome context uses `timezoneId: 'UTC'` (i.e. user is in UTC region):

### /settings/digest dropdown
```
06:00 UTC (06:00 UTC)   ← redundant
07:00 UTC (07:00 UTC)
08:00 UTC (08:00 UTC)
...
10:00 UTC (10:00 UTC)
```

### /settings/reminders helper text
```
"Runs daily at 10:00 AM UTC (10:00 UTC) — sends emails to clients with overdue invoices"
```

**Expected per spec:** "user TZ = UTC itself — should display single time без redundant '(UTC: same)'"

**Actual:** Format always renders dual representation, even when local TZ == UTC.

### Severity assessment
- **Visual:** Cosmetic redundancy, doesn't break feature, doesn't confuse users (UTC twice still = correct time)
- **Audience:** Affects only users whose browser/OS timezone is set to UTC — relatively rare in practice (most users have local TZ auto-detected)
- **Fix complexity:** ~5-10 line conditional in the formatter (collapse when local == UTC)
- **Severity:** **P3 polish** — not launch-blocking

### Evidence
- `EVIDENCE/edge-utc-tz-digest.png` — dropdown with redundant UTC
- `EVIDENCE/edge-utc-tz-reminders.png` — helper text with redundant UTC

### Suggested fix
```ts
function formatDualTime(utcHour: number): string {
  const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const utcLabel = `${pad(utcHour)}:00 UTC`
  if (userTz === 'UTC' || userTz === 'Etc/UTC') return utcLabel  // collapse
  const localStr = computeLocal(utcHour, userTz)
  return `${utcLabel} (${localStr})`
}
```

---

## DOM/data proof — body regex check

EN locale, /settings/digest:
- `utcMatches`: 13 hits of "<HH>:00 UTC" pattern (one per option)
- `localMatches`: 13 hits of "<HH>:00 EDT" pattern — local time captured correctly
- `containsUTC: true`
- Dropdown option example: `"08:00 UTC (04:00 EDT)"` confirms parenthetical format

EN locale, /settings/reminders:
- `utcMatches`: `["10:00 AM UTC"]`
- `localMatches`: `["06:00 EDT"]`
- `dailyText`: `["Runs daily at 10:00 AM UTC (06:00 EDT) — sends emails..."]`

10:00 UTC = 06:00 EDT — math is correct (UTC-4 in DST, May 23 is during EDT).

---

## Evidence

`EVIDENCE/` contains 10 screenshots + 1 JSON:

### Main re-probe (EN + RU, user TZ = America/New_York → EDT)
- `after-pr189-settings-digest-en.png` ← key proof
- `after-pr189-settings-digest-en-full.png`
- `after-pr189-settings-digest-ru.png`
- `after-pr189-settings-digest-ru-full.png`
- `after-pr189-settings-reminders-en.png` ← key proof
- `after-pr189-settings-reminders-en-full.png`
- `after-pr189-settings-reminders-ru.png`
- `after-pr189-settings-reminders-ru-full.png`

### Edge case (user TZ = UTC)
- `edge-utc-tz-digest.png` ← shows redundant "UTC (UTC)" format
- `edge-utc-tz-reminders.png`

### Structured data
- `pr189-tz-data.json` — full regex capture: utcMatches, localMatches, dailyText per cell

---

## Recommendations

**✅ PR #189 cleared for launch.** Dual-format timezone display correctly implemented across both routes. Resolves QA-011 P1.

**Follow-up (NOT launch-blocking):**

1. **UTC-user edge case** — collapse redundant `"UTC (UTC)"` to single `"UTC"` when user TZ matches UTC. P3 polish. ~5-line fix in formatter.

2. **Other timezone touchpoints** — audit codebase for other hardcoded `"UTC"` strings that may have escaped this PR:
   - Email digest content (renders server-side for delivery time mention)
   - Activity feed timestamps
   - Invoice "Due date" + "Issue date" displays
   - Time entry timestamps

3. **i18n gap** — translate the surrounding page content ("Weekly Digest Settings", "Delivery Day", "Sections to Include", reminder helper preamble) to Russian per P1-1 repro doc. Separate scope from this PR.

---

## Cross-references

- Original P1: `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` § QA-011
- P1 repro doc: `../agent3-p1-repro-prep-2026-05-22/P1-4-timezone-hardcoded-utc.md`
- Pre-fix screenshots: `../agent3-comprehensive-qa-2026-05-21/EVIDENCE/page-screenshots/settings_{digest,reminders}_chromium_en_desktop_above-fold.png`
- Sibling fixes verified this session: PR #154 (P0 cookie), PR #184 (modal backdrop), PR #186 (cookie customize), PR #188 (pipeline NaN+KPI)
