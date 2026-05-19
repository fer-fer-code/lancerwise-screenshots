# [AGENT 3] LemonSqueezy currency change — VND → USD

**Date**: 2026-05-19
**Store**: LancerWise (ID 370871)
**Method**: Playwright MCP browser automation + LS REST API verification

## Result

**SUCCESS — store currency changed from `VND` (Vietnamese Dong) to `USD` (US Dollar). Verified via both UI reload + LS API GET response.**

## What was wrong

Store was created with default currency `VND` (Vietnamese Dong) because the seller country was set to VN during account creation. All product prices would have defaulted to VND otherwise — would have made the LancerWise pricing strategy (Pro $15, Team $39) nonsensical without explicit USD override per-variant.

## Steps taken

| # | Action | Result |
|---|--------|--------|
| 1 | Verified Playwright MCP alive (navigated example.com) | ✅ Alive |
| 2 | Switched to existing LS tab (Ramiz already logged in) | ✅ Already authed |
| 3 | Navigated to `https://app.lemonsqueezy.com/settings/general` | ✅ Found Currency field |
| 4 | Clicked vue-select `.vs__search` input + typed "USD" | ✅ Dropdown filtered to "USD - US Dollar" |
| 5 | Pressed Enter to select | ✅ Dropdown shows "USD - US Dollar" |
| 6 | Clicked "Save changes" button (top right) | No visible toast, but state persisted |
| 7 | Refreshed page | Currency still shows "USD - US Dollar" ✅ |
| 8 | API verification: `GET /v1/stores/370871` | Response: `Currency: USD` ✅ |

## Findings

### F1 — "Switch to store" button (the one Ramiz reported broken)

Confirmed not relevant to currency. That button is for switching between multiple stores in a multi-store account. LancerWise has only one store, so the button is effectively a no-op. Currency setting lives on `/settings/general`, not behind that button.

### F2 — vue-select component requires keyboard interaction

The native HTML `<select>` was wrapped in a Vue Select component (`v-select`). Calling `.click()` via JS doesn't open it reliably. The working pattern: focus `.vs__search` input → press characters (`U`, `S`, `D`) to filter options → press `Enter` to select. Used by Playwright keyboard API.

### F3 — Save button gives no visible toast

The "Save changes" button click silently persists. No success toast appeared. Verified state via:
- Page refresh: dropdown still shows USD
- LS REST API call: `attributes.currency = "USD"`

This is a minor UX wart on LS side, not a bug for us.

### F4 — Store country still VN

`country: "VN"` remains. This is fine — country and currency are independent fields in LS. Country affects identity verification + tax handling; currency affects pricing UI defaults. USD pricing with VN country works for global LancerWise customers.

## Verification artifacts

### LS REST API response (truncated)

```json
{
  "data": {
    "id": "370871",
    "attributes": {
      "name": "LancerWise",
      "currency": "USD",
      "country": "VN",
      "is_test_mode": null
    }
  }
}
```

### Screenshots

| File | Subject |
|------|---------|
| [`01-stores-list.png`](screenshots/01-stores-list.png) | `/settings/stores` — LancerWise visible |
| [`02-after-store-click.png`](screenshots/02-after-store-click.png) | User menu opened by top-right LancerWise button (not the currency path) |
| [`03-settings-general-vnd-found.png`](screenshots/03-settings-general-vnd-found.png) | `/settings/general` page (currency was VND before fix) |
| [`04-currency-dropdown-usd-option.png`](screenshots/04-currency-dropdown-usd-option.png) | vue-select dropdown filtered to "USD - US Dollar" after typing |
| [`05-usd-selected-before-save.png`](screenshots/05-usd-selected-before-save.png) | "USD - US Dollar" selected in field, before Save click |
| [`06-after-save.png`](screenshots/06-after-save.png) | Page state after Save (no visible toast — verified via refresh + API) |
| [`07-products-page-empty.png`](screenshots/07-products-page-empty.png) | Products page — empty, ready for Ramiz to create Pro + Team |

## Ramiz next steps (unchanged from earlier brief)

1. **Create Pro product**: $15.00 USD / month — note Variant ID
2. **Create Team product**: $39.00 USD / month — note Variant ID
3. **Create webhook**: `https://www.lancerwise.com/api/lemonsqueezy/webhook`, all 9 events → note Signing Secret
4. Paste the 3 values back; I'll add them to Vercel + merge PR #75 + flip toggle.

Currency is now correctly USD, so prices in the product creation form will default to dollars (per F1 + API confirmation).

## Files in this dir

| File | Purpose |
|------|---------|
| [`REPORT.md`](REPORT.md) | this — full steps + verification |
| [`SUMMARY.md`](SUMMARY.md) | Ramiz quick-read |
| [`screenshots/`](screenshots/) | 7 PNGs |
