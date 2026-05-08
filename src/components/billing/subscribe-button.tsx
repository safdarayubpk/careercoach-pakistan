'use client'

import { useState } from 'react'
import { captureEvent } from '@/lib/analytics'

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    captureEvent('upgrade_clicked')

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError('Something went wrong. Try again.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl bg-[#1E40AF] px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Redirecting to Stripe…' : 'Subscribe Now — PKR 999/month'}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
