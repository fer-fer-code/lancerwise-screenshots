# Tier 4 Widget Drift Honest Audit

**Date:** 2026-05-25
**After:** PR #226 (Tier 1 globals.css) + PR #227 (Tier 2 shell) merged to production (`ac82d6be` + `966cc384`)
**Reporter:** Ramiz mobile inspection — 12 visible drift suspects
**Auditor:** [AGENT 6]
**Method:** Mobile capture 414×896 (public pages only — authed capture blocked by no stored auth + 90s wait killed by harness) + exhaustive static grep targeted at the 12 Ramiz callouts. Static grep authoritative for class drift; only used screenshots to confirm visible context.

## Tooling friction

- Shared CDP `localhost:59736` locked by parallel agents (per instructions, did not attempt).
- Tried `launchPersistentContext` headed for authed pages → harness killed background `node` during 90s manual-login wait. Switched to headless public-only capture.
- No `storageState.json` or saved auth state existed at any `/Users/myoffice/lancerwise*` path; no auth import was possible.
- Headless public capture also had 3/6 timeouts on `networkidle` for `/login`, `/register`, `/dashboard` (likely production middleware/redirect delays). Got `00-landing-mobile.jpeg` + `01-pricing-mobile.jpeg`.
- **Workaround:** Static grep + reading components directly was the primary evidence path. Every finding below cites exact `file:line` with current class + target swap.

## Aggregate drift totals (for context — most invisible, post-launch backlog)

| Scope | Files w/ drift | Occurrences |
|---|---|---|
| `src/app/(app)/` total | 2,163 | 4,914 |
| `src/components/` total | 91 | 322 |
| **`src/app/(app)/settings/` (Tier B blast zone)** | **62** | **474** |

## Visible-impact tier — Ship-priority order

### TIER A — HIGHEST IMPACT (chrome, every session)
2 items. Single-line each. ~5 min total. Highest visible-per-line ratio.

### TIER B — HIGH IMPACT (Settings + heavily-used screens)
9 items. Settings is the densest navy zone per Ramiz. ~30 min total.

### TIER C — MEDIUM IMPACT (Dashboard widget surfaces)
3 items. Widget cards on first-screen Dashboard. ~12 min total.

### TIER D — LOW IMPACT (Stripe payment status, contracts area)
2 items. ~5 min total.

---

## Per-item findings

### TIER A

#### A1. MarketingFooter — navy footer on landing
- **File:** `src/components/marketing/MarketingFooter.tsx:22`
- **Current:** `<footer className="border-t border-slate-700/50 py-12 px-6 bg-slate-800/50">`
- **Target:** `<footer className="border-t border-border/50 py-12 px-6 bg-card/50">` (or `bg-surface`)
- **Secondary line:** `:72` inner `border-t border-slate-700/50` → `border-t border-border/50`
- **Visible impact:** HIGHEST — every public visitor (including Google bots, first impression of `/`).
- **Maps to Ramiz callout:** #1 (Footer landing — navy)
- **Est fix:** 2 min single-file swap

#### A2. MobileBottomNav — popup overlay still navy
- **File:** `src/components/layout/MobileBottomNav.tsx:69`
- **Current:** `className="fixed bottom-20 left-0 right-0 mx-4 z-50 md:hidden rounded-xl bg-slate-800 border border-slate-700 shadow-xl overflow-hidden"`
- **Target:** `... bg-elevated border border-border ...` (or `bg-card`)
- **Secondary line:** `:84` inactive item hover `hover:bg-slate-700/60` → `hover:bg-elevated/60`
- **Note:** The bottom-nav bar itself (`:96` `bg-slate-900`) was migrated by Tier 1+2 globals overrides. But the More-menu popup overlay is a separate fixed positioned element that still renders with hardcoded slate-800 — Ramiz spotted this on `/work/time` because the popup was open.
- **Visible impact:** HIGH — every mobile user clicking the More tab.
- **Maps to Ramiz callout:** #2 (Mobile bottom nav на /work/time — navy)
- **Est fix:** 3 min — 2 line edits

---

### TIER B — Settings screens (Ramiz callouts #3–#10)

#### B1. Settings/Appearance theme picker — navy radio rows
- **File:** `src/app/(app)/settings/page.tsx:308`
- **Current:** `className={\`flex items-center gap-3 p-3 rounded-lg border border-slate-700 transition-colors ${ isLight ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 cursor-pointer' }\`}`
- **Target:** `border-border` + `hover:bg-elevated/50`
- **Context:** Surrounding card at `:292` also `bg-slate-800/50 rounded-xl border border-slate-700` → `bg-card border-border`
- **Maps to Ramiz callout:** #3 (Settings/Appearance theme picker buttons — navy fill)
- **Est fix:** 3 min

