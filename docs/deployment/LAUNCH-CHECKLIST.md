# Launch Checklist — CareerCoach Pakistan

Use this file to track all steps needed to go from Vercel preview → production with a real domain and live payments.

**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## 1. Domain — careercoach.pk

- [ ] Register `careercoach.pk` from a Pakistani registrar
  - PKNIC (pknic.net.pk) — official `.pk` registry, ~PKR 2,500/yr, requires CNIC/NTN
  - Entrypoint.pk — easier UI
  - Namecheap — supports `.pk`, pays in USD
- [ ] Add `careercoach.pk` in Vercel → Settings → Domains
- [ ] Add `www.careercoach.pk` in Vercel (auto-redirects www → apex)
- [ ] Add DNS records at your registrar:

  | Type | Name | Value |
  |------|------|-------|
  | `A` | `@` | `76.76.21.21` |
  | `CNAME` | `www` | `cname.vercel-dns.com` |

- [ ] Wait for DNS propagation (10 min – 48h)
- [ ] Confirm SSL certificate issued by Vercel (automatic once DNS resolves)
- [ ] Verify `https://careercoach.pk` loads correctly

---

## 2. Supabase — Update Redirect URLs

Do this once the domain is live.

- [ ] Go to Supabase → Authentication → URL Configuration
- [ ] Set **Site URL**: `https://careercoach.pk`
- [ ] Add to **Redirect URLs**: `https://careercoach.pk/auth/callback`
- [ ] Test Google OAuth login on the live domain

---

## 3. Stripe — Activate Account

- [ ] Go to dashboard.stripe.com → click "Activate account"
- [ ] Fill in business details:
  - Business type: Individual or Company
  - Country: Pakistan
  - Website: `https://careercoach.pk`
- [ ] Add Pakistani bank account under Settings → Bank accounts (for PKR payouts)
- [ ] Wait for account approval (usually instant to 24h)

---

## 4. Stripe — Create Live Price

Switch the Stripe dashboard toggle from **Test → Live** before doing this.

- [ ] Go to Products → Add product
  - Name: `CareerCoach Pakistan Pro`
  - Pricing: `PKR 999` / month / recurring
- [ ] Save and copy the **Price ID** (`price_live_...`)

---

## 5. Stripe — Get Live API Keys

In Stripe dashboard (Live mode) → Developers → API keys:

- [ ] Copy **Publishable key** (`pk_live_...`)
- [ ] Copy **Secret key** (`sk_live_...`)

---

## 6. Stripe — Create Live Webhook

- [ ] Go to Developers → Webhooks → Add endpoint
- [ ] Endpoint URL: `https://careercoach.pk/api/webhooks/stripe`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Save and copy **Signing secret** (`whsec_live_...`)

---

## 7. Vercel — Update Environment Variables

In Vercel → Settings → Environment Variables, update these for **Production**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://careercoach.pk` |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` |
| `NEXT_PUBLIC_STRIPE_PRICE_ID` | `price_live_...` |

- [ ] All 5 variables updated
- [ ] Trigger a redeploy: Vercel → Deployments → Redeploy latest

---

## 8. Smoke Test

- [ ] Visit `https://careercoach.pk` — landing page loads
- [ ] Google OAuth login works and redirects to `/app/dashboard`
- [ ] Start a mock interview session end-to-end
- [ ] Subscribe with a real card → check Stripe dashboard shows the payment
- [ ] Check Vercel → Functions logs → webhook shows `200 OK`
- [ ] Cancel the test subscription via billing portal to get a refund
- [ ] Trial expiry email cron: check Vercel → Cron Jobs tab is active

---

## Gotchas

| Issue | Fix |
|-------|-----|
| Webhook returns 400 | Wrong `STRIPE_WEBHOOK_SECRET` — must be from the live endpoint, not test |
| "No such price" error | You used a `price_test_...` ID — create a new one in live mode |
| Payments succeed but subscription not activated | Webhook not firing — check the endpoint URL is exact |
| Google OAuth broken after domain change | Supabase redirect URL not updated (Step 2) |
| DNS not resolving | Check A record is exactly `76.76.21.21`, wait up to 48h |
| Pakistan bank payout fails | Bank account not added in live mode (Step 3) |

---

## Recommended Order

```
1. Buy domain + point DNS
2. Update Supabase redirect URLs
3. Activate Stripe account
4. Create live price + get live keys
5. Create live webhook (using real domain URL)
6. Update Vercel env vars
7. Redeploy
8. Smoke test
```

> Always complete the domain step before setting up the Stripe live webhook,
> so the webhook URL uses your real domain from the start.
