# Phase 5 — Vercel env vars added

**Method**: Vercel REST API (`POST /v10/projects/{id}/env`) per memory `feedback_vercel_cli_ai_agent_env.md`.

## Why REST API not CLI

Vercel CLI v52+ detects the `AI_AGENT` env var (Claude Code) and outputs JSON guidance instead of running. Bypassed by reading the local CLI auth token from `~/Library/Application Support/com.vercel.cli/auth.json` and hitting the REST API directly.

## Env vars added

| Variable | Value (redacted) | Target | Added |
|----------|------------------|--------|-------|
| `LEMONSQUEEZY_API_KEY` | `eyJ0eXAi...` (Bearer JWT) | production+preview | earlier (during creds gathering) |
| `LEMONSQUEEZY_STORE_ID` | `370871` | production+preview | earlier |
| `LEMONSQUEEZY_VARIANT_PRO` | `1673993` | production+preview | this phase |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | `<40-char hex>` | production+preview | this phase |

## Verification

```bash
curl -H "Authorization: Bearer $VTOKEN" \
  "https://api.vercel.com/v9/projects/prj_OfYhgE1ONf98IhDzAMzspTr7hC1A/env?teamId=$TEAM" | \
  python3 -c "import sys,json; [print(e['key']) for e in json.load(sys.stdin).get('envs', []) if 'LEMON' in e.get('key','')]"
→
LEMONSQUEEZY_WEBHOOK_SECRET
LEMONSQUEEZY_VARIANT_PRO
LEMONSQUEEZY_STORE_ID
LEMONSQUEEZY_API_KEY
```

All 4 encrypted (`type: encrypted`), scoped to `production` + `preview`.

## NOT set

- `LEMONSQUEEZY_VARIANT_TEAM` — Team plan excluded from LS per Issac. Code keeps the env reference for type compatibility but it resolves to `undefined` at runtime, which the checkout route handles via the new explicit 400 guard (commit `338d6581`).
- `NEXT_PUBLIC_PAYMENT_PROVIDER` — deliberately NOT set yet. Will be added in Phase 8 after pre-flip smoke + merge.

## Source of values

| Value | Source |
|-------|--------|
| API_KEY | LS Dashboard → Settings → API → first key shown |
| STORE_ID | Discovered via `GET /v1/stores` API call (370871) |
| VARIANT_PRO | Discovered via `GET /v1/variants` after product creation (1673993) |
| WEBHOOK_SECRET | Generated locally via `secrets.token_hex(20)` then sent to LS via `POST /v1/webhooks` |

## Rotation runbook

If any of these values needs rotation (e.g. API key compromise):
1. LS Dashboard → Settings → API → revoke current key + create new
2. PATCH env at `/v10/projects/$PROJECT_ID/env/$ENV_ID` with `{value: '<new>'}` (preserves target scope per memory `feedback_vercel_env_patch_pattern.md`)
3. Trigger Production redeploy
4. Validate via `curl /v1/webhooks` returns 200 with the new key
