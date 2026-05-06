# Subscription Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Stripe-powered subscription paywall — billing page, Stripe Checkout, webhook activation, Stripe Customer Portal for management.

**Architecture:** Nine new files, zero modified files. Stripe Checkout (server-redirect) handles payment — no embedded form, no PCI scope. A webhook sets `users.is_subscribed = true` after payment. Middleware (already written) enforces the gate. The Supabase admin client (service role) is used only in the webhook, bypassing RLS.

**Tech Stack:** Next.js 16 App Router, TypeScript, Stripe SDK (`stripe`), Supabase (`@supabase/ssr` + `@supabase/supabase-js`), Tailwind CSS 4.

---

## File Map

| File | Role |
|------|------|
| `src/lib/stripe.ts` | Stripe SDK singleton — imported by API routes |
| `src/lib/supabase/admin.ts` | Service-role Supabase client — webhook use only |
| `src/app/api/checkout/route.ts` | POST — creates Stripe Checkout Session |
| `src/app/api/portal/route.ts` | POST — creates Stripe Customer Portal session |
| `src/app/api/webhooks/stripe/route.ts` | POST — handles Stripe webhook events |
| `src/components/billing/subscribe-button.tsx` | `'use client'` — calls /api/checkout, redirects |
| `src/components/billing/manage-button.tsx` | `'use client'` — calls /api/portal, redirects |
| `src/app/app/billing/page.tsx` | Server Component — paywall or active state |
| `src/app/app/billing/success/page.tsx` | Server Component — post-payment confirmation |

---

## Task 1: Install Stripe and create library singletons

**Files:**
- Create: `src/lib/stripe.ts`
- Create: `src/lib/supabase/admin.ts`

- [ ] **Step 1: Install the Stripe SDK**

```bash
cd "/home/safdarayub/Desktop/software house projects_3/careercoach-pakistan"
pnpm add stripe
```

Expected: `stripe` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Create `src/lib/stripe.ts`**

```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
})
```

- [ ] **Step 3: Create `src/lib/supabase/admin.ts`**

```typescript
import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. ONLY use in server-side API routes, never in components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

- [ ] **Step 4: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe.ts src/lib/supabase/admin.ts package.json pnpm-lock.yaml
git commit -m "feat: install stripe SDK and add stripe + supabaseAdmin singletons"
```

---

## Task 2: Create subscriptions table in Supabase

**Files:** (none — manual SQL step in Supabase dashboard)

- [ ] **Step 1: Run SQL in Supabase Dashboard → SQL Editor**

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

- [ ] **Step 2: Verify in Supabase Table Editor**

Open Supabase Dashboard → Table Editor → confirm `subscriptions` table exists with columns: `id`, `user_id`, `stripe_customer_id`, `stripe_subscription_id`, `status`, `created_at`, `updated_at`.

---

## Task 3: Checkout API route

**Files:**
- Create: `src/app/api/checkout/route.ts`

- [ ] **Step 1: Create `src/app/api/checkout/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
      success_url: `${baseUrl}/app/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/app/billing`,
      client_reference_id: user.id,
      customer_email: user.email,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[POST /api/checkout]', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat: add /api/checkout — creates Stripe Checkout Session"
```

---

## Task 4: Portal API route

**Files:**
- Create: `src/app/api/portal/route.ts`

- [ ] **Step 1: Create `src/app/api/portal/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${baseUrl}/app/billing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[POST /api/portal]', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/portal/route.ts
git commit -m "feat: add /api/portal — creates Stripe Customer Portal session"
```

---

## Task 5: Stripe webhook route

**Files:**
- Create: `src/app/api/webhooks/stripe/route.ts`

This route handles three events:
- `checkout.session.completed` → activate subscription
- `customer.subscription.updated` → sync status (catches `past_due`, `unpaid`)
- `customer.subscription.deleted` → deactivate subscription

**Critical:** reads raw body via `request.text()` before any JSON parse — Stripe needs the raw bytes for signature verification. Uses `supabaseAdmin` (service role), not the anon client.

- [ ] **Step 1: Create `src/app/api/webhooks/stripe/route.ts`**

