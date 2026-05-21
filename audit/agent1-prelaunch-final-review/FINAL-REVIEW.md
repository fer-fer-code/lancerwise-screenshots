# PRELAUNCH-CHECKLIST.md — Final Review

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Method:** Line-by-line verification against GitHub API + filesystem + memory. READ-ONLY.
**Doc reviewed:** [`audit/agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md`](../agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md) (157 lines)

---

## Section A — Verification table

### SECURITY (10 rows)

| # | Claim | Actual state | Verdict |
|---|---|---|---|
| S1 | Turnstile bypass closed via Mgmt API PATCH 2026-05-20 | ✅ verified via Supabase Management API check earlier this session | ✅ Match |
| S2 | CAPTCHA enforced server-side, security_captcha_enabled: true | ✅ verified during smoke test 14:25 UTC ("captcha protection: request disallowed") | ✅ Match |
| S3 | #99 invoices RLS — PR #103 merged 2026-05-20T05:08 UTC | GitHub API: PR #103 MERGED 2026-05-20T04:56:49Z. Issue #99 CLOSED. **Timestamp off by 12 min** (claim 05:08, actual 04:56) | ⚠️ Minor timestamp drift; issue state ✅ |
| S4 | #100 proposal_drafts RLS — same PR #103 | Issue #100 CLOSED | ✅ Match |
| S5 | #101 testimonials — PR #107 merged 2026-05-20T05:41 UTC | GitHub API: PR #107 MERGED 2026-05-20T05:35:29Z. Issue #101 CLOSED. **Timestamp off by 6 min** | ⚠️ Minor drift; issue state ✅ |
| S6 | #97 PII scrub + Path F — PR #97 merged 14:43 UTC | GitHub API: PR #97 MERGED 2026-05-20T14:43:33Z | ✅ Match |
| S7 | Comprehensive security audit ⏳ partial | RLS audit done; auth-flow regression done. OAuth state pen-test + secret rotation post-launch — accurate | ✅ Match |
| S8 | #102 subscription_events ⏳ deferred P2 | Issue #102 OPEN, labeled P2 | ✅ Match |
| S9 | #116 next 16.2.6 — PR #122 merged + deployed commit 9d54ff73 18:14 UTC | GitHub API: PR #122 MERGED 2026-05-20T18:10:59Z. Issue #116 CLOSED. **Timestamp off by 4 min** | ⚠️ Minor drift; state ✅ |
| S10 | #114 auth fragment exchange — PR #117 merged 17:05 UTC | GitHub API: PR #117 MERGED 2026-05-20T17:05:40Z. Smoke 2/2 PASS verified this session | ✅ Match |
| S11 | #115 cookie banner overlap — same PR #117 | PR #117 covers both; smoke 1/1 PASS verified | ✅ Match |

**SECURITY summary:** all claims accurate; 3 minor timestamp drifts (4-12 min off) — cosmetic, не functional.

### CRITICAL BUGS (6 rows)

| # | Claim | Actual state | Verdict |
|---|---|---|---|
| B1 | #73 dashboard N+1 ✅ via PRs #84+#86 | Functionally resolved; issue tracker administrative-close pending | ✅ Match |
| B2 | #74 invoices N+1 ✅ via PR #91 | Closed | ✅ Match |
| B3 | #93 /work/time N+1 ✅ RESOLVED via 4 PRs (#119+#126+#127+#129), 80 widgets, fetch count 3 | GitHub API: Issue #93 CLOSED. PR #129 MERGED 2026-05-21T13:13:21Z. [AGENT 3] verdict 5/5 PASS | ✅ Match |
| B4 | #94 /settings N+1 (27 calls) ⏳ queued | Issue #94 OPEN. **STALE:** "(27 calls)" — [AGENT 1] diagnosis showed ~59 calls (2× heavier). "Queued after #93 lands fully" — #93 has landed, B4 should be ACTIVE | ❌ Stale: queue status + call count |
| B5 | LANCERWISE-7 #104 ⏳ deferred P2 | Issue #104 OPEN, labeled P2 | ✅ Match |
| B6 | New QA campaign issues ❌ not yet | Q1 still not started | ✅ Match |

### INFRASTRUCTURE (8 rows)

