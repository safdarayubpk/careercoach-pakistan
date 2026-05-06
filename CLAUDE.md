@AGENTS.md

# CLAUDE.md — CareerCoach Pakistan

This file provides guidance to Claude Code when working in the `careercoach-pakistan/` project.

## Product Overview

**CareerCoach Pakistan** — AI-powered interview preparation coach for Pakistani job seekers.
Pakistani professionals pay PKR 999/month instead of PKR 7,000/month for global tools (Final Round AI, Huru.ai).
Core differentiator: JD-paste → tailored questions + Urdu language support.

**Status:** Phases 0–5 complete. Phase 6 (Landing page) next.
**Repo:** github.com/safdarayubpk/careercoach-pakistan
**Deploy:** Vercel (full-stack, not static)

## Tech Stack

- **Framework:** Next.js 16 (App Router) with TypeScript
- **Styling:** Tailwind CSS 4 + ShadCN UI
- **Auth + DB:** Supabase (Google OAuth + PostgreSQL)
- **AI Engine:** Groq API — LLaMA 3.3 70B (fast inference for feedback)
- **Payments:** Stripe (subscription, PKR 999/month)
- **Animations:** Framer Motion
- **Package Manager:** pnpm
- **Deployment:** Vercel

## Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server at localhost:3000
pnpm build            # Production build
pnpm start            # Serve production build
pnpm lint             # ESLint via next lint
pnpm type-check       # TypeScript check (tsc --noEmit)
```

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq
GROQ_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PRICE_ID=

# App
NEXT_PUBLIC_SITE_URL=https://careercoach.pk
```

## Architecture

### Route Structure
```
app/
  (marketing)/
    page.tsx              ← Landing page (public)
    layout.tsx
  app/                    ← Protected app (literal directory, not a route group)
    dashboard/page.tsx    ← Progress dashboard
    session/
      setup/page.tsx      ← Session setup: role, level, JD paste
      [id]/
        question/page.tsx ← Question + answer + feedback (all-in-one session player)
        report/page.tsx   ← Session report with Q&A accordion
    billing/page.tsx      ← Subscription management (paywall or active state)
    billing/success/page.tsx ← Post-payment confirmation
    layout.tsx            ← App shell with nav
  auth/
    callback/route.ts     ← Supabase OAuth callback (creates public.users row)
  api/
    session/route.ts      ← Create session, generate questions via Groq
    feedback/route.ts     ← Submit answer → Groq → return score + feedback
    checkout/route.ts     ← Create Stripe Checkout Session
    portal/route.ts       ← Create Stripe Customer Portal session
    webhooks/stripe/route.ts ← Stripe webhook events (subscription lifecycle)
middleware.ts             ← Protects /app/* — checks trial + subscription
```

### Data Flow
```
User pastes JD + selects role/level
  → api/session → Groq generates 10 tailored questions
  → stored in Supabase sessions table
  → question screen pulls from session
  → user answers → api/feedback → Groq scores + gives feedback
  → stored in answers table
  → session report aggregates scores
```

### Database Schema (Supabase)

```sql
users           -- id, email, full_name, avatar_url, created_at, is_subscribed, trial_ends_at
sessions        -- id, user_id, role, level, interview_type, jd_text, score, created_at
questions       -- id, session_id, text, category, order_index
answers         -- id, question_id, user_id, answer_text, score, feedback_json
subscriptions   -- id, user_id, stripe_customer_id, stripe_subscription_id, status, created_at, updated_at
```

### Auth Flow
- Google OAuth via Supabase
- Session stored in Supabase cookie (middleware reads it)
- Middleware at `middleware.ts` protects all `/app/*` routes
- Free trial: 7 days from `users.trial_ends_at`
- After trial: check `users.is_subscribed` — if false, redirect to `/app/billing`

### AI Feedback Engine (Groq)

**Model:** `llama-3.3-70b-versatile`
**Endpoint:** `api/feedback/route.ts`

Prompt structure:
```
System: You are a senior technical interviewer evaluating a candidate's answer.
        Score from 1-10. Return JSON: { score, correct_points[], missing_points[], improve_tip, model_answer }
        Be concise. Max 3 bullet points per section.

User: Question: {question}
      Candidate Answer: {answer}
      Job Context: {jd_snippet}
      Role: {role} | Level: {level}
```

Response must always be valid JSON — use `response_format: { type: "json_object" }`.

## Design System

- **Primary color:** `#1E40AF` (Blue 800) — buttons, nav, accents
- **Style:** Clean white + blue (Style B — professional, not dark mode)
- **Font:** Inter (system font via Tailwind)
- **Spacing:** Tailwind defaults. Sections: `py-16 md:py-24`. Container: `max-w-5xl mx-auto px-4`
- **ShadCN theme:** Blue, radius 0.5rem

