# Tier 4 Drift Audit — Honest Post-Tier-1+2-Ship Reality Check

**Date:** 2026-05-25
**Tester:** Agent 5 (MCP Playwright authed session as `ramiz_ddd@mail.ru`)
**Environment:** Production https://www.lancerwise.com after PRs #226 + #227 merged + Vercel deployed
**Trigger:** Ramiz showed 18 mobile screenshots demonstrating the navy/blue cast IS STILL VISIBLE on widget surfaces. My earlier "perfect" verification was wrong — I only probed `body`, `aside`, `header` and didn't audit per-widget elements. **This audit corrects that.**

## TL;DR

Tier 1+2 fixed **app chrome** (body + sidebar + header) but the **widget interiors** still render through `bg-slate-800/50` cards, `bg-slate-900` input fills, `border-slate-700` borders, and `border-dashed border-slate-600` empty-state cards. **Across 9 audited routes I counted 2,196 drift elements** in the live DOM. The plan's Tier 4 was right that this is large scope — and Ramiz's screenshots show it's not deferable for the visible result.

| Route | bg-slate-950 | bg-slate-900 | bg-slate-800 | border-slate | dashed | inputs/textareas slate | Total |
|---|---|---|---|---|---|---|---|
| `/dashboard` | 0 | 3 | 11 | 14 | 0 | 0 | **28** |
| `/settings` | 0 | **107** | **138** | **204** | 3 | many | **452 + 613 text** |
| `/work/time` | 3 | **386** | 67 | 120 | 8 | 14 inputs + 1 textarea | **584 + 339 text** |
| `/work/projects` | 0 | 2 | 5 | 11 | 0 | 0 | **18** |
| `/clients/[id]` | 1 | 50 | 47 | 98 | 3 | 5 inputs + 1 textarea | **199 + 227 text** |
| `/money/invoices` | 0 | 1 | 2 | 8 | 0 | 0 | **11** |
| `/money/expenses` | 0 | 6 | 17 | 20 | 0 | 1 input | **43** |
| `/contracts` | 0 | 0 | 1 | 0 | 0 | 0 | **1** |
| `/insights` | **10** | **116** | 45 | 57 | 1 | 3 inputs | **229 + 388 text** |

Top offenders: **/work/time** (584), **/settings** (452), **/insights** (229), **/clients/[id]** (199). These are the SEV1 fix targets.

**Critically, `/work/time` still has 3 `bg-slate-950` elements** — meaning some sub-component on that route is forcing slate-950 EVEN AFTER Tier 1's layout.tsx fix. This is a Tier 1 regression vector I missed. `/insights` has 10 bg-slate-950 too.

---

## Source-of-truth (file:line) for Ramiz's specific suspects

### Suspect 1 — Textareas with `bg-slate-900`