```typescript
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id

        if (!userId) {
          console.warn('[Stripe webhook] checkout.session.completed: missing client_reference_id')
          break
        }

        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id: userId,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              status: 'active',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'stripe_subscription_id' }
          )

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: true })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const isActive = sub.status === 'active'

        const { data: subRow } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!subRow) {
          console.warn('[Stripe webhook] subscription.updated: no row found for', sub.id)
          break
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: sub.status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: isActive })
          .eq('id', subRow.user_id)

        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription

        const { data: subRow } = await supabaseAdmin
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', sub.id)
          .single()

        if (!subRow) {
          console.warn('[Stripe webhook] subscription.deleted: no row found for', sub.id)
          break
        }

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id)

        await supabaseAdmin
          .from('users')
          .update({ is_subscribed: false })
          .eq('id', subRow.user_id)

        break
      }

      default:
        // Unknown event — return 200 so Stripe doesn't retry
        break
    }
  } catch (error) {
    console.error('[Stripe webhook] Handler error:', error)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: add /api/webhooks/stripe — handles checkout.session.completed, subscription.updated/deleted"
```

---

## Task 6: Client components — SubscribeButton and ManageButton

**Files:**
- Create: `src/components/billing/subscribe-button.tsx`
- Create: `src/components/billing/manage-button.tsx`

- [ ] **Step 1: Create `src/components/billing/subscribe-button.tsx`**

```typescript
'use client'

import { useState } from 'react'

export default function SubscribeButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError('Something went wrong. Try again.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-xl bg-[#1E40AF] px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Redirecting to Stripe…' : 'Subscribe Now — PKR 999/month'}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/billing/manage-button.tsx`**

