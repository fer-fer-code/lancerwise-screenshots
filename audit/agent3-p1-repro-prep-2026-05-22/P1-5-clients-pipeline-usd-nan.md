# P1-5 — /clients/pipeline "USD NaN" + KPI mismatch [QA-P1-101]

## Severity
**P1 broken UX** — visible data quality bug, customer-facing "NaN" exposes JS engine internals

## Summary
The Pipeline kanban view has two related bugs:
1. **One card displays `USD NaN`** (Ridgeline Consulting) — `Number(value).toLocaleString()` evaluates to "NaN" when value is non-numeric
2. **KPI cards show ACTIVE LEADS=0 / PIPELINE VALUE=USD 0 / FOLLOW-UPS DUE=0** but the kanban below shows 6 visible client cards with values summing ~USD 25,000+

These are two different data-path bugs in the same page.

## Steps to reproduce
1. Sign in (QA fixture user already populates leads data)
2. Navigate to `/clients/pipeline`
3. Observe:
   - **KPI cards row:** all show 0 (ACTIVE LEADS 0 / PIPELINE VALUE USD 0 / FOLLOW-UPS DUE 0)
   - **Kanban columns:** Lead column has 6 cards, with values:
     - Pixel Forge Studios — USD 1,500
     - Cobalt Code Lab — USD 5,000
     - North Star Marketing — USD 12,000
     - Iron Mountain Devs — USD 5,000
     - **Ridgeline Consulting — `USD NaN` ← BUG**
     - Lumen Type Co — USD 1,500
   - Visible sum: ~USD 25,000 (excluding NaN row)
   - KPI says "PIPELINE VALUE USD 0" — clearly wrong

## Expected behavior
1. Cards with missing/invalid `potential_value` should either show no value OR show "—" / "TBD" / "Not estimated"
2. KPI ACTIVE LEADS count = number of cards in non-Won/Lost columns
3. KPI PIPELINE VALUE = sum of valid numeric potential_value across active cards

## Actual behavior

### Bug 1: NaN render
`PipelineKanbanClient.tsx` line 142-146:
```tsx
{value != null && (
  <p className="text-xs text-slate-300 font-mono">
    {currency} {Number(value).toLocaleString()}
  </p>
)}
```
- `value != null` is loose equality — catches `null` AND `undefined`
- But Ridgeline's `potential_value` is probably a string like `""` (empty) or `"NaN"` literal stored in DB — passes the guard
- `Number("").toLocaleString()` = "0" but `Number("NaN").toLocaleString()` = "NaN" — string

### Bug 2: KPI computation
`page.tsx` line 38-39:
```tsx
const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.potential_value ?? 0), 0)
const activeCurrency = (leads ?? []).find(l => l.currency)?.currency ?? 'USD'
```
- `activeLeads` is presumably filtered subset of `leads` — definition not shown but the reduce should sum
- If KPI shows 0 while cards show $25K, the `activeLeads` filter is likely wrong (maybe `stage !== 'Lead'` instead of `stage in [Lead, Contacted, Proposal Sent]`)

OR there's a TYPE mismatch — `potential_value` field is stored as a string in DB but TypeScript treats as number; the `?? 0` doesn't catch string "" or "NaN".

## Screenshot reference
- `EVIDENCE/edge-cases/E13_clients_pipeline_chromium_desktop.png` — shows both bugs

## Suspect file locations (verified)
- **`src/app/(app)/clients/pipeline/PipelineKanbanClient.tsx`** lines 111-112 + 142-146 (NaN render)
- **`src/app/(app)/clients/pipeline/page.tsx`** lines 38-39 (KPI computation)

## Quick fix hypothesis

### Fix 1: NaN render (PipelineKanbanClient.tsx)
```diff
- {value != null && (
+ {(() => {
+   const numValue = Number(value)
+   return Number.isFinite(numValue) ? (
     <p className="text-xs text-slate-300 font-mono">
-      {currency} {Number(value).toLocaleString()}
+      {currency} {numValue.toLocaleString()}
     </p>
+   ) : null
+ })()}
```

Or extract a helper:
```ts
function formatValue(value: number | string | null | undefined, currency: string): string | null {
  const n = Number(value)
  if (!Number.isFinite(n) || n === 0) return null
  return `${currency} ${n.toLocaleString()}`
}
```

### Fix 2: KPI computation (page.tsx)
```diff
- const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.potential_value ?? 0), 0)
+ const pipelineValue = activeLeads.reduce((sum, l) => {
+   const v = Number(l.potential_value)
+   return sum + (Number.isFinite(v) ? v : 0)
+ }, 0)
```

Also verify `activeLeads` filter aligns with what the kanban renders. Should be `leads.filter(l => l.stage !== 'won' && l.stage !== 'lost')` or similar — currently may be over-filtering.

### Fix 3 (sanity): DB-side cleanup
Check `leads` table for rows where `potential_value` is non-numeric:
```sql
SELECT id, name, potential_value FROM leads WHERE potential_value::text !~ '^[0-9]+(\.[0-9]+)?$' AND potential_value IS NOT NULL;
```

Decide: enforce TYPE numeric at DB layer + migration to coerce existing rows.

## Verification after fix
1. `/clients/pipeline` — no card shows "USD NaN"
2. KPI PIPELINE VALUE matches sum of visible card values
3. Edit one lead → set potential_value to empty/null → card hides value (doesn't render "USD NaN" or "USD 0")
4. Edit one lead → set potential_value to "abc" → if DB constraint blocks, good; if not, ensure formatValue() catches

## Estimate
~1-2h (depends on whether DB schema constraint needs migration)

## Cross-references
- Backlog memory `backlog_currency_hardcoded` P0 — Currency is hardcoded 'USD' as fallback (line 92, 112). Need formatCurrency() helper that respects user.currency
- QA-005 P2: hardcoded $ symbol across app — same root cause as the 'USD' fallback here
