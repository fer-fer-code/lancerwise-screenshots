# LancerWise Launch Day Operational Runbook

**Author:** [AGENT 1]
**Date:** 2026-05-23
**Trigger:** Use this document at T-30 min before launch + first 24h post-launch
**Scope:** Operational incident response — NOT product strategy. Use POST-LAUNCH-DAY-1-RUNBOOK.md (parallel doc) for ongoing ops.

---

## TL;DR — Critical-path decision tree

```
T-30 min  → run §1 PRE-LAUNCH CHECKLIST (all green = proceed)
T+0       → run §2 LAUNCH SEQUENCE (tweet → reddit → email)
T+0→24h   → run §3 MONITORING LOOP (hourly Sentry/Telegram triage)
ANY incident → §4 INCIDENT PLAYBOOKS by severity P0/P1/P2/P3
ANY escalation → §6 ESCALATION (Ramiz Telegram primary)
```

If a P0 (production down) fires — **stop reading and execute §4 P0 rollback immediately.** Communication can wait 60 seconds.

---

## §1 — PRE-LAUNCH CHECKLIST (T-30 min)

Walk this checklist top-to-bottom. **All must be ✅ before triggering §2 LAUNCH SEQUENCE.**

### Infrastructure readiness

| # | Item | How к verify | Owner |
|---|---|---|---|
| 1.1 | Vercel production deploy READY (green) на current `main` HEAD | `vercel inspect <production-url>` OR Vercel Dashboard → Deployments → top entry shows ✓ Ready | [AGENT 2] |
| 1.2 | Production smoke quick re-check (5 routes) | curl 200 on /, /pricing, /faq, /login, /register | [AGENT 4] |
| 1.3 | Production smoke authed quick re-check | Sign in fixture user → /dashboard renders с no error boundary | [AGENT 3] |
| 1.4 | Middleware cookie defense holds | curl с `base64-INVALIDCOOKIESTRING` cookie returns 307→/login (NOT 500) — F12 single probe | [AGENT 4] |
| 1.5 | Database connection pool stable | Supabase Dashboard → Reports → DB connections < 50% threshold | [AGENT 2] |
| 1.6 | Vercel build memory baseline OK | Recent 5 builds completed без OOM (Path F invariant holds) | [AGENT 2] |

### Observability armed

| # | Item | How к verify | Owner |
|---|---|---|---|
| 1.7 | Sentry alerts armed for production | Sentry Dashboard → Alerts → confirm 3 alert rules active: (a) errors > 10/hr, (b) `MIDDLEWARE_INVOCATION_FAILED`, (c) PII scrub failure | [AGENT 4] |
| 1.8 | Sentry source-maps uploaded для current deploy | Sentry → Releases → top entry shows commit SHA + source-maps badge | [AGENT 4] |
| 1.9 | Telegram notify working | Run: `python3 /Users/myoffice/instagram-agent/notify.py "T-30 launch readiness check"` — expect `✅ Отправлено` | [AGENT 1] |
| 1.10 | Vercel deploy hook → Sentry release tagging working | Sentry → Releases → most recent < 10 min old AND matches latest deploy SHA | [AGENT 4] |

### Comms readiness

| # | Item | How к verify | Owner |
|---|---|---|---|
| 1.11 | Tweet hero post drafted + reviewed | Saved в Twitter Draft OR `audit/agent1-launch-comms-drafts/TWEETS.md` | Ramiz |
| 1.12 | Tweet thread (3 follow-ups) drafted | Same | Ramiz |
| 1.13 | Reddit post r/freelance drafted (text + headline) | Saved draft в Reddit OR comms folder | Ramiz |
| 1.14 | Email blast template ready (если list exists) | Resend campaign OR mailto template review | Ramiz |
| 1.15 | ProductHunt Tuesday-launch scheduled | PH dashboard → Schedule for Tuesday confirms | Ramiz |
| 1.16 | Status-page (если есть) shows "All Systems Operational" | <https://status.lancerwise.com> OR Twitter pinned "Status: ✅" tweet | Ramiz |

### Pre-flight verification

