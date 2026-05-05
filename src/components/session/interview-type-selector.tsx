'use client'

import type { InterviewType } from '@/types/session'
import { VALID_TYPES } from '@/types/session'

interface InterviewTypeSelectorProps {
  value: InterviewType
  onChange: (type: InterviewType) => void
}

export default function InterviewTypeSelector({
  value,
  onChange,
}: InterviewTypeSelectorProps) {
  return (
    <div className="flex gap-2">
      {VALID_TYPES.map(type => (
        <button
          key={type}
          type="button"
          aria-pressed={value === type}
          onClick={() => onChange(type)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === type
              ? 'bg-[#1E40AF] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF] hover:text-[#1E40AF]'
          }`}
        >
          {type}
        </button>
      ))}
    </div>
  )
}
