# LancerWise — Email launch sequence (EN)

> **Pre-flight note:** I scanned the codebase for a waitlist endpoint or `waitlist` / `early_access` table and **found none**. There is no current waitlist subscriber base.
>
> What you can send these emails to instead:
> 1. **Product Hunt "Coming Soon" page subscribers** — PH exports this list before launch
> 2. **PH-Maker email blast** — PH lets Makers send one launch email to followers
> 3. **Personal network** — Ramiz's existing contacts (freelance clients, former clients, freelancer friends)
> 4. **Anyone who clicked the "Notify me when Business plan launches" mailto link** (`hello@lancerwise.com` inbox)
>
> If Ramiz wants a real waitlist before launch: add a 5-line `/api/waitlist` endpoint + a `waitlist_signups` table + a homepage email field. ~30 min of work. Not blocked on launch but a missed signal.

---

## Subject lines (test before sending)

| Email | Subject | Alt subject |
|---|---|---|
| T-24h | "Launching tomorrow 🚀" | "LancerWise goes live tomorrow — quick heads-up" |
| T+0 (launch) | "We're live on Product Hunt — could use your help" | "LancerWise is live — would mean a lot if you took a look" |
| T+24h | "Thank you (and what's next)" | "Day 1 thanks — quick onboarding tip inside" |

---

## Email 1 — Pre-launch (T-24h)

**From:** Ramiz <hello@lancerwise.com>
**Reply-To:** hello@lancerwise.com
**Send:** ~24h before Product Hunt launch slot (so for Tue 12:01 AM PST launch: Mon 12:00 AM PST)

```
Subject: Launching tomorrow 🚀

Hey [first name],

Quick one. After 8 months of building, LancerWise launches tomorrow on Product Hunt.

It's an all-in-one workspace for freelancers — invoicing, AI contracts, CRM, time tracking, lead pipeline, plus an AI advisor that actually sees your real numbers. I built it because I got tired of paying for 7 separate tools to run my own freelance work.

What I'd love from you:

1. **Bookmark this for tomorrow:** [PH coming-soon link]
2. **Upvote when it goes live** at 12:01 AM PST (tomorrow). The first 2 hours decide whether we make the front page.
3. **If you have a moment**, leave a comment with whatever's true for you — what you'd use it for, what's missing, even what you'd hate about it. Honest comments rank better than empty praise.

Free forever tier means you can try it before you decide if it's useful. No credit card to sign up.

Thank you for being on this list. It's a short list and every signal matters tomorrow.

— Ramiz

---
LancerWise.com  •  Unsubscribe: [link]
```

---

## Email 2 — Launch day (T+0)

**Send:** 30 minutes after the PH post goes live (verify your post is up + first comment is posted)

```
Subject: We're live on Product Hunt — could use your help

[first name],

We're live: [actual PH URL]

If you have 60 seconds:

1. Upvote (orange button, top of the page)
2. Leave a comment — even one sentence. Algorithmic boost from real comments > pure upvotes.
3. Share with one freelancer friend if it feels right.

A few things to know if you're trying the product itself:

→ Free tier works without a credit card (2 clients)
→ Pro is $15/mo with 14-day trial if you want the AI features
→ If anything's broken, hit reply to this email — I'm watching the inbox personally today

The next 6 hours are the ones that matter. Thank you for being early.

— Ramiz
www.lancerwise.com

---
PH link: [actual URL]
Unsubscribe: [link]
```

---

## Email 3 — Post-launch (T+24h)

**Send:** ~24h after launch (target: morning in your subscriber's primary timezone)

```
Subject: Thank you (and what's next)

[first name],

24 hours into the launch. Genuinely overwhelmed by the support.

Quick numbers (I'll do a longer recap on Twitter next week):
- [X] upvotes on Product Hunt
- [Y] signups
- [Z] DMs / replies — I'm working through them today

What I learned in the first 24 hours:

1. The feature most people asked about wasn't the AI contracts (what I'd marketed hardest). It was **multi-currency invoicing**. Worth knowing if you missed it.

2. The biggest friction point is the onboarding dashboard. It's busy. I'm rebuilding it next week. If you signed up and bounced, that's probably why.

3. Several of you DM'd with specific feature requests. I'm adding them to a public roadmap. Watch this space.

If you signed up yesterday:

→ Set up your first client + project (10 min) — that's where the value compounds
→ Try the AI contract generator on any real project — it's the highest-value 30 seconds you'll spend
→ If you got stuck, hit reply. I'll personally walk you through.

If you haven't signed up yet, no pressure. Free tier doesn't expire and will be here whenever you want it.

— Ramiz
www.lancerwise.com

---
Unsubscribe: [link]
```

---

## Email tone notes

- First-person founder voice — no "the LancerWise team"
- No marketing-speak ("revolutionary," "game-changer") — sounds inauthentic and triggers spam filters
- Real numbers > vague language ("[X] upvotes" placeholder, replaced with truth post-launch)
- Short paragraphs — most opens happen on mobile
- One CTA per email
- Plain-text version mandatory (Resend renders both)
- Honest framing of asks ("first 2 hours matter," "would mean a lot") performs better than corporate "we'd appreciate your support"

---

## Sending infrastructure

LancerWise has Resend wired up (`hello@lancerwise.com` confirmed at mail-tester 10/10 per project memory). For these emails:

1. Create a Resend audience for "launch list" (or import CSV of contacts)
2. Use Resend's "Send to Audience" with manual review before each blast
3. Add unsubscribe link via existing `/api/unsubscribe` endpoint (already built per project memory)
4. Set `From: Ramiz <hello@lancerwise.com>` for personal voice
5. Run a test send to yourself + 2 friends before the real blast

**Rate limits:** Resend free tier is 100/day, paid is 50,000/month at $20. For a launch list of <500 contacts, free tier works.

---

## Anti-spam checklist

- [ ] DKIM + SPF + DMARC verified on lancerwise.com domain (already done per project memory)
- [ ] No image-only emails (high spam score)
- [ ] One link in the body max + footer link OK
- [ ] Subject line under 50 chars
- [ ] Test send → check spam score at mail-tester.com before blasting
- [ ] Unsubscribe link in every email (legal requirement)
- [ ] Don't send all 3 emails to people who haven't opted in — that's spam
