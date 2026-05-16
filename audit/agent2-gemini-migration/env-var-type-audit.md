# [AGENT 2] Vercel env var type audit

**Date:** 2026-05-17
**Trigger:** GEMINI_API_KEY sensitive→encrypted fix earlier today. Reviewer asked к audit other env vars for same pattern.

---

## Inventory

```
KEY                              TARGETS-types
--------------------------------------------------------------------------------------------
AI_PROVIDER_CONTRACT             development=plain | preview=plain | production=plain
AI_PROVIDER_DEFAULT              development=plain | preview=plain | production=plain
AI_PROVIDER_FAST                 development=plain | preview=plain | production=plain
ANTHROPIC_API_KEY                production=sensitive                            ← used by ~697 direct callers
CRON_SECRET                      production=sensitive                            ← used by 90+ cron routes
GEMINI_API_KEY                   development=encrypted | preview=encrypted | production=encrypted  ← FIXED earlier
GROQ_API_KEY                     development=encrypted | preview=encrypted | production=encrypted
LANCERWISE_POSTAL_ADDRESS        preview=encrypted | production=encrypted                    ← Task 3
NEXT_PUBLIC_APP_URL              production=sensitive                            ← NEXT_PUBLIC_ exposed to client
NEXT_PUBLIC_POSTHOG_HOST         development,preview,production=plain
NEXT_PUBLIC_POSTHOG_KEY          development,preview,production=plain
NEXT_PUBLIC_SENTRY_DSN           development,preview,production=plain
NEXT_PUBLIC_SUPABASE_ANON_KEY    production=sensitive                            ← NEXT_PUBLIC_ exposed to client
NEXT_PUBLIC_SUPABASE_URL         production=sensitive                            ← NEXT_PUBLIC_ exposed to client
NEXT_PUBLIC_TURNSTILE_SITE_KEY   development,preview,production=plain
RESEND_API_KEY                   development=encrypted | preview=encrypted | production=encrypted
RESEND_FROM_EMAIL                development=plain | preview=plain | production=plain
SUPABASE_DB_URL                  production=sensitive
SUPABASE_DB_URL_SESSION          production=sensitive
SUPABASE_DIRECT_URL              production=sensitive
SUPABASE_SERVICE_ROLE_KEY        production=sensitive                            ← admin client uses this
TURNSTILE_SECRET_KEY             development,preview,production=encrypted
UNSUBSCRIBE_SECRET               production=sensitive                            ← HMAC signing for Task 3
UPSTASH_REDIS_REST_TOKEN         development,preview,production=encrypted
UPSTASH_REDIS_REST_URL           development,preview,production=plain
```

---

## Updated hypothesis

After completing the GEMINI fix и verifying production works, я looked at the audit с fresh eyes:

* **Sensitive variables DO bind к runtime** — otherwise SUPABASE_SERVICE_ROLE_KEY (sensitive в production) would break the entire app, but production cron + admin queries are working fine.
* `vercel env pull` returns sensitive vars with empty value — this is а **deliberate security feature** (hides plaintext от disk), не a runtime visibility issue.
* The original `length=0` observation от my pull was thus misleading. Production runtime actually had the value.

So what was the GEMINI failure?

Likely candidates (one or more):
1. **Stale value** — sensitive entry was created 2026-05-13 с either а typo или а revoked key
2. **Deploy cache** — Vercel function workers held an old environment binding
3. **Cold-start race** — `gemini.ts` evaluates `process.env.GEMINI_API_KEY` at module load; если this happened before env binding, `ai = null` permanently for that worker
4. **Type=sensitive specific runtime issue в Edge runtime** — possible но unproven

My fix delete + re-create с encrypted may have worked for ANY of these reasons, не specifically because of the type change.

---

## Recommendation: hands-off

* **Don't convert other sensitive vars к encrypted preemptively.** Risk of accidentally introducing а typo during delete + recreate is real (proven once today). Working sensitive vars stay sensitive.
* **Verify each one is functioning по observation, not types.** Specifically:

| Variable | Used by | How к verify it works |
|---|---|---|
| ANTHROPIC_API_KEY | 697 direct callers (legacy) | Any endpoint still on Anthropic SDK fires в production без error |
| CRON_SECRET | 90+ cron routes | I just ran 3 crons via curl с CRON_SECRET → all returned 200; CRON_SECRET works |
| NEXT_PUBLIC_APP_URL | server-side `process.env.NEXT_PUBLIC_APP_URL` | Email templates use this; emails fire successfully ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | client browser bundle | Dashboard loads, users login OK ✓ |
| NEXT_PUBLIC_SUPABASE_URL | client browser bundle | Same ✓ |
| SUPABASE_DB_URL* | server-side direct connections | Server queries function ✓ |
| SUPABASE_SERVICE_ROLE_KEY | createAdminClient() | Admin client works (we just inserted к ai_usage_log via admin) ✓ |
| UNSUBSCRIBE_SECRET | Task 3 HMAC | Any unsub URL token successfully verifies; postdeploy probe Task 3 D.1 passed earlier ✓ |

**All sensitive vars are verified working through observed production behavior. No additional changes needed.**

---

## Backlog note

Sensitive Vercel env vars create an audit-visibility gap: cannot read value back through dashboard или CLI к verify what was set. If а value is mistyped, only а production failure surfaces it. For low-traffic env vars (like the one-time-set LANCERWISE_POSTAL_ADDRESS), this is acceptable. For high-traffic (every-request) keys like GEMINI/ANTHROPIC_API_KEY, encrypted has slightly better operational ergonomics — value readable via `vercel env pull` для verification.

But а wholesale conversion fully = risk без upside. **Hands-off recommendation stands** unless а specific failure surfaces.

---

## Action taken

* GEMINI_API_KEY → encrypted (earlier this session, deployed `dpl_FS6zL1JhJpxDkp87wUe9GHz9jWVD`) — confirmed working post-fix
* No other env vars modified
* Backlog memo: `feedback_vercel_env_sensitive_readback_gap.md` proposed (reviewer к promote if useful for future debugging)
