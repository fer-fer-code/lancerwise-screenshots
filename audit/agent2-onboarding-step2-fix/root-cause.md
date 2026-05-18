# P1-3 root cause — onboarding Step 2 save → HTTP 400

**Date:** 2026-05-18
**Fix PR:** #63
**Source:** `audit/agent3-logged-in-qa/FINDINGS.md` P1-3

## Field-name mismatch

The branding handler at `src/app/api/settings/branding/route.ts` evolved over
time. Issue #170 introduced "Invoice PDF branding" feature и added new
columns `invoice_logo_url`, `invoice_accent_color`, `invoice_footer_text`
с corresponding handler logic. The OLDER fields `logo_url`, `brand_color`,
`invoice_footer` остались в the destructure block (so they wouldn't ERROR
when older callers sent them) но were NEVER copied к the `updates` object.

Meanwhile the onboarding wizard at `src/app/(app)/onboarding/OnboardingWizard.tsx`
line 115 STILL sends the legacy field names:
```ts
body: JSON.stringify({ brand_color: brandColor, invoice_footer: invoiceFooter })
```

Result: handler receives 2 keys, destructures them, then assigns nothing к
`updates`. The `Object.keys(updates).length === 0` guard fires и returns
HTTP 400 `{"error":"No fields to update"}`. User sees red "Failed to save
branding" toast.

## Fix

Option A (chosen): map legacy names → canonical invoice_* columns в the
handler. 3-line addition. Backwards-compatible с new-name callers.

Option B (rejected): rename wizard payload к use new names. Would break
any other legacy caller (if any).

## Why Option A

The handler already destructured both name sets, so the API surface was
implicitly accepting both. Adding the legacy→canonical mapping matches
this implicit contract и avoids breaking any unknown legacy caller.
