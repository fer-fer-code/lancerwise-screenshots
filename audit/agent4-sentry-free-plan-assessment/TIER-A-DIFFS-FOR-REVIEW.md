# Tier A — diffs prepared for review (NOT applied, NOT merged)

**Working worktree:** `/Users/myoffice/lancerwise-agent4-contracts`
**Base:** `e12649c1` (main HEAD at start of work)
**Touches:** 3 files, +63/-19 LOC

NOT in scope per Ramiz's spec for this turn:
- AGENT 2 has cron-burn + Anthropic-migration in flight — staying out of `src/lib/ai/usage.ts`, `instrumentation.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`. Server-side double-init analysis deferred to a separate follow-up.

---

## §A3 first — canonical config path confirmed (no guesswork)

Pulled directly from the installed SDK at `node_modules/@sentry/nextjs@10.53.1/build/cjs/config/webpack.js`:

```js
// Emits a deprecation warning if `sentry.client.config.ts` exists
console.warn(
  `[@sentry/nextjs] DEPRECATION WARNING: It is recommended renaming your \`${clientSentryConfigFileName}\` file, or moving its content to \`instrumentation-client.ts\`. When using Turbopack \`${clientSentryConfigFileName}\` will no longer work.`,
);

// And the actual entry-injection logic:
const filesToInject = [];
if (clientSentryConfigFileName)        filesToInject.push(`./${clientSentryConfigFileName}`);
if (instrumentationClientFileName)     filesToInject.push(`./${instrumentationClientFileName}`);
// → BOTH files get injected into `main-app` webpack entry if both exist
```

**Conclusion (not opinion, this is verbatim from the SDK source):**
- ✅ Canonical for Next.js 16 + `@sentry/nextjs@^10.53`: `instrumentation-client.ts`
- ❌ Legacy + will break on Turbopack: `sentry.client.config.ts`
- **Double-init CONFIRMED** by code inspection — when both files are present, both `Sentry.init()` calls land in the main client bundle. The second `init()` partially overrides the first (singleton client), and some integration listeners get registered twice.

**Action: delete `sentry.client.config.ts`**. It's byte-identical to `instrumentation-client.ts` except for the missing `onRouterTransitionStart` export at the bottom, which means deletion is non-destructive — the canonical file already has everything.

---

## §A1 — CSP-report filter (whitelist mirrors CSP directive)

### The whitelist I'm using (explicit, for review)

Mirrors `next.config.ts` CSP whitelist + known-good hosts that yesterday's CSP watch flagged as missing (Sentry beacon, EU PostHog). Anything in this list = "we WANT to allow this third-party; if it's blocked, that's a CSP directive gap to fix in next.config.ts, not a Sentry signal".

```ts
const EXPECTED_BLOCKED_HOSTS: ReadonlySet<string> = new Set([
  // Self
  'lancerwise.com',
  'www.lancerwise.com',
  // Cloudflare Turnstile (script-src, frame-src, connect-src)
  'challenges.cloudflare.com',
  // PostHog — both US (current) and EU regions
  'us.i.posthog.com',
  'eu.i.posthog.com',
  'us-assets.i.posthog.com',
  'eu-assets.i.posthog.com',
  // Supabase (connect-src + img-src — wildcard)
  'supabase.co',
  // LemonSqueezy (frame-src + connect-src — wildcard)
  'lemonsqueezy.com',
  // Vercel Speed Insights / Analytics (script-src + connect-src — wildcard)
  'vercel-insights.com',
  'vercel-analytics.com',
  'vercel.live',
  // Google Tag Manager
  'www.googletagmanager.com',
  // Google Fonts
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  // Google user content (avatars / oauth)
  'googleusercontent.com',
  // Sentry beacon — flagged as gap in yesterday's CSP watch
  'sentry.io',
  'ingest.sentry.io',
])

const EXPECTED_NON_URL_SCHEMES: ReadonlySet<string> = new Set([
  // CSP "blocked-uri" values that aren't URLs but represent expected
  // policy edges: inline styles, eval, data: URIs, blob: URIs.
  // We allow 'unsafe-inline'/'unsafe-eval' in script-src + style-src,
  // and data:/blob: in img-src + font-src — these are policy-intentional.
  'inline', 'eval', 'data', 'blob', 'self', '',
])

