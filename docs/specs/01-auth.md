# Spec 01 — Authentication
**Project:** CareerCoach Pakistan  
**Feature:** Google OAuth login + protected routes + user session  
**Phase:** 1 (Foundation)  
**Status:** Ready to implement

---

## Overview

Users sign in with Google via Supabase Auth. On first login, a row is created in the `users` table with a 7-day trial period. All `/app/*` routes are protected by middleware — unauthenticated users are redirected to the landing page. After trial expiry and no subscription, users are redirected to `/app/billing`.

---

## Requirements

### User Stories

**Story 1:** As a new visitor, I want to sign in with Google so that I can start using CareerCoach without creating a password.

**Story 2:** As a returning user, I want my session to persist so that I don't have to log in every time I visit.

**Story 3:** As a trial user, I want 7 free days so that I can evaluate the product before paying.

**Story 4:** As an expired trial user, I want to be shown the billing page so that I know how to continue using the product.

---

### Acceptance Criteria (EARS Format)

**Login**
1. WHEN visitor clicks "Sign in with Google" THEN system SHALL redirect to Google OAuth consent screen via Supabase
2. WHEN Google OAuth succeeds THEN system SHALL redirect user to `/app/dashboard`
3. WHEN Google OAuth fails or is cancelled THEN system SHALL redirect user back to landing page with no error shown
4. WHEN user signs in for the first time THEN system SHALL create a row in `users` table with `trial_ends_at = now() + 7 days`
5. WHEN user signs in again (returning) THEN system SHALL NOT create a duplicate row in `users` table

**Session**
6. WHEN authenticated user visits any `/app/*` route THEN system SHALL allow access without redirect
7. WHEN unauthenticated user visits any `/app/*` route THEN system SHALL redirect to `/` (landing page)
8. WHEN user clicks "Sign out" THEN system SHALL clear session and redirect to `/`
9. WHEN user closes and reopens browser THEN system SHALL restore session automatically (Supabase cookie)

**Trial + Subscription Gate**
10. WHEN authenticated user's `trial_ends_at` is in the future AND `is_subscribed = false` THEN system SHALL allow access to all `/app/*` routes
11. WHEN authenticated user's `trial_ends_at` has passed AND `is_subscribed = false` THEN system SHALL redirect to `/app/billing`
12. WHEN authenticated user's `is_subscribed = true` THEN system SHALL allow access regardless of trial date

**Edge Cases**
13. WHEN Supabase is unreachable THEN system SHALL show a generic "Something went wrong" message, not a raw error
14. WHEN user visits `/auth/callback` directly without a valid code param THEN system SHALL redirect to `/`

---

## Design

### Architecture

```
Landing page (/)
  └── "Sign in with Google" button
        └── Supabase signInWithOAuth({ provider: 'google' })
              └── Google consent screen
                    └── /auth/callback?code=xxx
                          └── Exchange code → Supabase session
                                └── Upsert users table
                                      └── Redirect to /app/dashboard

middleware.ts (runs on every /app/* request)
  ├── No session → redirect to /
  ├── Trial active → allow through
  ├── Trial expired + not subscribed → redirect to /app/billing
  └── Subscribed → allow through
```

### Components to Create

| File | Purpose |
|------|---------|
| `src/app/auth/callback/route.ts` | Exchanges OAuth code for Supabase session |
| `src/middleware.ts` | Protects all `/app/*` routes |
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies) |
| `src/lib/supabase/middleware.ts` | Supabase session refresh helper |
| `src/components/auth/sign-in-button.tsx` | "Sign in with Google" button component |
| `src/components/auth/sign-out-button.tsx` | Sign out button component |

### Database

```sql
-- Run in Supabase SQL editor

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

### Supabase Configuration (Dashboard)

1. Enable Google provider in Supabase → Authentication → Providers
2. Add Google OAuth credentials (Client ID + Secret from Google Cloud Console)
3. Add redirect URL: `https://careercoach.pk/auth/callback`
4. Add localhost redirect: `http://localhost:3000/auth/callback`

### Middleware Logic

```typescript
// src/middleware.ts — pseudo-code
export async function middleware(request: NextRequest) {
  const { user, supabase, response } = await createMiddlewareClient(request)

  // Not logged in → send to landing page
  if (!user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Fetch user row from DB
  const { data: userRow } = await supabase
    .from('users')
    .select('is_subscribed, trial_ends_at')
    .eq('id', user.id)
    .single()

  const trialActive = new Date(userRow.trial_ends_at) > new Date()
  const hasAccess = userRow.is_subscribed || trialActive

  // Trial expired, not subscribed → billing
  if (!hasAccess && !request.nextUrl.pathname.startsWith('/app/billing')) {
    return NextResponse.redirect(new URL('/app/billing', request.url))
  }

  return response
}

export const config = {
  matcher: ['/app/:path*']
}
```

