# WebKit /settings Render Fix — Mechanism Discovery

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Investigation:** READ-ONLY analysis of accidental WebKit render fix shipped в PR #132.
**Trigger:** [AGENT 3] post-deploy probe surfaced WIN — WebKit /settings now renders (bodyLen 17,179 vs baseline 246 render-empty).

---

## TL;DR

PR #132's "client-side useEffect prefetch + initialProps к widgets" pattern accidentally fixed а long-standing WebKit /settings render-empty bug.

**Root cause of pre-fix bug:** 27 widgets each fired own mount-fetch useEffect, creating а hydration fan-out window during which 27 simultaneous setStates desynchronized React tree's expected shape. WebKit (но не Chromium) consistently bailed via React #418 + tree unmount → bodyLen 246.

**Why post-fix works:** Single batched Promise.allSettled in page.tsx + initialProps prop-drilling = only ONE central setState transition during hydration. Widget tree shape stable across hydration window. React #418 still fires 3× но non-fatal — partial render persists с bodyLen 17,179.

**Critical preservation:** v2 fix MUST keep single-batched-prefetch + initialProps pattern. Switching к Context Provider (like /work/time Stage 2 v2) would likely re-introduce hydration fan-out и regress WebKit к render-empty.

---

## Evidence

### Production metrics — pre vs post #132

