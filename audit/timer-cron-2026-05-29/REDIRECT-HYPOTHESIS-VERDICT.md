# Redirect-hypothesis verdict + stagger early-evidence

**Date:** 2026-05-30 ~08:30 UTC (~15h после stagger deploy at 2026-05-29 17:30 UTC)
**Hypothesis tested:** Vercel cron silent-drop caused by 3xx redirect (trailingSlash или middleware или next.config.ts)
**Verdict:** Hypothesis **DISPROVEN** as primary cause. But **latent risk confirmed** — recommend defensive fix.

---

## TL;DR

| Check | Status | Notes |
|---|---|---|
| (1) `trailingSlash` в next.config.ts | **NOT SET** | Next.js default = false. Cron path matches one-to-one. No redirect risk from here. |
| (2) `middleware.ts` matcher | **EXCLUDES `/api/cron/*`** | Negative lookahead `/((?!_next/static\|_next/image\|favicon.ico\|portal\|api).*)` — `api` excluded. Explicit includes are `/api/ai/*`, `/api/auth/*`, `/api/v1/*` only. Cron paths bypass middleware entirely. |
| (3) Curl 4 cron paths без `-L`, с CRON_SECRET | **www.lancerwise.com → 200** | Handlers proven healthy via canonical host. |
| (3b) Curl same paths via `*.vercel.app` host | **301 → www.lancerwise.com** | `next.config.ts:53` redirect triggers for `*.vercel.app` hosts. **Even с `x-vercel-cron: 1` header → still 301.** |
| (3c) Curl deployment URL `lancerwise-*-fer-fer-codes-projects.vercel.app` | **401** | Vercel Deployment Protection blocks external callers (real Vercel cron has internal bypass). |
| (4) **Did 301 actually break crons?** | **NO** | Post-stagger 24h evidence: 4 launch-critical crons fired (zero before). If redirect were the cause, ZERO crons would fire from any `*.vercel.app` host. Therefore Vercel scheduler uses canonical `www.lancerwise.com` — redirect не triggers. |

---

## Evidence — post-stagger fires (Observability "Last 24 hours")

**Pre-stagger 24h baseline (captured 2026-05-29 17:08 UTC):** 1 invocation total — my manual curl на `auto-stop-timers`. **0 scheduled fires.**

**Post-stagger 24h window (captured 2026-05-30 08:28 UTC, ~15h after deploy):**

| Route | Schedule | Invocations | P75 Duration | Slot type |
|---|---|---|---|---|
| `/api/cron/auto-stop-timers` | `0 6 * * *` | 1 | 960ms | Burst hour 6 → canonical |
| `/api/cron/payment-reminders` | `0 8 * * *` | 1 | 1.09s | Burst hour 8 → canonical |
| `/api/cron/invoice-reminders` | `0 9 * * *` | 1 | 1.57s | Burst hour 9 → canonical |
| `/api/cron/apply-late-fees` | `6 9 * * *` | 1 | 297ms | Stagger minute 6 |

(Last 7 days view shows same 4 crons, plus `auto-stop-timers` с 2 invocations — 2nd is my manual curl from yesterday.)

**Counter-evidence for redirect hypothesis:** apply-late-fees fired at **minute 6** (not on the hour). If redirect were systematic, the canonical slot 0 might fire (some Vercel-internal hostname handling) but minute-6 routes definitely wouldn't. They DO fire → redirect not the bottleneck.

---

## Stagger result so far — PARTIAL success

Expected to have fired by 08:28 UTC (~15h after deploy, having passed through 06:00 + 07:00 + 08:00 burst hours):

- Slot 06:xx (2 staggered crons): auto-stop-timers + generate-recurring-invoices
- Slot 07:xx (5 staggered): expire-proposals, subscription-renewals, milestone-reminders, milestone-alerts, generate-recurring-tasks
- Slot 08:xx (10 staggered): payment-reminders, contract-renewal-alerts, renewal-reminders, retainer-invoices + 6 low-priority moved
- Slot 09:xx (14 staggered): invoice-reminders, auto-invoice-reminders, late-fees, apply-late-fees, auto-invoice-retainers, renewal-alerts, viewed-invoice-digest, proposal-followup, proposal-expired-alert + 5 low-priority moved

