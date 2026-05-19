# [AGENT 3] LS currency fix — SUMMARY

**Done in ~6 minutes.** Store currency changed VND → USD. Verified via both UI refresh + LS API.

## What unblocked

- `Settings → General` page has the Currency dropdown (not behind the "Switch to store" button — that button is for multi-store accounts and is a no-op for LancerWise's single store).
- vue-select component needed keyboard interaction (type `USD` → Enter), not a JS `.click()`.
- No success toast on Save — confirmed persisted via page refresh + LS REST API GET.

## Verification (authoritative)

```bash
curl -H "Authorization: Bearer <LS_KEY>" https://api.lemonsqueezy.com/v1/stores/370871
→ "attributes": { "currency": "USD", ... }
```

## Now unblocked for you

Create Pro ($15/mo USD) + Team ($39/mo USD) products + webhook (callback URL = `https://www.lancerwise.com/api/lemonsqueezy/webhook`, all 9 events). Pricing UI will now default to dollars. Then paste back:

```
VARIANT_PRO=...
VARIANT_TEAM=...
WEBHOOK_SECRET=...
```

Full report: [`REPORT.md`](REPORT.md). Screenshots: [`screenshots/`](screenshots/).
