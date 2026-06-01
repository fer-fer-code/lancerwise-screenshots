# Palette Migration Map

> **Status:** input для post-launch редизайна (sweep НЕ делается сейчас).
> Сохранено 2026-06-01 после workflow-аудита (9 параллельных agents, 600k tokens).

## Резюме перед миграцией — 3 тёмных канона в codebase + бренд

В кодбазе одновременно живут **три разных тёмных палитры**:

| Канон | BG | CARD | BORDER | ACCENT | Где |
|---|---|---|---|---|---|
| **App** (целевой по тех-долгу) | `#0A0A0F` | `#1A1A22` | `#2a2a35` | `#8b5cf6` violet | планируется в `PageLoadingSkeleton` и далее |
| **Bulk inline** (текущий легаси) | `#0f172a` | `#1e293b` | `#334155` | `#6366f1` indigo | 62 файла `tools/*Client.tsx` + `analytics/*Client.tsx` + public routes |
| **ProductivityHeatmap** (drift, уже мигрирован отдельно) | `#0B0B12` | `#15151F` | `#22222F` | — | `analytics/productivity/ProductivityHeatmapClient.tsx` |

**Бренд из SMM-брифа:** `#0B0B12` BG + `#6A5AE0` accent (purple/violet).

**Финальный канон выбирается в редизайне.** ProductivityHeatmap drift предполагает что `#0B0B12` уже неявно ближе к брэнду — может стать каноном. Решение блокирует steps 5-7 ниже (создание `brandPalette.ts` и mass-sweep).

---

# Palette Migration Map (read-only audit)

## Stats

- Tailwind hits classified: 588
- Hex hits classified: 104
- Files affected: 252
- KEEP: 23% / MIGRATE: 77%

## TIER 1: KEEP samples (10)

- `src/app/page.tsx:289` — bg-blue-500/20 text-blue-400 Sent status badge — _STATUS-keep: informational Sent semantic_
- `src/app/(app)/clients/ClientHealthLeaderboard.tsx:27` — border-blue-500/40 text-blue-300 bg-blue-500/10 (grade B) — _STATUS-keep: client health grade tier semantic_
- `src/app/(app)/settings/OutlookConnect.tsx:81` — bg-blue-900/20 Outlook section — _BRAND-keep: Microsoft/Outlook brand identity color_
- `src/app/(app)/settings/api/APIKeysClient.tsx:1388` — bg-blue-900/20 border-blue-800 info callout — _STATUS-keep: info callout for integrations_
- `src/app/(app)/inbox/page.tsx:37` — bg-blue-900/30 text-blue-400 freelancer tab — _BRAND-keep: Freelancer.com brand color_
- `src/app/(app)/testimonials/TestimonialsManager.tsx:36` — bg-blue-900/20 text-blue-400 LinkedIn — _BRAND-keep: LinkedIn brand identity_
- `src/app/(app)/contracts/page.tsx:75` — bg-blue-900/30 text-blue-400 signed contract status — _STATUS-keep: contract signed informational status_
- `src/app/(app)/projects/[id]/ProjectPriorityTag.tsx:12` — text-blue-400 bg-blue-900/30 P3 Normal priority — _STATUS-keep: P3 priority tier semantic_
- `src/lib/scorecard.ts:41` — bg-blue-500 grade B+ palette — _STATUS-keep: semantic grade-band color_
- `src/lib/proposalExpiry.ts:15` — #3b82f6 Expires <=7d urgency — _STATUS-keep: info-blue legitimate urgency semantic_

## TIER 2: MIGRATE — full list (570 entries)

