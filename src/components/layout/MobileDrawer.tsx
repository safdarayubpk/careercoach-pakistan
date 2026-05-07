'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SignOutButton from '@/components/auth/sign-out-button'

interface Props {
  displayName: string
  email: string
  initials: string
  avatarUrl: string | null
}

export default function MobileDrawer({ displayName, email, initials, avatarUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const drawerRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => hamburgerRef.current?.focus(), 0)
  }, [])

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return
    const el = drawerRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, close])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-white"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect y="3" width="22" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="10" width="22" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="17" width="22" height="2.5" rx="1.25" fill="currentColor" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed top-0 right-0 bottom-0 z-50 flex w-[260px] flex-col bg-white shadow-xl"
              initial={{ x: prefersReducedMotion ? 0 : 260 }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : 260 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Close button */}
              <div className="flex justify-end p-3">
                <button
                  onClick={close}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close navigation menu"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* User info header */}
              <div className="bg-[#1E40AF] px-4 pb-4">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-300 text-sm font-bold text-blue-900">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-white/[80%]">{email}</p>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 py-2" aria-label="Drawer navigation">
                <Link
                  href="/app/dashboard"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/app/session/setup"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  💬 Sessions
                </Link>
                <Link
                  href="/app/billing"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  💳 Billing
                </Link>
              </nav>

              {/* Sign out footer */}
              <div className="border-t border-gray-200 p-3">
                <SignOutButton className="w-full min-h-[44px] rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
