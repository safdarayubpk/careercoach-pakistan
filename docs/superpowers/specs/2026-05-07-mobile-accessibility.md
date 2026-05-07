# Phase 7a — Mobile + Accessibility Design Spec

**Date:** 2026-05-07
**Status:** Approved — ready for implementation

---

## Overview

Make all `/app/*` pages fully usable on mobile phones and meet WCAG 2.1 AA accessibility standards. The landing page (Phase 6) is already responsive and accessible. This spec covers the authenticated app shell only.

Primary goal: Pakistani users on mobile can complete a full interview session without layout issues or accessibility barriers.

---

## Part 1 — Mobile App Nav (Hamburger Drawer)

**Component:** `src/components/layout/app-nav.tsx` + new `src/components/layout/MobileDrawer.tsx`

### Behaviour

- At `md` breakpoint (768px) and above: existing desktop nav unchanged
- Below `md`: hide center nav links and right user section; show ☰ hamburger button on the right
- Tapping ☰ opens a slide-in drawer from the right
- Drawer closes on: link tap, Sign out tap, backdrop tap, or Escape key

### Desktop nav (unchanged, `md:flex`)
```
[CareerCoach PK logo]   [Dashboard | Sessions | Billing]   [avatar | name | | Sign out]
```

### Mobile nav (below `md`)
```
[CareerCoach PK logo]                                       [☰]
```

### Drawer contents (right side, width 260px)

**Header section** (blue `#1E40AF` background):
- Avatar circle (36px) + full name + email in white

**Nav links** (white background, border-bottom separator):
- Dashboard → `/app/dashboard`
- Sessions → `/app/session/setup`
- Billing → `/app/billing`
- Each link: 48px min height (touch target), 16px horizontal padding, gray-700 text, chevron icon right

**Footer** (border-top):
- "Sign out" button — full width, red-tinted (`bg-red-50 text-red-600`), 44px min height

### Animation
- Drawer: `x: 260 → 0` on open, `x: 0 → 260` on close (Framer Motion)
- Backdrop: `opacity: 0 → 0.4` on open
- Duration: 0.25s ease-out
- Respects `useReducedMotion()` — instant open/close if true

### Architecture
- `AppNav` remains a Server Component — it fetches user data
- Extract a new `MobileDrawer` Client Component that receives `user` data as props
- `MobileDrawer` owns all toggle state (`useState`) and animation
- `AppNav` renders `MobileDrawer` with user props alongside the desktop nav

### Accessibility
- Hamburger button: `aria-label="Open navigation menu"`, `aria-expanded={isOpen}`
- Close button: `aria-label="Close navigation menu"`
- Drawer: `role="dialog"`, `aria-modal="true"`, `aria-label="Navigation"`
- Focus trap inside drawer when open (Tab cycles through links + close button)
- Escape key closes drawer and returns focus to ☰ button

---

## Part 2 — App Pages Mobile Layout

### Dashboard (`/app/dashboard`)

**Stat cards** (Sessions / Avg Score / Best Score):
- Currently: 3-column grid
- Mobile: `grid-cols-1 sm:grid-cols-3` — stacks to 1 column below `sm` (640px)

**Header row** ("Welcome back, Name" + "+ New Session" button):
- Mobile: stack vertically, button full-width (`w-full sm:w-auto`)

**Session list rows**:
- Minimum touch target: `min-h-[44px]` on each row
- Score badge and chevron: ensure no overflow on small screens

### Session Setup (`/app/session/setup`)

- Already `max-w-2xl mx-auto` — contained width is fine
- All form inputs: `w-full` (already likely true, verify)
- Submit button: `w-full sm:w-auto`
- Padding: `px-4` on mobile container

### Question Screen (`/app/session/[id]/question`)

- Already single-column — minimal changes needed
- Voice input button ("🎤 بولیں"): `min-h-[44px] min-w-[44px]`
- Answer textarea: `w-full`, comfortable `min-h-[120px]` on mobile
- Submit button: `w-full`
- Progress bar: already full-width

