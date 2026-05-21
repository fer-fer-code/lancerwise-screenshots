# Infrastructure Verification — Production State

**Author:** [AGENT 1]
**Date:** 2026-05-21
**Method:** READ-ONLY production verification via curl + dig. NO infrastructure changes.
**Trigger:** PART B follow-up к [FINAL-REVIEW.md](../agent1-prelaunch-final-review/FINAL-REVIEW.md) missing-from-checklist items M1, M3, M4, M5.

---

## 1. Security headers — production

**Test:** `curl -sI https://www.lancerwise.com/` + `/register` + `/login` + `/dashboard`

### Verdict per header

| Header | Best-practice baseline | Production state | Verdict |
|---|---|---|---|
| `strict-transport-security` | max-age ≥ 31536000 (1y) | `max-age=63072000; includeSubDomains; preload` (2y) | ✅ EXCEEDS baseline |
| `x-frame-options` | DENY or SAMEORIGIN | `SAMEORIGIN` | ✅ PASS |
| `x-content-type-options` | `nosniff` | `nosniff` | ✅ PASS |
| `referrer-policy` | `strict-origin-when-cross-origin` или stricter | `strict-origin-when-cross-origin` | ✅ PASS |
| `permissions-policy` | reasonable scope restriction | `camera=(), microphone=(), geolocation=()` | ✅ PASS (3 dangerous APIs blocked) |
| `content-security-policy` | **PRESENT** — strict policy с nonces | **MISSING entirely from response headers AND meta tags** | ❌ **P1 finding** |

### CSP investigation detail

Tested на 4 routes: `/`, `/register`, `/login`, `/dashboard` — **no `content-security-policy` header в any response**. Also не emitted via `<meta http-equiv="content-security-policy">` в HTML head.

**Earlier observation reconciled:** my auth-flow audit (`audit/agent1-auth-flow-regression/CONSOLE-ERRORS.md`) reported CSP errors referring к "nonce-h4EwfpLIBGcc6lpokZGvn5". Those errors came от inside the **Cloudflare Turnstile iframe** (`about:srcdoc`), which has its own CSP independent of the parent page. The **parent page has no CSP**.

### P1 finding — CSP missing

**Impact:**
- XSS protection relies solely on framework defaults + `x-content-type-options`
- Inline scripts unrestricted (no script-src whitelist)
- External resource loading unrestricted (no img-src / connect-src whitelist)
- Browser-side mitigations for malicious inline injection weaker than industry baseline

**Severity assessment:**
- Not а launch-blocker (other headers compensate partially; Next.js 16 has decent defaults for inline-script handling via nonces в RSC streaming)
- IS а P1 — should ship pre-launch OR within first week. Many fintech / SaaS DLP frameworks expect CSP

**Recommended action:**
- Add `content-security-policy` к Next.js middleware OR `next.config.js` headers config
- Minimal viable CSP: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' challenges.cloudflare.com *.vercel-insights.com; connect-src 'self' *.supabase.co *.cloudflare.com *.lemonsqueezy.com *.sentry.io *.vercel.com; img-src 'self' data: blob: *.supabase.co; style-src 'self' 'unsafe-inline'; frame-src challenges.cloudflare.com *.lemonsqueezy.com`
- Note: don't use nonce-based strict-dynamic without testing — would break Turnstile iframe + LemonSqueezy iframe + Vercel Analytics

**Effort:** ~30-45 min к add + test all key flows + visual-regression baseline refresh

---

## 2. DNS records — production

**Test:** `dig +short` для each record type

### Verdict per record

| Record | Expected | Observed | Verdict |
|---|---|---|---|
| Apex A (lancerwise.com) | Vercel-managed anycast IPs | `216.150.1.1`, `216.150.16.1` | ✅ Vercel range |
| www CNAME | Vercel-managed CNAME | `645ecb0cbe6d1cb7.vercel-dns-017.com.` | ✅ Vercel-managed |
| MX | Cloudflare Email Routing route MX | 3 records: `route2.mx.cloudflare.net` (pri 36), `route1.mx.cloudflare.net` (86), `route3.mx.cloudflare.net` (90) | ✅ CF Email Routing |
| Apex TXT (SPF) | `v=spf1 include:_spf.mx.cloudflare.net ~all` | `"v=spf1 include:_spf.mx.cloudflare.net ~all"` | ✅ Matches CF EM Routing |

**DNS verdict:** ✅ ALL PASS. Matches `project_lancerwise_email_infrastructure` memory rule (CF Email Routing receive + Resend send).

---

## 3. Email auth records — Resend domain

