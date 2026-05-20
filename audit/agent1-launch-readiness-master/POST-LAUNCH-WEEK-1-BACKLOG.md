# Post-Launch Week 1 Backlog

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** Synthesised todo list для first week after public launch. Mix of P2 follow-ups + opportunistic hardening + outreach.

**Order:** rough priority by impact + urgency. Owners assigned where applicable; otherwise TBD by orchestrator.

---

## Days 1-2 — Stabilisation + hot followup

### 1. Sentry cluster initial wiring (#76, #77, #80) — ~4h

**Why first:** baseline observability needs setUser/setLocale tags + alert rules before noise accumulates and triage becomes unmanageable.

- #76 `Sentry.setUser({id})` — tie errors к specific users (~1h)
- #77 `Sentry.setTag('locale')` — RU vs EN filter (~30 min)
- #80 Configure 3 alert rules: new-issue, regression detection, perf threshold (~2h)

Owner: [AGENT 2] or [AGENT 4]. Single PR or 3 small.

### 2. LANCERWISE-7 polling fix #104 — ~30 min OR ~2h

**Why early:** мобильный TypeError fires from every (app) route load. Quick fix reduces Sentry inbox noise + improves mobile reliability perception.

- **Option A (recommended):** ~30 min try/catch wrap + Sentry.captureException tag
- Option B: ~2h migrate notifications к Context provider (combines с #90)

Owner: [AGENT 2].

### 3. #102 subscription_events policy tightening — ~10 min

**Why:** defensive cleanup; cheap. Closes the `IS NULL` branch.

```sql
DROP POLICY "users read own subscription events" ON subscription_events;
CREATE POLICY "users read own subscription events" ON subscription_events
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM subscriptions s WHERE s.id = subscription_events.subscription_id AND s.user_id = auth.uid()));
```

Owner: [AGENT 4].

---

## Days 3-4 — Quality + Hardening

### 4. #95 /clients/[id] N+1 latent fix — ~3-4h

**Why:** materialises как real users accumulate clients и open detail views. Pattern matches #74.

Same recipe: `PROMISE-ALL-SERVER-FETCH` + props.

Acceptance: anon REST count drops к <8 на /clients/[id] baseline re-probe. Mobile Safari renders без crash на real device test.

Owner: [AGENT 2].

### 5. Sentry cluster continuation (#78, #79, #81, #82) — ~6h

- #78 AI endpoint catch blocks → Sentry (Gemini migration blind)
- #79 Resend webhook → Sentry (email delivery failures)
- #81 Session Replay at 10% sample
- #82 Server `console.error` → `Sentry.captureException`

Bundle into 1-2 PRs.

Owner: [AGENT 2 or 4].

### 6. #109 Marketing cosmetic — ~35-40 min

- /faq "Stripe integration" wording clarification
- "12 AI tools" claim verification
- Full changelog refresh для May 11-20 work (10 days uncovered)

Owner: [AGENT 1] OR [AGENT 4].

### 7. Comprehensive QA campaign (memory #11) — ~6-10h focused, parallel agents

**Trigger:** all P1 closed + Tier 1 risks mitigated.

Per [[Post-Launch/QA-CAMPAIGN-PLAN]] и `scripts/qa-fixtures/COVERAGE.md`:
- Desktop EN + Desktop RU + Mobile RU (iOS Safari real device)
- 16 sub-flows к exercise (signup → invoice → contract → analytics)
- Surfaced new issues filed as discovered

Use [PR #88](https://github.com/fer-fer-code/lancerwise/pull/88) draft fixtures (merge during campaign).

Owner: All agents в parallel.

---

## Days 5-7 — Growth + Marketing

### 8. SEO content + Schema.org Phase 1 — ~6-8h

**Memory references:** `backlog_blog_content_seo_strategy.md`, `backlog_seo_blogposting_jsonld.md`, `backlog_seo_per_page_og_images.md`

Priority:
- Schema.org `BlogPosting` JSON-LD на /blog/[slug] (rich snippet candidacy)
- Per-page OG images via @vercel/og ImageResponse
- 1-2 blog posts: "HoneyBook alternative", "Dubsado alternative"

Owner: [AGENT 1] OR [AGENT 3].

### 9. Reddit / IndieHackers / ProductHunt launch posts

**Memory reference:** `backlog_backlinks_outreach_plan.md`

Posts к coordinate:
- r/freelance — launch-day announcement
- IndieHackers product page submission
- Product Hunt soft-launch (Tuesday recommended timing)
- Hacker News "Show HN" post (text post, не link-only)

Owner: Ramiz directly (founder voice essential).

### 10. RU translation of legal pages #106 — ~4-6h

**Why:** GDPR Art. 12 mitigation timeline (within 30 days commitment). Cannot wait too long после launch.

Approach: same as Bug #023 Z1-Z3 namespace pattern.

Owner: [AGENT 1].

### 11. Russian market analysis (memory rule если referenced)

Investigation: which Russian platforms /sources should we monitor для feedback? VK, Telegram channels, vc.ru, Habr? File as scoping issue.

Owner: Ramiz + [AGENT 3].

---

## Mid-week-2 (if launch goes smoothly) — Major P1 fixes

These are launch-blockers if not done pre-launch, но если they slip к week 2 (например through emergency timing):

### 12. #93 /work/time N+1 — 6-8h

If somehow shipped without this fix (NOT recommended), priority к close в week 2.

Risk if delayed: iOS user complaints accumulating, support burden rising.

Owner: [AGENT 2].

### 13. #94 /settings N+1 — 3-4h

Same caveat.

Owner: [AGENT 2].

---

## Tracking + admin

### 14. Update vault `Post-Launch/BACKLOG.md` weekly

After each item closes: mark resolved, add learnings к relevant Bugs/ или Decisions/ entries.

Owner: any agent на standby.

### 15. Update LAUNCH-READINESS-MASTER snapshot

End of week 1 — recap actual state vs predictions in this doc. Lessons feed forward to next-phase planning.

Owner: [AGENT 1].

---

## Aggregate effort estimate

| Block | Estimate | Status if launch ready |
|---|---|---|
| Days 1-2 stabilisation | ~5h | Critical |
| Days 3-4 hardening | ~12-15h | High value |
| Days 5-7 growth | ~10-15h | Important for traction |
| Mid-week 2 P1 (if slipped) | ~10h | Only if not done pre-launch |
| Tracking + admin | ~2h | Ongoing |

**Total week 1 ambitious effort: ~30-40h** across 4 agents = ~8-10h/agent. Achievable с focused parallel work.

---

## What's NOT в this backlog (defer further)

| Item | Defer reason |
|---|---|
| DPA template (memory: GAP 4) | B2B-only; build on request from first prospect |
| Per-vendor cookie categories | Only if new tracking SDK added |
| `supabase migration repair` 470x cleanup | Maintenance window post-launch month 1 |
| DB password rotation | Schedule month 1 |
| Anthropic endpoints P2 migration (#87 backlog) | Sentry cluster touches AI endpoints; bundle there |
| Welcome tour analytics | Post-onboarding-completion metrics; need data first |
| Multi-currency RUB support | Russian market analysis informs scope |
| Comprehensive 410-table policy hygiene cleanup | Pen-test gate now catches; cleanup is cosmetic |

These are post-launch month 2+ items.

---

## Cross-references

- LAUNCH-READINESS-MASTER.md — pre-launch state
- RISK-PROFILE.md — what ships с known risk
- POST-LAUNCH-DAY-1-RUNBOOK.md — first 24h ops
- [[Post-Launch/QA-CAMPAIGN-PLAN]] — full QA campaign plan
- [[Post-Launch/BACKLOG]] — vault backlog (longer view)
- Memory rules referenced: backlog_blog_content_seo_strategy, backlog_backlinks_outreach_plan, project_lancerwise_db_password_rotation
