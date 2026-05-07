# Animations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add page transitions across all `/app/*` routes and a staggered feedback reveal sequence on the question screen.

**Architecture:** Page transitions live in a new `PageTransition` Client Component (keeps `AppLayout` as a Server Component). Feedback animations live entirely in `feedback-view.tsx` — a new `AnimatedScore` sub-component handles the score counter, and each card group gets Framer Motion `motion.div` with staggered delays. All animations respect `useReducedMotion()`.

**Tech Stack:** Framer Motion 12 (already installed at `framer-motion@12.38.0`), Next.js App Router, TypeScript

---

## File Map

| File | Action |
|------|--------|
| `src/components/layout/page-transition.tsx` | Create — Client Component: AnimatePresence + motion.div + usePathname |
| `src/app/app/layout.tsx` | Modify — import PageTransition, wrap children |
| `src/components/session/feedback-view.tsx` | Modify — AnimatedScore counter + staggered card reveal |

---

### Task 1: PageTransition Component

**Files:**
- Create: `src/components/layout/page-transition.tsx`
- Modify: `src/app/app/layout.tsx`

- [ ] **Step 1: Create PageTransition component**

Create `src/components/layout/page-transition.tsx`:

```tsx
'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'

interface Props {
  children: React.ReactNode
}

export default function PageTransition({ children }: Props) {
  const pathname = usePathname()
  const prefersReducedMotion = useReducedMotion()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? {} : { opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Wrap children with PageTransition in app layout**

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

> Note: If the mobile-accessibility plan has not yet been implemented, the layout may still be the original version without skip-to-content. Apply the PageTransition change regardless — wrap `{children}` inside the inner div.

Replace with:

```tsx
import AppNav from '@/components/layout/app-nav'
import PageTransition from '@/components/layout/page-transition'

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
          <PageTransition>{children}</PageTransition>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 4: Verify visually**

Run `pnpm dev`. Navigate between Dashboard, Sessions setup, Billing. Each page should fade in with a subtle upward drift (opacity 0→1, y 8→0) over 0.25s. Old page fades out first (`mode="wait"`).

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/page-transition.tsx src/app/app/layout.tsx
git commit -m "feat(animation): add page transitions via PageTransition component"
```

---

### Task 2: Feedback Reveal Sequence

**Files:**
- Modify: `src/components/session/feedback-view.tsx`

This task adds the animated score counter and staggered card reveal to the existing `FeedbackView` component.

**Delay schedule:**
- Score card animates score number: 0 → actual score over 0.6s (starts immediately)
- Correct points cards: base delay 0.4s + index × 0.08s
- Missing points cards: base delay = 0.4 + (correctPoints.length × 0.08) + 0.15, then + index × 0.08s
- Improve tip: base delay = missingBase + (missingPoints.length × 0.08) + 0.1s

- [ ] **Step 1: Replace feedback-view.tsx with animated version**

The current `src/components/session/feedback-view.tsx` renders the score as a static number and the cards as plain `<div>` elements. Replace the entire file with the animated version:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'

interface FeedbackData {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Props {
  feedback: FeedbackData | null
  unavailable: boolean
  isLastQuestion: boolean
  onNext: () => void
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'Strong Answer'
  if (score >= 5) return 'Good Attempt'
  return 'Needs Work'
}

function AnimatedScore({ score }: { score: number }) {
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(score)
      return
    }
    const controls = animate(count, score, { duration: 0.6, ease: 'easeOut' })
    return controls.stop
  }, [score, count, prefersReducedMotion])

  return <motion.span>{rounded}</motion.span>
}

export default function FeedbackView({
  feedback,
  unavailable,
  isLastQuestion,
  onNext,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const nextLabel = isLastQuestion ? 'See Results →' : 'Next Question →'

  if (unavailable || !feedback) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Feedback unavailable. Your answer was saved.
        </div>
        <button
          onClick={onNext}
          className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          {nextLabel}
        </button>
      </div>
    )
  }

  const correctBase = 0.4
  const missingBase = correctBase + feedback.correct_points.length * 0.08 + 0.15
  const tipDelay = missingBase + feedback.missing_points.length * 0.08 + 0.1

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] p-6 text-center text-white">
        <div className="text-5xl font-bold leading-none">
          <AnimatedScore score={feedback.score} />
          <span className="text-2xl opacity-70">/10</span>
        </div>
        <div className="mt-2 text-sm opacity-90">{scoreLabel(feedback.score)}</div>
      </div>

      {/* Correct points */}
      {feedback.correct_points.length > 0 && (
        <motion.div
          className="rounded-lg border border-green-200 bg-green-50 p-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: correctBase }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
            ✓ What you got right
          </p>
          <ul className="space-y-1">
            {feedback.correct_points.map((point, i) => (
              <motion.li
                key={i}
                className="text-sm text-green-800"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: correctBase + i * 0.08,
                }}
              >
                • {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Missing points */}
      {feedback.missing_points.length > 0 && (
        <motion.div
          className="rounded-lg border border-red-200 bg-red-50 p-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: missingBase }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
            ✗ What was missing
          </p>
          <ul className="space-y-1">
            {feedback.missing_points.map((point, i) => (
              <motion.li
                key={i}
                className="text-sm text-red-800"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: missingBase + i * 0.08,
                }}
              >
                • {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Improve tip */}
      <motion.div
        className="rounded-lg border border-blue-200 bg-blue-50 p-4"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: tipDelay }}
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          💡 Improve
        </p>
        <p className="text-sm text-blue-800">{feedback.improve_tip}</p>
      </motion.div>

      {/* Model answer toggle */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <button
          onClick={() => setModelOpen(!modelOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span>▶ See model answer</span>
          <span className="text-gray-400">{modelOpen ? '▲' : '▼'}</span>
        </button>
        {modelOpen && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-700">
            {feedback.model_answer}
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        {nextLabel}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors

- [ ] **Step 3: Verify the animation sequence visually**

Run `pnpm dev`. Complete an interview question (or use an existing session). After submitting an answer:

1. Score card appears immediately. The score number counts up from 0 to the actual value over ~0.6s.
2. Green "What you got right" card fades in after ~0.4s.
3. Red "What was missing" card fades in after the correct points settle.
4. Blue "💡 Improve" card fades in last.

To verify reduced motion: in browser DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". All cards should appear instantly with no animation.

- [ ] **Step 4: Commit**

```bash
git add src/components/session/feedback-view.tsx
git commit -m "feat(animation): staggered feedback reveal with animated score counter"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Full type-check + build**

Run:
```bash
pnpm type-check && pnpm build
```
Expected: both succeed with no errors

- [ ] **Step 2: Regression check**

Run `pnpm dev` and verify:

- [ ] Page transitions work: Dashboard → Sessions → Billing → back, each fades in smoothly
- [ ] Session question screen: all question/answer/feedback flows work as before (no broken state)
- [ ] Score counter animates on each feedback reveal
- [ ] Cards stagger in correct order: score → correct → missing → tip
- [ ] `mode="wait"` on AnimatePresence: old page fades out before new one fades in (no overlap)
- [ ] No console errors or React key warnings

- [ ] **Step 3: Commit**

If no issues found, all commits are already done. If build required any fixes, commit those:

```bash
git add -p
git commit -m "fix(animation): resolve build issues"
```
