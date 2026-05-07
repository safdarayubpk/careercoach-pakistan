# Phase 7b — App Animations Design Spec

**Date:** 2026-05-07
**Status:** Approved — ready for implementation

---

## Overview

Add Framer Motion animations to the authenticated app pages. The landing page (Phase 6) already has animations. This spec covers two targets: page transitions across all `/app/*` pages, and the feedback reveal sequence on the question screen.

All animations respect `prefers-reduced-motion: reduce` via `useReducedMotion()`.

---

## Animation 1 — Page Transitions

**Where:** `src/app/app/layout.tsx`

Wrap the `{children}` in `AnimatePresence` + `motion.div`. Every `/app/*` page fades in when navigated to.

```tsx
// In app/app/layout.tsx
import { AnimatePresence, motion } from 'framer-motion'
// ...
<AnimatePresence mode="wait">
  <motion.div
    key={pathname}
    initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={prefersReducedMotion ? {} : { opacity: 0 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

**Key:**
- `key={pathname}` — triggers re-animation on route change (use `usePathname()` from `next/navigation`)
- `mode="wait"` — old page exits before new page enters
- Entry: `opacity: 0, y: 8 → opacity: 1, y: 0`, 0.25s ease-out
- Exit: `opacity: 1 → opacity: 0`, 0.15s
- Reduced motion: `initial={}` (no animation), `exit={}` (instant)
- Layout must be a Client Component (`'use client'`) to use `usePathname` and Framer Motion hooks

---

## Animation 2 — Feedback Reveal Sequence

**Where:** `src/components/session/session-player.tsx` (or wherever feedback state is displayed)

After the API returns feedback, reveal the feedback UI in sequence:

### Score card
- Animate the score number counting up: `0 → actualScore` over 0.6s
- Use Framer Motion's `useMotionValue` + `useTransform` + `useSpring` to drive a counter
- Display as integer (Math.round)
- If `prefersReducedMotion`: show final score immediately, no counting

### Correct points cards
- Each card: `initial: { opacity: 0, y: 12 }` → `animate: { opacity: 1, y: 0 }`
- Stagger: `delay: index * 0.08`
- Start after score card settles (0.4s base delay)
- Duration: 0.35s per card

### Missing points cards
- Same animation as correct points
- Start after last correct point card: base delay `0.4 + (correctPoints.length * 0.08) + 0.15`
- Stagger: `delay: index * 0.08`

### Improve tip card
- Fades in last: delay after last missing point card + 0.1s
- `initial: { opacity: 0 }` → `animate: { opacity: 1 }`, duration 0.4s

### Reduced motion
- When `useReducedMotion()` is true: all cards render instantly with no animation props
- Pattern: `initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}`

### Score counter implementation
```tsx
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
```

---

## Progress Bar

The question screen progress bar already uses `transition-all` via Tailwind. No additional animation needed — it already animates smoothly between questions.

---

## Out of Scope

- Dashboard stat card number counters (low impact, YAGNI)
- Session report metric card animations (static is fine)
- Loading / skeleton states (Phase 8)
- Hover micro-interactions on cards (Phase 8 or skip)
- Landing page (already done in Phase 6)

---

## Files Changed

| File | Action |
|------|--------|
| `src/app/app/layout.tsx` | Modify — add AnimatePresence + motion.div, usePathname, useReducedMotion |
| `src/components/session/session-player.tsx` | Modify — add feedback reveal animation, AnimatedScore counter |
