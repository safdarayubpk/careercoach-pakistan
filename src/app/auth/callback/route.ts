import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import WelcomeEmail from '@/emails/WelcomeEmail'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/', origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', origin))
  }

  // Detect new vs returning user before upsert
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single()
  const isNewUser = !existingUser

  // Use supabaseAdmin to bypass RLS — anon client cannot insert into public.users.
  // ignoreDuplicates: true ensures trial_ends_at is never reset on subsequent logins.
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabaseAdmin.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      trial_ends_at: trialEndsAt,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  // Send welcome email to new users — fire-and-forget, never blocks the redirect
  if (isNewUser) {
    const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'
    const dashboardUrl = `${origin}/app/dashboard`
    resend.emails.send({
      from: 'CareerCoach Pakistan <onboarding@resend.dev>',
      to: user.email!,
      subject: 'Welcome to CareerCoach Pakistan — your 7-day trial has started',
      react: WelcomeEmail({ firstName, dashboardUrl }),
    }).catch(err => console.error('[welcome-email] send failed:', err))
  }

  return NextResponse.redirect(new URL('/app/dashboard', origin))
}
