import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name: string =
    user?.user_metadata?.full_name || user?.email || 'there'

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
        <Link
          href="/app/session/setup"
          className="rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          + New Session
        </Link>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Your sessions will appear here.</p>
        <p className="text-sm text-gray-400 mt-1">
          This dashboard is built in Phase 4.
        </p>
      </div>
    </div>
  )
}
