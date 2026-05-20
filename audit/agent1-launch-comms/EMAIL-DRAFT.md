# Email Drafts — Launch

**Author:** [AGENT 1]
**Date:** 2026-05-20
**Status:** Draft — not sent.
**Note:** No waitlist appears к exist (verified via Supabase + UI scan). Drafts below assume waitlist may be added later. If not, focus on existing-user notification only.

---

## 1. Welcome email — new signups post-launch (replaces current welcome)

**Note:** The post-signup welcome email is already implemented в `src/app/auth/callback/route.ts` (already в production). Drafts below are alternatives к consider replacing OR augmenting that template, not net-new mass-send emails.

### Subject (EN)

`Welcome to LancerWise — let's set up your business hub`

### Subject (RU)

`Добро пожаловать в LancerWise — давайте настроим ваш бизнес-хаб`

### Body — already implemented в auth/callback/route.ts

The existing welcomeEmailHtml() template (line 65-173) is well-crafted с 3-step setup guide, feature highlights, and CTA. No replacement needed pre-launch. Post-launch optimization tracked в `backlog_subscription_email_provider_consolidation.md` and `backlog_welcome_email_stripe_mention.md`.

---

## 2. Optional waitlist welcome email (if waitlist exists)

**Status:** No production waitlist found. Skip unless feature gets added.

### Plain text

```
Subject: You're on the LancerWise waitlist — launching soon

Thanks for signing up.

LancerWise is the all-in-one business hub for freelancers. CRM + invoices + AI contracts + time tracking, all in one place. Free forever for up to 2 clients.

We're putting the final polish on the public launch right now. You'll be one of the first к know when we're live (within а few days).

In the meantime, if you want к see what we've been building:
— Roadmap: https://www.lancerwise.com/changelog
— Pricing: https://www.lancerwise.com/pricing

Thanks for your patience.
— Ramiz (founder)
```

### HTML version

Use existing welcome email template from `auth/callback/route.ts` as base (already brand-styled, table-based, responsive). Swap copy as needed.

---

## 3. Existing-user launch notification (if existing users predate public launch)

**Audience:** Anyone who signed up during pre-launch / soft-launch window (verify via Supabase auth.users count + creation dates).

### Subject (EN)

`LancerWise is now publicly available — a quick note`

### Body (plain text, EN)

```
Hi {{first_name}},

Quick note: LancerWise is now publicly launched.

What this means for you:
— Your existing account works exactly как before. Nothing к do.
— Pricing is unchanged — free forever for up to 2 clients, $15/mo Pro.
— A few bug fixes + new features shipped pre-launch:
   • Faster dashboard load times
   • Email verification + password reset now route directly to the app
   • Mobile onboarding flow polished
   • Updated Privacy Policy с GDPR Art. 13(2)(d) clarifications

If you've been waiting к invite team members or share с another freelancer — now's а good time. Public visibility means we can support more growth.

Thanks for being an early user. Your feedback shaped many of the decisions that landed pre-launch.

— Ramiz
LancerWise founder
```

### Body (plain text, RU)

```
Привет, {{first_name}}!

Короткая новость: LancerWise теперь публично доступен.

Что это значит для вас:
— Ваш аккаунт работает как обычно. Ничего делать не нужно.
— Цены не меняются — бесплатно навсегда до 2 клиентов, Pro $15/мес.
— Несколько улучшений выкатили перед запуском:
   • Быстрее загружается дашборд
   • Email-верификация и сброс пароля теперь корректно ведут в приложение
   • Полировка мобильного онбординга
   • Обновили Политику конфиденциальности под GDPR Art. 13(2)(d)

Если вы откладывали приглашение коллег или другого фрилансера — сейчас хорошее время. Публичный запуск означает, что мы можем поддержать рост.

Спасибо, что были с нами с раннего этапа. Ваш фидбэк определил многие из решений, что вошли в публичный релиз.

— Рамиз
основатель LancerWise
```

### HTML version

Re-use `welcomeEmailHtml()` structure но без the 3-step "Step 1/2/3 setup" block (existing users don't need it). Keep header gradient + closing CTA к `/dashboard`.

---

## 4. Sender + sending infrastructure

| Item | Value |
|---|---|
| Sender display name | `Ramiz from LancerWise` |
| Sender email | `lancerwise.team@gmail.com` (CF Email Routing) OR `hello@lancerwise.com` (когда DMARC fully aligned per `project_lancerwise_email_infrastructure`) |
| Reply-к | Same |
| Provider | Resend (existing setup, 10/10 mail-tester score) |
| Plain-text fallback | Required (for accessibility + spam-score) |
| Unsubscribe | Required for bulk; one-click List-Unsubscribe header (RFC 2369) |
| List size | Verify auth.users count before sending; if <50 users, can use individual sendEmail() calls; if >50, batch with rate limiting per Resend tier |

---

## 5. Pre-send checklist

- [ ] Subject lines < 50 chars (mobile rendering)
- [ ] Preview text set (first 90 chars of body OR explicit preheader)
- [ ] CTA button text matches landing destination ("Go to dashboard" if linking to /dashboard)
- [ ] List-Unsubscribe header set (required for Gmail/Yahoo bulk-send compliance)
- [ ] DKIM + SPF passing (existing, verified earlier)
- [ ] Test send к founder email first (verify rendering на mail.ru, gmail, outlook)
- [ ] Open + click tracking disabled by default (privacy-respecting; opt-in only)
- [ ] Locale matched к user's `profile.locale` OR `auth.users.user_metadata.locale`

---

## 6. Email NOT к send

| Email | Why not |
|---|---|
| Discount code launch promo | Free forever exists; cheapens value |
| Survey email pre-launch | Premature; ask in-app after 7 days product use |
| Referral program launch | Not built; не tease |
| Mobile app announcement | Doesn't exist (PWA only) |

---

## Cross-references

- `src/app/auth/callback/route.ts` — existing welcomeEmailHtml() template
- `project_lancerwise_email_infrastructure.md` — Resend send setup, 10/10 mail-tester
- `feedback_marketing_honesty_policy.md` — honesty constraints
- `backlog_welcome_email_stripe_mention.md` — Step 2 reword tracked
- `backlog_subscription_email_provider_consolidation.md` — LemonSqueezy email template merge
