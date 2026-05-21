# Launch Day Runbook

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Scope:** T-30min → T+24h operational playbook. Companion к [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) (which covers ongoing post-launch operational reference). This doc focuses on the **launch-moment switch** + first 24h tactical operations.

---

## A. Pre-launch final checks (T-30 min)

Run these checks **30 minutes before pulling the public-launch trigger.** All must be green.

### A1. P0 blocker disposition

| # | Blocker | Required state | Verification |
|---|---|---|---|
| Turnstile | S1+S2 closed | ✅ `security_captcha_enabled: true` в Supabase Management API | Curl Supabase Management API OR review `audit/agent2-turnstile-fix/` |
| RLS #99 invoices | Sealed | ✅ PR #103 merged + deployed; anon SELECT returns 0 rows | `curl 'https://<supabase>/rest/v1/invoices?select=id' -H 'apikey: <anon>'` → 0 |
| RLS #100 proposal_drafts | Sealed | ✅ Same PR #103 + verify | Same curl pattern |
| RLS #101 testimonials | Sealed | ✅ PR #107 merged + `is_public` default flipped | Curl + verify schema default |
| #93 N+1 closed | Stage 2 v2 PASS | ✅ PR #129 deployed, [AGENT 3] verdict 3 fetches | `audit/agent3-93-stage-2-v2-verify/VERDICT-STAGE2-V2-v1.md` |
| #94 N+1 closed | PR merged + probe PASS | ⏳ Verify before launch | [AGENT 3] /settings probe verdict file |

### A2. Sentry alerts disposition

