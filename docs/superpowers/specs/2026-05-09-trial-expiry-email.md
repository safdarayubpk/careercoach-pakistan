# Phase 11 — Trial Expiry Email Spec

**Date:** 2026-05-09
**Status:** Draft — awaiting approval

---

## Overview

Users get a 7-day free trial. Without a reminder, most will forget the product and let the trial lapse silently. A single email sent 1 day before expiry is the highest-leverage conversion touchpoint in the funnel.

**Goal:** Send one automated email to each trial user 24 hours before their trial expires, with a clear CTA to subscribe.

---

## User experience

- User signs up → gets 7-day trial
- Day 6 (24h before expiry): receives email — "Your trial ends tomorrow"
- Email has name, brief value reminder, PKR 999 CTA button
- Each user receives this email exactly once (no duplicates on re-runs)
- Subscribed users never receive it

---

## Architecture

### Email service — Resend

**Why Resend:** First-class Next.js/React support, simple REST API, free tier is 3,000 emails/month (plenty for early stage). Works with React Email templates.

**Packages:** `resend` + `@react-email/components`

### Cron — Vercel Cron Jobs

A Next.js route handler at `/api/cron/trial-reminder` runs once daily at **4:00 AM UTC (9:00 AM PKT)**.

Configured via `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminder",
      "schedule": "0 4 * * *"
    }
  ]
}
```

Vercel automatically sends a `GET` request to the route at the scheduled time.

**Security:** Vercel sets the `Authorization: Bearer <CRON_SECRET>` header on cron requests. The route rejects any request without a valid secret, preventing public triggering.

### Deduplication — `trial_reminder_sent` column

Add a boolean column to the `users` table:
```sql
ALTER TABLE public.users
ADD COLUMN trial_reminder_sent boolean NOT NULL DEFAULT false;
```

The cron job:
1. Queries users expiring in the next 24 hours who haven't been emailed yet
2. Sends email
3. Sets `trial_reminder_sent = true`

This ensures exactly-once delivery regardless of how many times the cron runs.

---

## Cron route logic (`/api/cron/trial-reminder`)

```
1. Verify Authorization header contains CRON_SECRET
2. Query users where:
   - trial_ends_at BETWEEN now() AND now() + interval '24 hours'
   - is_subscribed = false
   - trial_reminder_sent = false
3. For each user:
   a. Send email via Resend
   b. If send succeeds: UPDATE users SET trial_reminder_sent = true WHERE id = user.id
4. Return JSON summary: { sent: N, errors: M }
```

Errors on individual sends are logged but don't abort the batch — other users still get their emails.

---

## Email template

**Subject:** Your CareerCoach Pakistan free trial ends tomorrow

**From:** CareerCoach Pakistan `<noreply@careercoach.pk>`
*(Resend requires a verified sending domain. For launch, use Resend's default `onboarding@resend.dev` domain until careercoach.pk is verified.)*

**Content:**

```
Hi [first_name],

Your 7-day free trial ends in 24 hours.

You've been preparing for your next interview — don't lose access
when you're just getting started.

[Subscribe Now — PKR 999/month]  ← CTA button

Why stay?
• AI feedback on every answer
• Urdu voice support
• Tailored questions from your JD
• PKR 999/mo vs PKR 7,000/mo for global tools

If you have any questions, just reply to this email.

— The CareerCoach Pakistan Team
```

Built with `@react-email/components` (Button, Text, Section, Hr, etc.) for consistent rendering across email clients.

---

## Files to create / modify

| File | Action |
|------|--------|
| `src/app/api/cron/trial-reminder/route.ts` | Create — cron handler |
| `src/emails/TrialExpiryEmail.tsx` | Create — React Email template |
| `src/lib/resend.ts` | Create — Resend client singleton |
| `vercel.json` | Create — cron schedule |
| `.env.local` + `.env.example` | Add `RESEND_API_KEY`, `CRON_SECRET` |

**DB migration (run in Supabase SQL editor):**
```sql
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS trial_reminder_sent boolean NOT NULL DEFAULT false;
```

---

## Environment variables

```
RESEND_API_KEY=re_...          # from resend.com dashboard
CRON_SECRET=<random-string>    # any long random string, e.g. openssl rand -hex 32
```

---

## Acceptance criteria

```
WHEN cron runs at 4 AM UTC
THEN the route SHALL query users expiring in the next 24 hours

WHEN a qualifying user is found (trial expiring, not subscribed, not yet emailed)
THEN the route SHALL send the trial expiry email via Resend
AND SHALL set trial_reminder_sent = true on success

WHEN the cron runs again the next day
THEN the same user SHALL NOT receive a second email

WHEN a user has already subscribed
THEN they SHALL NOT receive the email regardless of trial_ends_at

WHEN the Authorization header is missing or incorrect
THEN the route SHALL return 401 and send no emails
```

---

## Out of scope

- Welcome email on signup (separate)
- Post-trial "you missed it" email (separate)
- Email from a verified custom domain (careercoach.pk — can be done in Resend dashboard post-launch)
- Unsubscribe / email preferences management
