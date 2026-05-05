# Phase 1 — Auth UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Google OAuth sign-in end-to-end — landing page stub with split hero, blue top nav, Supabase session, middleware route protection, and a placeholder dashboard.

**Architecture:** Auth-first stub approach. Landing page gets only nav + split hero to trigger OAuth. App shell uses a blue Server Component top nav with a nested `SignOutButton` Client Component island. Middleware uses `@supabase/ssr` to refresh session cookies on every `/app/*` request and enforce trial/subscription gates.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS 4, `@supabase/ssr`, `@supabase/supabase-js`

**Note on testing:** No automated tests in Phase 1. Google OAuth requires a live Supabase project and real Google credentials — mocking it produces false confidence. Verification is via the manual smoke test in Task 10.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/supabase/client.ts` | Create | Browser-side Supabase client (`createBrowserClient`) |
| `src/lib/supabase/server.ts` | Create | Server-side Supabase client (`createServerClient` + cookies) |
| `src/lib/supabase/middleware.ts` | Create | Middleware session refresh helper |
| `src/components/auth/sign-in-button.tsx` | Create | `'use client'` — Google OAuth trigger, `variant` prop |
| `src/components/auth/sign-out-button.tsx` | Create | `'use client'` — sign out + redirect |
| `src/components/layout/landing-nav.tsx` | Create | Server Component — marketing top nav |
| `src/components/layout/app-nav.tsx` | Create | Server Component — app top nav, fetches user |
| `src/app/layout.tsx` | Modify | Update metadata title/description |
| `src/app/page.tsx` | Delete | Replaced by `(marketing)/page.tsx` |
| `src/app/(marketing)/layout.tsx` | Create | Renders `<LandingNav>` above children |
| `src/app/(marketing)/page.tsx` | Create | Landing page stub — split hero |
| `src/app/(app)/layout.tsx` | Create | Renders `<AppNav>` above children |
| `src/app/(app)/dashboard/page.tsx` | Create | Stub welcome page |
| `src/app/auth/callback/route.ts` | Create | OAuth code exchange + user upsert |
| `src/middleware.ts` | Create | Route protection + session refresh for `/app/*` |
| `.env.local` | Create | Supabase env vars (not committed) |

---

## Task 1: Install Packages and Configure Environment

**Files:**
- Create: `.env.local`
- Modify: `package.json` (via pnpm)

- [ ] **Step 1: Install Supabase packages**

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

Expected output: packages added, no peer dependency warnings.

- [ ] **Step 2: Create `.env.local`**

Create `/.env.local` at the project root:

```bash
# Supabase — get these from your Supabase project dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Groq
GROQ_API_KEY=YOUR_GROQ_KEY

# Stripe (leave blank for now — Phase 5)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Important:** `.env.local` is already in `.gitignore` by default — never commit this file.

- [ ] **Step 3: Verify dev server starts**

```bash
pnpm dev
```

Expected: server starts at `http://localhost:3000` with no errors. The default Next.js page still loads. If you see `NEXT_PUBLIC_SUPABASE_URL` missing errors, confirm `.env.local` is at the project root (same level as `package.json`).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install @supabase/supabase-js and @supabase/ssr"
```

---

## Task 2: Supabase Client Utilities

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 1: Create the browser client**

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create the server client**

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — safe to ignore.
            // Middleware handles cookie refresh.
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create the middleware session helper**

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: use getUser() not getSession() — getSession() is unsafe server-side
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, supabaseResponse, user }
}
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: no errors. If you see `Cannot find module '@supabase/ssr'`, confirm Step 1 of Task 1 completed successfully.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/
git commit -m "feat: add Supabase client utilities (browser, server, middleware)"
```

---

## Task 3: Auth Button Components

**Files:**
- Create: `src/components/auth/sign-in-button.tsx`
- Create: `src/components/auth/sign-out-button.tsx`

- [ ] **Step 1: Create SignInButton**

Create `src/components/auth/sign-in-button.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

interface SignInButtonProps {
  variant: 'hero' | 'nav'
}

export default function SignInButton({ variant }: SignInButtonProps) {
  const supabase = createClient()

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  if (variant === 'nav') {
    return (
      <button
        onClick={handleSignIn}
        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-[#1E40AF] hover:bg-blue-50 transition-colors"
      >
        Sign In
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="inline-flex items-center gap-3 rounded-md bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
    >
      <GoogleLogo />
      Start Free Trial
    </button>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}
```

- [ ] **Step 2: Create SignOutButton**

Create `src/components/auth/sign-out-button.tsx`:

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-white/80 hover:text-white transition-colors"
    >
      Sign out
    </button>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/auth/
git commit -m "feat: add SignInButton and SignOutButton client components"
```

---

## Task 4: Nav Components

**Files:**
- Create: `src/components/layout/landing-nav.tsx`
- Create: `src/components/layout/app-nav.tsx`

- [ ] **Step 1: Create LandingNav**

Create `src/components/layout/landing-nav.tsx`:

```typescript
import SignInButton from '@/components/auth/sign-in-button'

export default function LandingNav() {
  return (
    <nav className="bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">CareerCoach PK</span>
      <div className="flex items-center gap-6 text-sm">
        <span className="opacity-60 cursor-not-allowed select-none">Features</span>
        <span className="opacity-60 cursor-not-allowed select-none">Pricing</span>
      </div>
      <SignInButton variant="nav" />
    </nav>
  )
}
```

- [ ] **Step 2: Create AppNav**

Create `src/components/layout/app-nav.tsx`:

```typescript
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
        <span className="opacity-40 cursor-not-allowed select-none" title="Coming in Phase 2">
          Sessions
        </span>
        <span className="opacity-40 cursor-not-allowed select-none" title="Coming in Phase 5">
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
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add LandingNav and AppNav server components"
```

---

## Task 5: Auth Callback Route

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Create the callback route**

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/', origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/', origin))
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/', origin))
  }

  // Upsert user row — ignoreDuplicates: true so trial_ends_at is never reset
  await supabase.from('users').upsert(
    {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )

  return NextResponse.redirect(new URL('/app/dashboard', origin))
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat: add OAuth callback route with user upsert"
```

---

## Task 6: Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware**

Create `src/middleware.ts` at the project root (`src/` level, same as `app/`):

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const { supabase, supabaseResponse, user } = await updateSession(request)

    // No session — send to landing page
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Fetch trial and subscription status
    const { data: userRow } = await supabase
      .from('users')
      .select('is_subscribed, trial_ends_at')
      .eq('id', user.id)
      .single()

    if (userRow) {
      const trialActive = new Date(userRow.trial_ends_at) > new Date()
      const hasAccess = userRow.is_subscribed || trialActive

      // Trial expired and not subscribed → billing
      // Allow /app/billing itself to prevent redirect loop
      if (!hasAccess && !request.nextUrl.pathname.startsWith('/app/billing')) {
        return NextResponse.redirect(new URL('/app/billing', request.url))
      }
    }

    // IMPORTANT: return supabaseResponse (with refreshed cookies), not NextResponse.next()
    return supabaseResponse
  } catch {
    // Supabase unreachable — show a safe error page, never expose raw errors
    return new NextResponse(
      '<html><body style="font-family:sans-serif;padding:2rem"><h1>Something went wrong</h1><p>Please try again in a moment.</p></body></html>',
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    )
  }
}

export const config = {
  matcher: ['/app/:path*'],
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add middleware for /app/* route protection and session refresh"
```

---

## Task 7: Marketing Layout and Landing Page

**Files:**
- Create: `src/app/(marketing)/layout.tsx`
- Create: `src/app/(marketing)/page.tsx`
- Delete: `src/app/page.tsx`

- [ ] **Step 1: Create the marketing layout**

Create `src/app/(marketing)/layout.tsx`:

```typescript
import LandingNav from '@/components/layout/landing-nav'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  )
}
```

- [ ] **Step 2: Create the landing page stub**

Create `src/app/(marketing)/page.tsx`:

```typescript
import SignInButton from '@/components/auth/sign-in-button'

export default function LandingPage() {
  return (
    <main className="flex-1 flex items-center">
      <div className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left column — pitch + CTA */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              Land Your Dream Job
              <br />
              <span className="text-[#1E40AF]">with AI-Powered Prep</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Paste a job description → get tailored interview questions +
              instant AI feedback. Built for Pakistan&apos;s job market.
            </p>
            <SignInButton variant="hero" />
            <p className="mt-3 text-sm text-gray-400">
              7 days free &middot; No credit card needed
            </p>
          </div>

          {/* Right column — static product preview */}
          <div className="bg-[#1E40AF] rounded-xl p-6 text-white">
            <p className="text-sm font-semibold text-blue-200 mb-3">
              Mock Interview Preview
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-3">
              <p className="text-sm">
                &ldquo;Tell me about your experience with React and how you&apos;ve
                used it in a production environment.&rdquo;
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-blue-200 font-medium mb-1">
                AI Feedback
              </p>
              <p className="text-sm text-white">Score: 8/10 &middot; Strong answer</p>
              <p className="text-xs text-blue-200 mt-1">
                Clear structure, relevant examples. Add more on performance
                optimisation.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Delete the old landing page**

