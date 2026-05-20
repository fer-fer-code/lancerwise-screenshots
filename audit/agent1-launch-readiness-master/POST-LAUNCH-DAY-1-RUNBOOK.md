# Post-Launch Day 1 Runbook

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Scope:** First 24 hours post-launch — operational checklist, monitoring cadence, triage paths, hotfix workflow.

**Note:** [AGENT 4]'s incident response runbook (`audit/agent4-incident-response-runbook/`) not yet pushed к screenshots repo as of 05:55 UTC. This document serves as minimal viable substitute until that lands; merge / supersede when AGENT 4 work arrives.

---

## Hour 0 — Launch trigger checklist

Before Ramiz flips "public" switch:

- [ ] All Tier 1 risks closed (#93, #94)
- [ ] Sentry release tagged for current main commit
- [ ] Vercel deploy state = READY for production environment
- [ ] LemonSqueezy webhook URL configured in dashboard
- [ ] Sentry alerts armed: #435759 (dashboard P95), any new alerts wired
- [ ] Telegram notify hook tested (notify.py works)
- [ ] Cookie banner shown on first visit (incognito test)
- [ ] Privacy/Terms accessible (200) с May 20 date
- [ ] `curl https://www.lancerwise.com/changelog | grep -c "in progress"` → 0

If ALL green → proceed.

---

## Hour 0-4 — Active monitoring window

**Cadence:** check every 30 minutes minimum.

### What к watch

| Surface | URL / tool | What to verify |
|---|---|---|
| Sentry inbox | sentry.io project | Any new P1/P2 errors? First-time users hitting unhandled paths? |
| LemonSqueezy dashboard | app.lemonsqueezy.com | Webhook deliveries succeeding (200)? Pending payments? |
| Vercel deploy logs | vercel.com/.../logs | Any deployment failures? Edge function timeouts? |
| Supabase logs | supabase.com/.../logs | RLS denials (expected for anon attempts), 5xx errors (unexpected) |
| Cloudflare analytics | cloudflare.com | Traffic spike OK; bot traffic ratio sane (< 30%)? |
| Telegram bot inbox | (notify.py target) | Any production alerts firing? |

### Triage thresholds (first 4h)

| Signal | Action |
|---|---|
| Same error fires 10+ times in 30min | Investigate; consider hotfix |
| LemonSqueezy webhook 5xx | Verify signature secret в Vercel env; check webhook endpoint logs |
| Sentry P95 transaction > 5s on any route | Investigate (likely cold-edge) |
| New TypeError "Load failed" | Check Header.tsx polling (LW-7), capture user agent |
| 5xx rate > 1% | Halt sign-ups, investigate |
| Supabase connection pool exhausted | Check long-running queries; restart if needed |

---

## Common issue triage paths

### Issue: User reports "can't sign up"

1. Open Sentry — filter `/api/auth/signup` errors past 1h
2. Check Cloudflare Turnstile dashboard — captcha verification rate
3. Verify Supabase Auth — `auth.users` table accepting INSERTs
4. Common causes:
   - Captcha verification 500 (Turnstile API outage) → known rate-limit gracefully fails
   - Email already in use → expected, ask user
   - Anti-spam blocked email → check Resend logs
5. Workaround: admin-create user via `supabase.auth.admin.createUser` if urgent

### Issue: User reports "page won't load on iPhone"

1. Get URL + iOS version + Safari version
2. Search Sentry для `TypeError: Load failed`
3. If `/work/time` route → known issue #93 (will be fixed pre-launch — if seen, escalate immediately)
4. If `/invoices/[id]` route → check if #74 fix shipped (PR #91 should be live)
5. If `/clients/[id]` route → #95 latent, escalate к [AGENT 2]
6. Workaround: have user try desktop browser as fallback

### Issue: User reports "payment failed"

1. Check LemonSqueezy dashboard — search by email
2. Verify webhook reached our endpoint:
   ```sql
   SELECT * FROM subscription_events
   WHERE created_at > now() - interval '2 hours'
   ORDER BY created_at DESC;
   ```
3. Check `profiles.plan` for the user — should be `pro` if checkout succeeded
4. If webhook не fired but checkout completed:
   - Manually update profile (only if Ramiz approves)
   - File P0 bug — webhook reliability issue

### Issue: "Cannot see my invoices / clients"

1. Confirm user authenticated (session valid)
2. Check RLS policies for `clients`, `invoices` — should match `auth.uid() = user_id`
3. Run `psql` query as service_role: `SELECT count(*) FROM clients WHERE user_id = '<user>'` — should return their rows
4. Если 0 rows но user expects data: check migration history (rare); ensure schema_migrations include latest

### Issue: "Email confirmation never arrived"

1. Check Resend dashboard для delivery status
2. Check `auth.users` row — `email_confirmed_at` should be NULL until confirm
3. Common causes:
   - Spam folder (most often)
   - Resend rate limited (check Resend dashboard)
   - Cloudflare Email Routing failure (check CF dashboard)
4. Workaround: admin-confirm via Supabase Dashboard → Auth → user → Confirm Email

---

## Escalation tree

```
[On-call agent observes signal]
       ↓
  Can resolve in <30min?
       ├─ YES → fix, document в commit, monitor
       └─ NO → escalate
              ↓
         Notify Ramiz + assigned cluster owner
              ↓
         Decision: hotfix vs rollback?
```

### Hotfix workflow

1. Identify smallest possible fix (text edit > code change > schema change)
2. Branch off latest main: `git fetch origin main && git checkout -b hotfix/<descriptive-name>`
3. Apply fix
4. **Skip ratchet bump if не adding new strings** (since baseline refresh at #98)
5. Push + PR с title "hotfix: <issue>"
6. CI must pass all 3 gates (no admin merge unless P0)
7. `gh pr merge --squash --delete-branch`
8. Verify production within 15 min (curl + key signal)
9. Telegram notify Ramiz + chronologically log в this runbook

### Rollback workflow (last resort)

If hotfix is too risky или wrong cause unknown:

```bash
# Identify last good commit
git log --oneline | head -10

# Revert merge commit
git revert -m 1 <bad-merge-sha>
git push origin main
# Branch protection allows this if revert PR passes gates
```

Notify Ramiz + Telegram + log в this runbook.

---

## Cross-link к [AGENT 4] observability docs

When [AGENT 4] pushes `audit/agent4-launch-observability-pkg/` и `audit/agent4-incident-response-runbook/`:

- Replace "Common issue triage paths" с richer playbook от their docs
- Replace "Escalation tree" if they have а more formalised one
- Replace "Hotfix workflow" — keep this one as canonical for the codebase; reference theirs alongside

Until those land, this document is the source-of-truth для day-1 ops.

---

## Day 1 wrap-up checklist (hour 24)

- [ ] Compile Sentry error summary (top 5 issues by frequency)
- [ ] Compile signup funnel stats (LemonSqueezy + Supabase auth)
- [ ] Identify any new P1 issues that materialised
- [ ] Update POST-LAUNCH-WEEK-1-BACKLOG с new learnings
- [ ] Send 24h status к Ramiz via Telegram

---

## Hotfix patterns observed (today's lessons)

From today's pre-launch sprint:

### Pattern: text-only fix
- PR #105 (Privacy/ToS): 3 line edits + i18n baseline bump
- PR #110 (changelog): 1 line edit
- CI passes clean, deploy ~6-13 min
- Total time от issue к live: ~30-45 min

### Pattern: schema-only RLS fix
- PR #103 (drop policies + service_role refactor): SQL DROP + page route change
- Independent verification 4/4 PASS protocol
- Mobile / desktop curl verification + admin.generateLink cross-tenant test
- Total time: ~1.5h

### Pattern: bigger refactor
- PR #84+#86 (dashboard P1-A): Context provider + 21 widgets refactored
- Required visual baseline refresh first (#98)
- Total time: ~2 days across 2 PRs

These ranges inform realistic ETA for any hotfix scenario.

---

## Cross-references

- LAUNCH-READINESS-MASTER.md — full pre-launch state
- RISK-PROFILE.md — what ships с known risk
- POST-LAUNCH-WEEK-1-BACKLOG.md — what к do first week
- [[Operations/VERCEL-DEPLOY-TROUBLESHOOTING]] — Vercel-specific runbook
- [[Operations/SUPABASE-MIGRATION-TRACKING-FIX]] — DB-specific workaround