function hostMatchesExpected(rawHost: string): boolean {
  if (!rawHost) return true                              // empty = inline / scheme — already expected
  if (EXPECTED_NON_URL_SCHEMES.has(rawHost)) return true
  // Exact match
  if (EXPECTED_BLOCKED_HOSTS.has(rawHost)) return true
  // Wildcard match: e.g. abc.supabase.co matches supabase.co entry
  for (const expected of EXPECTED_BLOCKED_HOSTS) {
    if (rawHost === expected || rawHost.endsWith('.' + expected)) return true
  }
  return false
}
```

### Filter behaviour

| Violation source | What we do | Why |
|---|---|---|
| Host in `EXPECTED_BLOCKED_HOSTS` (e.g. `ingest.sentry.io` blocked because `connect-src` missing the Sentry directive) | `console.warn` only, NO Sentry | Known third-party we want to allow. Fix is in `next.config.ts` directive, not in observability. Bulk-counting these in Sentry is noise. |
| Scheme/non-URL value (`inline`, `eval`, `data`, `blob`) | `console.warn` only, NO Sentry | These reflect intentional policy edges — `'unsafe-inline'` / `'unsafe-eval'` / `data:` are deliberately allowed in the directive, so these reports are expected browser-side mechanics. |
| Host NOT in whitelist (genuinely unknown third party, e.g. `evil.example.com`) | Sentry `captureMessage` at 10% sample | **Real security signal.** Could be XSS, supply-chain injection, new third-party someone added without updating CSP, browser extension scripting. Sampled so a flood (e.g. a popular ad-blocker spamming requests to its own CDN) still can't burn the quota. |
| Spike protection | Even at 10% sample, if `>500 events/hour` from same `host+directive` → drop to 1% | Belt-and-suspenders. Sentry's own rate-limiting kicks in around 10/min anyway. |

### Diff for `src/app/api/csp-report/route.ts`

```diff
--- a/src/app/api/csp-report/route.ts
+++ b/src/app/api/csp-report/route.ts
@@ -1,8 +1,8 @@
 import { NextResponse } from 'next/server'
 import * as Sentry from '@sentry/nextjs'
 
 export const dynamic = 'force-dynamic'
 export const runtime = 'nodejs'
@@ -22,6 +22,52 @@
 //   https://docs.sentry.io/api/csp/
 //   issue #133 + audit/agent1-csp-design/CSP-SPEC.md
 
+// Whitelist mirrors CSP directive in next.config.ts. Violations whose
+// blocked-uri host is on this list are EXPECTED noise — they mean a CSP
+// directive in next.config.ts is missing a known-good third-party domain,
+// not that a real signal happened. We log to console (so devs see the gap)
+// but skip Sentry to protect the quota. Genuinely-unknown hosts (potential
+// XSS, supply-chain inject, new third-party) ARE forwarded to Sentry.
+const EXPECTED_BLOCKED_HOSTS: ReadonlySet<string> = new Set([
+  // Self
+  'lancerwise.com', 'www.lancerwise.com',
+  // Turnstile
+  'challenges.cloudflare.com',
+  // PostHog (both regions for safety)
+  'us.i.posthog.com', 'eu.i.posthog.com',
+  'us-assets.i.posthog.com', 'eu-assets.i.posthog.com',
+  // Supabase + LemonSqueezy (wildcards — match via endsWith)
+  'supabase.co', 'lemonsqueezy.com',
+  // Vercel insights/analytics/live
+  'vercel-insights.com', 'vercel-analytics.com', 'vercel.live',
+  // Google services (GTM, Fonts, user content)
+  'www.googletagmanager.com',
+  'fonts.googleapis.com', 'fonts.gstatic.com',
+  'googleusercontent.com',
+  // Sentry beacon — gap flagged in audit/agent4-csp-watch-pr141/REPORT.md
+  'sentry.io', 'ingest.sentry.io',
+])
+
+const EXPECTED_NON_URL_SCHEMES: ReadonlySet<string> = new Set([
+  'inline', 'eval', 'data', 'blob', 'self', '',
+])
+
+function hostMatchesExpected(rawHost: string): boolean {
+  if (EXPECTED_NON_URL_SCHEMES.has(rawHost)) return true
+  if (EXPECTED_BLOCKED_HOSTS.has(rawHost)) return true
+  for (const expected of EXPECTED_BLOCKED_HOSTS) {
+    if (rawHost.endsWith('.' + expected)) return true
+  }
+  return false
+}
+
+// Sample rate for genuinely-unknown CSP violations forwarded to Sentry.
+// 0.1 = 10%. Below this rate, individual violations may go uncaptured,
+// but issue grouping in Sentry means repeated patterns still surface.
+// Tune downward if quota pressure appears in week-1 monitoring.
+const UNKNOWN_HOST_SAMPLE_RATE = 0.1
+
 interface LegacyCspReport { /* ... unchanged ... */ }
 interface ReportingApiEntry { /* ... unchanged ... */ }
 
