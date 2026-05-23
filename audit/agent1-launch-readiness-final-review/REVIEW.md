# Launch Day Runbook — Final Review

**Author:** [AGENT 1]
**Date:** 2026-05-23
**Method:** Read 3 deliverables in full + verify against 6-criteria Ramiz checklist
**Scope reviewed:** `audit/agent1-launch-day-runbook/RUNBOOK.md` (419 lines) + `audit/agent1-launch-runbook-2026-05-23/LAUNCH-RUNBOOK.md` (605 lines) + `audit/agent1-launch-comms/*.md` (787 lines across 4 files) = **1811 lines total**

---

## 🎯 Verdict: **PASS WITH GAPS** — 4 critical gaps + 3 polish items

Core operational structure is solid: pre-launch checklist, P0-P3 incident playbooks, escalation paths, monitoring stack URLs, comms variants (Twitter EN/RU, LinkedIn EN/RU, Reddit, PH copy, Show HN), rollback procedure all present. **4 specific gaps must be closed pre-launch** before runbook is fully operational.

---

## §1 — Timestamps verification

**Criterion:** ProductHunt launch Tue 2026-05-26 12:01 AM PDT = Tue 14:01 ICT (Ramiz Nha Trang Vietnam UTC+7)

**Math check:** 2026-05-26 00:01 PDT (UTC-7) = 07:01 UTC Tuesday = 14:01 ICT Tuesday ✅ correct

### Gap #1 — Launch time NOT explicit в runbooks ⚠️

Both runbooks reference "Tuesday 2026-05-26" but `LAUNCH-RUNBOOK.md` §6 still says **"PH launch scheduled: Tuesday 2026-05-26 (time TBD by Ramiz)"** — never updated с specific PDT/UTC/ICT time. Ramiz operational timezone (Nha Trang ICT UTC+7) means **launch fires at 14:01 ICT Tuesday** — meaningfully different от waking-up-and-launching.

**Recommendation (pre-launch edit, ~2 min):**

In both `agent1-launch-day-runbook/RUNBOOK.md` + `agent1-launch-runbook-2026-05-23/LAUNCH-RUNBOOK.md`:

```markdown
**Launch trigger time:**
- Tue 2026-05-26 00:01 PDT (ProductHunt convention "Tuesday 12:01 AM PT")
- = Tue 07:01 UTC
- = Tue 14:01 ICT (Ramiz local time — Nha Trang, Vietnam, UTC+7)

**T-30 min pre-launch:** Tue 13:31 ICT / 06:31 UTC / 11:31 PM PDT Monday
```

This single explicit timestamp anchor unblocks all downstream T-X computations.

**Verdict:** ⚠️ **GAP** — easy fix, blocking-quality.

---

## §2 — ProductHunt submission checklist

**Criterion:** tagline, description, gallery images, maker comment template, hunter approach

### Coverage matrix

| Element | Source | Status |
|---|---|---|
| Tagline (60-80 chars) | `ANNOUNCEMENT-DRAFT.md:108-110` | ✅ PRESENT — "The all-in-one business hub built for independent freelancers" |
| Description (260 chars) | `ANNOUNCEMENT-DRAFT.md:112-114` | ✅ PRESENT |
| Gallery images (4-6 × 1635 × 1080 PNG/JPG) | `SOCIAL-ASSETS-CHECKLIST.md:18-19` | ⚠️ INVENTORY ONLY — assets **not yet created** per `backlog_seo_og_image_design_upgrade` |
| Logo (240 × 240 PNG transparent) | `SOCIAL-ASSETS-CHECKLIST.md:20` | ✅ EXISTS (`public/icon.svg` source) |
| First maker comment template | `ANNOUNCEMENT-DRAFT.md:116-133` | ✅ PRESENT — multi-paragraph founder voice с product details |
| **Hunter approach** | — | ❌ **MISSING** |

### Gap #2 — PH "hunter approach" не covered ❌

PH convention: products launched by а "Hunter" (account с follower base) get more reach than self-submitted launches. Runbook implicitly assumes self-launch by Ramiz — но doesn't document the choice OR contingency if Ramiz wants к find а hunter at the last minute.

**Recommendation:**

Add к `ANNOUNCEMENT-DRAFT.md` "Product Hunt launch description" section:

