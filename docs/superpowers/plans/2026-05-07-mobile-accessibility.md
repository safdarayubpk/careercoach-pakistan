# Mobile + Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all `/app/*` pages fully usable on mobile and WCAG 2.1 AA compliant, starting with a hamburger drawer nav.

**Architecture:** AppNav stays a Server Component — it fetches user data. A new `MobileDrawer` Client Component receives user data as props and owns all toggle/animation state. App layout gets skip-to-content and `id="main-content"`. Each app page gets responsive Tailwind classes and touch-target sizing.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS 4, Framer Motion (already installed), TypeScript

---

## File Map

| File | Action |
|------|--------|
| `src/app/globals.css` | Modify — add `:focus-visible` ring |
| `src/app/app/layout.tsx` | Modify — skip-to-content link, `id="main-content"` on main, `aria-label` on nav |
| `src/components/layout/app-nav.tsx` | Modify — hamburger button (mobile only), hide desktop links on mobile, render MobileDrawer |
| `src/components/layout/MobileDrawer.tsx` | Create — Client Component: drawer state, Framer Motion slide, focus trap, Escape key |
| `src/app/app/dashboard/page.tsx` | Modify — responsive stat grid, stacked header, touch-target rows, fix "Recent Sessions" to `<h2>` |
| `src/app/app/session/setup/page.tsx` | Modify — `px-4` padding on mobile |
| `src/components/session/setup-form.tsx` | Modify — `w-full sm:w-auto` submit button |
| `src/app/app/session/[id]/question/page.tsx` | Modify — touch targets on voice button + submit |
| `src/app/app/session/[id]/report/page.tsx` | Modify — `grid-cols-2 sm:grid-cols-4` metric cards, touch targets |
| `src/app/app/billing/page.tsx` | Modify — `w-full sm:w-auto` on Subscribe/Manage buttons |

---

### Task 1: Focus Rings + Skip-to-Content

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/app/layout.tsx`

- [ ] **Step 1: Add `:focus-visible` ring to globals.css**

Open `src/app/globals.css`. The current content is:
```css
@import "tailwindcss";

body {
  background: #ffffff;
  color: #171717;
}
```

Replace the entire file with:
```css
@import "tailwindcss";

body {
  background: #ffffff;
  color: #171717;
}

:focus-visible {
  outline: 2px solid #1E40AF;
  outline-offset: 2px;
}
```

- [ ] **Step 2: Add skip-to-content link and `id="main-content"` to app layout**

Open `src/app/app/layout.tsx`. Current content:
```tsx
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

Replace with:
```tsx
import AppNav from '@/components/layout/app-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-[#1E40AF] focus:shadow-lg"
      >
        Skip to content
      </a>
      <AppNav />
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/app/layout.tsx
git commit -m "feat(a11y): add focus-visible ring and skip-to-content link"
```

---

### Task 2: MobileDrawer Component

**Files:**
- Create: `src/components/layout/MobileDrawer.tsx`

- [ ] **Step 1: Create MobileDrawer.tsx**

Create `src/components/layout/MobileDrawer.tsx` with the following content:

```tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import SignOutButton from '@/components/auth/sign-out-button'

interface Props {
  displayName: string
  email: string
  initials: string
  avatarUrl: string | null
}

export default function MobileDrawer({ displayName, email, initials, avatarUrl }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const drawerRef = useRef<HTMLDivElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)

  function close() {
    setIsOpen(false)
    // Return focus to hamburger after drawer closes
    setTimeout(() => hamburgerRef.current?.focus(), 0)
  }

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return
    const el = drawerRef.current
    if (!el) return

    const focusable = el.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    first?.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        close()
        return
      }
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      {/* Hamburger button — visible on mobile only */}
      <button
        ref={hamburgerRef}
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-white"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect y="3" width="22" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="10" width="22" height="2.5" rx="1.25" fill="currentColor" />
          <rect y="17" width="22" height="2.5" rx="1.25" fill="currentColor" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: prefersReducedMotion ? 0.4 : 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.25 }}
              onClick={close}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              className="fixed top-0 right-0 bottom-0 z-50 flex w-[260px] flex-col bg-white shadow-xl"
              initial={{ x: prefersReducedMotion ? 0 : 260 }}
              animate={{ x: 0 }}
              exit={{ x: prefersReducedMotion ? 0 : 260 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {/* Close button */}
              <div className="flex justify-end p-3">
                <button
                  onClick={close}
                  className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                  aria-label="Close navigation menu"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* User info header */}
              <div className="bg-[#1E40AF] px-4 pb-4">
                <div className="flex items-center gap-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-300 text-sm font-bold text-blue-900">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white">{displayName}</p>
                    <p className="text-xs text-white/[80%]">{email}</p>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <nav className="flex-1 py-2" aria-label="Drawer navigation">
                <Link
                  href="/app/dashboard"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  📊 Dashboard
                </Link>
                <Link
                  href="/app/session/setup"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  💬 Sessions
                </Link>
                <Link
                  href="/app/billing"
                  onClick={close}
                  className="flex min-h-[48px] items-center gap-3 border-b border-gray-100 px-4 text-sm text-gray-700 hover:bg-gray-50"
                >
                  💳 Billing
                </Link>
              </nav>

              {/* Sign out footer */}
              <div className="border-t border-gray-200 p-3">
                <SignOutButton className="w-full min-h-[44px] rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 2: Check if SignOutButton accepts a `className` prop**

Read `src/components/auth/sign-out-button.tsx`. If it does not accept `className`, you have two options:
- **Option A (preferred):** Add `className?: string` prop to SignOutButton and apply it.
- **Option B:** Wrap the SignOutButton in a `<div className="...">` instead of passing className directly.

Use whichever is cleaner given SignOutButton's current implementation. Do NOT rewrite SignOutButton's core logic.

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/MobileDrawer.tsx src/components/auth/sign-out-button.tsx
git commit -m "feat(mobile): add MobileDrawer client component"
```

---

### Task 3: Update AppNav for Mobile

**Files:**
- Modify: `src/components/layout/app-nav.tsx`

- [ ] **Step 1: Update AppNav**

Open `src/components/layout/app-nav.tsx`. Replace the entire file with:

```tsx
import { createClient } from '@/lib/supabase/server'
import SignOutButton from '@/components/auth/sign-out-button'
import Link from 'next/link'
import MobileDrawer from '@/components/layout/MobileDrawer'

export default async function AppNav() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const fullName: string = user?.user_metadata?.full_name ?? ''
  const email: string = user?.email ?? ''
  const avatarUrl: string | null = user?.user_metadata?.avatar_url ?? null

  const initials = fullName
    ? fullName[0].toUpperCase()
    : email.slice(0, 2).toUpperCase()

  const displayName = fullName || email

  return (
    <nav
      aria-label="App navigation"
      className="bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between"
    >
      <span className="font-bold text-lg">CareerCoach PK</span>

      {/* Desktop nav links — hidden on mobile */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <Link href="/app/dashboard" className="hover:text-white/80 transition-colors">
          Dashboard
        </Link>
        <Link href="/app/session/setup" className="hover:text-white/80 transition-colors">
          Sessions
        </Link>
        <Link href="/app/billing" className="hover:text-white/80 transition-colors">
          Billing
        </Link>
      </div>

      {/* Desktop user section — hidden on mobile */}
      <div className="hidden md:flex items-center gap-3">
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
        <span className="text-white/30 select-none">|</span>
        <SignOutButton />
      </div>

      {/* Mobile hamburger — MobileDrawer renders the ☰ button */}
      <MobileDrawer
        displayName={displayName}
        email={email}
        initials={initials}
        avatarUrl={avatarUrl}
      />
    </nav>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 3: Verify visually**

Run `pnpm dev`. At desktop width (>768px): logo left, nav links center, avatar+name+|+Sign out right. At mobile width (<768px): logo left, ☰ right. Tap ☰: drawer slides in from right with user info, nav links, Sign out. Tap backdrop or press Escape: drawer closes.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-nav.tsx
git commit -m "feat(mobile): update AppNav with hamburger menu for mobile"
```

---

### Task 4: Dashboard Mobile Layout

**Files:**
- Modify: `src/app/app/dashboard/page.tsx`

- [ ] **Step 1: Apply mobile changes to DashboardPage**

Three changes in `src/app/app/dashboard/page.tsx`:

**Change 1** — Stat card grid: `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
```tsx
// Find this line (around line 113):
<div className="mb-6 grid grid-cols-3 gap-4">
// Replace with:
<div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
```

**Change 2** — Header row: stack on mobile, `w-full sm:w-auto` on button

Find the header block (around line 85):
```tsx
<div className="mb-6 flex items-center justify-between">
  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
  <Link
    href="/app/session/setup"
    className="rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
  >
    + New Session
  </Link>
</div>
```
Replace with:
```tsx
<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
  <Link
    href="/app/session/setup"
    className="w-full rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 text-center sm:w-auto"
  >
    + New Session
  </Link>
</div>
```

**Change 3** — Session list rows: add `min-h-[44px]`

Find the `<Link>` for each session row (around line 143):
```tsx
className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-blue-50 ${
  !isLast ? 'border-b border-gray-100' : ''
}`}
```
Replace with:
```tsx
className={`flex min-h-[44px] items-center justify-between px-5 py-4 transition-colors hover:bg-blue-50 ${
  !isLast ? 'border-b border-gray-100' : ''
}`}
```

**Change 4** — "Recent Sessions" heading: it's already an `<h2>` tag. Verify the `<h2>` tag is present around line 133. The dashboard `<h1>` is "Welcome back, {name}" and `<h2>` is "Recent Sessions" — hierarchy is correct. No change needed.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/app/app/dashboard/page.tsx
git commit -m "feat(mobile): responsive dashboard — stacked header, single-col stat cards, touch targets"
```

---

### Task 5: Session Setup Mobile

**Files:**
- Modify: `src/app/app/session/setup/page.tsx`
- Modify: `src/components/session/setup-form.tsx`

- [ ] **Step 1: Add `px-4` mobile padding to setup page**

Open `src/app/app/session/setup/page.tsx`. Current:
```tsx
<div className="max-w-2xl mx-auto">
```
Replace with:
```tsx
<div className="max-w-2xl mx-auto px-4 sm:px-0">
```

- [ ] **Step 2: Check setup-form submit button width**

Open `src/components/session/setup-form.tsx`. The submit button (around line 96) already has `className="w-full ..."`. This is fine — `w-full` on mobile is correct. The spec says `w-full sm:w-auto` but the button is the primary CTA for this page — keep `w-full` as-is. No change needed.

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/app/session/setup/page.tsx
git commit -m "feat(mobile): add horizontal padding to session setup page on mobile"
```

---

### Task 6: Question Page Mobile

**Files:**
- Modify: `src/app/app/session/[id]/question/page.tsx`
- Modify: `src/components/session/answer-form.tsx` (if it contains the voice button and textarea)

- [ ] **Step 1: Add `px-4` mobile padding to question page**

Open `src/app/app/session/[id]/question/page.tsx`. Find:
```tsx
<div className="max-w-2xl mx-auto">
```
Replace with:
```tsx
<div className="max-w-2xl mx-auto px-4 sm:px-0">
```

- [ ] **Step 2: Add touch targets to voice button and submit button in AnswerForm**

Open `src/components/session/answer-form.tsx`. 

For the voice/microphone button (look for the "🎤 بولیں" button), add `min-h-[44px] min-w-[44px]` to its className.

For the submit button, ensure it has `w-full` so it's full-width on mobile. If it already has `w-full`, no change needed.

For the textarea, ensure it has `w-full` and `min-h-[120px]`. Add or update as needed.

Example of what the voice button className should look like after the change:
```tsx
// Before (example — match the actual className):
className="flex items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm ..."
// After:
className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm ..."
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/app/session/[id]/question/page.tsx src/components/session/answer-form.tsx
git commit -m "feat(mobile): question page padding and touch targets on voice/submit buttons"
```

---

### Task 7: Session Report Mobile

**Files:**
- Modify: `src/app/app/session/[id]/report/page.tsx`
- Modify: `src/components/session/report-accordion.tsx`

- [ ] **Step 1: Add mobile padding and responsive changes to report page**

Open `src/app/app/session/[id]/report/page.tsx`.

**Change 1** — Container padding:
```tsx
// Find:
<div className="max-w-2xl mx-auto">
// Replace:
<div className="max-w-2xl mx-auto px-4 sm:px-0">
```

