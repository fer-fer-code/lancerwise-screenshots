# Risk Profile — Pre-Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** What ships с known risk, mitigation in place, monitoring к watch. Honest tiering.

---

## Tier 1 — CANNOT ship (true blockers, must close)

### #93 /work/time N+1 storm (P1)

**Risk:** iOS Safari crash near-certain at 101 widgets с mount-time fetches. Russian launch market = mobile-heavy. Time tracking is а core daily-use freelancer feature.

**Impact if shipped:**
- Mobile users can't track time = product unusable за half the audience
- Support burden first-day catastrophic
- "Buggy on iPhone" feedback в early reviews

**Likelihood:** Near-certain on mobile, given 86 widgets fetching на mount. Pattern matches #74 (which crashed at 10-15 widgets — этот page has ~10× density).

**Mitigation:** None acceptable. Must fix.

**Status:** No PR in flight as of synthesis. ~6-8h focused work.

### #94 /settings N+1 storm (P1)

**Risk:** 27 mount-time calls на a page hit during new-user onboarding (set profile / brand color / invoice prefix).

**Impact if shipped:** Slow page load + jittery UI on first sign-in. Brand erosion. Onboarding completion drops.

**Likelihood:** Certain (calls happen on every load).

**Mitigation:** None acceptable pre-launch. Fix recipe established (same as #73).

**Status:** No PR in flight. ~3-4h focused work.

---

## Tier 2 — Ship с monitoring (acceptable risk)

### #95 /clients/[id] latent N+1

**Risk:** 37 widgets с mount-fetch pattern. Same family as #74.

**Mitigation:**
- Sentry alert wired для `TypeError: Load failed` на `/clients/[id]` route
- Empty test fixture currently masks the storm; real users will trigger as they accumulate clients

**Monitoring:** Sentry inbox watching `/clients/[id]` route + `iPhone`-user-agent crash reports. First crash report → elevate к P1 + fix.

**Acceptable post-launch fix window:** within 7 days.

### #90 /dashboard FCP residual

**Risk:** 7.8s cold / 3.1s warmest FCP. "Needs Improvement" yellow on Core Web Vitals.

**Mitigation:**
- Sentry alert #435759 armed (P95 > 3s) — currently silent на real users
- Root causes diagnosed: notifications memoization gap + RSC cold-start variance
- Decision documented в [[Decisions/2026-05-19-P1-A-PARTIAL-ACCEPTANCE]]

**Monitoring:** Vercel Speed Insights weekly; Sentry alert active.

### #104 LANCERWISE-7 Header polling

**Risk:** Mobile Safari `TypeError: Load failed` от /api/notifications polling в global Header. Hits all (app) routes.

**Mitigation:**
- Functional impact: low (notification counter may show stale value transiently)
- Fix ready: ~30 min try/catch + Sentry capture (Option A) или ~2h Context refactor (Option B)

**Monitoring:** Sentry LANCERWISE-7 issue tracker — watch frequency. If >100 events/day, elevate.

### #102 subscription_events `IS NULL` policy branch

**Risk:** If LemonSqueezy webhook handler ever inserts а row с NULL subscription_id, that row becomes anon-readable.

**Mitigation:**
- Currently 0 such rows
- Webhook handler uses service_role + always passes subscription_id (audited)
- Defensive fix ready (~10 min DROP/CREATE policy)

**Monitoring:** SQL spot-check every 2-3 days: `SELECT count(*) FROM subscription_events WHERE subscription_id IS NULL;` — expect 0.

### #106 RU translation of legal pages

**Risk:** GDPR Art. 12 — legal text not "intelligible" в Russian-locale user's language.

**Mitigation:**
- Legal pages в English are plain-language, не legalese
- legal@lancerwise.com responds к queries
- Optional: add notice banner для RU users (per RECOMMENDATIONS Action 4) — currently not deployed
- Commitment к 30-day post-launch translation

**Monitoring:** track legal@lancerwise.com inbox for "untranslated documents" complaints. If material, expedite #106.

### Sentry cluster (#76, #77, #78, #79, #80, #81, #82, #87, #92)

**Risk:** Real users hit errors, не tied к specific user/locale в Sentry triage. Investigation slower. Some error paths silent (#82 console.error, #79 Resend, #78 AI endpoints).

**Mitigation:**
- Baseline error capture is functional
- Manual triage works (just slower)

**Monitoring:** weekly Sentry inbox review. First 7 days assume manual triage; ship full cluster fix as one [AGENT 2/4] post-launch sprint.

### #109 Marketing cosmetic (3 items)

**Risk:** Minor UX clarity issues. Не legal exposure.

**Mitigation:** Filed, scheduled post-launch. Watch user feedback for "I thought LancerWise used Stripe для everything" confusion.

---

## Tier 3 — Ship as-is (no real risk)

### #73 LANCERWISE-3 (code-fixed)

Issue marker remains OPEN on tracker but code-resolved via PRs #84+#86. Administrative cleanup needed но не material.

### #74 LANCERWISE-4 (closed)

Resolved via PR #91. Mobile Safari crash fixed.

### Q3 Auth flow regression

Verified via Turnstile fix + onboarding flow audit. Sign-in/sign-up/email confirm chain end-to-end consistent.

### Q4 RLS audit

Done. Pen-test protocol now permanent gate.

### D1 Obsidian vault

Done. Reference layer, не gating.

---

## Tier 4 — Cannot independently verify (must clarify pre-launch)

### [AGENT 4] incident response runbook (D2)

**Status:** Orchestrator referenced `audit/agent4-incident-response-runbook/` but folder NOT pushed к screenshots repo as of 05:55 UTC.

**Action:** Ping [AGENT 4] для status. If missing → emergency MV procedure: this file's POST-LAUNCH-DAY-1-RUNBOOK.md substitutes минимально.

### [AGENT 4] launch observability package (D3)

**Status:** Same — orchestrator referenced `audit/agent4-launch-observability-pkg/`, не visible.

**Action:** Same.

---

## Specific shipping scenarios

### Scenario A — Launch в 24h
**Required:** #93 + #94 closed. AGENT 4 runbooks confirmed.
**Acceptable defers:** All Tier 2 items с monitoring.
**Feasibility:** Tight но possible if #93/#94 work starts immediately.

### Scenario B — Launch в 48-72h (RECOMMENDED)
**Required:** Scenario A + at least one round of QA campaign.
**Bonus:** Some Sentry cluster items closed; D2/D3 verified.

### Scenario C — Launch в 1 week
**Required:** All Tier 1 + Tier 2 items closed.
**Bonus:** Full Sentry cluster shipped, #106 RU translation possibly complete, comprehensive QA campaign passed.

### "Cold start" — sanity check at hour 0

Each agent confirms before merging к "launch ready":
1. Curl https://www.lancerwise.com/changelog → no "in progress" mention
2. Curl https://www.lancerwise.com/privacy → "LemonSqueezy" + "Roskomnadzor" present
3. Anon SELECT against invoices/proposal_drafts/testimonials → 0 rows
4. Login + see dashboard → renders correctly RU + EN
5. Create test invoice → portal URL accessible с service_role bypass
6. Cookie banner shows on first visit; analytics не loads until "Accept All"

If all 6 PASS → green-light. If any FAIL → halt.

---

## Critical accepted risks (summarised)

| Risk | Why accepted | Watch signal |
|---|---|---|
| Sentry cluster post-launch | Hardening, не functional gap | Sentry inbox volume + triage speed |
| /clients/[id] latent N+1 | Empty fixture masks; fix recipe known | Sentry `TypeError: Load failed` |
| RU legal text not translated | GDPR Art. 12 mitigation possible | legal@lancerwise.com complaints |
| LANCERWISE-7 polling fragility | Functional impact low | Sentry LW-7 event count |
| /dashboard FCP residual | Steady-state "yellow," not "red" | Sentry alert #435759 |
| #102 subscription_events leak path | 0 risk rows; defensive only | SQL spot-check |

All risks have explicit mitigation + monitoring. None left invisible.

---

## Cross-references

- LAUNCH-READINESS-MASTER.md — full pre-launch state
- POST-LAUNCH-DAY-1-RUNBOOK.md — operational checklist
- POST-LAUNCH-WEEK-1-BACKLOG.md — what к do first week
- [`agent1-prelaunch-gono-go/RISK-ACCEPTANCE.md`](../agent1-prelaunch-gono-go/RISK-ACCEPTANCE.md) — earlier risk doc (this supersedes)