### Key UI Patterns
- Landing page: Split hero — left pitch + CTA, right live product preview mockup
- Landing nav: Logo + Features/Pricing links + "Sign In" (returning users) + hero "Start Free Trial" CTA (new users)
- App shell: Blue top nav bar (#1E40AF) — logo left, nav links center, avatar + name right
- Question screen: blue left-border card for question text, orange tip box, green JD context pill
- Feedback screen: green card (correct), red card (missing), blue card (improve tip)
- Score display: gradient blue card with large number `/10`
- Session report: 4 metric cards (Technical, Behavioral, System Design, Communication)
- Paywall: PKR 999 highlighted, PKR 7,000 crossed out, "You save PKR 6,000/month"

## Product Rules

- **Language:** English UI, answers accepted in English or Urdu
- **Urdu voice:** Web Speech API with `lang="ur-PK"` — button label "🎤 بولیں"
- **Free trial:** 7 days, unlimited sessions — no credit card required
- **Subscription:** PKR 999/month via Stripe
- **Question count:** 10 per session
- **Categories:** Technical, Behavioral, System Design, Communication
- **JD paste:** Optional — if provided, questions are tailored to JD tech stack

## Spec Documents

All features are spec'd before coding. Specs live in `docs/superpowers/specs/`, plans in `docs/superpowers/plans/`:

```
docs/superpowers/specs/
  2026-05-05-auth-ui-design.md                    ← Phase 1: Auth UI ✓ DONE
  2026-05-05-interview-session-ai-feedback.md     ← Phases 2+3: Session + Groq feedback ✓ DONE
  2026-05-06-session-report-dashboard.md          ← Phase 4: Report + dashboard ✓ DONE
  2026-05-06-subscription-paywall.md              ← Phase 5: Stripe paywall ✓ DONE

docs/superpowers/plans/
  2026-05-05-interview-session-ai-feedback.md
  2026-05-05-phase-1-auth-ui.md
  2026-05-06-session-report-dashboard.md
  2026-05-06-subscription-paywall.md
```

Always read the relevant spec before implementing a feature.

## Build Phases

```
Phase 0: Project setup (Next.js + Supabase + Groq + Stripe configured) ✓ DONE
Phase 1: Auth (Google login, protected routes, user table) ✓ DONE
Phase 2: Interview session (setup form, question screen, answer input) ✓ DONE
Phase 3: AI feedback (Groq integration, scoring, feedback display) ✓ DONE
Phase 4: Session report + progress dashboard ✓ DONE
Phase 5: Subscription paywall (Stripe, trial logic, billing page) ✓ DONE
Phase 6: Landing page (marketing, pricing, CTA) ← NEXT
Phase 7: Polish (animations, mobile, accessibility, Urdu RTL)
Phase 8: Launch prep (domain, env vars, Vercel deploy, smoke test)
```

## Key Conventions

- All animations respect `prefers-reduced-motion: reduce`
- Framer Motion scroll animations: `whileInView` with `once: true`
- ShadCN components in `src/components/ui/` — do not manually edit
- Groq responses always parsed as JSON — never trust plain text from LLM
- Stripe webhooks must verify signature before processing
- All `/app/*` routes require active session — middleware enforces this
- RLS (Row Level Security) enabled on all Supabase tables
- Trial expiry checked server-side in middleware — never trust client
- `supabaseAdmin` (service role) used only in server API routes — guarded with `import 'server-only'`
- Auth callback (`/auth/callback`) uses `supabaseAdmin` to upsert `public.users` — anon client is blocked by RLS
- Score utilities in `src/lib/scores.ts` — `computeAverage`, `scoreLabel`, `scoreColor`
- Session types in `src/types/session.ts`

## Skills Installed

**Global** (`~/.agents/skills/`): `supabase`, `supabase-postgres-best-practices`, `nextjs-supabase-auth`, `nextjs-seo`, `svg-logo-designer`, `ui-ux-pro-max`, `find-skills`

**Project** (`.agents/skills/`): `spec-driven-development`, `shadcn`, `framer-motion`, `accessibility`, `landing-page-design`, `scroll-experience`, `browsing-with-playwright`, `fetch-library-docs`, `doc-coauthoring`, `theme-factory`, `interactive-portfolio`, `skill-creator`, `skill-validator`, `tailored-resume-generator`, `discovery-interview`, `internal-comms`, `pdf`

Invoke via the `Skill` tool — do not read skill files directly.

## Competitor Context

| Tool | Price | Urdu | JD-tailored | Pakistan |
|------|-------|------|-------------|---------|
| Final Round AI | $25/mo | No | No | No |
| Huru.ai | $19/mo | No | No | No |
| interviews.chat | $15/mo | No | Partial | No |
| **CareerCoach PK** | **PKR 999/mo** | **Yes** | **Yes** | **Yes** |
