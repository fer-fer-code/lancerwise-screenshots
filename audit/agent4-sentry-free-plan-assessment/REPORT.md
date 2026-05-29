# Sentry Free Developer plan — quota assessment + reduction plan

**Status:** **DIAGNOSIS ONLY** — no config changes applied yet (per Ramiz's spec). Awaiting confirmation before applying.

---

## 1. Hard data gap I cannot close myself

The user message asked me to "вытащи фактику из Sentry-дашборда (UI или API)". I **cannot** access either:

- **No `SENTRY_TOKEN` is available** in any worktree `.env.local` or shell env. Without it I can't query `/api/0/organizations/lancerwise/stats_v2/` (the org usage endpoint), can't pull the per-category consumption breakdown, can't see what counts against what bucket.
- **The trial-end email (2026-05-28)** with the Consumption table is in Ramiz's inbox — not forwarded to me, not in any audit directory.

What I CAN do without those: read the code, read Sentry's public pricing, and reason from first principles about what Lancerwise will emit. This report does that. The **numeric verdict in §5 is conditional** on Ramiz pasting (a) the trial consumption table from the email, or (b) screenshots of the Sentry billing → usage tab. With either, I'll lock the verdict.

If Ramiz prefers programmatic monitoring instead, **provide `SENTRY_TOKEN`** (organization scope: `org:read` + `project:read` is enough; no write needed) and I'll poll `stats_v2` daily during the pre-launch window.

---

## 2. Current Sentry config — full audit

Sentry initializes in 4 places. All four read together:

### `instrumentation-client.ts` (browser, App Router)
```ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,                    // ← 10% transactions
  replaysSessionSampleRate: 0,              // ← NO always-on replays (good)
  replaysOnErrorSampleRate: 1.0,            // ← 100% of error sessions get replay (⚠️)
  beforeSend(event) {
    if (msg.includes('ResizeObserver loop')) return null
    if (isNextControlFlowError(event)) return null  // NEXT_NOT_FOUND / NEXT_REDIRECT
    return scrubEvent(event)
  },
  ignoreErrors: ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications', 'Non-Error promise rejection captured'],
})
```

### `sentry.client.config.ts` (legacy parallel client init — identical to above)
Identical config. **Likely redundant** — App Router uses instrumentation-client.ts; sentry.client.config.ts is the legacy Pages-Router pathway. Worth confirming whether Sentry SDK is initializing twice in the browser; if so, every event is captured 2×. (Sentry SDK has a deduplication integration but it's not foolproof.)

### `sentry.server.config.ts` (Node runtime)
```ts
tracesSampleRate: 0.1
// no replays (server side has none)
beforeSend: drop NEXT control flow + scrub
```

### `sentry.edge.config.ts` (Edge runtime)
```ts
tracesSampleRate: 0.1
// no beforeSend filter at all ← noise leakage risk
```

### `instrumentation.ts` (App Router register hook)
Re-initializes Sentry for both nodejs + edge runtimes. So Sentry on the server starts TWICE — once via `register()` and again via `sentry.server.config.ts` legacy bootstrap. Same possible double-init risk as the browser side.

### Sentry callsites in code
- `Sentry.captureException` — **13** call sites
- `Sentry.captureMessage` — **1** site (`/api/csp-report/route.ts:99` — see §3.1)
- `Sentry.withScope` — 0
- `Sentry.addBreadcrumb` — 1

`/api/csp-report` is the only NEW capture-message source added recently (PR #141, merged 2026-05-28). The other 13 captureException calls are pre-existing across `/api/voice/transcribe`, `/api/ai/parse`, `/api/ai/execute`, `/api/widgets/[id]` and others.

---

## 3. Top quota-eaters — ranked by risk

### 3.1 ⚠️ **CSP-report sink — newly-added, highest risk**

`src/app/api/csp-report/route.ts:99` was added 2026-05-28 by PR #141. Every CSP violation a browser reports calls `Sentry.captureMessage('CSP violation: <directive>', { level: 'info' })`.

**Why this is the #1 quota risk:**
- Sentry counts `info`-level `captureMessage` events against the **errors** bucket on Developer plan (5K/mo). Verified by Sentry docs: "Events" billed = errors + messages of any level.
- A misconfigured CSP directive (e.g. missing `eu.i.posthog.com` like I flagged in the CSP watch report yesterday, or missing `ingest.sentry.io`) generates a violation on **every page load** by every user.
- Math: 50 daily-active users × 5 violations/session × 4 sessions/day = **1,000 events/day** = **30,000/month** = **6× the entire free plan errors quota**.
- Worst case: misconfigured directive that affects every page → easily 100/min sustained = 144,000/day. Quota burned in **< 1 hour**.

**Current mitigations in code:** none. Every violation gets captured.

### 3.2 ⚠️ **`replaysOnErrorSampleRate: 1.0` — bursty risk**

Free Developer plan: **50 replays/month**. Every error event triggers a replay capture at 100%.

- First 50 unique errors → 50 replays → quota gone for the month
- After that, replays just stop being recorded (Sentry drops, doesn't error)
- Real cost: replays are bandwidth-heavy and Sentry rate-limits them aggressively even before the quota. So the worry isn't "burn budget" — it's "false sense of having replay data for diagnosis". 50 replays is essentially unusable for product work.

### 3.3 🟡 **`tracesSampleRate: 0.1` — moderate risk depending on traffic**

Sentry now bills on **spans**, not transactions. Free plan: **10M spans/month**. Typical Next.js page load → 15-40 spans. At 0.1 sampling, 100 page loads = 10 transactions sampled × 25 spans avg = 250 spans.

- 10M / 30 days = 333K spans/day = ~13K transactions/day at 25 spans each
- At 0.1 sampling that's 130K real transactions/day = ~5K daily-active users at 25 page loads each
- Pre-launch traffic is far below that. Post-launch with PostHog tracking + heavy authed dashboard with multiple widget API calls per visit, this is the slowest-rising risk but the easiest to blow past in a viral spike.

### 3.4 🟡 **Possible double-initialization** (see §2 — `sentry.client.config.ts` + `instrumentation-client.ts`)

If both client configs are running concurrently, every browser event is captured twice. Worth grep-confirming whether Sentry has a `__SENTRY__` global with `client.length === 1` on production. Quick fix is to delete the legacy `sentry.client.config.ts` if App Router is the only render path.

### 3.5 🟢 **Already-good config bits — leave alone**

- `replaysSessionSampleRate: 0` ✅ (no always-on replays — biggest free-plan trap, avoided)
- `beforeSend` drops `NEXT_NOT_FOUND` / `NEXT_REDIRECT` ✅ (Next.js fires these as exceptions internally, would otherwise be 90% noise)
- `ignoreErrors` drops 3 known classes of browser-side noise ✅
- `scrubEvent` redacts emails/cards/tokens from event payloads ✅ (compliance + quota — Sentry deduplicates more aggressively on clean payloads)

---

## 4. Proposed reduction plan (config diffs prepared, NOT APPLIED)

### Tier A — must do before launch

**A1. Filter `/api/csp-report` route** so only unexpected hosts get forwarded to Sentry. Whitelist of known-good hosts is identical to the CSP directive whitelist already in `next.config.ts`. Pseudo-diff:

```ts
// src/app/api/csp-report/route.ts
const EXPECTED_BLOCKED_HOSTS = new Set([
  // intentionally blocked or known-noisy reflections from CSP — not actionable
])
const EXPECTED_NOISE_DIRECTIVES = new Set(['plugin-types'])  // browser-specific quirks

for (const v of violations) {
  const host = safeHost(v.blockedUri)
  if (EXPECTED_BLOCKED_HOSTS.has(host)) continue
  if (EXPECTED_NOISE_DIRECTIVES.has(v.directive)) continue
  // Optional second-layer sample so even unexpected violations don't flood:
  if (Math.random() > 0.1) continue   // 10% of unexpected violations
  Sentry.captureMessage(...)
}
```

Even safer first cut: just **suspend captureMessage entirely** for 24h after merge of #141, log violations to console only, decide which patterns to capture from observed traffic. Then turn on selective capture. This is the standard pattern in CSP Report-Only rollouts.

**A2. Reduce `replaysOnErrorSampleRate` to 0.1** in `instrumentation-client.ts` and `sentry.client.config.ts`. Diff:
```diff
- replaysOnErrorSampleRate: 1.0,
+ replaysOnErrorSampleRate: 0.1,
```
50 replays/month with 1.0 sampling = quota burned on first 50 unique errors. At 0.1 we sample 10% → can absorb 500 errors before quota hit → realistically lasts a month even with rocky launch.

**A3. Delete or audit `sentry.client.config.ts`** if Sentry SDK is double-initializing. Confirm via `console.log(window.__SENTRY__)` in dev tools first. If double-init confirmed, deletion of the legacy file alone halves browser-side quota burn.

### Tier B — nice-to-have, do during week 1

**B1. Lower `tracesSampleRate` to 0.05** across all 4 init points if span volume looks elevated in first week. Pre-launch keep 0.1 for visibility.

**B2. Add `beforeSend` filter** to `sentry.edge.config.ts` for parity:
```diff
+ beforeSend(event) {
+   if (isNextControlFlowError(event)) return null
+   return scrubEvent(event)
+ },
```
Currently edge runtime emits raw NEXT_NOT_FOUND / NEXT_REDIRECT control-flow exceptions to Sentry. Probably bug-fix more than quota relief, but free.

**B3. Tag Sentry events with `billing_loss: true`** for any genuinely critical errors (payment failures, auth lockouts) — then any future `beforeSend` can ensure that tag never gets dropped by aggressive sampling. The user's instruction explicitly said "не фильтровать billing-loss tag" — set up the tag NOW so the filter has something to key off later.

### Tier C — emergency knob (do only if quota tripping)

**C1. Drop `tracesSampleRate` to 0.01** (1% of transactions). Spans budget × 10. Loss: harder to triangulate slow routes.

**C2. Add per-event-type sampler in `beforeSend`** that throws away any event already seen N times in 5 minutes (in-memory or KV-backed dedupe).

---

## 5. Verdict — conditional

Without the trial consumption numbers I can't give a binary "yes / no fits in 5K errors". But based on config + first principles:

### If §4-A1 (CSP filter) is applied before launch:
- Errors bucket: 13 captureException sites × ~10/day average = **~3,900/month** → fits 5K with margin ✅
- Spans: at 0.1 sampling + pre-launch traffic + 500 DAU post-launch = **~500K spans/day = 15M/month** → **likely 1.5× over 10M cap**, will need §4-B1 by month 1 🟡
- Replays: with §4-A2 (0.1) → 50 replays absorbs ~500 errors → fits ✅

### If §4-A1 is NOT applied:
- A single misconfigured CSP directive (e.g. `ingest.sentry.io` missing → every JS error generates a CSP violation on top of the original error) → **5K quota burned in days, not weeks** 🔴

### Honest unknowns until Ramiz provides data:
1. Real DAU forecast for launch + first month (Sentry math is linear in traffic)
2. Whether trial consumption was already brushing the cap, or was 10× under (would change which Tier the priorities sit in)
3. Whether Sentry SDK is actually double-initializing on the browser side (Tier A3 — depends on dev-tools probe)

---

## 6. Ask of Ramiz before I apply anything

Either:

**(a)** Paste the Consumption table from the trial-end email (errors, spans, replays, profile hours, logs columns for the trial period) — preferably with the daily breakdown if the table has it. With those I can compute "fits free / over by X%" exactly.

**(b)** Provide `SENTRY_TOKEN` (org scope `org:read` + `project:read`). I'll pull `stats_v2` directly, lock the numbers, and run a 7-day daily-rate watch through launch.

**(c)** Read me the trial numbers from the Sentry billing UI in chat (Settings → Subscription → Usage tab).

Whichever is fastest. After that I apply §4-A immediately, defer §4-B to week 1, keep §4-C as the emergency cord.

---

## Cross-references

- PR #141 (CSP sink): https://github.com/fer-fer-code/lancerwise/pull/141 — merged 2026-05-28T16:02:09Z, SHA `6d5a6c4d`
- CSP watch report (yesterday): `lancerwise-screenshots/audit/agent4-csp-watch-pr141/REPORT.md`
- Memory: `feedback_sentry_list_vs_issue_endpoint_release_fields.md`, `backlog_sentry_token_event_admin.md`, `backlog_sentry_feedback_widget_patch.md`
- Sentry pricing: https://sentry.io/pricing/ (Developer plan numbers — verified via public page scrape)
- Sentry stats_v2 endpoint: https://docs.sentry.io/api/organizations/retrieve-event-counts-for-an-organization-v2/
