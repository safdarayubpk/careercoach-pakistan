# Auth Flow UI Design
**Date:** 2026-05-05
**Phase:** 1 — Auth
**Status:** Approved — ready for implementation planning

---

## Context

Phase 1 implements Google OAuth via Supabase, protected routes, and the user table. This design covers the UI layer — what the user sees and interacts with — built on top of the auth plumbing already specced in `docs/specs/01-auth.md`.

**Approach chosen:** Auth-first, landing stub. A working sign-in flow end-to-end is the goal. The landing page gets only what's needed to trigger OAuth. Full split-hero polish, features section, pricing section, and animations come in Phase 6.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Hero layout | Split hero | Left: pitch + CTA. Right: static product preview. Shows what the product does before sign-in. |
| Landing nav | Logo + Features/Pricing links + "Sign In" + hero "Start Free Trial" | Separates returning users (Sign In) from new users (Start Free Trial) |
| App shell | Blue top nav bar | Full page-width content, mobile-friendly, matches brand colour `#1E40AF`, 3 nav items don't justify a sidebar |
| Landing page scope now | Stub only | Nav + split hero sufficient to test auth end-to-end. Remaining sections built in Phase 6. |
| Loading states | None | Google OAuth redirect is fast enough. Polish in Phase 7 if needed. |
| Automated tests | None (manual smoke test) | Real OAuth + live Supabase makes unit tests brittle at this stage. Playwright added in Phase 7. |

---

## Architecture

### Two UI Surfaces

**Landing page** — `app/(marketing)/page.tsx` — public

```
LandingNav
  Logo (left)
  Features + Pricing anchor links (center) — non-functional placeholders in Phase 1, no target sections exist yet
  <SignInButton variant="nav" /> (right) — "Sign In"

SplitHero
  Left column:
    Headline: "Land Your Dream Job with AI-Powered Prep"
    Subtext: "Paste a JD → tailored questions + instant AI feedback"
    <SignInButton variant="hero" /> — "Start Free Trial"
    Fine print: "7 days free · No credit card needed"
  Right column:
    Static product preview card (hardcoded mock)
    Mock question: "Tell me about your React experience"
    Mock score: "Score: 8/10 · Strong answer"
```

**App shell** — `app/(app)/layout.tsx` — protected

```
AppNav
  Logo "CareerCoach PK" (left)
  Dashboard + Sessions + Billing links (center)
  Avatar (Google profile photo or initials fallback) + name + <SignOutButton /> (right)

Content area:
  max-w-5xl mx-auto px-4
  Full page width below nav

DashboardShell (placeholder — replaced in Phase 4):
  "Welcome back, {name}" heading
  Placeholder card: "Your sessions will appear here"
```

### Auth Plumbing (no UI)

**Required install:** `pnpm add @supabase/supabase-js @supabase/ssr`

| File | Purpose |
|---|---|
| `src/lib/supabase/client.ts` | Browser-side Supabase client (`createBrowserClient` from `@supabase/ssr`) |
| `src/lib/supabase/server.ts` | Server-side Supabase client (`createServerClient` from `@supabase/ssr`, reads cookies) |
| `src/app/auth/callback/route.ts` | Exchanges OAuth code, upserts user row, redirects to dashboard |
| `src/middleware.ts` | Protects `/app/*`, refreshes session, checks trial + subscription status |

---

## Components

### `src/components/auth/sign-in-button.tsx`
- **Must be `'use client'`** — calls `supabase.auth.signInWithOAuth` (client-side API)
- Props: `variant: "hero" | "nav"`
- `hero`: larger button, white background, Google logo SVG, "Start Free Trial" label
- `nav`: smaller button, fits nav bar, "Sign In" label
- On click: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: \`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback\` } })`
- `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000` in dev, `https://careercoach.pk` in production

### `src/components/auth/sign-out-button.tsx`
- **Must be `'use client'`** — calls `supabase.auth.signOut()` and `router.push` (client-side APIs)
- On click: `supabase.auth.signOut()` then `router.push('/')`
- Sits in app nav beside avatar — extracted as a Client Component so `AppNav` can stay a Server Component

### `src/components/layout/landing-nav.tsx`
- **Server Component** — no interactivity needed (sign-in is handled by the nested `<SignInButton />` Client Component)
- Blue bar (`#1E40AF`), white text
- Logo left | Features + Pricing as plain `<span>` (non-functional in Phase 1, no `href`) center | `<SignInButton variant="nav" />` right
- No mobile hamburger — Phase 7

### `src/app/(marketing)/layout.tsx`
- Wraps the marketing route group
- Renders `<LandingNav />` above `{children}`
- No other layout concerns in Phase 1 (footer, etc. come in Phase 6)

