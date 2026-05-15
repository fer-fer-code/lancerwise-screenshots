# Agent3 Task 3 — Email Templates Final QA

**Context:** Pre-launch verification что email infrastructure готов к production. Reviewer's memory note:
"Step D email refactor: ~150 templates migrated to 3 universal templates; HMAC-signed unsubscribe infrastructure with Supabase DB migration; CAN-SPAM policy decision tree established."

**Scope** (agent3):
* 3 universal templates rendering quality
* HMAC unsubscribe (sign/verify/audit)
* CAN-SPAM compliance (physical address, unsubscribe link, sender identification, subject lines)
* Transactional vs marketing separation

**Out of scope:**
* `src/app/(app)/dashboard/**` (Agent #1)
* `tests/e2e/**`, `eslint.config*`, `.github/workflows/**` (Agent #2)

**Methodology:**
1. Inventory all email infrastructure files (`src/lib/email*.ts`, `src/lib/emails/**`, `src/emails/**`)
2. Find `sendEmail()` call sites — count, sample types used
3. Read HMAC implementation (`src/lib/unsubscribe.ts`) + `/api/unsubscribe` route end-to-end
4. Read DB migrations for `email_unsubscribed`, `email_unsubscribe_log`, `email_logs` tables
5. Per-template CAN-SPAM audit (physical address, unsub link, FROM sender, subject)
6. Map type field values → transactional/marketing classification

**Branch (Step C onwards):** `agent3-task3-email-qa`