| # | Claim | Actual state | Verdict |
|---|---|---|---|
| I1 | CI auth (R1) fixed ✅ | Pre-state, accurate | ✅ Match |
| I2 | Branch protection enabled с 3 required gates | Confirmed during multiple PR merges this session | ✅ Match |
| I3 | #98 baseline refresh ✅ PR #98 merged 2026-05-20 03:23 UTC | (not verified directly but PR #98 references match earlier work) | ✅ Match (trusted) |
| I4 | Sentry release tagging ✅ auto-wired via Vercel | Operational | ✅ Match |
| I5 | Sentry source maps ✅ PR #97 | Same PR #97 (verified) | ✅ Match |
| I6 | PII scrubbing ✅ PR #97 | Same PR #97 (verified) | ✅ Match |
| I7 | LemonSqueezy live + verified (PR #75 + KYC cleared) | Operational per memory | ✅ Match |
| I8 | Vercel Enhanced Builds / Path F | PR #97's Path F validated post-deploy | ✅ Match |

### QUALITY (5 rows)

| # | Claim | Actual state | Verdict |
|---|---|---|---|
| Q1 | QA campaign ❌ not started | Confirmed not started | ✅ Match |
| Q2 | Performance baselines locked ⏳ | "Re-baseline after #93+#94 fix recommended" — **STALE** since #93 IS landed. Update wording. | ⚠️ Partially stale |
| Q3 | Auth flow regression suite ✅ | Done via my own work agent1-auth-flow-regression/ | ✅ Match |
| Q4 | RLS audit all tables ✅ | Done via my own work agent1-rls-full-audit/ | ✅ Match |
| Q5 | /invoices AI modal backdrop ⏳ P3 | Acceptable | ✅ Match |

### DOCUMENTATION (4 rows)

| # | Claim | Actual state | Verdict |
|---|---|---|---|
| D1 | Obsidian vault seeded ✅ | Done | ✅ Match |
| D2 | Incident response runbook ⏳ [AGENT 4] | **UNVERIFIED** — claim "не yet pushed as of 2026-05-20 03:51 UTC" — has not refreshed in 1.5 days | ⚠️ Stale verification timestamp |
| D3 | Launch day monitoring checklist ⏳ [AGENT 4] | Same as D2 — stale verification | ⚠️ Stale verification timestamp |
| D4 | Privacy/ToS ✅ via PR #105 | PR #105 verified merged | ✅ Match |

---

## Section B — Missing-from-checklist items

Critical items NOT в the checklist but should be tracked before launch:

| # | Missing item | Severity | Recommendation |
|---|---|---|---|
| M1 | **Security headers verified в production** (CSP nonce, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy) | P0 add now | Add row "IS Security headers" к Infrastructure section. Verify via `curl -sI`. Memory confirms these are configured but не formally checked at launch |
| M2 | **Sentry PII scrubbing — verified в production** (NOT just merged) | P1 add now | I6 says "PR #97 merged" — но не explicitly confirms production verification. Add sub-row: "PII scrub verified live by inspecting а sample Sentry event post-deploy" |
| M3 | **LemonSqueezy webhook signing secret state** | P0 add now | I7 says "live + verified" но не states whether webhook secret is rotated к production value (vs dev/test). Add explicit row |
| M4 | **Resend DKIM/SPF/DMARC verified** | P1 add now | Memory shows mail-tester 10/10 but no formal checklist row. Add: "Resend domain auth records verified live (DKIM + SPF + DMARC)" |
| M5 | **DNS records (apex + www + mail) production-correct** | P1 add now | Implicit; not explicit. Add row referencing my new RUNBOOK.md § A4 verification curl |
| M6 | **Backup / disaster recovery plan documented** | P2 add now | No formal mention. Add row: "Supabase auto-backup confirmed enabled; Vercel rollback procedure documented (see audit/agent1-launch-day-runbook/RUNBOOK.md § E)" |
| M7 | **#131 p95 24h re-check stream tracker** | P3 reference | Already filed as #131 для post-launch monitoring. Add к "Post-launch backlog additions" section (line 141) для visibility |
| M8 | **Smoke testing protocol prepared** | P0 add now | My SMOKE-TESTING-PROTOCOL.md exists; checklist doesn't reference it. Add row: "Smoke testing protocol designed + ready к execute post-#94" |
| M9 | **Launch day runbook prepared** | P0 add now | My RUNBOOK.md exists; not referenced. Add row mirroring M8 |

---

## Section C — Stale rows needing update

| Row | Current text | Recommended update |
|---|---|---|
| Header (line 4) | "Date: 2026-05-20" | "Date: 2026-05-21 (originally 2026-05-20, revised through post-Stage-2-v2 closure)" |
| B4 row (line 42) | "#94 /settings N+1 (27 calls) ⏳ queued — Queued after #93 lands fully" | "#94 /settings N+1 (~59 mount-fetches per [AGENT 1] diagnosis — 2× initial estimate). **ACTIVE critical path**. [AGENT 2] in flight. Diagnosis ready: `audit/agent1-94-settings-diagnosis/`" |
| #102 row (line 26) | "P2/post-launch. 0 risk rows currently." | Same + "Sentry alert spec ready: `audit/agent1-proposals-migration-investigation/SENTRY-ALERT-SPEC.md`" |
| D2 + D3 (lines 86-87) | "Verified не yet pushed к origin/main as of 2026-05-20 03:51 UTC" | Re-verify NOW. Если still not pushed → "Verified не yet pushed as of 2026-05-21T<TIME> UTC. Substitutes available: my new RUNBOOK.md + POST-LAUNCH-DAY-1-RUNBOOK.md" |
| Open question marks header (line 132) | "(updated 2026-05-20T18:00 UTC)" | "(updated 2026-05-21T<TIME> UTC)" + add new entry referencing post-Stage-2-v2 state |
| Q2 row (line 72) | "Re-baseline after #93+#94 fix recommended" | "Re-baseline after #94 fix recommended (#93 already closed Stage 2 v2 PASS 2026-05-21T13:13 UTC; baseline incorporates 3-fetch /work/time)" |
| Post-launch backlog (line 141) | Header says "(2026-05-20 dual investigation follow-up)" — table only lists #112 + #113 | Add rows для #118, #120, #121, #130, #131 (5 new post-launch backlog issues filed since 2026-05-20) |

---

## Section D — Final go/no-go signal

**Scenario:** "Если launch was 30 min from now"

### What's GREEN ✅

- All Tier 1 security (S1-S6, S9-S11) closed and verified
- All Tier 1 critical bugs (B1, B2, B3) closed
- All Tier 1 infrastructure (I1-I8) closed
- Auth flow regression done (Q3)
- RLS audit done (Q4)
- Privacy/ToS GDPR compliant (D4)

### What's YELLOW ⚠️

- **#94 /settings** — still active critical path; [AGENT 2] in flight per PRELAUNCH-CHECKLIST line 108
- **Q1 QA campaign** — not started (recommended but не strict blocker per checklist)
- **D2 + D3 [AGENT 4] runbooks** — status unverified since 2026-05-20 03:51 UTC; substitutes exist in my [`agent1-launch-day-runbook/RUNBOOK.md`](../agent1-launch-day-runbook/RUNBOOK.md) + [`agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md)

### What's MISSING ❓

- Per Section B above: 9 items missing or under-tracked (security headers, webhook secret state, DKIM/SPF, DNS, backup plan, p95 24h tracker, smoke protocol reference, runbook reference)
- 6 of 9 are P0/P1 — should be added к checklist before launch trigger

### Verdict: **NO-GO at 30 min** (without remediation)

**Reason:** #94 still active critical path; cannot launch с open functional blocker.

**Time к GO:**
- If #94 closes within next 30 min → re-evaluate, likely **GO**
- If [AGENT 2] needs more time → **NO-GO**, push launch к T+#94 close time
- Section B P0 items (M1, M3, M8, M9) can ship parallel к #94 (~30-45 min checklist update)

**Recommended next steps before launch:**
1. ⏳ Wait для #94 close + [AGENT 3] probe PASS
2. ⏳ Verify D2 + D3 status ([AGENT 4] runbooks pushed?)
3. ⏳ Add Section B P0 rows к PRELAUNCH-CHECKLIST (M1, M3, M8, M9) — 15 min focused edit
4. ⏳ Verify Section C stale rows updated — 10 min mechanical edit
5. ⏳ Execute SMOKE-TESTING-PROTOCOL.md F1-F11 production smokes (~2-2.5h wall-clock с 3-agent parallelism)
6. ⏳ [AGENT 4] Sentry 15-min watch CLEAN post-deploy
7. ✅ Then LAUNCH

**Realistic ETA к GO:** 3-5 hours от now (assuming #94 closes within 1-2 hours).

---

## Cross-references

- [`audit/agent1-post-launch-runbook-audit/AUDIT-FINDINGS.md`](../agent1-post-launch-runbook-audit/AUDIT-FINDINGS.md) — companion audit (TASK 1)
- [`audit/agent1-launch-day-runbook/RUNBOOK.md`](../agent1-launch-day-runbook/RUNBOOK.md) — launch-moment runbook (commit `9d125a2`)
- [`audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md) — F1-F11 smoke spec
- [`audit/agent1-launch-readiness-master/CLOSURES-2026-05-20.md`](../agent1-launch-readiness-master/CLOSURES-2026-05-20.md) — closures inventory
- [`audit/agent1-94-settings-diagnosis/DIAGNOSIS.md`](../agent1-94-settings-diagnosis/DIAGNOSIS.md) — #94 pre-flight (informs B4 update)
