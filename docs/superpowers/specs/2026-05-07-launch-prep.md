# Phase 8 — Launch Prep Design Spec

**Date:** 2026-05-07
**Status:** Approved — ready for implementation

---

## Overview

Deploy CareerCoach Pakistan to Vercel and make the app production-ready. Stripe stays in test mode for now — live keys come later. Domain (`careercoach.pk`) not yet purchased — launch on Vercel's generated URL first.

Two tracks:
- **Code changes** — SEO metadata, OG image, robots.txt, sitemap.xml, .env.example
- **Deployment checklist** — Vercel, Supabase config, Stripe webhook, smoke test

---

## Part 1 — Code Changes

### 1. Root Layout Metadata (`src/app/layout.tsx`)

Extend the existing `metadata` export with `metadataBase`, OpenGraph, and Twitter card. No new file — modify existing export.

```ts
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'CareerCoach Pakistan — AI Interview Prep',
  description:
    'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
  openGraph: {
    title: 'CareerCoach Pakistan — AI Interview Prep',
    description:
      'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
    url: '/',
    siteName: 'CareerCoach Pakistan',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'CareerCoach Pakistan' }],
    type: 'website',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerCoach Pakistan — AI Interview Prep',
    description:
      'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
    images: ['/opengraph-image'],
  },
}
```

**Key:** `metadataBase` ensures all relative URLs (like `/opengraph-image`) resolve to the correct origin in production. `NEXT_PUBLIC_SITE_URL` is set to the Vercel URL in the Vercel dashboard.

---

### 2. OG Image (`src/app/opengraph-image.tsx`)

Next.js App Router dynamic OG image via `ImageResponse`. Served at `/opengraph-image` automatically. No static PNG needed.

Design: blue (`#1E40AF`) background, white text, branded card layout.

```tsx
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CareerCoach Pakistan — AI Interview Prep'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1E40AF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div style={{ color: 'white', fontSize: 64, fontWeight: 700, marginBottom: 24 }}>
          CareerCoach Pakistan
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 32, textAlign: 'center', marginBottom: 40 }}>
          AI Interview Prep — Tailored to Pakistani Job Seekers
        </div>
        <div
          style={{
            background: 'white',
            color: '#1E40AF',
            fontSize: 28,
            fontWeight: 700,
            padding: '16px 40px',
            borderRadius: 12,
          }}
        >
          PKR 999/month
        </div>
      </div>
    ),
    { ...size }
  )
}
```

---

### 3. Robots (`src/app/robots.ts`)

Allow all crawlers on `/`. Block `/app/*` — those pages are auth-protected and should not be indexed.

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: '/app/' },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/sitemap.xml`,
  }
}
```

---

### 4. Sitemap (`src/app/sitemap.ts`)

Landing page only. App pages excluded (auth-protected, no SEO value).

```ts
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
```

---

### 5. Fix Duplicate Env Var (`.env.local`)

`.env.local` currently defines `NEXT_PUBLIC_SITE_URL` twice (both `http://localhost:3000`). Remove the duplicate. The file should have it once.

---

### 6. Environment Variable Reference (`.env.example`)

Committed to the repo. Documents all required vars. `.env.local` stays gitignored.

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Groq
GROQ_API_KEY=gsk_<key>

# Stripe (test mode — switch to sk_live_ for production)
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<webhook-signing-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<key>
NEXT_PUBLIC_STRIPE_PRICE_ID=price_<price-id>

# App — set to your Vercel URL or custom domain
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

---

## Part 2 — Deployment Checklist

This is the step-by-step guide to follow after the code changes are deployed.

---

### Step 1: Push code to GitHub

Ensure all commits are pushed:
```bash
git push origin main
```

Verify at: `github.com/safdarayubpk/careercoach-pakistan`

---

### Step 2: Create Vercel project

1. If you don't have a Vercel account, create a free one at [vercel.com](https://vercel.com)
2. Go to vercel.com → New Project
3. Import from GitHub → select `careercoach-pakistan`
3. Framework: **Next.js** (auto-detected)
4. Root directory: leave as default (`.`)
5. Do NOT deploy yet — add env vars first (Step 3)

---

### Step 3: Set environment variables in Vercel

