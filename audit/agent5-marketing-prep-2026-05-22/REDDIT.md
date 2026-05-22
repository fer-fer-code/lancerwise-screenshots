# LancerWise — Reddit launch kit

> **Rule #0:** Reddit smells self-promotion from a mile away. Every draft below is built so the **value comes before the link**. Karma rule: post mostly comments + value, occasional self-promo. If your account is brand-new, do NOT post these — comment for 2 weeks first, build karma, then post.
>
> Each subreddit has its own self-promo rules. Verify them in the sidebar before posting and report any that differ from what's listed here.

---

## 1. r/freelance (~360k members)

**Self-promo rule:** Allowed if you're a regular contributor. Heavily moderated against direct promo without value. Pinned thread sometimes asks "what tools do you use?" — that's the safest insertion point.

**Best posting time:** Tue–Thu 9–11 AM EST.

### Title options
- "I've been juggling 7 tools to run my freelance work — finally built one that replaces them. Lessons learned."
- "What I learned building a CRM specifically for solo freelancers (instead of using small-agency tools)"
- "Free freelancer CRM I built after getting tired of Bonsai's $25/mo — would love feedback"

### Body (~700 chars, no clickbait, educational tone)

```
After 8 years freelancing as a photographer, I realized I was spending almost 4 hours a day on admin: jumping between a time tracker, Google Docs invoice templates, a Notion contract page, a spreadsheet of unpaid invoices, three email inboxes, and Telegram for client chats.

Tried Bonsai, Dubsado, HoneyBook — all of them felt expensive for a solo operator and built around small agencies, not single-person businesses.

So I built one: LancerWise. Free forever for solo (2 clients), $15/mo if you want unlimited + AI features.

The lesson I keep relearning: the cheapest software is the one that consolidates 5 subscriptions into one. Even if the consolidated version is $20/mo, you're net positive if you cancel three $9/mo niche tools.

If anyone wants to try it and tear it apart, I'd love feedback: [link]

Mods: happy to remove the link if not in spirit of the sub. Self-promo disclosure: I built this.
```

### Required self-promo comment (sticky comment on your own post)

```
Quick disclosure: I built LancerWise. Following sub rule [X] on self-promo. Happy to discuss the building process, what didn't work, and what tools I'd recommend instead if it's not a fit for someone.
```

---

## 2. r/Entrepreneur (~3.5M members)

**Self-promo rule:** Strict — link drops get removed. Best play: a founder-journey post that mentions the product near the end, not in the title.

**Best posting time:** Mon–Wed 6–9 AM EST.

### Title options
- "I built a SaaS to scratch my own freelance itch. 6 months in, here's what I got wrong."
- "Going from freelancer to founder while still freelancing: the brutal context-switching tax"
- "Bootstrap diary: what I'd do differently if I started LancerWise again today"

### Body (~1500 chars)

```
Quick context: I'm an 8-year freelance photographer based in Vietnam. Last December I decided to build my own SaaS — partly because I was bleeding 4 hours a day to admin tools, partly because I wanted equity in my own time, not just hourly rates.

Six months in, here's what I got wrong:

1) **Too much "I'll add it later."** I built a feature, shipped, and immediately stacked the next one on top without watching real users use the previous one. Result: 5 of my features are duplicates of better-known patterns from competitors, and 3 of mine have UX gaps I'd have caught if I'd waited.

2) **Underestimated the founder's loneliness loop.** Freelancing is solo too, but you talk to clients daily. When I went heads-down on the product I went 3 weeks without talking to a user. Bad call. The product drifted from real needs.

3) **Pricing fear.** I priced too low and felt guilty raising it. Lesson: free + paid tiers work. Premium-only tiers don't if your audience is broke freelancers like I was.

4) **Building before distribution.** I had 95% of the product before I had any audience. I should have built in public from day one — tweet thread per feature, Reddit post per problem.

5) **AI as feature, not differentiator.** Sticking "AI" on a button doesn't matter. Wiring AI into the unsexy core flows (contract drafting, payment risk scoring, weekly insights) does.

If you're in the same boat — building toward your first launch — happy to compare notes.

(For context: the project is LancerWise, all-in-one freelancer workspace. Launching this week.)
```

### Self-promo follow-up comment

```
For anyone curious about the actual product (instead of the journey): LancerWise is at lancerwise.com — free forever for solo freelancers, $15/mo for Pro with the AI features. I'd genuinely love feedback if you try it.
```

---

## 3. r/SaaS (~280k members)

**Self-promo rule:** Allowed in "Show your SaaS" threads weekly. Direct posts allowed if they're substantive (architecture, pricing, lessons), not link drops.

**Best posting time:** Tue–Thu 8–10 AM EST.

### Title options
- "Show r/SaaS: LancerWise — all-in-one freelancer CRM, multi-provider AI routing, Supabase + Vercel stack"
- "Built a freelance CRM with multi-LLM routing instead of one model — here's why"
- "Multi-currency invoicing was harder than I expected (16 currencies, LemonSqueezy under the hood)"

### Body (~1200 chars — technical/business model focus)