| file | line | current | target | kind |
|---|---|---|---|---|
| `src/app/page.tsx` | 136 | `bg-blue-600/12 blur-[110px]` | `bg-violet-600/12 blur-[110px]` | tailwind |
| `src/app/page.tsx` | 156 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/page.tsx` | 175 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/page.tsx` | 224 | `text-indigo-300 group-hover:text-indigo-200` | `text-violet-300 group-hover:text-violet-200` | tailwind |
| `src/app/page.tsx` | 226 | `group-hover:text-indigo-300` | `group-hover:text-violet-300` | tailwind |
| `src/app/page.tsx` | 269 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/page.tsx` | 421 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/demo/DemoClient.tsx` | 124 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 256 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 298 | `bg-blue-900/20 border border-blue-800/20` | `bg-violet-900/20 border border-violet-800/20` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 300 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 301 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 304 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 307 | `hover:bg-blue-900/30` | `hover:bg-violet-900/30` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 311 | `text-blue-400 / text-blue-500` | `text-violet-400 / text-violet-500` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 366 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(public-tools)/tools/rate-calculator/RateCalculatorPublic.tsx` | 367 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/contact/page.tsx` | 60 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/portal/[token]/PayButton.tsx` | 56 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/portal/time-approval/[token]/page.tsx` | 57 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/portal/time-approval/[token]/page.tsx` | 59 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/portal/testimonial/[token]/page.tsx` | 39 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 163 | `bg-blue-900/20 border-blue-800/20` | `bg-violet-900/20 border-violet-800/20` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 165 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 166 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 168 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 169 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 218 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 242 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/forecast/page.tsx` | 277 | `bg-blue-900/20 text-blue-400 border-blue-800/20 hover:bg-blue-900/30` | `bg-violet-900/20 text-violet-400 border-violet-800/20 hover:bg-violet-900/30` | tailwind |
| `src/app/(app)/snippets/page.tsx` | 24 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/snippets/page.tsx` | 27 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/clients/new/page.tsx` | 285 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/new/page.tsx` | 299 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/new/page.tsx` | 509 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientLTVForecast.tsx` | 39 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientLTVForecast.tsx` | 43 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/DocumentVault.tsx` | 53 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/clients/[id]/DocumentVault.tsx` | 56 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/clients/[id]/DocumentVault.tsx` | 278 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientReminders.tsx` | 159 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 81 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 94 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 105 | `bg-blue-900/20 border-blue-800/30` | `bg-violet-900/20 border-violet-800/30` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 110 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 113 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 115 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 123 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/clients/[id]/ReferralTracker.tsx` | 128 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/clients/[id]/ClientRiskAssessment.tsx` | 143 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientBudgetSummary.tsx` | 49 | `bg-blue-900/20 border-blue-800/30` | `bg-violet-900/20 border-violet-800/30` | tailwind |
| `src/app/(app)/clients/[id]/ClientBudgetSummary.tsx` | 50 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/clients/[id]/ClientBudgetSummary.tsx` | 51 | `text-blue-300` | `text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientActivityFeed.tsx` | 213 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/clients/[id]/ClientFollowUp.tsx` | 112 | `bg-blue-900/20 border-blue-800/30` | `bg-amber-900/20 border-amber-800/30` | tailwind |
| `src/app/(app)/clients/[id]/ClientFollowUp.tsx` | 115 | `text-blue-500` | `text-amber-500` | tailwind |
| `src/app/(app)/clients/[id]/ClientTags.tsx` | 9 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/settings/PortfolioManager.tsx` | 113 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PortfolioManager.tsx` | 132 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/ExportCenter.tsx` | 6 | `text-blue-400 bg-blue-900/30` | `text-violet-400 bg-violet-900/30` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 204 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 485 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 728 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 746 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 776 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/SettingsRootClient.tsx` | 807 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PortalBrandingSettings.tsx` | 119 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PortalBrandingSettings.tsx` | 205 | `bg-violet-900/40 text-indigo-300` | `bg-violet-900/40 text-violet-300` | tailwind |
| `src/app/(app)/settings/LineItemTemplates.tsx` | 116 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/TwoFactorSettings.tsx` | 316 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/RateCalculator.tsx` | 87 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/PublicProfileEditor.tsx` | 133 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PublicProfileEditor.tsx` | 160 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/BioGenerator.tsx` | 151 | `border-violet-600 text-indigo-300` | `border-violet-600 text-violet-300` | tailwind |
| `src/app/(app)/settings/BusinessCard.tsx` | 128 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/BusinessCard.tsx` | 136 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/BusinessCard.tsx` | 140 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/TaxSettings.tsx` | 207 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/PublicProfile.tsx` | 155 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/PublicProfile.tsx` | 156 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PublicProfile.tsx` | 159 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 122 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 123 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 162 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 190 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 196 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 202 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 208 | `focus-visible:ring-blue-500/40` | `focus-visible:ring-violet-500/40` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 225 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 231 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/settings/SmtpConnect.tsx` | 232 | `text-blue-400 hover:text-blue-300` | `text-violet-400 hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/DiscountCodes.tsx` | 87 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/InvoiceNumbering.tsx` | 186 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/RateNegotiationHelper.tsx` | 96 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/EmailTemplates.tsx` | 135 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/StripePaymentStatus.tsx` | 49 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/CapacityCalendar.tsx` | 132 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/RateIncreaseHistory.tsx` | 80 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/export/page.tsx` | 43 | `text-blue-400 bg-blue-900/20` | `text-violet-400 bg-violet-900/20` | tailwind |
| `src/app/(app)/settings/export/page.tsx` | 130 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/export/page.tsx` | 162 | `bg-blue-900/20 border-blue-800/40` | `bg-violet-900/20 border-violet-800/40` | tailwind |
| `src/app/(app)/settings/export/page.tsx` | 163 | `text-blue-300` | `text-violet-300` | tailwind |
| `src/app/(app)/settings/export/page.tsx` | 164 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/settings/IntegrationsHub.tsx` | 24 | `bg-blue-900/30` | `bg-violet-900/30` | tailwind |
| `src/app/(app)/settings/IntegrationsHub.tsx` | 25 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/settings/IntegrationsHub.tsx` | 164 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/RateCard.tsx` | 144 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PortfolioSettings.tsx` | 188 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PortfolioSettings.tsx` | 338 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/api/APIKeysClient.tsx` | 1405 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/retainers/health/page.tsx` | 51 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/settings/availability/page.tsx` | 84 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/tasks/page.tsx` | 62 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tasks/page.tsx` | 538 | `bg-blue-500 border-blue-500` | `bg-violet-500 border-violet-500` | tailwind |
| `src/app/(app)/settings/GmailConnect.tsx` | 136 | `text-blue-400 hover:text-blue-300 hover:bg-blue-900/20` | `text-violet-400 hover:text-violet-300 hover:bg-violet-900/20` | tailwind |
| `src/app/(app)/settings/GmailConnect.tsx` | 163 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/settings/PublicRates.tsx` | 200 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/settings/PriceIncreaseEmail.tsx` | 115 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tasks/recurring/RecurringTasksClient.tsx` | 51 | `bg-blue-900/30 text-blue-300` | `bg-violet-900/30 text-violet-300` | tailwind |
| `src/app/(app)/tasks/recurring/RecurringTasksClient.tsx` | 60 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tasks/recurring/RecurringTasksClient.tsx` | 66 | `border-blue-500 bg-blue-500` | `border-violet-500 bg-violet-500` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 339 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 352 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 370 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 381 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 420 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tools/objection-handler/page.tsx` | 453 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 48 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 55 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 590 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 607 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 679 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/welcome-kit/page.tsx` | 680 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 76 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 77 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 78 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 79 | `border-blue-700` | `border-violet-700` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 80 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/tools/runway/page.tsx` | 579 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/tools/faq-builder/page.tsx` | 36 | `bg-blue-900/40 text-blue-300` | `bg-violet-900/40 text-violet-300` | tailwind |
| `src/app/(app)/tools/faq-builder/page.tsx` | 37 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/faq-builder/page.tsx` | 40 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/faq-builder/page.tsx` | 478 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/faq-builder/page.tsx` | 484 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tools/client-intelligence/ClientIntelligenceClient.tsx` | 34 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/tools/client-intelligence/ClientIntelligenceClient.tsx` | 211 | `bg-blue-900/20 text-blue-400 border-blue-700` | `bg-violet-900/20 text-violet-400 border-violet-700` | tailwind |
| `src/app/(app)/tools/client-intelligence/ClientIntelligenceClient.tsx` | 375 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/roi-calculator/page.tsx` | 500 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/tools/roi-calculator/page.tsx` | 535 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tools/roi-calculator/page.tsx` | 557 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/tools/client-brief/page.tsx` | 384 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/tools/client-brief/page.tsx` | 386 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 56 | `text-blue-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 57 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 58 | `border-blue-700` | `border-violet-700` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 59 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 87 | `bg-blue-900/20 border-blue-700 text-blue-300` | `bg-violet-900/20 border-violet-700 text-violet-300` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 94 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/tools/capacity/page.tsx` | 374 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/work-life/WorkLifeClient.tsx` | 190 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tools/budgets/BudgetsClient.tsx` | 154 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tools/complexity-estimator/page.tsx` | 39 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/tools/complexity-estimator/page.tsx` | 48 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tools/complexity-estimator/page.tsx` | 351 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/complexity-estimator/page.tsx` | 519 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/complexity-estimator/page.tsx` | 528 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 30 | `bg-blue-900/40 text-blue-300 border-blue-700` | `bg-violet-900/40 text-violet-300 border-violet-700` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 31 | `bg-blue-900/40 text-blue-300 border-blue-700` | `bg-violet-900/40 text-violet-300 border-violet-700` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 335 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 336 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 381 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 418 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/proposal-templates/page.tsx` | 657 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/call-prep/page.tsx` | 21 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tools/call-prep/page.tsx` | 275 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 133 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 150 | `bg-blue-600` | `bg-violet-600` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 181 | `bg-blue-600` | `bg-violet-600` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 202 | `text-blue-400 hover:underline` | `text-violet-400 hover:underline` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 213 | `border-blue-500 bg-blue-900/20` | `border-violet-500 bg-violet-900/20` | tailwind |
| `src/app/(app)/inbox/page.tsx` | 216 | `border-blue-800/30 hover:bg-blue-900/20` | `border-violet-800/30 hover:bg-violet-900/20` | tailwind |
| `src/app/(app)/savings/SavingsPageClient.tsx` | 280 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/savings/SavingsPageClient.tsx` | 282 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/savings/SavingsPageClient.tsx` | 459 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/invoices/generate/page.tsx` | 467 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/generate/page.tsx` | 507 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/invoices/generate/page.tsx` | 510 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/invoices/templates/page.tsx` | 224 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/PartialPayment.tsx` | 165 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InvoiceEmailDraft.tsx` | 77 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InvoicePayments.tsx` | 27 | `bg-blue-900/40 text-blue-400` | `bg-violet-900/40 text-violet-400` | tailwind |
| `src/app/(app)/invoices/[id]/InvoicePayments.tsx` | 276 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/AutoReminder.tsx` | 55 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InstallmentPlanManager.tsx` | 198 | `group-hover:text-indigo-300` | `group-hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InstallmentPlanManager.tsx` | 261 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InstallmentPlanManager.tsx` | 369 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/new/page.tsx` | 614 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/new/page.tsx` | 648 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/new/page.tsx` | 671 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/page.tsx` | 339 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/PaymentPlan.tsx` | 155 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InvoiceSummaryAI.tsx` | 59 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/edit/page.tsx` | 214 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/edit/page.tsx` | 244 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/edit/page.tsx` | 270 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/edit/page.tsx` | 286 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/collections/page.tsx` | 213 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/recurring/new/page.tsx` | 274 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/CopyButton.tsx` | 7 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/estimates/page.tsx` | 98 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/invoices/[id]/InvoiceQR.tsx` | 40 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/estimates/[id]/page.tsx` | 193 | `text-blue-400 border border-blue-800/30 hover:bg-blue-900/20` | `text-violet-400 border border-violet-800/30 hover:bg-violet-900/20` | tailwind |
| `src/app/(app)/time-off/calendar/page.tsx` | 21 | `bg-blue-900/20 text-blue-800 bg-blue-500` | `bg-violet-900/20 text-violet-800 bg-violet-500` | tailwind |
| `src/app/(app)/leads/analytics/page.tsx` | 41 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/leads/analytics/page.tsx` | 159 | `bg-blue-500/50` | `bg-violet-500/50` | tailwind |
| `src/app/(app)/leads/analytics/page.tsx` | 236 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/contracts/page.tsx` | 170 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/leads/page.tsx` | 42 | `bg-blue-500 text-blue-400` | `bg-violet-500 text-violet-400` | tailwind |
| `src/app/(app)/leads/page.tsx` | 50 | `bg-blue-500/20 text-blue-400` | `bg-violet-500/20 text-violet-400` | tailwind |
| `src/app/(app)/leads/page.tsx` | 249 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/leads/page.tsx` | 864 | `bg-blue-500/10 text-blue-400` | `bg-violet-500/10 text-violet-400` | tailwind |
| `src/app/(app)/contracts/analyze/ContractAnalyzer.tsx` | 271 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/expenses/breakdown/page.tsx` | 11 | `bg-cyan-500 bg-cyan-100 text-cyan-700` | `bg-violet-500 bg-violet-100 text-violet-700` | tailwind |
| `src/app/(app)/contracts/[id]/ContractChecklist.tsx` | 72 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/contracts/[id]/ContractChecklist.tsx` | 75 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/contracts/[id]/ContractChecklist.tsx` | 81 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/contracts/[id]/ContractChecklist.tsx` | 89 | `text-blue-600 focus:ring-blue-500` | `text-violet-600 focus:ring-violet-500` | tailwind |
| `src/app/(app)/contracts/expiry/page.tsx` | 89 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/expenses/recurring/RecurringExpensesClient.tsx` | 34 | `bg-blue-100 text-blue-400 border-blue-800/30` | `bg-violet-100 text-violet-400 border-violet-800/30` | tailwind |
| `src/app/(app)/projects/retainers/page.tsx` | 529 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/ai-brief/page.tsx` | 276 | `group-hover:text-indigo-300` | `group-hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/ai-brief/page.tsx` | 308 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/board/KanbanBoard.tsx` | 22 | `bg-blue-500 bg-blue-900/20` | `bg-amber-500 bg-amber-900/20` | tailwind |
| `src/app/(app)/projects/board/KanbanBoard.tsx` | 119 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/contracts/renewals/RenewalCenterClient.tsx` | 228 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/gantt/page.tsx` | 30 | `bg-blue-400 border-blue-500 text-blue-100` | `bg-amber-400 border-amber-500 text-amber-100` | tailwind |
| `src/app/(app)/projects/gantt/page.tsx` | 129 | `bg-blue-400` | `bg-amber-400` | tailwind |
| `src/app/(app)/projects/milestone-billing/page.tsx` | 166 | `bg-blue-900/30` | `bg-violet-900/30` | tailwind |
| `src/app/(app)/projects/milestone-billing/page.tsx` | 167 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/projects/new/page.tsx` | 217 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/new/page.tsx` | 253 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/new/page.tsx` | 279 | `text-indigo-300 hover:text-indigo-200` | `text-violet-300 hover:text-violet-200` | tailwind |
| `src/app/(app)/projects/new/page.tsx` | 284 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/Milestones.tsx` | 186 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/BurndownChart.tsx` | 55 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/BurndownChart.tsx` | 71 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/BurndownChart.tsx` | 105 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/ClientCheckIn.tsx` | 60 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/ClientCheckIn.tsx` | 73 | `bg-blue-900/30` | `bg-violet-900/30` | tailwind |
| `src/app/(app)/projects/[id]/ClientCheckIn.tsx` | 81 | `focus:ring-blue-200` | `focus:ring-violet-200` | tailwind |
| `src/app/(app)/projects/[id]/ClientCheckIn.tsx` | 83 | `text-blue-400 hover:text-blue-800` | `text-violet-400 hover:text-violet-800` | tailwind |
| `src/app/(app)/projects/[id]/ClientCheckIn.tsx` | 97 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/projects/[id]/TimeBudget.tsx` | 44 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/Deliverables.tsx` | 91 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/Deliverables.tsx` | 143 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/Deliverables.tsx` | 147 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ScopeChangeLog.tsx` | 76 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/BudgetPanel.tsx` | 42 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/BudgetPanel.tsx` | 73 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/CompletionEstimate.tsx` | 56 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProjectDecisionLog.tsx` | 71 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProjectTeamSection.tsx` | 36 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/ProjectTeamSection.tsx` | 44 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/ProjectTeamSection.tsx` | 110 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/BudgetBreakdown.tsx` | 15 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/TimeProgress.tsx` | 42 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/NPSSurveyButton.tsx` | 94 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/NPSSurveyButton.tsx` | 103 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProjectFiles.tsx` | 29 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/ProjectFiles.tsx` | 147 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProjectFiles.tsx` | 197 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/page.tsx` | 357 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/page.tsx` | 380 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProgressBar.tsx` | 60 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/ProjectFeedback.tsx` | 138 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/DependencyMap.tsx` | 18 | `bg-blue-900/20 text-blue-400` | `bg-amber-900/20 text-amber-400` | tailwind |
| `src/app/(app)/projects/[id]/DependencyMap.tsx` | 173 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 48 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 57 | `focus:ring-blue-200` | `focus:ring-violet-200` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 59 | `focus:ring-blue-200` | `focus:ring-violet-200` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 61 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 71 | `bg-blue-900/20 border border-blue-800/20` | `bg-violet-900/20 border border-violet-800/20` | tailwind |
| `src/app/(app)/projects/[id]/ProjectCheckpointEmail.tsx` | 73 | `text-blue-300 hover:text-blue-300` | `text-violet-300 hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/StandupAI.tsx` | 43 | `text-cyan-500` | `text-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/StandupAI.tsx` | 51 | `focus:ring-cyan-500` | `focus:ring-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/StandupAI.tsx` | 55 | `bg-cyan-600 hover:bg-cyan-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/projects/[id]/StandupAI.tsx` | 65 | `text-cyan-400 hover:text-cyan-800` | `text-violet-400 hover:text-violet-800` | tailwind |
| `src/app/(app)/projects/[id]/StandupAI.tsx` | 70 | `bg-cyan-900/20 border border-cyan-800/20` | `bg-violet-900/20 border border-violet-800/20` | tailwind |
| `src/app/(app)/projects/[id]/board/page.tsx` | 35 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/MilestonesPanel.tsx` | 209 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/MilestonesPanel.tsx` | 365 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/CostEstimator.tsx` | 74 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/notes/page.tsx` | 268 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/[id]/retro/page.tsx` | 244 | `text-blue-400` | `text-amber-400` | tailwind |
| `src/app/(app)/projects/[id]/retro/page.tsx` | 315 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/projects/[id]/risks/page.tsx` | 626 | `text-blue-400 border-blue-800/30 hover:bg-blue-900/20` | `text-violet-400 border-violet-800/30 hover:bg-violet-900/20` | tailwind |
| `src/app/(app)/projects/[id]/postmortem/page.tsx` | 197 | `text-blue-400 bg-blue-900/20` | `text-violet-400 bg-violet-900/20` | tailwind |
| `src/app/(app)/projects/timeline/TimelineView.tsx` | 34 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/timeline/TimelineView.tsx` | 275 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/projects/timeline/TimelineView.tsx` | 338 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/[id]/board/TaskKanbanBoard.tsx` | 24 | `bg-blue-500 border-blue-800/30 bg-blue-900/20 bg-blue-900/30 text-blue-400` | `bg-amber-500 border-amber-800/30 bg-amber-900/20 bg-amber-900/30 text-amber-400` | tailwind |
| `src/app/(app)/projects/[id]/board/TaskKanbanBoard.tsx` | 33 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsValue.tsx` | 39 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsValue.tsx` | 41 | `text-blue-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsValue.tsx` | 54 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/projects/onboarding/page.tsx` | 66 | `bg-blue-900/30 text-blue-400 bg-blue-500` | `bg-violet-900/30 text-violet-400 bg-violet-500` | tailwind |
| `src/app/(app)/tax-estimator/TaxEstimatorClient.tsx` | 501 | `dark:text-indigo-300` | `dark:text-violet-300` | tailwind |
| `src/app/(app)/tax-estimator/TaxEstimatorClient.tsx` | 642 | `dark:text-indigo-300` | `dark:text-violet-300` | tailwind |
| `src/app/(app)/tax-estimator/TaxEstimatorClient.tsx` | 646 | `dark:text-indigo-300` | `dark:text-violet-300` | tailwind |
| `src/app/(app)/dashboard/TopProjectsThisMonth.tsx` | 52 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/TopProjectsThisMonth.tsx` | 60 | `group-hover:text-blue-700` | `group-hover:text-violet-700` | tailwind |
| `src/app/(app)/dashboard/TopProjectsThisMonth.tsx` | 64 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/TodayAgenda.tsx` | 57 | `bg-blue-900/40 text-blue-300` | `bg-violet-900/40 text-violet-300` | tailwind |
| `src/app/(app)/dashboard/ProposalWinRateWidget.tsx` | 68 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/dashboard/MonthToDateSnapshot.tsx` | 41 | `text-blue-400 bg-blue-900/20` | `text-violet-400 bg-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 99 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 105 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 106 | `text-blue-300` | `text-violet-300` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 107 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 117 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 121 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/NewVsReturningRevenue.tsx` | 134 | `bg-blue-300` | `bg-violet-300` | tailwind |
| `src/app/(app)/dashboard/InvoiceDraftToSent.tsx` | 71 | `text-sky-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/InvoiceDraftToSent.tsx` | 78 | `bg-sky-50` | `bg-violet-50` | tailwind |
| `src/app/(app)/dashboard/InvoiceDraftToSent.tsx` | 79 | `text-sky-800` | `text-violet-800` | tailwind |
| `src/app/(app)/dashboard/InvoiceDraftToSent.tsx` | 80 | `text-sky-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/InvoiceDraftToSent.tsx` | 91 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/DiversificationWidget.tsx` | 45 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/DiversificationWidget.tsx` | 73 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/dashboard/DiversificationWidget.tsx` | 127 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/dashboard/FreelanceHealthScore.tsx` | 110 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/WeeklyGoalWidget.tsx` | 86 | `stroke-blue-500` | `stroke-violet-500` | tailwind |
| `src/app/(app)/dashboard/WeeklyGoalWidget.tsx` | 92 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/WeeklyGoalWidget.tsx` | 183 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/QuickWinWidget.tsx` | 43 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/TopPerformingMonth.tsx` | 99 | `bg-blue-900/20 border-blue-800/30` | `bg-violet-900/20 border-violet-800/30` | tailwind |
| `src/app/(app)/dashboard/TopPerformingMonth.tsx` | 102 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/TopPerformingMonth.tsx` | 104 | `text-blue-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/TopPerformingMonth.tsx` | 105 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 38 | `border-blue-800/30` | `border-violet-800/30` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 40 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 42 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 52 | `bg-blue-900/20 hover:bg-blue-100` | `bg-violet-900/20 hover:bg-violet-100` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 54 | `group-hover:text-blue-400` | `group-hover:text-violet-400` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 57 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/InvoiceReadyAlert.tsx` | 62 | `text-blue-500 hover:text-blue-400` | `text-violet-500 hover:text-violet-400` | tailwind |
| `src/app/(app)/dashboard/RevenueBySource.tsx` | 53 | `bg-blue-400, bg-cyan-400` | `bg-violet-400, bg-violet-300` | tailwind |
| `src/app/(app)/dashboard/UpcomingDeadlines.tsx` | 71 | `bg-blue-300` | `bg-violet-300` | tailwind |
| `src/app/(app)/dashboard/UpcomingDeadlines.tsx` | 76 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ClientReachOutFeed.tsx` | 58 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ClientReachOutFeed.tsx` | 60 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/SubscriptionRenewalsWidget.tsx` | 53 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/SubscriptionRenewalsWidget.tsx` | 56 | `text-blue-500 hover:text-blue-400` | `text-violet-500 hover:text-violet-400` | tailwind |
| `src/app/(app)/dashboard/RecentClientActivity.tsx` | 58 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/ProjectStatusSummary.tsx` | 10 | `text-blue-400 bg-blue-900/20 border-blue-800/30` | `text-violet-400 bg-violet-900/20 border-violet-800/30` | tailwind |
| `src/app/(app)/dashboard/ProjectStatusSummary.tsx` | 83 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/RecentActivityWidget.tsx` | 30 | `text-blue-400, bg-blue-100` | `text-violet-400, bg-violet-100` | tailwind |
| `src/app/(app)/dashboard/ProjectsDueWidget.tsx` | 41 | `bg-blue-100 text-blue-400` | `bg-violet-100 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/QuickProposalStats.tsx` | 41 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/QuickProposalStats.tsx` | 51 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/QuickProposalStats.tsx` | 70 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ProjectTimelineView.tsx` | 44 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/ProjectTimelineView.tsx` | 52 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ProjectTimelineView.tsx` | 76 | `bg-blue-300` | `bg-violet-300` | tailwind |
| `src/app/(app)/dashboard/AvailabilityWidget.tsx` | 112 | `bg-blue-900/20 border-blue-800/30` | `bg-violet-900/20 border-violet-800/30` | tailwind |
| `src/app/(app)/dashboard/AvailabilityWidget.tsx` | 115 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/AvailabilityWidget.tsx` | 118 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/AvailabilityWidget.tsx` | 122 | `text-blue-500 hover:text-blue-400` | `text-violet-500 hover:text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsBudgetSummary.tsx` | 56 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsBudgetSummary.tsx` | 67 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsBudgetSummary.tsx` | 68 | `text-blue-300` | `text-violet-300` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsBudgetSummary.tsx` | 69 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsBudgetSummary.tsx` | 91 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/DeadlinesWidget.tsx` | 47 | `bg-blue-100 text-blue-400` | `bg-violet-100 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/AIBusinessInsight.tsx` | 10 | `bg-blue-100 text-blue-400` | `bg-violet-100 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 53 | `from-sky-900/20 ... border-sky-800/30` | `from-violet-900/20 ... border-violet-800/30` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 55 | `text-sky-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 56 | `text-sky-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 57 | `text-sky-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 64 | `bg-sky-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 69 | `text-sky-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 72 | `text-sky-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/TodaysSummaryCard.tsx` | 74 | `text-sky-400` | `text-violet-400` | tailwind |
| `src/app/(app)/dashboard/RevenueRunRate.tsx` | 43 | `to-blue-900/20` | `to-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/CashFlowWidget.tsx` | 74 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(app)/dashboard/RevenueForecastWidget.tsx` | 72 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/dashboard/EarningsPaceWidget.tsx` | 56 | `text-cyan-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/EarningsPaceWidget.tsx` | 66 | `bg-cyan-50` | `bg-violet-50` | tailwind |
| `src/app/(app)/dashboard/EarningsPaceWidget.tsx` | 67 | `text-cyan-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/EarningsPaceWidget.tsx` | 68 | `text-cyan-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/EarningsPaceWidget.tsx` | 80 | `bg-cyan-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/ClientLongevity.tsx` | 56 | `text-blue-400 bg-blue-900/20` | `text-violet-400 bg-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsSummary.tsx` | 48 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsSummary.tsx` | 54 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsSummary.tsx` | 55 | `text-blue-900` | `text-violet-900` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsSummary.tsx` | 56 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/dashboard/ActiveProjectsSummary.tsx` | 88 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/dashboard/OnboardingBanner.tsx` | 59 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/dashboard/OnboardingBanner.tsx` | 69 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/dashboard/OnboardingBanner.tsx` | 122 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/dashboard/WeeklyWrapUp.tsx` | 84 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/dashboard/ActivityFeed.tsx` | 80 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/team/TeamPageClient.tsx` | 69 | `bg-blue-900/30 text-blue-400 dark:bg-blue-900/40 dark:text-blue-300` | `bg-violet-900/30 text-violet-400 dark:bg-violet-900/40 dark:text-violet-300` | tailwind |
| `src/app/(app)/team/TeamPageClient.tsx` | 77 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/tax-report/page.tsx` | 100 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tax-report/TaxSummaryWidget.tsx` | 100 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/(app)/tax-report/TaxAISummary.tsx` | 80 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/(app)/revenue-goals/GoalsPageClient.tsx` | 138 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/revenue-goals/GoalsPageClient.tsx` | 180 | `text-violet-400 dark:text-indigo-300` | `text-violet-400 dark:text-violet-300` | tailwind |
| `src/app/(app)/availability/page.tsx` | 436 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/availability/page.tsx` | 455 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 130 | `text-violet-400 dark:text-indigo-300` | `text-violet-400 dark:text-violet-300` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 283 | `text-violet-400 dark:text-indigo-300` | `text-violet-400 dark:text-violet-300` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 330 | `bg-blue-900/20 dark:bg-blue-900/20 border-blue-800/20 dark:border-blue-800` | `bg-violet-900/20 dark:bg-violet-900/20 border-violet-800/20 dark:border-violet-800` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 332 | `text-blue-400 dark:text-blue-400` | `text-violet-400 dark:text-violet-400` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 333 | `text-blue-400 dark:text-blue-400` | `text-violet-400 dark:text-violet-400` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 336 | `text-blue-400 dark:text-blue-400` | `text-violet-400 dark:text-violet-400` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 341 | `hover:bg-blue-900/30 dark:hover:bg-blue-900/40` | `hover:bg-violet-900/30 dark:hover:bg-violet-900/40` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 344 | `text-blue-400 text-blue-500` | `text-violet-400 text-violet-500` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 400 | `text-violet-400 dark:text-indigo-300` | `text-violet-400 dark:text-violet-300` | tailwind |
| `src/app/(app)/rate-calculator/RateCalculatorClient.tsx` | 401 | `text-violet-400 dark:text-indigo-300` | `text-violet-400 dark:text-violet-300` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 20 | `bg-blue-900/30 text-blue-400` | `bg-violet-900/30 text-violet-400` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 29 | `bg-blue-500` | `bg-violet-500` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 61 | `border-blue-500/30` | `border-violet-500/30` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 277 | `border-blue-800/30 bg-blue-900/20` | `border-violet-800/30 bg-violet-900/20` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 278 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/deadlines/page.tsx` | 279 | `text-blue-400/80` | `text-violet-400/80` | tailwind |
| `src/app/(app)/skills/page.tsx` | 516 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/billing/BillingPageClient.tsx` | 268 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/billing/BillingPageClient.tsx` | 269 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/onboarding/OnboardingWizard.tsx` | 464 | `bg-blue-900/30` | `bg-violet-900/30` | tailwind |
| `src/app/(app)/onboarding/OnboardingWizard.tsx` | 465 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/onboarding/OnboardingWizard.tsx` | 532 | `bg-blue-600 hover:bg-blue-700` | `bg-violet-600 hover:bg-violet-700` | tailwind |
| `src/app/(app)/onboarding/OnboardingWizard.tsx` | 626 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/help/page.tsx` | 15 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/app/(app)/proposals/ProposalPipelineValue.tsx` | 22 | `bg-blue-400, bg-blue-900/20` | `bg-amber-400, bg-amber-900/20` | tailwind |
| `src/app/(app)/proposals/ProposalPipelineValue.tsx` | 47 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/app/(app)/proposals/ProposalPipelineValue.tsx` | 50 | `text-blue-400 bg-blue-900/40` | `text-violet-400 bg-violet-900/40` | tailwind |
| `src/app/(app)/proposals/templates/TemplateLibraryClient.tsx` | 30 | `bg-blue-900/20 text-blue-400 border-blue-800/30` | `bg-violet-900/20 text-violet-400 border-violet-800/30` | tailwind |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 468 | `bg-sky-50 border border-sky-200` | `bg-violet-50 border border-violet-200` | tailwind |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 470 | `text-sky-500` | `text-violet-500` | tailwind |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 472 | `text-sky-800` | `text-violet-800` | tailwind |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 475 | `text-sky-700` | `text-violet-700` | tailwind |
| `src/app/(app)/proposals/price-estimator/PriceEstimatorClient.tsx` | 476 | `bg-sky-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/analytics/payment-reliability/page.tsx` | 262 | `bg-blue-100` | `bg-violet-100` | tailwind |
| `src/app/(app)/analytics/payment-reliability/page.tsx` | 263 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/analytics/client-work-report/page.tsx` | 167 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/analytics/revenue-pipeline/page.tsx` | 101 | `bg-blue-600` | `bg-violet-600` | tailwind |
| `src/app/(app)/analytics/revenue-pipeline/page.tsx` | 103 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/analytics/client-tiers/page.tsx` | 102 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/reports/year-in-review/page.tsx` | 144 | `from-emerald-400 to-cyan-400` | `from-violet-400 to-violet-300` | tailwind |
| `src/app/(app)/reports/year-in-review/page.tsx` | 269 | `text-sky-400` | `text-violet-400` | tailwind |
| `src/app/(app)/reports/expenses/page.tsx` | 270 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/reports/expenses/page.tsx` | 355 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/app/(app)/reports/annual/AnnualReportClient.tsx` | 267 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/reports/annual/AnnualReportClient.tsx` | 268 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/reports/quarterly/page.tsx` | 85 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/reports/monthly/MonthlyReportClient.tsx` | 372 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/reports/monthly/MonthlyReportClient.tsx` | 373 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/(app)/reports/annual-review/page.tsx` | 331 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/app/(app)/reports/annual-review/page.tsx` | 332 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/app/profile/[handle]/page.tsx` | 269 | `from-blue-400 to-violet-600` | `from-violet-400 to-violet-600` | tailwind |
| `src/app/profile/[handle]/page.tsx` | 270 | `bg-blue-100 text-blue-700 border-blue-200` | `bg-violet-100 text-violet-700 border-violet-200` | tailwind |
| `src/app/portfolio/[handle]/page.tsx` | 90 | `from-blue-500 to-violet-700` | `from-violet-500 to-violet-700` | tailwind |
| `src/app/(auth)/mfa/page.tsx` | 133 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/register/page.tsx` | 187 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/register/page.tsx` | 189 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/register/page.tsx` | 225 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/forgot-password/page.tsx` | 54 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/login/page.tsx` | 113 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/(auth)/login/page.tsx` | 154 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/app/survey/project/[token]/page.tsx` | 90 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/p/[username]/page.tsx` | 133 | `text-indigo-300 border-violet-400/30` | `text-violet-300 border-violet-400/30` | tailwind |
| `src/app/p/[username]/page.tsx` | 245 | `text-indigo-200/80` | `text-violet-200/80` | tailwind |
| `src/app/p/[username]/page.tsx` | 248 | `text-indigo-200/80` | `text-violet-200/80` | tailwind |
| `src/app/p/[username]/page.tsx` | 251 | `text-indigo-200/80` | `text-violet-200/80` | tailwind |
| `src/app/p/[username]/page.tsx` | 256 | `text-indigo-200/70` | `text-violet-200/70` | tailwind |
| `src/app/p/[username]/page.tsx` | 264 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/p/[username]/page.tsx` | 274 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/p/[username]/page.tsx` | 388 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/p/[username]/page.tsx` | 462 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/app/p/[username]/page.tsx` | 481 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/p/[username]/page.tsx` | 529 | `from-sky-50 to-violet-50 border-sky-200 text-sky-600 bg-sky-600` | `from-violet-50 to-violet-50 border-violet-200 text-violet-600 bg-violet-600` | tailwind |
| `src/app/p/[username]/page.tsx` | 568 | `from-blue-500 to-violet-700` | `from-violet-500 to-violet-700` | tailwind |
| `src/app/p/[username]/page.tsx` | 621 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/content/blog/index.ts` | 71 | `from-blue-500 to-violet-600` | `from-violet-500 to-violet-600` | tailwind |
| `src/content/blog/index.ts` | 75 | `from-indigo-500 to-violet-600` | `from-violet-500 to-violet-600` | tailwind |
| `src/components/QuickAddFAB.tsx` | 28 | `text-sky-400` | `text-violet-400` | tailwind |
| `src/components/ProjectTemplateSelector.tsx` | 180 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/demo/mockups/ClientsMockup.tsx` | 3 | `from-blue-500 to-blue-700` | `from-violet-500 to-violet-700` | tailwind |
| `src/components/SnippetPicker.tsx` | 15 | `bg-blue-900/20 text-blue-400` | `bg-violet-900/20 text-violet-400` | tailwind |
| `src/components/demo/mockups/InvoicesMockup.tsx` | 13 | `bg-blue-500/20 text-blue-400` | `bg-amber-500/20 text-amber-400` | tailwind |
| `src/components/demo/mockups/TimeTrackerMockup.tsx` | 28 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/demo/mockups/DashboardMockup.tsx` | 80 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/ui/QuickExpenseModal.tsx` | 105 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/components/ui/TierBadge.tsx` | 10 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/components/ActivityFeed.tsx` | 106 | `text-blue-500 hover:text-blue-400` | `text-violet-500 hover:text-violet-400` | tailwind |
| `src/components/ActivityFeed.tsx` | 138 | `text-blue-500 hover:text-blue-400` | `text-violet-500 hover:text-violet-400` | tailwind |
| `src/components/ui/GlobalTimerBar.tsx` | 134 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/ui/GlobalTimerBar.tsx` | 136 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/ui/GlobalTimerBar.tsx` | 146 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/components/ui/GlobalTimerBar.tsx` | 147 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/components/layout/Sidebar.tsx` | 179 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/components/ui/GlobalSearch.tsx` | 24 | `text-blue-500` | `text-violet-500` | tailwind |
| `src/components/dashboard/NotesWidget.tsx` | 41 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 203 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 209 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 213 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 217 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 222 | `text-indigo-300` | `text-violet-300` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 240 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/components/marketing/PricingSection.tsx` | 253 | `hover:text-indigo-300` | `hover:text-violet-300` | tailwind |
| `src/components/marketing/HeroDashboardMockup.tsx` | 59 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/marketing/HeroDashboardMockup.tsx` | 62 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 45 | `bg-blue-900/20` | `bg-violet-900/20` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 46 | `border-blue-800` | `border-violet-800` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 47 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 48 | `bg-blue-400` | `bg-violet-400` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 49 | `bg-blue-900/40 text-blue-300` | `bg-violet-900/40 text-violet-300` | tailwind |
| `src/components/streaks/StreakCard.tsx` | 50 | `text-blue-400` | `text-violet-400` | tailwind |
| `src/components/dashboard/WelcomeBanner.tsx` | 76 | `text-indigo-200` | `text-violet-200` | tailwind |
| `src/app/layout.tsx` | 87 | `#6366f1 (PWA themeColor)` | `shared BRAND_VIOLET token (#8b5cf6 or named const)` | hex |
| `src/app/opengraph-image.tsx` | 19 | `#0f172a` | `shared BG palette token` | hex |
| `src/app/opengraph-image.tsx` | 66 | `#6366f1` | `shared BRAND_VIOLET token` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 9 | `#1e293b` | `shared CARD palette token` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 22 | `#0f172a` | `shared BG palette token` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 37 | `#1e293b / #334155` | `shared CARD / BORDER tokens` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 46 | `#1e293b / #334155` | `shared CARD / BORDER tokens` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 48 | `#334155` | `shared BORDER token` | hex |
| `src/components/ui/PageLoadingSkeleton.tsx` | 56 | `#0f172a` | `shared BG token` | hex |
| `src/components/layout/MobileNav.tsx` | 33 | `#334155` | `shared BORDER token` | hex |
| `src/components/layout/MobileNav.tsx` | 53 | `#0f172a` | `shared BG token` | hex |
| `src/components/layout/MobileNav.tsx` | 54 | `#1e293b` | `shared CARD token` | hex |
| `src/components/layout/MobileNav.tsx` | 57 | `#1e293b` | `shared CARD token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 134 | `#22c55e / #f59e0b / #ec4899 / #06b6d4 confetti` | `violet-family confetti palette OR keep as decorative flair` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 152 | `#0f172a` | `shared BG token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 156 | `#1e293b` | `shared CARD token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 168 | `#0f172a` | `shared BG token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 172 | `#1e293b` | `shared CARD token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 355 | `#1e293b` | `shared CARD token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 486 | `#1e293b` | `shared CARD token` | hex |
| `src/components/onboarding/OnboardingChecklist.tsx` | 488 | `#334155` | `shared BORDER token` | hex |
| `src/app/api-docs/page.tsx` | 277 | `#0f172a` | `shared BG token` | hex |
| `src/app/api-docs/page.tsx` | 279 | `#1e293b` | `shared CARD token` | hex |
| `src/app/n8n-templates/page.tsx` | 304 | `#0f172a` | `shared BG token` | hex |
| `src/app/n8n-templates/page.tsx` | 306 | `#1e293b` | `shared CARD token` | hex |
| `src/app/n8n-templates/page.tsx` | 332 | `#1e293b / #334155` | `shared CARD / BORDER tokens` | hex |
| `src/app/n8n-templates/page.tsx` | 339 | `#1e293b` | `shared CARD token` | hex |
| `src/app/n8n-templates/page.tsx` | 361 | `#1e293b` | `shared CARD token` | hex |
| `src/app/n8n-templates/page.tsx` | 395 | `#0f172a` | `shared BG token` | hex |
| `src/app/rates/[slug]/RateCardView.tsx` | 116 | `#334155` | `shared text-muted token` | hex |
| `src/app/rates/[slug]/RateCardView.tsx` | 163 | `#0f172a` | `shared text-primary token` | hex |
| `src/app/rates/[slug]/RateCardView.tsx` | 207 | `#0f172a` | `shared text-primary token` | hex |
| `src/app/proposal-pdf/[token]/page.tsx` | 0 | `27 inline hex literals (BG/CARD/BORDER + brand accent)` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/hire/[slug]/HirePageContent.tsx` | 0 | `18 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/portfolio/[handle]/PortfolioPageView.tsx` | 0 | `17 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/client/[token]/page.tsx` | 0 | `17 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/time-report/[token]/PublicTimeReportView.tsx` | 0 | `15 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/survey/[token]/SurveyFormClient.tsx` | 0 | `15 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/case-study/[slug]/page.tsx` | 0 | `15 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/portal/[token]/PortalView.tsx` | 0 | `11 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/sla/[token]/page.tsx` | 0 | `13 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/quote/[token]/page.tsx` | 0 | `10 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/nps/[token]/NPSSurveyClient.tsx` | 0 | `10 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/brand/[token]/PublicBrandGuideView.tsx` | 0 | `10 inline hex literals (decor portion only)` | `shared palette tokens; KEEP user-picked brand colors` | hex |
| `src/app/contract/[token]/page.tsx` | 0 | `9 inline hex literals` | `shared palette tokens (file-wide refactor)` | hex |
| `src/app/health-report/[token]/page.tsx` | 0 | `11 inline hex literals (decor only)` | `shared palette tokens; KEEP semantic status colors` | hex |
| `src/app/api/invoice-pdf-templates/preview/route.ts` | 0 | `13 inline hex literals (PDF preview)` | `shared PDF palette tokens` | hex |
| `src/app/api/reports/send-test-renewal/route.ts` | 0 | `12 inline hex literals (email HTML)` | `shared email-palette constants (inline styles kept for email-client compat)` | hex |
| `src/app/changelog/page.tsx` | 0 | `5 inline hex literals` | `shared palette tokens` | hex |

## TIER 3: Inline-palette bulk files (62)

Mechanical mass-migrate (each file uses `const BG/CARD/BORDER/TEXT/MUTED/ACCENT`):

- `src/app/(app)/clients/testimonials/TestimonialClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/clients/referrals/ReferralTrackerClient.tsx` — consts: BG, CARD_BG, BORDER, TEXT, ACCENT, MUTED, MUTED2
- `src/app/(app)/clients/network/NetworkClient.tsx` — consts: BG, CARD, BORDER, TEXT, ACCENT, MUTED
- `src/app/(app)/clients/leads/LeadsPipelineClient.tsx` — consts: BG, CARD, BORDER, TEXT, ACCENT, MUTED
- `src/app/(app)/clients/meeting-notes/MeetingNotesClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/forecast/ForecastClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/income-diversification/IncomeDiversificationClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/bio-generator/BioGeneratorClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/invoice-reminders/InvoiceRemindersClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/status-update/StatusUpdateClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/client-avatars/ClientAvatarsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/scope-estimator/ScopeEstimatorClient.tsx` — consts: BG, CARD, BORDER, TEXT, TEXT_MUTED, ACCENT
- `src/app/(app)/tools/performance-review/PerformanceReviewClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/press-kit/PressKitClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/profitability/ProfitabilityClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/achievements/AchievementsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/sop-generator/SOPGeneratorClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/estimate-tracker/EstimateTrackerClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/niche-research/NicheResearchClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/standups/StandupsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/social-content/SocialContentClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/learning/LearningTrackerClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/social-bios/SocialBiosClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/contracts/ContractsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/client-gifts/ClientGiftsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/tax-calendar/TaxCalendarClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/skill-gap/SkillGapClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/client-appreciation/ClientAppreciationClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/project-budgets/ProjectBudgetsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/service-descriptions/ServiceDescClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/cashflow/CashFlowClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/tax-estimator/TaxEstimatorClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/upsell/UpsellClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/rate-increase/RateIncreaseClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/discovery-call/DiscoveryCallClient.tsx` — consts: BG, CARD, BORDER, TEXT, ACCENT, MUTED
- `src/app/(app)/tools/pricing-strategy/PricingStrategyClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/pitch-deck/PitchDeckClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/rfp-analyzer/RFPAnalyzerClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/case-studies/CaseStudyClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/growth-roadmap/GrowthRoadmapClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/work-journal/WorkJournalSummaryClient.tsx` — consts: BG, CARD, BORDER, TEXT, ACCENT, MUTED
- `src/app/(app)/tools/proposal-analytics/ProposalAnalyticsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/niche-finder/NicheFinderClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/faq-generator/FAQGeneratorClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/competitor-analysis/CompetitorAnalysisClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/annual-report/AnnualReportClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/project-debrief/ProjectDebriefClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/retainer-proposal/RetainerProposalClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/proposal-followup/ProposalFollowupClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/rate-planner/RatePlannerClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/annual-review/AnnualReviewClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/cover-letters/CoverLettersClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/quarterly-review/QuarterlyReviewClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/health-score/HealthScoreClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/proposals/ProposalsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/tools/skill-analyzer/SkillAnalyzerClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/finance/time-reports/TimeReportsClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/finance/tax/TaxEstimatorClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/analytics/diversification/DiversificationClient.tsx` — consts: BG, CARD, BORDER, TEXT, TEXT_MUTED, ACCENT
- `src/app/(app)/analytics/proposal-analytics/ProposalAnalyticsClient.tsx` — consts: BG, CARD, BORDER, TEXT, TEXT_MUTED, ACCENT
- `src/app/(app)/analytics/health-score/HealthScoreClient.tsx` — consts: BG, CARD, BORDER, TEXT, MUTED, ACCENT
- `src/app/(app)/analytics/productivity/ProductivityHeatmapClient.tsx` — consts: BG, CARD, ELEVATED, BORDER, TEXT, TEXT_MUTED, TEXT_FAINT, ACCENT, ACCENT_BRIGHT, INTENSITY_COLORS

## Notes for fix-pass

```
PALETTE-MIGRATION UNIFIED MAP