```bash
rm src/app/page.tsx
```

> The `/` route is now served by `src/app/(marketing)/page.tsx`. Next.js route groups (`(marketing)`) don't affect the URL — `/` still works.

- [ ] **Step 4: Verify the landing page loads**

```bash
pnpm dev
```

Open `http://localhost:3000` — you should see the blue nav, split hero, and "Start Free Trial" button. If you see a 404, check that `src/app/page.tsx` was deleted.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(marketing\)/
git commit -m "feat: add marketing layout and landing page stub with split hero"
```

---

## Task 8: App Layout and Dashboard Stub

**Files:**
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create the app layout**

Create `src/app/(app)/layout.tsx`:

```typescript
import AppNav from '@/components/layout/app-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AppNav />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 2: Create the dashboard stub**

Create `src/app/(app)/dashboard/page.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const name: string = user?.user_metadata?.full_name || user?.email || 'there'

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
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/
git commit -m "feat: add app layout with AppNav and dashboard stub"
```

---

## Task 9: Root Layout Metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update metadata**

In `src/app/layout.tsx`, replace the metadata block only:

```typescript
export const metadata: Metadata = {
  title: 'CareerCoach Pakistan — AI Interview Prep',
  description:
    'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
}
```

Leave everything else in `src/app/layout.tsx` unchanged (fonts, body classes, etc.).

