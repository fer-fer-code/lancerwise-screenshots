# Design System Inconsistency Audit — 2026-05-23

**Agent:** [AGENT 6] static codebase design-system audit
**Scope:** `/Users/myoffice/lancerwise/src/` (Next.js, Tailwind, dark-theme primary)
**Method:** static `rg` (ripgrep) / regex pattern matching, read-only
**Out of scope:**
- Per-page visual audit (see [AGENT 3])
- Email templates (per memo `backlog_email_template_html_inline_styles.md`, inline styles required)
- Confirmed light-theme pages (per memo `project_lancerwise_light_theme_audit.md`: `/analytics/forecast`, `/settings/public-profile`, parts of `/settings/*`, `/analytics/*`, `/tools/*`)
- Print views (`.print:` variants in dark pages — intentional)

---

## Summary

| Category | Severity | Total occurrences | Files affected | Notes |
|---|---|---|---|---|
| 1. Emoji-as-icon | **FAIL** | ~1,710 lines | 440 files (315 inside `app/(app)/`) | Pervasive substitute for lucide-react icons |
| 2. Color saturation | **WARN** | violet-400 alone = 1,213 hits; bright-text 400-shade dominates | 500+ files | Indigo orphan inconsistency; `text-indigo-300` (265) but `text-indigo-400` only 1 — clearly stale token |
| 3. Font weight | **PASS** | medium 3,396 / semibold 2,517 / bold 1,420 / normal 110 / black 61 / extrabold 15 / light 3 | n/a | Healthy bell curve; `font-light` (3), `font-extrabold` (15) accidental — recommend removal |
| 4. Spacing variance | **PASS-/WARN** | 12 `p-`, 12 `px-`, 16 `py-`, 12 `gap-`, 12 `space-y-` unique values | n/a | Pareto holds: top 4 carry ≥80% in all axes; outliers `py-32 ×1`, `py-14 ×1`, `gap-7 ×1`, `space-y-16 ×1` are stragglers (1-3 hits) |
| 5. Shadow / border / radius | **PASS** | 6 shadow tokens, 3 border widths, 8 rounded tokens | n/a | Within healthy bounds (3-4 shadows, 2-3 borders, 4-5 radii target); minor: `rounded-3xl` (6) + `rounded-none` (5) candidates for removal |
| 6. Light bg in dark context | **WARN** | 199 solid-light-bg lines (excluding `print:`); 18 files inside `app/(app)/` | 18 dark-theme app files | Some legit (`/settings/late-fees`, `/analytics/burn-rate` use `bg-slate-50` for inner card progress bars on dark theme — borderline acceptable) |
| 7. Inline styles vs Tailwind | **FAIL** | 32,835 `style={{` lines; ≥9,956 with hex color literals (static violation); 1,625 with template-literal interpolation (acceptable dynamic) | 420 files with hex literals; 346 inside `app/(app)/` | Wide systemic departure from Tailwind. Top file `LearningTrackerClient.tsx` has 205 inline-style attributes |

---

## Category 1 — Emoji-as-icon

**Total:** 1,710 emoji occurrences across 440 files (315 inside auth-gated `app/(app)/`).

### Top 10 offender files

| Count | File |
|---|---|
| 25 | `app/(app)/tools/client-appreciation/ClientAppreciationClient.tsx` |
| 23 | `app/(app)/tools/social-content/SocialContentClient.tsx` |
| 22 | `app/(app)/tools/icp/page.tsx` |
| 20 | `app/(app)/tools/meeting-agenda/MeetingAgendaClient.tsx` |
| 18 | `app/(app)/tools/skills/SkillsTrackerClient.tsx` |
| 16 | `app/(app)/tools/client-gifts/ClientGiftsClient.tsx` |
| 14 | `app/(app)/dashboard/command-center/CommandCenterClient.tsx` |
| 14 | `app/(app)/clients/documents/DocumentsClient.tsx` |
| 14 | `app/(app)/analytics/net-worth/page.tsx` |
| 13 | `lib/subscriptionConfig.ts` |
| 13 | `app/(app)/tools/email-reply/EmailReplyClient.tsx` |
| 13 | `app/(app)/projects/deliverables/DeliverablesClient.tsx` |
| 13 | `app/(app)/finance/expenses/ExpenseTrackerClient.tsx` |
| 13 | `app/(app)/clients/special-dates/SpecialDatesClient.tsx` |
| 13 | `app/(app)/analytics/expenses/page.tsx` |

