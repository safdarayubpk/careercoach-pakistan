# Subscription Paywall — Design Spec
**Date:** 2026-05-06
**Phase:** 5
**Status:** Approved

---

## Overview

Stripe-powered subscription paywall. Users get a 7-day free trial (set at signup). When the trial expires, middleware redirects them to `/app/billing`. They pay PKR 999/month via Stripe Checkout. A webhook activates their subscription. Subscribed users see a "Manage Subscription" link that opens the Stripe Customer Portal (cancel, update card, invoices).

---

## Flow

```
Trial expired → middleware → /app/billing
  └── "Subscribe Now" button
        └── POST /api/checkout → creates Stripe Checkout Session
              └── redirect to Stripe hosted checkout
                    └── payment succeeds
                          └── Stripe redirects to /app/billing/success
                                └── shows 🎉 confirmation
                                      └── "Go to Dashboard" → /app/dashboard

Stripe webhook (async, fires within seconds of payment):
  checkout.session.completed → upsert subscriptions table + users.is_subscribed = true
  customer.subscription.deleted → users.is_subscribed = false
```

---

## Database

### New table: `subscriptions`

```sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);
```

### Existing `users` table — no schema changes needed

`is_subscribed` (boolean) already exists. The webhook sets it to `true` on subscription creation and `false` on cancellation.

---

## Stripe Configuration

- Product: "CareerCoach Pakistan — Monthly"
- Price: PKR 999/month recurring (create in Stripe Dashboard)
- Env vars (already in `.env.local`):
  - `STRIPE_SECRET_KEY` — server-side only
  - `STRIPE_WEBHOOK_SECRET` — for webhook signature verification
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — not used (Checkout is server-redirect, no embedded form)
  - `NEXT_PUBLIC_STRIPE_PRICE_ID` — the Price ID from Stripe Dashboard (e.g. `price_xxx`)
- Webhook endpoint registered in Stripe Dashboard: `https://careercoach.pk/api/webhooks/stripe`
- Events to listen for: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
- **Stripe Customer Portal must be activated:** Stripe Dashboard → Billing → Customer Portal → Activate. Without this, `stripe.billingPortal.sessions.create()` throws. Set return URL to `https://careercoach.pk/app/billing`.

---

## Setup

Install Stripe SDK before implementing:
```bash
pnpm add stripe
```

---

## New Files

```
src/lib/stripe.ts                          ← Stripe singleton
src/lib/supabase/admin.ts                  ← Service-role Supabase client (webhook use only)
src/app/app/billing/page.tsx               ← Billing page (2 states)
src/app/app/billing/success/page.tsx       ← Post-payment confirmation
src/app/api/checkout/route.ts              ← Creates Stripe Checkout Session
src/app/api/portal/route.ts               ← Creates Stripe Customer Portal Session
src/app/api/webhooks/stripe/route.ts       ← Handles Stripe events
src/components/billing/subscribe-button.tsx ← 'use client' subscribe CTA
src/components/billing/manage-button.tsx   ← 'use client' manage portal link
```

---

## `src/lib/stripe.ts`

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})
```

---

## `src/app/api/checkout/route.ts`

**Method:** POST  
**Auth:** Requires authenticated user (reads from Supabase session)  
**Body:** none — price ID comes from env var

```typescript
// Logic:
// 1. Get user from supabase.auth.getUser()
// 2. If !user → 401
// 3. Derive base URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
// 4. Create Stripe Checkout Session:
//    - mode: 'subscription'
//    - line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }]
//    - success_url: baseUrl + '/app/billing/success?session_id={CHECKOUT_SESSION_ID}'
//    - cancel_url: baseUrl + '/app/billing'
//    - client_reference_id: user.id   ← links Stripe session to Supabase user
//    - customer_email: user.email     ← pre-fills email in Stripe checkout
// 5. Return NextResponse.json({ url: session.url })
```

Client calls this route, gets back `{ url }`, and does `window.location.href = url` to redirect.

---

## `src/app/api/webhooks/stripe/route.ts`

**Method:** POST  
**Auth:** Stripe signature verification — no Supabase auth  
**Body:** raw request body (must not be parsed by Next.js)

```typescript
// Logic:
// 1. Read raw body: await request.text()
// 2. Get Stripe-Signature header
// 3. stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
//    → if invalid signature → 400
// 4. Handle events:

// Event: checkout.session.completed
//   - Extract client_reference_id (= user_id), session.customer, session.subscription
//   - Upsert subscriptions table:
//       { user_id, stripe_customer_id: session.customer, stripe_subscription_id: session.subscription, status: 'active' }
//       onConflict: 'stripe_subscription_id' (idempotent — webhook may fire twice)
//   - Update users table: { is_subscribed: true } where id = user_id
//   - Use supabaseAdmin (service role key) — not the anon client

// Event: customer.subscription.deleted
//   - stripe_subscription_id = event.data.object.id
//   - Find subscriptions row by stripe_subscription_id → get user_id
//   - Update subscriptions: { status: 'canceled' }
//   - Update users: { is_subscribed: false } where id = user_id

// Event: customer.subscription.updated
//   - stripe_subscription_id = event.data.object.id
//   - sub_status = event.data.object.status  (e.g. 'active', 'past_due', 'unpaid', 'canceled')
//   - is_subscribed = sub_status === 'active'
//   - Update subscriptions: { status: sub_status }
//   - Update users: { is_subscribed } where user_id found via stripe_subscription_id
//   - Covers payment failure → past_due → user loses access without needing manual cancellation

