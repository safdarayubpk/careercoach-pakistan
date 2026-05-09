'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SignOutButton from '@/components/auth/sign-out-button'

interface Props {
  displayName: string
  email: string
  initials: string
  avatarUrl: string | null
}

export default function ProfileDropdown({ displayName, email, initials, avatarUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative hidden md:block">
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Open user menu"
        className="cursor-pointer flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-300 text-sm font-semibold text-blue-900 ring-2 ring-white/30">
            {initials}
          </div>
        )}
        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`text-white/70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            aria-label="User menu"
            className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? {} : { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.12 } }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {/* User info — non-interactive */}
            <div className="px-4 py-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-500 truncate">{email}</p>
            </div>

            <div className="my-1 border-t border-gray-100" />

            {/* Billing link */}
            <Link
              href="/app/billing"
              onClick={() => setIsOpen(false)}
              role="menuitem"
              className="flex cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M1 6h13" stroke="currentColor" strokeWidth="1.3" />
                <rect x="3" y="8.5" width="3" height="1.5" rx="0.5" fill="currentColor" />
              </svg>
              Billing
            </Link>

            <div className="my-1 border-t border-gray-100" />

            {/* Sign out */}
            <div className="px-2 py-1">
              <SignOutButton className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