### Sample 12 file:line locations (with classification)

```
app/(app)/dashboard/command-center/CommandCenterClient.tsx:237  // DECORATIVE (status copy ON TRACK 🟢)
app/(app)/dashboard/command-center/CommandCenterClient.tsx:314  // FUNCTIONAL (icon="🔴" prop replaces lucide)
app/(app)/dashboard/command-center/CommandCenterClient.tsx:495  // FUNCTIONAL (empty-state 📅)
app/(app)/dashboard/command-center/CommandCenterClient.tsx:731  // FUNCTIONAL (QuickActionBtn icon="🧾")
app/(app)/dashboard/command-center/CommandCenterClient.tsx:733  // FUNCTIONAL (QuickActionBtn icon="📝")
app/(app)/clients/notes/ClientNotesClient.tsx:60  // FUNCTIONAL (MEETING_TYPES map labels: '📞 Phone Call')
app/(app)/clients/notes/ClientNotesClient.tsx:304  // FUNCTIONAL (fallback icon 📝)
app/(app)/invoices/disputes/page.tsx:51  // FUNCTIONAL (option label '📦 Scope Not Delivered')
app/(app)/tools/social-content/SocialContentClient.tsx:46  // FUNCTIONAL (platform icon '💼','🐦','📸')
app/(app)/tools/icp/page.tsx:201  // DECORATIVE (🚩 flag)
app/(app)/tools/icp/page.tsx:213  // FUNCTIONAL (source icon: '💼','🟢','👥')
app/(app)/clients/notes/ClientNotesClient.tsx:60-64  // FUNCTIONAL (call: '📞', video: '🎥', in_person: '🤝')
```

### Classification

| Category | Estimated share | Action |
|---|---|---|
| **Functional** (replacing lucide icons / data map labels) | ~70% (~1,200 hits) | Migrate к `lucide-react` icon enum (1d–3d total) |
| **Decorative** (empty-state copy, status banners) | ~25% (~430 hits) | Replace с styled icons + text; case-by-case |
| **Safe** (`lib/email.ts`, `lib/emailTemplates.ts`, public `/availability`, `/p/[username]` portfolios where emoji is intentional brand) | ~5% (~80 hits) | Keep |

### Verdict: **FAIL**
Emoji-as-icon is the single biggest visual-consistency violation. Replacing с lucide-react primitives would harmonize dashboard appearance dramatically.

---

## Category 2 — Color saturation

### Frequency table (lines)

| Color | text-300 | text-400 | text-500 | text-600 | text-700 | bg-900/X (muted) | bg-950 |
|---|---|---|---|---|---|---|---|
| violet | 22 | **1,213** | 393 | 76 | 57 | 546 | 21 |
| red | 51 | **710** | 265 | 8 | 12 | 339 | 25 |
| amber | 79 | **586** | 139 | 5 | 6 | 375 | 7 |
| green | 32 | **553** | 166 | 23 | 27 | 284 | 2 |
| indigo | **265** | **1** | 6 | 0 | 0 | 0 | 0 |
| blue | 32 | 246 | 67 | 3 | 10 | 186 | 2 |
| orange | 13 | 69 | 50 | 25 | 41 | 51 | 2 |
| purple | 7 | 47 | 16 | 5 | 12 | 36 | 1 |
| yellow | 5 | 35 | 32 | 21 | 32 | 28 | 2 |
| pink | 1 | 2 | 6 | 4 | 5 | 2 | 0 |

### Key findings

1. **Indigo orphan token**: `text-indigo-300` = 265 hits, but `text-indigo-400` = 1 hit; `text-indigo-500/600/700` ≤ 6 each. Indigo is being used inconsistently as a stale legacy color — almost certainly should consolidate to violet or muted slate. Top files using `text-indigo-300`: `app/p/[username]/page.tsx`, `components/demo/mockups/*`, `app/terms/page.tsx`.
2. **Violet dominance is healthy** — brand color used systematically (1,213 + 393 + 76 across shades, paired with 546 muted-900 backgrounds).
3. **Bright-text-on-dark pairing is mostly honoured** — `bg-{color}-900/X` muted background counts roughly match bright-text counts in the same color family.
4. **Sample harsh-pattern hits** (`text-{color}-300/400` NOT on same line as muted bg of same color — these may be safe inside parent cards, but candidates for review):
   - `app/terms/page.tsx:74` — `text-violet-400 hover:text-indigo-300` (link colour mixes violet→indigo on hover; inconsistent)
   - `app/terms/page.tsx:157` — same pattern
   - `components/demo/mockups/AIContractsMockup.tsx` — 6+ instances of bare `text-green-400` (mockup component, acceptable)
   - `app/p/[username]/page.tsx:270, 274, 343, 446, 462` — bare `text-violet-400`, `text-indigo-300`, `text-amber-400` (public portfolio page, may be fine on white)

