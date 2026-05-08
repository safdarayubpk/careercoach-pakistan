'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'

// Identifies the authenticated user in PostHog so all events are linked
// to a person profile. Placed in the app layout (authenticated routes only).
export default function PostHogIdentify() {
  useEffect(() => {
    async function identify() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        posthog.identify(user.id, {
          email: user.email,
          name: user.user_metadata?.full_name,
        })
      }
    }
    identify()
  }, [])

  return null
}
