# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder marketing page with a full conversion-focused landing page (Nav + Hero + Features + Pricing + Footer) targeting Pakistani job seekers.

**Architecture:** Component-per-section — each section lives in its own file (`src/components/landing/`). The marketing layout renders `LandingNav`; `page.tsx` renders the four body sections. No shared state needed — all sections are independent Server or Client Components.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, Framer Motion (already installed), Supabase client (Google OAuth trigger)

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `src/components/auth/sign-in-button.tsx` | Modify | Add Google branding to `variant="nav"`; make `variant="hero"` a large blue CTA |
| `src/components/layout/LandingNav.tsx` | Create | Sticky blue nav, anchor links, Google-branded sign-in button |
| `src/components/layout/landing-nav.tsx` | Delete | Replaced by `LandingNav.tsx` |
| `src/components/landing/HeroSection.tsx` | Create | 2-col grid, badge, H1, CTA, product preview card, Framer Motion |
| `src/components/landing/FeaturesSection.tsx` | Create | 6-card grid, stagger animation |
| `src/components/landing/PricingSection.tsx` | Create | Comparison table, CTA below |
| `src/components/landing/FooterSection.tsx` | Create | Dark footer, copyright + links |
| `src/app/(marketing)/page.tsx` | Rewrite | Composes the four body sections |
| `src/app/(marketing)/layout.tsx` | Modify | Update import to `LandingNav` |

---

## Task 1: Update SignInButton — Google branding + blue hero CTA

