# Sentry tail — comprehensive API testing window

**Watch start:** 2026-05-22T02:35:46Z
**Production SHA:** f27bb710a0ad3e0c65f4ea373f332ea75ae65a79 (#94 v2)
**Duration:** 60 min (40 iter × 90s)
**Goal:** any new LANCERWISE-* tagged `f27bb710` OR /api/* 5xx during the test sweep

```
iter=1 elapsed=0s now=02:35:46 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=2 elapsed=93s now=02:37:19 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=3 elapsed=185s now=02:38:51 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=4 elapsed=278s now=02:40:24 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=5 elapsed=370s now=02:41:56 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=6 elapsed=463s now=02:43:29 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=7 elapsed=556s now=02:45:02 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=8 elapsed=649s now=02:46:35 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=9 elapsed=741s now=02:48:07 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=10 elapsed=834s now=02:49:40 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=11 elapsed=927s now=02:51:13 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=12 elapsed=1019s now=02:52:45 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=13 elapsed=1111s now=02:54:17 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=14 elapsed=1204s now=02:55:50 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=15 elapsed=1296s now=02:57:22 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=16 elapsed=1388s now=02:58:54 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=17 elapsed=1481s now=03:00:27 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=18 elapsed=1573s now=03:01:59 LW5=? LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
iter=19 elapsed=1665s now=03:03:31 LW5=5 LW6=7 LW9=15 new_since_t0=0 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=20 elapsed=1760s now=03:05:06 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=21 elapsed=1853s now=03:06:39 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=22 elapsed=1945s now=03:08:11 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=23 elapsed=2038s now=03:09:44 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=24 elapsed=2130s now=03:11:16 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=25 elapsed=2222s now=03:12:48 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=26 elapsed=2315s now=03:14:21 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=27 elapsed=2407s now=03:15:53 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=28 elapsed=2499s now=03:17:25 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=29 elapsed=2592s now=03:18:58 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=30 elapsed=2684s now=03:20:30 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=31 elapsed=2777s now=03:22:03 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=32 elapsed=2869s now=03:23:35 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=33 elapsed=2961s now=03:25:07 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=34 elapsed=3054s now=03:26:40 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=35 elapsed=3146s now=03:28:12 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=36 elapsed=3238s now=03:29:44 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=37 elapsed=3331s now=03:31:17 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=38 elapsed=3425s now=03:32:51 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=39 elapsed=3518s now=03:34:24 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
  ★NEW LANCERWISE-B pri=high culprit=GET /proxy Error: Invalid UTF-8 sequence
iter=40 elapsed=3610s now=03:35:56 LW5=5 LW6=7 LW9=15 new_since_t0=1 api_iss_24h=0
```

=== tail complete ===

---

## Tail close-out summary (40/40 iter complete)

**Window:** 2026-05-22T02:35:46Z → 03:35:56Z (3,610s, ~1h)
**Production SHA throughout:** `f27bb710a0ad3e0c65f4ea373f332ea75ae65a79`
**Canaries:** LW-9 frozen at count=15 across all 40 iter; LW-6 frozen at count=7; LW-5 ticked 4 → 5 (one new `/dashboard` P95 metric_issue event — known issue #73).

### ⚠️ Anomaly caught — LANCERWISE-B (HIGH priority, new)

| Field | Value |
|---|---|
| Sentry group | `7498815846` |
| firstSeen | 2026-05-22T03:03:42Z (iter 19, ~28 min into tail) |
| lastSeen | 2026-05-22T03:34:26Z (~2 min before tail end) |
| count | **3** events |
| userCount | **3** distinct users |
| platform | javascript (but server-side: stacktrace frames=0, server runtime) |
| isUnhandled | true |
| priority | high |
| release | `f27bb710` (current production) ✅ tagged correctly |
| transaction | `GET /proxy` |
| Exception | `Error: Invalid UTF-8 sequence` |
| Breadcrumbs | fetch calls to `https://desired-quetzal-124604.upstash.io/pipeline` (Upstash Redis serverless endpoint) |

**Source investigation:** no `/proxy` route exists in `src/app/api/`, `src/app/`, `src/middleware.ts`, `next.config.ts` (rewrites/redirects), or `vercel.json`. The transaction name almost certainly originates from a third-party SDK — most likely `@upstash/redis ^1.38.0` or `@upstash/ratelimit ^2.0.8` (both in `package.json`), which internally name their HTTP pipeline calls.

**Hypothesis:** an Upstash Redis pipeline response contained bytes that JSON parse couldn't decode as UTF-8 — rare upstream edge case. Affects rate-limit / cache code paths on the server. 3 distinct users hit it during the 1h window.

**Surfaced to Ramiz at 03:36Z** via Telegram. Not launch-blocking by itself (count=3 across 1h, ~3 users — small impact), but warrants a P1 issue file once dev team can investigate.

### Final canary status

| Canary | Baseline | Post-tail | Verdict |
|---|---|---|---|
| LW-9 (TypeError /work/time) | count=15 / lastSeen=2026-05-21T01:17:22Z | **unchanged** | ✅ widget defense holds |
| LW-6 (profiles N+1 /settings) | count=7 / lastRelease=`2be51f08` | **unchanged** | ✅ v2 fix holds; profiles N+1 did NOT re-fire on `f27bb710` |
| LW-A (time_entries N+1 /work/time) | count=3 / frozen | **unchanged** | ✅ |
| LW-5 (metric_issue /dashboard P95) | count=4 | **5 (+1)** | ⚠️ /dashboard p95 still > 3s — known issue (GH #73), metric alert firing correctly |
| LW-B (NEW) | n/a | **count=3, userCount=3** | ⚠️ **HIGH new issue — surfaced** |
| `/api/*` issues 24h | 0 throughout | 0 throughout | ✅ |