In the Vercel project → Settings → Environment Variables, add all of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Copy from `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Copy from `.env.local` |
| `GROQ_API_KEY` | Copy from `.env.local` |
| `STRIPE_SECRET_KEY` | Copy from `.env.local` (test key for now) |
| `STRIPE_WEBHOOK_SECRET` | **Leave blank for now** — update after Step 6 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Copy from `.env.local` |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | Copy from `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | Set to your Vercel URL after first deploy (e.g. `https://careercoach-pakistan.vercel.app`) |

**Note:** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in your local `.env.local` is not used by the app — do not add it.

---

### Step 4: Deploy

Click **Deploy** in Vercel. Wait for the build to complete (~2 minutes).

Note your deployment URL — e.g. `https://careercoach-pakistan.vercel.app`. You'll use it in the next steps.

After the first deploy, go back to Vercel → Settings → Environment Variables and update `NEXT_PUBLIC_SITE_URL` to your actual Vercel URL. Then redeploy (Deployments → Redeploy).

---

### Step 5: Configure Google Cloud Console OAuth

Google blocks OAuth flows from origins not in its allowlist. You need to add your Vercel URL.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Click your OAuth 2.0 Client ID (the one used for Supabase Google Auth)
3. Under **Authorized JavaScript origins** → Add URI: `https://<your-vercel-url>`
4. Save

You do NOT need to change **Authorized redirect URIs** — those point to `https://<supabase-project-ref>.supabase.co/auth/v1/callback` which doesn't change.

Without this step, clicking "Sign in with Google" on the production URL will show a Google error: "Error 400: redirect_uri_mismatch".

---

### Step 6: Configure Supabase

In the [Supabase dashboard](https://supabase.com/dashboard) → your project → Authentication → URL Configuration:

1. **Site URL**: set to `https://<your-vercel-url>`
2. **Redirect URLs**: add `https://<your-vercel-url>/auth/callback`

Without this, Google OAuth will redirect back to `localhost:3000` instead of your live app.

---

### Step 7: Configure Stripe webhook

In the [Stripe dashboard](https://dashboard.stripe.com) → Developers → Webhooks:

1. Click **Add endpoint**
2. Endpoint URL: `https://<your-vercel-url>/api/webhooks/stripe`
3. Events to listen for: select **`checkout.session.completed`**, **`customer.subscription.updated`**, **`customer.subscription.deleted`**
4. Click **Add endpoint**
5. Copy the **Signing secret** (`whsec_...`)
6. In Vercel → Settings → Environment Variables: update `STRIPE_WEBHOOK_SECRET` to the new signing secret
7. Redeploy in Vercel (Deployments → Redeploy)

---

### Step 8: Smoke test

Open your Vercel URL in an incognito browser window. Run through this checklist:

- [ ] Landing page loads — hero, features, pricing sections all visible
- [ ] "Sign in with Google" button works — redirects to Google OAuth
- [ ] After sign in — lands on `/app/dashboard`
- [ ] Dashboard shows trial badge or empty state correctly
- [ ] Click "+ New Session" → setup form loads
- [ ] Fill in Role + Level → submit → questions generated (wait ~5s for Groq)
- [ ] Question screen loads — answer a question → submit → feedback appears with score
- [ ] Score counter animates, correct/missing/tip cards reveal in sequence
- [ ] Click "Next Question" → progresses correctly
- [ ] After Q10 → redirects to session report
- [ ] Session report shows score + category cards + Q&A accordion
- [ ] "Back to Dashboard" → dashboard shows the completed session
- [ ] Visit `/app/billing` → shows trial countdown + PKR 999 card
- [ ] Click "Subscribe" → Stripe checkout opens (test mode)
  - Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
  - Complete payment → lands on `/app/billing/success`
- [ ] Sign out → returns to landing page

---

## Files Changed / Created

| File | Action |
|---|---|
| `src/app/layout.tsx` | Modify — add metadataBase, OpenGraph, Twitter card |
| `src/app/opengraph-image.tsx` | Create — dynamic OG image via ImageResponse |
| `src/app/robots.ts` | Create — robots.txt via Next.js metadata route |
| `src/app/sitemap.ts` | Create — sitemap.xml via Next.js metadata route |
| `.env.local` | Modify — remove duplicate `NEXT_PUBLIC_SITE_URL` line |
| `.env.example` | Create — env var reference for deployment |

---

## Out of Scope

- Live Stripe keys (deferred — switch when ready to take real payments)
- Custom domain `careercoach.pk` (deferred — purchase and attach later)
- Urdu RTL layout (Phase 9)
- Error monitoring / analytics (post-launch)
- Email notifications (post-launch)
