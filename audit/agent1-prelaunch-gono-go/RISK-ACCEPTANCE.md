# Risk Acceptance — What's Safe to Ship

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Method:** Honest assessment per item: cost-if-shipped × likelihood × mitigation strength. Triage into "must fix", "ship с monitoring", "ship as-is".

---

## Tier 1 — Must fix before launch (no acceptable risk)

### S3+S4 — invoices + proposal_drafts anon SELECT (#99 + #100)

**Cannot accept.** Active exploit verified. Cross-user data leak. Privacy Policy violation. GDPR risk. Reputational kill для a new SaaS.

**Status:** PR #103 verified PASS 4/4, awaiting merge. **Expected resolution в hours, not days.** Не a real timeline risk.

### S6+I5+I6 — PII scrub в Sentry + source maps

**Cannot accept.** Sentry currently captures errors с user IPs, emails, potentially form values. Privacy Policy claims "we do not share data" — violated если errors hit Sentry с unscrubbed PII.

**Status:** PR #97 в flight ("scrub PII from Sentry events + apply #87 Path F (closes #89)"). Same sprint as #103.

### S5 — testimonials structural leak (#101)

**Cannot accept в long term**, **but can accept short-term** because:
- Currently 0 testimonials в DB
- Leak materialises only on first testimonial insert
- Marketing-driven testimonial collection typically happens 2-4 weeks post-launch (case studies, early users)

**Decision tree:**
- If launching within 24-48h and #101 not ship-ready: **acceptable к defer**, **but** must disable testimonial creation UI temporarily to prevent insert race. ~5 min toggle.
- If launching after 24-48h: **fix #101 first**. 30-min fix.

### B3+B4 — #93 /work/time + #94 /settings N+1 storms

