# Launch Readiness Master — Pre-Launch State

**Author:** [AGENT 1]
**Date:** 2026-05-20 (compiled ~05:55 UTC)
**Scope:** Single-document consolidation of pre-launch readiness across all surfaces. Source: 80+ audit folders в screenshots repo + GitHub issues + vault.
**Method:** Synthesis от existing findings, не new investigation.

---

## Executive summary

**Launch-blocking state: 2 P1 issues remain** (#93 /work/time N+1, #94 /settings N+1). Both have established fix recipes (~10h focused work combined).

**Major P0 closures today (2026-05-20):**
- ✅ #99 invoices RLS leak — closed via PR #103
- ✅ #100 proposal_drafts RLS leak — same PR
- ✅ #101 testimonials structural RLS gap — closed via PR #107
- ✅ #105 Privacy Policy GDPR + LemonSqueezy correction — merged
- ✅ #108 /changelog stale claim — closed via PR #110

**Other resolved this week:**
- ✅ #73 dashboard N+1 (PRs #84+#86 merged 2026-05-19)
- ✅ #74 invoices mobile Safari crash (PR #91 merged 2026-05-19)
- ✅ #96 onboarding flow scenario A confirmed
- ✅ Turnstile bypass (Management API PATCH 2026-05-20)

Critical infrastructure in place: branch protection ON, CI gates working, baseline refreshed, Sentry release tagging wired, LemonSqueezy live.

**ETA к launch:** Per [`agent1-prelaunch-gono-go/ESTIMATE-TO-LAUNCH.md`](../agent1-prelaunch-gono-go/ESTIMATE-TO-LAUNCH.md) — Scenario B (48-72h) achievable.

---

## 1. Security posture

### 1.1 Turnstile / CAPTCHA — ✅ live

| Item | Status | Evidence |
|---|---|---|
| Turnstile widget integrated client-side | ✅ | Already deployed |
| CAPTCHA verification enforced server-side | ✅ | `security_captcha_enabled: true` post-PATCH 2026-05-20 |
| Anon rate limit | ✅ | 15/hr per IP (was 30) |
| Test bypass path documented | ✅ | `admin.generateLink` legitimate, не `signInWithPassword` |

Evidence: [`agent2-turnstile-diagnosis/PHASE-1-DIAGNOSIS.md`](../agent2-turnstile-diagnosis/PHASE-1-DIAGNOSIS.md) + [`agent2-turnstile-fix/EXECUTION-LOG.md`](../agent2-turnstile-fix/EXECUTION-LOG.md).

### 1.2 RLS — 4/4 audited findings resolved

| # | Table | Status | Resolution |
|---|---|---|---|
| #99 | invoices | ✅ resolved | PR #103 dropped `Portal access by token` policy. Portal route uses service_role. Independent 4/4 verification ([`agent1-rls-postfix-verify/`](../agent1-rls-postfix-verify/)). |
| #100 | proposal_drafts | ✅ resolved | Same PR #103 dropped `proposal_drafts_public_review` policy. Same recipe. |
| #101 | testimonials | ✅ resolved | PR #107 consolidated 4 permissive policies → 1 restrictive (`status='approved' AND is_public AND is_approved`) + flipped `is_public` default к FALSE. |
| #102 | subscription_events | ⏳ P2 deferred | `IS NULL OR ...` branch. 0 risk rows currently. Webhook handler uses service_role. Post-launch fix ~10 min. |

Comprehensive 410-table anon pen-test: [`agent1-rls-full-audit/`](../agent1-rls-full-audit/) — 5 tables exposed rows, 3 intentional (starter templates), 2 leaks (now closed).

**Permanent workflow:** anon pen-test now gate для any RLS-touching PR ([[Decisions/2026-05-20-RLS-PEN-TEST-PROTOCOL]]).

### 1.3 Broader security audit — partial

| Surface | Status |
|---|---|
| RLS (410 tables) | ✅ done |
| Auth flow penetration (Turnstile bypass closed) | ✅ done |
| OAuth state storage | ✅ confirmed RLS-locked (deny-by-default) |
| Service-role usage audit | ⚠️ partial (createAdminClient callers not exhaustively reviewed) |
| Secret rotation hygiene | ⏳ db password rotation pending (memory: project_lancerwise_db_password_rotation) |
| Webhook signature verification | ✅ LemonSqueezy webhook checks X-Signature |

---

## 2. CI/CD infrastructure

| Item | Status | Evidence |
|---|---|---|
| Branch protection enabled | ✅ | 3 required gates (eslint-i18n, locale-purity-ru, visual-regression). enforce_admins: false |
| CI auth (R1) fixed | ✅ | `auth.setup.ts` switched к admin magic-link path (bypasses captcha legitimately) |
| Visual baseline refreshed | ✅ | PR #98 merged 2026-05-20 03:23 UTC |
| i18n ratchet baseline | ✅ | 33,741 (bumped +5 via PR #105 с rationale) |
| Locale purity baseline | ✅ | active |
| Vercel deploy hooks | ✅ | auto-deploy on main; Sentry release tagging wired |

3 gates все returned GREEN on PR #105 + #107 + #110 — gating mechanism healthy.

Evidence: [`agent3-ci-fix/`](../agent3-ci-fix/), [`agent3-ci-pipeline-audit/`](../agent3-ci-pipeline-audit/), [`agent3-ratchet-merge-ref-fix/`](../agent3-ratchet-merge-ref-fix/).

---

## 3. Performance

### 3.1 Resolved

| Bug | Page | Was | Now |
|---|---|---|---|
| #73 LANCERWISE-3 | /dashboard | 22 mount-time supabase calls | 0 (PRs #84+#86) |
| #74 LANCERWISE-4 | /invoices/[id] | 10-15 mount fetches + iOS crash | resolved via PR #91, props pattern |

### 3.2 Unresolved (P1 launch blockers)

| Bug | Page | Calls | Est. fix | Owner | Risk if shipped |
|---|---|---|---|---|---|
| #93 | /work/time (re-exports /time-tracker) | 95 (101 widgets, 86 с mount-fetch) | 6-8h | TBD | iOS Safari crash near-certain. Worst N+1 в app. |
| #94 | /settings | 27 (56 widgets, 41 с mount-fetch) | 3-4h | TBD | New-user onboarding path. Bad first impression. |

Both have detailed fix recipes ([`agent1-work-time-investigation/RECOMMENDED-FIX-SCOPE.md`](../agent1-work-time-investigation/RECOMMENDED-FIX-SCOPE.md), [`agent1-n-plus-one-preventive-scan/`](../agent1-n-plus-one-preventive-scan/)). Same pattern as #73/#74 — proven recipe.

### 3.3 Latent (P2 post-launch)

| Bug | Page | Notes |
|---|---|---|
| #95 | /clients/[id] | 37 widgets с mount-fetch pattern. Empty test fixture masks storm currently; real users will trigger. Sentry alert recommended. |
| #90 | /dashboard FCP residual | 7.8s cold / 3.1s warmest. Notifications memoization + RSC cold-start. P2. |
| #104 | LANCERWISE-7 Header /api/notifications polling | Mobile Safari TypeError. Catch+Sentry fix ~30 min OR Context refactor ~2h. P2. |

Pattern doc: [[Patterns/N-PLUS-ONE-MOUNT-FETCH-STORM]] — catalogues 4 incidents, fix recipes, defense-in-depth.

---

## 4. Legal compliance

### 4.1 Privacy / Terms / Cookie

| Item | Status |
|---|---|
| /privacy live (200, 954 words) | ✅ |
| /terms live (200, 892 words) | ✅ |
| /cookie-policy live (200, 792 words) | ✅ |
| Sub-processor disclosure accurate (LemonSqueezy added 2026-05-20) | ✅ PR #105 |
| GDPR Art. 13(2)(d) lodge-complaint statement | ✅ PR #105 |
| "Last updated" reflects current state | ✅ May 20, 2026 |
| Cookie banner consent-gated, opt-in default | ✅ verified zero tracking без consent |
| RU localised content | ⏳ pending (#106, ~4-6h, within 30 days post-launch) |

Investigation: [`agent1-privacy-tos-status/`](../agent1-privacy-tos-status/).

### 4.2 GDPR rights enumerated

Privacy § 7 covers Articles 15, 16, 17 (erasure), 20 (portability), 21 (object), 13(2)(d) (lodge complaint). All paths actionable от Settings → Data & Privacy OR via legal@lancerwise.com.

### 4.3 Cookie consent

- Single category "analytics" — adequate for current GA4-only stack
- Banner shows for ALL visitors (no geo cheating)
- 6-month expiry → re-prompt
- localStorage `cc_consent` с timestamp
- Verified: zero tracking scripts на anon homepage load (curl-confirmed)

---

## 5. Marketing accuracy

### 5.1 Audit findings

12 routes audited ([`agent1-marketing-pages-accuracy/`](../agent1-marketing-pages-accuracy/)):

| Route | Status |
|---|---|
| /, /pricing, /about, /blog, /contact, /faq | ✅ clean |
| /changelog | ✅ resolved via PR #110 (LemonSqueezy claim corrected) |
| /tools/rate-calculator, /demo, /n8n-templates | ✅ clean |
| /privacy, /terms, /cookie-policy | ✅ live + accurate (PR #105) |

### 5.2 Negative findings (good news)

- ✅ No fake social proof ("10K+ freelancers")
- ✅ No false certifications (no unfounded SOC 2, ISO, HIPAA claims)
- ✅ GDPR claims defensible
- ✅ Pricing claims consistent с memory rule #1 ($15/mo Pro)
- ✅ All 12 footer links return 200
- ✅ No stale Stripe-as-SaaS-billing на marketing surfaces

### 5.3 P2 cosmetic (deferred к #109)

- /faq "Stripe integration" wording — clarification to Stripe Connect
- "12 AI tools" claim — verify count
- Full changelog refresh — add 10 days of recent work entries

---

## 6. Observability

### 6.1 Resolved / in place

| Item | Status |
|---|---|
| Sentry release tagging | ✅ auto-wired via Vercel deploy hook |
| Source maps upload | ⏳ PR #97 в flight ("closes #89") |
| PII scrubbing | ⏳ same PR #97 |
| Alert #435759 (dashboard P95 > 3s) | ✅ armed as regression tripwire ([[Decisions/2026-05-19-ALERT-435759-DISPOSITION]]) |

### 6.2 Deferred Sentry cluster (post-launch [AGENT 2/4])

7 issues bundled as cluster:

| # | Item |
|---|---|
| #76 | `Sentry.setUser({id})` for user-tied errors |
| #77 | `Sentry.setTag('locale')` for i18n triage |
| #78 | AI endpoint catch blocks → Sentry (post-Gemini migration) |
| #79 | Resend webhook → Sentry для silent delivery failures |
| #80 | Configure alert rules (new-issue + regression + perf threshold) |
| #81 | Session Replay at 10% sample |
| #82 | Server `console.error` → `Sentry.captureException` |

Plus #87 (resume setUser/setLocale path) и #92 (general Sentry housekeeping).

### 6.3 Custom alerts wishlist (post-launch)

- /work/time P95 > 4s (after #93 fix)
- /settings P95 > 3s (after #94 fix)
- /invoices/[id] iOS TypeError occurrences (after #95 fix)
- LemonSqueezy webhook 5xx (delivery failures)

---

## 7. SEO baseline

### 7.1 Done

| Item | Status |
|---|---|
| Sitemap.xml present | ✅ |
| robots.txt configured | ✅ |
| OG images | ✅ basic |
| Schema.org markup | ⚠️ partial (FAQ JSON-LD on /faq; missing на /blog/[slug], /tools/*, /pricing) |
| GSC submissions | ✅ 10 priority URLs submitted ([`agent3-gsc-phase-2b-completion/`](../agent3-gsc-phase-2b-completion/)) |
| Brave Search audit | ✅ done ([`agent3-seo-discovery-audit/`](../agent3-seo-discovery-audit/)) |
| Marketing pages indexed | partial — Google crawl ongoing, expected 1-2 weeks |

### 7.2 Post-launch SEO backlog

- 8 remaining sitemap URLs (per memory: Ramiz decided SKIP for now, Google natural crawl)
- Schema.org BlogPosting + BreadcrumbList (memory: P3 backlog)
- Per-page OG images (memory: P2 backlog)
- Content marketing strategy (memory: backlog_blog_content_seo_strategy)
- Backlinks outreach plan (memory: backlog_backlinks_outreach_plan)
- Reddit / IndieHackers / Product Hunt launch posts

---

## 8. Pre-launch P0/P1/P2 explicit lists

### 8.1 P0 (zero remaining — all closed today)

✅ #99, #100, #101, #105, #108 — all resolved 2026-05-20.

### 8.2 P1 (2 remaining, both launch blockers)

| # | Item | Owner | Est | Action |
|---|---|---|---|---|
| **#93** | /work/time 95-call N+1 | TBD | 6-8h | Must fix pre-launch (iOS crash risk) |
| **#94** | /settings 27-call N+1 | TBD | 3-4h | Must fix pre-launch (new-user onboarding path) |

Both follow proven [[Patterns/N-PLUS-ONE-MOUNT-FETCH-STORM]] recipe. Can parallelise (different files, no overlap). ~10h focused work combined.

### 8.3 P2 (acceptable post-launch с monitoring)

| # | Item | Mitigation |
|---|---|---|
| #90 | /dashboard FCP residual | Sentry alert #435759 armed |
| #95 | /clients/[id] latent N+1 | Sentry alert on `TypeError: Load failed` |
| #102 | subscription_events `IS NULL` branch | Webhook handler uses service_role; defensive fix only |
| #104 | LANCERWISE-7 Header polling | catch + Sentry capture pattern |
| #106 | RU translation of legal pages | EN-only с mitigation banner |
| #109 | Marketing cosmetic aggregate | Three minor improvements |
| #76-82, #87, #92 | Sentry cluster | All hardening, не blocking |

---

## 9. Documentation status

### 9.1 In place

| Doc | Location |
|---|---|
| Obsidian vault (26 files, 67+ wikilinks) | `~/lancerwise-knowledge/` |
| Pre-launch checklist | [`agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md`](../agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md) |
| QA campaign plan | [[Post-Launch/QA-CAMPAIGN-PLAN]] |
| Operations runbooks (3) | [[Operations/AGENT-WORKTREE-LAYOUT]], [[Operations/VERCEL-DEPLOY-TROUBLESHOOTING]], [[Operations/SUPABASE-MIGRATION-TRACKING-FIX]] |
| RLS pen-test protocol ADR | [[Decisions/2026-05-20-RLS-PEN-TEST-PROTOCOL]] |
| Bug archive (5 entries) | `~/lancerwise-knowledge/Bugs/` |
| LemonSqueezy runbook | [`agent3-lemonsqueezy-runbook/`](../agent3-lemonsqueezy-runbook/) |
| LemonSqueezy currency fix | [`agent3-lemonsqueezy-currency-fix/`](../agent3-lemonsqueezy-currency-fix/) |
| LemonSqueezy E2E test | [`agent3-lemonsqueezy-e2e-test/`](../agent3-lemonsqueezy-e2e-test/) |

### 9.2 Missing / not visible

| Doc | Status |
|---|---|
| [AGENT 4] incident response runbook | ⚠️ orchestrator referenced `audit/agent4-incident-response-runbook/` — folder не visible в screenshots repo as of 05:55 UTC. Awaiting [AGENT 4] push. |
| [AGENT 4] launch observability package | ⚠️ same — `audit/agent4-launch-observability-pkg/` not pushed yet. |
| Privacy/ToS RU translation | ⏳ #106 post-launch P2 |

This master doc + RISK-PROFILE + DAY-1-RUNBOOK + WEEK-1-BACKLOG in this folder partially substitute для (D2) + (D3) until [AGENT 4] artefacts land.

---

## 10. Cross-link index

| Topic | Folder |
|---|---|
| RLS audits | [`agent1-rls-preview-audit/`](../agent1-rls-preview-audit/), [`agent1-rls-full-audit/`](../agent1-rls-full-audit/), [`agent1-rls-postfix-verify/`](../agent1-rls-postfix-verify/) |
| Performance | [`agent1-n-plus-one-preventive-scan/`](../agent1-n-plus-one-preventive-scan/), [`agent1-work-time-investigation/`](../agent1-work-time-investigation/), [`agent3-launch-baselines/`](../agent3-launch-baselines/) |
| Privacy/ToS | [`agent1-privacy-tos-status/`](../agent1-privacy-tos-status/) |
| Marketing | [`agent1-marketing-pages-accuracy/`](../agent1-marketing-pages-accuracy/) |
| Onboarding | [`agent1-onboarding-clarification/`](../agent1-onboarding-clarification/) |
| LemonSqueezy | [`agent3-lemonsqueezy-activation/`](../agent3-lemonsqueezy-activation/), [`agent3-lemonsqueezy-runbook/`](../agent3-lemonsqueezy-runbook/), [`agent3-lemonsqueezy-e2e-test/`](../agent3-lemonsqueezy-e2e-test/) |
| Turnstile | [`agent2-turnstile-diagnosis/`](../agent2-turnstile-diagnosis/), [`agent2-turnstile-fix/`](../agent2-turnstile-fix/) |
| SEO | [`agent3-seo-discovery-audit/`](../agent3-seo-discovery-audit/), [`agent3-seo-indexing-audit/`](../agent3-seo-indexing-audit/), [`agent3-gsc-phase-2b-completion/`](../agent3-gsc-phase-2b-completion/) |
| CI infra | [`agent3-ci-fix/`](../agent3-ci-fix/), [`agent3-ci-pipeline-audit/`](../agent3-ci-pipeline-audit/) |
| QA fixtures | [`agent3-qa-fixtures/`](../agent3-qa-fixtures/) (also see [PR #88](https://github.com/fer-fer-code/lancerwise/pull/88)) |
| Sentry | [`agent3-sentry-cleanup/`](../agent3-sentry-cleanup/) |
| Pre-launch checklist | [`agent1-prelaunch-gono-go/`](../agent1-prelaunch-gono-go/) |

---

## Cross-references

- RISK-PROFILE.md — risks shipped knowingly + monitoring
- POST-LAUNCH-DAY-1-RUNBOOK.md — first 24h operational checklist
- POST-LAUNCH-WEEK-1-BACKLOG.md — synthesized week-1 todos