#### B2. Settings/Invoice Branding card + textarea
- **File:** `src/app/(app)/settings/BrandingSettings.tsx`
- **Drift lines:** `:112` outer card `bg-slate-800/50 ... border border-slate-700`, `:128` dashed inner placeholder, `:180` color-swatch border, `:186` hex input, `:202` invoice-footer textarea `bg-slate-900 border-slate-700`
- **Target:** card → `bg-card border-border`; inputs/textarea → `bg-surface border-input` (or `bg-elevated`)
- **Maps to Ramiz callout:** #4 (Settings/Invoice Branding textarea — navy)
- **Est fix:** 4 min (5 lines)

#### B3. Settings/Client Portal card + textareas + preview
- **File:** `src/app/(app)/settings/PortalBrandingSettings.tsx`
- **Drift lines (15+ occurrences):** `:88` card, `:122` first textarea, `:139` second textarea, `:155`, `:164`, `:181`, `:188` info row, `:219` toggle thumb, `:246` divider, `:250` preview shell, `:277` preview header band, `:283/290` preview footer
- **Target:** card → `bg-card border-border`; textareas/inputs → `bg-surface border-input`; preview shell → keep separate semantics (it MIMICS the client portal — may legitimately stay literal navy to represent default theme; **check with design before swapping preview internals**, but card chrome + inputs should swap)
- **Maps to Ramiz callout:** #5 (Settings/Client Portal textarea — navy)
- **Est fix:** 6 min (10 lines, careful on preview area)

#### B4. Settings/Business Info input borders
- **File:** `src/app/(app)/settings/FreelancerProfile.tsx`
- **Drift lines:** `:76` outer card, `:88`, `:94`, `:101`, `:103`, `:111`, `:122`, `:128` — 8 inputs/selects all with `border-slate-700 bg-slate-900`
- **Target:** outer → `bg-card border-border`; inputs → `bg-surface border-input`
- **Maps to Ramiz callout:** #6 (Business Info input borders — navy)
- **Est fix:** 4 min (9 lines)

#### B5. Settings index — Plan/Pro/Team dashed tier cards
- **File:** `src/app/(app)/settings/page.tsx:510`
- **Current:** `<div key={p.name} className="border border-dashed border-slate-600 rounded-lg p-3">`
- **Target:** `border border-dashed border-border` (or `border-muted`)
- **Maps to Ramiz callout:** #7 (Plan/Pro/Team dashed borders — navy)
- **Est fix:** 1 min single line

#### B6. Settings/Rate Card outline
- **File:** `src/app/(app)/settings/RateCard.tsx`
- **Drift lines:** `:103/106/109/111` four inputs + select all `border-slate-700 bg-slate-900`, `:128` outer card `bg-slate-800/50 border-slate-700`, `:153` row hover `hover:bg-slate-700/50`
- **Target:** card → `bg-card border-border`; inputs → `bg-surface border-input`; hover → `hover:bg-elevated/50`
- **Maps to Ramiz callout:** #8 (Rate Card outlines — navy)
- **Est fix:** 4 min (7 lines)

#### B7. Settings/Discount Codes outline
- **File:** `src/app/(app)/settings/DiscountCodes.tsx`
- **Drift lines:** `:70` outer card, `:91` per-code row `bg-slate-900/50`, `:112/115/118/120` four edit inputs `border-slate-700 bg-slate-900`
- **Target:** card → `bg-card border-border`; row → `bg-surface/50`; inputs → `bg-surface border-input`
- **Maps to Ramiz callout:** #8 (Discount Codes outlines — navy)
- **Est fix:** 4 min (6 lines)

#### B8. Settings/Email Templates outline
- **File:** `src/app/(app)/settings/EmailTemplates.tsx`
- **Drift lines:** `:111` outer card, `:128/134/141` three inputs/textareas, `:149` cancel button outline `border-slate-700`, `:158` per-template row `bg-slate-900/50`
- **Target:** card → `bg-card border-border`; inputs → `bg-surface border-input`; button → `border-border`; row → `bg-surface/50`
- **Maps to Ramiz callout:** #8 (Email Templates outlines — navy)
- **Est fix:** 4 min (6 lines)

