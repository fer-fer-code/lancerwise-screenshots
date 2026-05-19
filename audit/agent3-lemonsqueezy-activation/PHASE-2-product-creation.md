# Phase 2 — Pro product creation

**Method**: Playwright MCP browser automation against `https://app.lemonsqueezy.com`. Session was already authenticated from earlier currency-fix task.

## Steps

1. Navigate `/products` — empty state visible. [`screenshots/01-products-list.png`](screenshots/01-products-list.png)
2. Click "+ New Product" — LS auto-creates draft product with ID 1067890. Form opens in side drawer. [`screenshots/02-product-form-empty.png`](screenshots/02-product-form-empty.png)
3. Set Name → `Pro` (via `#input_name`, React-aware value setter)
4. Set Description → `Lancerwise Pro — unlimited clients, invoices, AI features` (via `.tiptap.ProseMirror` contenteditable + InputEvent)
5. Scroll Pricing section. [`screenshots/03-pricing-section-dollar.png`](screenshots/03-pricing-section-dollar.png) — confirms `$` symbol in price input (currency fix from earlier task propagated ✓)
6. Click "Subscription" card (checkmark appears) [`screenshots/06-subscription-selected.png`](screenshots/06-subscription-selected.png)
7. Set Price per unit → `15` (now reads $15.00) [`screenshots/07-price-15.png`](screenshots/07-price-15.png)
8. **Critical default catch**: "Repeat payment every" defaulted to `1 Year` ("Customers will be charged $15.00 every year"). Changed to `Month` via vue-select keyboard pattern (focus → type "MO" → Enter) [`screenshots/08-month-selected.png`](screenshots/08-month-selected.png)
9. Verified text now reads: "Customers will be charged **$15.00 every month**" ✓
10. Click "Publish product" button → product moves to **Published** status [`screenshots/09-after-publish.png`](screenshots/09-after-publish.png)

## Result

| Resource | Value |
|----------|-------|
| Product ID | **1067890** |
| Name | Pro |
| Status | published |
| Price | $15.00 USD |
| Recurring | Monthly |
| Variant ID | **1673993** (auto-created) |
| Variant slug | `2ab113ee-7299-42aa-87c8-9f47ffd3b52b` |
| Variant status | `pending` (LS default for new variants; doesn't block checkout per docs) |

## API confirmation

```bash
curl -H "Authorization: Bearer $LS_KEY" https://api.lemonsqueezy.com/v1/products
→ "ID: 1067890 | Pro | $15.00 | published"

curl -H "Authorization: Bearer $LS_KEY" https://api.lemonsqueezy.com/v1/variants
→ "Variant ID: 1673993 | sub=True | $15.00/month | product=1067890"
```

## Browser automation learnings (captured for future)

- **TipTap rich-text editor** for Description: needs `el.textContent = '...'` + dispatch `InputEvent`, not standard form setter
- **vue-select Year→Month change**: same keyboard pattern as currency fix — `.vs__search` focus → type filter chars → Enter
- **New Product auto-creates draft**: clicking the CTA immediately POSTs and assigns an ID before form is filled. URL changes to `/products/<id>`.

## Out of scope (per Issac approval)

- Team product NOT created — LemonSqueezy excludes Team-plan MoR coverage per email
