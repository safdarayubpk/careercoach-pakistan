'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  className?: string
}

export default function SignOutButton({ className }: Props) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className={className ?? "cursor-pointer text-sm text-white/80 hover:text-white transition-colors"}
    >
      Sign out
    </button>
  )
}
