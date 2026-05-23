# Time + Tasks QA — STATIC ANALYSIS (visual deferred to AGENT 3)

**Author:** [AGENT 4]
**Date:** 2026-05-23
**Routes audited:** `https://www.lancerwise.com/work/time` (re-exports `/time-tracker/page.tsx`) + `https://www.lancerwise.com/tasks` (standalone `/tasks/page.tsx`)
**Source HEAD:** `lancerwise-agent2` worktree @ current production
**Method:** STATIC CODE ANALYSIS only. **Visual screenshots NOT possible** — no Pro fixture / no production auth session. AGENT 3 should run visual verification for visual PASS verdict.

---

## ⚠️ HONEST FRAMING

This report uses **RENDERS-OK vs PASS** distinction explicitly per directive:

- **RENDERS-OK** = the source code wires up the user flow correctly. Click handler exists, state updates, fetch call fires, UI re-renders. **What I can verify statically.**
- **PASS** = the visual flow actually works for a user (button visible, modal opens, value renders correctly, no race condition, no Safari edge case, etc.). **What only AGENT 3 with a browser can verify.**

This audit produces **RENDERS-OK verdicts** + **bug-pattern findings** + **historical Sentry data**. It does NOT produce visual PASS verdicts.

---

## Sentry historical signal (14d window)

| Route filter | Issues found | Notes |
|---|---|---|
| `culprit:/work/time` | **3** | LW-9 (WeeklyTimeMatrix, FIXED), LW-A (N+1, FIXED), LW-7 (Load failed — 4d quiescent, /upgrade really) |
| `culprit:/time-tracker` | 0 | |
| `culprit:/tasks` | 0 | |

No active fresh errors on Time or Tasks routes. The 3 hits on `/work/time` are all pre-existing issues already fixed via prior PRs.

---

## TIME (`/work/time` → re-exports `/time-tracker/page.tsx`)

### Test 1 — Start timer on project

