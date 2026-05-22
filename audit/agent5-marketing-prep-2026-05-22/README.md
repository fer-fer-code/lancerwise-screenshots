# Agent 5 — Marketing prep (2026-05-22)

**Role:** Produce launch marketing copy for all channels. Draft-only — Ramiz reviews and posts.
**Scope:** read-only access to code, read-write to docs in this directory.
**Status:** ✅ Complete (all 6 tasks delivered)

---

## Deliverables

| # | File | What | Status |
|---|---|---|---|
| 1 | [PRODUCTHUNT.md](./PRODUCTHUNT.md) | PH launch kit EN — 7 taglines, 260-char description, ~1500-char maker's first comment, problems/benefits, 10 anticipated hunter Q&A, gallery captions, topic tags, launch-time recommendation, pre-launch checklist | ✅ |
| 1 | [PRODUCTHUNT-RU.md](./PRODUCTHUNT-RU.md) | PH kit adapted for RU follow-up channels (vc.ru, Habr, Telegram). RU-specific tone + channel sequencing | ✅ |
| 2 | [TWITTER.md](./TWITTER.md) | Hero tweet (3 variants), 7-tweet launch thread, 3 Day-2-4 follow-up tweets, 5 reply templates, tweet timing chart, tone notes | ✅ |
| 2 | [TWITTER-RU.md](./TWITTER-RU.md) | RU adaptation. Includes Telegram repost guidance + target channels (@freelance_ru, @smm_lab, etc.) | ✅ |
| 3 | [LINKEDIN.md](./LINKEDIN.md) | 1495-char long-form post, above-fold hook, posting guidance, Day-+3 follow-up, DM templates | ✅ |
| 3 | [LINKEDIN-RU.md](./LINKEDIN-RU.md) | RU adaptation. Includes Telegram repost format | ✅ |
| 4 | [REDDIT.md](./REDDIT.md) | 5 subreddits (r/freelance, r/Entrepreneur, r/SaaS, r/digitalnomad, r/Indiehackers) with title options + body + self-promo disclosure per sub rules. Staggered launch sequence + karma protection checklist | ✅ |
| 5 | [HACKER-NEWS.md](./HACKER-NEWS.md) | Title variants, ~970-char submission body, founder's pre-emptive top comment, 10 anticipated technical comments with detailed responses (security, AI routing, LemonSqueezy, OSS, competitive moat), HN-specific anti-patterns + survival rules | ✅ |
| 6 | [EMAIL-LAUNCH.md](./EMAIL-LAUNCH.md) | 3-email sequence (T-24h, T+0, T+24h), subject A/B variants, sending infra (Resend) guidance, anti-spam checklist | ✅ |
| 6 | [EMAIL-LAUNCH-RU.md](./EMAIL-LAUNCH-RU.md) | RU adaptation with Telegram-post alternative format | ✅ |

---

## Important findings during research

### No waitlist endpoint exists
Scanned `src/app/api/`, `src/lib/`, and `supabase/migrations/`. No `waitlist` or `early_access` endpoint/table found.

**Impact:** Email sequence (Task 6) has no current opt-in list to send to. Three workarounds documented in [EMAIL-LAUNCH.md](./EMAIL-LAUNCH.md):
1. Product Hunt "Coming Soon" page subscribers (PH exports list pre-launch)
2. PH Maker email blast (1 launch email to PH followers)
3. Personal network + anyone who emailed `hello@lancerwise.com`

**Recommended remediation (~30 min):** add `/api/waitlist` endpoint + `waitlist_signups` table + homepage email field. Not a launch blocker, but a missed lead-capture signal.

### Launch-time recommendation conflicts with target ship date
Per the agent brief, Ramiz wants to launch "tomorrow evening (Day 2) or Day 3 morning" — that's Sat 2026-05-23 evening Vietnam time = Sat ~8AM PST.

**Saturday is the worst launch day for Product Hunt.** Recommendation: decouple — launch the **site + Twitter + LinkedIn** Day 2-3, but **schedule PH for Tue 2026-05-26 12:01 AM PST** for max upvote window. Detail in [PRODUCTHUNT.md §9](./PRODUCTHUNT.md).

### "Notify me when Business plan launches" mailto inbox
The pricing page has a `mailto:hello@lancerwise.com?subject=Notify%20me%20when%20Business%20plan%20launches` link. Anyone who clicked is a high-intent contact. **Action item:** before launch, search `hello@lancerwise.com` inbox for these emails and add them to launch list.

---

## Channel launch sequence (recommended)

| Day | Channel | Action |
|---|---|---|
| T-7 | PH coming-soon | Live, build subscriber list |
| T-3 | Twitter | Soft tease ("launching next week") |
| T-1 | Email | Email 1 (T-24h) sent to launch list |
| T+0 | Product Hunt | Submit at 12:01 AM PST (Tue) |
| T+0 | Email | Email 2 (launch) sent 30 min after PH live |
| T+0 | Twitter | Hero tweet + 7-tweet thread |
| T+0 | LinkedIn | Long-form post |
| T+0 | r/Indiehackers + r/SaaS | "Show your SaaS" posts |
| T+0 | Hacker News | Show HN submission (one shot — pick best slot) |
| T+1 | Email | Email 3 (thank you + onboarding tip) |
| T+1 | r/freelance | Pain-point focused post |
| T+1 | vc.ru | RU-language product writeup |
| T+2 | r/digitalnomad | Lifestyle angle |
| T+3 | r/Entrepreneur | Founder journey post |
| T+3 | Habr | RU technical writeup |
| T+5 | ВК + Indiehackers.ru | RU follow-ups |
| T+7 | r/sideproject | Week-1 recap |

---

## Tone consistency (applied across all channels)

- First-person founder voice (Ramiz, not "the team")
- No marketing-speak ("revolutionary," "AI-powered" in titles)
- Specific numbers > vague claims ("6 hours/week" not "save lots of time")
- Honest framing of differentiators (free tier price + AI core-flow integration + fresh codebase)
- No fake testimonials or fabricated metrics (per project memory: marketing honesty policy)

---

## Pre-publish checklist (Ramiz's review)

For each channel, before posting:

- [ ] Replace `[PH link]` placeholders with real submission URL
- [ ] Replace `[X]`, `[Y]`, `[Z]` number placeholders post-launch with real metrics
- [ ] Replace `[Hunter handle]` with confirmed hunter's @handle
- [ ] Verify product screenshots are current (last UI changes were PR #189 timezone fix per latest commits)
- [ ] Test email send to yourself before blasting list
- [ ] Confirm `hello@lancerwise.com` inbox is monitored Day 1
- [ ] Schedule Twitter via Buffer/Typefully if not posting manually
- [ ] LinkedIn: post directly (no scheduler — algorithm penalty)
- [ ] HN: one-shot — don't retry. Verify "Show HN:" prefix in title.

---

## Repo

Pushed to: https://github.com/fer-fer-code/lancerwise-screenshots (branch: main)

Commits:
- `0617abb` — PH + Twitter kits
- `65d1771` — LinkedIn drafts
- `39e32fd` — Reddit + HN kit
- (next) — Email sequence + README

— Agent 5, 2026-05-22