```
**What:** LancerWise — all-in-one freelancer workspace. Invoicing, contracts, CRM, time tracking, leads, AI tools. Launching this week.

**Stack:** Next.js 14, Supabase (Postgres + RLS), Vercel, multi-provider AI routing (Gemini Flash for fast tasks, Claude Haiku for reasoning-heavy, Groq for low-latency chat), LemonSqueezy as MoR for payments.

**Pricing model:**
- Free forever (2 clients) — no credit card
- Pro $15/mo ($12 annual) — 14-day trial
- Business — coming soon

**Why multi-provider AI?** No single model is best at every task. Gemini Flash is cheap and fast for short summaries (briefs, email drafts). Claude Haiku reasons better for contracts and risk scoring. Groq's Llama gives near-instant chat for the advisor. A routing layer picks per-task — costs ~30% less than running everything on one mid-tier model.

**Why LemonSqueezy over Stripe?** MoR model = they handle global VAT/sales tax. As a solo freelancer-founder in Vietnam, I can't afford a full tax compliance setup. LemonSqueezy is the cheapest legal way to sell globally.

**What I'm worried about:** churn at the free → paid boundary. My hypothesis is that the AI features (contracts, advisor) drive the conversion, but I don't have enough data yet to know.

Happy to answer questions on the stack, pricing, or AI routing. Live site: lancerwise.com
```

### Self-promo disclosure
```
Founder here. AMA on the architecture, pricing decisions, or what I'd build differently if I started today.
```

---

## 4. r/digitalnomad (~2.4M members)

**Self-promo rule:** Strict against direct promo. Best angle: lifestyle / "remote freelancer pain" focus, link in comments only.

**Best posting time:** Mon–Wed afternoon UTC (catches Asia + EU).

### Title options
- "Solo freelancing as a nomad: the admin tax is real, and it took me 8 years to do something about it"
- "After 6 visa runs and 12 client time zones, here's how I stopped losing money to admin"
- "Multi-currency invoicing is the unsexy nomad problem nobody talks about"

### Body (~900 chars — lifestyle angle)

```
Been a freelance photographer for 8 years, currently based in Nha Trang. Multi-currency clients (USD, EUR, GBP, RUB, THB, VND — and a few outliers).

The admin tax of nomad freelancing is genuinely bigger than for someone who lives in one country:
- Currency conversion fees on every received payment if you don't bank smart
- Different tax obligations per visa / per country
- Client time zones span 18 hours — async invoicing is mandatory
- Tools mostly designed for US-first or EU-first users (not 16-currency)
- Payment processors that reject your country, your card, or both

The thing that finally clicked for me: consolidate the tooling. I ran a spreadsheet last year — I was paying $73/mo across 7 separate tools, none of which talked to each other.

Built a workspace that does all of it (link in comments per sub rules). Free tier covers the basics, no credit card.

Anyone else solved the multi-currency invoicing problem differently? Genuinely curious.
```

### Comment with link (after post is live)
```
For anyone asking — it's LancerWise (lancerwise.com). Disclosure: I built it. Free tier is generous, Pro is $15/mo. If multi-currency is your real pain, I'd love your feedback.
```

---

## 5. r/Indiehackers (~120k members, also cross-post w/ HN)

**Self-promo rule:** Friendly to launch posts. Build-in-public is a core value here.

**Best posting time:** Tue–Thu morning ET.

### Title options
- "Launched LancerWise this week — solo founder + freelancer building for fellow freelancers"
- "12 months from idea to launch: LancerWise (all-in-one freelance workspace)"
- "Bootstrapped freelancer CRM — Free + $15/mo Pro. Lessons from launch week."

### Body (~1400 chars)

```
**The product:** LancerWise — all-in-one workspace for freelancers. Invoicing, AI contracts, CRM, time tracking, lead pipeline, AI advisor. Free forever for solo, $15/mo Pro.

**The why:** 8 years freelance photographer. Last December I tallied my admin time — almost 4 hours a day jumping between 7 different tools that didn't talk to each other. Year-end taxes was a nightmare of CSV exports and broken spreadsheet formulas.

**The build:**
- Solo, no co-founder
- 6 months part-time while still freelancing
- Stack: Next.js 14 + Supabase + Vercel
- AI is multi-provider routing (Gemini Flash, Claude Haiku, Groq) — picks model per task
- Payments via LemonSqueezy (MoR handles global VAT)
- Languages: EN + RU shipping, more in pipeline

**What worked:**
- Building for myself first — I was user #1 and used the product daily before opening it up
- Multi-provider AI routing — cheaper than one model, better quality per task
- Free forever tier — low-risk activation, removes the "is this worth trying?" friction

**What didn't:**
- Built 60% of features before talking to anyone outside my circle — would do that differently
- Underestimated translation infra cost — RU + EN is ~2x the work I budgeted
- Pricing anxiety. Took me 3 iterations to land on $15/mo Pro

**What's next:**
- Launching on Product Hunt next week (Tue 2026-05-26 PST)
- Native iOS/Android post-launch
- More languages once I have native-speaker users

Link: lancerwise.com — open to feedback, AMA on stack/pricing/launch.
```

---

## 6. Reddit launch sequencing

| Day | Subreddit | Format |
|---|---|---|
| Day 0 (PH launch day) | r/Indiehackers | Build-in-public launch post |
| Day 0 | r/SaaS | "Show your SaaS" post (or weekly thread) |
| Day +1 | r/freelance | Pain-point post (light on promo) |
| Day +2 | r/digitalnomad | Lifestyle angle, link in comments |
| Day +3 | r/Entrepreneur | Founder journey, link near end |
| Day +7 | r/sideproject | Recap post (what happened launch week) |

**Anti-pattern to avoid:** Don't post to all 5 subreddits on Day 0. Reddit's cross-post detection will throttle your reach. Stagger.

---

## 7. Karma protection

- Have a real Reddit account with at least 30 days age + 100+ comment karma before posting any of these
- Post comments on threads in each target sub for 2 weeks before your launch — moderators look at history
- Never edit a post in the first hour (kills algorithm score)
- Respond to every comment within 1 hour for the first 6 hours — drives sustained engagement
- If a mod removes a post: do NOT repost. Message the mod, ask what to fix, repost only with their OK
