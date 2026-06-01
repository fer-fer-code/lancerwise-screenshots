# Final test-users purge — 2026-06-01

**Source instruction:** Ramiz confirmed: keep ROVNO 2 production accounts (ramiz_ddd@mail.ru + krokusstudia2@gmail.com); delete all others cascade.

## Pre-delete snapshot (auth.users full enum)

```
           email           |                  id                  |  created   | last_signin | clients | invoices | projects | time_entries | plan | real_subscription 
---------------------------+--------------------------------------+------------+-------------+---------+----------+----------+--------------+------+-------------------
 krokusstudia2@gmail.com   | 367d62fc-a790-4ffb-b627-32db0df9b34e | 2026-04-24 | 2026-05-31  |       0 |        0 |        0 |            0 | pro  | no
 ramiz_ddd@mail.ru         | a6cbdc12-c0f1-4adb-9255-ca6e9598fb9d | 2026-04-26 | 2026-05-31  |       2 |        0 |        0 |            4 | free | no
 tamnaphat@gmail.com       | e0e81198-348a-4a80-b148-00ef61d77d7c | 2026-04-27 | 2026-04-27  |       0 |        0 |        0 |            0 | free | no
 dear.890dia@gmail.com     | a29265ed-6d23-48f4-bbdc-4f841daa95d5 | 2026-04-27 | 2026-04-27  |       0 |        0 |        0 |            0 | free | no
 qa-test@lancerwise.com    | 8d8d59be-aa19-4e13-afcf-df7da7d39348 | 2026-05-07 | 2026-06-01  |       5 |        8 |        3 |           15 | pro  | no
 lancerwise.team@gmail.com | 73c46344-3c8e-4c47-9c1b-3ddaa5fdbca7 | 2026-05-23 | never       |       0 |        0 |        0 |            0 | free | no
 test-phase10@example.com  | 794d1560-c0cd-4554-af8d-b661e71c3879 | 2026-06-01 | 2026-06-01  |       0 |        0 |        0 |            0 | free | no
(7 строк)

```

## Safety verification

- LemonSqueezy subscriptions table: **empty** (KYC review pending, zero real customers)
- profiles.plan='pro' on `krokusstudia2@gmail.com` + `qa-test@lancerwise.com` are **manual test flips**, NOT real paid subscriptions

## KEEP (2 accounts)

| Email | ID | Reason |
|---|---|---|
| ramiz_ddd@mail.ru | a6cbdc12-c0f1-4adb-9255-ca6e9598fb9d | Ramiz primary account |
| krokusstudia2@gmail.com | 367d62fc-a790-4ffb-b627-32db0df9b34e | Ramiz secondary / whitelist DevFeedback |

## DELETE (5 accounts cascade)

| Email | ID | Reason |
|---|---|---|
| tamnaphat@gmail.com | e0e81198-348a-4a80-b148-00ef61d77d7c | one-day signin 2026-04-27, zero activity |
| dear.890dia@gmail.com | a29265ed-6d23-48f4-bbdc-4f841daa95d5 | one-day signin 2026-04-27, zero activity |
| qa-test@lancerwise.com | 8d8d59be-aa19-4e13-afcf-df7da7d39348 | name "qa-test", manual Pro flag, no real subscription, most fixture-y data (5+8+3+15) |
| lancerwise.team@gmail.com | 73c46344-3c8e-4c47-9c1b-3ddaa5fdbca7 | DevFeedback whitelist member but never signed in (last_signin NULL) — neutral collateral |
| test-phase10@example.com | 794d1560-c0cd-4554-af8d-b661e71c3879 | **RE-CREATED 2026-06-01** with new ID after first delete — some test runner still active (FLAG) |

## Outstanding flag

`test-phase10@example.com` was deleted earlier today (~1h ago, ID a2fddc25...) and a NEW row with the same email + new ID (794d1560...) appeared, created_at 2026-06-01, last_signin 2026-06-01. **Something is recreating it.** Possible sources:
- Cron-fired QA test runner
- Vercel preview deployment signup test
- Stale automation script

Removing the row now buys quota relief but does not solve the regen. Recommend hunting the test runner source post-launch.


## Post-delete final state

| email | id | created | last_signin | clients | invoices | projects | time_entries | plan |
|---|---|---|---|---|---|---|---|---|
| krokusstudia2@gmail.com | 367d62fc-a790-4ffb-b627-32db0df9b34e | 2026-04-24 | 2026-05-31 | 0 | 0 | 0 | 0 | pro |
| ramiz_ddd@mail.ru | a6cbdc12-c0f1-4adb-9255-ca6e9598fb9d | 2026-04-26 | 2026-05-31 | 2 | 0 | 0 | 4 | free |

**Total users: 2 (exactly).**

## Cascade-deletion counts (public.* rows purged per user)

| User | Rows deleted |
|---|---|
| tamnaphat@gmail.com | 23 |
| dear.890dia@gmail.com | 15 |
| qa-test@lancerwise.com | **201** (heaviest fixture; 40+ ai_usage_log, 15 time_entries, 8 invoices, 5 clients...) |
| lancerwise.team@gmail.com | 3 |
| test-phase10@example.com | 10 |
| **Total** | **252 rows** |

## Cron-recipients (post-delete)

Only 2 emails will receive weekly/monthly cron reports:
- ramiz_ddd@mail.ru
- krokusstudia2@gmail.com

Next weekly-report cron will send ~5 emails total (2 users × ~2-3 report types), well within Resend free quota.

## Outstanding test-runner concern

test-phase10@example.com was re-created by an unknown source between 14:50 and 15:30 UTC today (after my first delete). If the source is still active, this email will reappear. To be hunted post-launch — possible candidates:
- A QA agent's signup-flow probe
- Vercel preview deployment seeded test data
- Stale GitHub Actions workflow

