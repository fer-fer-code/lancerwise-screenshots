import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })

const email = `qa+rlsverify-${Date.now()}@lancerwise.test`
console.log(`\n[POINT 3] Creating fresh test user: ${email}`)

// 1. Create user
const { data: user, error: createErr } = await admin.auth.admin.createUser({
  email,
  email_confirm: true,
  user_metadata: { fixture: 'rls-postfix-verify' },
})
if (createErr) { console.error('createUser fail:', createErr); process.exit(1) }
console.log(`  created user_id: ${user.user.id}`)

// 2. Generate magic link to get a session token
const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
})
if (linkErr) { console.error('generateLink fail:', linkErr); process.exit(1) }

// Extract hashed_token and exchange for session via OTP verify
const hashedToken = linkData.properties?.hashed_token
if (!hashedToken) {
  console.error('No hashed_token in generateLink response')
  process.exit(1)
}

const authClient = createClient(URL, ANON, { auth: { persistSession: false } })
const { data: sess, error: otpErr } = await authClient.auth.verifyOtp({
  token_hash: hashedToken,
  type: 'magiclink',
})
if (otpErr || !sess?.session) { console.error('verifyOtp fail:', otpErr); process.exit(1) }
console.log(`  authed: access_token len ${sess.session.access_token.length}`)

// 3. Query both tables as THIS fresh user (should see 0 own rows)
const userClient = createClient(URL, ANON, {
  auth: { persistSession: false },
  global: { headers: { Authorization: `Bearer ${sess.session.access_token}` } },
})

const { data: invoices, error: invErr, count: invCount } = await userClient
  .from('invoices').select('*', { count: 'exact', head: false })
const { data: drafts, error: drErr, count: drCount } = await userClient
  .from('proposal_drafts').select('*', { count: 'exact', head: false })

console.log(`\n[POINT 3] Cross-tenant query results:`)
console.log(`  invoices rows visible к fresh user: ${invoices?.length ?? 0} (err: ${invErr?.message ?? 'none'})`)
console.log(`  proposal_drafts rows visible к fresh user: ${drafts?.length ?? 0} (err: ${drErr?.message ?? 'none'})`)

// 4. Cleanup
console.log(`\n[POINT 3] Cleaning up user...`)
const { error: delErr } = await admin.auth.admin.deleteUser(user.user.id)
if (delErr) console.error(`  cleanup fail: ${delErr.message}`)
else console.log(`  deleted user_id: ${user.user.id}`)

const pass = (invoices?.length ?? 0) === 0 && (drafts?.length ?? 0) === 0
console.log(`\n[POINT 3] ${pass ? '✅ PASS' : '❌ FAIL'}`)
process.exit(pass ? 0 : 1)
