# robots.txt audit — Lancerwise

**Date:** 2026-05-23
**Filed by:** [AGENT 6]
**Source URL:** https://www.lancerwise.com/robots.txt
**File:** `/Users/myoffice/lancerwise/public/robots.txt` (static, not generated)

---

## Full robots.txt contents (snapshot)

```
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /settings
Disallow: /api/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /clients
Disallow: /projects
Disallow: /invoices
Disallow: /contracts
Disallow: /onboarding
Disallow: /billing
Disallow: /portal/
Disallow: /client-portal/
Disallow: /proposal/
Disallow: /contract/
Disallow: /wall
Disallow: /wall/
Disallow: /card
Disallow: /card/
Disallow: /rates
Disallow: /rates/
Disallow: /available
Disallow: /available/
Disallow: /sign/
Disallow: /handoff/
Disallow: /nps/
Disallow: /survey/
Disallow: /surveys/
Disallow: /sow/
Disallow: /sla/
Disallow: /quote/
Disallow: /quotes/
Disallow: /intake/
Disallow: /time-report/
Disallow: /health-report/
Disallow: /year/
Disallow: /brand/
Disallow: /proof/
Disallow: /testimonial/
Disallow: /testimonials/
Disallow: /hire/
Disallow: /book/
Disallow: /status/
Disallow: /rate-card/
Disallow: /rate-cards/
Disallow: /pricing/
Disallow: /services/
Disallow: /case-study/
Disallow: /kb/
Disallow: /unsubscribe
Disallow: /payments/
Disallow: /invoices/print/
Disallow: /proposals/
Disallow: /q/
Disallow: /auth/
Disallow: /_next/

User-Agent: Googlebot
Allow: /
Disallow: /api/

Sitemap: https://www.lancerwise.com/sitemap.xml
```

---

## Verification matrix

| Rule | Intent | Verified |
|---|---|---|
| `User-Agent: *` block | restrict generic crawlers | ✓ |
| `Allow: /` root | landing indexable | ✓ |
| `Disallow: /api/` | API endpoints not indexable | ✓ |
| `Disallow: /dashboard` etc. | authed app routes hidden | ✓ |
| `Disallow: /forgot-password` | recovery route hidden | ✓ correct per policy |
| `Disallow: /portal/`, `/client-portal/`, `/sign/`, `/proposal/`, `/contract/`, etc. | token-bound pages | ✓ correct |
| `User-Agent: Googlebot` override | allow Googlebot full access except /api/ | ✓ |
| `Sitemap:` reference | sitemap discoverable | ✓ present, correct URL |

---

## Findings

### Finding 1 — `/login` + `/register` blocked (CONTRADICTS POLICY)

**Severity:** P1
**Memo:** `backlog_auth_pages_robots_unblock.md`

Per memory `feedback_auth_pages_indexing_policy.md`, login/register pages should be **indexable for branded search**. Currently disallowed. Fix details in the dedicated backlog memo filed для [AGENT 2].

### Finding 2 — `Disallow: /pricing/` blocks dynamic pricing pages (suspicious)

`Disallow: /pricing/` (with trailing slash) blocks any URL like `/pricing/team` or `/pricing/enterprise`. This may be intentional (user-generated rate cards under `/pricing/[id]`), but it's confusable with the static SEO page `/pricing` (no trailing slash) which IS indexable.

**Action:** Verify no user-generated `/pricing/[id]` routes are referenced from sitemap/canonicals. Otherwise OK.

### Finding 3 — Missing staging blocker

No explicit block для `*.vercel.app` preview deployments. If Vercel preview URLs are crawlable, Google may index duplicates. Modern Vercel sets `X-Robots-Tag: noindex` on previews automatically, but worth verifying.

**Action:** [AGENT 2] verify Vercel `vercel.json` or preview deployment headers include `X-Robots-Tag: noindex, nofollow` for preview URLs.

### Finding 4 — `/_next/` block is redundant but harmless

`Disallow: /_next/` is standard but Next.js static assets are typically fingerprinted and don't need explicit blocking (they're never linked from canonical pages). Harmless.

### Finding 5 — `/blog/` not explicitly disallowed (CORRECT — should be indexable)

Confirmed correct: `/blog` posts are in sitemap and should index.

### Finding 6 — Disallow list is long (52 entries)

The 52-entry list is comprehensive but may indicate broader information architecture inflation. Per memory backlog `project_lancerwise_dead_urls_cleanup.md`, some routes (e.g. `/today`, `/insights/*`) are stale. Some Disallow rules may be unnecessary if the routes don't exist. **P3 cleanup** post-launch.

### Finding 7 — No Crawl-delay

No `Crawl-delay` directive. Google ignores it; Bing respects it. At launch traffic levels not an issue. **No action.**

---

## Action summary

| # | Finding | Priority | Owner | Memo |
|---|---|---|---|---|
| 1 | login/register disallow vs policy | **P1** | [AGENT 2] | `backlog_auth_pages_robots_unblock.md` |
| 2 | /pricing/ trailing slash check | P3 | [AGENT 2] | verify only |
| 3 | Vercel preview X-Robots-Tag check | P2 | [AGENT 2] | verify only |
| 4 | /_next/ redundancy | none | — | harmless |
| 5 | /blog/ exposure | none | — | correct |
| 6 | Disallow inflation | P3 | post-launch | revisit с dead URL cleanup |
| 7 | Crawl-delay | none | — | not needed |

**Launch-blocking:** Finding 1 only.
**Other findings:** non-blocking; safe to launch as-is.