**Cannot accept B3 (#93).** iOS Safari crash near-certain at 101 widgets. Russian launch market = mobile-heavy. First-day support burden will be catastrophic.

**Can accept B4 (#94) с mitigation.** 27 calls is bad but не crash-risk. New-user onboarding hits this но not on critical path к first invoice. Mitigations:
- Sentry alert configured for `/settings` P95 > 5s
- Monitor support tickets для "settings page slow"
- Fix scheduled within 1 week post-launch

But honest cost: shipping #94 unfixed means lower onboarding completion rate. Worth fixing.

---

## Tier 2 — Ship с monitoring (acceptable risk if monitored)

### #102 subscription_events `IS NULL` branch

**Safe к ship as-is**, **but** add monitoring:

| Mitigation | Implementation |
|---|---|
| Webhook handler hardening | Verify code path always passes subscription_id (audit `src/app/api/webhooks/lemonsqueezy/route.ts`) |
| RLS alarm | If any `subscription_events.subscription_id IS NULL` row appears в DB, alert. Cron check or Sentry custom event. |
| Post-launch fix | P2 issue [#102](https://github.com/fer-fer-code/lancerwise/issues/102) tracked. ~10 min fix. |

Risk if accepted: orphan webhook events become anon-readable.
Mitigation strength: medium (relies on code не producing NULL rows, which it currently doesn't).

### #95 /clients/[id] latent N+1

**Safe к ship as-is** because empty test fixture currently masks it. **But:**

| Mitigation | Implementation |
|---|---|
| Sentry alert | Alert on `TypeError: Load failed` for `/clients/[id]*` route specifically |
| Post-launch fix scheduling | First-week post-launch P2 sprint |
| User communication | If crash reports appear, acknowledge + give workaround (open client detail from list, navigate via URL) |

Risk if accepted: same family as #74 mobile crash. Likely after users accumulate ~10+ clients each.
Mitigation strength: medium (relies on Sentry alert wired correctly — depends on #78 not regressing).

### #90 /dashboard FCP residual

**Safe к ship as-is.** Already accepted as P2 per [Decisions/2026-05-19-P1-A-PARTIAL-ACCEPTANCE](../../lancerwise-knowledge/Decisions/2026-05-19-P1-A-PARTIAL-ACCEPTANCE.md).

Mitigation: Sentry alert #435759 stays armed (P95 > 3s). Real users haven't triggered it. Steady-state 3.1s = "Needs Improvement" yellow, not "Poor" red.

### Q5 — /invoices AI modal backdrop click-through

**Safe к ship as-is.** Cosmetic. Esc/X close paths work as fallback. P3 backlog item.

Mitigation: none needed beyond existing fallback close paths.

### Sentry cluster #76, #77, #78, #79, #80, #81, #82, #87, #92

**Safe к ship as-is.** All P2/P3 post-launch hardening. Sentry captures errors с current instrumentation level; just lacks setUser/setLocale tags для filterability.

Mitigation:
- Run без user-tagged errors for week 1 — accept analysis overhead
- File bundle as single [AGENT 2] post-launch cluster (already done as #87 + family)
- Schedule fix sprint 1-2 weeks post-launch

---

## Tier 3 — Ship as-is (no real risk)

### B1 — LANCERWISE-3 / #73 dashboard N+1

**Code-resolved** via #84 + #86. Issue tracker not closed administratively. Acceptable cosmetic backlog. No actual risk.

### Q3 — Auth flow regression

**Verified.** Email confirm + onboarding chain. Turnstile + captcha live. Sign-in/sign-up flows functional.

### Q4 — RLS full audit

**Done.** 410 tables pen-tested. Findings filed and verified.

### D1 — Obsidian vault

**Done.** 24 files, 12k words, 0 broken links. Reference layer, не gating.

---

## Tier 4 — Unknown status, must verify

### B5 — LANCERWISE-7 Header notifications polling

**Need clarification.** No issue # found в open list. Possibly part of #90 (notifications memoization gap). **Action:** ask orchestrator или [AGENT 4] к confirm scope/owner. ~10 min question.

### D2 — Incident response runbook
### D3 — Launch day monitoring checklist

**Need [AGENT 4] confirmation.** Tasked but no folder visible в `audit/`. Possibly:
- Stored elsewhere (memory, GitHub wiki, knowledge vault?)
- Не finished
- Different naming convention

**Action:** ping [AGENT 4] for pointer. If missing, ~2-3h к create (high-value, не launch-blocker if minimum viable Sentry alerts exist).

### D4 — Privacy Policy / ToS legal review

**Need Ramiz sign-off.** Content shipped и translated. Legal review status unclear. **Action:** confirm с Ramiz. If sign-off pending → expedite. If already signed off → mark ✅.

---

## Specific shipping scenarios

### Scenario A — Launch in 24h

**Required:** Tier 1 items closed (#103 merged, #97 merged, #101 fixed, #93 fixed). Estimated tight но feasible (~12-15h focused).
**Acceptable defers:** Tier 2 with monitoring. #94 settings shipped (with FCP-perf compromise on onboarding path).
**Verifications needed:** Tier 4 items resolved before launch trigger.

### Scenario B — Launch в 48-72h (recommended)

**Required:** Tier 1 + #94 fixed + Tier 4 verified.
**Acceptable defers:** All Tier 2 с monitoring.
**Bonus:** QA campaign run, surfaces caught and triaged.

**This is the realistic shipping window.** Aligns с ESTIMATE-TO-LAUNCH.md "realistic" estimate.

### Scenario C — Launch в 1 week+

**Required:** All Tier 1 + Tier 2 fixed.
**Acceptable defers:** Tier 3 (already safe).
**Bonus:** Full QA campaign + Sentry cluster #76-82 partial completion.

This is the "comfortable" shipping window. Lowest post-launch surprise rate.

---

## Recommendation

**Aim для Scenario B** (48-72h). Scenario A is feasible но introduces avoidable risk on #94 path. Scenario C delays unnecessarily.

Critical path: serialise on #93 (single-engineer 6-8h focused), parallelise everything else.

---

## Cross-references

- PRELAUNCH-CHECKLIST.md — item-by-item status
- ESTIMATE-TO-LAUNCH.md — timelines + dependencies