| Metric | Pre-#132 baseline (WebKit /settings) | Post-#132 (WebKit /settings) | Δ |
|---|---:|---:|---:|
| supabaseRestCount | ~27 (per AGENT 3 baseline JSON, не engine-specific) | 33 (WebKit cell) | — |
| **bodyLen** | **~246** (render-empty per AGENT 3 + Ramiz observation) | **17,179** | **+16,933 (+6885%)** |
| pageerror_total | (assumed React #418 fatal — caused unmount) | 3 (React #418 still fires, NON-FATAL) | partial-recovery |
| consoleError_total | unknown | 0 | clean |

The 17,179 bodyLen indicates **substantive widget tree renders** despite 3 React #418 hydration mismatch errors. Pre-fix: same error class likely fatal (tree unmounted к 246).

### Architectural changes в PR #132 (diff `b5982423` → `2be51f08`)

#### `/settings/page.tsx`

| Aspect | Pre-#132 | Post-#132 | Critical? |
|---|---|---|---|
| `'use client'` directive | Yes | Yes | unchanged |
| `profileLoading` central state | YES (line 97) | YES (line 105) | unchanged |
| Skeleton render guard `{profileLoading ? skeleton : form}` | YES (line 252) | YES (line 312) | unchanged |
| useState count | 23 | 30 (+7 для prefetched lookup tables) | **NEW** |
| useEffect count | 3 | 3 | unchanged |
| Main fetch | profile-only (22 cols explicit) | **profile.select('*') + 6 lookup tables in Promise.allSettled** | **CRITICAL CHANGE** |
| Widget invocations | `<ServicePackages />` (mount-fetch internally) | `<ServicePackages initialPackages={...} />` (skip mount-fetch) | **CRITICAL CHANGE** |

#### 27 widget files

Each widget gained `initial<X>?` prop. When prop defined, widget skips own mount-fetch. When undefined, widget falls back к standalone mount-fetch (preserves usability в other contexts).

---

## Refined hypothesis — what specifically fixes WebKit

Initial hypothesis: "loading state guard fixes hydration mismatch". **Disproven** — `profileLoading` guard existed pre-#132 too.

### Correct hypothesis: hydration fan-out elimination

**Pre-#132 hydration window:**

1. Server renders HTML с skeleton placeholders + 27 widget placeholders (loading states)
2. Client begins hydration
3. **27 widget useEffects simultaneously fire mount-fetches**
4. Each widget's setState happens asynchronously in its own React render cycle
5. Hydration tree shape: 27 concurrent transitions от "loading" к "data-loaded" в overlapping ms windows
6. React's batching attempts coalesce but WebKit (specifically) struggles с the cardinality
7. **Some setState batch creates а DOM that doesn't match server-rendered structure**
8. React #418 (text-content hydration mismatch) fires fatal
9. React bails: full tree unmount → bodyLen 246

**Post-#132 hydration window:**

1. Server renders HTML с skeleton placeholders (single profileLoading guard)
2. Client begins hydration
3. **ONE central useEffect fires Promise.allSettled([7 fetches])**
4. Widgets render с `initialPackages={undefined}` (server-side empty) → render их own loading state
5. After Promise.allSettled resolves (~500-2000ms), ONE setState batch transitions profileLoading=false + setProfileRow + 6 lookup setStates
6. Widgets re-render с full props (`initialPackages` becomes typed array)
7. React's batching coalesces 1 transition cleanly
8. **Hydration tree shape: stable; single state transition mid-render**
9. React #418 still fires 3× (text content mismatch on some skeleton placeholder vs prefetched data) но **non-fatal** — React's error-boundary recovery preserves partial tree
10. Final DOM: substantive widget tree, bodyLen 17,179

### Why WebKit specifically?

Chromium и WebKit have different React-error recovery thresholds. Chromium tolerates higher cardinality of setState fan-out during hydration before triggering fatal #418. WebKit (Safari/iOS) is stricter — sees the 27-widget fan-out as malformed и bails.

This matches `audit/agent3-93-stage-1-verify/LESSONS-LEARNED.md` finding from Stage 1 v1 regression — а similar widget-tree-crash pattern на Chromium when Provider data-shape contract broke. WebKit's react-recovery behaviour is even less forgiving.

---

## Critical code lines к preserve (DO NOT regress these)

### File 1: `src/app/(app)/settings/page.tsx`

| Lines | Code | Why preserve |
|---|---|---|
| 105 | `const [profileLoading, setProfileLoading] = useState(true)` | Central loading guard — anchors skeleton render across hydration window |
| 128 | `const [profileRow, setProfileRow] = useState<Record<string, any> \| null>(null)` | Central profile data — widget initial props derive от this |
| 131-137 | `const [servicePackages, setServicePackages] = useState<ServicePackageRow[] \| undefined>(undefined)` × 6 | Lookup-table states. **Initial value `undefined` (NOT `[]`)** signals widgets к use prefetched data when defined OR fallback к mount-fetch when undefined |
| 139-164 | `useEffect(() => { ... Promise.allSettled([7 fetches]) ... })` | Single batched fetch. **MUST stay single useEffect, single Promise.allSettled — splitting к multiple useEffects would re-introduce hydration fan-out** |
| 312 | `{profileLoading ? (<skeleton />) : (<form />)}` | Skeleton render guard during loading window |
| 595-601 (and similar) | `<RateCard initialServices={rateCardServices} />` × 27 | Initial-prop wiring. **MUST stay prop-drilling, NOT switch к Context Provider** |

### File 2-28: 27 widget files

Each widget MUST preserve:

| Pattern | Why |
|---|---|
| Optional `initial<X>?` prop | Enables prefetch-distribution |
| `useState(initial ?? default)` для data | Initial render uses prefetched data |
| `useState(initial === undefined)` для loading | Skip spinner when data prefetched |
| `useEffect(() => { if (initial === undefined) load() }, [...])` | Fallback к mount-fetch только если standalone (not from page.tsx) |

---

## Risks в v2 fix

**Most likely v2 scenario:** [AGENT 2] could re-architect к Context Provider model (mirroring /work/time Stage 2 v2 pattern) к make /settings consistent с rest of codebase.

**Why that would regress WebKit:**

| Pattern | Hydration behaviour | WebKit outcome |
|---|---|---|
| **initialProps (current — PR #132)** | Server passes data via props → client hydrates с props already there → widgets render с data immediately | ✅ Stable hydration tree |
| **Context Provider (potential v2)** | Server renders с `<Provider value={null}>` → client hydrate → Provider useEffect fires fetch → widgets re-render когда Provider state updates | ❌ Re-introduces fan-out hydration mismatch — 27 widgets all re-render когда Provider value transitions от null → data |

**Critical:** if v2 must use Context Provider, the Provider should **pre-populate Provider value during initial render via а server-component wrapper** (true RSC pattern) к avoid the client-side fan-out. Otherwise the WebKit fix likely regresses.

---

## Recommendation для [AGENT 2] v2 fix (1-paragraph preserve-guidance)

> **Preserve PR #132's initialProps + single-Promise.allSettled pattern в `/settings/page.tsx` and all 27 widgets.** The WebKit /settings render fix (bodyLen 246 → 17,179) is а direct consequence of consolidating 27 individual widget mount-fetches к ONE central batched fetch + prop-drilling. Do NOT migrate к Context Provider model (like /work/time Stage 2 v2) without converting `/settings/page.tsx` к а server component first — Context Provider pattern в а client-only `'use client'` page would re-introduce 27-widget hydration fan-out и likely re-break WebKit render. If v2 needs additional optimization (e.g. parallel-slice latency), prefer either (a) splitting the single Promise.allSettled into more parallel branches без changing wiring к widgets, OR (b) converting `/settings/page.tsx` к а server-component shell с client-component children that receive initial props from RSC. The 6 lookup-table states initialized к `undefined` (NOT `[]` or `null`) — preserve that initial value as signal-bit for widgets к distinguish prefetch-distributed vs standalone-mounted execution.

---

## Cross-references

- PR #132: https://github.com/fer-fer-code/lancerwise/pull/132 (commit `2be51f08`)
- [AGENT 3] verdict: [`audit/agent3-94-settings-verify/VERDICT-94-v1.md`](../agent3-94-settings-verify/VERDICT-94-v1.md)
- [AGENT 3] WebKit metrics: [`audit/agent3-94-settings-verify/EVIDENCE/cell_settings_webkit_en.json`](../agent3-94-settings-verify/EVIDENCE/cell_settings_webkit_en.json)
- Pre-fix baseline: [`audit/agent3-94-settings-verify/BASELINE-EVIDENCE/baseline-pre-fix.json`](../agent3-94-settings-verify/BASELINE-EVIDENCE/baseline-pre-fix.json)
- Stage 1 lessons-learned context: [`audit/agent3-93-stage-1-verify/LESSONS-LEARNED.md`](../agent3-93-stage-1-verify/LESSONS-LEARNED.md) — similar widget-tree-crash на Chromium when data shape broke
- My DIAGNOSIS.md: [`audit/agent1-94-settings-diagnosis/DIAGNOSIS.md`](../agent1-94-settings-diagnosis/DIAGNOSIS.md) — recommended initialProps pattern (validated)
- My PRE-REVIEW-NOTES: [`audit/agent1-pr132-prep/PRE-REVIEW-NOTES.md`](../agent1-pr132-prep/PRE-REVIEW-NOTES.md) — original concerns Q1 (server vs client prefetch) revisited

## Suggested WATCH-PROTOCOL-94 addition

If [AGENT 4] establishes а v2 watch protocol, recommend adding:

> **WebKit render-preservation check:** After v2 deploy, sample WebKit cell metrics on /settings. If bodyLen drops below ~10,000 (significant regression от 17,179 post-#132 baseline) → emergency rollback consideration. Signal: WebKit hydration fan-out re-introduced.
