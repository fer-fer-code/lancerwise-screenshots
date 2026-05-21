# #94 /settings N+1 — Pre-Flight Diagnosis

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** READ-ONLY pre-flight analysis. No code, no PR. Parallel work during PR #127 merge flight.
**Status of #93:** Stage 2 (PR #127) merged at `d0d7799f`. #94 is next P0.

---

## Inventory — fetch surface

### Antipattern widgets (createClient + useEffect + mount-fetch)

**Count: 28 widgets** across /settings root + 16 subroutes.

| Fetch count | Widget | Tables read |
|---|---|---|
| 4 | `ServicePackages.tsx` | service_packages |
| 4 | `RateCard.tsx` | rate_card_services, rate_card_packages (× 2 calls each) |
| 4 | `LineItemTemplates.tsx` | line_item_templates |
| 4 | `EmailTemplates.tsx` | email_templates |
| 3 | `page.tsx` (root) | profiles |
| 3 | `RateIncreaseHistory.tsx` | rate_history |
| 3 | `PortfolioSettings.tsx` | logos / portfolio |
| 3 | `DiscountCodes.tsx` | discount_codes |
| 2 (× 10) | TaxSettings, PublicRates, PublicProfile, NotificationPreferences, InvoiceNumbering, GoalSetter, FreelancerProfile, EmailSignature, CapacityCalendar, BusinessCard, BioGenerator, AvailabilityWidget | profiles + а niche table |
| 1 (× 8) | TimeRoundingSettings, PublicProfileEditor, PortalBrandingSettings, LateFeesSettings, IntegrationsHub, EmailActivityLog, CronJobsStatus, AutoPaymentReminders | profiles OR own table |