**Spec:** `sign-in-button.tsx` currently has a plain white nav button and a hero button with the Google G. The nav button needs full Google branding (white bg, border, `#3c4043` text, Roboto, G logo). The hero button becomes a large full-width `#1E40AF` blue CTA (no Google G — it's a marketing button, not an authentication affordance).

**Files:**
- Modify: `src/components/auth/sign-in-button.tsx`

- [ ] **Step 1: Rewrite sign-in-button.tsx**

Replace the entire file contents:

```tsx
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
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f8f8')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          padding: '10px 16px',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#3c4043',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <GoogleG />
        Sign in with Google
      </button>
    )
  }

  // variant === 'hero' — large blue marketing CTA
  return (
    <button
      onClick={handleSignIn}
      className="w-full rounded-[10px] bg-[#1E40AF] px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-900"
    >
      Start Free Trial — 7 Days Free
    </button>
  )
}

function GoogleG() {
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

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/sign-in-button.tsx
git commit -m "feat: update SignInButton — Google branding for nav, blue CTA for hero"
```

---

## Task 2: Create LandingNav

**Spec:** Sticky blue nav (`#1E40AF`), logo left, anchor links center (hidden on mobile), Google-branded sign-in button right.

**Files:**
- Create: `src/components/layout/LandingNav.tsx`

- [ ] **Step 1: Create LandingNav.tsx**

```tsx
import SignInButton from '@/components/auth/sign-in-button'

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-[#1E40AF] px-6 py-3">
      <span className="text-lg font-bold text-white">CareerCoach PK</span>
      <div className="hidden items-center gap-6 text-sm md:flex">
        <a
          href="#features"
          className="text-white/85 transition-colors hover:text-white no-underline"
        >
          Features
        </a>
        <a
          href="#pricing"
          className="text-white/85 transition-colors hover:text-white no-underline"
        >
          Pricing
        </a>
      </div>
      <SignInButton variant="nav" />
    </nav>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/LandingNav.tsx
git commit -m "feat: add LandingNav — sticky blue nav with anchor links and Google sign-in"
```

---

## Task 3: Create HeroSection

**Spec:** 2-column grid (stacks on mobile). Left: badge, H1, sub-headline, social proof, blue CTA, trust line. Right: blue card with mock question + AI feedback. Framer Motion fade-up on mount. Reduced motion respected.

**Files:**
- Create: `src/components/landing/HeroSection.tsx`

- [ ] **Step 1: Create HeroSection.tsx**

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import SignInButton from '@/components/auth/sign-in-button'

export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }

  const fadeUpDelayed = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.15 },
      }

  return (
    <section className="bg-[#f8fafc] px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Left column — pitch */}
        <motion.div {...fadeUp}>
          <div className="mb-4 inline-block rounded-full bg-[#dbeafe] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1E40AF]">
            Built for Pakistan 🇵🇰
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900">
            Ace Your Next Interview
            <br />
            <span className="text-[#1E40AF]">for PKR 999/month</span>
          </h1>
          <p className="mb-2 text-[15px] text-gray-600">
            Paste a job description → get tailored questions + instant AI feedback. In English or Urdu.
          </p>
          <p className="mb-6 text-[13px] text-gray-400">
            Join 500+ Pakistani professionals already practising smarter.
          </p>
          <SignInButton variant="hero" />
          <p className="mt-2.5 text-center text-[12px] text-gray-400">
            No credit card needed · Cancel anytime
          </p>
        </motion.div>

        {/* Right column — product preview card */}
        <motion.div {...fadeUpDelayed} className="rounded-2xl bg-[#1E40AF] p-6 text-white">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Live Preview
          </p>
          <div className="mb-2.5 rounded-xl bg-white/10 p-3.5 text-[13px]">
            "Tell me about your experience with React in a production environment."
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="mb-1 text-[11px] text-white/60">AI Feedback</p>
            <p className="text-[13px] font-bold">Score: 8/10 · Strong answer ✓</p>
            <p className="mt-1 text-[11px] text-white/70">
              Clear structure, good examples. Add more on performance optimisation.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HeroSection.tsx
git commit -m "feat: add HeroSection — 2-col hero with badge, CTA, and product preview card"
```

---

## Task 4: Create FeaturesSection

**Spec:** 6-card grid (3 cols desktop, 2 cols tablet, 1 col mobile). Section id `features`. Each card: emoji icon, bold title, description. Stagger fade-in on scroll via Framer Motion.

**Files:**
- Create: `src/components/landing/FeaturesSection.tsx`

- [ ] **Step 1: Create FeaturesSection.tsx**

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🎯',
    title: 'JD-Tailored Questions',
    description:
      'Paste any job description and get 10 questions tailored to that role, level, and tech stack.',
  },
  {
    icon: '⚡',
    title: 'Instant AI Feedback',
    description:
      'Powered by Groq — score, what you got right, what you missed, and a model answer in seconds.',
  },
  {
    icon: '🎤',
    title: 'Urdu Voice Input',
    description:
      "Answer in Urdu using your microphone. The only interview coach built for Pakistan's bilingual professionals.",
  },
  {
    icon: '📊',
    title: 'Progress Dashboard',
    description:
      'Track scores across sessions. See improvement over time in Technical, Behavioral, and System Design.',
  },
  {
    icon: '🏷️',
    title: 'PKR 999/month',
    description:
      '7x cheaper than Final Round AI. No dollar conversion. Local pricing for local professionals.',
  },
  {
    icon: '🔄',
    title: 'Unlimited Sessions',
    description:
      'Practice as many times as you want. New questions every session based on the same or different JD.',
  },
]

export default function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="features" className="bg-white px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-9 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
            Features
          </p>
          <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
            Everything you need to land the job
          </h2>
          <p className="text-sm text-gray-500">
            Designed specifically for Pakistan&apos;s job market
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="rounded-xl border border-gray-200 p-5"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 16 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.4, delay: index * 0.05 },
                  })}
            >
              <div className="mb-2.5 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-gray-900">{feature.title}</h3>
              <p className="text-[13px] text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/FeaturesSection.tsx
git commit -m "feat: add FeaturesSection — 6-card grid with stagger scroll animation"
```

---

## Task 5: Create PricingSection

**Spec:** Comparison table vs Final Round AI and Huru.ai. Section id `pricing`. PKR 999 bold blue, competitors crossed out. CTA below table. Horizontal scroll on mobile. Framer Motion fade-in on scroll.

**Files:**
- Create: `src/components/landing/PricingSection.tsx`

- [ ] **Step 1: Create PricingSection.tsx**

```tsx
'use client'

import { motion, useReducedMotion } from 'framer-motion'
import SignInButton from '@/components/auth/sign-in-button'

interface PricingRow {
  feature: string
  us: string
  usClass?: string
  finalRound: string
  finalRoundStrike?: boolean
  huru: string
  huruStrike?: boolean
  rowClass?: string
}

const ROWS: PricingRow[] = [
  {
    feature: 'Monthly Price',
    us: 'PKR 999',
    usClass: 'text-[15px] font-extrabold text-[#1E40AF]',
    finalRound: 'PKR 7,000',
    finalRoundStrike: true,
    huru: 'PKR 5,300',
    huruStrike: true,
  },
  {
    feature: 'Urdu Language',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
    rowClass: 'bg-gray-50',
  },
  {
    feature: 'JD-Tailored Questions',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
  },
  {
    feature: 'Built for Pakistan',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
    rowClass: 'bg-gray-50',
  },
  {
    feature: 'Free Trial',
    us: '7 days, no card',
    usClass: 'text-[13px] font-bold text-green-600',
    finalRound: 'Limited',
    huru: 'Limited',
  },
]

export default function PricingSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="pricing" className="bg-[#f8fafc] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-9 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
            Pricing
          </p>
          <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
            Built for Pakistan. Priced for Pakistan.
          </h2>
          <p className="text-sm text-gray-500">Why pay in dollars when you don&apos;t have to?</p>
        </div>

        <motion.div
          className="overflow-x-auto"
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.5 },
              })}
        >
          <table className="w-full min-w-[540px] overflow-hidden rounded-2xl bg-white shadow-sm">
            <thead>
              <tr className="bg-[#1E40AF] text-white">
                <th className="px-4 py-4 text-left text-[13px] font-semibold">Feature</th>
                <th className="px-4 py-4 text-center text-[13px] font-semibold">
                  CareerCoach PK ⭐
                </th>
                <th className="px-4 py-4 text-center text-[13px] font-semibold opacity-70">
                  Final Round AI
                </th>
                <th className="px-4 py-4 text-center text-[13px] font-semibold opacity-70">
                  Huru.ai
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className={row.rowClass ?? ''}>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-[13px] font-semibold text-gray-700">
                    {row.feature}
                  </td>
                  <td
                    className={`border-b border-gray-100 px-4 py-3.5 text-center ${row.usClass ?? 'text-base'}`}
                  >
                    {row.us}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center text-[13px] text-gray-400">
                    {row.finalRoundStrike ? <s>{row.finalRound}</s> : row.finalRound}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center text-[13px] text-gray-400">
                    {row.huruStrike ? <s>{row.huru}</s> : row.huru}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-7 text-center">
          <div className="mx-auto max-w-xs">
            <SignInButton variant="hero" />
          </div>
          <p className="mt-2 text-[12px] text-gray-400">No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/PricingSection.tsx
git commit -m "feat: add PricingSection — comparison table with scroll animation and CTA"
```

---

## Task 6: Create FooterSection

**Spec:** Dark background (`#111`), copyright left, Privacy Policy + Terms of Service links right. Stacks vertically on mobile.

**Files:**
- Create: `src/components/landing/FooterSection.tsx`

- [ ] **Step 1: Create FooterSection.tsx**

```tsx
export default function FooterSection() {
  return (
    <footer className="bg-[#111] px-8 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <span className="text-[13px] text-white/50">
          © 2026 CareerCoach Pakistan. All rights reserved.
        </span>
        <div className="flex gap-5">
          <a
            href="/privacy"
            className="text-[12px] text-white/40 no-underline transition-colors hover:text-white/60"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-[12px] text-white/40 no-underline transition-colors hover:text-white/60"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/FooterSection.tsx
git commit -m "feat: add FooterSection — dark minimal footer with copyright and links"
```

---

## Task 7: Wire up page.tsx + layout.tsx + delete old nav

**Spec:** `page.tsx` composes the four body sections. `layout.tsx` imports `LandingNav` (new PascalCase file). Delete old `landing-nav.tsx`.

**Files:**
- Rewrite: `src/app/(marketing)/page.tsx`
- Modify: `src/app/(marketing)/layout.tsx`
- Delete: `src/components/layout/landing-nav.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Replace the entire file:

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

- [ ] **Step 2: Update layout.tsx**

Replace the entire file:

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

- [ ] **Step 3: Delete old nav file**

```bash
rm "src/components/layout/landing-nav.tsx"
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: no errors. If `landing-nav.tsx` was imported anywhere else, the type-check will catch it.

- [ ] **Step 5: Visual verification**

```bash
pnpm dev
```

Open `http://localhost:3000` and verify:
- Sticky blue nav appears at top with logo, Features + Pricing links, white Google-branded "Sign in with Google" button
- Hero: "Built for Pakistan 🇵🇰" badge, H1 "Ace Your Next Interview / for PKR 999/month", blue "Start Free Trial" CTA button, blue preview card on the right
- Features: 6 cards in 3-column grid with correct emoji + titles
- Pricing: comparison table with PKR 999 bold blue, competitors struck through, CTA below
- Footer: dark background, copyright left, links right
- Scroll: Features and Pricing sections animate in on scroll
- Resize to mobile: hero stacks, feature grid goes to 1 column, nav hides center links, footer stacks vertically
- Clicking any CTA / "Sign in with Google" redirects to Google OAuth

- [ ] **Step 6: Build check**

```bash
pnpm build
```

Expected: compiles without errors.

- [ ] **Step 7: Commit**

```bash
git add src/app/(marketing)/page.tsx src/app/(marketing)/layout.tsx
git commit -m "feat: wire up landing page — compose all sections, update layout nav import"
```

---

## Self-Review

**Spec coverage:**
- ✅ Nav: sticky, blue, logo, anchor links, Google-branded button (Task 2)
- ✅ Hero: badge, H1 with blue span, sub, social proof, blue CTA, trust line, preview card (Task 3)
- ✅ Features: 6-card grid, `id="features"`, correct copy (Task 4)
- ✅ Pricing: comparison table, `id="pricing"`, PKR 999 highlighted, competitors struck, CTA below (Task 5)
- ✅ Footer: dark bg, copyright, Privacy/Terms links (Task 6)
- ✅ Google branding: white bg, colored G SVG, Roboto font, `#3c4043` text, border, hover (Task 1)
- ✅ Responsive: hero 2→1 col, features 3→2→1 col, pricing overflow-x-auto, nav hides links on mobile, footer stacks (all tasks via Tailwind)
- ✅ Animations: Framer Motion fade-up on mount (Hero), stagger whileInView (Features), fade-in whileInView (Pricing) (Tasks 3–5)
- ✅ Reduced motion: `useReducedMotion()` check in all animated components (Tasks 3–5)
- ✅ Layout double-nav prevention: nav in layout, not page.tsx (Task 7)
- ✅ Old `landing-nav.tsx` deleted (Task 7)

**Placeholder scan:** No TBD, TODO, or vague steps. All code blocks are complete.

**Type consistency:** `SignInButton` accepts `variant: 'hero' | 'nav'` — used as `variant="hero"` in HeroSection and PricingSection, `variant="nav"` in LandingNav. Consistent throughout.
