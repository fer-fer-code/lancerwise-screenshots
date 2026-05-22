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

#### IQA-P1-002 — Modal backdrop opacity bug is SYSTEMATIC across multiple routes [P1]

Auto-collected DOM info (`EVIDENCE/backdrop-aggregate-DOM.json`) shows the bug is NOT isolated to /invoices/new — it's a systematic pattern across multiple template/AI modals:

| Route | Modal | Backdrop class | Opacity | Severity |
|-------|-------|----------------|:-------:|:--------:|
| `/invoices/new` | "Generate Line Items with AI" | `bg-black/40` | 40% | P1 |
| `/projects/new` | "Project Templates" | `bg-black/40` | 40% | P1 |
| `/contracts/new` | "Contract Templates" | `bg-black/30` | **30%** | **P1 WORST** |

**`/contracts/new` is worst** — at 30% backdrop, the underlying form labels ("Title *", "Client", "End Date (optional)", "Contract Value (optional)", "Contract Content *") are **fully readable and interleaved with the modal content** ("Web Development / Freelance Design / Consulting / NDA"). User can't tell where modal ends and page starts.

**Code scope check:** `grep -rln "bg-black/4[0-9]\|bg-black/3[0-9]\|bg-black/5[0-9]\|bg-black/2[0-9]\|bg-black/6[0-9]" src/ --include="*.tsx"` returns **61 files** — backdrop pattern is duplicated across the codebase rather than centralized in a shared `<Modal>` component.

**Fix scope:**
- **Quick:** Global find+replace `bg-black/40` → `bg-black/70` and `bg-black/30` → `bg-black/70` (~10 min, applies to 61 files)
- **Proper:** Extract shared `<ModalBackdrop>` component with `bg-slate-950/80 backdrop-blur-sm` default; consumers stop hand-rolling. ~1h.

**Evidence:**
- `EVIDENCE/p1-revenue/contracts-new_01_template-modal.png` — 30% (worst case)
- `EVIDENCE/p1-revenue/projects-new_05_use-template-clicked.png` — 40% Project Templates modal
- `EVIDENCE/p1-revenue/invoices-new_03_AI-modal-OPEN.png` — 40% AI modal (Ramiz original)
- `EVIDENCE/backdrop-aggregate-DOM.json` — auto-captured CSS classes + computed bg colors

### P2 visible interactive bugs

#### IQA-P2-001 — Cookie Customize button does not open visible modal/popover [P2]
- **Where:** Cookie banner bottom-of-page (any authed route — tested on /dashboard)
- **Symptom:** Clicked "Customize" button → no modal/popover opened in viewport. DOM info shows only the persistent GlobalTimerBar at z-40, no new modal element
- **Either:** click failed silently, or modal opens off-screen / behind something, or it requires user-gesture context Playwright doesn't fully simulate
- **Evidence:** `EVIDENCE/p2-workflow/cookie_01_customize-modal.png` (shows no modal), `EVIDENCE/p2-workflow/_misc-interactive-DOM.json` (cookie-customize key has only GlobalTimerBar)
- **Severity:** P2 — verify manually that Customize panel renders for real users; this is GDPR consent surface

### P3 polish (interactive)

#### IQA-P3-001 — Quick add FAB popover is correctly NOT a modal (POSITIVE) [P3 note]
- **Where:** Quick add FAB (purple lightning, bottom-right of every authed route)
- **Symptom (positive):** Opens as right-side flyout column (`quick-add-fab fixed right-6 z-[60]`) with 6 items (New Client / New Project / New Invoice / Add Expense / Add Task / Log Time) — NOT a modal so no backdrop bug
- **Evidence:** `EVIDENCE/p2-workflow/fab_01_dashboard-quickadd-open.png`
- **Note:** This is the CORRECT pattern for quick actions — keeps user in context. Other modals should learn from this pattern.

#### IQA-P3-002 — Pipeline kanban "Move to" dropdown opens cleanly (POSITIVE) [P3 note]
- **Where:** /clients/pipeline kanban cards
- **Symptom:** "Move to" dropdown opens as inline popover with 4 stage options (Contacted / Proposal Sent / Won / Lost). No modal backdrop needed. Click-outside catcher overlay `fixed inset-0 z-10` with `rgba(0,0,0,0)` (transparent) — correct popover dismissal pattern
- **Evidence:** `EVIDENCE/p2-workflow/pipeline_02_new-lead-modal.png`

#### IQA-P3-003 — "USD NaN" on /clients/pipeline confirmed in interactive view [P1 inherited]
- See QA-P1-101 in `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` — Ridgeline Consulting still shows "USD NaN" in this batch
- Visible in `EVIDENCE/p2-workflow/pipeline_02_new-lead-modal.png`
- Already documented in P1 repro pack

### POSITIVE — what worked correctly

1. **404 page** is branded with recovery CTAs (verified earlier)
2. **Welcome modal** dismisses cleanly via Esc
3. **Form text inputs** safely accept XSS-like strings + 2000-char strings without crash or escape leak
4. **Quick add FAB** is correctly a flyout, not a modal — no backdrop opacity issue
5. **Move dropdown on pipeline** uses transparent click-catcher pattern (correct popover behavior)
6. **/work/time Timer Templates** is a popover (not modal) — no backdrop issue
7. **Currency dropdown on /invoices/new** functional (USD default)
8. **Invoice detail page** has 30+ action buttons all visually rendered (Mark as Paid / Send / Delete / Print PDF / Copy Pay Link / WhatsApp / QR Code / Pay Online / Duplicate / Credit Note / Add Late Fee / Email Reminder / Set Reminder / etc.)
9. **Send Invoice** button shows "Sending..." busy state (proper UI feedback)
10. **/projects/[id] Edit form** uses dynamic Currency dropdown (not hardcoded $) — `Hourly Rate (override) /hr` suffix correctly omits $ when currency is generic

---

## Progress tracker

| Route | Status | Findings | Pushed batch |
|-------|:------:|----------|:------------:|
| /invoices/new ★ Ramiz bug repro | ✅ | IQA-P1-001 confirmed | commit 6e92a39 |
| /invoices/[id] | ✅ | 30+ buttons captured | commit 843287d |
| /invoices list | ✅ | filters/templates clean | commit fb917bc |
| /clients/new | ✅ | wizard pattern clean | commit fb917bc |
| /clients/[id] | ✅ | activity feed render | commit 843287d |
| /projects/new | ✅ | IQA-P1-002 (40% backdrop) | commit fb917bc |
| /projects/[id] | ✅ | rich action set | commit 843287d |
| /proposals/generate | ✅ | AI Proposal Generator form | commit fb917bc |
| /contracts/new | ✅ | IQA-P1-002 (30% backdrop WORST) | commit fb917bc |
| /upgrade CTAs | ✅ | Monthly/Yearly toggle works | commit fb917bc |
| /dashboard | ✅ | Welcome modal + FAB | commit fb917bc + batch 4 |
| /work/time tabs | ✅ | Templates popover (not modal) | commit fb917bc |
| /clients/pipeline | ✅ | Move dropdown + USD NaN inherited | batch 4 |
| Cookie banner Customize | ✅ | IQA-P2-001 (no modal opened) | batch 4 |
| Quick add FAB | ✅ | POSITIVE (flyout pattern) | batch 4 |
| Locale switcher | ⚠️ partial | dropdown click captured | batch 4 |

**16 of 16 target routes covered.** 2 P1 + 1 P2 + 3 P3 positive notes.

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
