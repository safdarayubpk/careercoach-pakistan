import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (!userId) {
          console.warn('[Stripe webhook] checkout.session.completed: missing client_reference_id')
          break
        }

        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              status: 'active',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          )

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: true })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const isActive = sub.status === 'active'

        const { data: subRow } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!subRow) {
          console.warn('[Stripe webhook] subscription.updated: no row found for', sub.id)
          break
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: sub.status as string, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: isActive })
          .eq('id', subRow.user_id)

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: subRow } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!subRow) {
          console.warn('[Stripe webhook] subscription.deleted: no row found for', sub.id)
          break
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: false })
          .eq('id', subRow.user_id)

        break
      }

      default:
        // Unknown event — return 200 so Stripe doesn't retry
        break
    }
  } catch (error) {
    console.error('[Stripe webhook] Handler error:', error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
