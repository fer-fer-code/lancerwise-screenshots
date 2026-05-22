# LancerWise — Product Hunt launch kit (EN)

**Launch URL:** https://www.lancerwise.com
**Founder:** Ramiz (freelance photographer/videographer, based in Nha Trang, Vietnam)
**Category:** SaaS / Productivity / Freelance Tools

---

## 1. Tagline candidates (50–60 chars)

Test on a small audience first. Goal: emotional pull + clarity, not buzzwords.

| # | Tagline | Chars | Hook |
|---|---|---|---|
| 1 | The CRM that runs your freelance business while you work | 56 | "while you work" — pain-pull |
| 2 | All-in-one freelancer CRM with AI that actually saves time | 58 | anti-AI-hype framing |
| 3 | Free freelancer CRM. AI contracts, invoices, time tracking | 58 | leads with "free" |
| 4 | Built by a freelancer who got tired of 7 separate tools | 56 | maker story |
| 5 | Invoices, contracts, clients — without the spreadsheet pain | 59 | pain-first |
| 6 | One workspace for every paid hour you bill | 43 | minimalist |
| 7 | The freelancer CRM your future self will thank you for | 56 | aspirational |

**Recommended for primary launch:** #2 — "All-in-one freelancer CRM with AI that actually saves time"
**Backup for A/B test in comments:** #4 (story-led) and #5 (pain-led)

---

## 2. Description (260 char limit)

LancerWise replaces the 7 tools every freelancer juggles — invoicing, contracts, CRM, time tracking, proposals — with one workspace. AI drafts your contracts, generates briefs from messy notes, and writes client emails. Free forever for solo work.

(257 chars — fits)

---

## 3. Maker's first comment (~1500 chars)

Hey Product Hunt 👋

I'm Ramiz. For the last 8 years I've been a freelance photographer/videographer — currently shooting from Nha Trang, Vietnam.

Last December I sat down to do my year-end taxes and realized I'd spent **more time managing my freelance business than doing the actual work**. Time tracker in one tab. Invoice template in Google Docs. Contracts in a Notion page I'd duplicate every time. Client notes scattered across WhatsApp, Telegram, and three email accounts. A spreadsheet with broken formulas tracking who owed me what.

I tried Bonsai, Dubsado, HoneyBook. All of them felt built for one kind of freelancer (designers, photographers, wedding planners) — and priced like SaaS for a small agency, not for someone earning between gigs.

So I built LancerWise — for me first, and then for anyone else tired of the same mess.

What's in it:
- **CRM + client portal** — every conversation, file, and invoice in one place per client
- **AI contracts** — describe a project in plain English, get a signable contract in 30s
- **AI proposal briefs** — paste messy meeting notes, get a structured client-ready brief
- **Invoicing with online payments** — LemonSqueezy under the hood, multi-currency
- **Time tracking + Pomodoro** — auto-converts hours into invoice line items
- **Lead pipeline (Kanban)** — drag leads through stages, convert to client when you win
- **AI freelance advisor** — chat with an assistant that actually sees your numbers

Free forever for solo freelancers (2 clients). Pro is $15/mo with no contract — cancel anytime. No credit card to sign up.

I'd love feedback from anyone else who's had to glue a freelance business together with duct tape. AMA below 👇

— Ramiz

(1483 chars)

---

## 4. "What problems does LancerWise solve?"

- **Tool sprawl** — replaces 5–7 separate apps (invoice generator + contract template + time tracker + CRM + proposal doc + tax tracker + client portal) with one workspace
- **Manual admin tax** — automates the repetitive work (recurring invoices, payment reminders, contract drafting, weekly insights) so you can bill more hours instead of doing unpaid admin
- **AI that's actually useful** — not a chatbot pretending to be a feature. AI drafts contracts, turns meeting notes into project briefs, writes client emails, and scores client payment risk based on your real history
- **Hidden money leaks** — surfaces unbilled hours, overdue invoices, projects running over budget, and clients you should follow up with before they ghost
- **No-cost entry** — free forever tier with 2 clients means you don't gamble money on tooling before you have steady income

---

## 5. "How will it benefit your users?"

- **Save 5–10 hours of admin per week** — the average freelancer burns this on context-switching between tools. LancerWise puts everything in one tab.
- **Get paid faster** — automated reminders, partial payments tracking, online payment links, and overdue-invoice alerts mean less awkward "did you see my invoice?" emails
- **Sign clients faster** — AI contracts ready in under a minute. Proposal accept/decline flow means clients sign on their phone, not on email threads
- **Make better business decisions** — weekly AI insights look at your real revenue, utilization, and pipeline. The freelance advisor answers questions like "should I raise my rates?" with actual data
- **Work from anywhere** — PWA, mobile-friendly, 16 currencies, English + Russian UI

---

## 6. First 10 anticipated hunter questions + answers

**Q1: How is this different from Bonsai / Dubsado / HoneyBook?**
A: Three things. (1) Free forever tier with no credit card — Bonsai is $25/mo entry, Dubsado is $20+, HoneyBook is $19+. (2) AI is built into the core flows, not a marketing label — contracts, briefs, emails, advisor, risk scoring, weekly insights. (3) Built by a working freelancer in 2026, not retrofitted from a 2017 codebase. Faster, lighter, no legacy bloat.

