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

## Remaining manual step — GSC URL Removal (BLOCKER for AGENT 3)

The Chrome session connected via CDP on this machine is signed in to a **Family Link supervised Google account** ("supervised until age 13"). It cannot access Google Search Console — Google returned `https://families.google.com/service-restricted` instead of GSC. Snapshot:

```yaml
- heading "Сервис недоступен"
- text: "Ты не можешь пользоваться этим сервисом, пока тебе не исполнится 13 лет…"
```

**Ramiz, please action this manually (5 minutes):**

1. Open https://search.google.com/search-console while signed in to the adult-owner Google account that has GSC access for www.lancerwise.com
2. Pick the `www.lancerwise.com` property
3. Left sidebar → **Indexing** → **Removals**
4. Click **New Request** → **Temporarily remove URL** tab
5. Enter `https://lancerwise.vercel.app/` → choose "Remove all URLs with this prefix" → **Next** → **Submit**
6. Optional: also submit `https://lancerwise.vercel.app/terms` if it still shows in Search Console's Pages report

Effect: Google removes the URL from search results within ~24 hours and de-indexes permanently during the next recrawl (typically 1-2 weeks). With Layer-1 returning 301 now, Google will treat all `vercel.app` URLs as moved-permanently → www.lancerwise.com and merge their indexing signals into the canonical.

Without this manual step, the 3-layer fix still works long-term — Google's natural recrawl will eventually catch the 301 and drop the vercel.app entry from the index — but it takes weeks instead of days.

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
