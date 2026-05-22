# LancerWise — Hacker News Show HN kit

> **Brutal honesty:** HN is the toughest launch venue. Audience is technical, skeptical, and allergic to marketing speak. The product gets dissected; the founder either survives the comments or doesn't. Below is structured for survival.
>
> **Launch slot:** Tue–Thu, 9:00–10:30 AM Pacific. This catches US morning + EU mid-afternoon. Worst slot: Friday afternoon Pacific.
> **Don't:** post on weekends. Posts die quietly.

---

## 1. Title

```
Show HN: LancerWise – Freelancer CRM with AI invoice generation and contracts
```

(78 chars, fits HN's 80-char limit)

**Variant A (more concrete):**
```
Show HN: LancerWise – I built a freelancer CRM after 8 years of duct-taping tools
```

**Variant B (technical hook):**
```
Show HN: Freelancer CRM with multi-LLM routing (Gemini Flash + Claude + Groq)
```

Recommendation: **primary title** is safest. It states the category + the differentiating feature without overselling. Variant A is fine if Ramiz wants the story angle (HN occasionally rewards this); Variant B is risky — multi-LLM routing isn't novel enough to be the hook by itself.

---

## 2. Submission body (URL: https://www.lancerwise.com)

HN allows a "text" field below the URL. Keep it short — long submission text is read as desperate. Three paragraphs max. Avoid bullet lists in the submission body (they look like product-page copy).

```
Hi HN — I'm Ramiz, an 8-year freelance photographer based in Vietnam. LancerWise is an all-in-one workspace I built to replace the 7 tools I'd been juggling (invoicing, contracts, CRM, time tracker, spreadsheets, etc.). Free forever for solo work; $15/mo Pro adds unlimited + AI features.

Stack: Next.js 14 + Supabase (Postgres w/ Row-Level Security) + Vercel. AI is multi-provider — Gemini Flash for short-form (briefs, emails), Claude Haiku for reasoning (contract drafting, risk scoring), Groq for low-latency chat (the in-app advisor). Routing layer picks per task. Payments via LemonSqueezy (MoR — they handle global VAT).

I built this for myself first and used it daily for Q1 to run my own freelance work. Honest feedback wanted, especially from anyone who's used Bonsai/Dubsado/HoneyBook and can tell me what I'm missing. Happy to answer questions on the stack, pricing, or AI routing.
```

(~970 chars — well under HN's practical "stop reading" threshold)

---

## 3. First top-level comment (posted by Ramiz immediately after submission)

This is your insurance policy. HN often reads the first comment before the post body. Make it credible.

```
Founder here. A few things I'd preempt:

1. The "freelancer CRM" space is crowded. My pitch isn't novelty — it's the consolidation of features into one workspace at a lower entry price, with AI wired into the unsexy core flows instead of bolted on as a chatbot.

2. On data security: every table has Postgres RLS at the database level, not just in app code. If our app has a bug, the DB itself blocks cross-tenant reads. Full GDPR data export from settings.

3. On AI: not training on user data, not sending data to third-party providers for retention/training. Anthropic, Google, and Groq all have zero-retention contracts on our tier.

4. On pricing sustainability: free tier is gated (2 clients) so the unit economics work even at scale. Pro at $15/mo with AI usage is profitable per-customer; I've checked the math.

5. What I'd most appreciate feedback on: onboarding. New users currently land on a busy dashboard. I'm not sure that's right. Open to better patterns.

— Ramiz
```

---

## 4. Anticipated comments + responses

HN comments tend to fall into 6 categories. Pre-draft responses so you reply within ~10 minutes (engagement velocity matters for ranking).

### Q1 — "How is this different from [Bonsai/HoneyBook/Dubsado]?"

```
Three things, honestly:

1. Pricing — Bonsai starts at $25/mo with no truly free tier, Dubsado is $20/mo+ and pricing tiers feel like upsell traps, HoneyBook is wedding-vendor-flavored ($19+). We're free forever for solo with no credit card to start.

2. AI as actual feature — most competitors' AI is either a chatbot tab or a single text-completion field. Mine wires AI into 6 places: contract drafting, proposal brief generation, client email composer, payment risk scoring, weekly business insights, freelance advisor with access to your real data.

3. Codebase age — fresh stack on Next.js 14 + Supabase RLS, no 2017 legacy. Lighter, faster, easier to iterate.

I'm not claiming we beat them on every axis. Bonsai has more integrations. HoneyBook has better wedding-vendor templates. We're better at AI + price + speed.
```

### Q2 — "Why should I trust a solo founder won't disappear in 12 months?"

```
You shouldn't, blindly. What I can offer:

- Full GDPR data export from day one, in settings. No lock-in.
- Bootstrapped, no investor pressure to pivot or shut down.
- Solo founder == low burn. I can sustain the product on revenue from a low subscriber count.
- If I ever decide to wind down, I'll open-source the codebase and give 90 days notice for migration. Putting that in the ToS this week as a commitment.

Worst case for you: your data leaves with you. That's the strongest guarantee I can give.
```

### Q3 — "Why LemonSqueezy and not Stripe?"

```
Two reasons:

1. Merchant of Record. LemonSqueezy handles global VAT/sales tax on every sale. I'm one person in Vietnam — I can't operate a 30-jurisdiction tax compliance setup.

2. Payouts to Vietnam — Stripe doesn't fully support Vietnam as a Stripe Atlas alternative. LemonSqueezy does.

Trade-off: their fees are higher (5%+ vs Stripe's 2.9%). For my volume, the compliance savings outweigh the fee delta. If I grow into a multi-jurisdiction entity, I'll revisit.
```

### Q4 — "Multi-LLM routing sounds like overengineering. Why not just Claude?"

```
Fair pushback. The justification:

- Per-task cost: Gemini Flash is ~10x cheaper than Claude Haiku per token. For short-form tasks (3-sentence email drafts, summary briefs), the quality delta is invisible to users, the cost delta is real.
- Latency: Groq Llama serving is sub-second for short chat. Claude Haiku is 2-4s. For the in-app advisor, latency matters more than reasoning depth.
- Quality: For contract drafting and risk scoring, Claude reasons better than Gemini on the structured outputs. I tested all three on a 50-prompt eval set.

It IS extra complexity — feature flag per provider, fallback chains, observability. Worth it at my volume. Might not be worth it at <100 users; I'd just pick one.
```

### Q5 — "Source code? Open source plan?"

```
Closed source today. Honest answer: I don't have a strong moral argument for OSS-ing a small SaaS while bootstrapping — the code itself isn't the differentiator, the product is.

Things I will commit to (and putting in writing in ToS):
- Full data export, all tables, JSON + CSV
- 90-day shutdown notice if I ever wind down
- Open-source the codebase on shutdown so users can self-host

If LancerWise gets to ~$100k MRR sustainable, I'd reconsider OSSing parts.
```

### Q6 — "What's your AUM/MRR/users? Be specific."

```
Pre-launch as of today. ~120 beta signups, ~30 active weekly. Public launch is Tue 2026-05-26 on Product Hunt. I'll post a recap thread here with real numbers after week 1.
```

### Q7 — "Why Next.js + Vercel + Supabase — isn't this just the 'every YC startup' stack?"

```
Yes, deliberately. I'm a solo founder. The boring, well-trodden stack means I spend zero time on devops mysteries and can focus 100% on product. If I were running a 50-engineer team, I'd probably make different choices for org-scaling reasons. As a solo, "boring works" beats "clever works."

Vercel limits I've already hit: 100 deploys/day (workaround = batch features), edge function memory cap (workaround = move some functions to Node runtime). Manageable.
```

### Q8 — "What's stopping someone with more capital from cloning this in 3 months?"

```
Not much, structurally. The defense isn't "moat" — it's:
- Speed of iteration (solo founder = fast)
- Distribution flywheel (build in public, community, integrations)
- Brand trust over time

The honest competitive answer: pure tech moats don't exist for crud SaaS. The freelance CRM space has had 8+ competitors for 10+ years and none have monopoly. There's room for a fresh take that's better-priced and better-AI'd.
```

### Q9 — "Self-hosting option?"

```
Not yet. Would consider it for a Business tier ($X/mo + Y self-host). Would need to be confident the product is stable enough that I'm not pushing broken builds to self-hosters. Maybe 6 months out.
```

### Q10 — "Why is this for 'freelancers' specifically when it could be for any solo business?"

```
True — the core schema (clients, projects, invoices, time entries) is generic. "Freelancer" is the positioning, not the only addressable market. Solo consultants, small agencies, contractors, and service providers all fit.

I led with "freelancer" because:
1. SEO — "freelancer CRM" is a specific search intent
2. Resonance — I am one, my marketing voice is more authentic to fellow freelancers
3. Positioning vs competitors — Bonsai owns "freelance," HoneyBook owns "wedding vendor"

If I were targeting consultants specifically, the UI would have different defaults. The schema doesn't care.
```

---

## 5. Things to NOT do on HN

- ❌ Use marketing speak ("revolutionary," "game-changer," "AI-powered")
- ❌ Bullet-heavy submission body
- ❌ Beg for upvotes / mention upvoting at all
- ❌ Reply with one-liners — HN expects detailed answers
- ❌ Argue with hostile commenters. Acknowledge, address, move on
- ❌ Edit the post URL after submission (kills the post)
- ❌ Post on Friday afternoon or weekends
- ❌ Pre-game with friends upvoting in the first 10 min (HN detects this — instant flag)

---

## 6. Survival rules

- Reply to **every** top-level comment within 10 minutes for the first 2 hours
- Take real criticism seriously. If a commenter spots a bug — fix it in real time, post a follow-up
- If post hits flagged status, it's almost always recoverable by quietly addressing whatever triggered the flags (often: missing "Show HN:" prefix, dead link, or perceived self-promo)
- If post doesn't make front page in 2 hours, it won't. Don't ask for upvotes; move on, post on Reddit/PH instead
- Save the comment thread to a file post-launch — best feedback corpus you'll get for free

---

## 7. Post-launch followup

After 48 hours, post on r/sideproject OR Indie Hackers with a "Show HN week-1 recap": numbers, what surprised, what broke. HN audience returns for honest debriefs.
