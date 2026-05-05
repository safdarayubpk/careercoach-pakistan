'use client'

type Level = 'Junior' | 'Mid' | 'Senior'

interface LevelSelectorProps {
  value: Level | null
  onChange: (level: Level) => void
}

const LEVELS: Level[] = ['Junior', 'Mid', 'Senior']

export default function LevelSelector({ value, onChange }: LevelSelectorProps) {
  return (
    <div className="flex gap-2">
      {LEVELS.map(level => (
        <button
          key={level}
          type="button"
          onClick={() => onChange(level)}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            value === level
              ? 'bg-[#1E40AF] text-white'
              : 'border border-gray-300 bg-white text-gray-700 hover:border-[#1E40AF] hover:text-[#1E40AF]'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  )
}
