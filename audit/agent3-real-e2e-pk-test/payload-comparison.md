# Real LS payload vs simulated payload — structural comparison

Compares the actual `subscription_created` payload that LemonSqueezy delivered to our preview webhook during the real test-mode purchase against the simulated payload we used in the earlier signed-payload E2E.

## Both payloads use the same handler

Source: `src/app/api/lemonsqueezy/webhook/route.ts` — interface `LemonSubscriptionAttrs`. Both payloads were HMAC-verified + handler ran successfully + DB writes happened.

## Fields used by our handler (matching)

| Field | Simulated | Real LS | Match? |
|-------|-----------|---------|--------|
| `meta.event_name` | `'subscription_created'` | `'subscription_created'` | ✅ |
| `meta.custom_data.user_id` | `'<test user UUID>'` | `'773c4735-43b9-4e11-b9cb-2dc5e928626c'` | ✅ same structure |
| `data.id` | `'e2e-test-sub-...'` | `'2168408'` | ✅ string type |
| `data.type` | `'subscriptions'` | `'subscriptions'` | ✅ |
| `attributes.store_id` | `370871` | `370871` | ✅ |
| `attributes.customer_id` | `9999001` | `8758978` | ✅ integer type |
| `attributes.product_id` | `1067890` | `1068025` | ✅ integer type |
| `attributes.variant_id` | `1673993` | `1674166` | ✅ integer type |
| `attributes.status` | `'active'` | `'active'` | ✅ |
| `attributes.cancelled` | `false` | `false` | ✅ |
| `attributes.trial_ends_at` | `null` | `null` | ✅ |
| `attributes.renews_at` | ISO timestamp | `'2026-06-19T07:39:48.000000Z'` | ✅ |
| `attributes.ends_at` | `null` | `null` | ✅ |
| `attributes.created_at` | ISO timestamp | `'2026-05-19T07:39:50.000000Z'` | ✅ |
| `attributes.updated_at` | ISO timestamp | `'2026-05-19T07:39:56.000000Z'` | ✅ |

**All 14 fields our handler reads via `LemonSubscriptionAttrs` interface match between simulated and real payloads.**

## Fields present in REAL but NOT in simulated (extra metadata)

These LS-side fields exist in the real payload but our handler doesn't currently use them. Could enable future features:

| Field | Real value | Potential use |
|-------|------------|---------------|
| `attributes.urls.customer_portal` | `https://lancerwise.lemonsqueezy.com/billing?...&signature=...` | Surface in /billing UI for self-service (per code-gap #4) |
| `attributes.urls.update_payment_method` | `https://lancerwise.lemonsqueezy.com/subscription/.../payment-details` | Update card link |
| `attributes.urls.customer_portal_update_subscription` | Self-explanatory | Subscription tier change |
| `attributes.user_name` | `'Real E2E Test'` | Display name in subscription state UI |
| `attributes.user_email` | `'lancerwise-real-e2e-...@wshu.net'` | Receipt copy |
| `attributes.card_brand` | `'visa'` | Show "•••• 4242 (Visa)" in /billing |
| `attributes.card_last_four` | `'4242'` | Same |
| `attributes.payment_processor` | `'stripe'` | Internal — LS uses Stripe under the hood |
| `attributes.product_name` | `'Pro'` | Display |
| `attributes.variant_name` | `'Default'` | Display |
| `attributes.order_id` | `8375130` | Order linkage |
| `attributes.order_item_id` | `8305329` | Line item ID |
| `attributes.billing_anchor` | `19` (day of month) | Surface "Renews on 19th" copy |
| `attributes.status_formatted` | `'Active'` | Display version of status |
| `attributes.test_mode` | `true` | Could surface a test-mode warning if true on prod |
| `attributes.pause` | `null` | Pause metadata when paused |
| `attributes.first_subscription_item` | `{id, price_id, quantity, ...}` | Line item details |
| `data.links.self` | `https://api.lemonsqueezy.com/v1/subscriptions/2168408` | Self-link for direct API access |
| `data.relationships` | `{store, customer, order, order-item, product, variant, subscription-items, subscription-invoices}` | JSON:API hypermedia links |

## Webhook headers (real)

LS delivered the webhook with:
- `x-signature: <40-char hex>` — HMAC-SHA256 of raw body with our test webhook secret ✅ matches handler expectation
- `Content-Type: application/json`
- Plus standard delivery metadata headers

**No header structure surprises.** Our `verifySignature()` HMAC-SHA256 hex-digest timing-safe-compare logic matches LS exactly.

## Event sequence (real test purchase, 30s window)

```
07:39:58.111  order_created
07:39:58.191  subscription_created
07:39:58.634  subscription_updated   ← LS fires this within ~500ms of created
07:40:29.477  subscription_payment_success
```

vs simulated sequence (just one event manually fired):
```
subscription_created (only)
```

**Real-world insight**: LS fires `subscription_updated` immediately after `subscription_created`, even with no actual change. Our handler safely processes this idempotently (UPDATE on same row).

## Cancel flow (real)

```
07:42:20.403  subscription_updated   ← cancellation kicks off as an update
07:42:20.616  subscription_cancelled
07:42:21.012  subscription_updated   ← post-cancel state sync
```

3 events fire for a single cancellation. Handler handled all 3 without issue.

## Conclusion

**Real LS payloads structurally match our `LemonSubscriptionAttrs` interface exactly.** No handler changes needed. The simulated-payload E2E earlier was a structurally faithful approximation. The additional LS-side metadata fields present unlocked opportunities in `code-gaps.md` Gap #4 (customer portal in UI).

The "extra" metadata fields LS sends are forward-compatible: our handler ignores them via `attributes` extraction, so any LS schema additions in the future won't break us.