### Verdict: **WARN**
Healthy palette overall but **indigo is a stale/inconsistent token**. Single biggest cleanup: replace `text-indigo-300` (265 hits) с `text-slate-400` or `text-violet-300` based on context.

---

## Category 3 — Font weight

```
3396 font-medium
2517 font-semibold
1420 font-bold
 110 font-normal
  61 font-black
  15 font-extrabold
   3 font-light
```

### Verdict: **PASS**
Bell curve around medium/semibold/bold is healthy. **Accidentals to remove:**
- `font-light` (3 hits) — unused weight, recommend grep+remove
- `font-extrabold` (15 hits) — overlap with `font-black`; pick one

---

## Category 4 — Spacing variance

### `p-` (uniform padding)
```
763 p-5    519 p-4    390 p-6    350 p-3    174 p-1    82 p-2
 55 p-8     26 p-12    19 p-0    17 p-10     7 p-7     3 p-16
```
Top 4 = 84% of usage. Healthy. Outliers: `p-7` (7 hits) and `p-16` (3 hits) are stragglers.

### `px-`
```
1676 px-3   1278 px-4   804 px-2   469 px-5   318 px-6
 194 px-1    18 px-8    11 px-0     3 px-32   1 px-16   1 px-12   1 px-10
```
Top 4 = 86% of usage. Outliers `px-32`, `px-16`, `px-12`, `px-10` (each 1-3 hits) = stragglers (likely tutorial/heroes).

### `py-`
```
2152 py-2    963 py-1    807 py-3    521 py-0    338 py-4
  74 py-8     52 py-16    50 py-6    41 py-12    35 py-10
  27 py-20    18 py-5     12 py-24    1 py-7     1 py-32    1 py-14
```
Top 5 = 89%. **`py-7`, `py-32`, `py-14` (1 hit each) — remove or align к scale.**

### `gap-`
```
2638 gap-2   1525 gap-1   1182 gap-3   445 gap-4   440 gap-6
 109 gap-0    37 gap-5    13 gap-8     3 gap-16    3 gap-10
   2 gap-12    1 gap-7
```
Top 5 = 95%. Outliers `gap-7` (1) — accidental.

### `space-y-`
```
335 space-y-3   319 space-y-2   224 space-y-4   180 space-y-1
111 space-y-6    98 space-y-5    22 space-y-8    22 space-y-0
  4 space-y-10   2 space-y-12    1 space-y-7    1 space-y-16
```
Top 6 = 95%. Outliers `space-y-7`, `space-y-16` (1 each).

### Verdict: **PASS-/WARN**
Pareto holds in all five axes (top 4-6 values carry 80-95% of usage). 1-hit outliers (`py-7`, `py-32`, `py-14`, `gap-7`, `space-y-7`, `space-y-16`) are obviously accidental — short cleanup пасс would align к scale.

---

## Category 5 — Shadow / border / rounded

### Shadow
```
449 shadow-lg   134 shadow-sm    54 shadow-2xl
 40 shadow-xl    26 shadow-md     3 shadow-none
```
6 tokens used. Healthy.

