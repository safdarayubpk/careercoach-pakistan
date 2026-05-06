'use client'

import { useState } from 'react'

export default function ManageButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError('Could not open portal. Try again.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Could not open portal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-[#1E40AF] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Opening portal…' : 'Manage Subscription →'}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
