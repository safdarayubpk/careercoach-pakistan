import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name: string =
    user?.user_metadata?.full_name || user?.email || 'there'

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome back, {name}
      </h1>
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Your sessions will appear here.</p>
        <p className="text-sm text-gray-400 mt-1">
          This dashboard is built in Phase 4.
        </p>
      </div>
    </div>
  )
}
