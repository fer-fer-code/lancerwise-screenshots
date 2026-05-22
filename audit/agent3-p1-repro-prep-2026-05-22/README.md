# P1 reproduction prep — [AGENT 2] hand-off pack

**Date:** 2026-05-22
**Author:** [AGENT 3]
**Source:** comprehensive QA verdict in `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md`
**Target:** [AGENT 2] for quick fix implementation

## Contents

| File | Finding | Estimated fix time |
|------|---------|:------------------:|
| [P1-1-i18n-gap-authed-routes.md](./P1-1-i18n-gap-authed-routes.md) | i18n gap on all authed routes (QA-001) | 4-8h |
| [P1-2-upgrade-page-english-on-ru.md](./P1-2-upgrade-page-english-on-ru.md) | /upgrade 100% English on RU (QA-007) | 1-2h |
| [P1-3-upgrade-cta-contradiction.md](./P1-3-upgrade-cta-contradiction.md) | "Current plan" + "Upgrade to Pro" CTA contradiction (QA-008) | 30 min |
| [P1-4-timezone-hardcoded-utc.md](./P1-4-timezone-hardcoded-utc.md) | UTC hardcoded on /settings/digest + /settings/reminders (QA-011) | 1-2h |
| [P1-5-clients-pipeline-usd-nan.md](./P1-5-clients-pipeline-usd-nan.md) | /clients/pipeline USD NaN + KPI mismatch (QA-P1-101) | 1-2h |
| [P1-6-i18n-coverage-matrix.md](./P1-6-i18n-coverage-matrix.md) | i18n coverage matrix audit guide (QA-009) | n/a (meta-doc) |

## Total fix estimate

~8-15h focused work, **~3-5h parallelized** across 5 agents.

## Suggested execution order

1. **P1-3 first** (30 min) — quick win on upgrade CTA logic
2. **P1-5** (1-2h) — pipeline NaN + KPI fix (high-visibility bug)
3. **P1-4** (1-2h) — timezone localization helper + 3 hit points
4. **P1-2** (1-2h) — /upgrade page translation (use P1-6 matrix to verify completeness for this route)
5. **P1-1 + P1-6** in parallel (4-8h total, 2h parallelized) — comprehensive i18n sweep across all authed routes

## File-touching summary

| P1 | Suspect files |
|----|---------------|
| P1-1 | KPI card components + table headers + filter chips across `src/app/(app)/{clients,invoices,projects,proposals,work,contracts}/**` |
| P1-2 | `src/app/(app)/upgrade/PlansGrid.tsx` (verified) |
| P1-3 | `src/app/(app)/upgrade/PlansGrid.tsx` lines 171-177 (verified) |
| P1-4 | `src/app/(app)/settings/digest/DigestConfigClient.tsx` lines 244, 262 + `src/app/(app)/settings/reminders/ReminderSettings.tsx` line 157 (all verified) |
| P1-5 | `src/app/(app)/clients/pipeline/PipelineKanbanClient.tsx` lines 142-146 + `src/app/(app)/clients/pipeline/page.tsx` lines 38-39 (verified) |
| P1-6 | Cross-cuts P1-1 (matrix view) |

Plus paired updates in `messages/en.json` + `messages/ru.json` for each translation key added.

## After P1 batch complete

Re-run [AGENT 3] verifier:
```bash
# Smoke probe across all P1 routes
node /tmp/qa_capture.js --engine chromium --locale ru --viewport desktop \
  --routes /clients,/invoices,/projects,/proposals,/work/time,/upgrade,/settings/digest,/settings/reminders,/clients/pipeline \
  --authed true

# Then visually compare to BEFORE captures in:
# ../agent3-comprehensive-qa-2026-05-21/EVIDENCE/page-screenshots/
```

Also re-run P0 verifier (separate ticket):
```bash
node /tmp/qa_session_variants.js
# Verify all 6 cookie variants land at /login (not /dashboard 500)
```

## P0 reminder

This pack covers **P1 only**. The P0 (QA-P0-001 — malformed cookie crashes middleware) is documented in the main verdict `../agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md` section "P0 launch-blockers". P0 fix is even faster (~15 min, single try/catch) and MUST ship before any P1.

## P2 + P3 backlog

Not covered in this pack — see main verdict for the 10 P2 + 15+ P3 items. Recommend week-1 post-launch maintenance window for those.