| # | Item | How к verify | Owner |
|---|---|---|---|
| 1.17 | F12-F20 final retest ≥ PASS-with-caveats | `audit/agent1-pre-launch-smoke/SMOKE-RESULTS-2026-05-23.md` verdict checked | [AGENT 1] |
| 1.18 | No open `launch-blocker` labeled issues | `gh issue list --label launch-blocker --state open` returns 0 rows | [AGENT 1] |
| 1.19 | Branch protection enabled на main | GitHub Settings → Branches → main → 3 required gates intact | [AGENT 2] |

**🚨 STOP CONDITIONS:**
- Any 1.1-1.10 fails → **DO NOT LAUNCH**, hotfix first
- 1.17 only at PASS-with-caveats → may launch если caveats are documented + acceptable
- 1.11-1.16 (comms) not ready → **delay launch ~30 min**, не a technical blocker
- 1.18 open launch-blockers → escalate к Ramiz, decide explicitly

---

## §2 — LAUNCH SEQUENCE (T+0)

Execute в this exact order. Document each timestamp в `T0-LOG.md` (template at bottom of this section).

### Step 2A — Hero Tweet (T+0)

**Action:** Post hero tweet to @lancerwise (если claimed) OR Ramiz personal с product link.

**Template (placeholder, refine pre-launch):**
> 🚀 LancerWise is live.
>
> The all-in-one CRM hub for freelancers — invoicing, AI contracts, time tracking, client management. Free forever tier, no credit card.
>
> Built for the 95% of solo freelancers who don't need 6 separate tools.
>
> Try it → www.lancerwise.com

**Document:** timestamp T+0:00, tweet URL.

### Step 2B — Tweet thread (T+5, T+10, T+15) staggered

3 follow-up tweets at ~5 min intervals — let algorithm digest hero tweet before thread fires.

**T+5 tweet (problem framing):**
> Why I built this: I was juggling HoneyBook ($39/mo) + Toggl ($10) + DocuSign ($25) + а messy Notion. $74/mo total + 4 apps + 3 logins. None talked к each other.

**T+10 tweet (product proof):**
> LancerWise: 1 login. 1 dashboard. AI-generated contracts с risk analysis. Invoices с payment reminders. Time tracker that becomes invoice line items. All free up к 2 clients, $15/mo unlimited.

**T+15 tweet (CTA):**
> Beta-testing с 47 freelancers for 6 months before this launch. Real feedback shaped 12+ AI features that nobody else has.
>
> Free signup — no card, no trial countdown. www.lancerwise.com

**Document:** 3 timestamps + 3 tweet URLs.

### Step 2C — Reddit post r/freelance (T+10, parallel)

**⚠️ Risk acknowledged:** zero karma may auto-mod к pending OR shadowban.

**Title (placeholder):**
> Shipped my freelance CRM after 6 months. Free forever tier, no card — feedback wanted

**Body:** product description с screenshot links к homepage hero image + features grid. Avoid heavy "promo" language. Frame as "wants honest feedback от fellow freelancers."

**Pre-emptive moves:**
- Posting от account >30d old with some prior subreddit activity wins moderation
- Cross-post к r/SaaS + r/IndieHackers as backup if r/freelance shadowbans
- Reply к first 3 comments within 15 min к signal active participation

**Document:** timestamp + Reddit URL + status (live / pending mod / removed).

### Step 2D — Email blast (T+15, если list exists)

**Action:** Send via Resend transactional campaign.

**Setup precondition:** verify Resend dashboard → Audience list exists + ≥1 recipient before triggering.

**Template:**
> Subject: It's live — LancerWise is shipping
>
> [Body: brief intro + 3 key features + link к homepage]
>
> [Unsubscribe via standard footer per email infrastructure]

**Document:** timestamp + Resend campaign ID + delivery count.

### Step 2E — Personal social network ping (T+20, optional)

Telegram personal channel, LinkedIn personal post, WhatsApp business contacts — if Ramiz has these armed.

### T0-LOG.md template

After each step, record в `audit/agent1-launch-runbook-2026-05-23/T0-LOG.md`:

```markdown
# T+0 Launch Log — 2026-05-XX

| T+ | Action | Status | URL / Evidence |
|---|---|---|---|
| 0:00 | Hero tweet posted | ✅ | https://x.com/.../... |
| 0:05 | Thread T+5 problem framing | ✅ | https://x.com/.../... |
| 0:10 | Thread T+10 product proof | ✅ | https://x.com/.../... |
| 0:10 | Reddit r/freelance post | ⚠️ pending mod | https://reddit.com/.../... |
| 0:15 | Thread T+15 CTA | ✅ | https://x.com/.../... |
| 0:15 | Email blast | ✅ | Resend campaign rs_XXXX, delivered к 47 |
| 0:20 | LinkedIn personal post | ✅ | https://linkedin.com/.../... |
```

---

## §3 — T+1h к T+24h MONITORING

### Hourly cadence (T+1h, T+2h, T+3h, ...)

**Owner:** [AGENT 4] continuous Sentry watch + [AGENT 1] coordination + Ramiz personal eye-on-metrics.

**Each hour-tick:**

1. **Sentry triage** (60-90 sec)
   - Sentry Dashboard → Issues → filter "Last 60 min"
   - Triage new issue events:
     - Severity high + frequency > 5/min → **P0 escalate immediately**, see §4
     - Severity high + frequency 1-5/min → **P1 hotfix queue**, see §4
     - Severity low + frequency < 1/min → file backlog, monitor
   - Look для regression-of-fix patterns: `MIDDLEWARE_INVOCATION_FAILED`, `TypeError: Cannot read property … of null` (NaN fixes), `Invalid UTF-8 sequence` (Upstash LW-B)

2. **Production curl health check** (15 sec)
   ```bash
   curl -o /dev/null -s -w "%{http_code}\n" https://www.lancerwise.com/
   curl -o /dev/null -s -w "%{http_code}\n" https://www.lancerwise.com/api/health  # if exists
   ```
   Both should return 200. Anything 5xx → P0 escalate.

3. **Vercel deploy status check**
   - Vercel Dashboard → current production deploy still "READY" (NOT "BUILDING" or "ERROR")
   - No mid-day auto-rollback fired

4. **Database connection pool**
   - Supabase Dashboard → Reports → connections still < 50%
   - Slow query log → no queries > 5s

5. **Telegram alert review**
   - Check `notify.py`-fired alerts since last tick
   - Any actionable → triage per §4

### Continuous watch signals (file/respond immediately if seen)

| Signal | Severity | Action |
|---|---|---|
| Sentry new issue: `MIDDLEWARE_INVOCATION_FAILED` | P0 | Cookie crash regression. Rollback PR #147 fix verification. |
| Sentry: `/api/*` returning 5xx > 5/min | P0 | Service degradation. Check Supabase + Vercel logs. |
| Sentry: `LemonSqueezy webhook signature mismatch` | P0 | Payment webhook broken — no plan upgrades happening. |
| Sentry: `auth.getUser` error rate spike | P1 | Auth degraded. Check Supabase status + middleware regression. |
| Vercel build queue stuck > 5 min | P1 | Investigate build memory / runner availability. |
| Twitter / Reddit reports broken page | P1 | Cross-reference Sentry + reproduce locally. Treat as priority signal. |
| LemonSqueezy checkout 4xx > 10/min | P1 | LS-side issue OR our pricing-id misconfig. Check LS Dashboard. |
| New `MIDDLEWARE_INVOCATION_FAILED` not in our known list | P1 | Investigate stack — could be Path F regression. |
| New `Invalid UTF-8 sequence` Upstash | P2 | LW-B class — defensive wrap shipped via PR #185 should handle. Verify fail-open path. |
| Slow `/api/*` (p95 > 5s) | P2 | Profile + investigate. Not blocking. |

### Triage SLA

| Severity | Telegram alert → triage | Triage → fix-or-defer decision | Fix-decision → user-visible mitigation |
|---|---|---|---|
| P0 | < 5 min | < 15 min | < 60 min (incl. rollback OR hotfix deploy) |
| P1 | < 30 min | < 2 h | < 12 h |
| P2 | < 4 h | < 24 h | next-business-day |
| P3 | next ad-hoc cycle | next sprint | not committed |

---

## §4 — INCIDENT RESPONSE PLAYBOOKS

### 🚨 P0 — Production down OR critical security regression

