# Phase 12 — Welcome Email Spec

**Date:** 2026-05-09
**Status:** Draft — awaiting approval

---

## Overview

When a new user signs up via Google OAuth, send a welcome email immediately after their account is created. This sets expectations (7-day trial, what to do first) and makes a strong first impression.

**Goal:** Every new user receives exactly one welcome email within seconds of signup.

---

## Trigger

`src/app/auth/callback/route.ts` — the OAuth callback runs on every login (new and returning). To send only to new users:

1. Before the upsert, query `users` table for the user's ID
2. If no row exists → new user → send welcome email after upsert
3. If row exists → returning user → skip

This is reliable because `ignoreDuplicates: true` on the upsert already prevents duplicate rows.

---

## Email content

**Subject:** Welcome to CareerCoach Pakistan — your 7-day trial has started

**From:** `CareerCoach Pakistan <onboarding@resend.dev>`

**Content:**
- Greeting with first name
- Trial starts now — 7 days free, no credit card needed
- 3-step quickstart: paste JD → answer questions → get AI feedback
- CTA button: "Start Your First Interview →"
- Brief value reminder: PKR 999/month vs PKR 7,000 for global tools
- "Reply to this email if you need help"

---

## Implementation

**New file:** `src/emails/WelcomeEmail.tsx` — React Email template

**Modified file:** `src/app/auth/callback/route.ts`
- Query for existing user before upsert
- After upsert, if new user: call `resend.emails.send(...)` — fire-and-forget (no `await`, wrapped in `.catch()`)
- Welcome email must never block or delay the redirect to `/app/dashboard`

```ts
// Detect new user
const { data: existingUser } = await supabaseAdmin
  .from('users').select('id').eq('id', user.id).single()
const isNewUser = !existingUser

// ... upsert ...

if (isNewUser) {
  const firstName = user.user_metadata?.full_name?.split(' ')[0] ?? 'there'
  resend.emails.send({
    from: 'CareerCoach Pakistan <onboarding@resend.dev>',
    to: user.email!,
    subject: 'Welcome to CareerCoach Pakistan — your 7-day trial has started',
    react: WelcomeEmail({ firstName, dashboardUrl }),
  }).catch(err => console.error('[welcome-email] send failed:', err))
}
```

---

## Files to create / modify

| File | Action |
|------|--------|
| `src/emails/WelcomeEmail.tsx` | Create — React Email template |
| `src/app/auth/callback/route.ts` | Add new-user detection + fire-and-forget email send |

No new env vars. No DB changes. No cron needed.

---

## Acceptance criteria

```
WHEN a new user signs in via Google OAuth for the first time
THEN they SHALL receive the welcome email within seconds

WHEN an existing user signs in again
THEN they SHALL NOT receive the welcome email

WHEN the email send fails
THEN the user SHALL still be redirected to /app/dashboard (email is fire-and-forget)
```

---

## Out of scope

- Email preferences / unsubscribe (future)
- Sending from verified custom domain careercoach.pk (done in Resend dashboard)
- Onboarding sequence / drip emails (future)
