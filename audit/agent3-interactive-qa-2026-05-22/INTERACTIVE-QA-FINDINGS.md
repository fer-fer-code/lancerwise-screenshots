# Interactive QA — pre-launch deep sweep (live document)

**Author:** [AGENT 3]
**Started:** 2026-05-22
**Production:** commit `a603831b` (post P0 #154 cookie fix)
**Fixture user:** `46b486d7-5fec-47af-a466-3295dc1c3b95`
**Methodology:** click every button + open every modal + fill every form + capture state

**Trigger:** Ramiz manually found semi-transparent backdrop on /invoices/new AI modal — previous static-capture QA missed it. This sweep specifically targets interactive bug surfaces.

---

## Severity rubric

| Severity | Definition |
|----------|------------|
| **P0** | Launch-blocker: write path broken, data corruption, auth bypass via click |
| **P1** | Broken UX: feature unusable, error state, modal-trap |
| **P2** | Visible interactive bug: backdrop transparent, dropdown clipping, hover state missing |
| **P3** | Polish: focus ring inconsistent, button hover too subtle |

---

## Findings (severity-sorted, live)

### P0 launch-blockers

_(none yet)_

### P1 broken UX

#### IQA-P1-001 — AI modal on /invoices/new has insufficient backdrop opacity (Ramiz repro) [P1]

**Confirmed reproduction of Ramiz's manual finding.**

**Where:** /invoices/new → click "Generate with AI" button → "Generate Line Items with AI" modal opens

**Symptom:** Modal backdrop wrapper uses `bg-black/40` (40% opacity black). On dark theme:
- Underlying form fields are fully readable through the backdrop
- Visual separation between modal + page content is too weak
- User can't tell at-a-glance that modal is "modal" vs another page section
- Modal feels "floating" instead of focal

**DOM evidence** (`invoices-new_AI-modal-backdrop-DOM.json`):
```json
{
  "tag": "DIV",
  "classes": "fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4",
  "bg": "oklab(0 0 0 / 0.4)",
  "opacity": "1",
  "zindex": "50",
  "rect": { "width": 1440, "height": 900 }
}
```

The wrapper IS present and covers full viewport — it's just too transparent for the dark theme.

**Evidence screenshots:**
- `EVIDENCE/p1-revenue/invoices-new_03_AI-modal-OPEN.png` — modal opens with weak backdrop
- `EVIDENCE/p1-revenue/invoices-new_09_from-library-modal.png` — same backdrop, scrolled-bottom context

**Steps to reproduce:**
1. Navigate to `/invoices/new`
2. Click purple "Generate with AI" button (left of "+ Add item")
3. Observe modal opens with backdrop that doesn't visually separate page content

**Suspect file:** AI modal component (likely `src/app/(app)/invoices/new/...` or shared `<AIGenerateModal>` component) — backdrop class needs raise from `bg-black/40` to `bg-black/70` or `bg-slate-950/80` + `backdrop-blur-sm`.

**Quick fix hypothesis:**
```diff
- className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
+ className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
```

**Impact:** Visual UX feels broken — users may double-click + dismiss inadvertently. Brand-perception risk.

**Verification:** Re-run probe + visually confirm backdrop separation. Check OTHER modals across app for same `bg-black/40` pattern (likely shared component).

### P2 visible interactive bugs

_(populating as sweep progresses)_

### P3 polish

_(populating as sweep progresses)_

---

## Progress tracker

| Route | Status | Findings | Pushed batch |
|-------|:------:|----------|:------------:|
| /invoices/new (priority — Ramiz bug repro target) | ⏳ pending | — | — |
| /invoices/[id] | ⏳ pending | — | — |
| /invoices list | ⏳ pending | — | — |
| /clients/new | ⏳ pending | — | — |
| /clients/[id] | ⏳ pending | — | — |
| /clients list | ⏳ pending | — | — |
| /projects (3 routes) | ⏳ pending | — | — |
| /proposals (3 routes) | ⏳ pending | — | — |
| /upgrade CTAs | ⏳ pending | — | — |
| /dashboard widgets | ⏳ pending | — | — |
| /work/time tabs + timer | ⏳ pending | — | — |
| /contracts (3 routes) | ⏳ pending | — | — |
| /clients/pipeline kanban | ⏳ pending | — | — |
| /settings 16 subroutes | ⏳ pending | — | — |
| /register + /login + /onboarding | ⏳ pending | — | — |

---

## Methodology notes

- Welcome modal must be dismissed before per-route interactive exploration (Esc key)
- All button clicks capture before/after screenshots
- All modal opens capture modal state + visible page underneath (to verify backdrop opacity)
- All form submissions tested with: valid data, empty data, XSS strings, very-long strings, special chars
- Cleanup policy: test entities deleted via Supabase admin at probe end where possible; otherwise documented for manual cleanup

## Cross-references

- Previous static QA: `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md`
- P0 fix verify: `../agent3-p0-reverify-2026-05-22/REVERIFY-RESULT.md`
- P1 repro pack: `../agent3-p1-repro-prep-2026-05-22/`