**Q2: What's the pricing model?**
A: Free ($0/mo, 2 clients, basic invoicing, time tracking, contracts). Pro ($15/mo or $12 annual, unlimited everything + AI features + online payments + 14-day trial). Business (coming soon — multi-seat, white-label portal, public API).

**Q3: Where's my data stored? Is it secure?**
A: Supabase (Postgres + Row-Level Security on every table). Hosted on Vercel. RLS means even if our app code has a bug, the database itself blocks one user from seeing another's data. Full GDPR data export from settings. We never sell or share data.

**Q4: Which AI model do you use?**
A: A multi-provider routing layer — Gemini Flash for fast/cheap tasks (briefs, emails), Claude Haiku for contracts and reasoning-heavy work, Groq for low-latency chat. We pick the right model per task instead of forcing one model to do everything.

**Q5: Can clients pay invoices online?**
A: Yes on Pro. Each invoice gets a public payment link — client clicks, pays by card. We're using LemonSqueezy as the merchant of record (so they handle VAT/sales tax compliance globally).

**Q6: Do you have a mobile app?**
A: Progressive Web App (PWA) — install it from your browser, get app-like behavior, push notifications. Native iOS/Android is on the post-launch roadmap.

**Q7: Can I import data from another tool?**
A: Bulk CSV import for clients (with column mapping + dedup). Invoice import is on the roadmap. If you're migrating from Bonsai/HoneyBook, email me — I'll help.

**Q8: Is it just for designers / photographers / [specialty]?**
A: No. I'm a photographer, but the schema is generic — works for developers, designers, writers, consultants, coaches. The use-case pages show how it fits each.

**Q9: What languages does it support?**
A: English and Russian fully translated. More on the way — translation infra is in place, so I can add languages once I have native-speaker users to validate.

**Q10: How do I know you'll still be around in a year?**
A: Honest answer — you don't, with any SaaS. What I can tell you: full data export from day one, no lock-in, I'm bootstrapping (no investor pressure to pivot/shut down), and pricing is set to be sustainable at low volumes. Worst case, your data leaves with you.

---

## 7. Gallery captions (5–7 images)

1. **Dashboard hero** — "Every active project, hour, and invoice in one view. No more 7-tab Tuesday."
2. **AI contract generator** — "Describe the project in plain English. Get a contract ready to sign in under 30 seconds."
3. **Client portal** — "Your client gets one link. They see invoices, contracts, files, and a place to leave feedback. You stop forwarding emails."
4. **Time tracker + Pomodoro** — "Track time the way you actually work. Pomodoro built in. Hours convert into invoice line items with one click."
5. **AI Freelance Advisor** — "Ask 'should I raise my rates?' or 'which client is the most profitable?' — it answers with your actual data."
6. **Lead pipeline (Kanban)** — "Drag leads from 'first email' through 'won.' Convert to client when you close. Track conversion rate over time."
7. **Pricing** — "Free forever for solo freelancers. Pro is $15/mo, cancel anytime. No credit card to start."

---

## 8. Topic tags (suggested)

Primary: `SaaS`, `Productivity`, `Freelance`
Secondary: `Invoicing`, `Time Tracking`, `CRM`, `Artificial Intelligence`, `Small Business`

---

## 9. Best launch time

**Recommended: Tuesday or Wednesday, 12:01 AM PST.**

Reasoning:
- Sunday 12:01 AM PST is the classic legacy advice, but PH traffic has shifted — Tue/Wed get more total upvotes and more enterprise/SaaS audience attention in 2025–2026
- Avoid Monday (US holiday risk + slow start)
- Avoid Friday/Saturday (lower engagement, decisions happen Mon)
- 12:01 AM PST gives you a full 24h window before reset

Concrete next launch slots (PST):
- Tue 2026-05-26, 12:01 AM PST
- Wed 2026-05-27, 12:01 AM PST

If Ramiz launches Day 2 evening (Sat 2026-05-23 evening Vietnam time = Sat 8am-ish PST), that's a Saturday launch — **not ideal for PH**. Consider decoupling: launch site/Twitter on Day 2, schedule PH for Tue 2026-05-26.

---

## 10. Pre-launch checklist

- [ ] PH "Coming Soon" page live ≥ 7 days before launch (build subscriber list)
- [ ] Hunter (someone with PH karma) lined up — DM 2–3 candidates 48h ahead
- [ ] First 20 supporters notified to upvote in first 2h after launch (timezone-staggered)
- [ ] Twitter announce tweet drafted + scheduled for launch hour
- [ ] LinkedIn post drafted
- [ ] All gallery assets compressed (<2MB each)
- [ ] Maker comment drafted (this doc, section 3)
- [ ] First 10 FAQ answers drafted (section 6)
- [ ] hello@lancerwise.com inbox monitored Day 1
- [ ] Crash budget: 10x normal traffic spike — test landing page perf
