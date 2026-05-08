import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileDrawer from '@/components/layout/MobileDrawer'
import ProfileDropdown from '@/components/layout/ProfileDropdown'

export default async function AppNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null

  const initials = fullName
    ? fullName[0].toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const displayName = fullName || email

  return (
    <nav
      aria-label="App navigation"
      className="sticky top-0 z-40 bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between"
    >
      <span className="font-bold text-lg">CareerCoach PK</span>

      {/* Desktop nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link href="/app/dashboard" className="hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <Link href="/app/session/setup" className="hover:text-white/80 transition-colors">
          Sessions
        </Link>
        <Link href="/app/billing" className="hover:text-white/80 transition-colors">
          Billing
        </Link>
      </div>

      {/* Desktop user dropdown — hidden on mobile */}
      <ProfileDropdown
        displayName={displayName}
        email={email}
        initials={initials}
        avatarUrl={avatarUrl}
      />

      {/* Mobile hamburger — MobileDrawer renders the ☰ button and the drawer */}
      <MobileDrawer
        displayName={displayName}
        email={email}
        initials={initials}
        avatarUrl={avatarUrl}
      />
    </nav>
  )
}