**Sum: ~59 mount-time `.from()` calls** (heavier than original #94 issue's "27 calls" estimate; #94 issue under-counted — actual surface ~2× larger).

### Sub-route page.tsx fetch counts

| Subroute | Fetches |
|---|---|
| /settings/export | 6 |
| /settings (root) | 3 |
| /settings/email-preview | 2 |
| Other 13 subroutes | 0-1 each (mostly delegate к widgets) |

### Per-table breakdown

| Table | Read count | Notes |
|---|---|---|
| **profiles** | **38** | Dominant — same column-of-many-widgets pattern as time-tracker. Each widget reads its own narrow column subset. |
| service_packages | 4 | ServicePackages widget |
| rate_card_services | 4 | RateCard |
| line_item_templates | 4 | LineItemTemplates |
| email_templates | 4 | EmailTemplates |
| rate_history | 3 | RateIncreaseHistory |
| logos | 3 | PortfolioSettings/branding |
| discount_codes | 3 | DiscountCodes |
| invoices | 2 | SmartGoalSuggestion |
| clients | 2 | Various |
| time_entries, projects, expenses, email_logs, digest_settings, contracts | 1 each | Niche subroute widgets |

### /api/ endpoints called

12 fetches к `/api/settings/*` + ~14 more across portfolio/keys/webhooks/availability — these are **already-batched** server endpoints, NOT в the mount-fetch antipattern. Out of scope для #94 fix.

### RLS-sensitive surface

Only **`SmartGoalSuggestion.tsx`** reads `invoices` from /settings widgets. Single file. Easy к keep direct-RLS-policy reads (PR #103 sealed) или fold into batched fetch с proper user_id scoping. **No proposal_drafts or testimonials reads** в /settings. Minimal RLS surface compared к other routes.

---

## Comparison к Stage 1 precedent

### DashboardDataContext (PR #84/#86)

- Single React Context Provider
- 1 batched API endpoint (`/api/dashboard/widget-data`)
- 21 widgets consume via `useDashboardData()` hook
- Provider mounted в `(app)/layout.tsx` — server-side mount, client-side fetch on user route entry
- Pathname-gated fetch (similar к TimeTrackerDataContext)

### TimeTrackerDataContext (PR #119 + #127)

- Same pattern — Context Provider
- 1 batched API endpoint (`/api/time-tracker/widget-data`)
- 31 widgets consume
- Path-gated к `/work/time` + `/time-tracker`
- Stage 1 had а data-shape regression caught by [AGENT 3] probe — Stage 1 v2 restored array contract

### Both precedents target **single-route** widget clusters

Critical observation: **dashboard и time-tracker are each ONE route** — а single page renders many widgets concurrently. Provider pattern shines because all 21 (or 31) widgets sit on the same route and benefit от one shared fetch.

---

## /settings is а **DIFFERENT shape**

### /settings has 16 subroutes

```
/settings (root)
├── /settings/account
├── /settings/api
├── /settings/availability
├── /settings/billing
├── /settings/digest
├── /settings/email-preview
├── /settings/export
├── /settings/integrations
├── /settings/items-library
├── /settings/late-fees
├── /settings/notifications
├── /settings/public-profile
├── /settings/reminders
├── /settings/security
├── /settings/tags
└── /settings/upgrade
```

Widgets are distributed across subroutes — а user navigating to /settings/late-fees doesn't need ServicePackages data. **А shared Provider would over-fetch** для every subroute visit.

### /settings already has а DIFFERENT precedent

Sampled `BrandingSettings.tsx`:

```tsx
interface BrandingSettingsProps {
  userId: string
  initialLogoUrl?: string | null
  initialBrandColor?: string
  initialInvoiceFooter?: string
}

export default function BrandingSettings({
  userId,
  initialLogoUrl,
  initialBrandColor = '#6366f1',
  initialInvoiceFooter = 'Thank you for your business!',
}: BrandingSettingsProps) {
  // ...uses initial* props as starting state, не mount-fetch
```

**Server-component-prefetch + initialProps pattern is already established in /settings**, не Context Provider. Some widgets accept initial* props from а parent server component upstream. 28 of the antipattern widgets simply don't follow this pattern yet (likely added later, or pattern wasn't enforced).

---

## Recommended approach

### **Extend the initialProps pattern, NOT а Context Provider**

| Reason | Detail |
|---|---|
| Lower migration cost | Many widgets already accept initial* props; just need parent wiring + remove mount-fetch |
| Subroute-aware | Each subroute page.tsx can server-fetch only what its widgets need |
| Matches App Router best practice | RSC > Context для static-on-load data (Next.js 16 ergonomics) |
| Existing precedent | BrandingSettings.tsx и others already follow this; extending feels natural |
| Avoids dual-pattern maintenance | If we add `SettingsDataContext`, codebase has 3 patterns (Dashboard / TimeTracker / Settings Provider + initialProps mixed) — more complexity |

### Migration recipe (mechanical)

For each subroute page.tsx (currently client):

**Before:**
```tsx
'use client'
// ServicePackages, RateCard, etc render — each mount-fetches
```

**After:**
```tsx
// Server component (no 'use client')
import { createClient } from '@/lib/supabase/server'

export default async function SettingsRootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Single Promise.all batched fetch для все widgets on this route
  const [profile, servicePkgs, rateCards, lineItems, emailTemplates] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('service_packages').select('*').eq('user_id', user.id),
    supabase.from('rate_card_services').select('*').eq('user_id', user.id),
    supabase.from('line_item_templates').select('*').eq('user_id', user.id),
    supabase.from('email_templates').select('*').eq('user_id', user.id),
  ])

  return (
    <SettingsRootClient
      initialProfile={profile.data}
      initialServicePackages={servicePkgs.data}
      // ...
    />
  )
}
```

Widgets (`ServicePackages.tsx` etc.) extended к accept `initialPackages` prop:

**Before:**
```tsx
const [packages, setPackages] = useState<ServicePackage[]>([])
const load = useCallback(async () => {
  const { data } = await supabase.from('service_packages').select(...)
  setPackages(data ?? [])
  setLoading(false)
}, [supabase])
useEffect(() => { load() }, [load])
```

**After:**
```tsx
export default function ServicePackages({ initialPackages = [] }: { initialPackages?: ServicePackage[] }) {
  const [packages, setPackages] = useState<ServicePackage[]>(initialPackages)
  // No mount-fetch — initial state comes from props
  // Updates (insert/delete) still go through supabase directly, since they're write actions
}
```

### What stays as-is

- Update / insert / delete actions in widgets — these are user-triggered, не mount-time. Keep direct `supabase.from()` calls для writes.
- /api/settings/* endpoints — already-batched, не in antipattern.

### Subroute prioritization

Most-visited subroutes first (rough estimate based on widget count):

| Priority | Subroute | Antipattern widgets to migrate |
|---|---|---|
| 1 | /settings (root) | ~12 (page.tsx + heavy widgets) |
| 2 | /settings/items-library | ServicePackages, RateCard, LineItemTemplates (~12 fetches) |
| 3 | /settings/digest | NotificationPreferences, GoalSetter, BioGenerator, SmartGoalSuggestion (~6 fetches) |
| 4 | /settings/availability | AvailabilityWidget, CapacityCalendar (~4) |
| 5 | /settings/late-fees + /reminders + /tags + /api + others | Smaller surface each |

---

## Anything different от /work/time pattern

1. **Subroute distribution** — /work/time is single-route с many widgets; /settings spreads widgets across 16 subroutes. **Server-component prefetch fits better than Context Provider.**
2. **Existing initialProps precedent** — /settings already partly uses this pattern; extending is mechanical.
3. **Smaller RLS surface** — only 1 widget reads `invoices`; near-zero `proposal_drafts` / `testimonials` touch. Lower review burden.
4. **More user-triggered writes per widget** — settings widgets all do mutations (Save / Delete / Update). Pattern needs to keep direct-write paths functional.
5. **Auth-gated routes** — same as /work/time, all under `(app)/` layout с supabase.auth.getUser() guard. No new auth concerns.
6. **No mobile Safari crash precedent** — /work/time had а known iOS-specific issue surface (#74 pattern). /settings doesn't have а matching known mobile-crash report; risk lower.

---

## Cross-references

- Memory: `audit/agent2-worktime-phase-2-plan/STAGE-2-WIDGET-MIGRATIONS-PLAN.md` — Stage 2 plan (different pattern, but useful for general widget-migration mechanics)
- PR [#119](https://github.com/fer-fer-code/lancerwise/pull/119) — Stage 1 v1 (regression caught by probe)
- PR [#127](https://github.com/fer-fer-code/lancerwise/pull/127) — Stage 2 (merged `d0d7799f`)
- Issue [#94](https://github.com/fer-fer-code/lancerwise/issues/94)
- Companion: [ESTIMATE.md](./ESTIMATE.md) — hour breakdown + risk
