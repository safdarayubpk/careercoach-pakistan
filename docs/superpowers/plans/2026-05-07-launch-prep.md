# Launch Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CareerCoach Pakistan production-ready with SEO metadata, OG image, robots.txt, sitemap.xml, and a clean env var setup ahead of Vercel deployment.

**Architecture:** All code changes are Next.js App Router conventions — metadata exports in `layout.tsx`, file-based route handlers for `robots.ts`/`sitemap.ts`, and the `opengraph-image.tsx` convention for dynamic OG images. No new dependencies required.

**Tech Stack:** Next.js 15 App Router, TypeScript, `next/og` (ImageResponse — built into Next.js)

---

## File Map

| File | Action |
|------|--------|
| `.env.local` | Modify — remove duplicate `NEXT_PUBLIC_SITE_URL` line |
| `.env.example` | Create — env var reference for deployment |
| `src/app/layout.tsx` | Modify — add `metadataBase`, `openGraph`, `twitter` to metadata export |
| `src/app/opengraph-image.tsx` | Create — dynamic OG image via `ImageResponse` |
| `src/app/robots.ts` | Create — robots.txt via Next.js metadata route |
| `src/app/sitemap.ts` | Create — sitemap.xml via Next.js metadata route |

---

### Task 1: Fix `.env.local` + create `.env.example`

**Files:**
- Modify: `.env.local`
- Create: `.env.example`

- [ ] **Step 1: Remove duplicate `NEXT_PUBLIC_SITE_URL` from `.env.local`**

Open `.env.local`. It currently has `NEXT_PUBLIC_SITE_URL=http://localhost:3000` on two lines (one near the top under Supabase, one at the very bottom). Remove the bottom duplicate so the key appears exactly once.

The file should end with:
```bash
# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

(Only one occurrence of `NEXT_PUBLIC_SITE_URL` in the file.)

- [ ] **Step 2: Create `.env.example`**

Create `.env.example` at the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Groq
GROQ_API_KEY=gsk_<key>

# Stripe (test mode — switch to sk_live_ for production payments)
STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<webhook-signing-secret>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<key>
NEXT_PUBLIC_STRIPE_PRICE_ID=price_<price-id>

# App — set to your Vercel URL or custom domain
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
```

- [ ] **Step 3: Verify `.env.example` is not gitignored**

Run:
```bash
git check-ignore -v .env.example
```
Expected: no output (not ignored). If it IS ignored, check `.gitignore` and add an exception: `!.env.example`.

- [ ] **Step 4: Commit**

```bash
git add .env.example .env.local
git commit -m "chore: fix duplicate NEXT_PUBLIC_SITE_URL; add .env.example"
```

---

### Task 2: Root Layout Metadata

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Update the metadata export**

Open `src/app/layout.tsx`. The current `metadata` export is:

```ts
export const metadata: Metadata = {
  title: "CareerCoach Pakistan — AI Interview Prep",
  description:
    "AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.",
};
```

Replace it with:

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

Leave the font imports and `RootLayout` function completely unchanged.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors. `metadataBase` requires a `URL` object — the `new URL(...)` call is correct.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(seo): add metadataBase, OpenGraph, and Twitter card to root layout"
```

---

### Task 3: OG Image

**Files:**
- Create: `src/app/opengraph-image.tsx`

- [ ] **Step 1: Create the OG image route**

Create `src/app/opengraph-image.tsx`:

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
        <div
          style={{
            color: 'white',
            fontSize: 64,
            fontWeight: 700,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          CareerCoach Pakistan
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
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

**How this works:** Next.js App Router automatically serves this file at `/opengraph-image`. The `metadata.openGraph.images` entry in `layout.tsx` points to `/opengraph-image`, so `metadataBase` resolves it to the full URL. `ImageResponse` renders the JSX to a PNG at 1200×630 using the Edge runtime.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Verify OG image renders in dev**

Run `pnpm dev` (if not already running) and open:
```
http://localhost:3000/opengraph-image
```
Expected: a 1200×630 PNG with blue background, "CareerCoach Pakistan" title, tagline, and "PKR 999/month" badge.

- [ ] **Step 4: Commit**

```bash
git add src/app/opengraph-image.tsx
git commit -m "feat(seo): add dynamic OG image via ImageResponse"
```

---

### Task 4: Robots

**Files:**
- Create: `src/app/robots.ts`

- [ ] **Step 1: Create robots.ts**

Create `src/app/robots.ts`:

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

**What this produces:** Next.js serves this at `/robots.txt`. Crawlers can index `/` (landing page) but are blocked from `/app/` (auth-protected pages). The sitemap URL points to the production origin.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Verify robots.txt in dev**

With dev server running, open:
```
http://localhost:3000/robots.txt
```
Expected output:
```
User-Agent: *
Allow: /
Disallow: /app/

Sitemap: http://localhost:3000/sitemap.xml
```

- [ ] **Step 4: Commit**

```bash
git add src/app/robots.ts
git commit -m "feat(seo): add robots.txt — allow landing, disallow /app/"
```

---

### Task 5: Sitemap

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Create sitemap.ts**

Create `src/app/sitemap.ts`:

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

**What this produces:** Next.js serves this at `/sitemap.xml`. Only the landing page (`/`) is included — app pages are auth-protected and have no SEO value.

- [ ] **Step 2: Type-check**

Run: `pnpm type-check`
Expected: no errors.

- [ ] **Step 3: Verify sitemap.xml in dev**

With dev server running, open:
```
http://localhost:3000/sitemap.xml
```
Expected: valid XML with one `<url>` entry pointing to `http://localhost:3000`.

