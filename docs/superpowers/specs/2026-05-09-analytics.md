# Phase 10 — Analytics Spec

**Date:** 2026-05-09
**Status:** Draft — awaiting approval

---

## Overview

Add two analytics layers:

1. **Vercel Analytics** — automatic page views + Core Web Vitals. Zero config beyond one component. Visible in the Vercel dashboard.
2. **PostHog** — custom event tracking for the user journey. Free tier (1M events/month). Answers: are users completing sessions? where do they drop off? are trial users converting?

---

## Events to track

Only high-value funnel events — no noise.

| Event | Where | Key properties |
|-------|-------|----------------|
| `session_started` | SetupForm submit | `role`, `level`, `has_jd` (bool) |
| `session_completed` | SessionPlayer — last question answered | `session_id`, `avg_score` |
| `upgrade_clicked` | SubscribeButton click | — |
| `subscription_created` | Stripe webhook — `checkout.session.completed` | `user_id` |
| `subscription_cancelled` | Stripe webhook — `customer.subscription.deleted` | `user_id` |

`question_answered` is intentionally omitted — 10 events per session is noise. `session_completed` is the meaningful signal.

---

## Architecture

### Packages

```
@vercel/analytics   — Vercel page views + web vitals
posthog-js          — PostHog browser SDK
```

No PostHog Node SDK needed — server-side events (webhook) use a direct `fetch` to PostHog's `/capture` REST endpoint.

### PostHog initialisation

Create `src/components/providers/PostHogProvider.tsx` — a Client Component that:
1. Calls `posthog.init(key, { api_host, capture_pageview: false })` — disable auto pageview; Next.js App Router needs manual tracking because route changes don't trigger full page loads
2. Tracks pageviews manually via `usePathname` + `useSearchParams` in a `useEffect`
3. Must be wrapped in `<Suspense>` because `useSearchParams()` requires it in App Router

### User identification

Create `src/components/providers/PostHogIdentify.tsx` — a small Client Component placed in `src/app/app/layout.tsx` (authenticated routes only). It reads the Supabase user via `createClient()` and calls `posthog.identify(userId, { email, name })` once. This links all events to the correct PostHog person profile.

### Analytics utility

`src/lib/analytics.ts` — thin wrapper so component code never imports posthog-js directly:

```ts
import posthog from 'posthog-js'

export function captureEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}
```

### Vercel Analytics

Add `<Analytics />` from `@vercel/analytics/react` directly to `src/app/layout.tsx`. One line.

---

## Implementation details

### PostHogProvider (`src/components/providers/PostHogProvider.tsx`)

```tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

function PageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  useEffect(() => {
    posthog.capture('$pageview', { $current_url: window.location.href })
  }, [pathname, searchParams])
  return null
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })
  }, [])

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageviewTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}
```

### Root layout (`src/app/layout.tsx`)

Wrap `<body>` contents with `<PostHogProvider>` and add `<Analytics />`:

```tsx
import PostHogProvider from '@/components/providers/PostHogProvider'
import { Analytics } from '@vercel/analytics/react'

<body>
  <PostHogProvider>
    {children}
  </PostHogProvider>
  <Analytics />
</body>
```

### PostHogIdentify (`src/components/providers/PostHogIdentify.tsx`)

```tsx
'use client'
import { useEffect } from 'react'
import posthog from 'posthog-js'
import { createClient } from '@/lib/supabase/client'

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
```

Add `<PostHogIdentify />` to `src/app/app/layout.tsx`.

### Event calls

**SetupForm** (`src/components/session/setup-form.tsx`) — on successful session creation:
```ts
captureEvent('session_started', { role, level, has_jd: !!jdText.trim() })
```

**SessionPlayer** (`src/components/session/session-player.tsx`) — when last question's feedback is received:
```ts
if (isLastQuestion) captureEvent('session_completed', { session_id: sessionId, avg_score })
```

**SubscribeButton** (`src/components/billing/subscribe-button.tsx`) — on click:
```ts
captureEvent('upgrade_clicked')
```

**Stripe webhook** (`src/app/api/webhooks/stripe/route.ts`) — after successful DB update:
```ts
// checkout.session.completed
await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://app.posthog.com'}/capture/`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: process.env.POSTHOG_API_KEY,
    event: 'subscription_created',
    distinct_id: userId,
    properties: { user_id: userId },
  }),
})
```

Same pattern for `subscription_cancelled`.

---

## Environment variables

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...        # PostHog project API key (public)
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com  # or EU: https://eu.posthog.com
POSTHOG_API_KEY=phc_...                # Same key, used server-side in webhook
```

Add to `.env.local`, `.env.example`, and Vercel dashboard.

---

## Files to create / modify

| File | Action |
|------|--------|
| `src/components/providers/PostHogProvider.tsx` | Create |
| `src/components/providers/PostHogIdentify.tsx` | Create |
| `src/lib/analytics.ts` | Create |
| `src/app/layout.tsx` | Add PostHogProvider + Vercel Analytics |
| `src/app/app/layout.tsx` | Add PostHogIdentify |
| `src/components/session/setup-form.tsx` | Add `session_started` event |
| `src/components/session/session-player.tsx` | Add `session_completed` event |
| `src/components/billing/subscribe-button.tsx` | Add `upgrade_clicked` event |
| `src/app/api/webhooks/stripe/route.ts` | Add server-side capture for subscription events |
| `.env.local` + `.env.example` | Add PostHog vars |

---

## Out of scope

- A/B testing (PostHog feature flags — future)
- Funnel visualisations setup (done manually in PostHog dashboard after data flows in)
- Error tracking / Sentry (separate initiative)
