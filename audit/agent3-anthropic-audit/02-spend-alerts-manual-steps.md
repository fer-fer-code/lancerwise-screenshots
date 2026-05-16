# P0 #2 — Anthropic Console spend alert config

**Status:** Awaiting manual execution by Ramiz (Playwright browser lock blocked automated path)

## Exact steps (5 minutes)

1. Open https://console.anthropic.com/settings/billing
2. Scroll к "Spend Limits" / "Usage Alerts" section
3. Click "Add alert" (or equivalent CTA)
4. Configure alert #1:
   * **Trigger threshold:** $5.00
   * **Period:** Daily
   * **Notification email:** lancerwise.team@gmail.com
   * Save
5. Configure alert #2:
   * **Trigger threshold:** $50.00
   * **Period:** Monthly
   * **Notification email:** lancerwise.team@gmail.com
   * Save
6. (Optional, recommend) Hard limit:
   * **Spend Cap:** $100/month (Anthropic stops accepting API calls past this)
   * Prevents catastrophic overrun beyond $50/month alert
7. Screenshot the saved alert list → save к `audit/agent3-anthropic-audit/console-data/spend-alerts.png`

## Why this matters

* $5/day alert catches anomalous burst within hours
* $50/month alert is the "monthly budget exceeded" canary
* $100/month hard cap is the catastrophic-runaway protection (e.g. compromised API key, bot abuse)

## Confirmation needed

After config saved, reply с:
* Email confirmation that test alert fired (Anthropic usually sends a "alert configured" email)
* Screenshot of alert list