### Border width
```
93 border-2   26 border-0   12 border-4
```
3 tokens. Healthy (most borders are default 1px so don't appear here).

### Rounded
```
3102 rounded-lg   1936 rounded-xl   1701 rounded-full   216 rounded-2xl
 140 rounded-sm    126 rounded-md      6 rounded-3xl      5 rounded-none
```
8 tokens. `rounded-3xl` (6) and `rounded-none` (5) are negligible; could be removed.

### Verdict: **PASS**

---

## Category 6 — White / light bg in dark context

**Solid (non-alpha-shaded) light bg total:** 209 lines / 199 lines (excluding `print:` variants — those are intentional for print stylesheets).

**Files inside `app/(app)/` with solid light bg:** 18

### Classification of those 18

| Status | File | Note |
|---|---|---|
| Confirmed light-theme (memo `project_lancerwise_light_theme_audit.md`) | `settings/public-profile/PublicProfileEditorFull.tsx` | EXPECTED |
| Confirmed light-theme | `settings/late-fees/LateFeeSettings.tsx` | EXPECTED (form panels) |
| Confirmed light-theme | `settings/reminders/ReminderSettings.tsx` | EXPECTED (form panels) |
| Confirmed light-theme | `settings/NewNavToggle.tsx` | EXPECTED |
| Confirmed light-theme | `settings/InvoiceBranding.tsx` | EXPECTED |
| Print view (intentional) | `contracts/[id]/print/page.tsx` | EXPECTED |
| Dark-theme leak (FLAG) | `dashboard/SuperDashboardClient.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `dashboard/NextActionWidget.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `dashboard/DashboardClient.tsx` | bare `bg-white/[0.04]` — alpha, OK |
| Dark-theme leak (FLAG) | `dashboard/GoalProgressWidget.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `dashboard/ClientHealthGrid.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `dashboard/FreelanceHealthScore.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `dashboard/WeeklyKPICard.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `clients/page.tsx` | bare `bg-white/[0.04]` — alpha, OK |
| Dark-theme leak (FLAG) | `clients/ClientHealthLeaderboard.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `clients/ClientRevenueRanking.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `clients/ClientAdvancedFilters.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `invoices/page.tsx` | bare `bg-white/[0.04]` — alpha, OK |
| Dark-theme leak (FLAG) | `invoices/QuickInvoiceButton.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `tasks/recurring/RecurringTasksClient.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `projects/onboarding/page.tsx` | `bg-slate-100` chip background — OK in dark cards |
| Dark-theme leak (FLAG) | `projects/page.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `projects/[id]/StatusPagePanel.tsx` | INVESTIGATE |
| Dark-theme leak (FLAG) | `help/page.tsx:18` | `bg-slate-50 text-slate-600` для icon chip — borderline, see line context |
| Dark-theme leak (FLAG) | `analytics/mood/page.tsx:252` | full `bg-slate-50` on `<div className="min-h-screen ...">` — confirmed full LIGHT THEME page (matches light-audit hypothesis) |
| Dark-theme leak (FLAG) | `analytics/yoy/page.tsx:285,346` | `bg-slate-50` rows inside print/page table — print-only |
| Dark-theme leak (FLAG) | `analytics/burn-rate/page.tsx:65` | progress-track inside dark card — borderline |
| Dark-theme leak (FLAG) | `analytics/revenue-heatmap/page.tsx:300` | `bg-slate-100` progress-track — borderline |
| Dark-theme leak (FLAG) | `analytics/payment-reliability/page.tsx:301-370` | full table styled с `bg-slate-50`/`bg-slate-100`/`text-slate-700` — confirmed full LIGHT inside dark page (LEAK) |
| Dark-theme leak (FLAG) | `analytics/client-work-report/page.tsx:150-240` | uses `print:bg-white print:border-gray-200` chain — print-only, INTENTIONAL |
| Dark-theme leak (FLAG) | `tax-estimator/TaxEstimatorClient.tsx:272-278` | `bg-slate-100 text-slate-500` chip + border for "Upcoming" — INSIDE dark theme, looks like leak |
| Dark-theme leak (FLAG) | `notes/noteColors.ts:64` | `bg-slate-100 text-slate-700` для category chip — light-theme color in dark map; check actual render |

### Confirmed new light-theme pages (extending memo)

Per `project_lancerwise_light_theme_audit.md` hypothesis that "весь `/settings/*` + parts of `/analytics/*` `/tools/*` нужно мигрировать":
- **`/analytics/mood`** — confirmed full light-theme via line 252 `<div className="min-h-screen bg-slate-50">` — should join the list
- **`/analytics/payment-reliability`** — confirmed light table inside dark wrapper (mixed; needs migration)

### Verdict: **WARN**
Most hits are either (a) intentional light-theme pages already known, (b) print-only, (c) alpha-shaded `bg-white/[0.04]` (acceptable on dark). Two NEW confirmed light-theme pages found: `/analytics/mood`, `/analytics/payment-reliability`. Both extend the existing audit hypothesis — memo memo deserves an update.

---

## Category 7 — Inline styles vs Tailwind

**Total:** 32,835 lines containing `style={{`
- **Acceptable** (dynamic computed, template-literal interpolation `${var}`): ~1,625 lines (~5%)
- **Violation** (static hex color literal `'#xxxxxx'`): ~9,956 lines (~30%)
- **Mixed** (other constants like `marginBottom: 16`): remainder ~21,000 (could be dynamic JS vars or static; conservative count = static = >30%)

**Files with hex literal inline styles:** 420 (346 inside `app/(app)/`)

### Top 20 hex-literal inline-style files (migration targets)

| Hex-literal lines | File |
|---|---|
| 122 | `app/(app)/tools/pipeline/PipelineClient.tsx` |
| 115 | `app/(app)/tools/outreach/page.tsx` |
| 109 | `app/(app)/finance/retainers/RetainersClient.tsx` |
| 85 | `app/(app)/finance/taxes/TaxDashboardClient.tsx` |
| 84 | `app/(app)/clients/onboarding/OnboardingClient.tsx` |
| 78 | `app/(app)/clients/surveys/SurveyBuilderClient.tsx` |
| 77 | `app/(app)/analytics/goals/page.tsx` |
| 76 | `app/(app)/clients/feedback-analytics/FeedbackAnalyticsClient.tsx` |
| 73 | `app/(app)/tools/pomodoro/PomodoroClient.tsx` |
| 73 | `app/(app)/crm/outreach/OutreachClient.tsx` |
| 73 | `app/(app)/analytics/tax-planner/TaxPlannerClient.tsx` |
| 72 | `app/(app)/tools/meeting-roi/MeetingROIClient.tsx` |
| 71 | `app/(app)/tools/skills/SkillsTrackerClient.tsx` |
| 71 | `app/(app)/tools/quotes/QuoteBuilderClient.tsx` |
| 68 | `app/(app)/projects/subcontractors/SubcontractorClient.tsx` |
| 68 | `app/(app)/analytics/income-forecast/IncomeForecastClient.tsx` |
| 67 | `app/(app)/finance/retainers/RetainerManagerClient.tsx` |
| 66 | `app/(app)/projects/status-pages/StatusPagesClient.tsx` |
| 65 | `app/(app)/projects/templates/ProjectTemplateLibrary.tsx` |
| 65 | `app/(app)/invoices/disputes/page.tsx` |

### Memo confirmations

- ✅ **`WorkRhythmClient.tsx` confirmed** (per memo `backlog_tools_work_rhythm_inline_style.md`): 61 `style={{` lines including `background: '#0f172a'` (hex color) at line 205, 212. Still present.
- ✅ **`/insights/cash-flow` and `/insights/profitability` confirmed inline-styled** (user hint): Both routes are 1-line re-exports от `../analytics/cash-flow/page` and `../analytics/profitability/page`. The actual clients (`CashFlowClient.tsx` 75 inline styles, `ProfitabilityClient.tsx` 77 inline styles) are heavily inline-styled — both with hex color literals (`'#f1f5f9'`, `'#64748b'`).

### Sample 8 static-inline file:lines (migration targets)

```
components/SnoozeButton.tsx:96    color: '#111827'  (static black-ish text on white)
components/SnoozeButton.tsx:99    background: '#f9fafb', color: '#6b7280'
components/SnoozeButton.tsx:108   border: '1px solid #e5e7eb', color: '#374151'
components/SnoozeButton.tsx:119   background: '#f5f3ff', color: '#6366f1', border: '1px solid #ddd6fe'  // entire button styled with violet 50/600 hex equivalents
components/SnoozeButton.tsx:139   background: '#6366f1', color: '#fff'  // primary button
app/rates/[slug]/page.tsx:88-200  // entire page hand-rolled с hex colors instead of Tailwind
app/(app)/tools/work-rhythm/WorkRhythmClient.tsx:205   background: '#0f172a'  (slate-900 hex equivalent — should be bg-slate-900)
app/(app)/analytics/cash-flow/CashFlowClient.tsx:240   borderTop: `3px solid ${color}`  // dynamic-ish but card itself is hand-rolled
```

### Verdict: **FAIL**
This is the deepest structural violation — entire features (`/insights/cash-flow`, `/insights/profitability`, `/tools/work-rhythm`, `/tools/pipeline`, `/finance/retainers`, all big `*Client.tsx` clients in `tools/` and `clients/`) bypass Tailwind altogether с inline hex literals. Migration would be a substantial multi-week effort but would dramatically improve consistency.

---

## Top 10 Highest-Impact Violations

Ranked by visibility (user-critical routes) × repetition × jarringness:

| # | File:Line | Current | Recommended replacement | Fix scope |
|---|---|---|---|---|
| 1 | `app/(app)/dashboard/command-center/CommandCenterClient.tsx:314,323,332,495,546,673,686,731,733` | `icon="🔴"`, `icon="🔥"`, `📅 No meetings scheduled`, `🧾 + New Invoice`, etc. | lucide icons: `AlertCircle`, `Flame`, `Calendar`, `Receipt` etc. | **1h** (single file) |
| 2 | `app/(app)/insights/cash-flow/page.tsx` (re-export of `analytics/cash-flow/CashFlowClient.tsx` 75 inline styles, all hex) | `style={{ background: '#f1f5f9', color: '#64748b' }}` | Tailwind: `className="bg-slate-100 text-slate-500"` | **1d** (full rewrite) |
| 3 | `app/(app)/insights/profitability/page.tsx` (re-export of `analytics/profitability/ProfitabilityClient.tsx` 77 inline styles) | Same as #2 | Same as #2 | **1d** (full rewrite) |
| 4 | `app/(app)/tools/work-rhythm/WorkRhythmClient.tsx:205,212,215+58 more` | `style={{ background: '#0f172a', color: '#f1f5f9', padding: '24px 32px' }}` | `className="min-h-screen bg-slate-900 text-slate-100 px-8 py-6"` | **1d** (matches memo `backlog_tools_work_rhythm_inline_style.md`) |
| 5 | All 265 `text-indigo-300` instances | `className="text-indigo-300"` | Consolidate к `text-violet-300` (brand) or `text-slate-400` (muted) | **1h** (sed replace + visual diff) |
| 6 | `app/(app)/analytics/mood/page.tsx:252` | `<div className="min-h-screen bg-slate-50">` | Dark-theme migrate: `<div className="min-h-screen bg-slate-950">` + recolor inner | **1d** (full page restyle) |
| 7 | `app/(app)/analytics/payment-reliability/page.tsx:301-370` | `<tr className="bg-slate-50 border-b border-slate-200">` table on dark page | Dark-theme: `bg-white/[0.03] border-white/10` | **2h** |
| 8 | `app/(app)/tools/social-content/SocialContentClient.tsx:46-48` (and similar files) | `{ id: 'linkedin', label: 'LinkedIn', icon: '💼' }` | Use lucide brand icons (`<Linkedin/>`, `<Twitter/>`, `<Instagram/>`) | **15 min/file × ~10 files** |
| 9 | `app/(app)/clients/notes/ClientNotesClient.tsx:60-64` MEETING_TYPES `'📞 Phone Call'` | Strip emoji prefix from labels; render lucide icon next to text | `<Phone className="w-4 h-4" /> Phone Call` | **30 min** |
| 10 | `app/(app)/invoices/disputes/page.tsx:51-65` dispute-reason emoji labels (12 emojis in option values) | Same as #9 | Same as #9 | **30 min** |

---

## Cross-links к existing memos

| Memo | What it covers | Audit confirms |
|---|---|---|
| `backlog_tools_work_rhythm_inline_style.md` | Hardcoded `style={{ background: '#6366f1', ... }}` CTA Link in WorkRhythmClient | ✅ Still present (61 `style={{` lines, multiple `#0f172a`/`#6366f1`/`#f1f5f9` literals) |
| `backlog_audit_static_analysis_dynamic_inline_caveat.md` | `grep -c 'style={{'` can't distinguish dynamic vs static | ✅ Applied refined regex `style={{[^}]*\${`  for dynamic (1,625 hits) and `style={{[^}]*'#[0-9a-fA-F]+'` for static (9,956 hits) |
| `project_lancerwise_light_theme_audit.md` | Memo lists `/analytics/forecast`, `/settings/public-profile` as confirmed light-theme; hypothesizes whole `/settings/*` + parts of `/analytics/*` `/tools/*` | ✅ Audit extends list: `/analytics/mood`, `/analytics/payment-reliability` are confirmed light-theme |
| `backlog_email_template_html_inline_styles.md` | Email body inline styles required by clients; exclude from audits | ✅ Excluded `lib/email.ts` and `lib/emailTemplates.ts` from violation counts (still report functional emoji usage there as KEEP) |
| `backlog_button_color_inconsistency.md` | Purple/blue/orange used for same-semantic primary action | ✅ Audit found indigo-300 stale token (265 hits) reinforces this — needs design-system pass |
| `backlog_label_casing_consistency.md` | Fields Sentence Case, section headers UPPERCASE | (not directly audited statically; would require text-content scan) |

### New memo proposals (post-launch backlog)

| Suggested memo | Why |
|---|---|
| `backlog_emoji_to_lucide_migration.md` | 1,710 emoji-as-icon hits across 440 files (315 inside auth); decide systematic migration approach |
| `backlog_indigo_token_consolidation.md` | `text-indigo-300` 265 hits but `text-indigo-400/500/600/700` near-zero — stale legacy token cleanup |
| `backlog_inline_style_systematic_migration.md` | 9,956 hex-literal inline styles across 420 files; entire feature surfaces (`/insights/*`, `/tools/work-rhythm`, `/tools/pipeline`, `/finance/retainers`, `/insights/cash-flow`, `/insights/profitability`) bypass Tailwind |
| `project_lancerwise_light_theme_audit.md` UPDATE | Add `/analytics/mood`, `/analytics/payment-reliability` to confirmed list |
| `backlog_font_light_extrabold_cleanup.md` | `font-light` (3), `font-extrabold` (15) accidental usage |
| `backlog_spacing_scale_outliers.md` | `py-7`, `py-32`, `py-14`, `gap-7`, `space-y-7`, `space-y-16` (1 hit each) — align к Tailwind scale |

---

## Aggregate severity verdict

| Category | Severity |
|---|---|
| 1. Emoji-as-icon | **FAIL** |
| 2. Color saturation | **WARN** (indigo orphan) |
| 3. Font weight | **PASS** |
| 4. Spacing variance | **PASS-/WARN** (Pareto holds, minor outliers) |
| 5. Shadow / border / radius | **PASS** |
| 6. Light bg in dark context | **WARN** (2 new light-theme pages found) |
| 7. Inline styles vs Tailwind | **FAIL** |

**Overall: WARN/FAIL hybrid.** Categories 3-5 are healthy. Category 6 mostly accounted for in existing memos plus 2 new findings. Categories 1 and 7 are deep systemic issues that require dedicated migration sprints — not pre-launch fixes.

---

## Top 3 most-jarring patterns

1. **Emoji used as functional icons in user-critical dashboards** (e.g. `/dashboard/command-center` icon="🔴", `🧾 + New Invoice`, `📊 Start tracking...`) — undermines premium SaaS feel; should be lucide-react primitives.
2. **`/insights/cash-flow` and `/insights/profitability` are full-page inline-styled** (CashFlowClient.tsx 75 inline-styles, ProfitabilityClient.tsx 77 inline-styles, all с hex literals) — these pages don't use Tailwind at all and visually diverge from rest of app.
3. **`text-indigo-300` (265 hits) is a stale orphan token** — indigo-400/500/600/700 near-zero, suggests legacy color that was partially migrated but `-300` was missed across the dashboard, contracts, mockups, terms pages.

---

## Unexpected discoveries

- **6 unused tokens / dead code candidates**: `font-light` (3), `font-extrabold` (15), `rounded-3xl` (6), `rounded-none` (5), `py-7` (1), `py-14` (1), `py-32` (1), `gap-7` (1), `space-y-7` (1), `space-y-16` (1) — cumulative ~30 hits across the codebase that are obviously accidental. Trivial cleanup PR.
- **Hover color inconsistency** (`app/terms/page.tsx`): `text-violet-400 hover:text-indigo-300` — link base color is violet but hover transitions к indigo. Audited file is public marketing — not auth-gated — but still confusing for users.
- **`app/p/[username]/page.tsx`** uses 5 color families simultaneously (`green-400`, `amber-400`, `red-400`, `violet-400`, `indigo-300`) for availability states — palette mostly under control but `indigo-300` slipped в.
- **Email templates `lib/email.ts` and `lib/emailTemplates.ts`** carry 30+ emoji titles (`🎉 Welcome aboard`, `💰 Payment received`, `📅 New booking`, etc.) — confirmed SAFE per memo `backlog_email_template_html_inline_styles.md`; these are intentional branding in email rendering.
- **Print stylesheets are consistently honoured** — multiple files use `print:bg-white print:border-gray-200` chain to override dark theme for print, which is the right pattern.
