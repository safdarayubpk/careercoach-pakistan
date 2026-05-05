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

| File | Purpose |
|---|---|
| `src/lib/supabase/client.ts` | Browser-side Supabase client |
| `src/lib/supabase/server.ts` | Server-side Supabase client (cookies) |
| `src/app/auth/callback/route.ts` | Exchanges OAuth code, upserts user row, redirects to dashboard |
| `src/middleware.ts` | Protects `/app/*`, checks trial + subscription status |

---

## Components

### `src/components/auth/sign-in-button.tsx`
- Props: `variant: "hero" | "nav"`
- `hero`: larger button, white background, Google logo SVG, "Start Free Trial" label
- `nav`: smaller button, fits nav bar, "Sign In" label
- On click: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '/auth/callback' } })`

### `src/components/auth/sign-out-button.tsx`
- On click: `supabase.auth.signOut()` then `router.push('/')`
- Sits in app nav beside avatar

### `src/components/layout/landing-nav.tsx`
- Blue bar (`#1E40AF`), white text
- Logo left | Features + Pricing anchor links center (non-functional in Phase 1) | `<SignInButton variant="nav" />` right
- No mobile hamburger — Phase 7

### `src/components/layout/app-nav.tsx`
- Blue bar (`#1E40AF`), white text
- Logo left | Dashboard + Sessions + Billing links center | Avatar + name + `<SignOutButton />` right
- Avatar: `user.user_metadata.avatar_url` — falls back to initials circle if null

### `src/components/layout/dashboard-shell.tsx`
- Content wrapper for the dashboard page (Phase 1 stub)
- "Welcome back, {name}" + placeholder card
- Replaced with real content in Phase 4

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
middleware.ts
  → No session → redirect to /
  → Has session → fetch users row (is_subscribed, trial_ends_at)
  → Trial active OR is_subscribed = true → allow through
  → Trial expired AND not subscribed → redirect to /app/billing
  → /app/billing itself always accessible (avoids redirect loop)
```

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
      sign-in-button.tsx
      sign-out-button.tsx
    layout/
      landing-nav.tsx
      app-nav.tsx
      dashboard-shell.tsx
  lib/
    supabase/
      client.ts
      server.ts
  app/
    (marketing)/
      page.tsx          ← landing page stub
      layout.tsx        ← uses LandingNav
    (app)/
      dashboard/
        page.tsx        ← uses DashboardShell
      layout.tsx        ← uses AppNav, auth guard
    auth/
      callback/
        route.ts
  middleware.ts
```

---

## Out of Scope (Phase 1)

- Features section, pricing section, testimonials → Phase 6
- Mobile hamburger menu → Phase 7
- Framer Motion animations → Phase 7
- Urdu language toggle → Phase 7
- Playwright E2E tests → Phase 7
- Avatar loading skeleton → Phase 7
