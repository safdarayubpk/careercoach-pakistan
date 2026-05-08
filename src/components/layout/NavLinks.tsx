'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/app/dashboard', label: 'Dashboard' },
  { href: '/app/session/setup', label: 'Sessions' },
  { href: '/app/billing', label: 'Billing' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <div className="hidden md:flex items-center justify-center gap-6 text-sm">
      {links.map(({ href, label }) => {
        const isActive = pathname === href || (href !== '/app/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`transition-colors pb-0.5 ${
              isActive
                ? 'text-white border-b-2 border-white font-semibold'
                : 'text-white/75 hover:text-white border-b-2 border-transparent'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
