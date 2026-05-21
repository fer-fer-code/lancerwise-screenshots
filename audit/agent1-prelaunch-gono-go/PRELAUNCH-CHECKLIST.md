# Pre-Launch GO/NO-GO Checklist

**Author:** [AGENT 1]
**Date:** 2026-05-21 (originally 2026-05-20; revised post Stage 2 v2 closure + INFRA verification)
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
| S8 | #102 subscription_events `IS NULL` branch | ⏳ | TBD | deferred | P2/post-launch. 0 risk rows currently. Sentry alert spec ready: [`audit/agent1-proposals-migration-investigation/SENTRY-ALERT-SPEC.md`](../agent1-proposals-migration-investigation/SENTRY-ALERT-SPEC.md). |
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
| ~~B3~~ | ~~#93 /work/time N+1 (Phase 1 closure)~~ | ✅ **RESOLVED** | [AGENT 2] | done | **Phase 1 N+1 closed.** PR #119 Stage 1 (infrastructure, fix-forward к v3 PASS) + PR #126 Stage 1.5 (defensive guards) + PR #127 Stage 2 (31 widgets) + PR [#129](https://github.com/fer-fer-code/lancerwise/pull/129) Stage 2 v2 (49 widgets + 2 new slices) = **80 total widgets migrated.** [AGENT 3] final verdict 5/5 PASS @ commit `23c191fb`: **Chromium fetch count 3** (target <10, achieved **-97% vs baseline ~95**). [AGENT 4] Sentry watch CLEAN post-deploy. 3 residual fetches: 1 out-of-scope (GlobalTimerBar global shell) + 2 P3 polish candidates filed as [#130](https://github.com/fer-fer-code/lancerwise/issues/130) post-launch. Evidence: `audit/agent3-93-stage-2-v2-verify/VERDICT-STAGE2-V2-v1.md`. |
| B4 | #94 /settings N+1 (~59 mount-fetches per [AGENT 1] diagnosis — 2× initial 27-call estimate) | ⏳ **ACTIVE critical path** | [AGENT 2] in flight | 3-4h optimistic / 7-8h realistic | Issue [#94](https://github.com/fer-fer-code/lancerwise/issues/94). Diagnosis ready: [`audit/agent1-94-settings-diagnosis/`](../agent1-94-settings-diagnosis/) — 28 antipattern widgets across 16 subroutes. Recommended approach: server-component prefetch + initialProps (NOT Context Provider; existing BrandingSettings.tsx precedent). |
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
| I9 | **Security headers — production verified** (added 2026-05-21 INFRA check) | ⚠️ **P1 deferred** | [AGENT 1] | post-launch | 5 of 6 baseline headers PASS: HSTS (2y, includeSubDomains, preload), X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy {camera, mic, geolocation}=(). **❌ Content-Security-Policy MISSING entirely** — filed [#133](https://github.com/fer-fer-code/lancerwise/issues/133) as P1 post-launch hot follow-up day 1-3 (per Ramiz preference). 3-phase rollout spec: [`audit/agent1-csp-design/CSP-SPEC.md`](../agent1-csp-design/CSP-SPEC.md). Evidence: [`INFRA-CHECKS-2026-05-21.md`](../agent1-infra-verification/INFRA-CHECKS-2026-05-21.md) §1. |
| I10 | **DNS records production-correct** (added 2026-05-21) | ✅ | done | Apex A: 216.150.1.1, 216.150.16.1 (Vercel). www CNAME: 645ecb0cbe6d1cb7.vercel-dns-017.com. MX: 3 CF Email Routing route MX. SPF: `v=spf1 include:_spf.mx.cloudflare.net ~all`. Evidence: INFRA-CHECKS-2026-05-21.md §2. |
| I11 | **Email auth (DKIM + SPF + DMARC) production-verified** (added 2026-05-21) | ✅ с P3 caveat | [AGENT 1] | done | DKIM Resend present + well-formed. SPF correct. DMARC `p=none` monitor mode — ramp filed as [#134](https://github.com/fer-fer-code/lancerwise/issues/134) (P3 post-launch month-1+ ramp к `p=quarantine` → `p=reject`). Evidence: [`INFRA-CHECKS-2026-05-21.md`](../agent1-infra-verification/INFRA-CHECKS-2026-05-21.md) §3. |
| I12 | **LemonSqueezy webhook signing secret state** (added 2026-05-21) | ⚠️ **unverified** | Ramiz | needs Dashboard check | Browser navigation hit login wall (Google OAuth / email login required). Verify in LS Dashboard → Settings → Webhooks: (1) URL = `https://www.lancerwise.com/api/lemonsqueezy/webhook` (NOT `/api/webhooks/lemonsqueezy` — actual handler path corrected); (2) signing secret populated; (3) events: `subscription_created`, `subscription_updated`, `subscription_cancelled`, `subscription_resumed`, `subscription_expired`, `subscription_payment_success`, `subscription_payment_failed`, `order_created`, `order_refunded` (9 events expected per handler grep). Surfaced к Ramiz 2026-05-21 via Telegram. |

**Cannot launch without:** ~~I5, I6~~ ✅. ⚠️ **I9 CSP recommended pre-launch.** I12 webhook secret needs Ramiz verification.

---

## 🧪 QUALITY (recommended, не all blocking)

| # | Item | Status | Owner | Notes |
|---|---|---|---|---|
| Q1 | QA campaign (memory #11) | ❌ | not started | Pre-launch comprehensive QA. Trigger conditions met (LemonSqueezy live, P1-A done, P1-B done). Fixtures ready (PR #88 draft). **Should run before launch.** Est ~6-10h focused across agents. |
| Q2 | Performance baselines locked | ⏳ | [AGENT 3] | Baselines captured ([AGENT 3] `agent3-launch-baselines/`). Surfaced #93, #94. **#93 closed Stage 2 v2 PASS 2026-05-21T13:13 UTC** (fetch count 3). Re-baseline after #94 fix recommended. |
| Q3 | Auth flow regression suite | ✅ | done | Email confirm + onboarding redirect chain verified ([AGENT 1] `agent1-onboarding-clarification/` — closes #96). Sign-in/sign-up tested implicitly via Turnstile fix. |
| Q4 | RLS audit all tables | ✅ | done | [AGENT 1] 410-table pen-test. 2 leaks found (#99, #100 verifying), 1 structural (#101), 1 defensive (#102). |
| Q5 | Known issue: /invoices AI modal backdrop RU mobile | ⏳ | queued | See vault `Bugs/INVOICES-AI-MODAL-BACKDROP.md` — P3. Fix during QA campaign. |
| Q6 | **Smoke testing protocol designed** (added 2026-05-21) | ✅ | [AGENT 1] | done | 11 flows × 2 locales × 2 viewports × 3 auth states. Owner mapping + PASS criteria + P0-P3 categorization + ~2-2.5h wall-clock execution с 3-agent parallelism. Evidence: [`audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md). |

**Recommended before launch:** Q1 (QA campaign sweep). Acceptable к defer if resourcing forces it, но raises risk.

---

## 📚 DOCUMENTATION

| # | Item | Status | Owner | Evidence |
|---|---|---|---|---|
| D1 | Obsidian vault seeded | ✅ | done | [AGENT 1] 24 files / 12,033 words / 59 wikilinks all resolved. `/Users/myoffice/lancerwise-knowledge/` |
| D2 | Incident response runbook | ⏳ | [AGENT 4] | **Per orchestrator: located at `audit/agent4-incident-response-runbook/` в screenshots repo (declaration / triage / rollback / templates / escalation).** Verified не yet pushed к `origin/main` as of 2026-05-21 INFRA audit. **Substitute available:** [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) + [`RUNBOOK.md`](../agent1-launch-day-runbook/RUNBOOK.md). |
| D3 | Launch day monitoring checklist | ⏳ | [AGENT 4] | **Per orchestrator: located at `audit/agent4-launch-observability-pkg/` (monitoring checklist + error budget + dashboard config + webhook monitoring).** Same — не yet pushed к origin. **Substitute:** D5 RUNBOOK.md covers minimal viable monitoring cadence. |
| D4 | Privacy Policy / ToS review | ✅ | [AGENT 1] | **RESOLVED via PR [#105](https://github.com/fer-fer-code/lancerwise/pull/105)** (merged 2026-05-20T04:31 UTC verified per GitHub API). Three corrections shipped: § 4 LemonSqueezy correction, § 6 retention scoped, § 7 GDPR Art. 13(2)(d) lodge-complaint + Roskomnadzor link, "Last updated" bumped к May 20. i18n baseline +5 with rationale. CI: all 3 gates green (no admin-merge needed). RU full translation tracked as P2 follow-up [#106](https://github.com/fer-fer-code/lancerwise/issues/106) (~4-6h, within 30 days post-launch). |
| D5 | **Launch day runbook designed** (added 2026-05-21) | ✅ | [AGENT 1] | done | T-30min → T+24h tactical operations. Pre-launch checks, T-0 communications templates (EN+RU), first 1h + 24h monitoring cadence, rollback decision tree. Evidence: [`audit/agent1-launch-day-runbook/RUNBOOK.md`](../agent1-launch-day-runbook/RUNBOOK.md). |
| D6 | **Post-launch Day 1 runbook** (verified 2026-05-21) | ✅ | [AGENT 1] | done | Updated 2026-05-21 per [AGENT 1] audit: stale #93/#94 references fixed, Sentry threshold aligned к 3500ms hard trip-wire, /settings triage path added. Evidence: [`audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md). |

**Recommended before launch:** D2 + D3 — operational essentials. D4 — legal sign-off.

---

## Summary by classification

### Cannot launch without (true blockers) — updated 2026-05-20T20:00 UTC

| Item | Status | Earliest unblock |
|---|---|---|
| ~~S1+S2 Turnstile bypass + server-side CAPTCHA~~ | ✅ Supabase Management API PATCH 2026-05-20 (`security_captcha_enabled: true`); evidence в `audit/agent2-turnstile-fix/` | resolved |
| ~~S3+S4 #99/#100 RLS~~ | ✅ PR #103 merged 05:08 UTC | resolved |
| ~~S5 #101 testimonials~~ | ✅ PR #107 merged 05:41 UTC | resolved |
| ~~S6+I5+I6 PII scrub + Path F~~ | ✅ PR #97 merged 14:43, deployed via #117 cascade 17:18 UTC | resolved |
| ~~S10 #114 auth fragment exchange~~ | ✅ PR #117 merged 17:05, deployed 17:18 UTC, smoke 2/2 PASS | resolved |
| ~~S11 #115 cookie banner overlap~~ | ✅ Same PR #117, smoke 1/1 PASS | resolved |
| ~~S9 #116 next 16.2.6 middleware bypass~~ | ✅ PR #122 merged, deployed via `9d54ff73` at 18:14 UTC | resolved |
| ~~B3 #93 /work/time N+1 (Phase 1 closure)~~ | ✅ **RESOLVED** — 80 widgets, 4 PRs (#119+#126+#127+#129), fetch count 3 (-97% vs baseline) | resolved |
| **B4 #94 /settings N+1** | ⏳ **ACTIVE critical path** — diagnosis ready ([AGENT 1] `audit/agent1-94-settings-diagnosis/`) | 3-4h optimistic / 7-8h realistic |

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

## Open question marks (updated 2026-05-21 post-INFRA audit)

1. ~~B5 LANCERWISE-7~~ — **RESOLVED.** Confirmed separate от #90. Filed as [#104](https://github.com/fer-fer-code/lancerwise/issues/104), P2 post-launch.
2. **D2 + D3** — Folder paths confirmed by orchestrator (`audit/agent4-incident-response-runbook/` + `audit/agent4-launch-observability-pkg/`). [AGENT 4] action needed. (Substitute: [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) covers minimal viable ops until [AGENT 4] docs land.)
3. ~~D4 Privacy/ToS~~ — **RESOLVED via PR #105** (merged 04:31 UTC). ~~PR #110 changelog stale text~~ — also **RESOLVED**: deployed via #117 cascade at 17:18 UTC. Marketing re-verify 2026-05-20T18:00: `/privacy` has LemonSqueezy 6x + Roskomnadzor 2x + complaint 2x; `/changelog` "migration in progress" count = 0.
4. **PR #97 first prod deploy transient failure** — `runAfterProductionCompile` step errored on first attempt (compile passed 21.8min, no OOM). Subsequent retry for #117 merge succeeded clean. Filed for monitoring; recurrence не observed. See CLOSURES-2026-05-20.

---

## Post-launch backlog additions (continuous, multiple sweeps 2026-05-20 → 2026-05-21)

| Issue | Title | Severity | Trigger / target date |
|---|---|---|---|
| [#112](https://github.com/fer-fer-code/lancerwise/issues/112) | public.proposals migration drift — 18 backend refs (REST v1 + AI advisor + 4 crons) | P2 post-launch | First user-visible failure: 2026-05-28 к 05-31 (monthly-revenue-forecast cron) |
| [#113](https://github.com/fer-fer-code/lancerwise/issues/113) | /changelog stale text — PR #110 OOM (closed via #117 cascade) | P3 (closed) | Resolved |
| [#118](https://github.com/fer-fer-code/lancerwise/issues/118) | Migrate Supabase email templates' redirect_to к /auth/callback PKCE | P3 post-launch | Long-term hardening |
| [#120](https://github.com/fer-fer-code/lancerwise/issues/120) | runAfterProductionCompile transient flake monitoring | P3 post-launch | Watch — recurrence based |
| [#121](https://github.com/fer-fer-code/lancerwise/issues/121) | scripts/auth-audit-setup.mjs cleanup regex | P3 post-launch | 5-min fix anytime |
| [#130](https://github.com/fer-fer-code/lancerwise/issues/130) | Residual /work/time fetches — 2 widget polish | P3 post-launch | Optional polish |
| [#131](https://github.com/fer-fer-code/lancerwise/issues/131) | Stage 2 v2 /work/time p95 24h re-check | P3 post-launch | T+24h after launch |
| (TBD — file post-#94) | **CSP missing on production — add к Next.js middleware** | **P1 pre-launch or week-1** | INFRA audit 2026-05-21; see I9 + INFRA-CHECKS-2026-05-21.md |
| (TBD) | DMARC enforcement ramp `p=none` → `p=quarantine` → `p=reject` | P3 post-launch month-1+ | After 30-day aggregate report review |

Sentry alert configured (UI recipe): [`SENTRY-ALERT-SPEC.md`](../agent1-proposals-migration-investigation/SENTRY-ALERT-SPEC.md) — catches `relation "public.proposals" does not exist` errors, Telegram + email notification, severity High.

Investigation: [`audit/agent1-proposals-migration-investigation/`](../agent1-proposals-migration-investigation/).

## Cross-references

- ESTIMATE-TO-LAUNCH.md — timeline
- RISK-ACCEPTANCE.md — what's acceptable to ship с known issues
- All open issues: `gh issue list --state open`
- All open PRs: `gh pr list --state open`
