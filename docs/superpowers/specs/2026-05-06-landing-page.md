# Phase 6 — Landing Page Design Spec

**Date:** 2026-05-06
**Status:** Approved — ready for implementation

---

## Overview

Replace the placeholder marketing landing page (`app/(marketing)/page.tsx`) with a full conversion-focused page targeting Pakistani job seekers. The page has 4 sections: Nav, Hero, Features, Pricing, Footer. Each section is its own component file.

Primary goal: convert visitors into free trial sign-ups (7 days, no credit card).

---

## Sections

**Section order:**
1. Nav Bar (sticky)
2. Hero
3. Features (6-card grid)
4. Pricing (comparison table)
5. Footer (minimal)

---

## Section 1 — Nav Bar

**Component:** `src/components/layout/LandingNav.tsx` (replace existing `landing-nav.tsx`)

- Background: `#1E40AF` (Blue 800), full width
- Left: "CareerCoach PK" wordmark, white, bold
- Center: "Features" and "Pricing" anchor links (`#features`, `#pricing`), white/85% opacity
- Right: Google-branded "Sign in with Google" button
  - White background, `#3c4043` text, Roboto font
  - Colored Google G SVG logo (official colors: blue #4285F4, red #EA4335, yellow #FBBC05, green #34A853)
  - Border: `1px solid #dadce0`, border-radius: 4px, padding: 10px 16px
  - This replaces the existing generic blue SignInButton for the landing nav
- Nav is sticky (position: sticky, top: 0, z-index: 50)

---

## Section 2 — Hero

**Component:** `src/components/landing/HeroSection.tsx`

**Layout:** 2-column grid (1fr 1fr), centered, max-width 900px, gap 48px. Responsive: stacks to 1 column on mobile.

**Left column — pitch:**
- Badge: "Built for Pakistan 🇵🇰" — light blue pill (`#dbeafe` bg, `#1E40AF` text), uppercase, 11px
- H1: "Ace Your Next Interview" / "for PKR 999/month" — 36px, 800 weight. "for PKR 999/month" in `#1E40AF`
- Sub-headline: "Paste a job description → get tailored questions + instant AI feedback. In English or Urdu." — 15px, `#4b5563`
- Social proof: "Join 500+ Pakistani professionals already practising smarter." — 13px, `#6b7280`
- CTA button: "Start Free Trial — 7 Days Free" — full width, `#1E40AF` bg, white text, 15px bold, border-radius 10px, padding 14px 28px. Clicking this initiates Google OAuth (same as Sign In — no separate signup flow)
- Trust line: "No credit card needed · Cancel anytime" — 12px, `#9ca3af`, centered

**Right column — product preview card:**
- Background: `#1E40AF`, border-radius 16px, padding 24px, white text
- Label: "Live Preview" — 11px, 60% white opacity, uppercase
- Mock question bubble: "Tell me about your experience with React in a production environment." — white/10% bg, border-radius 10px, 13px
- Mock feedback bubble: Score "8/10 · Strong answer ✓" (bold), tip "Clear structure, good examples. Add more on performance optimisation." — same style

**Section background:** `#f8fafc`

---

## Section 3 — Features

**Component:** `src/components/landing/FeaturesSection.tsx`

**Section id:** `features`
**Background:** white
**Padding:** `py-16 md:py-24`

**Header (centered):**
- Eyebrow: "Features" — 11px, `#1E40AF`, uppercase, bold, letter-spacing 0.5px
- H2: "Everything you need to land the job" — 28px, 800 weight
- Sub: "Designed specifically for Pakistan's job market" — 14px, `#6b7280`

**Grid:** 3 columns (desktop), 1 column (mobile), gap 20px, max-width 900px centered

**6 cards** (border `#e5e7eb`, border-radius 12px, padding 20px):
1. 🎯 **JD-Tailored Questions** — "Paste any job description and get 10 questions tailored to that role, level, and tech stack."
2. ⚡ **Instant AI Feedback** — "Powered by Groq — score, what you got right, what you missed, and a model answer in seconds."
3. 🎤 **Urdu Voice Input** — "Answer in Urdu using your microphone. The only interview coach built for Pakistan's bilingual professionals."
4. 📊 **Progress Dashboard** — "Track scores across sessions. See improvement over time in Technical, Behavioral, and System Design."
5. 🏷️ **PKR 999/month** — "7x cheaper than Final Round AI. No dollar conversion. Local pricing for local professionals."
6. 🔄 **Unlimited Sessions** — "Practice as many times as you want. New questions every session based on the same or different JD."

---

## Section 4 — Pricing

**Component:** `src/components/landing/PricingSection.tsx`

**Section id:** `pricing`
**Background:** `#f8fafc`
**Padding:** `py-16 md:py-24`

**Header (centered):**
- Eyebrow: "Pricing" — 11px, `#1E40AF`, uppercase
- H2: "Built for Pakistan. Priced for Pakistan." — 28px, 800 weight
- Sub: "Why pay in dollars when you don't have to?" — 14px, `#6b7280`

**Comparison table** (max-width 800px, centered):
- Background white, border-radius 16px, box-shadow `0 1px 3px rgba(0,0,0,0.1)`
- Header row: `#1E40AF` bg, white text
  - Columns: Feature | CareerCoach PK ⭐ | Final Round AI | Huru.ai
- Row 1 — Monthly Price: **PKR 999** (bold blue) | ~~PKR 7,000~~ | ~~PKR 5,300~~
- Row 2 — Urdu Language: ✅ | ❌ | ❌
- Row 3 — JD-Tailored Questions: ✅ | ❌ | ❌
- Row 4 — Built for Pakistan: ✅ | ❌ | ❌
- Row 5 — Free Trial: "7 days, no card" (green) | "Limited" | "Limited"

**CTA below table (centered):**
- Button: "Start Free Trial — 7 Days Free" — same style as hero CTA, initiates Google OAuth
- Trust line: "No credit card · Cancel anytime" — 12px, `#9ca3af`

---

## Section 5 — Footer

**Component:** `src/components/landing/FooterSection.tsx`

- Background: `#111`, padding `24px 32px`
- Left: "© 2026 CareerCoach Pakistan. All rights reserved." — 13px, white/50% opacity
- Right: "Privacy Policy" and "Terms of Service" links — 12px, white/40% opacity, no underline
- Links point to `/privacy` and `/terms` (placeholder routes, no-op for now — pages can be added later)

---

## Page Composition

**File:** `src/app/(marketing)/page.tsx`

```tsx
import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import FooterSection from '@/components/landing/FooterSection'

export default function LandingPage() {
  return (
    <>
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <FooterSection />
    </>
  )
}
```

**File:** `src/app/(marketing)/layout.tsx` — update the import path to point at the new component:

```tsx
import LandingNav from '@/components/layout/LandingNav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  )
}
```

`LandingNav` is rendered by the layout, not by `page.tsx` — this avoids double-rendering the nav.

---

## Google Sign-In Button

The `SignInButton` component at `src/components/auth/SignInButton.tsx` must be updated to render the Google-branded button per Google's branding guidelines:

- White background (`#ffffff`)
- Border: `1px solid #dadce0`, border-radius: 4px
- Colored Google G SVG (inline SVG, official 4-color G)
- Label: "Sign in with Google" — Roboto font (import from Google Fonts or use system fallback), `#3c4043`, 14px, medium weight
- Hover state: background `#f8f8f8`
- The button triggers the same `signInWithGoogle()` call as before

The updated `SignInButton` is used in both `LandingNav` (top right) and `HeroSection` (CTA button area — note: the hero CTA is a large full-width blue button; clicking it should also call `signInWithGoogle()`, styled differently from the standard Google button since it's a primary CTA, not an authentication affordance).

**Clarification on two button styles:**
- **Hero CTA** ("Start Free Trial — 7 Days Free"): Large, full-width, `#1E40AF` background — calls `signInWithGoogle()`. Styled as a primary marketing CTA, not Google-branded.
- **Nav "Sign in with Google"**: White, Google-branded, standard size — same `signInWithGoogle()` call. Follows Google branding guidelines exactly.
- **Pricing CTA** ("Start Free Trial — 7 Days Free"): Same as hero CTA style — large blue button.

---

## Responsive Behavior

- Hero: 2-column → 1-column at `md` breakpoint (768px). Preview card stacks below pitch on mobile.
- Features grid: 3-column → 2-column at `md` → 1-column at `sm`
- Pricing table: horizontal scroll on mobile (`overflow-x: auto` wrapper)
- Nav: on mobile, hide center links; keep logo and Google button
- Footer: stacks vertically on mobile (column flex)

---

## Accessibility

- All section headings use semantic `<h2>` (H1 only in Hero)
- CTA buttons use `<button>` or `<a>` with descriptive text
- Feature cards use `role="article"` or plain `<div>` — no interactive role needed
- Color contrast meets WCAG AA (all text colors chosen to pass against their backgrounds)
- Framer Motion animations wrapped in `useReducedMotion()` check — skip animations if user prefers reduced motion

---

## Animations (Framer Motion)

Subtle, professional — no distractions:
- Hero columns: fade-in + slide-up on mount (`initial: { opacity: 0, y: 20 }`, `animate: { opacity: 1, y: 0 }`)
- Feature cards: stagger fade-in on scroll (`whileInView`, `once: true`, stagger 0.05s per card)
- Pricing table: fade-in on scroll
- All animations gated on `!prefersReducedMotion`

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/app/(marketing)/page.tsx` | Rewrite |
| `src/components/layout/LandingNav.tsx` | Create (replaces landing-nav.tsx) |
| `src/components/landing/HeroSection.tsx` | Create |
| `src/components/landing/FeaturesSection.tsx` | Create |
| `src/components/landing/PricingSection.tsx` | Create |
| `src/components/landing/FooterSection.tsx` | Create |
| `src/components/auth/SignInButton.tsx` | Update (Google branding) |
| `src/app/(marketing)/layout.tsx` | Update import path to `LandingNav` |

Old `src/components/layout/landing-nav.tsx` can be deleted once `LandingNav.tsx` is in place.

---

## Out of Scope

- Testimonials / social proof section (Phase 7 if needed)
- Blog / SEO content pages
- `/privacy` and `/terms` page content (placeholder links only)
- Urdu RTL toggle (Phase 7)
- Dark mode (not in product spec)
