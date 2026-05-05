import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/sign-out-button'
import Link from 'next/link'

export default async function AppNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null

  // Initials: first letter of full name, else first two chars of email
  const initials = fullName
    ? fullName[0].toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const displayName = fullName || email

  return (
    <nav className="bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">CareerCoach PK</span>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/app/dashboard" className="hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <span
          className="opacity-40 cursor-not-allowed select-none"
          title="Coming in Phase 2"
        >
          Sessions
        </span>
        <span
          className="opacity-40 cursor-not-allowed select-none"
          title="Coming in Phase 5"
        >
          Billing
        </span>
      </div>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-300 flex items-center justify-center text-sm font-semibold text-blue-900">
            {initials}
          </div>
        )}
        <span className="text-sm">{displayName}</span>
        <SignOutButton />
      </div>
    </nav>
  )
}
