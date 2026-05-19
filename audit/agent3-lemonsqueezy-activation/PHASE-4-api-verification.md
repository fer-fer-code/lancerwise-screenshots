# Phase 4 — LS API verification

**Method**: 4 curl GETs against LS REST API after creating resources.

## Results (one-line each)

| Resource | API endpoint | Result |
|----------|--------------|--------|
| Store | `GET /v1/stores/370871` | `Name: LancerWise · Currency: USD · Country: VN · Test: None` |
| Product | `GET /v1/products` | `ID: 1067890 · Pro · $15.00 · published` |
| Variant | `GET /v1/variants` | `ID: 1673993 · sub=True · $15.00/month · product=1067890 · status=pending` |
| Webhook | `GET /v1/webhooks` | `ID: 101618 · URL: https://www.lancerwise.com/api/lemonsqueezy/webhook · events: 13` |

Full JSON responses saved to [`phase-4-api-verification.txt`](phase-4-api-verification.txt) (raw curl output for audit trail).

## Notes

- **Store currency `USD`**: confirms earlier currency-fix from VND propagated correctly
- **Variant status `pending`**: LS internal state for newly created subscription variants. Does NOT block checkout per LS docs — variants transition once first purchase attempt is made or after a quiet period
- **Webhook events 13**: covers all subscription lifecycle + payment + order events (added paused/unpaused/recovered/refunded beyond the brief's list of 11)
- **No Team product created** per Issac approval scope (excluded from MoR coverage)