- [ ] **Step 2: Commit**

```bash
git add src/app/layout.tsx
git commit -m "chore: update root layout metadata for CareerCoach Pakistan"
```

---

## Task 10: Supabase Project Setup (Dashboard Steps)

These steps happen in the Supabase dashboard and SQL editor — not in code.

- [ ] **Step 1: Create Supabase project**

Go to [supabase.com](https://supabase.com) → New project → name it `careercoach-pakistan`. Copy the Project URL and anon key into `.env.local`.

- [ ] **Step 2: Enable Google OAuth**

Supabase dashboard → Authentication → Providers → Google → Enable.

Add your Google OAuth credentials (from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID). You need:
- Client ID → paste into Supabase
- Client secret → paste into Supabase

In Google Cloud Console, add these to **Authorised redirect URIs**:
```
https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
```

- [ ] **Step 3: Add redirect URLs in Supabase**

Supabase dashboard → Authentication → URL Configuration:
- Site URL: `http://localhost:3000`
- Redirect URLs (add both):
  - `http://localhost:3000/auth/callback`
  - `https://careercoach.pk/auth/callback`

- [ ] **Step 4: Create the users table**

Supabase dashboard → SQL Editor → New query → paste and run:

```sql
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  is_subscribed boolean not null default false,
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

-- Row Level Security
alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);
```

Expected: "Success. No rows returned."

- [ ] **Step 5: Verify table exists**

Supabase dashboard → Table Editor → confirm `users` table appears with the correct columns.

---

## Task 11: Manual Smoke Test

Run through every item. Don't skip. Each test maps to acceptance criteria in `docs/specs/01-auth.md`.

- [ ] **1. Landing page loads** — visit `http://localhost:3000`
  - Blue nav visible with CareerCoach PK logo, greyed-out Features/Pricing, "Sign In" button
  - Split hero visible: headline, "Start Free Trial" button, product preview card on right
  - Expected: no console errors, no 404

- [ ] **2. Google OAuth triggers** — click "Start Free Trial"
  - Expected: browser redirects to Google consent screen
  - If nothing happens: check `NEXT_PUBLIC_SITE_URL` in `.env.local` and Supabase Google provider is enabled

- [ ] **3. Sign-in succeeds** — complete Google OAuth
  - Expected: lands on `http://localhost:3000/app/dashboard`
  - Blue AppNav visible with your name and avatar (or initials)
  - "Welcome back, {your name}" heading visible
  - If redirected to `/`: check Supabase redirect URLs and `.env.local` values

- [ ] **4. User row created** — check Supabase dashboard → Table Editor → `users`
  - Expected: one row with your email, `is_subscribed = false`, `trial_ends_at` ≈ 7 days from now

- [ ] **5. Sign out** — click "Sign out" in AppNav
  - Expected: redirected to `http://localhost:3000`
  - AppNav gone, LandingNav visible

- [ ] **6. Protected route redirects** — visit `http://localhost:3000/app/dashboard` directly (not signed in)
  - Expected: redirected to `http://localhost:3000/`

- [ ] **7. Session persists** — sign in, close browser tab, reopen `http://localhost:3000/app/dashboard`
  - Expected: stays on dashboard (not redirected to `/`)

- [ ] **8. Returning user keeps trial** — sign out and sign in again with the same Google account
  - Check `users` table in Supabase — `trial_ends_at` must NOT have changed
  - Expected: same timestamp as first login

- [ ] **9. Billing redirect on expired trial** — in Supabase SQL Editor run:
  ```sql
  update public.users set trial_ends_at = now() - interval '1 day' where email = 'YOUR_EMAIL';
  ```
  Then visit `http://localhost:3000/app/dashboard`
  - Expected: redirected to `http://localhost:3000/app/billing` (404 is fine — page doesn't exist yet)
  - Reset after: `update public.users set trial_ends_at = now() + interval '7 days' where email = 'YOUR_EMAIL';`

- [ ] **10. Subscribed user bypasses trial gate** — in Supabase SQL Editor run:
  ```sql
  update public.users set is_subscribed = true where email = 'YOUR_EMAIL';
  ```
  Visit `http://localhost:3000/app/dashboard` with expired trial
  - Expected: access granted, not redirected to billing
  - Reset after: `update public.users set is_subscribed = false where email = 'YOUR_EMAIL';`

- [ ] **11. Callback without code** — visit `http://localhost:3000/auth/callback` directly (no `?code` param)
  - Expected: redirected to `http://localhost:3000/`

- [ ] **12. Final type-check and lint**

```bash
pnpm type-check && pnpm lint
```

Expected: no errors or warnings.

- [ ] **13. Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 auth UI — smoke test passed"
```