### `src/components/layout/app-nav.tsx`
- **Server Component** — fetches user server-side via `createServerClient()` + `supabase.auth.getUser()`
- Blue bar (`#1E40AF`), white text
- Logo left | nav links center | Avatar + name + `<SignOutButton />` right
- Nav links: `Dashboard` as `<Link>`. `Sessions` and `Billing` rendered as plain `<span>` (non-interactive, no `<Link>`) until Phase 2 and Phase 5 ship their routes — avoids 404s
- Avatar: `user.user_metadata.avatar_url` from Google. Fallback: initials circle using first letter of `full_name` if available, else first two characters of `email`. Both `full_name` and `avatar_url` can be null from Google — always check both
- `<SignOutButton />` is a nested Client Component inside this Server Component — the only interactive element

### `src/app/(app)/dashboard/page.tsx` (stub — no separate component)
- Server Component — fetches user via `supabase.auth.getUser()` for the welcome message
- Renders "Welcome back, {name}" heading + placeholder card "Your sessions will appear here" inline
- No separate `dashboard-shell` component — this is throwaway content replaced in Phase 4, not worth abstracting

---

## Data Flow

### Sign-in
```
User clicks "Start Free Trial" or "Sign In"
  → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Browser → Google consent screen
  → Google → /auth/callback?code=xxx
  → exchangeCodeForSession(code)
  → upsert users table (ignoreDuplicates: true — trial_ends_at never reset)
  → redirect to /app/dashboard
```

### Every `/app/*` request
```
middleware.ts  (@supabase/ssr — NOT @supabase/auth-helpers-nextjs)
  → createServerClient() with cookie handlers that read from request and write to response
  → supabase.auth.getUser() — MUST use getUser(), not getSession() (getSession() is unsafe server-side)
  → Refreshes auth token and forwards updated cookies in response (prevents token expiry lockout)
  → No user → redirect to /
  → Has user → fetch users row (is_subscribed, trial_ends_at)
  → Trial active OR is_subscribed = true → allow through (forward response with refreshed cookies)
  → Trial expired AND not subscribed → redirect to /app/billing
  → /app/billing itself always accessible (avoids redirect loop)
```

**Critical:** middleware must always return the `response` object (with updated cookies) on the allow-through path — not a bare `NextResponse.next()`. Dropping the cookies breaks session persistence.

### Sign-out
```
User clicks sign out
  → supabase.auth.signOut()
  → router.push('/')
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| OAuth cancelled or failed | Supabase redirects to `/` — no error shown (spec AC-3) |
| `/auth/callback` hit without `?code` | Redirect to `/` immediately |
| Supabase unreachable in middleware | Catch block → minimal "Something went wrong, try again" page — no raw error |

---

## Testing (Manual Smoke Test)

Run after implementation. Covers the key acceptance criteria from `docs/specs/01-auth.md` (AC-1 through AC-14).

1. Visit `/` → landing page loads, nav shows logo + links + "Sign In"
2. Click "Start Free Trial" → Google consent screen appears
3. Complete OAuth → lands on `/app/dashboard`, shows "Welcome back, {name}"
4. Sign out → lands on `/`, session cleared
5. Visit `/app/dashboard` directly → redirects to `/`
6. Sign in again → `trial_ends_at` NOT reset (verify in Supabase table)
7. Visit `/app/billing` without subscription → allowed (no redirect loop)
8. Set `trial_ends_at` to past in Supabase → `/app/dashboard` redirects to `/app/billing`
9. Set `is_subscribed = true` → `/app/dashboard` allowed regardless of trial date
10. Hit `/auth/callback` with no `?code` → redirects to `/`

---

## Files Created by This Design

```
src/
  components/
    auth/
      sign-in-button.tsx   ← 'use client'
      sign-out-button.tsx  ← 'use client'
    layout/
      landing-nav.tsx      ← Server Component
      app-nav.tsx          ← Server Component (contains SignOutButton client island)
  lib/
    supabase/
      client.ts            ← createBrowserClient (@supabase/ssr)
      server.ts            ← createServerClient (@supabase/ssr)
  app/
    (marketing)/
      page.tsx             ← landing page stub (hero + sign-in)
      layout.tsx           ← renders LandingNav above {children}
    (app)/
      dashboard/
        page.tsx           ← stub: "Welcome back" + placeholder (inline, no separate component)
      layout.tsx           ← renders AppNav, auth guard via middleware
    auth/
      callback/
        route.ts           ← OAuth code exchange + user upsert
  middleware.ts            ← @supabase/ssr session refresh + /app/* protection
```

---

## Out of Scope (Phase 1)

- Features section, pricing section, testimonials → Phase 6
- Mobile hamburger menu → Phase 7
- Framer Motion animations → Phase 7
- Urdu language toggle → Phase 7
- Playwright E2E tests → Phase 7
- Avatar loading skeleton → Phase 7
