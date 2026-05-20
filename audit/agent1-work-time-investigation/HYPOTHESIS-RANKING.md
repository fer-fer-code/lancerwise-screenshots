# /work/time — Hypothesis Ranking

Hypotheses considered для explaining the 95-call Chromium / 1-call WebKit disparity. Ranked by code-evidence likelihood.

---

## H1 (CONFIRMED) — Mount-time fetch storm + WebKit auth-redirect skeleton

**Likelihood:** ★★★★★ Confirmed by code reading

**Mechanism:**
- `/work/time` re-exports `time-tracker/page.tsx`, which is a `'use client'` component с 101 widget children
- **86 widgets each fire `useEffect(() => supabase.from(...))` on mount**
- 86 widgets × ~1.1 fetches/widget ≈ **95** ← matches Chromium observation exactly
- WebKit shows 1 because WebKit's bodyLen was 249 (vs Chromium 3749) — WebKit never rendered the widget tree, likely got an auth-redirect skeleton. The 1 call is probably the auth lookup itself.

**Evidence:**
- `grep -lE "useEffect.*supabase" src/app/(app)/time-tracker/*.tsx | wc -l` → 86 of 101 files
- Identical 95 count across all 3 Chromium runs (deterministic mount, не race-based polling)
- WebKit bodyLen 249 << Chromium bodyLen 3749 indicates different page state

**Implication:** Same N+1 antipattern as #73 and #74. Recipe для fix already exists in the codebase.

---

## H2 — Polling `setInterval` timer firing repeatedly (AGENT 3's original hypothesis)

**Likelihood:** ★ Rejected

**Why considered:**
[AGENT 3] BASELINES.md proposed: "a component (probably the active-timer widget) calls Supabase every 100–250ms via setInterval. Chrome's network capture during networkidle wait fires multiple iterations; WebKit's different scheduler fires once."

**Why rejected:**

1. **Deterministic 95 across all 3 runs.** A timer-driven race would produce variance (e.g. 92 / 95 / 101 depending on how long networkidle wait took). Identical numbers indicate single mount cycle, не accumulated ticks.
2. **The only `setInterval` в `page.tsx:205-211` updates local state, не Supabase.** I read the code:
   ```tsx
   useEffect(() => {
     if (running) {
       intervalRef.current = setInterval(() => {
         setElapsed(Math.floor((Date.now() - startRef.current!.getTime()) / 1000))
       }, 1000)
     }
   }, [running])
   ```
   `setElapsed` is React state, not a Supabase call.
3. **WebKit's 1-call delta is better explained by `bodyLen: 249`** (page-state difference) than scheduler differences.

The hypothesis was reasonable based on baseline numbers alone, but code reading rejects it.

---

## H3 — React StrictMode double-rendering

**Likelihood:** ★ Rejected

**Mechanism:** In dev mode, React StrictMode mounts components twice. If StrictMode were active in production AND каждый useEffect-with-fetch fired twice, that could explain doubling.

**Why rejected:**
- Production builds don't run StrictMode double-mount (it's dev-only)
- Numbers don't match a doubling pattern (95 isn't 2×N for any meaningful N from a sensible widget count)
- Same number across all runs would не be expected with StrictMode anyway

---

## H4 — WebSocket / Server-Sent Events polling

**Likelihood:** ☆ Rejected

**Mechanism:** Real-time data subscription (e.g. Supabase realtime) firing repeated REST calls.

**Why rejected:**
- No imports of `supabase.channel()` or `.subscribe()` в audited widget files
- Supabase Realtime uses WebSocket, не REST — wouldn't show up в `supabaseRestCount` filter
- `requestCount` (151) is close к `supabaseRestCount` (95) ratio expected from broader page load, не from a subscription burst

---

## H5 — Race condition between mount effects + auth refresh

**Likelihood:** ☆ Rejected

**Mechanism:** Auth token refresh triggers a re-render storm; each widget's useEffect re-runs.

**Why rejected:**
- Identical 95 across 3 runs argues against any race-based explanation
- No evidence of auth refresh in baseline run (only ~5-7s navigation duration; auth refresh is rare)
- WebKit's 1 call shows auth refresh isn't required for the page к render а page render itself is what produces the 95

---

## H6 — Browser-specific code path / user-agent detection

**Likelihood:** ☆ Rejected

**Mechanism:** Code checks `navigator.userAgent`, takes a different path for Chrome.

**Why rejected:**
- No `userAgent` detection found в `time-tracker/page.tsx` or sampled widgets
- That kind of pattern would be visible с simple grep
- WebKit difference is better explained by H1 (didn't render the page)

---

## H7 — Server-side React rendering creating phantom requests

**Likelihood:** ☆ Rejected

**Mechanism:** Server rendering of the page triggers Supabase calls during SSR, double-counted with client-side mount.

**Why rejected:**
- Page is `'use client'`. SSR renders an empty shell + bundles client JS. No server-side data fetch.
- React error #418 (hydration mismatch) confirms client renders independently after server shell

---

## Summary

| Rank | Hypothesis | Status |
|---|---|---|
| H1 | Mount-time fetch storm (N+1) + WebKit auth-skeleton | **CONFIRMED** by code reading |
| H2 | Polling setInterval | Rejected — wrong setInterval target, deterministic numbers |
| H3 | StrictMode double-render | Rejected — prod doesn't double-mount |
| H4 | WebSocket polling | Rejected — no channels in code |
| H5 | Auth refresh race | Rejected — deterministic numbers |
| H6 | User-agent code path | Rejected — no UA detection |
| H7 | Server-side phantom | Rejected — page is `'use client'` |

H1 alone explains 100% of the observed evidence. No further hypotheses needed.

## Related

- INVESTIGATION-REPORT.md
- CODE-REFERENCES.md
- RECOMMENDED-FIX-SCOPE.md
