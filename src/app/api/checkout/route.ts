import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${baseUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/app/billing`,
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[POST /api/checkout]', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