- [ ] **Step 4: Commit**

```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): add sitemap.xml — landing page only"
```

---

### Task 6: Build Verification

**Files:** none

- [ ] **Step 1: Full type-check**

Run: `pnpm type-check`
Expected: exit 0, no errors.

- [ ] **Step 2: Production build**

Run: `pnpm build`
Expected: successful build. All routes compile, including the new `/opengraph-image`, `/robots.txt`, `/sitemap.xml` routes.

If you see an error about `ImageResponse` or `next/og`, ensure you are on Next.js 13.3+ (this project is on 16.2.4 — no issue).

- [ ] **Step 3: Push to GitHub**

```bash
git push origin main
```

Verify at `github.com/safdarayubpk/careercoach-pakistan` that all commits are present.

---

### Task 7: Deployment Checklist (Operational)

This task is a manual checklist — no code to write. Follow each step in order.

- [ ] **Step 1: Create Vercel account**

If you don't have one, sign up free at [vercel.com](https://vercel.com).

- [ ] **Step 2: Create Vercel project**

1. vercel.com → **New Project**
2. Import from GitHub → select `careercoach-pakistan`
3. Framework: **Next.js** (auto-detected)
4. Root directory: leave as default (`.`)
5. **Do NOT click Deploy yet** — add env vars first

- [ ] **Step 3: Add environment variables in Vercel**

Vercel → your project → **Settings → Environment Variables**. Add each of these (copy values from your `.env.local`):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | copy from `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | copy from `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | copy from `.env.local` |
| `GROQ_API_KEY` | copy from `.env.local` |
| `STRIPE_SECRET_KEY` | copy from `.env.local` (test key) |
| `STRIPE_WEBHOOK_SECRET` | **skip for now** — add after Step 6 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | copy from `.env.local` |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | copy from `.env.local` |
| `NEXT_PUBLIC_SITE_URL` | **skip for now** — add after first deploy |

> Do NOT add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — it's in your local file but unused by the app.

- [ ] **Step 4: Deploy**

Click **Deploy**. Wait ~2 minutes for the build.

Once complete, note your URL — e.g. `https://careercoach-pakistan.vercel.app`.

Then:
1. Go back to Vercel → Settings → Environment Variables
2. Add `NEXT_PUBLIC_SITE_URL` = `https://careercoach-pakistan.vercel.app` (your actual URL)
3. Deployments → **Redeploy** (so the sitemap and robots URLs use the real origin)

- [ ] **Step 5: Configure Google Cloud Console**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Click your OAuth 2.0 Client ID (the one used for Supabase Google Auth)
3. Under **Authorized JavaScript origins** → **Add URI**: `https://careercoach-pakistan.vercel.app`
4. Save

> You do NOT need to change Authorized redirect URIs — those point to your Supabase URL, not your app URL.

Without this step, "Sign in with Google" on production gives `Error 400: redirect_uri_mismatch`.

- [ ] **Step 6: Configure Supabase**

[supabase.com/dashboard](https://supabase.com/dashboard) → your project → **Authentication → URL Configuration**:

1. **Site URL**: `https://careercoach-pakistan.vercel.app`
2. **Redirect URLs**: add `https://careercoach-pakistan.vercel.app/auth/callback`

Save. Without this, Google OAuth redirects back to `localhost:3000` after login.

- [ ] **Step 7: Configure Stripe webhook**

[dashboard.stripe.com](https://dashboard.stripe.com) → **Developers → Webhooks → Add endpoint**:

1. Endpoint URL: `https://careercoach-pakistan.vercel.app/api/webhooks/stripe`
2. Events: select `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Click **Add endpoint**
4. Copy the **Signing secret** (`whsec_...`)

Then in Vercel → Settings → Environment Variables:
- Add `STRIPE_WEBHOOK_SECRET` = the signing secret you just copied
- Deployments → **Redeploy**

- [ ] **Step 8: Smoke test**

Open your Vercel URL in an **incognito** browser window:

- [ ] Landing page loads — hero, features, pricing sections visible
- [ ] "Sign in with Google" → Google OAuth popup → completes successfully
- [ ] Lands on `/app/dashboard` after sign in
- [ ] Dashboard shows trial countdown or empty state
- [ ] "+ New Session" → setup form loads
- [ ] Submit role + level → questions generated (~5s for Groq)
- [ ] Answer a question → submit → feedback with animated score appears
- [ ] Score counter animates 0 → actual score
- [ ] Correct/missing/tip cards reveal in sequence
- [ ] "Next Question" works
- [ ] After Q10 → redirects to `/app/session/[id]/report`
- [ ] Report shows overall score + category cards + Q&A accordion
- [ ] "Back to Dashboard" → dashboard shows completed session
- [ ] `/app/billing` → shows trial countdown + PKR 999 pricing card
- [ ] "Subscribe" → Stripe Checkout opens (test mode)
  - Test card: `4242 4242 4242 4242`, any future expiry, any CVC
  - Complete → lands on `/app/billing/success`
- [ ] Sign out → returns to landing page
- [ ] `/opengraph-image` → renders the branded blue OG card
- [ ] `/robots.txt` → shows `Disallow: /app/`
- [ ] `/sitemap.xml` → shows one URL entry (landing page)