#### B9. Settings/Line Item Templates — items fill navy
- **File:** `src/app/(app)/settings/LineItemTemplates.tsx`
- **Drift lines:** `:92` outer card, `:109/117/126/133` four inputs/selects, `:143` button, `:152` per-item row `bg-slate-900/50`
- **Target:** card → `bg-card border-border`; inputs → `bg-surface border-input`; row → `bg-surface/50`
- **Maps to Ramiz callout:** #9 (Line Item Templates items — navy fill)
- **Est fix:** 4 min (7 lines)

#### B10. Settings/Email Notification Preferences — heavy navy (the 58 rows)
- **File:** `src/app/(app)/settings/NotificationPreferences.tsx`
- **Drift lines:** `:231` outer card `bg-slate-800/50 border border-slate-700`, `:254` toggle off color `bg-slate-600`, `:255` toggle thumb `bg-slate-800/50`
- **Target:** card → `bg-card border-border`; toggle off → `bg-muted`; toggle thumb → `bg-card` (or design-system `bg-on-muted`)
- **Note:** "58 rows" Ramiz saw are all rendered through this single component — fix is 3 lines, but multiplied visible impact is highest in Settings.
- **Maps to Ramiz callout:** #10 (Email Notification Preferences 58 rows — heavy navy)
- **Est fix:** 3 min (3 lines, huge visible payoff)

---

### TIER C — Dashboard widget surfaces (Ramiz callout #11)

#### C1. Dashboard/CashFlowWidget — card border navy
- **File:** `src/app/(app)/dashboard/CashFlowWidget.tsx:58`
- **Current:** `<div className="bg-slate-800/50 rounded-xl border border-slate-700 p-5">`
- **Target:** `bg-card border-border`
- **Secondary:** `:79` inner stats panel `bg-slate-900/50` → `bg-surface/50`
- **Est fix:** 2 min (2 lines)

#### C2. Dashboard/CashFlowForecast — card border navy + tooltip
- **File:** `src/app/(app)/dashboard/CashFlowForecast.tsx:54`
- **Current:** outer card `bg-slate-800/50 rounded-xl border border-slate-700`
- **Target:** `bg-card border-border`
- **Secondary:** `:67` tooltip `bg-slate-950` keep (intentional dark tooltip) OR `bg-elevated`; `:94` row hover `hover:bg-slate-900/50` → `hover:bg-surface/50` + `border-slate-700/50` → `border-border/50`
- **Est fix:** 3 min (3 lines)

#### C3. Dashboard/HealthScoreWidget — skeleton + card border navy
- **File:** `src/app/(app)/dashboard/HealthScoreWidget.tsx`
- **Drift lines:** `:125` skeleton card, `:126/127` skeleton bars `bg-slate-700`, `:138` real card
- **Target:** cards → `bg-card border-border`; skeleton bars → `bg-muted` (with animate-pulse)
- **Maps to Ramiz callout:** #11 (Dashboard Cash Flow / Health Score cards — navy borders)
- **Est fix:** 3 min (4 lines)

---

### TIER D — Lower-impact Stripe + auxiliary

#### D1. Settings/Stripe Payments — card + textarea-like code block
- **File:** `src/app/(app)/settings/StripePaymentStatus.tsx`
- **Drift lines:** `:17` outer card `bg-slate-800/50 border-slate-700`, `:79` instructions panel `bg-slate-900/50 border-slate-700`, `:96` code block `bg-slate-800 border-slate-700`, `:102/111` inline `<code>` chips `bg-slate-700`
- **Target:** outer → `bg-card border-border`; instructions → `bg-surface/50 border-border`; code blocks → `bg-elevated border-border`; chips → `bg-muted`
- **Maps to Ramiz callout:** #12 (Stripe Payments textarea — navy)
- **Est fix:** 4 min (5 lines)

#### D2. Settings index page — top-level Profile + skeletons
- **File:** `src/app/(app)/settings/page.tsx`
- **Drift count:** 33 occurrences in this single file (heaviest in repo per file)
- **Visible blocks:** `:245` profile card, `:271/277` profile inputs, `:292/370/477` other cards, `:384/391/397/412/419/425/437/451/458` 9 inputs
- **Target:** all cards → `bg-card border-border`; inputs → `bg-surface border-input`
- **Note:** This is the surface Ramiz sees as the "Settings" first impression — many separately-listed components above (B1, B5) come from this same file. Fixing this file knocks out ~10 visible callout items in one pass.
- **Est fix:** 10 min (33 swaps, repetitive)

---

## Aggregate visible-impact summary