**Symptoms:**
- HTTPS production returns 5xx > 50% of requests
- Auth completely broken (no user can sign in OR signup)
- Database read/write broken
- LemonSqueezy webhook completely broken (no payments processing)
- Cross-tenant data leak detected
- Bare Vercel error page visible к real users (`MIDDLEWARE_INVOCATION_FAILED`)

**Playbook P0.1 — Rollback к previous READY deploy** (preferred — fastest recovery)

```bash
# Step 1: identify previous READY deploy
vercel ls --scope fer-fer-codes-projects
# Look for SECOND-MOST-RECENT "Ready" entry

# Step 2: promote previous deploy к production
vercel promote <previous-deploy-id-or-url>
# OR via Dashboard: Deployments → previous green entry → "..." → "Promote to Production"

# Step 3: verify rollback live
curl -s -o /dev/null -w "%{http_code}\n" https://www.lancerwise.com/
# Expected: 200

# Step 4: confirm via Sentry — new errors should stop
# Open Sentry Dashboard → Issues → filter "Last 5 min" → expect drop-off
```

**Estimated time:** 90 seconds к 3 min total.

**Playbook P0.2 — If rollback fails OR is impossible**

- Trigger Vercel maintenance mode (если configured)
- Update DNS к а static "Sorry, we're down" page (Cloudflare → DNS → page-rule maintenance redirect)
- Escalate к Ramiz immediately via Telegram + WhatsApp

**Communication template (P0 incident tweet):**

> ⚠️ We're investigating an issue affecting some users. Working on a fix — will update в the next 30 minutes. Thanks для your patience.

Post within 5 min of confirmed P0. Update every 30 min until resolved.

