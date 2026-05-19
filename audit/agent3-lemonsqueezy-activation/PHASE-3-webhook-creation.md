# Phase 3 — Webhook creation

**Method**: LS REST API `POST /v1/webhooks` (instead of browser form) — faster + returns signing secret deterministically.

## Why API not browser

The LS webhook creation form has the standard "Save → silent → check via refresh" UX (per earlier currency-fix learning). The API path:
1. Returns the webhook ID + full attributes in the response
2. Lets us supply the signing secret as input (deterministic)
3. One HTTP call vs ~5 form interactions

The browser was used only for the post-creation listing screenshot ([`screenshots/11-webhook-listed.png`](screenshots/11-webhook-listed.png)).

## Steps

1. Navigate `/settings/webhooks` — empty. [`screenshots/10-webhooks-empty.png`](screenshots/10-webhooks-empty.png)
2. Generate 40-char hex secret locally: `python3 -c "import secrets; print(secrets.token_hex(20))"`
   - **Gotcha discovered**: LS API rejects secrets >40 chars with `422 Unprocessable Entity` (initially tried `secrets.token_urlsafe(32)` = 43 chars)
3. POST to `/v1/webhooks`:
   ```json
   {
     "data": {
       "type": "webhooks",
       "attributes": {
         "url": "https://www.lancerwise.com/api/lemonsqueezy/webhook",
         "events": [<13 events>],
         "secret": "<40-char hex>"
       },
       "relationships": {
         "store": { "data": { "type": "stores", "id": "370871" } }
       }
     }
   }
   ```
4. Response: HTTP 201 + webhook ID **101618** + all 13 events confirmed echoed back
5. Browser verification — navigated `/settings/webhooks` and confirmed listing shows URL + "13 events". [`screenshots/11-webhook-listed.png`](screenshots/11-webhook-listed.png)

## Result

| Resource | Value |
|----------|-------|
| Webhook ID | **101618** |
| Callback URL | `https://www.lancerwise.com/api/lemonsqueezy/webhook` |
| Events subscribed | 13 (all listed below) |
| Signing secret | 40-char hex, **stored locally only** at `/tmp/ls_webhook_secret.txt` (never committed) |
| Created at | 2026-05-19T05:39:31Z |

## Events subscribed (13)

- order_created
- order_refunded
- subscription_created
- subscription_updated
- subscription_cancelled
- subscription_resumed
- subscription_expired
- subscription_paused
- subscription_unpaused
- subscription_payment_success
- subscription_payment_failed
- subscription_payment_recovered
- subscription_payment_refunded

(Brief asked for 11; LS supports 13 valid event types — included all for full coverage.)

## Signing secret handling

Secret was written to `/tmp/ls_webhook_secret.txt` with `chmod 600`. Pasted directly into Vercel via REST API in Phase 5. NOT committed anywhere in this evidence dir or codebase.