**Change 2** — Header row with "Back to Dashboard": make it stack on mobile:
```tsx
// Find (around line 83):
<div className="mb-6 flex items-start justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
    <p className="mt-1 text-sm text-gray-500">
      {session.role} · {session.level} · {session.interview_type} · {formatDate(session.created_at)}
    </p>
  </div>
  <Link
    href="/app/dashboard"
    className="shrink-0 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
  >
    ← Back to Dashboard
  </Link>
</div>
// Replace with:
<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
    <p className="mt-1 text-sm text-gray-500">
      {session.role} · {session.level} · {session.interview_type} · {formatDate(session.created_at)}
    </p>
  </div>
  <Link
    href="/app/dashboard"
    className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:w-auto sm:shrink-0"
  >
    ← Back to Dashboard
  </Link>
</div>
```

**Change 3** — Category cards: already `grid-cols-2` (line 114). No change needed — `grid-cols-2` is correct for mobile. Verify it reads `grid-cols-2 gap-3` and leave it.

- [ ] **Step 2: Add touch targets to report accordion triggers**

Open `src/components/session/report-accordion.tsx`. Find the accordion trigger button(s) and add `min-h-[44px]` to the className. Example:
```tsx
// Before (example — match the actual className):
className="flex w-full items-center justify-between px-4 py-3 text-sm ..."
// After:
className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-sm ..."
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/app/session/[id]/report/page.tsx src/components/session/report-accordion.tsx
git commit -m "feat(mobile): report page — stacked header, touch targets on accordion"
```

---

### Task 8: Billing Page Mobile

**Files:**
- Modify: `src/app/app/billing/page.tsx`

- [ ] **Step 1: Check SubscribeButton and ManageButton for className support**

Open `src/components/billing/subscribe-button.tsx` and `src/components/billing/manage-button.tsx`. Check if they accept a `className` prop.

- If they accept `className`: pass `"w-full sm:w-auto"` to each.
- If they do not: wrap each in a `<div className="w-full sm:w-auto">` — do NOT restructure their internals.

The billing page already has `flex justify-center py-12` and `w-full max-w-md` on the card — so the layout is naturally centered. The Subscribe/Manage buttons already render inside a narrow container, so `w-full` on them is the main change.

- [ ] **Step 2: Update billing page**

In `src/app/app/billing/page.tsx`, for the subscribed state (around line 29), wrap ManageButton if needed:
```tsx
// If ManageButton doesn't accept className, wrap:
<div className="w-full">
  <ManageButton />
</div>
```

For the unsubscribed state (around line 97), wrap SubscribeButton if needed:
```tsx
// If SubscribeButton doesn't accept className, wrap:
<div className="w-full">
  <SubscribeButton />
</div>
```

The card is `max-w-md` so buttons are naturally constrained — `w-full` inside the card is the right mobile treatment.

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/app/billing/page.tsx
git commit -m "feat(mobile): billing page — full-width subscribe/manage buttons on mobile"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Full type-check**

Run: `pnpm type-check`
Expected: exit 0, no errors

- [ ] **Step 2: Build check**

Run: `pnpm build`
Expected: successful build, no errors

- [ ] **Step 3: Manual verification checklist**

Start dev server (`pnpm dev`) and verify at 375px viewport width (iPhone SE):

- [ ] Tab key on landing page: "Skip to content" link appears, jumps to `#main-content`
- [ ] Blue `:focus-visible` ring visible on all interactive elements when tabbing
- [ ] Nav at mobile: only logo + ☰ visible
- [ ] ☰ tap: drawer slides in from right with user info, nav links, Sign out
- [ ] Escape key closes drawer, focus returns to ☰ button
- [ ] Tab inside open drawer: focus cycles within drawer only
- [ ] Dashboard: stat cards stack 1-column below 640px
- [ ] Dashboard: "+ New Session" button full-width on mobile
- [ ] Session rows: easy to tap (tall enough)
- [ ] Session setup: form has horizontal padding on mobile
- [ ] Question screen: textarea and submit button full-width
- [ ] Report: "Back to Dashboard" button full-width on mobile
- [ ] Billing: Subscribe/Manage buttons full-width on mobile
