'use client'

import { useState, useRef, useEffect } from 'react'

const PREDEFINED_ROLES = [
  // Tech
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'DevOps Engineer',
  'Data Analyst',
  'Data Scientist',
  'UI/UX Designer',
  'QA Engineer',
  'Cybersecurity Analyst',
  'Machine Learning Engineer',
  // Finance & Banking
  'Accountant',
  'Financial Analyst',
  'Bank Officer',
  'Auditor',
  'Tax Consultant',
  // Engineering (non-IT)
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Structural Engineer',
  // Marketing & Sales
  'Marketing Manager',
  'Sales Executive',
  'Digital Marketer',
  'Brand Manager',
  // Healthcare
  'Medical Officer',
  'Pharmacist',
  'Nurse',
  'Lab Technician',
  // Education
  'Teacher',
  'Lecturer',
  'School Administrator',
  // HR & Operations
  'HR Manager',
  'Recruitment Officer',
  'Operations Manager',
  'Supply Chain Manager',
  // Other
  'Project Manager',
  'Business Analyst',
  'Legal Advisor',
  'Content Writer',
  'Journalist',
]

interface RoleAutocompleteProps {
  value: string
  onChange: (value: string) => void
}

export default function RoleAutocomplete({ value, onChange }: RoleAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? PREDEFINED_ROLES.filter(r => r.toLowerCase().includes(value.toLowerCase()))
    : PREDEFINED_ROLES

  const exactMatch = PREDEFINED_ROLES.some(
    r => r.toLowerCase() === value.toLowerCase()
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function select(role: string) {
    onChange(role)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="e.g. Software Engineer"
        autoComplete="off"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#1E40AF] focus:outline-none focus:ring-1 focus:ring-[#1E40AF]"
      />
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg max-h-56 overflow-auto">
          {filtered.map(role => (
            <li
              key={role}
              onMouseDown={() => select(role)}
              className="cursor-pointer px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#1E40AF]"
            >
              {role}
            </li>
          ))}
          {value.trim() && !exactMatch && (
            <li
              onMouseDown={() => select(value.trim())}
              className="cursor-pointer border-t border-gray-100 px-3 py-2 text-sm font-medium text-[#1E40AF] hover:bg-blue-50"
            >
              + Use &ldquo;{value.trim()}&rdquo; as custom role
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
