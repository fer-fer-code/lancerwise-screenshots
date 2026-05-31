# PR #255 merged — prod-probe findings (honest)

**Date:** 2026-05-31 06:18-06:26 UTC
**Merge SHA:** `0044e793` (squash, standard merge, status CLEAN)
**Author verified:** `krokusstudia2@gmail.com` (Ramiz Fiziev) ✓
**Prod deploy:** `dpl_7M6K4TYstW7jE5t1252C21GnbdQv` READY на SHA `0044e793`

---

## Summary

The merge landed cleanly + Vercel deploy is READY. **But prod-probe revealed что next.config fix is overridden by a Vercel Domains platform-level redirect on `lancerwise.vercel.app`.**

The fix is technically correct AND deployed. It just doesn't change observable behavior for the `lancerwise.vercel.app` hostname specifically. Defense value remains valid for other scenarios (preview URLs, future infra changes, manually added hostnames).

---

## What I tested

| # | Test | Result | Verdict |
|---|---|---|---|
| A | `lancerwise.vercel.app/api/cron/auto-stop-timers` без `-L` | **301** к canonical | Same as pre-fix |
| B | `lancerwise.vercel.app/api/webhooks/lemonsqueezy` | **301** | Same |
| C | `lancerwise.vercel.app/api/v1/widgets` | **301** | Same |
| D | `lancerwise.vercel.app/dashboard` (sanity) | 301 к canonical | Expected |
| E | `lancerwise.vercel.app/login` (sanity) | 301 к canonical | Expected |
| F | `www.lancerwise.com/api/cron/auto-stop-timers` + secret | 200 | OK — no regression |
| G | `www.lancerwise.com/dashboard` | 307 → `/login` (auth redirect) | OK — middleware intact |

## Diagnostic — why /api/* still 301-ed

```bash
$ curl -s -v -o /dev/null https://lancerwise.vercel.app/api/foo-bar-never-existed-$(date +%s)
< HTTP/2 301 
< cache-control: public, max-age=0, must-revalidate
< location: https://www.lancerwise.com/api/foo-bar-never-existed-...
< server: Vercel
< x-vercel-id: hkg1::d5hxl-1780208731207-e42fcf612513
```

Tested unknown path (never cached) + cache-bust headers — still 301. Confirmed: NOT CDN cache.

Vercel Project Settings → Domains tab shows:

```
lancerwise.vercel.app  Valid Configuration  301 → www.lancerwise.com
```

**This is а Vercel Domains-level redirect**, configured в UI, not in code. It fires at Vercel edge BEFORE the request even reaches Next.js. My `next.config.ts` exempt cannot override this — different layer.

---

## What the fix DOES protect

Defense value remains real, just not visible at `lancerwise.vercel.app`:

1. **Preview deployment URLs** (`lancerwise-XYZ-fer-fer-codes-projects.vercel.app`) — NO platform redirect on those (they have Deployment Protection 401 instead). For an authed request с bypass, next.config fix would protect /api/* from redirect.

2. **Future Vercel infrastructure changes** — if Vercel adds another `.vercel.app` alias in the future, the fix prevents it from redirecting /api/* paths.

3. **Manually-added hostnames** — if Ramiz adds another vercel.app domain (e.g. preview environment promotion, custom alias), automatic protection.

4. **Code-level safety net** — even if Vercel Domains platform redirect is misconfigured one day и stops firing, code-level redirect would NOT silently break /api/* (the exempt remains).

---

## What this means для launch

### LemonSqueezy webhook URL configuration

**KEY:** the LemonSqueezy webhook URL configured в LemonSqueezy Dashboard must be `https://www.lancerwise.com/api/webhooks/lemonsqueezy`, NOT `https://lancerwise.vercel.app/api/webhooks/lemonsqueezy`.

- Canonical URL = no redirect = webhook arrives correctly.
- `*.vercel.app` URL = platform redirect 301 = LemonSqueezy doesn't follow redirects = silent webhook failure = lost payments / lost confirmations.

**Action item:** when wiring LemonSqueezy для launch, ensure webhook URL уже uses canonical `www.lancerwise.com`. Same goes for Stripe, future payment processors.

This task isn't blocked by #255 — just an externally-configured URL choice when Ramiz enables LemonSqueezy webhook receiver.

### Cron jobs

pg_cron Phase 2 already calls `https://www.lancerwise.com` (canonical) — no redirect issue. **Not impacted by this finding.**

---

## Verdict

- PR #255 merged correctly ✓
- Code-level fix is correct AND deployed ✓
- Observable change на `lancerwise.vercel.app` = none (platform redirect dominant)
- Defensive value preserved для preview URLs / future infra / misconfig-safety
- **Real protection for LemonSqueezy = ensure webhook URL = canonical hostname**, not vercel.app subdomain

---

## Cron monitoring update (06:26 UTC)

Confirmed scheduled fires в pg_cron so far:

| Time | Job | Result |
|---|---|---|
| 06:00 UTC | auto-stop-timers | succeeded, 200 |
| 06:05 UTC | generate-recurring-invoices | succeeded, 200 |

Next expected fires:
- 07:00 UTC: expire-proposals
- 07:02 UTC: subscription-renewals
- 07:04 UTC: milestone-reminders
- 07:06 UTC: milestone-alerts

Re-check at 07:10 UTC.

— Agent 5, 2026-05-31
