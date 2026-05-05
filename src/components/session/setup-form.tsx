'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import RoleAutocomplete from './role-autocomplete'
import LevelSelector from './level-selector'
import InterviewTypeSelector from './interview-type-selector'
import type { Level, InterviewType } from '@/types/session'

export default function SetupForm() {
  const router = useRouter()
  const [role, setRole] = useState('')
  const [level, setLevel] = useState<Level | null>(null)
  const [interviewType, setInterviewType] = useState<InterviewType>('Mixed')
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const jdTrimmed = jdText.slice(0, 2000)
  const jdWasTrimmed = jdText.length > 2000

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role.trim() || !level) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: role.trim(),
          level,
          interviewType,
          jdText: jdTrimmed || undefined,
        }),
      })

      if (!res.ok) throw new Error('Failed')
      const { sessionId } = await res.json()
      router.push(`/app/session/${sessionId}/question`)
    } catch {
      setError("Couldn't generate questions. Try again.")
      setLoading(false)
    }
  }

  const isValid = role.trim().length > 0 && level !== null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Role <span className="text-red-500">*</span>
        </label>
        <RoleAutocomplete value={role} onChange={setRole} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Experience Level <span className="text-red-500">*</span>
        </label>
        <LevelSelector value={level} onChange={setLevel} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interview Type
        </label>
        <InterviewTypeSelector value={interviewType} onChange={setInterviewType} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          rows={6}
          placeholder="Paste the job description here to get tailored questions…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
        />
        {jdWasTrimmed && (
          <p className="mt-1 text-xs text-amber-600">JD trimmed to fit AI limits.</p>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={!isValid || loading}
        className="w-full rounded-md bg-[#1E40AF] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Generating your tailored questions…' : 'Start Interview →'}
      </button>
    </form>
  )
}