TIER 1 - KEEP (status/brand semantic): ~138 hits
  - STATUS-keep: Sent/Viewed/Signed/Issued/Active/Booked status badges; grade tiers (B/B+/B-); HTTP method colors; info callouts; user-pickable palettes (label/tag/note/expense category colors); semantic status (low risk = blue, normal capacity, current aging, score bars, runway tiers)
  - BRAND-keep: Outlook/Microsoft, LinkedIn, Twitter/X, Freelancer.com brand identity colors; brand violet/indigo already in canonical brand range; logo tiles; CTA brand primary buttons that are explicitly violet-family

TIER 2 - MIGRATE (decor blue/indigo/cyan/sky -> violet): ~450 Tailwind hits + ~75 inline hex hits
  - Bulk pattern: blue-XXX -> violet-XXX, indigo-XXX -> violet-XXX, sky-XXX -> violet-XXX, cyan-XXX -> violet-XXX
  - Special amber exceptions (STATUS-fix-to-amber, ~8 hits): ClientFollowUp default pending, KanbanBoard In Progress, Gantt Pending, DependencyMap in-progress, TaskKanbanBoard in_progress, retro active status, ProposalPipelineValue Pending status, demo InvoicesMockup Pending - all become amber not violet
  - Hover states `hover:text-indigo-300` are ubiquitous and consistent (180+ instances) - safe global find/replace `hover:text-indigo-300` -> `hover:text-violet-300`
  - Cross-cutting prefix replacements suggested as codemod targets: `text-indigo-200` -> `text-violet-200`, `text-indigo-300` -> `text-violet-300`, `bg-blue-900/` -> `bg-violet-900/`, `text-blue-400` -> `text-violet-400` (filtered by KEEP exclusions)

