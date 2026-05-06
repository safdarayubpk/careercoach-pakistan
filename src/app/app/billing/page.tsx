import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscribeButton from '@/components/billing/subscribe-button'
import ManageButton from '@/components/billing/manage-button'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: userRow } = await supabase
    .from('users')
    .select('is_subscribed, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (!userRow) redirect('/')

  // ── Subscribed state ──────────────────────────────────────────────────
  if (userRow.is_subscribed) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-3 text-5xl">✅</div>
            <h1 className="mb-1 text-xl font-bold text-gray-900">Subscription Active</h1>
            <p className="mb-6 text-sm text-gray-500">PKR 999/month · Renews automatically</p>
            <ManageButton />
            <p className="mt-3 text-xs text-gray-400">
              Update payment method, cancel, or view invoices on Stripe
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Unsubscribed / trial state ────────────────────────────────────────
  const trialEndsAt = userRow.trial_ends_at ?? new Date(0).toISOString()
  const daysLeft = Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const trialBadge =
    daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial`
      : 'Your trial has ended'

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md">
        {/* Trial badge */}
        <div className="mb-5 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            {trialBadge}
          </span>
        </div>

        {/* Pricing card */}
        <div className="rounded-2xl border-2 border-[#1E40AF] bg-white p-8 shadow-lg shadow-blue-100">
          <p className="mb-1 text-center text-sm font-semibold text-gray-400">
            CareerCoach Pakistan
          </p>
          <p className="mb-5 text-center text-xs text-gray-400">AI Interview Coach</p>

          {/* Price */}
          <div className="mb-1 text-center">
            <span className="text-5xl font-extrabold text-[#1E40AF]">PKR 999</span>
            <span className="text-sm text-gray-400">/month</span>
          </div>
          <p className="mb-1 text-center text-sm text-gray-400">
            <span className="line-through">PKR 7,000/month</span>{' '}
            <span className="text-gray-500">(Final Round AI)</span>
          </p>
          <p className="mb-6 text-center text-sm font-bold text-green-600">
            You save PKR 6,000/month
          </p>

          {/* Feature list */}
          <ul className="mb-6 divide-y divide-gray-100">
            {[
              'Unlimited interview sessions',
              'JD-tailored questions',
              'AI feedback in seconds (Groq)',
              'Urdu voice input 🎤',
            ].map(feature => (
              <li
                key={feature}
                className="flex items-center gap-3 py-2.5 text-sm text-gray-700"
              >
                <span className="font-bold text-green-600">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <SubscribeButton />
          <p className="mt-3 text-center text-xs text-gray-400">
            Cancel anytime · Secured by Stripe
          </p>
        </div>
      </div>
    </div>
  )
}