**Test:** `dig +short` для DKIM + SPF + DMARC

### DKIM

```
resend._domainkey.lancerwise.com TXT:
"p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDDHzJHBT3aTlNTrIxgVTe8/yUqNKgjaoksBcqlVxrwdPstG/SDx1pb8g7in/z5ouVXSgFM9UJAwSZhL7PVJN8caS7dxakbgSXrwsh1TI4MeWCMIq/rPXHtGBxe2kJ9lrQfpuNQqSmLirumVQ96zF+hagJCjZrYjqxUBhQuA0ShKQIDAQAB"
```

✅ Present + well-formed 1024-bit RSA public key.

### SPF (apex TXT)

`v=spf1 include:_spf.mx.cloudflare.net ~all`

✅ Includes CF Email Routing. **Note:** does NOT include Resend's SPF (`include:amazonses.com` или similar). This is **OK** because Resend uses DKIM-only authentication для `lancerwise.com` sender (per Resend's standard config). SPF needs only к authorize the receive side (CF Email Routing).

### DMARC

```
_dmarc.lancerwise.com TXT:
"v=DMARC1; p=none; rua=mailto:legal@lancerwise.com"
```

| Field | Value | Verdict |
|---|---|---|
| `v=DMARC1` | Standard | ✅ |
| `p=none` | Monitor-only mode (no enforcement) | ⚠️ Reporting only — see P3 below |
| `rua=mailto:legal@lancerwise.com` | Aggregate reports к legal inbox | ✅ |

**P3 finding — DMARC enforcement weak:**

`p=none` is а valid policy for initial DMARC deployment (monitoring phase), но does не enforce DKIM/SPF alignment. For production hardening, ramp through `p=quarantine` → `p=reject`.

**Acceptable за current launch state** — mail-tester score 10/10 already confirms deliverability is good. DMARC enforcement is post-launch hardening item.

**Recommended path:**
- T+30 days: review `legal@lancerwise.com` aggregate reports — verify no legitimate mail being misaligned
- T+30 days: bump к `p=quarantine`
- T+60 days: bump к `p=reject` if no false positives

**Severity:** P3 — file as backlog issue.

---

## 4. Smoke protocol + runbook references (added к PRELAUNCH-CHECKLIST via PART A edit)

Rows added к PRELAUNCH-CHECKLIST в companion commit:

| Item | Document | Status |
|---|---|---|
| Smoke testing protocol designed | [`audit/agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md`](../agent1-pre-launch-smoke/SMOKE-TESTING-PROTOCOL.md) | ✅ |
| Launch day runbook | [`audit/agent1-launch-day-runbook/RUNBOOK.md`](../agent1-launch-day-runbook/RUNBOOK.md) | ✅ |
| Post-launch Day 1 runbook | [`audit/agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md`](../agent1-launch-readiness-master/POST-LAUNCH-DAY-1-RUNBOOK.md) | ✅ (updated 2026-05-21) |

---

## Summary

| # | Check | Result |
|---|---|---|
| 1.1-1.5 | 5 of 6 security headers PASS | ✅ |
| 1.6 | content-security-policy MISSING | ❌ **P1 — fix before-launch OR week-1** |
| 2.1-2.4 | DNS records all correct | ✅ |
| 3.1 | DKIM Resend present | ✅ |
| 3.2 | SPF correct (CF Email Routing) | ✅ |
| 3.3 | DMARC present, `p=none` monitor mode | ⚠️ P3 — enforce post-launch ramp |
| 4 | Smoke + runbook docs referenced в PRELAUNCH-CHECKLIST | ✅ added |

### Findings к file as issues

1. **P1 — CSP missing on production** — file new issue с Next.js middleware fix recommendation
2. **P3 — DMARC `p=none` — enforce post-launch** — file new issue с ramp plan
3. ⚠️ LemonSqueezy webhook secret state — PART C: requires LS Dashboard access, surfaced к Ramiz separately

---

## Cross-references

- [`audit/agent1-prelaunch-final-review/FINAL-REVIEW.md`](../agent1-prelaunch-final-review/FINAL-REVIEW.md) — original missing-items list (M1, M3, M4, M5)
- [`audit/agent1-auth-flow-regression/CONSOLE-ERRORS.md`](../agent1-auth-flow-regression/CONSOLE-ERRORS.md) — earlier CSP observation reconciled
- Memory: `project_lancerwise_email_infrastructure` — CF Email Routing + Resend setup
- Memory: `backlog_subscription_email_provider_consolidation` — Resend operational baseline
- Memory: `feedback_marketing_honesty_policy` — applies to mail-tester score claims
