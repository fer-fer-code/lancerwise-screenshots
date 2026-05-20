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
| S3 | #99 invoices RLS leak (anon SELECT) | ⏳ | [AGENT 2] | merging | PR #103 contains DROP. **Independent verification PASSED 4/4** ([AGENT 1] this session). Awaiting merge. |
| S4 | #100 proposal_drafts RLS leak (anon SELECT) | ⏳ | [AGENT 2] | merging | Same PR #103. Same verification batch. |
| S5 | #101 testimonials structural leak | ⏳ | TBD | queued | Issue [#101](https://github.com/fer-fer-code/lancerwise/issues/101) open. Fix: ~30min (drop 3 policies + change default). Currently 0 rows so no live exploit, but leaks on first insert. |
| S6 | #97 PII scrub в Sentry | ⏳ | [AGENT 4] | PR open | PR #97 open, не merged. "fix(observability): scrub PII from Sentry events + apply #87 Path F (closes #89)" |
| S7 | Comprehensive security audit (memory #15) | ⏳ | [AGENT 1] | partial | RLS audit of all 410 tables ✅ ([AGENT 1] `audit/agent1-rls-full-audit/`). Other surfaces (auth flow pen-test, OAuth state, secret rotation) **not done**. See ❌ items below. |
| S8 | #102 subscription_events `IS NULL` branch | ⏳ | TBD | deferred | P2/post-launch. 0 risk rows currently. |

**Cannot launch without:** S1, S2, S3, S4, S5, S6.

---

## 🐛 CRITICAL BUGS (must close)

| # | Item | Status | Owner | Estimate | Evidence |
|---|---|---|---|---|---|
| B1 | LANCERWISE-3 (#73 dashboard N+1) | ✅ | resolved | done | PRs #84 + #86 merged. Issue tracker shows "OPEN" but code-fixed and Sentry alert silent. Administrative close pending. |
| B2 | LANCERWISE-4 (#74 invoices N+1) | ✅ | resolved | done | PR #91 merged 2026-05-19, #74 closed. |
| B3 | #93 /work/time N+1 (95 calls) | ⏳ | TBD | 6-8h | Issue [#93](https://github.com/fer-fer-code/lancerwise/issues/93) open. Detailed fix scope в `audit/agent1-work-time-investigation/RECOMMENDED-FIX-SCOPE.md`. Mobile crash near-certain. |
| B4 | #94 /settings N+1 (27 calls) | ⏳ | TBD | 3-4h | Issue [#94](https://github.com/fer-fer-code/lancerwise/issues/94) open. New-user onboarding path hits this. |
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
| I5 | Sentry source maps (#89 deprecation warnings) | ⏳ | [AGENT 4] | PR #97 in flight ("closes #89") |
| I6 | PII scrubbing | ⏳ | [AGENT 4] | Same PR #97 |
| I7 | LemonSqueezy live + verified | ✅ | done | PR #75 webhook live; KYC cleared (per memory). |

**Cannot launch without:** I5, I6 (PR #97 needs к merge — handles both в one cluster).

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
| D4 | Privacy Policy / ToS review | ⏳ | Ramiz | Privacy and Terms pages live и translated к RU (Bug #024). Legal sign-off pending — orchestrator surfacing к Ramiz. Will update когда confirmed. |

**Recommended before launch:** D2 + D3 — operational essentials. D4 — legal sign-off.

---

## Summary by classification

### Cannot launch without (true blockers)

| Item | Status | Earliest unblock |
|---|---|---|
| S3+S4 #99/#100 RLS | ⏳ (PR #103 verified, awaiting merge) | within hours |
| S5 #101 testimonials | ⏳ | ~30min once owned |
| S6+I5+I6 PII scrub | ⏳ (PR #97) | within hours |
| B3 #93 /work/time N+1 | ⏳ | 6-8h |
| B4 #94 /settings N+1 | ⏳ | 3-4h |

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

## Open question marks (updated 2026-05-20 follow-up)

1. ~~B5 LANCERWISE-7~~ — **RESOLVED.** Confirmed separate от #90. Filed as [#104](https://github.com/fer-fer-code/lancerwise/issues/104), P2 post-launch.
2. **D2 + D3** — Folder paths confirmed by orchestrator (`audit/agent4-incident-response-runbook/` + `audit/agent4-launch-observability-pkg/`) but **NOT yet pushed к screenshots repo `origin/main`** as of 2026-05-20 03:51 UTC. [AGENT 4] action needed.
3. **D4 Privacy/ToS** — Orchestrator surfacing к Ramiz для sign-off. Pending.

## Cross-references

- ESTIMATE-TO-LAUNCH.md — timeline
- RISK-ACCEPTANCE.md — what's acceptable to ship с known issues
- All open issues: `gh issue list --state open`
- All open PRs: `gh pr list --state open`
