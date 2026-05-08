import 'server-only'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { resend } from '@/lib/resend'
import TrialExpiryEmail from '@/emails/TrialExpiryEmail'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Verify Vercel cron secret — rejects any public request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://careercoach.pk'
  const billingUrl = `${siteUrl}/app/billing`

  // Query users whose trial expires in the next 24 hours,
  // are not subscribed, and haven't received the reminder yet.
  const now = new Date()
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name')
    .eq('is_subscribed', false)
    .eq('trial_reminder_sent', false)
    .gte('trial_ends_at', now.toISOString())
    .lte('trial_ends_at', in24h.toISOString())

  if (error) {
    console.error('[trial-reminder] DB query failed:', error)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, errors: 0 })
  }

  let sent = 0
  let errors = 0

  for (const user of users) {
    const firstName = user.full_name?.split(' ')[0] ?? 'there'

    try {
      const { error: sendError } = await resend.emails.send({
        from: 'CareerCoach Pakistan <onboarding@resend.dev>',
        to: user.email,
        subject: 'Your CareerCoach Pakistan free trial ends tomorrow',
        react: TrialExpiryEmail({ firstName, billingUrl }),
      })

      if (sendError) {
        console.error(`[trial-reminder] Resend error for ${user.id}:`, sendError)
        errors++
        continue
      }

      // Mark as sent only after confirmed delivery
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ trial_reminder_sent: true })
        .eq('id', user.id)

      if (updateError) {
        console.error(`[trial-reminder] Failed to mark sent for ${user.id}:`, updateError)
        // Email was sent — log the error but don't count as failure
      }

      sent++
    } catch (err) {
      console.error(`[trial-reminder] Unexpected error for ${user.id}:`, err)
      errors++
    }
  }

  console.log(`[trial-reminder] Done — sent: ${sent}, errors: ${errors}`)
  return NextResponse.json({ sent, errors })
}