### Auth Callback Route

```typescript
// src/app/auth/callback/route.ts — pseudo-code
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = createServerClient()
  await supabase.auth.exchangeCodeForSession(code)

  // Upsert user row (safe for returning users)
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('users').upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata.full_name,
    avatar_url: user.user_metadata.avatar_url,
  }, { onConflict: 'id', ignoreDuplicates: true })

  return NextResponse.redirect(new URL('/app/dashboard', request.url))
}
```

`ignoreDuplicates: true` ensures `trial_ends_at` is NOT reset on subsequent logins.

---

### Decision Log

**Decision: Google OAuth only (no email/password)**  
Context: Needed an auth method for Pakistani users.  
Options: Email+password vs Google OAuth vs Phone (OTP)  
Decision: Google OAuth only  
Rationale: Pakistani professionals all have Google accounts. No password to forget. Fastest path to first session. Can add email later if needed.

**Decision: Trial gate enforced in middleware (server-side)**  
Context: Could check trial on client or server.  
Decision: Middleware (server-side)  
Rationale: Client-side checks can be bypassed. Middleware runs before page renders — user never sees protected content.

---

## Tasks

- [ ] **1. Supabase project setup**
  - Create new Supabase project named `careercoach-pakistan`
  - Enable Google OAuth provider (add Client ID + Secret)
  - Add redirect URLs (localhost + production)
  - _Requirements: AC-1_

- [ ] **2. Create `users` table**
  - Run SQL from Design section above in Supabase SQL editor
  - Enable RLS, add read + update policies
  - _Requirements: AC-4, AC-5_

- [ ] **3. Install and configure Supabase packages**
  - `pnpm add @supabase/supabase-js @supabase/ssr`
  - Create `src/lib/supabase/client.ts` (browser client)
  - Create `src/lib/supabase/server.ts` (server client with cookies)
  - Add all Supabase env vars to `.env.local`
  - _Requirements: AC-6_

- [ ] **4. Create `/auth/callback` route**
  - Create `src/app/auth/callback/route.ts`
  - Exchange code for session
  - Upsert user row (ignoreDuplicates: true)
  - Redirect to `/app/dashboard` on success, `/` on failure
  - _Requirements: AC-2, AC-3, AC-4, AC-5, AC-14_

- [ ] **5. Create middleware**
  - Create `src/middleware.ts`
  - Protect all `/app/*` routes
  - Check trial + subscription status
  - Redirect unauthenticated → `/`, expired trial → `/app/billing`
  - _Requirements: AC-6, AC-7, AC-10, AC-11, AC-12_

- [ ] **6. Create `SignInButton` component**
  - Create `src/components/auth/sign-in-button.tsx`
  - Calls `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })`
  - Shows Google logo + "Sign in with Google" text
  - _Requirements: AC-1_

- [ ] **7. Create `SignOutButton` component**
  - Create `src/components/auth/sign-out-button.tsx`
  - Calls `supabase.auth.signOut()` then `router.push('/')`
  - _Requirements: AC-8_

- [ ] **8. Add sign-in button to landing page**
  - Import `SignInButton` into `src/app/(marketing)/page.tsx`
  - Place in hero section CTA
  - _Requirements: AC-1_

- [ ] **9. Add sign-out button to app layout**
  - Import `SignOutButton` into `src/app/(app)/layout.tsx` navbar
  - _Requirements: AC-8_

- [ ] **10. Manual smoke test**
  - Sign in with Google → lands on `/app/dashboard` ✓
  - Sign out → lands on `/` ✓
  - Visit `/app/dashboard` without session → redirects to `/` ✓
  - Sign in again → trial_ends_at NOT reset ✓
  - _Requirements: All AC above_

---

## Files Created by This Spec

```
src/
  app/
    auth/
      callback/
        route.ts
    (app)/
      layout.tsx          ← add SignOutButton here
    (marketing)/
      page.tsx            ← add SignInButton here
  components/
    auth/
      sign-in-button.tsx
      sign-out-button.tsx
  lib/
    supabase/
      client.ts
      server.ts
  middleware.ts
```

---

_Next spec: `02-interview-session.md` — Setup form, question screen, answer input_