**Actually fired (4 of expected ~17 critical):** 4/17 = ~24% success rate. Better than 0/17 (pre-stagger), но not full restoration.

**Pattern observation:** the 4 that fired are at minutes **0** and **6** (canonical hour + close к 5-min boundary). Crons at minutes 2/4/8/10/12/14/16 (deeper staggered) didn't fire.

**Working hypothesis #2:** Vercel scheduler may have **5-minute granularity** or quotas that allow some calls per 5-min window. Stagger от 0 + 6 may have landed in different windows. Stagger от 0 + 2 + 4 may have lost к queue/rate limits.

(Hypothesis #2 needs Vercel engineer telemetry to confirm — outside our visibility.)

---

## Latent risk — `next.config.ts` redirect needs defensive fix (P2)

Current state of `next.config.ts:50-56`:

```ts
{
  source: '/:path*',
  has: [{ type: 'host', value: '(?<sub>.*)\\.vercel\\.app' }],
  destination: 'https://www.lancerwise.com/:path*',
  permanent: true,
}
```

This redirects **every path** from `*.vercel.app` к canonical — including `/api/cron/*`. If Vercel's cron infrastructure ever changes hostname (Vercel platform update, alias config drift, preview-becomes-prod accident), all crons would 301 → silent fail per Vercel docs.

### Recommended defensive fix (NOT implemented — needs Ramiz OK)

```ts
async redirects() {
  return [
    // SEO canonicalisation — force any *.vercel.app host к www.lancerwise.com
    // EXCLUDES /api/* paths because:
    //   1. API routes aren't indexable, so SEO concern doesn't apply.
    //   2. Vercel cron jobs don't follow redirects (per docs); if scheduler
    //      ever hits *.vercel.app host, redirect would silently kill the job.
    //   3. External webhooks (Stripe, LemonSqueezy) hit deployment URLs
    //      и also can't follow redirects safely.
    {
      source: '/((?!api/).*)',  // ← path-level exemption for all /api/*
      has: [{ type: 'host', value: '(?<sub>.*)\\.vercel\\.app' }],
      destination: 'https://www.lancerwise.com/:path*',
      permanent: true,
    },
    // ... rest unchanged
  ]
}
```

Or alternatively, exempt only `/api/cron/*` + `/api/webhooks/*` для tighter scope:

```ts
{
  source: '/((?!api/cron/|api/webhooks/).*)',
  has: [{ type: 'host', value: '(?<sub>.*)\\.vercel\\.app' }],
  destination: 'https://www.lancerwise.com/:path*',
  permanent: true,
}
```

**Recommend Option A** (exempt all `/api/*`) — broader safety net.

---

## Honest non-overclaim

- Stagger **partial success** confirmed (4 critical fires vs 0 baseline), but **not full restoration** (~24% expected critical actually fired).
- Redirect hypothesis: **theoretically real** (curl confirms 301), but **not the active cause** (else 0 crons would fire). Recommend defensive fix as latent-risk hardening.
- Cannot fully explain why minute-0 and minute-6 fired but minute-2/4/8/10 didn't. Suspect 5-min Vercel scheduler granularity или rate-quota — Vercel engineer needed для confirmation.
- Phase 2 pg_cron prep still relevant for the 13 critical crons that haven't fired post-stagger. May trigger anyway если 24h re-check shows incomplete restoration.

---

## Recommended next actions (priority order)

1. **Update Vercel ticket #01pqHRCWQbKgYCzb** с post-stagger evidence: "stagger helped (4 critical now fire vs 0), but most staggered slots с minute 2/4/8/10 still silent — points к sub-hour rate-limit или quota in scheduler. Hostname not the cause (verified via curl on canonical vs *.vercel.app)."

2. **Defensive next.config fix** — short PR exempting `/api/*` from canonical redirect. P2 не launch-blocker, но hardens against future Vercel infrastructure changes.

3. **Continue stagger monitoring** — re-check at 24h mark (2026-05-30 17:30 UTC) for fuller picture после 10:00 + 12:00 + 16:00 UTC slots also pass.

4. **Phase 2 pg_cron trigger condition** — if 24h re-check shows still <50% restoration, proceed с migration per `PHASE-2-PG-CRON-MIGRATION.md`.

— Agent 5, 2026-05-30