- [ ] All P0 alerts armed: `#435759 dashboard P95`, `relation "public.proposals" does not exist` (per #112)
- [ ] PII scrub enabled (PR #97) — confirmed via Sentry config
- [ ] Release tagging works — Vercel auto-wired
- [ ] Sentry inbox `lancerwise` project zero open P0/P1 from last 6h
- [ ] Telegram-bridge alerts subscribed к Sentry rules

### A3. Vercel production deploy state

```bash
# Run:
gh api 'repos/fer-fer-code/lancerwise/deployments?environment=Production&per_page=1' -q '.[0]'
PROD_ID=$(gh api 'repos/fer-fer-code/lancerwise/deployments?environment=Production&per_page=1' -q '.[0].id')
gh api "repos/fer-fer-code/lancerwise/deployments/$PROD_ID/statuses" -q '.[0] | {state,description,created_at}'
```

**PASS:** state = `success`, SHA matches HEAD of `main`, deployed < 6h ago (fresh).

**FAIL:** if state ≠ `success` → halt, investigate (see #120 transient flake history). Do NOT launch on stale failed deploy.

### A4. DNS + SSL + security headers

```bash
# DNS
dig +short www.lancerwise.com  # expect Cloudflare/Vercel IPs

# SSL
curl -sI https://www.lancerwise.com/ | grep -iE "strict-transport-security|content-security-policy|x-frame-options|permissions-policy"
```

**Expected headers (per pre-existing config):**
- `strict-transport-security: max-age=63072000; includeSubDomains; preload`
- `content-security-policy: ...nonce-<UUID>...`
- `permissions-policy: camera=(), microphone=(), geolocation=()`
- `referrer-policy: strict-origin-when-cross-origin`

### A5. Marketing surface verification

```bash
curl -s https://www.lancerwise.com/privacy | grep -oE 'LemonSqueezy|Roskomnadzor|complaint' | sort | uniq -c
# Expect: LemonSqueezy ≥ 6, Roskomnadzor ≥ 2, complaint ≥ 2

curl -s https://www.lancerwise.com/changelog | grep -c "in progress"
# Expect: 0

curl -s -o /dev/null -w "%{http_code}" https://www.lancerwise.com/sitemap.xml
# Expect: 200

curl -s -o /dev/null -w "%{http_code}" https://www.lancerwise.com/robots.txt
# Expect: 200
```

### A6. Test infrastructure state

- [ ] Test user `46b486d7-5fec-47af-a466-3295dc1c3b95` alive (idempotent reuse from [AGENT 3] probe)
- [ ] `scripts/auth-audit-setup.mjs cleanup` regex fixed (#121) OR manual cleanup ready
- [ ] iOS real device available для F7 spot-check post-launch
- [ ] Telegram alert channel armed (notify.py tested within last hour)

**All A1-A6 green → proceed к section B.**

---

## B. Launch moment (T-0)

### B1. Switching flags

Per current production architecture, **there is no separate "private/public" toggle.** Launch = announcing к the public + monitoring traffic spike.

**Verify state at T-0:**
- Vercel deployment is the canonical source of truth — no separate "publish" action
- DNS already pointing к Vercel (always-public after deploy)
- Supabase Auth: `enable_signup: true` (verify via Management API)
- Cloudflare Email Routing: live (verify recent test email)

**No flags к flip** — launch is а communications event, не а technical state-change.

### B2. Communication templates

#### EN — Twitter / X / LinkedIn (use ANNOUNCEMENT-DRAFT.md variants)

Reference: [`audit/agent1-launch-comms/ANNOUNCEMENT-DRAFT.md`](../agent1-launch-comms/ANNOUNCEMENT-DRAFT.md) — pick Variant A (concise) или B (story-driven) per Ramiz preference.

#### RU — same source

Same doc, RU variants section.

#### Telegram founder-channel announcement (internal team)

```
🚀 LancerWise публично запущен.

Live URL: https://www.lancerwise.com
Production HEAD: <COMMIT_SHA>
Sentry releasе: <auto-tagged release name>
Launch time: <T-0 timestamp UTC>

Watch:
- Sentry inbox: https://sentry.io/organizations/lancerwise/issues/
- Vercel deploys: https://vercel.com/.../deployments
- LemonSqueezy: https://app.lemonsqueezy.com

[AGENT 3] running smoke protocol live на production now.
[AGENT 4] watching Sentry + Vercel logs.

Surface к me если any P0/P1 signal fires.
```

### B3. Initial T+15 min monitoring window

Continuous live tail для 15 minutes:

1. **Sentry inbox** — refresh every 60s, scan для:
   - New unique errors (especially auth surface)
   - Volume spike on existing errors
   - Performance transactions > 5s p95
2. **Vercel real-time logs** — tail для 5xx
3. **`/api/*` 5xx rate** — Vercel Analytics dashboard, watch overlay
4. **`/auth/*` errors** — Supabase Auth logs

**Tooling:** open 4 browser tabs (Sentry / Vercel / Vercel Analytics / Supabase Dashboard) + one terminal running `python3 notify.py "test"` к verify Telegram channel.

**Escalate immediately if:**
- 5xx rate > 1% sustained for 60s → halt sign-ups
- Any P0 Sentry alert fires (e.g. `relation "public.proposals" does not exist` — though improbable until cron fires May 28)
- LemonSqueezy webhook 5xx for any incoming event
- Auth-surface error > 10× normal background rate

---

## C. First 1 hour (T+0 to T+1h)

### C1. Smoke testing rerun on production

Execute relevant subset of [`SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md) **against production** (not staging):

| Flow | Priority | Owner |
|---|---|---|
| F1 Sign-up + Turnstile | **CRITICAL** | [AGENT 3] |
| F2 Email verify → /onboarding | **CRITICAL** | [AGENT 3] |
| F3 Sign-in | CRITICAL | [AGENT 3] |
| F6 Dashboard widgets load | CRITICAL | [AGENT 3] |
| F7 /work/time renders | CRITICAL | [AGENT 3] |
| F8 /settings renders | CRITICAL | [AGENT 3] |
| F9 Email send test | CRITICAL | [AGENT 4] |
| F10 LemonSqueezy redirect | high | Ramiz |
| F11 Password reset | high | [AGENT 3] |

**Use fresh smoke test user** (NOT the long-lived probe fixture) к exercise real first-time flows. Cleanup post-smoke.

**Aggregate target: ~2-2.5h wall-clock с 3-agent parallelism** (per smoke protocol estimate).

### C2. First real-user observation

Real users start arriving via Twitter / Reddit / Product Hunt / direct.

Watch:
- `auth.users` row count growth (Supabase Dashboard)
- /api/auth/signup success vs error rate (Sentry transactions)
- Onboarding completion rate (`profiles.full_name` filled count)
- First invoice creation (canary signal for happy path)

### C3. LemonSqueezy webhook validation

Когда first payment event arrives:
- LemonSqueezy dashboard shows successful checkout
- `subscription_events` table has matching row
- `profiles.plan` updates к 'pro' для that user
- Welcome-к-Pro email sent (если configured)

**If first webhook fails:** investigate signature secret в Vercel env immediately. Manual `profiles.plan` update for affected user с Ramiz approval (per POST-LAUNCH-DAY-1-RUNBOOK triage path).

---

## D. First 24 hours

### D1. Sentry watch protocol

**Watch cadence:**
- T+0 к T+1h: continuous (live tail)
- T+1h к T+6h: every 30 min
- T+6h к T+24h: every 2h

**Alert thresholds:**

| Signal | Threshold | Action |
|---|---|---|
| New unique error | 1× | Triage, categorize P0/P1/P2/P3 |
| Same error fires 10+ times в 30 min | trigger | Investigate, consider hotfix |
| 5xx rate | > 0.5% sustained 30 min | Investigate root |
| P95 transaction latency | > 3500 ms (hard trip-wire per #131) | Escalate |
| Auth-surface error volume | > 5× background | Halt sign-ups, investigate |
| LemonSqueezy webhook 5xx | 1× | Immediate investigation |

### D2. p95 24h re-check (#131)

**Trigger:** T+24h.

Per [#131](https://github.com/fer-fer-code/lancerwise/issues/131) — [AGENT 4] runs watch protocol с full-traffic sample (target ≥ 5000 tx), compares p95 distribution к pre-#129 baseline (2363 ms).

Outcome decision (per #131 criteria):
- p95 ≤ 2400 ms → close #131 as sampling artifact
- p95 2500-2700 ms → file P2 follow-up
- p95 > 2800 ms → P1 escalation, investigate slowest slice
- p95 > 3500 ms → emergency rollback consideration

### D3. Error rate baseline

Set **T+24h** baseline для:
- New unique errors per hour
- Total events per hour
- Auth-surface error rate
- 5xx rate by route

Save baseline к `audit/agent4-day-1-error-baseline.md` (if [AGENT 4] hasn't already). This becomes the reference для week-1 comparisons.

### D4. Email delivery monitoring

**Resend dashboard sample-check at T+1h, T+6h, T+24h:**
- Delivery rate > 95%
- Bounce rate < 2%
- Complaint rate < 0.1%

If mail-tester score drops от 10/10 (per `project_lancerwise_email_infrastructure`) → investigate DKIM/SPF alignment.

---

## E. Rollback procedure

**Use sparingly.** Rollback creates user confusion if executed mid-day с active sessions. Prefer hotfix (small PR + redeploy) когда feasible per POST-LAUNCH-DAY-1-RUNBOOK.

### E1. When к rollback (decision tree)

```
P0 incident observed
        ↓
Can hotfix ship в <60 min? (small surface, clear root)
        ├─ YES → hotfix path (POST-LAUNCH-DAY-1-RUNBOOK § hotfix workflow)
        └─ NO →
                ↓
        Is rollback target known-good? (prior deploy clean)
                ├─ YES → ROLLBACK
                └─ NO → emergency hotfix anyway (no good alternative)
```

### E2. Vercel rollback (instant via dashboard)

**Steps:**
1. Vercel dashboard → project → Deployments tab
2. Find last known-good production deploy (е.g. pre-#94 deploy)
3. Click "..." → "Promote к Production"
4. Confirm
5. **DNS instant** — propagation < 60s globally via Cloudflare edge
6. Verify: `curl -s https://www.lancerwise.com/ | grep -c "lancerwise"` → 200 OK

**Vercel guarantees:** instant rollback for already-built deploys. No re-build needed.

### E3. DNS rollback (if Vercel itself is degraded)

If Vercel Vercel infrastructure (rare):

1. Cloudflare dashboard → DNS → www.lancerwise.com A record
2. Change к maintenance page IP (configured beforehand if applicable) OR point к Cloudflare Worker emitting static "We're updating" message
3. TTL 60s — propagation fast

### E4. Database state — do NOT roll back

**Critical invariant:** never rollback Supabase data:
- User signups during the launch window are real users
- Created invoices, clients, projects are real data
- LemonSqueezy subscriptions are real billings

Only roll back **code**, never **data**. If code changes require schema changes, write **forward-fix** migrations, не reverts.

### E5. Communication template if rollback executed

#### Twitter / X — RU+EN

EN:
```
We hit an unexpected issue during launch — temporarily reverting к а prior version while we investigate. All sign-ups + data safe. Will update в next hour.
— @lancerwise
```

RU:
```
Возникла непредвиденная проблема при запуске — временно откатываем к предыдущей версии для исследования. Все регистрации и данные в безопасности. Обновим в течение часа.
— @lancerwise
```

#### Telegram founder-channel

```
🔴 ROLLBACK executed at <timestamp UTC>.

Reason: <P0 incident description>
Rollback target: <prior deploy SHA>
Verification: <smoke check status>

Estimated fix-forward time: <ETA>
Next update: <hour>

User data unaffected. Sign-up flow now serves <prior version>.
```

---

## F. Escalation paths

### P0 incident (immediate response)

**Triggers:**
- Data leak (cross-tenant visibility)
- Payment broken (LemonSqueezy webhook silent OR purchases failing)
- Auth dead (sign-up или sign-in broken)
- 5xx rate > 5% sustained 60s
- iOS real-device crash on key route

**Response:**
1. Telegram alert к Ramiz immediately
2. Pause new-user comms (don't drive more traffic к broken state)
3. Decide: hotfix (~60 min) vs rollback (instant)
4. Execute decision
5. Post-incident write-up: `audit/incidents/<date>-<slug>.md`

### P1 incident (1-2h response)

**Triggers:**
- Single feature broken но workaround exists
- 5xx rate 1-5%
- One subroute returns 404 (cosmetic in production)
- Email send delayed > 5 min для known route

**Response:**
1. Telegram notify Ramiz + relevant agent
2. Open hotfix PR в parallel с user notification ("known issue, working on it")
3. Ship hotfix в standard merge flow (no admin override)

### P2 cosmetic

**Triggers:**
- Title metadata leak (existing)
- Single widget render issue with fallback
- Mobile padding tweaks

**Response:**
1. File P2 issue
2. Backlog для post-launch week 1

---

## G. Post-launch backlog already staged

These items are filed AND scoped — pickup post-launch без needing fresh investigation.

| Issue / memo | Title | Priority |
|---|---|---|
| [#104](https://github.com/fer-fer-code/lancerwise/issues/104) | LANCERWISE-7 Header polling fragility | P2 |
| [#106](https://github.com/fer-fer-code/lancerwise/issues/106) | RU translation /privacy + /terms + /cookie-policy | P2 (GDPR Art 12, 30-day) |
| [#112](https://github.com/fer-fer-code/lancerwise/issues/112) | public.proposals migration drift (18 backend refs) | P2 |
| [#113](https://github.com/fer-fer-code/lancerwise/issues/113) | /changelog stale text (closed by #117 cascade) | P3 |
| [#118](https://github.com/fer-fer-code/lancerwise/issues/118) | Supabase email templates redirect_to PKCE migration | P3 |
| [#120](https://github.com/fer-fer-code/lancerwise/issues/120) | runAfterProductionCompile transient flake monitoring | P3 |
| [#121](https://github.com/fer-fer-code/lancerwise/issues/121) | scripts/auth-audit-setup.mjs cleanup regex | P3 |
| [#130](https://github.com/fer-fer-code/lancerwise/issues/130) | Residual /work/time fetches (2 widget polish) | P3 |
| [#131](https://github.com/fer-fer-code/lancerwise/issues/131) | Stage 2 v2 /work/time p95 24h re-check | P3 |

**Memory rules referenced:**
- `feedback_marketing_honesty_policy` — no fake metrics post-launch
- `backlog_blog_content_seo_strategy` — content marketing plan
- `backlog_backlinks_outreach_plan` — outreach plan
- `project_lancerwise_supabase_auth_emails` — auth email branding
- `project_lancerwise_db_password_rotation` — month-1 hardening
- `project_lancerwise_migration_tracking_gap` — schema_migrations gap (informs #112)

---

## Hand-off back к POST-LAUNCH-DAY-1-RUNBOOK

After T+24h:

- This runbook's role complete (launch-moment specific)
- Day-2+ operations governed by [`POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) (ongoing reference)
- Week-1 plan: [`POST-LAUNCH-WEEK-1-BACKLOG.md`](../agent1-launch-readiness-master/POST-LAUNCH-WEEK-1-BACKLOG.md)
- Engagement cadence: [`POST-LAUNCH-WEEK-1-COMMS.md`](../agent1-launch-comms/POST-LAUNCH-WEEK-1-COMMS.md)

---

## Cross-references

- [`audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md) — smoke test plan
- [`audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) — ongoing operational reference
- [`audit/agent1-launch-readiness-master/RISK-PROFILE.md`](../agent1-launch-readiness-master/RISK-PROFILE.md) — tier-1/2/3 risks accepted
- [`audit/agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md`](../agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md) — go/no-go criteria
- [`audit/agent1-launch-comms/`](../agent1-launch-comms/) — comms drafts (announcement, email, week-1 plan)