```markdown
### Hunter approach — explicit decision

**Choice:** Self-launch by Ramiz @ramizfiziev (NO external hunter outreach)

**Rationale:**
- Self-launching keeps maker-first authenticity (PH community prefers это in 2025+)
- External hunter outreach risks 3-5 day delay + no guarantee
- Lower-following self-launch с strong maker comment + early-community engagement usually outperforms hunter-driven launch с weak maker presence

**Fallback if PH visibility weak в first 2h:** ping 5-10 known indie-maker contacts privately к ask for honest first-look (not "please upvote"). DO NOT ask family/friends — PH algorithm flags non-organic upvotes.
```

### Gap #3 — PH gallery images NOT YET CREATED ❌

`SOCIAL-ASSETS-CHECKLIST.md:71` flags "Product Hunt gallery (4-6 images, 1635 × 1080)" — required if launching PH — as ❌ not built. **Hard launch blocker for PH submission.**

**Recommendation:** [AGENT 6] OR Ramiz creates 4-6 PH gallery images BEFORE T-1h. Sources available:
- Existing audit screenshots в `audit/agent3-*/` + `audit/agent4-*/` directories
- Live homepage hero card
- /dashboard widget tree screenshot (post-Phase 2 palette)
- /upgrade pricing card (signature moment)
- AI contract generation flow

**Time estimate:** ~1-2 h к design 4-6 branded gallery images (light retouching of audit screenshots, не from scratch).

**Verdict §2:** ⚠️ **2 GAPS** — Hunter approach decision needs explicit doc; gallery images need creation.

---

## §3 — Launch hour timeline

**Criterion:** T-1h, T-30min, T+0, T+1h, T+4h, T+12h, T+24h actionable steps

### Coverage matrix

| Time slot | Runbook coverage | Status |
|---|---|---|
| **T-1h** | NOT explicit | ⚠️ Gap — implicit via "30 min before" in §1 |
| **T-30 min** | `LAUNCH-RUNBOOK.md §1` 19-item PRE-LAUNCH CHECKLIST | ✅ THOROUGH |
| **T+0** | `LAUNCH-RUNBOOK.md §2` LAUNCH SEQUENCE 5 steps (hero tweet + thread + Reddit + email + LinkedIn) | ✅ THOROUGH |
| **T+1h** | `LAUNCH-RUNBOOK.md §3` hourly cadence (Sentry triage / curl / Vercel / DB pool / Telegram) | ✅ PRESENT |
| **T+4h** | NOT explicit (covered implicitly by hourly cadence) | ⚠️ Gap — no discrete checkpoint |
| **T+12h** | NOT explicit (covered implicitly by hourly cadence) | ⚠️ Gap — no discrete checkpoint |
| **T+24h** | `RUNBOOK.md §D` 24h watch protocol + p95 re-check + email delivery review | ✅ PRESENT |

### Gap #4 — Discrete T-1h / T+4h / T+12h checkpoints ⚠️

Hourly cadence в §3 implicitly covers these но без explicit "at T+4h, do X" items, easy к skip during busy launch. Particularly:

- **T-1h** — final smoke + freeze branch + tea/coffee (not joke — operator needs к not be stressed at T+0)
- **T+4h** — first "evening Asia / morning US" wave check; ProductHunt traction signal becomes meaningful (~4-6h after launch)
- **T+12h** — overnight monitoring handoff (Ramiz sleeps Vietnam UTC+7 from ~22-07 ICT = ~15-00 UTC). Most US activity occurs DURING Ramiz's sleep. **Critical discrete checkpoint.**

**Recommendation:** Add explicit T-X items к `LAUNCH-RUNBOOK.md` between §2 and §3:

```markdown
## §2.5 — Discrete checkpoint actions

### T-1h (Tue 13:01 ICT / 06:01 UTC)
- [ ] Branch freeze: tag `git tag launch-2026-05-26 main; git push --tags`
- [ ] Final smoke F12-F20 pass (per `SMOKE-TESTING-PROTOCOL.md`) — 10 min
- [ ] Tea/coffee + 5-min walk — calm operator before T-0
- [ ] Phone notifications: silence everything EXCEPT Telegram + Sentry alerts

### T+4h (Tue 18:01 ICT / 11:01 UTC)
- [ ] PH traction check: upvote velocity, rank, comment count
- [ ] First wave US East Coast: monitor signups + check Twitter mentions
- [ ] Sentry rolling-1h error rate snapshot vs T+1h baseline
- [ ] Reply to top 3 Reddit comments + top 3 PH comments (личное engagement scoring)

### T+12h (Wed 02:01 ICT / 19:01 UTC Tuesday — overnight Vietnam)
- [ ] **Critical**: this fires while Ramiz sleeps. Pre-arrange [AGENT 4] auto-watch + Telegram surfacing для P0 only
- [ ] Manual Sentry check at this point: triage 5-min ahead of bed (~Tue 22:00 ICT) OR rely on Telegram pings
- [ ] Vercel deploy state check (no auto-deploys overnight без PR review)
- [ ] LemonSqueezy webhook delivery count check (first overnight payment events)

### T+24h (Wed 14:01 ICT / 07:01 UTC)
(per existing §3 + RUNBOOK.md §D — already covered)
```

**Verdict §3:** ⚠️ **GAP** — covered implicitly но discrete checkpoints would meaningfully reduce operator cognitive load.

---

## §4 — Contingency procedures

**Criterion:** what к do if LemonSqueezy payment broken, Supabase rate limit hit, Sentry alerts fire, Vercel deploy fails в launch window, ProductHunt отклоняет submission

### Coverage matrix

| Contingency | Runbook coverage | Status |
|---|---|---|
| LemonSqueezy payment broken | `LAUNCH-RUNBOOK.md §3` watch signals + §4 P0 playbook + `RUNBOOK.md §C3` webhook validation | ✅ THOROUGH |
| Sentry alerts fire | `LAUNCH-RUNBOOK.md §4` P0-P3 playbooks + `RUNBOOK.md §F` escalation | ✅ THOROUGH |
| Vercel deploy fails в launch window | `LAUNCH-RUNBOOK.md §4 P0.1` rollback + `RUNBOOK.md §E` rollback procedure | ✅ THOROUGH |
| **Supabase rate limit hit** | — | ❌ **MISSING** |
| **ProductHunt rejects/throttles** | — | ❌ **MISSING** |

### Gap #5 — Supabase rate limit playbook ❌

Supabase free tier has rate limits на auth signups (per-IP + global). PH launch может trigger 100+ signups в short window → potential rate-limit hit (especially on `auth.signup` endpoint).

**Recommendation:** Add к `LAUNCH-RUNBOOK.md §3` watch signals:

```markdown
| Sentry: `auth.signup` returns 429 OR Supabase shows rate-limit warning | P1 | Check Supabase Dashboard → Settings → Auth → rate limits. If hitting per-IP limit, может be legitimate burst — investigate. If hitting global limit, upgrade tier OR temporarily disable Turnstile-gated signup. |
| Supabase Auth visible errors in `auth.users` insert log | P0 | Database write path broken. Check connection pool + RLS policies. |
```

Plus add к `§4 P1 playbook`:

```markdown
### P1.2 — Supabase rate limit hit (signup throttling)

**Symptoms:** `/api/auth/signup` returns 429 OR Sentry shows "rate_limit_exceeded" errors clustered.

**Triage (~5 min):**
1. Open Supabase Dashboard → Settings → Auth → Rate Limits — check current limits
2. Supabase Dashboard → Logs → filter rate-limit-related → confirm scope (per-IP vs global)

**Mitigation options (pick один):**

- **A. Wait it out** — if rate limit is per-IP (5/hour default), wait 15-60 min для bucket к refill
- **B. Tier upgrade** — Supabase Pro plan ($25/mo) has 10× rate limit ceiling; can upgrade live without downtime
- **C. Manual signup workaround** — use Supabase Admin `generate_link` to bypass rate limit для individual blocked users (with consent), DM them direct signup link
- **D. Disable signup temporarily** — if abuse OR runaway bot, set `enable_signup: false` в Management API temporarily, post Twitter status, investigate
```

### Gap #6 — ProductHunt rejection / throttle playbook ❌