// 5. Return NextResponse.json({ received: true }) for all events (never 4xx for unknown events)
```

**Important:** Use `SUPABASE_SERVICE_ROLE_KEY` (admin client) in the webhook — it runs without a user session. Never use the anon client here.

The webhook route must export `export const dynamic = 'force-dynamic'` and disable body parsing via the raw `request.text()` pattern (Next.js App Router parses body by default — reading `.text()` before any JSON parse gives the raw string Stripe needs for signature verification).

---

## `src/app/app/billing/page.tsx`

Server Component. Fetches `is_subscribed` and `trial_ends_at` from the `users` table:

```typescript
const { data: userRow } = await supabase
  .from('users')
  .select('is_subscribed, trial_ends_at')
  .eq('id', user.id)
  .single()
```

### State 1 — Unsubscribed (trial expired or active)

- Amber badge: "Your trial has ended" (or "X days left in your trial" if still active)
- Pricing card (white, blue border):
  - **PKR 999/month** (large, bold, `#1E40AF`)
  - ~~PKR 7,000/month~~ (Final Round AI) — struck through
  - "You save PKR 6,000/month" (green)
  - Feature list: Unlimited sessions · JD-tailored questions · AI feedback · Urdu voice 🎤
  - "Subscribe Now — PKR 999/month" button → calls `POST /api/checkout`, redirects to Stripe
  - "Cancel anytime · Secured by Stripe" (small gray)

### State 2 — Subscribed

- ✅ icon + "Subscription Active"
- "PKR 999/month · Renews automatically"
- "Manage Subscription →" button → calls `POST /api/portal`, redirects to Stripe Customer Portal

**Trial days remaining calculation** (for State 1 badge):
```typescript
const daysLeft = Math.ceil(
  (new Date(userRow.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
)
// daysLeft > 0 → "X days left in your trial"
// daysLeft <= 0 → "Your trial has ended"
```

### Subscribe button — client component

`'use client'` component `<SubscribeButton>` — calls `POST /api/checkout`, gets `{ url }`, sets `window.location.href = url`. Shows loading state while waiting.

### Manage Subscription button — client component

`'use client'` component `<ManageButton>` — calls `POST /api/portal`, gets `{ url }`, sets `window.location.href = url`.

---

## `src/app/api/portal/route.ts`

**Method:** POST  
**Auth:** Requires authenticated user

```typescript
// Logic:
// 1. Get user from supabase.auth.getUser() — 401 if not found
// 2. Find stripe_customer_id from subscriptions table where user_id = user.id
//    → if not found → 400 'No active subscription'
// 3. Derive base URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
// 4. stripe.billingPortal.sessions.create({
//      customer: stripe_customer_id,
//      return_url: baseUrl + '/app/billing',
//    })
// 5. Return NextResponse.json({ url: session.url })
```

---

## `src/app/app/billing/success/page.tsx`

Server Component. Simple confirmation page shown after Stripe redirects back.

- 🎉 icon
- "You're in!" heading
- "Payment confirmed. Your CareerCoach Pakistan subscription is now active."
- "Go to Dashboard →" link → `/app/dashboard`
- "A receipt has been sent to your email by Stripe."

**Note:** No polling needed. The webhook fires within seconds and activates the subscription. By the time the user clicks "Go to Dashboard", middleware will see `is_subscribed = true` and let them through. If the webhook hasn't fired yet (rare), the middleware allows the dashboard anyway since `/app/billing/success` is not gated — the user will be redirected back to `/app/billing` only if they try to access dashboard before webhook fires. This is an acceptable UX tradeoff.

**Middleware note:** `/app/billing/success` must be allowed through even without subscription — add it to the middleware bypass list alongside `/app/billing`.

---

## Middleware Update

Update the bypass check to allow both billing routes:

```typescript
// Before:
if (!hasAccess && !request.nextUrl.pathname.startsWith('/app/billing')) {

// After: no change needed — startsWith('/app/billing') already covers /app/billing/success
```

`startsWith('/app/billing')` already matches `/app/billing/success` — no middleware change required.

---

## Supabase Admin Client

Create `src/lib/supabase/admin.ts` — used only in the webhook route:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

This client bypasses RLS — only use in server-side API routes, never in components.

---

## File Map

**New files:** (see New Files section above)

**Modified files:**
```
(none — middleware startsWith('/app/billing') already covers /app/billing/success)
```

---

## Error States

| Scenario | Behaviour |
|----------|-----------|
| Checkout API fails | Return 500, `SubscribeButton` shows "Something went wrong. Try again." |
| Webhook signature invalid | Return 400, log error |
| Webhook: user not found (client_reference_id missing) | Return 200 (idempotent), log warning — don't crash Stripe retry loop |
| Webhook: `customer.subscription.updated` to `past_due` | `is_subscribed = false` — middleware redirects to `/app/billing` on next request |
| Portal: no subscription row found | Return 400 "No active subscription" |
| User visits /app/billing/success without paying | Shows confirmation — harmless, middleware redirects on next protected route visit |
| Stripe Customer Portal not activated in Dashboard | `stripe.billingPortal.sessions.create()` throws — `ManageButton` shows error |
