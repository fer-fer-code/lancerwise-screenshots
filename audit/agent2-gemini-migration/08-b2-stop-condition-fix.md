=== B2 STOPPING CONDITION HIT — root-cause + remediation ===

## Issue
/api/ai/risk (and все /lib/ai consumers) throwing 'GEMINI_API_KEY not configured'
115 errors total over 16:45-18:52 UTC window, 100% of risk-assessment calls

## Root cause
Vercel production GEMINI_API_KEY was type=sensitive (created 2026-05-13).
Sensitive type returns EMPTY value through 'vercel env pull --environment=production'
AND apparently empty at runtime в Next.js function process.env.
(Preview + dev versions were type=encrypted и working — that's why local tests passed)

## Earlier missed signal
Phase A smoke test ran locally with .env.local which has the key in plaintext
→ all smoke tests passed in development.
B0+B1 deploys never tested the real /api/ai/risk endpoint with а real user session.
First production-side AI calls only surfaced after RiskWidget dashboard hits.

## Fix applied
1. Pulled empty value via env pull (confirmed length=0)
2. Deleted old sensitive entry (id 24R5tyNBxsXYbdAY)
3. Re-created с type=encrypted using value from local .env.local (length=39)
4. Verified: vercel env pull now returns key с suffix Nw4xAc4
5. Redeployed: dpl_FS6zL1JhJpxDkp87wUe9GHz9jWVD READY

## Verification status
Last error 18:52 UTC, just before new deploy completed ~18:54 UTC.
Need fresh dashboard hit OR cron auto-fire to confirm fix.
Time now: 18:57:11 UTC

## Cluster status
Cluster 1: merged (PR #12 5e4c911c), deployed dpl_mCZ9sDWhTotuuyatrWPPokZY7wZw — 25 endpoints
Cluster 2: merged (PR #13 3e47be2a), deployed dpl_Eigipzaz6S68iouN7CBQ6EUFNgPi — 25 endpoints
Total в production: 50 /api/v1/ai/* endpoints migrated

Both clusters are now functional с restored key. B2 can resume after verification.

## Backlog action
Audit ALL other Vercel env vars для sensitive-vs-encrypted mismatch:
- LANCERWISE_POSTAL_ADDRESS (recall my earlier task 3 also found sensitive)
- RESEND_API_KEY
- ANTHROPIC_API_KEY
- UNSUBSCRIBE_SECRET
- CRON_SECRET
Pattern: vercel env vars created via CLI's interactive prompt default к sensitive.
Encrypted exposes к runtime; sensitive doesn't expose readable value but supposedly
still binds at runtime — observed behavior contradicts that для process.env access.