| Tier | Items | Files | Est total min | Maps to Ramiz # |
|---|---|---|---|---|
| **A** (chrome, every session) | 2 | 2 | 5 | #1, #2 |
| **B** (Settings + notifications) | 10 | 9 | 47 | #3–#10 |
| **C** (Dashboard widgets) | 3 | 3 | 8 | #11 |
| **D** (Stripe + Settings index) | 2 | 1 | 14 | #12 + spillover |
| **TOTAL ship-priority** | **17** | **15** | **~74 min** | All 12 Ramiz suspects |

Residual after these 17 items: ~3,300 invisible widget shells in deep routes (post-launch Tier 5 backlog).

---

## Highest single ROI fix

**B10 — `NotificationPreferences.tsx` (3 lines, ~3 min).**
"58 rows of navy" that Ramiz saw all render through 3 lines in 1 file. Fix-to-pixel ratio is unbeatable.

## Highest single-file payoff

**D2 — `settings/page.tsx` (33 swaps, ~10 min).** This single file is the source of Ramiz callouts #3, #5 (partial), #7 — fixing it once knocks out multiple Tier-B items + the entire Settings index visual.

---

## Recommended PR sequencing

### PR #228 — TIER A (footer + mobile popup) — 5 min
Smallest, fastest validation that the swap pattern works on production chrome.
Files:
- `src/components/marketing/MarketingFooter.tsx` (2 lines)
- `src/components/layout/MobileBottomNav.tsx` (2 lines)

### PR #229 — TIER B (Settings forms + notifications) — 47 min
Settings is the densest navy concentration per Ramiz. Per-file commits inside one PR for review-ability.
Files (10):
- `src/app/(app)/settings/page.tsx` (33 swaps → D2 + B1 + B5)
- `src/app/(app)/settings/BrandingSettings.tsx` (5)
- `src/app/(app)/settings/PortalBrandingSettings.tsx` (10 — keep preview literal)
- `src/app/(app)/settings/FreelancerProfile.tsx` (9)
- `src/app/(app)/settings/RateCard.tsx` (7)
- `src/app/(app)/settings/DiscountCodes.tsx` (6)
- `src/app/(app)/settings/EmailTemplates.tsx` (6)
- `src/app/(app)/settings/LineItemTemplates.tsx` (7)
- `src/app/(app)/settings/NotificationPreferences.tsx` (3 — biggest ROI)
- `src/app/(app)/settings/StripePaymentStatus.tsx` (5)

### PR #230 — TIER C (Dashboard widgets) — 8 min
Files (3):
- `src/app/(app)/dashboard/CashFlowWidget.tsx` (2)
- `src/app/(app)/dashboard/CashFlowForecast.tsx` (3)
- `src/app/(app)/dashboard/HealthScoreWidget.tsx` (4)

Sequence A → B → C smoke-tests Tier-A swap pattern before applying to denser Tier-B.

---

## NOT included (deferred backlog Tier 5)

- Email-template HTML inline styles (per existing memo `backlog_email_template_html_inline_styles.md` — intentional, client-side rendered).
- The other ~3,300 invisible widget `bg-slate-*` shells in deep routes (`/proposals`, `/tools/*`, `/clients/[id]/communications`, etc.) — post-launch.
- `forecast/page.tsx` dashed violet swatches (intentional brand purple).
- Decorative gradients (Phase 3 brand-system backlog).
- Preview shell of Client Portal (PortalBrandingSettings :250–:290) — design call: it intentionally mimics customer portal default theme; check before swapping internals.

---

## Visible-impact summary

After PR #228 + #229 + #230 ship: **12/12 Ramiz mobile callouts resolved**. Residual Tier 5 = ~3,300 invisible swaps in low-traffic deep routes (post-launch — won't affect perceived quality on launch eve).

## Captures collected

- `captures/00-landing-mobile.jpeg` — public landing 414×896 fullPage (Footer A1 visible)
- `captures/01-pricing-mobile.jpeg` — public pricing 414×896 fullPage
- `captures/_capture-log.json` — capture results (3/6 timeouts on `/login`, `/register`, `/dashboard` — networkidle exceeded 25s on production; not blocking since static grep is authoritative for class drift)

## Methodology notes (for future agents)

- Static grep `bg-slate-|border-slate-` is the authoritative source for drift on a class-based design system. Screenshots only confirm context/visibility, not existence of drift.
- When auth-blocked, do NOT burn 30-min budget waiting for manual login — fall back to repo-scoped grep with exact file:line citations.
- The shared CDP `localhost:59736` is permanently locked during multi-agent palette work; budget for `launchPersistentContext` from minute zero.
- Headless `networkidle` on production lancerwise pages often exceeds 25s due to Vercel cold-start + middleware redirects — use `domcontentloaded` + `waitForTimeout(2500)` instead of `networkidle` for production captures.