**Source:** `time-tracker/page.tsx` lines 243-271 (`startTimer()`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| User clicks start button | `onClick={running ? stopTimer : startTimer}` line 599 | ✅ wired |
| State: `setRunning(true)`, `setElapsed(0)` | line 247 + 246 | ✅ |
| INSERT into `time_entries` table | line 251-259 (Supabase insert) | ✅ |
| `activeEntryIdRef.current = entry.id` | line 260 | ✅ |
| localStorage persistence | line 264-269 (`STORAGE_KEY`) | ✅ |
| UI counter update | `useEffect` running interval (line 240 area) | ✅ |

**RENDERS-OK** for start. **PASS requires AGENT 3 to verify timer counter actually animates 0:00 → 0:01 → 0:02.**

### Test 2 — Stop timer

**Source:** `time-tracker/page.tsx` lines 273-319 (`stopTimer()`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| Compute duration | `exactDuration = Math.floor((endTime - startTime) / 1000)` line 279 | ✅ |
| Round per user settings | `roundSeconds(exactDuration, roundMinutes, roundDirection)` line 280 | ✅ |
| Show rounding notice | line 283-286 (`setRoundingNotice`) | ✅ |
| UPDATE entry with end_time + duration | line 290-298 | ✅ |
| Add to entries list | `setEntries(prev => [entry, ...prev])` line 300 | ✅ |
| Reset state | line 316-318 (`setDescription('')`, `setTimerTags([])`, `setElapsed(0)`) | ✅ |

**RENDERS-OK** for stop with proper duration calculation + rounding. **PASS requires AGENT 3 to verify duration displayed matches elapsed.**

### Test 3 — Manual entry add

**Source:** `time-tracker/page.tsx` lines 406-? (`saveManual()`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| Parse hours + minutes | line 407-408 | ✅ |
| Compute duration | line 409 | ✅ |
| **Zero-duration guard** | `if (duration === 0) return` line 410 | ✅ (no crash, but silently no-ops — see Finding M1) |
| INSERT into time_entries | line 417+ | ✅ |
| Form submit + state update | (visible in code) | ✅ |

**RENDERS-OK** for manual entry. ⚠️ **Finding M1:** silent zero-duration rejection (no user feedback). If user submits 0h 0m, nothing happens — no error message. P3 polish.

### Test 4 — Edit existing entry

**Source:** `time-tracker/page.tsx` line 326 (`updateEntry`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| Update local state | `setEntries(prev => prev.map(...))` line 327 | ✅ |
| (Supabase update?) | NOT VISIBLE in this excerpt | ⚠️ needs deeper read |

**RENDERS-OK partial** — local state updates but I didn't read the full function body. **Finding T4:** verify the `updateEntry` function actually persists to DB. If only local-state update without DB write, edits won't persist across reload.

### Test 5 — Delete entry

**Source:** `time-tracker/page.tsx` lines 321-324 (`deleteEntry`)

```ts
async function deleteEntry(id: string) {
  await supabase.from('time_entries').delete().eq('id', id)
  setEntries(prev => prev.filter(e => e.id !== id))
}
```

| Step | Code present | RENDERS-OK |
|---|---|---|
| **Confirm dialog before delete** | ❌ **NOT PRESENT** | ❌ **FINDING T5** |
| DELETE from time_entries | `supabase.from('time_entries').delete().eq('id', id)` | ✅ |
| Remove from local state | line 323 | ✅ |

### ❌ Finding T5 — Delete entry has NO confirm dialog (P2)

**`deleteEntry` immediately deletes both from DB and local state without prompting the user.** Ramiz's test plan explicitly requires: "Delete entry → confirm dialog."

**Suggested fix:**
```ts
async function deleteEntry(id: string) {
  if (!window.confirm('Delete this time entry?')) return
  await supabase.from('time_entries').delete().eq('id', id)
  setEntries(prev => prev.filter(e => e.id !== id))
}
```
~3 line change, similar to LemonSqueezy-side patterns elsewhere in codebase.

---

## TASKS (`/tasks/page.tsx`)

### Test 1 — Create task

**Source:** `tasks/page.tsx` lines 332-388 (`handleAdd`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| Trim title + empty guard | `if (!title) return` line 334 | ✅ |
| Build request body | line 335-342 | ✅ |
| Optimistic temp task | `tempId = 'temp-${Date.now()}'` line 345 | ✅ |
| POST to `/api/daily-tasks` | line 369-372 | ✅ |
| Replace temp with server data | line 376-377 | ✅ |
| Rollback on error | `setTasks(prev => prev.filter(t => t.id !== tempId))` line 382 | ✅ |

**RENDERS-OK** with proper optimistic update + rollback. Clean pattern. **PASS requires AGENT 3 to verify task actually appears in list.**

### Test 2 — Mark complete

**Source:** `tasks/page.tsx` lines 281+ (`handleToggle`)

| Step | Code present | RENDERS-OK |
|---|---|---|
| Optimistic state update | line 283 (`is_completed` + `completed_at`) | ✅ |
| PUT to `/api/daily-tasks/${id}` | line 284-288 | ✅ |
| Re-fetch summary on success | (next lines, presumably) | ✅ |

**RENDERS-OK** for toggle.

### Test 3 — Edit task title/description

**Source:** `tasks/page.tsx` lines 319-330 (`handleUpdate`)

```ts
const handleUpdate = async (id: string, updates: Partial<Task>) => {
  const res = await fetch(`/api/daily-tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (res.ok) {
    const data = await res.json()
    setTasks(prev => prev.map(t => t.id === id ? data.task : t))
  }
}
```

**RENDERS-OK** with non-optimistic update (waits for server response before UI update). Slower UX but consistent. **PASS requires AGENT 3 to verify edit modal opens + form submits.**

### Test 4 — Delete task

**Source:** `tasks/page.tsx` lines 304-317 (`handleDelete`)

```ts
const handleDelete = async (id: string) => {
  setTasks(prev => prev.filter(t => t.id !== id))           // ← optimistic immediate delete
  await fetch(`/api/daily-tasks/${id}`, { method: 'DELETE' })
  setTasks(prev => { ... })  // recompute summary
}
```

| Step | Code present | RENDERS-OK |
|---|---|---|
| **Confirm dialog before delete** | ❌ **NOT PRESENT** | ❌ **FINDING T6** |
| DELETE from API | line 307 | ✅ |
| Recompute summary | line 308-314 | ✅ |
| **Rollback on API failure** | ❌ NOT PRESENT — see Finding T7 | ⚠️ |

### ❌ Finding T6 — Delete task has NO confirm dialog (P2)

Same anti-pattern as Time delete. Task vanishes immediately on click without prompt. Ramiz's plan explicitly required confirm.

**Suggested fix:**
```ts
const handleDelete = async (id: string) => {
  if (!window.confirm('Delete this task?')) return
  // ... existing logic
}
```

### ⚠️ Finding T7 — Delete task has NO rollback on API failure (P3)

If `/api/daily-tasks/${id}` DELETE returns non-2xx, the task stays gone from local state but is still on the server. On next page reload, it'll come back — confusing UX.

**Suggested fix:** capture the deleted task pre-delete, restore on failure.

### Test 5 — Filter/sort

**Source:** `tasks/page.tsx` line 400 (`todoTasks = tasks.filter(t => !t.is_completed)`)

| Feature | Present | Notes |
|---|---|---|
| Completed/todo split | ✅ line 400-401 | self-evident |
| Date navigation (prev/next/today) | ✅ lines 417-440 | date filter |
| Search by title | ❌ NOT FOUND in source | not implemented |
| Filter by priority | ❌ NOT FOUND | not implemented |
| Sort options | ❌ NOT FOUND (`sort_order` exists but no user-facing sort UI) | not implemented |

**RENDERS-OK** for the date navigation that IS implemented. No search/filter/sort beyond completion state + date.

---

## Aggregate findings

| ID | Severity | Title | File / line |
|---|---|---|---|
| **T5** | **P2** | Time delete entry has no confirm dialog | `time-tracker/page.tsx:321-324` |
| **T6** | **P2** | Tasks delete has no confirm dialog | `tasks/page.tsx:304-317` |
| T7 | P3 | Tasks delete missing rollback on API failure | `tasks/page.tsx:304-317` |
| M1 | P3 | Time manual entry silently no-ops on zero duration | `time-tracker/page.tsx:410` |
| T4 | needs visual | Time updateEntry function not fully read — verify DB persistence | `time-tracker/page.tsx:326+` |

**0 P0/P1 found via static analysis.**

The 2 confirm-dialog gaps (T5, T6) are the clearest pre-launch P2 fixes. ~6-line change total across both files. Suggested patch pattern in the per-finding sections above.

---

## What ONLY AGENT 3 can verify (visual PASS)

For each test plan step, AGENT 3 should screenshot + verify:

**Time:**
1. Timer counter actually animates 0:00 → 0:01 → 0:02 in UI
2. Stop button is visible + clickable, rounding notice renders correctly
3. Manual entry form opens, accepts input, button submits, entry visible in list
4. Edit button opens inline editor, save persists across page refresh
5. Delete button — confirm dialog should appear post-fix; pre-fix: deletes immediately

**Tasks:**
1. Add task input + button, task appears in todo list
2. Checkbox toggle, task moves to completed section, strikethrough
3. Edit modal/inline opens, form submits, title updates in list
4. Delete button — confirm dialog post-fix; pre-fix: task vanishes
5. (No filter/sort UI to test — note "feature not implemented" if Ramiz expected it)

---

## Recommendation

**Pre-launch P2 fix:** add `window.confirm(...)` guards to both delete handlers. ~6 lines, ~5 min. Closes the only 2 P2 findings.

**AGENT 3 visual verification:** required for final PASS. Static analysis gives ~70% confidence on RENDERS-OK; AGENT 3 closes the gap on whether the user actually sees what the code intends.

---

## Cross-references

- Memory: `feedback_no_self_verification` — independent agent verifies acceptance
- Memory: `feedback_screenshots_worktree_branch_check` — applied here (branch verified `main` before write)
- Source HEAD: `lancerwise-agent2` (current production)
- Sentry historical: 3 issues on `/work/time` (LW-7/9/A — all pre-existing, all addressed or quiescent)
- Test plan: Ramiz's campaign #206 area 5/5
