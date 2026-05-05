import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  try {
    const { supabase, supabaseResponse, user } = await updateSession(request)

    // No session — send to landing page
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Fetch trial and subscription status
    const { data: userRow } = await supabase
      .from('users')
      .select('is_subscribed, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (userRow) {
      const trialActive = new Date(userRow.trial_ends_at) > new Date()
      const hasAccess = userRow.is_subscribed || trialActive

      // Trial expired and not subscribed → billing
      // Allow /app/billing itself to prevent redirect loop
      if (!hasAccess && !request.nextUrl.pathname.startsWith('/app/billing')) {
        return NextResponse.redirect(new URL('/app/billing', request.url))
      }
    }

    // IMPORTANT: return supabaseResponse (with refreshed cookies), not NextResponse.next()
    return supabaseResponse
  } catch {
    // Supabase unreachable — show a safe error page, never expose raw errors
    return new NextResponse(
      '<html><body style="font-family:sans-serif;padding:2rem"><h1>Something went wrong</h1><p>Please try again in a moment.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

export const config = {
  matcher: ['/app/:path*'],
}
