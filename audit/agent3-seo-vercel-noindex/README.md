# [AGENT 3] SEO — block *.vercel.app from search engine indexing

## Source

| Field | Value |
| ----- | ----- |
| Private repo | `fer-fer-code/lancerwise` |
| Commit | [`7bb8f049`](https://github.com/fer-fer-code/lancerwise/commit/7bb8f049) — "seo: block *.vercel.app indexing (3-layer defense)" |
| Files changed | `next.config.ts`, `src/middleware.ts` (+ Vercel API change outside the repo) |
| CI canary | run [25953808599](https://github.com/fer-fer-code/lancerwise/actions/runs/25953808599) — Gate 1 ✓, Gate 2 ✘ (pre-CP-A baseline), Gate 3 ✓ |
| Production deploy | `lancerwise-ol1f9eng1-fer-fer-codes-projects.vercel.app` commit `7bb8f049` state READY |

## Three-layer defense

| # | Layer | Where it fires | What it does |
| - | ----- | -------------- | ------------ |
| 1 | Vercel platform domain redirect | edge, before middleware | Redirect `lancerwise.vercel.app` → `www.lancerwise.com` with explicit `301` (was implicit `308`). Configured via Vercel REST API: `PATCH /v9/projects/{id}/domains/lancerwise.vercel.app` with `{redirect: 'www.lancerwise.com', redirectStatusCode: 301}`. |
| 2 | `next.config.ts redirects()` | Next.js request pipeline | Matches `(?<sub>.*).vercel.app` in Host header → `301` → `https://www.lancerwise.com/:path*`. Covers preview deployments (`prj-hash-team.vercel.app`) that Layer 1 doesn't touch. |
| 3 | `src/middleware.ts` X-Robots-Tag | request-scoped middleware | Stamps `X-Robots-Tag: noindex, nofollow` on every response served from a host not in `CANONICAL_HOSTS = {'www.lancerwise.com', 'lancerwise.com'}`. Defense-in-depth for raw IPs, localhost, or any future non-canonical alias bypass. |

## Pre-existing Vercel protection (still works as before, not changed by this commit)

- `ssoProtection.deploymentType = 'all_except_custom_domains'` — Vercel auth-gates all preview deployment URLs (`*-fer-fer-codes-projects.vercel.app`). Returns 401 + `x-robots-tag: noindex` from the platform.

## Verification — before vs after

See [`curl-before-after.txt`](curl-before-after.txt) for the full curl evidence. Headline:

| URL | Before | After |
| --- | ------ | ----- |
| `https://lancerwise.vercel.app/` | 308 → www.lancerwise.com (implicit) | **301** → www.lancerwise.com (explicit, stronger canonical signal) |
| `https://lancerwise.vercel.app/terms` | 308 → www.lancerwise.com/terms | **301** → www.lancerwise.com/terms |
| `https://www.lancerwise.com/terms` | 200 OK | **200 OK** (unchanged) |
| Preview deploy URL | 401 SSO + noindex (already protected) | **401 SSO + noindex** (unchanged) |
| Raw IP (`Host: 192.168.1.9`) | 200 OK, no X-Robots-Tag | **200 OK + `x-robots-tag: noindex, nofollow`** |

## GSC removal — submitted ✓

After Ramiz graduated the `lancerwise.team@gmail.com` account out of Family Link supervision, the account regained access to Google Search Console. Since the account has **no verified property** for `www.lancerwise.com` (and adding one would require DNS/HTML verification just to submit a one-off removal), I used the **Outdated Content Removal Tool** instead — Google's public tool that doesn't require property ownership.

**Submitted request** (see screenshots below):

- URL: `https://lancerwise.vercel.app/`
- Reason selected: "Обновляю устаревший результат поиска Google в соответствии с изменениями на странице" (Updating an outdated Google search result to reflect page changes)
- Verification word: `Service` — present in the cached search snippet "Terms of Service | LancerWise" but absent from the current vercel.app/ response body (which now just returns "Redirecting...")
- Status: **В ожидании (Pending)**, request date 16 мая 2026 г.

Tool URL: https://search.google.com/search-console/remove-outdated-content

### Why this tool (not Search Console Removals)

- **Search Console Removals** requires a verified property for the exact domain — `lancerwise.team@gmail.com` would need to verify ownership of `lancerwise.vercel.app` (which isn't possible — Vercel owns that DNS).
- **Outdated Content Removal** doesn't require ownership; anyone can submit a removal request as long as the current page either 404s or no longer contains the cached content. Our `vercel.app/` returns 301 → www.lancerwise.com so the cached snippet ("Terms of Service | LancerWise") is no longer on the page → request qualifies.

### Screenshots

- `gsc-removal-submitted.png` — "Запрос отправлен" (Request submitted) confirmation dialog
- `gsc-removal-list-pending.png` — full GSC page after submission
- `gsc-removal-pending-row.png` — viewport zoom on the pending request row showing URL, status "В ожидании", date 16 мая 2026 г., and Cancel link

### Expected outcome

Google typically processes outdated-content requests within ~24 hours. Once approved, the cached snippet for `https://lancerwise.vercel.app/` will disappear from search results. With Layer-1 returning 301 now, Google's next recrawl (1–2 weeks) will additionally merge `vercel.app` URL signals into `www.lancerwise.com`.

If the request is denied (e.g., Google's verifier finds "Service" elsewhere on the page), I'll retry with a more unique word from the cached snippet — `Refresh-URL` location header or similar.

## CI canary on main

```
Run 25953808599  (push event: 7bb8f049 → main)
  ✓  gate / eslint i18n             pass    (baseline 34670 unchanged)
  ✘  gate / locale-purity (ru)      fail    (pre-CP-A locale broken, unrelated to this commit)
  ✓  gate / visual-regression       pass    (no UI surface change)
```

No regression introduced. Gate 2 stays red until CP-A redo merges per `ci-architecture.md` §3.

## Cross-links

- [`curl-before-after.txt`](curl-before-after.txt) — full curl evidence (3 hosts × pre/post)
- Vercel REST API call: `PATCH /v9/projects/prj_OfYhgE1ONf98IhDzAMzspTr7hC1A/domains/lancerwise.vercel.app?teamId=team_1chEHohDYMmF5qKeIHoyczor`
  - Request body: `{"redirect":"www.lancerwise.com","redirectStatusCode":301}`
  - Response: `200 OK` with the updated domain object showing `redirect: 'www.lancerwise.com'` and `redirectStatusCode: 301`
- Step 1-4 qa-gates evidence: [`../qa-infra-step1-evidence/`](../qa-infra-step1-evidence/), [`../qa-infra-step2-evidence/`](../qa-infra-step2-evidence/), [`../qa-infra-step3-evidence/`](../qa-infra-step3-evidence/), [`../qa-infra-step4-evidence/`](../qa-infra-step4-evidence/)
