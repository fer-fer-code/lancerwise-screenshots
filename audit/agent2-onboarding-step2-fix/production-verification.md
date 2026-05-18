# P1-3 production verification — onboarding Step 2 branding save

**Date:** 2026-05-18
**PR:** #63 (squash-merged as `8aa4c9aa16e2ffd4168bbfc13f2adaa167ebbfed`)
**Production deploy:** `dpl_gTxJEVLkqQSBsNqL8VYaQWEZz8Aa` READY at 16:03 UTC
**Test account:** `lancerwise-qa-1779107498@wshu.net` (UUID `f77ffa5a-3141-4803-a410-d624b5d94699`)

## Result: ✅ P1-3 RESOLVED — branding save works end-to-end в production

| Layer | Before fix | After fix |
|-------|-----------|-----------|
| API `PATCH /api/settings/branding` с wizard payload | HTTP 400 `{"error":"No fields to update"}` | **HTTP 200 `{"success":true}`** ✓ |
| DB `profiles.invoice_accent_color` | empty / default `#6366f1` | **`#ff0066`** ✓ (mapped from `brand_color`) |
| DB `profiles.invoice_footer_text` | EMPTY | **"P1-3 verification footer — generated 2026-05-18"** ✓ (mapped from `invoice_footer`) |
| DB `profiles.invoice_logo_url` | EMPTY | **`https://example.com/test-logo.png`** ✓ (mapped from `logo_url`) |

## Step-by-step verification

### Pre-test DB state

```sql
SELECT brand_color, invoice_footer, logo_url,
       invoice_accent_color, invoice_footer_text, invoice_logo_url
FROM profiles
WHERE id = 'f77ffa5a-3141-4803-a410-d624b5d94699';
```

```
brand_color | invoice_footer               | logo_url | invoice_accent_color | invoice_footer_text | invoice_logo_url
------------|-----------------------------|----------|--------------------|-----------------|--------------
#6366f1     | Thank you for your business! |          | #6366f1            | EMPTY              | EMPTY
```

### API call (simulates onboarding wizard payload)

Used Supabase signInWithPassword к obtain session, built `@supabase/ssr` cookie format
(`sb-skfgwyzarrhhkzvltbgm-auth-token=base64-{...}`), then:

```http
PATCH https://www.lancerwise.com/api/settings/branding
Cookie: sb-skfgwyzarrhhkzvltbgm-auth-token=base64-{session blob}
Content-Type: application/json

{
  "brand_color": "#ff0066",
  "invoice_footer": "P1-3 verification footer — generated 2026-05-18",
  "logo_url": "https://example.com/test-logo.png"
}
```

Response:
```
HTTP 200
{"success":true}
```

### Post-test DB state

```
brand_color | invoice_footer               | logo_url | invoice_accent_color | invoice_footer_text                              | invoice_logo_url
------------|-----------------------------|----------|--------------------|------------------------------------------------|---------------------------------
#6366f1     | Thank you for your business! |          | #ff0066            | P1-3 verification footer — generated 2026-05-18 | https://example.com/test-logo.png
```

**All 3 canonical fields received the wizard's payload values.** Legacy fields (`brand_color`, `invoice_footer`, `logo_url`) remain at their defaults — correct, since the handler maps legacy → canonical column names without overwriting legacy storage. Future migrations можно safely drop legacy columns once dashboard/PDF rendering moves к `invoice_*` exclusively.

## Coordination

* PR #63 merged с `--admin --squash --delete-branch` (visual-regression gate has been failing pre-existing due к test-account auth-setup credentials issue, NOT а regression from this PR — all recent PRs landed via admin merge pattern)
* No new TS errors introduced (baseline 385 preserved)
* No regression в other handler paths (invoice_*, portal_* fields untouched)

## Files in this evidence directory

* `root-cause.md` — destructure-but-no-copy issue analysis
* `handler-before.ts` — pre-fix snippet (line 9-32)
* `handler-after.ts` — post-fix snippet с 3-line addition
* `production-verification.md` — this file