**Status page:** update к "Investigating" → "Identified" → "Monitoring" → "Resolved" по [statuspage.io](https://www.statuspage.io/) lifecycle.

**Post-incident:** within 24h, draft public RCA если incident affected > 5 users OR was visible через social channels.

### P1 — Broken core feature (signup/payment/dashboard)

**Symptoms:**
- Signup form returns 500 для some browsers
- Sign-in works но redirects к wrong route
- /dashboard widgets show error boundary (NOT full crash, just degraded)
- /upgrade CTA broken (clicks через LS checkout fail)
- Email send broken for one channel (invoices не sent, notifications fine)

**Playbook P1.1 — Hotfix workflow**

```bash
# Step 1: branch от main
git checkout main && git pull origin main
git checkout -b hotfix/p1-<issue-shortdesc>

# Step 2: minimal fix — single-purpose commit
# DO NOT bundle unrelated changes. P1 hotfixes are 1-5 line surgical changes.

# Step 3: fast-track CI
git push -u origin hotfix/p1-<issue-shortdesc>
gh pr create --title "[hotfix] P1 <description>" --body "<incident-link>"
# Watch CI — should be ~5-7 min к all 4 gates green

# Step 4: merge after CI green
gh pr merge --squash --delete-branch

# Step 5: verify production deploy READY (~3-5 min Vercel build)
vercel inspect <new-prod-deploy-url>

# Step 6: re-test affected flow live
# Step 7: tweet thank-you-for-patience + brief fix description
```

**Estimated time:** 30 min к 2h depending on fix complexity.

**Communication:**
- Reply к affected users individually на Twitter/email — acknowledge + thank
- DO NOT make а public broadcast announcement unless >10 users affected (over-announcing erodes trust)
- Update status page если broadcasted earlier

### P2 — Broken secondary feature

**Symptoms:**
- One settings sub-route 404s
- Cosmetic visual bug (modal backdrop opacity wrong) — already shipped, just noticed
- /work/time tab URL не syncs (per existing #165)
- Locale leak в email body

**Playbook P2:** file к backlog. Defer fix к next-business-day OR appropriate sprint.

```bash
gh issue create \
  --title "[P2 post-launch hotfix] <description>" \
  --label "P2,post-launch,bug" \
  --body "..."
```

**User-facing workaround:**
- Если user reports affected feature, reply с workaround (e.g., "for now, try direct URL `/work/time?tab=analytics` — we're fixing the tab sync issue в next release").
- DO NOT promise specific ETA unless you've actually committed К it.

### P3 — Cosmetic / polish

**Symptoms:**
- Typo в copy
- Subtle styling inconsistency
- Hardcoded date format
- Small Russian translation gap

**Playbook P3:** silent file к backlog. Triage at next planning cycle. No user-facing communication unless someone specifically asks.

---

## §5 — KEY URLS

| Resource | URL |
|---|---|
| **Production** | <https://www.lancerwise.com> |
| **Sentry** | <https://lancerwise.sentry.io/projects/lancerwise/> (или per workspace URL) |
| **Vercel Dashboard** | <https://vercel.com/fer-fer-codes-projects/lancerwise> |
| **Supabase Dashboard** | <https://supabase.com/dashboard/project/skfgwyzarrhhkzvltbgm> |
| **LemonSqueezy Dashboard** | <https://app.lemonsqueezy.com/> (Ramiz fill specific store path) |
| **Twitter @lancerwise** | <https://x.com/lancerwise> (unclaimed as of 2026-05-23 per PR #193 — confirm pre-launch) |
| **ProductHunt page** | TBD (Ramiz fill после Tuesday launch URL generated) |
| **GitHub repo (code)** | <https://github.com/fer-fer-code/lancerwise> |
| **GitHub repo (screenshots/audits)** | <https://github.com/fer-fer-code/lancerwise-screenshots> |
| **Cloudflare DNS / Email** | <https://dash.cloudflare.com/> (Ramiz account) |
| **Resend (email)** | <https://resend.com/> |
| **Upstash (Redis ratelimit)** | <https://console.upstash.com/> |

---

## §6 — CONTACT / ESCALATION

### Primary channel: Telegram

- **Ramiz Telegram:** primary 24h escalation channel
- **`notify.py` automated alerts:** wired к same Telegram thread per memory `feedback_nonstop_work` + project setup
- **Trigger command:**
  ```bash
  python3 /Users/myoffice/instagram-agent/notify.py "<message>"
  ```

### Backup channels (if Telegram down)

- **Ramiz personal email:** `krokusstudia2@gmail.com` (verified per user profile memory)
- **Backup channels:** WhatsApp (Ramiz personal) — only for true P0 incidents

### Agent ownership map для escalation routing

| Domain | Primary agent | Secondary |
|---|---|---|
| Frontend code regression | [AGENT 2] | [AGENT 6] |
| Sentry / observability | [AGENT 4] | [AGENT 1] |
| Visual / UX regression | [AGENT 1] | [AGENT 3] |
| Probe / repro / verify | [AGENT 3] | [AGENT 4] |
| Comms / external incident response | Ramiz | — |
| Vercel / deploy infra | [AGENT 2] | [AGENT 4] |
| Supabase / DB / RLS | [AGENT 2] | [AGENT 1] |

### Escalation flow

1. **Sentry alert fires** → Telegram via `notify.py` (auto-wired) OR manually triggered
2. **First agent к triage** (≤5 min P0 / ≤30 min P1) — within agent's domain
3. **Если cross-domain** → escalate к secondary OR loop в Ramiz для cross-team coordination
4. **Если ambiguous** → Ramiz decides ownership

---

## §7 — POST-LAUNCH METRICS DASHBOARD

Track these signals across T+0 → T+24h. Pull manually each 4h.

### Acquisition signals

| Metric | Source | T+1h | T+6h | T+12h | T+24h | Target |
|---|---|---|---|---|---|---|
| Total signups | Supabase Dashboard → Authentication → Users count | — | — | — | — | ≥50 |
| Email confirmations completed | Supabase Auth → Users → email_confirmed_at > T+0 | — | — | — | — | ≥80% of signups |
| First-touch source breakdown | TBD analytics OR referrer headers | — | — | — | — | informational |

### Activation signals

| Metric | Source | Target T+24h |
|---|---|---|
| Onboarding completed (Step 5/5) | DB query `user.onboarding_completed_at IS NOT NULL` | ≥40% of signups |
| First client created | `clients` table COUNT WHERE created_at > T+0 | ≥30% of signups |
| First invoice created | `invoices` table COUNT WHERE created_at > T+0 | ≥15% of signups |
| First proposal / contract / project | similar per-table queries | informational |
| Time tracker started | `time_entries` table COUNT | ≥10% of signups |

### Revenue signals

| Metric | Source | Target T+24h |
|---|---|---|
| First LemonSqueezy purchase | LS Dashboard → Sales | ≥1 paid signup (any tier) |
| Trial → Pro conversions | `subscription_events` table | informational |
| MRR delta | LS Dashboard → MRR | informational |

### Engagement signals

| Metric | Source | Target |
|---|---|---|
| Twitter impressions on hero tweet | Twitter Analytics | ≥10K (organic) |
| Twitter engagement rate | Same | ≥3% |
| Reddit post upvotes | Reddit post | ≥20 (если не shadowbanned) |
| Reddit comments | Reddit post | ≥5 |
| ProductHunt upvotes (Tuesday) | PH page | top-10 of day = ≥150 |
| Direct organic traffic | Vercel Analytics OR Plausible | ≥500 unique visitors T+24h |

### Health signals

| Metric | Source | Target |
|---|---|---|
| Sentry errors / hour | Sentry Dashboard | < 10/hour sustained |
| Production p95 latency | Vercel Analytics → Web Vitals | < 3000 ms |
| 5xx rate | Vercel Analytics → Edge Network | < 0.5% |
| Vercel deploy stability | Vercel Dashboard → Deployments | 0 mid-day failed deploys |

### Tracking format

Daily snapshot saved к `audit/agent1-launch-runbook-2026-05-23/METRICS-T<HOURS>.md`:

```markdown
# Metrics T+24h — 2026-05-XX

| Bucket | Metric | Value | Target | Verdict |
|---|---|---|---|---|
| Acquisition | Total signups | 87 | ≥50 | ✅ |
| ... | ... | ... | ... | ... |
```

---

## §8 — KNOWN ISSUES (transparent с users если asked)

These are documented + tracked. Если а user reports one of these — acknowledge + cite issue # + give workaround OR ETA.

### P2 post-launch backlog

| Issue | Title | User-facing impact | Workaround / Mitigation |
|---|---|---|---|
| [#194](https://github.com/fer-fer-code/lancerwise/issues/194) | i18n bleed-through на 4 authed routes | RU users see ~30% EN strings в table headers / status badges на /clients, /invoices, /projects, /contracts | "We're rolling out widget-level Russian translations over next 2-3 weeks — your account works fully, just some labels still English." |
| [#195](https://github.com/fer-fer-code/lancerwise/issues/195) | QuickInvoiceModal.tsx:95 TypeError | Sentry-tracked. Possibly visible as а brief modal flicker когда triggered от sidebar keyboard shortcut. Other Quick* modals likely affected too. | "Use the toolbar button OR direct route к open Quick Add modals; the keyboard shortcut path has а minor bug fix shipping next deploy." |
| [#196](https://github.com/fer-fer-code/lancerwise/issues/196) | /upgrade page H1 + subtitle EN | RU users see English H1 "Upgrade your plan" + subtitle "You're on the {plan} plan." | "Plan cards + buttons fully translated; page heading is being updated в next deploy." |

### P3 post-launch

| Issue | Title | Impact |
|---|---|---|
| [#192](https://github.com/fer-fer-code/lancerwise/issues/192) | Timezone dual-format redundancy для UTC users | UTC users see "10:00 UTC (10:00 UTC)" — cosmetic. Non-UTC users работают correctly. |
| [#143](https://github.com/fer-fer-code/lancerwise/issues/143) | FAB Quick Add menu overlap | RESOLVED via PR #184 — verify но close. |
| [#183](https://github.com/fer-fer-code/lancerwise/issues/183) | AI generate modal transparent | RESOLVED via PR #184 — same ModalBackdrop migration. |

### Operational known constraints

| Constraint | Why | Mitigation |
|---|---|---|
| **Twitter weak password** | Rotation deferred pre-launch (didn't want к risk lockout during launch window) | Rotate within 7 days post-launch. Track в memory + post-launch task #1. |
| **Reddit zero karma на @lancerwise account** | Account too new для most subreddits' karma gates | Post от Ramiz's personal (>30d account) для r/freelance; backup k r/SaaS + r/IndieHackers если shadowbanned. |
| **LinkedIn company page unverified** | Bot block 999 prevents automated check | Manual verification от Ramiz pre-launch; OR launch без LinkedIn promotion и add post-Tuesday. |
| **DMARC currently `p=none` (monitor)** | Per [#134](https://github.com/fer-fer-code/lancerwise/issues/134) — ramp scheduled `p=quarantine` (T+30d) → `p=reject` (T+60d) | Email send works fully; just less strict spoofing defense. Acceptable launch state. |
| **CSP not enforced** | [#133](https://github.com/fer-fer-code/lancerwise/issues/133) filed as day 1-3 hot follow-up | Ship without CSP enforcement; deploy 3-phase rollout post-launch. |

### Phase-1 N+1 completed (no longer а concern)

4 routes closed: #73 dashboard, #74 invoices, #93 /work/time, #94 /settings. ~184 REST calls → 5. Не expected к regress without explicit dev work; monitor for fetch-count anomaly via Sentry.

### Architectural debt deferred к post-launch

| Item | Tracking | When |
|---|---|---|
| CSP middleware enforcement | [#133](https://github.com/fer-fer-code/lancerwise/issues/133) | T+1 к T+3 days |
| DMARC `p=quarantine` ramp | [#134](https://github.com/fer-fer-code/lancerwise/issues/134) | T+30 days |
| DMARC `p=reject` ramp | [#134](https://github.com/fer-fer-code/lancerwise/issues/134) | T+60 days |
| Settings a11y debt (82 icon-only) | [#143](https://github.com/fer-fer-code/lancerwise/issues/143)..-[#153](https://github.com/fer-fer-code/lancerwise/issues/153) | Week 1-4 post-launch |
| Anthropic SDK migration (687 endpoints) | per memory `backlog_anthropic_endpoints_remaining_migration_p2` | Month 2-3 |
| Phase 2 i18n widget sweep | [#194](https://github.com/fer-fer-code/lancerwise/issues/194) | Week 2-4 |

---

## Appendix A — Quick-reference reference card

Print this section и keep within arm's reach на launch day.

```
┌─────────────────────────────────────────────────┐
│  LANCERWISE LAUNCH RUNBOOK — QUICK REFERENCE    │
├─────────────────────────────────────────────────┤
│                                                 │
│  P0 INCIDENT?  → Roll back в Vercel             │
│                  Dashboard → "Promote previous" │
│                                                 │
│  P1 INCIDENT?  → Branch hotfix от main          │
│                  → fast-track CI → merge        │
│                                                 │
│  P2/P3?        → File к backlog, defer          │
│                                                 │
│  SENTRY:       lancerwise.sentry.io             │
│  VERCEL:       vercel.com/fer-fer-codes/...     │
│  SUPABASE:     supabase.com/dashboard/...       │
│                                                 │
│  TELEGRAM:     notify.py command                │
│  ESCALATE:     Ramiz Telegram (primary)         │
│                                                 │
│  STATUS CHECK every 60 min:                     │
│    1. Sentry Issues last-60-min                 │
│    2. curl https://www.lancerwise.com/          │
│    3. Vercel deploy state                       │
│    4. Supabase connection pool                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Appendix B — Cross-references

- **Per-PR fix verdicts:** see `audit/agent1-*/` PR review comments + commit messages
- **Pre-launch checklist:** `audit/agent1-prelaunch-gono-go/PRELAUNCH-CHECKLIST.md`
- **Estimate-to-launch:** `audit/agent1-prelaunch-gono-go/ESTIMATE-TO-LAUNCH.md`
- **Smoke testing protocol:** `audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md` (F1-F20)
- **Post-launch Day 1 (operational):** `audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`
- **Comprehensive QA findings ([AGENT 1] batches 1-4):** `audit/agent1-comprehensive-qa-2026-05-21/QA-FINDINGS.md`
- **Comprehensive QA findings ([AGENT 3] independent):** `audit/agent3-comprehensive-qa-2026-05-21/QA-FINDINGS.md`
- **Interactive QA findings ([AGENT 3]):** `audit/agent3-interactive-qa-2026-05-22/INTERACTIVE-QA-FINDINGS.md`
- **Memory:** `feedback_marketing_honesty_policy.md`, `feedback_nonstop_work.md`, `feedback_unsub_policy_decision_tree.md`

---

**End of LAUNCH-RUNBOOK.md** — print, test, iterate post-launch.
