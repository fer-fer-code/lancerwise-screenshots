import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  aiRatelimit,
  apiRatelimit,
  authRatelimit,
  applyRatelimit,
  getClientIp,
  ratelimitHeaders,
} from '@/lib/security/ratelimit'

// Canonical hosts that ARE allowed to be indexed by search engines.
// Any other host (lancerwise.vercel.app, *-lancerwise.vercel.app preview URLs,
// raw IP, localhost) gets a noindex/nofollow X-Robots-Tag response header
// so that even if the platform-level 308 redirect from non-canonical
// hostnames is somehow bypassed (direct internal access, edge-cache
// staleness, etc.), search engines see "do not index this" on the
// response itself. The platform redirect is the primary control; this
// header is defense-in-depth.
const CANONICAL_HOSTS = new Set(['www.lancerwise.com', 'lancerwise.com'])

function shouldNoIndex(host: string | null): boolean {
  if (!host) return true
  const h = host.toLowerCase().split(':')[0] // strip port
  return !CANONICAL_HOSTS.has(h)
}

export async function middleware(request: NextRequest) {
  const { pathname: earlyPath } = request.nextUrl
  const noIndex = shouldNoIndex(request.headers.get('host'))

  // Rate limits for /api/auth/* and /api/v1/* — applied BEFORE Supabase lookup для cheaper rejection.
  // Webhooks (/api/webhooks/*, /api/stripe/webhook, /api/lemonsqueezy/webhook) and cron
  // are exempt via the matcher (api excluded by default in main pattern).
  if (earlyPath.startsWith('/api/auth/')) {
    const decision = await applyRatelimit(authRatelimit(), `ip:${getClientIp(request)}`)
    if (!decision.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: ratelimitHeaders(decision) },
      )
    }
    return NextResponse.next({ request })
  }
  if (earlyPath.startsWith('/api/v1/')) {
    const decision = await applyRatelimit(apiRatelimit(), `ip:${getClientIp(request)}`)
    if (!decision.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: ratelimitHeaders(decision) },
      )
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Protect AI API routes — unauthenticated callers get 401 instead of burning API budget
  if (pathname.startsWith('/api/ai/')) {
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // User-scoped AI rate limit: 20 calls / hour caps token spend per account
    const decision = await applyRatelimit(aiRatelimit(), `user:${user.id}`)
    if (!decision.success) {
      return NextResponse.json(
        { error: 'AI rate limit exceeded. Try again later.' },
        { status: 429, headers: ratelimitHeaders(decision) },
      )
    }
    return supabaseResponse
  }

  const authRoutes = ['/login', '/register']

  // Public tool pages — accessible without authentication
  const publicPaths = [
    '/tools/rate-calculator',
    '/demo',
    '/about',
    '/contact',
    '/faq',
    '/n8n-templates',
    '/changelog',
    '/api-docs',
    '/privacy',
    '/terms',
  ]
  const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isPublicPath) {
    if (noIndex) supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return supabaseResponse
  }

  const protectedRoutes = [
    '/dashboard', '/clients', '/projects', '/invoices', '/contracts',
    '/time-tracker', '/settings', '/analytics', '/proposals', '/expenses',
    '/tax-report', '/tax', '/reports', '/notifications', '/onboarding', '/tools',
    '/tasks', '/inbox',
    '/goals', '/retainers', '/skills', '/portfolio', '/vendors',
    '/team', '/savings', '/forecast', '/availability',
    '/crm', '/sales', '/finance', '/reminders',
    '/leads', '/packages',
    '/quotes', '/estimates', '/notes', '/snippets', '/subscriptions',
    '/upgrade', '/rate-calculator', '/revenue-goals', '/work-log',
    '/admin',
  ]
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))
  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/')

  if (!user && isProtected) {
    return NextResponse.redirect(new URL(isAdminRoute ? `/login?next=${encodeURIComponent(pathname)}` : '/login', request.url))
  }

  // Admin route guard: non-admin authenticated users get redirected к /dashboard
  // (admin email allowlist в src/lib/admin/auth.ts — kept в sync с hardcoded list here)
  if (user && isAdminRoute) {
    const ADMIN_ALLOWLIST = [
      'krokusstudia2@gmail.com',
      'ramiz_ddd@mail.ru',
      ...((process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)),
    ]
    const email = (user.email ?? '').trim().toLowerCase()
    if (!ADMIN_ALLOWLIST.includes(email)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // MFA enforcement: if user is authenticated at AAL1 but needs AAL2, redirect to /mfa
  if (user && isProtected && pathname !== '/mfa') {
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal1' && aal?.nextLevel === 'aal2') {
        return NextResponse.redirect(new URL('/mfa', request.url))
      }
    } catch {
      // MFA check failed — allow through
    }
  }

  // Defense-in-depth: stamp X-Robots-Tag on every response served from a
  // non-canonical host (lancerwise.vercel.app, preview deployments, raw
  // IP, localhost). The Vercel platform 308-redirects these hosts to
  // www.lancerwise.com before middleware runs, but if that redirect is
  // ever bypassed (skew-protected request, edge-cache miss, direct
  // internal call), the header still tells search engines not to index.
  if (noIndex) {
    supabaseResponse.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|portal|api).*)',
    '/api/ai/:path*',
    '/api/auth/:path*',
    '/api/v1/:path*',
  ],
}
