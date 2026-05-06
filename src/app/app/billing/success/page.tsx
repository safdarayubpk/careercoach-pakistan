import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900">You're in!</h1>
        <p className="mb-8 text-sm text-gray-500">
          Payment confirmed. Your CareerCoach Pakistan subscription is now active.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-block rounded-xl bg-[#1E40AF] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800"
        >
          Go to Dashboard →
        </Link>
        <p className="mt-4 text-xs text-gray-400">
          A receipt has been sent to your email by Stripe.
        </p>
      </div>
    </div>
  )
}