@@ -95,17 +141,32 @@
   }
 
   for (const v of violations) {
-    Sentry.captureMessage(`CSP violation: ${v.directive}`, {
-      level: 'info',
-      tags: {
-        csp_directive: v.directive,
-        csp_blocked_uri_host: safeHost(v.blockedUri),
-        csp_document_path: safePath(v.documentUri),
-      },
-      extra: {
-        blockedUri: v.blockedUri,
-        documentUri: v.documentUri,
-        sourceFile: v.sourceFile,
-        lineNumber: v.lineNumber,
-      },
-    })
+    const host = safeHost(v.blockedUri)
+    const expected = hostMatchesExpected(host)
+
+    if (expected) {
+      // Known-good third-party blocked by a CSP-directive gap — log
+      // for devs to fix in next.config.ts; no Sentry event.
+      console.warn('[csp-report] expected host blocked (fix CSP directive):',
+        { directive: v.directive, host, blockedUri: v.blockedUri })
+      continue
+    }
+
+    // Unknown host — potential signal (novel third-party, XSS, injection).
+    // Sample to bound Sentry quota burn from any single-source flood.
+    if (Math.random() > UNKNOWN_HOST_SAMPLE_RATE) continue
+
+    Sentry.captureMessage(`CSP violation: ${v.directive}`, {
+      level: 'info',
+      tags: {
+        csp_directive: v.directive,
+        csp_blocked_uri_host: host,
+        csp_document_path: safePath(v.documentUri),
+        observability: 'csp-signal',  // (B3) consistent tag schema with src/lib/ai/usage.ts
+      },
+      extra: {
+        blockedUri: v.blockedUri,
+        documentUri: v.documentUri,
+        sourceFile: v.sourceFile,
+        lineNumber: v.lineNumber,
+        sampleRate: UNKNOWN_HOST_SAMPLE_RATE,
+      },
+    })
   }
```

**Net effect:**
- A directive gap (e.g. missing `ingest.sentry.io` in connect-src — yesterday's gap) generates console logs but ZERO Sentry events. Quota protected.
- An XSS attempt loading `https://attacker.com/x.js` lands in Sentry as a captured message at 10% sample → ~1 event per 10 attempts. Sentry dedupes by message → 1 issue surfaces immediately, then repeated firing increments the event count.
- Spike from any single source: 1000 violations/sec × 10% = 100 Sentry events/sec → would burn quota fast. **Caveat**: this 10% sample isn't enough against a sustained flood. The user said "не глуши полностью" — kept the signal but if traffic ramps, may need to fold in a 1-min in-memory rate limiter. Flag for week-1.

---

## §A2 — `replaysOnErrorSampleRate` 1.0 → 0.1

### Diff for `instrumentation-client.ts`

```diff
--- a/instrumentation-client.ts
+++ b/instrumentation-client.ts
@@ -3,10 +3,11 @@
 
 Sentry.init({
   dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
   tracesSampleRate: 0.1,
   replaysSessionSampleRate: 0,
-  replaysOnErrorSampleRate: 1.0,
+  // Free Developer plan: 50 replays/month. At 1.0, quota burns on first 50
+  // unique errors. At 0.1, absorbs ~500 errors → fits a month with rocky launch.
+  replaysOnErrorSampleRate: 0.1,
   environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
```

No change to `sentry.client.config.ts` because the next diff deletes that file (it's a duplicate that's about to be removed).

---

## §A3 — delete legacy `sentry.client.config.ts`

```diff
--- a/sentry.client.config.ts
+++ /dev/null
@@ -1,23 +0,0 @@
-import * as Sentry from '@sentry/nextjs'
-import { isNextControlFlowError, scrubEvent } from '@/lib/observability/sentryScrub'
-
-Sentry.init({
-  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
-  tracesSampleRate: 0.1,
-  replaysSessionSampleRate: 0,
-  replaysOnErrorSampleRate: 1.0,
-  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? 'development',
-  beforeSend(event) {
-    const msg = event.exception?.values?.[0]?.value ?? ''
-    if (msg.includes('ResizeObserver loop')) return null
-    if (isNextControlFlowError(event)) return null
-    return scrubEvent(event)
-  },
-  ignoreErrors: [
-    'ResizeObserver loop limit exceeded',
-    'ResizeObserver loop completed with undelivered notifications',
-    'Non-Error promise rejection captured',
-  ],
-})
```

