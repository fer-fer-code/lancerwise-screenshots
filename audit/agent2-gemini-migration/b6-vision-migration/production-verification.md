# B6 production verification — scan-receipt vision migration

**Date:** 2026-05-19
**PR:** #66 (squash-merged as `b180c3127e4098783c5f3538db83723cb7be5505`)
**Production deploy:** `dpl_3QbFfCNMVQZVA2RprVv7LhMpgDJh` READY at 20:07 UTC
**Test account:** `lancerwise-qa-1779107498@wshu.net` (UUID `f77ffa5a-3141-4803-a410-d624b5d94699`)

## Result: ✅ B6 RESOLVED — vision pipeline works через Gemini

| Layer | Before fix | After fix |
|-------|-----------|-----------|
| Source code Anthropic SDK | `import Anthropic from '@anthropic-ai/sdk'` + `client.messages.create({...})` | `import { generateVision } from '@/lib/ai'` |
| API call | `claude-sonnet-4-6` через Anthropic | `gemini-2.5-flash` через Google GenAI |
| `/api/ai/scan-receipt` HTTP | (last test pre-B6) 200 с Claude | **HTTP 200 с Gemini** ✓ |
| `ai_usage_log` provider | `anthropic` | **`gemini-flash`** ✓ |
| Total /api/ files на @anthropic-ai/sdk | 1 | **0** ✓ |

## Step-by-step verification

### Test image

1×1 transparent PNG (base64: `iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=`). Not а real receipt — purpose is к prove the migration пайплайн works end-to-end через Gemini's vision API. Real receipts would yield meaningful field extraction; а 1x1 transparent PNG yields the documented defaults (vendor empty, amount=0, category='Other').

### POST request

```http
POST https://www.lancerwise.com/api/ai/scan-receipt
Cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=base64-{session blob}
Content-Type: application/json

{
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mimeType": "image/png"
}
```

### First probe → HTTP 500 (Gemini free-tier quota)

```
HTTP 500 (4854ms)
Body: {"error":"ApiError: {\"error\":{\"code\":429,\"message\":\"You exceeded your current quota, please check your plan and billing details. ... Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 5, model: gemini-2.5-flash\\nPlease retry in 2.02174722s.\"
```

This 429 is а REAL Gemini API response, not а code defect. **It actually proves the migration works:**
1. Auth check passed (otherwise 401)
2. Route handler entered (otherwise 400)
3. `generateVision()` called Gemini SDK (otherwise different error)
4. Gemini returned 429 (free-tier rate limit hit by background cron just before probe)
5. Error propagated к route handler → wrapped в 500 → returned к client

The error message itself names `gemini-2.5-flash` as the model — confirming Anthropic is no longer involved.

### Second probe (30s later, after quota cooldown) → HTTP 200

```
HTTP 200 (4272ms)
Body: {"vendor":"","description":"","amount":0,"currency":"USD","date":"2026-05-18","category":"Other","tax_amount":null,"is_deductible":true}
```

Valid JSON, default fields для blank image — matches scan-receipt's documented contract.

### DB usage_log confirms

```sql
SELECT feature, provider, model, success, output_tokens, duration_ms
FROM ai_usage_log
WHERE user_id = 'f77ffa5a-3141-4803-a410-d624b5d94699'
  AND occurred_at > now() - interval '5 minutes'
ORDER BY occurred_at DESC LIMIT 3;
```

```
feature | provider     | model            | success | output_tokens | duration_ms
--------|-------------|------------------|---------|--------------|------------
other   | gemini-flash | gemini-2.5-flash | t       | 500          | 912        ← final probe (success)
other   | gemini-flash | gemini-flash     | f       | 0            | 1751       ← quota 429 (logged as failure)
other   | gemini-flash | gemini-2.5-flash | t       | 362          | 1241       ← earlier real-image attempt (success)
```

All 3 entries: **provider=gemini-flash**. Zero entries with provider=anthropic.

### Final source code inventory

```bash
find src/app/api -name "*.ts" -exec grep -l "@anthropic-ai/sdk\|new Anthropic" {} \;
→ (no output)
```

**0 files routing к Anthropic SDK.** Migration story complete.
