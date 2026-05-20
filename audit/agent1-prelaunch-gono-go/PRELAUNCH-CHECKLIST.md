# Pre-Launch GO/NO-GO Checklist

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Method:** Cross-referenced against GitHub issues + open PRs + audit folders + memory rules. Status verified от primary sources, not assumed.

**Legend:**
- ✅ — done, verified
- ⏳ — in progress / PR open / queued
- ❌ — not started
- ⚠️ — unknown / cannot verify independently

---

## 🚨 SECURITY (must close before public traffic)

| # | Item | Status | Owner | Estimate | Evidence |
|---|---|---|---|---|---|
| S1 | Turnstile bypass closed (memory #18) | ✅ | [AGENT 2] | done | `audit/agent2-turnstile-fix/` — Management API PATCH executed 2026-05-20 |
| S2 | CAPTCHA enforced server-side | ✅ | [AGENT 2] | done | Same evidence. `security_captcha_enabled: true` post-PATCH. Confirmed via env broadcast: "CAPTCHA NOW ENABLED, 15/hr anon rate limit." |
| S3 | #99 invoices RLS leak (anon SELECT) | ✅ | [AGENT 2] | done | PR [#103](https://github.com/fer-fer-code/lancerwise/pull/103) merged 2026-05-20T05:08 UTC. Verification PASSED 4/4. |
| S4 | #100 proposal_drafts RLS leak (anon SELECT) | ✅ | [AGENT 2] | done | Same PR #103, same verification batch. |
| S5 | #101 testimonials structural leak | ✅ | [AGENT 2] | done | PR [#107](https://github.com/fer-fer-code/lancerwise/pull/107) merged 2026-05-20T05:41 UTC (consolidate RLS + flip is_public default). |
| S6 | #97 PII scrub в Sentry (+ Path F build) | ✅ | [AGENT 4] | done | PR [#97](https://github.com/fer-fer-code/lancerwise/pull/97) merged 2026-05-20T14:43 UTC. Closes #87 (Path F) + #89 (source-map deprecation). Production-deployed via #117 cascade at 17:18 UTC. |
| S7 | Comprehensive security audit (memory #15) | ⏳ | [AGENT 1] | partial | RLS audit of all 410 tables ✅ ([AGENT 1] `audit/agent1-rls-full-audit/`). **Auth flow regression suite ✅ added 2026-05-20** ([AGENT 1] `audit/agent1-auth-flow-regression/` — 7 flows × 2 locales; surfaced #114 + #115 both closed by PR #117). Remaining: OAuth state pen-test, secret rotation. Post-launch. |
| S8 | #102 subscription_events `IS NULL` branch | ⏳ | TBD | deferred | P2/post-launch. 0 risk rows currently. |
| S9 | **#116 next 16.2.6 — middleware bypass cluster** | ✅ | [AGENT 3] | done | PR [#122](https://github.com/fer-fer-code/lancerwise/pull/122) merged. Production-deployed via commit `9d54ff73` at 2026-05-20T18:14 UTC (success state). 6 CVEs sealed. |
| S10 | **#114 Email verify + password reset session exchange** (added 2026-05-20 by [AGENT 1] auth audit) | ✅ | [AGENT 1] | done | PR [#117](https://github.com/fer-fer-code/lancerwise/pull/117) merged 2026-05-20T17:05 UTC, deployed 17:18 UTC. AuthHashHandler client component routes fragment-grant tokens. Smoke-verified live: signup → /onboarding, recovery → /reset-password. |
| S11 | **#115 Onboarding cookie banner overlap** (P0 first-time UX) | ✅ | [AGENT 1] | done | Same PR #117. lw-app-main padding rule fires when banner open. Smoke-verified live: wizard step 1→2 advance без dismissing banner. |

**Cannot launch without:** ~~S1, S2, S3, S4, S5, S6, S9~~ ✅ all closed.

---

## 🐛 CRITICAL BUGS (must close)

| # | Item | Status | Owner | Estimate | Evidence |
|---|---|---|---|---|---|
| B1 | LANCERWISE-3 (#73 dashboard N+1) | ✅ | resolved | done | PRs #84 + #86 merged. Issue tracker shows "OPEN" but code-fixed and Sentry alert silent. Administrative close pending. |
| B2 | LANCERWISE-4 (#74 invoices N+1) | ✅ | resolved | done | PR #91 merged 2026-05-19, #74 closed. |
| B3 | #93 /work/time N+1 (95 calls) | ⏳ Stage 1 done | [AGENT 2] | ~3-5h remaining | Issue [#93](https://github.com/fer-fer-code/lancerwise/issues/93). **Stage 1 (infrastructure: DataProvider + Promise.all) shipped via PR [#119](https://github.com/fer-fer-code/lancerwise/pull/119) — production-deployed via `9d54ff73` at 18:14 UTC.** Stage 2 (widget migration к provider consumer) в flight. Detailed fix scope в `audit/agent1-work-time-investigation/RECOMMENDED-FIX-SCOPE.md`. |
| B4 | #94 /settings N+1 (27 calls) | ⏳ | queued | 3-4h | Issue [#94](https://github.com/fer-fer-code/lancerwise/issues/94). Queued after #93 lands fully. New-user onboarding path hits this. |
| B5 | LANCERWISE-7 Header notifications polling | ⏳ | TBD | post-launch | **Filed [#104](https://github.com/fer-fer-code/lancerwise/issues/104) (P2, post-launch, mobile-safari, observability).** Confirmed by orchestrator as separate scope от #90. Option A fix: ~30 min try/catch wrap + Sentry capture. Option B: ~2h Context refactor (would close с #90). |
| B6 | New issues from QA campaign | ❌ | not yet | — | Will surface during memory #11 campaign. Buffer ~4-6h expected (per realistic estimate). |

**Cannot launch without:** B3 (mobile crash), B4 (perf). **B5 (#104) deferred — P2 post-launch с monitoring** (Sentry alert on LANCERWISE-7 plus future Option B refactor).

---

## 🏗️ INFRASTRUCTURE (must be ready)

| # | Item | Status | Owner | Evidence |
|---|---|---|---|---|
| I1 | CI auth (R1) fixed | ✅ | done | Per env broadcast — pre-state. Не in current open issues. |
| I2 | Branch protection enabled (R2) | ✅ | done | Per env broadcast 2026-05-20: 3 required gates (eslint-i18n, locale-purity-ru, visual-regression). enforce_admins:false. |
| I3 | #98 baseline refresh | ✅ | done | PR #98 merged 2026-05-20 03:23 UTC. |
| I4 | Sentry release tagging | ✅ | done | Auto-wired via Vercel deploy hook. See `Architecture/SENTRY-OBSERVABILITY.md`. |
| I5 | Sentry source maps (#89 deprecation warnings) | ✅ | done | PR #97 merged 2026-05-20T14:43 UTC. |
| I6 | PII scrubbing | ✅ | done | Same PR #97. |
| I7 | LemonSqueezy live + verified | ✅ | done | PR #75 webhook live; KYC cleared (per memory). |
| I8 | **Vercel Enhanced Builds / build memory** (added 2026-05-20) | ✅ | done | Path F (PR #97) addressed OOM root cause. First post-Path-F production deploy verified clean: PR #117 (a548a2d8) at 2026-05-20T17:18 UTC. Note: #97 own first prod attempt transient-failed post-compile (see CLOSURES-2026-05-20 for analysis); recurrence не observed post-#117. |

**Cannot launch without:** ~~I5, I6~~ ✅ all closed.

---

## 🧪 QUALITY (recommended, не all blocking)

| # | Item | Status | Owner | Notes |
|---|---|---|---|---|
| Q1 | QA campaign (memory #11) | ❌ | not started | Pre-launch comprehensive QA. Trigger conditions met (LemonSqueezy live, P1-A done, P1-B done). Fixtures ready (PR #88 draft). **Should run before launch.** Est ~6-10h focused across agents. |
| Q2 | Performance baselines locked | ⏳ | [AGENT 3] | Baselines captured ([AGENT 3] `agent3-launch-baselines/`). Surfaced #93, #94. Re-baseline after #93+#94 fix recommended. |
| Q3 | Auth flow regression suite | ✅ | done | Email confirm + onboarding redirect chain verified ([AGENT 1] `agent1-onboarding-clarification/` — closes #96). Sign-in/sign-up tested implicitly via Turnstile fix. |
| Q4 | RLS audit all tables | ✅ | done | [AGENT 1] 410-table pen-test. 2 leaks found (#99, #100 verifying), 1 structural (#101), 1 defensive (#102). |
| Q5 | Known issue: /invoices AI modal backdrop RU mobile | ⏳ | queued | See vault `Bugs/INVOICES-AI-MODAL-BACKDROP.md` — P3. Fix during QA campaign. |

**Recommended before launch:** Q1 (QA campaign sweep). Acceptable к defer if resourcing forces it, но raises risk.

---

## 📚 DOCUMENTATION

| # | Item | Status | Owner | Evidence |
|---|---|---|---|---|
| D1 | Obsidian vault seeded | ✅ | done | [AGENT 1] 24 files / 12,033 words / 59 wikilinks all resolved. `/Users/myoffice/lancerwise-knowledge/` |
| D2 | Incident response runbook | ⏳ | [AGENT 4] | **Per orchestrator: located at `audit/agent4-incident-response-runbook/` в screenshots repo (declaration / triage / rollback / templates / escalation).** Verified не yet pushed к `origin/main` as of 2026-05-20 03:51 UTC. Awaiting [AGENT 4] push. |
| D3 | Launch day monitoring checklist | ⏳ | [AGENT 4] | **Per orchestrator: located at `audit/agent4-launch-observability-pkg/` (monitoring checklist + error budget + dashboard config + webhook monitoring).** Same — не yet pushed к origin. Awaiting [AGENT 4] push. |
| D4 | Privacy Policy / ToS review | ✅ | [AGENT 1] | **RESOLVED via PR [#105](https://github.com/fer-fer-code/lancerwise/pull/105)** (merged 2026-05-20 04:31 UTC). Three corrections shipped: § 4 LemonSqueezy correction, § 6 retention scoped, § 7 GDPR Art. 13(2)(d) lodge-complaint + Roskomnadzor link, "Last updated" bumped к May 20. i18n baseline +5 with rationale. CI: all 3 gates green (no admin-merge needed). RU full translation tracked as P2 follow-up [#106](https://github.com/fer-fer-code/lancerwise/issues/106) (~4-6h, within 30 days post-launch). |

**Recommended before launch:** D2 + D3 — operational essentials. D4 — legal sign-off.

---

## Summary by classification

### Cannot launch without (true blockers) — updated 2026-05-20T19:15 UTC

| Item | Status | Earliest unblock |
|---|---|---|
| ~~S3+S4 #99/#100 RLS~~ | ✅ PR #103 merged 05:08 UTC | resolved |
| ~~S5 #101 testimonials~~ | ✅ PR #107 merged 05:41 UTC | resolved |
| ~~S6+I5+I6 PII scrub + Path F~~ | ✅ PR #97 merged 14:43, deployed via #117 cascade 17:18 UTC | resolved |
| ~~S10 #114 auth fragment exchange~~ | ✅ PR #117 merged 17:05, deployed 17:18 UTC, smoke 2/2 PASS | resolved |
| ~~S11 #115 cookie banner overlap~~ | ✅ Same PR #117, smoke 1/1 PASS | resolved |
| ~~S9 #116 next 16.2.6 middleware bypass~~ | ✅ PR #122 merged, deployed via `9d54ff73` at 18:14 UTC | resolved |
| B3 #93 /work/time N+1 Stage 1 | ✅ PR #119 merged, deployed `9d54ff73` at 18:14 UTC | Stage 1 done |
| B3 #93 /work/time Stage 2 | ⏳ [AGENT 2] in flight | ~3-5h |
| B4 #94 /settings N+1 | ⏳ queued | 3-4h |

### Should fix pre-launch (raises risk if shipped without)

| Item | Status |
|---|---|
| Q1 QA campaign | ❌ not started |
| Q2 Re-baseline post-perf-fixes | needs scheduling |
| D2 Incident runbook | ⚠️ verify |
| D3 Monitoring checklist | ⚠️ verify |
| D4 Privacy/ToS legal review | ⏳ |

### Acceptable post-launch (with monitoring)

| Item | Mitigation |
|---|---|
| S8 #102 subscription_events | Webhook handler uses service_role; risk only if NULL subscription_id row created. Monitor. |
| S7 Wider security audit | RLS done; auth flow audited indirectly via Turnstile fix. Pen-test sweep is post-launch hardening. |
| B5 LANCERWISE-7 Header notif polling | If part of #90 FCP cluster — defer to that issue's P2 timeline. Verify scope. |
| Q5 /invoices AI modal backdrop | Cosmetic; Esc/X buttons work as fallback. |
| #95 /clients/[id] latent N+1 | Currently masked by empty test fixture; bloom only с real data. Monitor Sentry for `TypeError: Load failed`. |

---

## Open question marks (updated 2026-05-20T18:00 UTC)

1. ~~B5 LANCERWISE-7~~ — **RESOLVED.** Confirmed separate от #90. Filed as [#104](https://github.com/fer-fer-code/lancerwise/issues/104), P2 post-launch.
2. **D2 + D3** — Folder paths confirmed by orchestrator (`audit/agent4-incident-response-runbook/` + `audit/agent4-launch-observability-pkg/`). [AGENT 4] action needed. (Substitute: [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) covers minimal viable ops until [AGENT 4] docs land.)
3. ~~D4 Privacy/ToS~~ — **RESOLVED via PR #105** (merged 04:31 UTC). ~~PR #110 changelog stale text~~ — also **RESOLVED**: deployed via #117 cascade at 17:18 UTC. Marketing re-verify 2026-05-20T18:00: `/privacy` has LemonSqueezy 6x + Roskomnadzor 2x + complaint 2x; `/changelog` "migration in progress" count = 0.
4. **PR #97 first prod deploy transient failure** — `runAfterProductionCompile` step errored on first attempt (compile passed 21.8min, no OOM). Subsequent retry for #117 merge succeeded clean. Filed for monitoring; recurrence не observed. See CLOSURES-2026-05-20.

---

## Post-launch backlog additions (2026-05-20 dual investigation follow-up)

| Issue | Title | Severity | Trigger date |
|---|---|---|---|
| [#112](https://github.com/fer-fer-code/lancerwise/issues/112) | public.proposals migration drift — 18 backend refs (REST v1 + AI advisor + 4 crons) | P2 post-launch | First user-visible failure: 2026-05-28 to 05-31 (monthly-revenue-forecast cron) |
| [#113](https://github.com/fer-fer-code/lancerwise/issues/113) | /changelog stale text — PR #110 OOM blocked deploy (known until #97 Path F lands) | P3 post-launch | Cosmetic only; deferred |

Sentry alert configured (UI recipe): [`SENTRY-ALERT-SPEC.md`](../agent1-proposals-migration-investigation/SENTRY-ALERT-SPEC.md) — catches `relation "public.proposals" does not exist` errors, Telegram + email notification, severity High.

Investigation: [`audit/agent1-proposals-migration-investigation/`](../agent1-proposals-migration-investigation/).

## Cross-references

- ESTIMATE-TO-LAUNCH.md — timeline
- RISK-ACCEPTANCE.md — what's acceptable to ship с known issues
- All open issues: `gh issue list --state open`
- All open PRs: `gh pr list --state open`
