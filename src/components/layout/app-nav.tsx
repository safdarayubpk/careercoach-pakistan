import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import MobileDrawer from '@/components/layout/MobileDrawer'
import ProfileDropdown from '@/components/layout/ProfileDropdown'
import NavLinks from '@/components/layout/NavLinks'

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
      className="sticky top-0 z-40 bg-[#1E40AF] text-white px-6 py-3 flex items-center"
    >
      {/* Left — logo (flex-1 so it takes equal space) */}
      <div className="flex-1">
        <Link
          href="/app/dashboard"
          className="font-bold text-lg hover:text-white/90 transition-colors"
        >
          CareerCoach PK
        </Link>
      </div>

      {/* Centre — nav links, truly centred (hidden on mobile) */}
      <NavLinks />

      {/* Right — profile dropdown + mobile hamburger (flex-1 so it mirrors left) */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <ProfileDropdown
          displayName={displayName}
          email={email}
          initials={initials}
          avatarUrl={avatarUrl}
        />
        <MobileDrawer
          displayName={displayName}
          email={email}
          initials={initials}
          avatarUrl={avatarUrl}
        />
      </div>
    </nav>
  )
}