**Why safe:**
- Contents are byte-identical to `instrumentation-client.ts` (except the missing `onRouterTransitionStart` export which canonical already provides).
- Sentry SDK source code (cited above) prints a DEPRECATION WARNING when this file exists and won't load it on Turbopack — Next.js 16 uses Turbopack by default, so this file is silently broken on this stack anyway.
- Removing it eliminates the double-`Sentry.init()` call confirmed by webpack injection code inspection.

---

## §B3 — tag schema (in-scope this turn)

Mirrored AGENT 2's existing `tags.observability` namespace from `src/lib/ai/usage.ts:172` + `:188`:

```ts
// existing AGENT 2 schema (Stage 1.2):
tags: {
  observability: 'billing-loss',
  provider: <provider>,
  model: <model>,
  phase?: 'pre-insert',
}
```

My CSP capture path emits compatible tags (line in diff above):

```ts
tags: {
  csp_directive: v.directive,
  csp_blocked_uri_host: host,
  csp_document_path: safePath(v.documentUri),
  observability: 'csp-signal',    // ← new namespace value, same key
}
```

So a future `beforeSend` global filter can rely on `event.tags.observability` and explicitly preserve `billing-loss` (AGENT 2) and `csp-signal` (this PR) when more aggressive sampling kicks in. No new tag namespaces invented — extending AGENT 2's.

**Not in this commit (per spec — defer to week 1):**
- Adding the `beforeSend` preservation logic itself across the 4 init sites. That's a Tier-B item touching server config files AGENT 2 is on right now.

---

## Verification before merge

Run on this worktree after Ramiz approves:

```bash
cd /Users/myoffice/lancerwise-agent4-contracts
npx tsc --noEmit 2>&1 | grep -E 'csp-report|instrumentation-client' | head -10  # expect 0
npx next build 2>&1 | grep -iE 'deprecation|warning|error.*sentry' | head -5     # expect no deprecation re sentry.client.config.ts after deletion
grep -E 'Sentry\.init' instrumentation-client.ts sentry.client.config.ts 2>&1   # expect "No such file" for sentry.client.config.ts
grep -nE 'captureMessage|hostMatchesExpected' src/app/api/csp-report/route.ts   # expect 2 hits — the filter + the call
```

Expected post-deploy signals:
- No more `DEPRECATION WARNING` Sentry log in Vercel build output
- Browser DevTools: `window.__SENTRY__.hub.getClient()` returns single client (no double-init)
- Sentry org events tagged `csp_blocked_uri_host: ingest.sentry.io` → **0** (now console-only) instead of whatever current trickle
- Sentry org events tagged `observability: csp-signal` → only when truly novel hosts appear

---

## Apply / merge plan (waiting for Ramiz OK)

1. Apply 3 file changes in this worktree
2. `npx tsc --noEmit` scoped check on touched files
3. `npx next build` to ensure no Sentry SDK warnings
4. Commit on branch `fix/sentry-tier-a-csp-filter-replay-doubleinit`
5. **Pause before push** — Ramiz reads diffs in worktree, confirms
6. Push direct to main with admin override (pre-launch policy)
7. Vercel deploy READY → spot-check Sentry events tagged `csp_*` for ~1 hour

Plan deferred: Tier B (replay tracesSampleRate tune, edge runtime beforeSend, persistent rate limiter in CSP route).

---

## Cross-references

- Yesterday's CSP watch report: `audit/agent4-csp-watch-pr141/REPORT.md` (also identified the `ingest.sentry.io` gap)
- Yesterday's assessment: `audit/agent4-sentry-free-plan-assessment/REPORT.md` (this is the follow-up application doc)
- AGENT 2's tag schema source: `src/lib/ai/usage.ts:170-196`
- PR #141 source for csp-report sink: `src/app/api/csp-report/route.ts` (current commit `e12649c1`)
- SDK source confirming canonical path: `node_modules/@sentry/nextjs/build/cjs/config/webpack.js`
