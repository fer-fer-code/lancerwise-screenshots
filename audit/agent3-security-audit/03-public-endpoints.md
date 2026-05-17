# [AGENT 3] Security audit — Area 3: Unauthed Public Endpoints

**Findings**: 1 × P1, 1 × P2, 1 × P3

## Inventory

```
Total /api routes:               2685
Routes with any auth pattern:    2601
Routes with ZERO auth pattern:    84  (3.1%)
```

The 84 no-auth routes were further classified.

## Classification of the 84 no-auth routes

### INTENTIONAL public-token endpoints (75 routes) — **OK**

Pattern: `/api/.../public/[token]` or `/api/.../[token]/...` — these read the
token from the URL and validate it via service-role DB query (e.g.,
`.eq('share_token', token)`). Auth = "knowing the secret token".

Examples (full list in `03-no-auth-routes-raw.txt`):
- `/api/time-reports/public/[token]`
- `/api/portal/[token]/contact|messages|...`
- `/api/contracts/sign/[token]` + `/api/contracts/sign` (POST with token in body)
- `/api/quotes/public/[token]` + `/api/quotes/respond`
- `/api/proposals/v2/public/[token]`
- `/api/calendar/subscribe/[token]` (ICS feed for portal viewer)
- `/api/intake-forms/public/[token]/...`
- `/api/nps/respond/[token]` + `/api/nps/respond`
- `/api/testimonials/collect/[token]` + `/api/testimonials/submit/[token]`
- `/api/case-studies/public/[token]`
- `/api/sla/public/[token]`
- ...etc.

Spot-checked `/api/portal/time-approval/route.ts` — properly validates token via
`.eq('approval_token', token)` AND scopes update by `.eq('id', d.entryId).eq('approval_token', token)`.
Token is the authorization mechanism. OK pattern.

Spot-checked `/api/contracts/sign/route.ts` — looks up contract via token field
fallback chain (sign_token → share_token → view_token → portal_token).
Properly scoped to the matched contract.

### Public-data static endpoints (4 routes) — **OK**
- `/api/skills/market-rates` — hardcoded market data array
- `/api/scenario-planner/calculate` — pure CPU math, no DB, no AI
- `/api/currency/convert` — currency conversion utility
- `/api/payments/status` — boolean `{ stripe_enabled: bool }` only

### Webhook receivers (3 routes) — see Area 4
- `/api/stripe/webhook` — Stripe webhook (signature check IF env var set)
- `/api/stripe/checkout` — creates checkout session
- `/api/payments/webhook` — re-exports `/api/stripe/webhook`

### OAuth callbacks (2 routes) — **🚨 P1 FINDING**
- `/api/gmail/callback`
- `/api/outlook/callback`

See P1 below.

### Contact forms (5 routes) — **⚠ P2 FINDING**
- `/api/contact-form`
- `/api/portfolio-site/contact`
- `/api/pricing-page/contact`
- `/api/portfolio/contact`
- `/api/profile/[slug]/contact`

See P2 below.

---

## P1: OAuth callback state misuse (gmail + outlook)

**Affected**:
- `src/app/api/gmail/callback/route.ts`
- `src/app/api/outlook/callback/route.ts`

**The bug** (gmail callback excerpt):

```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const userId = searchParams.get('state')   // ← attacker-controlled!
  // ...

  await supabase.from('gmail_connections').upsert({
    user_id: userId,                          // ← used directly as DB key
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    // ...
  }, { onConflict: 'user_id' })
}
```

The OAuth `state` parameter is supposed to be an unguessable, server-generated
nonce that the callback **looks up server-side** to recover the originating
session/user. Using it as the user ID directly defeats CSRF protection entirely.

**Companion init handlers** (`gmail/auth`, `outlook/auth`) DO set `state: user.id`
as the authenticated session's user id — but they never store this server-side,
so the callback has no way to verify the value came from a legitimate init.

**Exploit scenario**:

1. Attacker discovers victim's Supabase `user.id` (UUID — could leak via any
   API response that returns `user_id` fields, or via guessable patterns if
   ever displayed in URLs).
2. Attacker initiates OAuth flow directly via Google/Microsoft's authorize
   endpoint with `client_id=<lancerwise>`, `redirect_uri=https://www.lancerwise.com/api/gmail/callback`,
   `state=<victim_user_id>`.
3. Attacker signs into THEIR OWN Gmail in the consent screen.
4. Google redirects to `/api/gmail/callback?code=<attacker_code>&state=<victim_user_id>`.
5. Callback exchanges attacker's `code` for attacker's tokens.
6. Callback `upsert`s `gmail_connections { user_id: victim_user_id, access_token: <attacker_token>, ... }`.
7. Victim's account now has attacker's Gmail "connected". Any feature that
   uses `gmail_connections WHERE user_id = victim_user_id`:
   - **Reads** emails from attacker's mailbox (data exfiltration into victim's account, attacker plants fake "messages from clients" into victim's view).
   - **Sends** emails using attacker's tokens (low-impact for victim, but emails appear to come from attacker's address).
   - **Overwrites** legitimate Gmail connection — victim's actual Gmail tokens deleted, victim must re-connect.

**Recommended fix**:

```typescript
// In gmail/auth (init), generate + store nonce:
const nonce = crypto.randomUUID()
await supabase.from('oauth_states').insert({
  nonce,
  user_id: user.id,
  provider: 'gmail',
  expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
})
// then redirect with state=nonce (NOT user.id)

// In gmail/callback, look up the nonce:
const { data: stateRow } = await supabase.from('oauth_states')
  .select('user_id, expires_at')
  .eq('nonce', searchParams.get('state'))
  .eq('provider', 'gmail')
  .maybeSingle()

if (!stateRow || new Date(stateRow.expires_at) < new Date()) {
  return NextResponse.redirect(`${appUrl}/settings?gmail=invalid_state`)
}
const userId = stateRow.user_id

// Delete the nonce (one-time use)
await supabase.from('oauth_states').delete().eq('nonce', searchParams.get('state'))
```

Need `oauth_states` table:
```sql
CREATE TABLE oauth_states (
  nonce TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON oauth_states (expires_at); -- for periodic cleanup
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
-- No public policies; only service_role accesses via admin client
```

**Effort**: 1 hour (migration + update 4 files).

**Severity P1** because:
- Pre-launch, integration not yet used by real users — exploit impact today: 0.
- Once launched, single attacker can hijack any victim whose user_id they can discover.
- Discovery surface: any /api response returning `user_id`, public profile pages, anywhere UUIDs leak.

---

## P2: Contact forms — no rate limiting / Turnstile / captcha

**Affected**:
- `/api/contact-form/route.ts`
- `/api/portfolio-site/contact/route.ts`
- `/api/pricing-page/contact/route.ts`
- `/api/portfolio/contact/route.ts`
- `/api/profile/[slug]/contact/route.ts`

**The gap**: All 5 endpoints accept anonymous POSTs without:
- Cloudflare Turnstile token verification (despite `TURNSTILE_SECRET_KEY` + `NEXT_PUBLIC_TURNSTILE_SITE_KEY` env vars being configured)
- Rate limiting (per-IP, per-route)
- Honeypot field
- Reply-to throttling

`/api/contact-form` immediately calls `Resend API` with the user-supplied payload.
Other 4 INSERT into Supabase (own DB usage burn) and send notification emails to
the page owner.

**Exploit**:
- Spam → owner inboxes flooded
- AWS-Resend cost amplification (each contact-form POST → 1 Resend send → $0.0004
  × N requests). 100k requests = $40 attack-cost; trivial.
- Owner's Supabase usage gets burned (storage + bandwidth).
- Email-reputation damage if Resend marks domain as spammer.

**Recommended fix**:

```typescript
// At top of each contact route POST handler:
import { verifyTurnstile } from '@/lib/security/turnstile'

const turnstileToken = body.turnstile_token  // client adds via <TurnstileWidget>
const turnstileResult = await verifyTurnstile(turnstileToken, request.headers.get('x-forwarded-for'))
if (!turnstileResult.success) {
  return NextResponse.json({ error: 'CAPTCHA required' }, { status: 400 })
}
```

Plus matching `<TurnstileWidget>` mount on the corresponding form components
(already in use on `/login`, `/register`, `/forgot-password`).

Plus Upstash Redis rate limit:

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const limiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '1 h'),  // 3 contact submits per hour per IP
})
const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
const { success } = await limiter.limit(`contact:${ip}`)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

Upstash credentials (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) are
already in Vercel env across all 3 targets — fix is purely additive code.

**Effort**: 2 hours (5 routes × add 2 checks + client widget mount + test).

---

## P3: HTML injection in `/api/contact-form` admin email

`src/app/api/contact-form/route.ts`:
```typescript
const html = `
<div ...>
  <h2 ...>New Contact Form Submission</h2>
  ...
  <tr><td>...Name</td><td>${name}</td></tr>
  <tr><td>...Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
  ${company ? `...${company}` : ''}
  ...
  <div ...white-space:pre-wrap">${message}</div>
</div>
`
```

User-supplied `name`/`email`/`company`/`message` are interpolated raw into HTML
that gets sent via Resend to the admin inbox.

**Exploit**:
- Send `name=<script>alert(1)</script>` or `<iframe src=evil>` — admin reading
  email in a poorly-sanitizing client (NOT Gmail/Outlook web — they sanitize aggressively) sees rendered HTML.
- Most modern email clients (Gmail web, Outlook web, Apple Mail, Thunderbird) strip
  `<script>`, but attribute-based vectors (`<img onerror=...>`, `<a href="javascript:...">`)
  vary by client.
- Low practical impact for admin who uses Gmail web (current owner email
  `lancerwise.team@gmail.com` — Gmail sanitizes well).

**Recommended fix**:
```typescript
// At top of file:
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[c]!))
}
// Use everywhere user input goes into the html template:
const safeName = escapeHtml(name)
const safeMessage = escapeHtml(message)
// etc.
```

**Effort**: 10 min for 1 file. Apply same pattern to the other 4 contact endpoints
when adding Turnstile+rate-limit (good time to do escape too).

---

## Methodology

```bash
# Find routes with ZERO auth pattern across 2685 /api routes
find src/app/api -name "route.ts" | while read route; do
  if ! grep -qlE "(auth\.getUser|getAuthenticatedUser|authenticateApiKey|requireAuth|createServerClient|verifyToken|verifyHmac|HMAC|CRON_SECRET|jwt\.verify|verifyJWT|verifySignature|x-vercel-signature|webhook.*secret|withAuth|cookies\(\))" "$route"; then
    echo "$route"
  fi
done
# → 84 routes

# Then classified each by URL pattern + spot-checked top concerns
```

Full list of 84 no-auth routes in `03-no-auth-routes-raw.txt`.
