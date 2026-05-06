import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
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

  return NextResponse.redirect(new URL('/app/dashboard', origin))
}