```typescript
'use client'

import { useState } from 'react'

export default function ManageButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || !data.url) {
        setError('Could not open portal. Try again.')
        return
      }

      window.location.href = data.url
    } catch {
      setError('Could not open portal. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-6 py-3 text-sm font-semibold text-[#1E40AF] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Opening portal…' : 'Manage Subscription →'}
      </button>
      {error && (
        <p className="mt-2 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

```bash
pnpm type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/billing/subscribe-button.tsx src/components/billing/manage-button.tsx
git commit -m "feat: add SubscribeButton and ManageButton client components"
```

---

## Task 7: Billing page

**Files:**
- Create: `src/app/app/billing/page.tsx`

Two states:
- **Unsubscribed** — pricing card with trial badge + `<SubscribeButton />`
- **Subscribed** — active status card + `<ManageButton />`

- [ ] **Step 1: Create `src/app/app/billing/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SubscribeButton from '@/components/billing/subscribe-button'
import ManageButton from '@/components/billing/manage-button'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: userRow } = await supabase
    .from('users')
    .select('is_subscribed, trial_ends_at')
    .eq('id', user.id)
    .single()

  if (!userRow) redirect('/')

  // ── Subscribed state ──────────────────────────────────────────────────
  if (userRow.is_subscribed) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mb-3 text-5xl">✅</div>
            <h1 className="mb-1 text-xl font-bold text-gray-900">Subscription Active</h1>
            <p className="mb-6 text-sm text-gray-500">PKR 999/month · Renews automatically</p>
            <ManageButton />
            <p className="mt-3 text-xs text-gray-400">
              Update payment method, cancel, or view invoices on Stripe
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ── Unsubscribed / trial state ────────────────────────────────────────
  const daysLeft = Math.ceil(
    (new Date(userRow.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const trialBadge =
    daysLeft > 0
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial`
      : 'Your trial has ended'

  return (
    <div className="flex justify-center py-12">
      <div className="w-full max-w-md">
        {/* Trial badge */}
        <div className="mb-5 text-center">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">
            {trialBadge}
          </span>
        </div>

        {/* Pricing card */}
        <div className="rounded-2xl border-2 border-[#1E40AF] bg-white p-8 shadow-lg shadow-blue-100">
          <p className="mb-1 text-center text-sm font-semibold text-gray-400">
            CareerCoach Pakistan
          </p>
          <p className="mb-5 text-center text-xs text-gray-400">AI Interview Coach</p>

          {/* Price */}
          <div className="mb-1 text-center">
            <span className="text-5xl font-extrabold text-[#1E40AF]">PKR 999</span>
            <span className="text-sm text-gray-400">/month</span>
          </div>
          <p className="mb-1 text-center text-sm text-gray-400">
            <span className="line-through">PKR 7,000/month</span>{' '}
            <span className="text-gray-500">(Final Round AI)</span>
          </p>
          <p className="mb-6 text-center text-sm font-bold text-green-600">
            You save PKR 6,000/month
          </p>

          {/* Feature list */}
          <ul className="mb-6 divide-y divide-gray-100">
            {[
              'Unlimited interview sessions',
              'JD-tailored questions',
              'AI feedback in seconds (Groq)',
              'Urdu voice input 🎤',
            ].map(feature => (
              <li
                key={feature}
                className="flex items-center gap-3 py-2.5 text-sm text-gray-700"
              >
                <span className="font-bold text-green-600">✓</span>
                {feature}
              </li>
            ))}
          </ul>

          <SubscribeButton />
          <p className="mt-3 text-center text-xs text-gray-400">
            Cancel anytime · Secured by Stripe
          </p>
        </div>
      </div>
    </div>
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
git add src/app/app/billing/page.tsx
git commit -m "feat: add billing page — paywall card and active subscription state"
```

---

## Task 8: Success page

**Files:**
- Create: `src/app/app/billing/success/page.tsx`

Simple Server Component. No polling — webhook is fast enough. `startsWith('/app/billing')` in middleware already allows this route through without subscription.

- [ ] **Step 1: Create `src/app/app/billing/success/page.tsx`**

```typescript
import Link from 'next/link'

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <div className="mb-4 text-6xl">🎉</div>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900">You're in!</h1>
        <p className="mb-8 text-sm text-gray-500">
          Payment confirmed. Your CareerCoach Pakistan subscription is now active.
        </p>
        <Link
          href="/app/dashboard"
          className="inline-block rounded-xl bg-[#1E40AF] px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-800"
        >
          Go to Dashboard →
        </Link>
        <p className="mt-4 text-xs text-gray-400">
          A receipt has been sent to your email by Stripe.
        </p>
      </div>
    </div>
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
git add src/app/app/billing/success/page.tsx
git commit -m "feat: add billing success page — post-payment confirmation"
```

---

## Task 9: End-to-end smoke test

No code changes — manual walkthrough using Stripe test mode.

**Prerequisites before testing:**
1. Stripe Dashboard → Products → create "CareerCoach Pakistan — Monthly" at PKR 999/month recurring. Copy the Price ID into `.env.local` as `NEXT_PUBLIC_STRIPE_PRICE_ID`.
2. Stripe Dashboard → Billing → Customer Portal → Activate. Set return URL to `http://localhost:3000/app/billing`.
3. Stripe Dashboard → Webhooks → Add endpoint: `https://<ngrok-url>/api/webhooks/stripe`, events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy signing secret into `.env.local` as `STRIPE_WEBHOOK_SECRET`.
4. For local webhook testing: install [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Use the webhook signing secret printed by the CLI (starts with `whsec_`).

- [ ] **Step 1: Test billing page — trial state**

Start dev server: `pnpm dev`

Sign in, then manually set your `trial_ends_at` to a past date in Supabase Dashboard:
```sql
update public.users set trial_ends_at = now() - interval '1 day' where email = 'your@email.com';
```

Visit `http://localhost:3000/app/dashboard` — middleware should redirect to `/app/billing`.

Confirm:
- Amber badge shows "Your trial has ended"
- PKR 999 pricing card with struck-through PKR 7,000
- "Subscribe Now" button visible

- [ ] **Step 2: Test Stripe Checkout**

Click "Subscribe Now". Confirm:
- Button shows "Redirecting to Stripe…" while loading
- Browser redirects to Stripe hosted checkout
- Email is pre-filled

Use Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC.

- [ ] **Step 3: Test success page and webhook**

After paying, confirm:
- Browser lands on `/app/billing/success`
- 🎉 "You're in!" message shown
- Stripe CLI terminal shows `checkout.session.completed` event received and `200` returned

Click "Go to Dashboard":
- Dashboard loads (middleware sees `is_subscribed = true`)
- No redirect back to billing

- [ ] **Step 4: Verify DB state**

In Supabase Dashboard → Table Editor:
- `subscriptions` table has a new row with `status = 'active'`
- `users` table has `is_subscribed = true` for your user

- [ ] **Step 5: Test billing page — subscribed state**

Visit `http://localhost:3000/app/billing` directly.

Confirm:
- ✅ "Subscription Active" card shown
- "Manage Subscription →" button visible
- Clicking it opens Stripe Customer Portal

- [ ] **Step 6: Test cancellation flow**

In Stripe Customer Portal, cancel the subscription.

Confirm (within a few seconds):
- Stripe CLI shows `customer.subscription.deleted` event → `200`
- `subscriptions.status` = `'canceled'` in Supabase
- `users.is_subscribed` = `false` in Supabase
- Visiting `/app/dashboard` redirects to `/app/billing`

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 5 — Stripe subscription paywall"
```