| File | Line | Element |
|---|---|---|
| `src/app/(app)/clients/[id]/OnboardingEmailSequence.tsx` | 242 | `<textarea>` w/ `bg-slate-900` |
| `src/app/(app)/clients/[id]/ReferralEmail.tsx` | 70 | `<textarea>` w/ `bg-slate-900/50 border-slate-700` |
| (12+ more `<textarea>` instances grep'd) | — | — |

### Suspect 2 — Input borders + fills with `bg-slate-900 border-slate-700` (~14 inputs on /work/time alone)

| File | Line | Element |
|---|---|---|
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 125, 134, 150, 162, 178 | 5 input fields |
| `src/app/(app)/snippets/page.tsx` | 190 | search input |
| `src/app/(app)/clients/[id]/ClientMoodTracker.tsx` | 114 | textarea |
| `src/app/(app)/clients/[id]/ClientNPS.tsx` | 102 | textarea |
| `src/app/(app)/clients/[id]/RetainerTracker.tsx` | 227 | textarea |
| `src/app/(app)/clients/[id]/MeetingLog.tsx` | 99, 104 | 2 inputs |

### Suspect 3 — Dashed-border cards (Plan Pro/Team + Avatar upload + empty states)

| File | Line | Visible on |
|---|---|---|
| `src/app/(app)/settings/SettingsRootClient.tsx` | 510 | Plan/Pricing cards — `border border-dashed border-slate-600 rounded-lg p-3` |
| `src/app/(app)/settings/BrandingSettings.tsx` | 128 | Avatar upload — `border-2 border-dashed border-slate-700` |
| `src/app/(app)/clients/intake/page.tsx` | 210 | Intake empty state — `border-dashed border-slate-600` |
| `src/app/(app)/clients/referral-analytics/page.tsx` | 118 | Empty state |
| `src/app/(app)/clients/[id]/SatisfactionRating.tsx` | 69 | Rating card |
| `src/app/(app)/clients/[id]/history/page.tsx` | 121 | History empty |
| `src/app/(app)/clients/[id]/communications/page.tsx` | 313 | Comms empty |
| `src/app/(app)/clients/[id]/ClientFollowUp.tsx` | 75 | Follow-up CTA |
| `src/app/(app)/clients/[id]/ClientTags.tsx` | 93 | Add tag CTA |
| `src/app/(app)/clients/pipeline/PipelineKanbanClient.tsx` | 271 | Kanban empty |
| `src/app/(app)/tasks/page.tsx` | 506 | Recurring task card |
| `src/app/(app)/tasks/recurring/RecurringTasksClient.tsx` | 629 | Empty state |
| `src/app/(app)/tools/budgets/BudgetsClient.tsx` | 149 | Budgets empty |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 408 | Template card |
| `src/app/(app)/tools/call-prep/page.tsx` | 366 | Empty state |
| `src/app/(app)/testimonials/TestimonialsManager.tsx` | 688 | Testimonials empty |
| `src/app/(app)/savings/SavingsPageClient.tsx` | 495 | Savings tier card |
| `src/app/(app)/invoices/templates/page.tsx` | 140 | Template seed card |
| `src/app/(app)/invoices/[id]/PaymentPlan.tsx` | 72 | Payment plan CTA |
| `src/app/(app)/work-log/page.tsx` | 420 | Day card |

20 dashed-card files. Replacement rule: `border-dashed border-slate-{600|700}` → `border-dashed border-subtle` (keep dashed pattern, just retint border).

### Suspect 4 — Appearance theme picker (Settings → Внешний вид)
Located in `src/app/(app)/settings/SettingsRootClient.tsx` ~line 280 area. Theme radio buttons render solid `bg-accent` when selected (verified previously — correct), but the 3-card chrome containing them uses the same `bg-slate-800/50 rounded-xl border border-slate-700 p-6` pattern as all other settings sections.

### Suspect 5 — Timezone dropdown
Located in `src/app/(app)/settings/SettingsRootClient.tsx` (Бизнес-информация section). Dropdown uses native `<select>` with class `border-slate-700 bg-slate-900` → navy fill + border.

### Suspect 6 — Email Notification rows (58 toggles)
Located in `src/app/(app)/settings/SettingsRootClient.tsx` Email Notification Preferences section. Each row is `bg-slate-800/50 rounded-xl border border-slate-700` card containing a toggle. Multiple sub-sections (Weekly Summary, Proposal Follow-up, Budget Alerts, Client Onboarding, Payment Confirmation, etc.) all reuse this pattern. **~58 rows × 1 card swap = 58 swaps in one file.**

### Suspect 7 — MobileBottomNav "More" overlay
`src/components/layout/MobileBottomNav.tsx:69`:
```
className="fixed bottom-20 left-0 right-0 mx-4 z-50 md:hidden rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden"
```
Visible when user taps "More" — overlay panel above bottom nav. **2 swaps**: `bg-slate-800` → `bg-elevated`, `border-slate-700` → `border-subtle`.

### Suspect 8 — Stripe Payments warning textarea
`src/app/(app)/settings/StripePaymentStatus.tsx`:
- Line 17: `<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">` ← outer card
- Line 79: `<div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-2">` ← inner warning panel
- Line 96: `<code className="block bg-slate-800 border border-slate-700 rounded ...">` ← code snippet
- Line 102, 111: `<code className="bg-slate-700 text-slate-300 ...">` ← inline code badges

**4 swaps in this file alone**.

---

## Top 15 files by drift count (eligible for surgical PR batches)

| Rank | File | bg-slate-8/9 count | Notes |
|---|---|---|---|
| 1 | `src/app/(app)/analytics/work-location/page.tsx` | 29 | Analytics widgets — Tier 4 batch 1 |
| 2 | `src/app/(app)/team/TeamPageClient.tsx` | 27 | Team cards |
| 3 | `src/app/(app)/invoices/new/page.tsx` | 23 | Invoice form panels |
| 4 | `src/app/(app)/time-tracker/page.tsx` | 21 | Timer card surfaces |
| 5 | `src/app/(app)/settings/SettingsRootClient.tsx` | 21 (+ 58 row pattern) | **HIGHEST PRIORITY** — affects every authed user |
| 6 | `src/app/(app)/analytics/time/page.tsx` | 21 | Analytics widgets |
| 7 | `src/app/(app)/reports/annual/AnnualReportClient.tsx` | 20 | Report sections |
| 8 | `src/app/(app)/analytics/heatmap/WorkHeatmapPage.tsx` | 20 | Heatmap shells |
| 9 | `src/app/(app)/time-tracker/analytics/page.tsx` | 19 | Time analytics |
| 10 | `src/app/(app)/skills/page.tsx` | 18 | Skill chips/cards |
| 11 | `src/app/(app)/onboarding/OnboardingWizard.tsx` | 18 | Onboarding panels — visible to new users only |
| 12 | `src/app/(app)/clients/win-back/page.tsx` | 18 | Win-back cards |
| 13 | `src/app/(app)/analytics/scope-creep/page.tsx` | 18 | Analytics widgets |
| 14 | `src/app/(app)/revenue-goals/GoalsPageClient.tsx` | 17 | Goals cards |
| 15 | `src/app/(app)/proposals/page.tsx` | 17 | Proposals list+detail |

**Bonus blast-radius signal:** `bg-slate-800/50` (the exact card pattern Ramiz objected to) has **1,465 raw occurrences in src/** per grep. That's the rough lower bound for total Tier 4 swap count.

---

## Canonical swap rules (from plan, restated for execution clarity)

| Before | After | Rationale |
|---|---|---|
| `bg-slate-800/50` | `bg-card` | card backgrounds (most common pattern) |
| `bg-slate-800` (solid) | `bg-elevated` | overlays / modals / popovers / MobileBottomNav More |
| `bg-slate-900` (when used as input/textarea fill) | `bg-canvas` | input + textarea fills |
| `bg-slate-900` (when used as card body, NOT page wrapper) | `bg-card` | misc cards |
| `bg-slate-900/50` (hover/inner overlay) | `bg-elevated/40` OR `bg-card` per context | hover lift OR nested card |
| `bg-slate-900/80` (progress bar bg) | `bg-canvas/80` OR `bg-elevated/80` | per-case |
| `border-slate-700` | `border-subtle` | default card border |
| `border-slate-700/50` | `border-subtle` | softer divider |
| `border-slate-600` | `border-line` | stronger divider |
| `border-dashed border-slate-{600,700}` | `border-dashed border-subtle` | preserve dashed style |
| `text-slate-100` | `text-primary` | primary text (out of SEV1 bg scope but couples) |
| `text-slate-300` | `text-secondary` | secondary text |
| `text-slate-400` / `text-slate-500` | `text-muted` | muted text |
| `hover:bg-slate-700/50` | `hover:bg-elevated/50` | hover lift |
| `hover:bg-slate-900/50` | `hover:bg-card/50` | nested hover |
| `bg-slate-700` (inline code badge) | `bg-card` OR keep if intentional code style | per-case |

---

## Recommended PR plan (subject to Ramiz approval)

### PR A — Settings page deep-fix (~80 swaps in 1 file + 1 dependency)
**File:** `src/app/(app)/settings/SettingsRootClient.tsx` + `src/app/(app)/settings/BrandingSettings.tsx` + `src/app/(app)/settings/StripePaymentStatus.tsx`

**Why first:** /settings has the highest user-visible drift (107 + 138 + 204 + 613 text + 3 dashed) AND every user lands here often. Single biggest visible impact.

**Estimate:** 1.5 hours surgical work (per-card visual judgment), ~80 swaps total.

### PR B — Tier 1 regression patch (~3 swaps)
**File:** TBD — need to grep `/work/time` + `/insights` source for the 3 + 10 `bg-slate-950` elements that survived my Tier 1 PR. Either a sub-component on those routes has its OWN `bg-slate-950` wrapper, OR an inline style. **MUST identify and patch — Tier 1 wasn't complete.**

**Estimate:** 15 min after finding.

### PR C — Top 5 widget-heavy routes (~120 swaps across 5 files)
- `src/app/(app)/analytics/work-location/page.tsx` (29)
- `src/app/(app)/team/TeamPageClient.tsx` (27)
- `src/app/(app)/invoices/new/page.tsx` (23)
- `src/app/(app)/time-tracker/page.tsx` (21)
- `src/app/(app)/analytics/time/page.tsx` (21)

**Estimate:** 2 hours.

### PR D — MobileBottomNav More overlay + 20 dashed-border cards (~25 swaps)
Quick win. Hits all `border-dashed border-slate-` instances surfaced above.

**Estimate:** 30 min.

### PR E+ — Long-tail per-route-group cleanup
- `src/app/(app)/clients/**` (~30 files)
- `src/app/(app)/projects/**` (~10)
- `src/app/(app)/invoices/**` (~15)
- `src/app/(app)/analytics/**` (~25)
- `src/app/(app)/tools/**` (~40)
- `src/components/**` widgets (~50)

**Estimate:** 4–6 hours incremental.

**Total Tier 4 effort:** ~8–10 hours surgical (not codemod-able per plan rationale — context-dependent swaps).

---

## Honest non-overclaim section

1. **My Tier 1+2 verification was wrong.** I probed `body`, `aside`, `header` only and called it "perfect." Ramiz's mobile screenshots prove the visible cast persists on every widget interior. The plan accurately predicted this (Tier 4 was "post-launch deferable") — but the 18-screenshot evidence shows it's not actually deferable for the visible UI quality bar.
2. **3 `bg-slate-950` on `/work/time` and 10 on `/insights`** post-Tier-1 means my Tier 1 PR did NOT cover all `bg-slate-950` in chrome paths. Need follow-up patch (PR B above).
3. **Counts are DOM-rendered elements, not source-code occurrences.** Source-code grep shows even larger lower bounds (1,465 raw `bg-slate-800/50` instances in src/). One source class can produce multiple DOM elements via maps/repeats.
4. **`text-slate-*` counts (613 on /settings, 388 on /insights) are not in SEV1 scope** per plan, but visible text-color drift compounds the perceived navy cast. Recommend coupling text swaps with bg swaps in each PR.
5. **No mobile capture for 7 of 9 pages this pass** — only /dashboard + /settings have 414×896 mobile captures. Desktop screenshots cover all 9. Mobile capture for /work/time, /clients/[id], /insights recommended in follow-up if Ramiz wants visual evidence per breakpoint.

---

## Evidence directory

`audit/agent5-tier4-drift-audit-2026-05-25/EVIDENCE/`:

| # | File | Captures |
|---|---|---|
| 01 | `audit-01-dashboard-desktop.jpeg` + `-mobile.jpeg` | /dashboard 1440×900 + 414×896 |
| 02 | `audit-02-settings-desktop.jpeg` + `-mobile.jpeg` | /settings 1440×900 + 414×896 |
| 03 | `audit-03-work-time-desktop.jpeg` | /work/time 1440×900 |
| 04 | `audit-04-work-projects-desktop.jpeg` | /work/projects 1440×900 |
| 05 | `audit-05-client-detail-desktop.jpeg` | /clients/[id] 1440×900 |
| 06 | `audit-06-money-invoices-desktop.jpeg` | /money/invoices 1440×900 |
| 07 | `audit-07-money-expenses-desktop.jpeg` | /money/expenses 1440×900 |
| 08 | `audit-08-contracts-desktop.jpeg` | /contracts 1440×900 |
| 09 | `audit-09-insights-desktop.jpeg` | /insights 1440×900 |

11 JPEGs total.

---

## Awaiting Ramiz approval

Per task spec: NO ship until Ramiz approves the plan. Recommend reviewing the PR A/B/C/D/E sequence above and choosing whether to:
- (a) Ship PR A+B as launch-critical (~2 hours surgical work)
- (b) Sequence everything pre-launch (PR A+B+C+D, ~4 hours)
- (c) Defer Tier 4 entirely and live with the cast for launch (NOT recommended per Ramiz's reaction to the 18 screenshots)
- (d) Other approach Ramiz wants

— Agent 5, 2026-05-25