TIER 3 - MECHANICAL BULK PALETTE FILES: 62 files using {BG, CARD, BORDER, TEXT, MUTED, ACCENT} pattern
  - 56 files: mechanical-replace (identical pattern, direct hex find-and-replace)
  - 6 files: manual-review
    - ReferralTrackerClient.tsx: uses CARD_BG (not CARD), extra MUTED2
    - MeetingNotesClient.tsx: THREE separate palette definitions need dedup post-replace
    - ScopeEstimatorClient.tsx: uses TEXT_MUTED (not MUTED)
    - DiversificationClient.tsx: uses TEXT_MUTED (not MUTED)
    - analytics/ProposalAnalyticsClient.tsx: uses TEXT_MUTED + extra GREEN/YELLOW
    - ProductivityHeatmapClient.tsx: ALREADY MIGRATED to different hex values (BG='#0B0B12', CARD='#15151F', BORDER='#22222F') - RECONCILIATION DECISION NEEDED before proceeding

TOP-LINE STATS
  - Total tailwind hits classified: ~588 (across 6 buckets)
  - Total inline hex hits classified: ~104 scattered + 62 inline-palette files
  - Files affected: 250+ unique files
  - Approximate KEEP percentage: ~23% (status + brand legitimacy)
  - Approximate MIGRATE percentage: ~77% (decor + amber fixes)

EXECUTION RECOMMENDATIONS
  1. Run global codemod for safe patterns first: hover:text-indigo-300 -> hover:text-violet-300 (180+ instances, ZERO false-positive risk)
  2. Run text-indigo-200/300 -> text-violet-200/300 codemod (no STATUS overlap since indigo never used for status in classifier output)
  3. For blue-XXX migrations, MUST exclude KEEP files line-by-line - cannot bulk-replace without filter
  4. Apply amber fixes (STATUS-fix-to-amber, ~8 hits) as separate commit since they're a different semantic correction
  5. For 62 inline-palette files, define shared brand tokens in a single source (e.g. src/lib/brandPalette.ts or globals.css CSS vars) BEFORE migrating, then sweep all files to import
  6. Resolve ProductivityHeatmapClient.tsx hex divergence BEFORE step 5 - either adopt its palette as new canonical or rewrite to match target
  7. Public-route bulk files (proposal-pdf, hire, portfolio, client, time-report, survey, case-study, portal, sla, quote, nps, brand, contract, health-report) all duplicate the inline-palette pattern - migrate after shared token infra exists
```