PH могут reject submissions if:
- Tagline OR description violates guidelines
- Account too new (Ramiz's PH age unverified)
- Duplicate detection (false positive если similar product exists)

Or shadow-throttle если:
- Engagement velocity too low
- Reports for "spam" or "self-promotion"

**Recommendation:** Add к `ANNOUNCEMENT-DRAFT.md` after "Product Hunt launch description":

```markdown
### PH rejection / throttle contingency

**If submission rejected (~30 min after submit, PH email or dashboard notice):**

1. Read rejection reason carefully — most common: tagline too marketing-y, "we" wording on solo product, claims unverifiable
2. Edit + resubmit within 1 hour (PH allows immediate re-submit)
3. If rejected twice → DM PH support, ask for specific reason
4. **Don't panic** — even rejected submission has 24h appeal window

**If shadow-throttle (low velocity despite real engagement):**

1. Check rank position (should be top 30 within 4h of launch если engagement healthy)
2. If rank-30+ at T+4h despite organic shares: throttle suspected
3. Mitigations:
   - Boost via known indie-maker network (private DM, не "please upvote")
   - Re-engage existing commenters with thoughtful replies (signals algorithm activity)
   - Cross-post excerpt к Twitter с PH link (drives traffic от PH-aware audience)
4. If throttle persists 12h+: accept campaign result, focus на post-launch content

**If product removed (rare, ~24h after launch):**

1. PH email will state reason — usually duplicate-product OR community-flag
2. Appeal through PH support form within 48h
3. Backup channel: Twitter announcement "PH listing was removed для [reason] — appealing. Meanwhile try LancerWise here: https://www.lancerwise.com"
```

**Verdict §4:** ⚠️ **2 GAPS** — Supabase rate limit + PH rejection contingencies needed.

---

## §5 — Comms templates

**Criterion:** Twitter announcement, Telegram message draft, response к first PH комментариям

### Coverage matrix

| Template | Source | Status |
|---|---|---|
| Twitter announcement (3 EN variants + 2 RU variants) | `ANNOUNCEMENT-DRAFT.md:11-37` | ✅ THOROUGH |
| Twitter thread (T+5/+10/+15 follow-ups) | `LAUNCH-RUNBOOK.md:120-135` | ✅ PRESENT |
| LinkedIn EN + RU drafts | `ANNOUNCEMENT-DRAFT.md:39-104` | ✅ THOROUGH |
| Reddit r/freelance + r/digitalnomad + (deferred r/SaaS) | `ANNOUNCEMENT-DRAFT.md:139-193` | ✅ THOROUGH |
| Show HN | `ANNOUNCEMENT-DRAFT.md:196+` | ✅ PRESENT |
| Telegram founder-channel announcement | `RUNBOOK.md:114-131` (T+0 internal) | ✅ PRESENT |
| Telegram alert template — incident | `RUNBOOK.md:316-328` (rollback notice) | ✅ PRESENT |
| P0 incident tweet template | `LAUNCH-RUNBOOK.md:266-268` | ✅ PRESENT |
| PH first maker comment (founder voice) | `ANNOUNCEMENT-DRAFT.md:116-133` | ✅ PRESENT |
| **Response к typical PH comments** | — | ⚠️ **PARTIAL** |

### Gap #7 — PH comment-response templates absent ⚠️

`POST-LAUNCH-WEEK-1-COMMS.md` says "Reply к every comment с specific answers" — но no template responses для common PH question patterns. Real-time replies при traffic spike risk inconsistency or stalled engagement.

**Recommendation:** Add к `ANNOUNCEMENT-DRAFT.md` after maker-comment:

```markdown
### PH comment response patterns (pre-drafted)

Use these as starting points; personalize per commenter. Don't copy-paste; vary phrasing.

#### "How is this different from [HoneyBook / Dubsado / Bonsai]?"

> Great question — three key differences:
> 1. Free tier covers 2 clients permanently (most paid alternatives gate everything behind а $20-39/mo subscription)
> 2. AI contract generation is template-based, not "send to OpenAI" — privacy-respecting
> 3. Built solo, so feedback ships fast. Last week's user request was в production 3 days later.
>
> Что would matter most к your workflow?

#### "Is this open source?"

> Not currently open source — it's а commercial product. Pricing is intentionally honest ($0 forever / $15/mo Pro / Business coming) и I want к keep it sustainable for а solo team.
>
> If self-hostable matters specifically — drop me а note, I'm tracking demand для что direction.

#### "Bug: [specific issue]"

> Thank you for surfacing — opening а ticket now. Will reply here as soon as fix ships (usually <24h for cosmetic bugs, faster для functional). Could you share browser + screenshot if you have а min?

#### "Where's [specific feature]?"

> Not built yet — what's the use case driving the ask? Если 3+ people ask the same thing it usually jumps the backlog. Тоже helpful: how do you currently solve that с your existing toolchain?

#### "Pricing question (Pro / Business / Enterprise)"

> Pro is $15/mo flat — unlimited clients + AI tools + Stripe Connect online payments. Business is "coming soon" — team features. No Enterprise tier currently. Anything в particular about pricing structure that's confusing? Trying к keep it simpler than most alternatives.

#### "Does it work outside US?" (digital nomad framing)

> Yes — built с remote work в mind. EN + RU localized. LemonSqueezy handles VAT compliance across countries. Multi-currency invoices supported. Что would be your country/currency combination so I can spot-check it works for that case specifically?

#### "Solo founder respect / hype / general positive"

> Thanks 🙏 — appreciate the trust. Built solo, so feedback like this is gas в the tank. Если specific feature/page got your attention, лю open to making it better.
```

**Verdict §5:** ⚠️ **GAP** — PH comment-response templates would meaningfully reduce real-time copy stress.

---

## §6 — Monitoring stack

**Criterion:** Sentry filters настроены, Vercel metrics dashboard ready, Supabase usage graphs accessible

### Coverage matrix

| Item | Source | Status |
|---|---|---|
| Sentry filters | `LAUNCH-RUNBOOK.md §1.7` says "3 alert rules active: (a) errors > 10/hr, (b) `MIDDLEWARE_INVOCATION_FAILED`, (c) PII scrub failure" | ⚠️ **NEEDS VERIFICATION** — runbook describes but doesn't link к Sentry alert config |
| Sentry — project URL | `LAUNCH-RUNBOOK.md §5` | ✅ <https://lancerwise.sentry.io/issues/?project=4511391765954560> |
| Sentry — alerts URL | `LAUNCH-RUNBOOK.md §5` | ✅ <https://lancerwise.sentry.io/alerts/rules/> |
| Vercel project Dashboard | `LAUNCH-RUNBOOK.md §5` | ✅ <https://vercel.com/fer-fer-codes-projects/lancerwise> |
| Vercel — analytics | `LAUNCH-RUNBOOK.md §5` | ✅ <https://vercel.com/fer-fer-codes-projects/lancerwise/analytics> |
| Vercel deployments | `LAUNCH-RUNBOOK.md §5` | ✅ <https://vercel.com/fer-fer-codes-projects/lancerwise/deployments> |
| Supabase Dashboard | `LAUNCH-RUNBOOK.md §5` | ✅ <https://supabase.com/dashboard/project/skfgwyzarrhhkzvltbgm> |
| Supabase — Reports (connection pool) | `LAUNCH-RUNBOOK.md §5` | ✅ <https://supabase.com/dashboard/project/skfgwyzarrhhkzvltbgm/reports/database> |
| Supabase — Auth/Users | `LAUNCH-RUNBOOK.md §5` | ✅ <https://supabase.com/dashboard/project/skfgwyzarrhhkzvltbgm/auth/users> |
| LemonSqueezy Dashboard | `LAUNCH-RUNBOOK.md §5` | ✅ <https://app.lemonsqueezy.com/> |
| Cloudflare zone | `LAUNCH-RUNBOOK.md §5` | ✅ |
| Resend Dashboard | `LAUNCH-RUNBOOK.md §5` | ✅ |
| Upstash Redis | `LAUNCH-RUNBOOK.md §5` | ✅ |
| Quick-reference card (Appendix A) | `LAUNCH-RUNBOOK.md` | ✅ PRESENT — print-and-keep |
| Telegram notify command | `RUNBOOK.md + LAUNCH-RUNBOOK.md §6` | ✅ `python3 /Users/myoffice/instagram-agent/notify.py "<msg>"` |

### Polish item — Sentry filter pre-verification

3 alert rules described but not directly linkable from runbook. Could add Sentry alert-rule IDs OR specific Sentry Project Settings URL to verify at T-30 min.

**Recommendation (optional, ~5 min Ramiz):**

Click к Sentry → Alerts → confirm 3 rules exist + active. Document specific rule names + IDs in `LAUNCH-RUNBOOK.md §1.7`:

```markdown
| 1.7 | Sentry alerts armed for production | Sentry → Alerts → confirm 3 rules ACTIVE:<br>(a) `errors-rate-10-per-hr` (ID: TBD by Ramiz)<br>(b) `MIDDLEWARE_INVOCATION_FAILED-any-fire` (ID: TBD)<br>(c) `PII-scrub-failure` (ID: TBD) | [AGENT 4] |
```

**Verdict §6:** ✅ **PASS** (с minor polish) — all dashboards accessible; only Sentry filter IDs unspecified.

---

## 🏁 Summary table — 6 criteria

| # | Criterion | Verdict | Gaps |
|:---:|---|:---:|---|
| 1 | Timestamps correct (PDT/UTC/ICT for Tue 2026-05-26 launch) | ⚠️ GAP | Gap #1: Launch time NOT explicit в runbooks |
| 2 | PH submission checklist | ⚠️ 2 GAPS | Gap #2: Hunter approach explicit decision; Gap #3: PH gallery images not yet created |
| 3 | Launch hour timeline | ⚠️ GAP | Gap #4: T-1h / T+4h / T+12h discrete checkpoints missing |
| 4 | Contingency procedures | ⚠️ 2 GAPS | Gap #5: Supabase rate limit playbook; Gap #6: PH rejection/throttle playbook |
| 5 | Comms templates | ⚠️ GAP | Gap #7: PH comment-response templates |
| 6 | Monitoring stack | ✅ PASS | Polish only: Sentry filter IDs unspecified |

**Total: 7 gaps (4 critical + 3 polish).**

---

## Recommended fix sequence (pre-T-1h)

Order by criticality + dependency:

### Critical (must close pre-launch — ~2-3h total work)

1. **Gap #3 — PH gallery images** — [AGENT 6] OR Ramiz, ~1-2h. Hard launch blocker for PH submission.
2. **Gap #1 — Launch time explicit** — [AGENT 1], ~5 min edit. Single timestamp anchor unblocks downstream computation.
3. **Gap #6 — PH rejection contingency** — [AGENT 1] doc, ~15 min. Risk reduction.
4. **Gap #5 — Supabase rate limit playbook** — [AGENT 1] doc + [AGENT 4] alert config, ~20 min combined.

### High polish (should close pre-launch — ~30 min)

5. **Gap #4 — T-1h / T+4h / T+12h checkpoints** — [AGENT 1], ~10 min edit.
6. **Gap #7 — PH comment-response templates** — [AGENT 1], ~15 min edit.
7. **Gap #2 — Hunter approach explicit** — Ramiz decision + [AGENT 1] doc, ~5 min once decided.

### Optional polish (post-launch acceptable)

- Sentry filter IDs in §1.7 ([AGENT 4] verify + document)

---

## Recommendation к Ramiz

**Path:** Close 4 critical gaps в next ~2-3h focused work. Polish items can ride с launch.

**Decision points:**
1. Confirm "self-launch (Ramiz)" vs "find а hunter" — decision impacts Gap #2
2. Approve [AGENT 6] tasking for PH gallery image creation — Gap #3
3. Accept [AGENT 1] proposed contingency playbooks (Gaps #5, #6) for direct runbook merge

**ETA к full PASS verdict:** ~3h focused work parallel-able across 2-3 agents.

---

## Cross-references

- `audit/agent1-launch-day-runbook/RUNBOOK.md` — primary 419-line operational doc
- `audit/agent1-launch-runbook-2026-05-23/LAUNCH-RUNBOOK.md` — 605-line newer operational doc
- `audit/agent1-launch-comms/ANNOUNCEMENT-DRAFT.md` — 249-line comms variants (Twitter/LinkedIn/Reddit/PH/HN)
- `audit/agent1-launch-comms/EMAIL-DRAFT.md` — 163-line email templates
- `audit/agent1-launch-comms/POST-LAUNCH-WEEK-1-COMMS.md` — 256-line week-1 cadence
- `audit/agent1-launch-comms/SOCIAL-ASSETS-CHECKLIST.md` — 119-line asset inventory
- `audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md` — ongoing ops reference
- `audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md` — F1-F20 smoke flows
