# CareerCoach Pakistan

AI-powered interview preparation for Pakistani job seekers — PKR 999/month instead of PKR 7,000/month for global tools.

**Live:** [careercoach.pk](https://careercoach.pk)

---

## What it does

1. Paste a job description (optional)
2. Answer 10 AI-generated interview questions tailored to your role and level
3. Get instant scores and feedback from an AI senior interviewer
4. Review your session report and track progress over time

Supports answers in **English or Urdu** (voice input included).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS 4 + ShadCN UI |
| Auth + DB | Supabase (Google OAuth + PostgreSQL + RLS) |
| AI Engine | Groq — LLaMA 3.3 70B |
| Payments | Stripe (PKR 999/month subscription) |
| Email | Resend (welcome email + trial expiry reminder) |
| Analytics | PostHog + Vercel Analytics |
| Deployment | Vercel |

---

## Local Development

**Prerequisites:** Node.js 18+, pnpm

```bash
# 1. Clone the repo
git clone https://github.com/safdarayubpk/careercoach-pakistan.git
cd careercoach-pakistan

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Fill in all values in .env.local (see Environment Variables below)

# 4. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Supabase — get from supabase.com project settings
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq — get from console.groq.com
GROQ_API_KEY=

# Stripe — get from dashboard.stripe.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

# App URL (use http://localhost:3000 for local dev)
NEXT_PUBLIC_SITE_URL=

# PostHog — get from posthog.com project settings
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_API_KEY=

# Resend — get from resend.com
RESEND_API_KEY=

# Cron secret — any long random string
# Generate with: openssl rand -hex 32
CRON_SECRET=
```

---

## Commands

```bash
pnpm dev          # Dev server at localhost:3000
pnpm build        # Production build
pnpm start        # Serve production build
pnpm lint         # ESLint
pnpm type-check   # TypeScript check (tsc --noEmit)
```

---

## Project Structure

```
src/
  app/
    (marketing)/        # Public pages: landing, pricing, privacy, terms
    app/                # Protected app (requires auth + active trial/subscription)
      dashboard/        # Progress overview
      session/
        setup/          # Role, level, JD paste
        [id]/question/  # Question + answer + AI feedback
        [id]/report/    # Full session report
      billing/          # Subscription management
    auth/callback/      # Supabase OAuth callback — creates user row, sends welcome email
    api/
      session/          # Create session + generate questions via Groq
      feedback/         # Submit answer → Groq → score + feedback
      checkout/         # Create Stripe Checkout session
      portal/           # Create Stripe Customer Portal session
      webhooks/stripe/  # Stripe webhook (subscription lifecycle)
      cron/trial-reminder/ # Daily email to users expiring in 24h
  components/
    landing/            # Landing page sections
    layout/             # AppNav, MobileDrawer, ProfileDropdown, LandingNav
    session/            # SetupForm, SessionPlayer, FeedbackView, ReportAccordion
    billing/            # SubscribeButton, ManageButton
    providers/          # PostHogProvider, PostHogIdentify
  emails/               # React Email templates (WelcomeEmail, TrialExpiryEmail)
  lib/                  # Supabase clients, Groq, Stripe, Resend, analytics, scores
  types/                # Session types
middleware.ts           # Protects /app/* — checks auth + trial/subscription status
```

---

## Key Features

- **JD-tailored questions** — paste any job description and get questions matched to its tech stack and requirements
- **Urdu voice input** — Web Speech API with `lang="ur-PK"`, answers accepted in Urdu or English
- **RTL support** — `dir="auto"` on all answer surfaces, Noto Nastaliq Urdu font
- **AI feedback** — score (1–10), correct points, missing points, improvement tip, model answer
- **7-day free trial** — no credit card required
- **Stripe subscription** — PKR 999/month, cancel anytime
- **Trial expiry reminder** — automated email 24h before trial ends (Vercel cron + Resend)
- **Analytics** — PostHog events (session started/completed, upgrade clicked, subscription created/cancelled) + Vercel Analytics

---

## Deployment

Deployed on Vercel. All environment variables must be set in the Vercel project settings under **Production** environment.

The Vercel cron job (`vercel.json`) runs `/api/cron/trial-reminder` daily at 4 AM UTC (9 AM PKT).

---

## License

Private — all rights reserved. © 2026 CareerCoach Pakistan.