### Session Report (`/app/session/[id]/report`)

- Metric cards (4 cards — Technical / Behavioral / System Design / Communication):
  - Currently: likely 4-column or 2-column
  - Mobile: `grid-cols-2 sm:grid-cols-4` — 2×2 grid on mobile
- Q&A accordion: full-width, `min-h-[44px]` on each accordion trigger
- "Back to Dashboard" button: `w-full sm:w-auto`

### Billing (`/app/billing`)

- Subscribe / Manage buttons: `w-full sm:w-auto`
- Price display (`PKR 999`): centered, readable at 320px width
- Subscription status card: full-width on mobile

---

## Part 3 — WCAG 2.1 AA Sweep

Applied across all `/app/*` pages and the app layout.

### Skip-to-content link

Add as the very first element inside `<body>` (in `src/app/app/layout.tsx`):

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-[#1E40AF] focus:shadow-lg"
>
  Skip to content
</a>
```

Add `id="main-content"` to the `<main>` element in the app layout.

### Focus rings

Tailwind's default focus rings are often invisible. Add globally in `src/app/globals.css`:

```css
:focus-visible {
  outline: 2px solid #1E40AF;
  outline-offset: 2px;
}
```

This shows a blue ring on keyboard focus, invisible on mouse click (`:focus-visible` not `:focus`).

### Color contrast

Audit these specific classes against WCAG AA (4.5:1 for normal text, 3:1 for large text):
- `text-gray-400` on white: approx 4.6:1 — borderline, use `text-gray-500` minimum for body text
- `text-white/60` on `#1E40AF`: check — may fail; use `text-white/80` minimum
- `text-green-600` on white: passes
- `text-red-600` on white: passes

### Touch targets

All interactive elements (buttons, links, accordion triggers): `min-h-[44px]`. Where height can't be set, add padding to bring the tap area to 44px.

### Heading hierarchy

Audit all app pages:
- Each page must have exactly one `<h1>`
- `<h2>` for section headings, `<h3>` for sub-items
- No skipped levels (no jumping from `<h1>` to `<h3>`)

Current known gap: dashboard "RECENT SESSIONS" label is a `<p>` — should be `<h2>`.

### Icon-only button labels

- Hamburger button: `aria-label="Open navigation menu"`
- Drawer close button: `aria-label="Close navigation menu"`
- Session list row chevron (›): wrap in `<span aria-hidden="true">`, row itself needs accessible label

### Landmark roles

All app pages must have:
- `<nav aria-label="App navigation">` on `AppNav`
- `<main id="main-content">` wrapping page content
- `<footer>` if applicable

---

## Files Changed / Created

| File | Action |
|------|--------|
| `src/components/layout/app-nav.tsx` | Modify — add mobile hamburger button, hide desktop nav on mobile, render MobileDrawer |
| `src/components/layout/MobileDrawer.tsx` | Create — Client Component with drawer state, animation, focus trap |
| `src/app/app/layout.tsx` | Modify — add skip-to-content link, `id="main-content"` on main |
| `src/app/app/dashboard/page.tsx` | Modify — responsive stat cards, full-width button, touch targets |
| `src/app/app/session/setup/page.tsx` | Modify — mobile padding, button width |
| `src/components/session/setup-form.tsx` | Modify — full-width inputs, button on mobile |
| `src/app/app/session/[id]/question/page.tsx` | Modify — touch targets, button widths |
| `src/app/app/session/[id]/report/page.tsx` | Modify — responsive metric grid, touch targets |
| `src/app/app/billing/page.tsx` | Modify — button widths, mobile layout |
| `src/app/globals.css` | Modify — add `:focus-visible` ring |

---

## Out of Scope

- Urdu RTL layout (Phase 9)
- Offline/PWA support
- Dark mode
- Skeleton loading states (Phase 8)
- The landing page (already done in Phase 6)
