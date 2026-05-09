import { Metadata } from 'next'
import FooterSection from '@/components/landing/FooterSection'

export const metadata: Metadata = {
  title: 'Privacy Policy — CareerCoach Pakistan',
  description: 'How CareerCoach Pakistan collects, uses, and protects your personal information.',
}

export default function PrivacyPage() {
  return (
    <>
      <main className="min-h-screen bg-white px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mb-10 text-sm text-gray-500">Last updated: 9 May 2026</p>

          <Section title="1. Introduction">
            <p>
              CareerCoach Pakistan (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates the website and
              application at careercoach.pk. This Privacy Policy explains what personal information we collect,
              how we use it, and what rights you have over it. By using our service you agree to the practices
              described here.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <p className="mb-3">We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account information</strong> — your name and email address, obtained via Google OAuth
                when you sign in. We never see your Google password.
              </li>
              <li>
                <strong>Profile data</strong> — your Google profile photo URL (optional, used to display your
                avatar in the app).
              </li>
              <li>
                <strong>Interview content</strong> — job descriptions you paste, your text and voice answers,
                and the AI-generated questions and feedback produced during your sessions.
              </li>
              <li>
                <strong>Billing information</strong> — if you subscribe, Stripe collects and stores your
                payment details. We receive only a customer ID and subscription status — we never see your
                card number.
              </li>
              <li>
                <strong>Usage data</strong> — pages visited, features used, session counts, and performance
                metrics (Core Web Vitals), collected via PostHog and Vercel Analytics.
              </li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account.</li>
              <li>To generate tailored interview questions and AI feedback using your session content.</li>
              <li>To enforce your 7-day free trial and paid subscription access.</li>
              <li>To send transactional emails (welcome email, trial-expiry reminder) via Resend.</li>
              <li>To analyse product usage in aggregate so we can improve the service.</li>
              <li>To comply with legal obligations.</li>
            </ul>
            <p className="mt-3">
              We do not sell, rent, or share your personal information with third parties for their own
              marketing purposes.
            </p>
          </Section>

          <Section title="4. Data Storage and Security">
            <p>
              Your data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure in the US region.
              All data in transit is encrypted with TLS 1.2+. Row-Level Security (RLS) is enforced at the
              database level so that each user can access only their own records.
            </p>
            <p className="mt-3">
              We retain your account data for as long as your account is active. Interview sessions and
              answers are retained indefinitely unless you request deletion (see Section 7).
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p className="mb-3">We use the following third-party services. Each has its own privacy policy.</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 pr-4 text-left font-semibold text-gray-700">Service</th>
                    <th className="py-2 pr-4 text-left font-semibold text-gray-700">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr><td className="py-2 pr-4 text-gray-800">Google OAuth</td><td className="py-2 text-gray-600">Authentication</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">Supabase</td><td className="py-2 text-gray-600">Database and auth session storage</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">Groq / LLaMA</td><td className="py-2 text-gray-600">AI question generation and feedback</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">Stripe</td><td className="py-2 text-gray-600">Payment processing</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">Resend</td><td className="py-2 text-gray-600">Transactional email delivery</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">PostHog</td><td className="py-2 text-gray-600">Product analytics</td></tr>
                  <tr><td className="py-2 pr-4 text-gray-800">Vercel</td><td className="py-2 text-gray-600">Hosting and performance analytics</td></tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="6. Cookies and Tracking">
            <p>
              We use cookies to maintain your login session (set by Supabase). We also use PostHog, which
              sets a first-party analytics cookie to distinguish returning visitors. We do not use advertising
              cookies or cross-site tracking.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
              <li><strong>Correction</strong> — ask us to correct inaccurate data.</li>
              <li><strong>Deletion</strong> — request that we delete your account and all associated data.</li>
              <li><strong>Portability</strong> — request your session and answer data in JSON format.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at{' '}
              <a href="mailto:safdarayub@gmail.com" className="text-[#1E40AF] underline">
                safdarayub@gmail.com
              </a>
              . We will respond within 30 days.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              Our service is intended for users aged 16 and above. We do not knowingly collect personal
              information from children under 16. If you believe a child has provided us with their data,
              please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this policy from time to time. When we do, we will update the &quot;Last
              updated&quot; date at the top of this page. Continued use of the service after changes
              constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about this policy? Email us at{' '}
              <a href="mailto:safdarayub@gmail.com" className="text-[#1E40AF] underline">
                safdarayub@gmail.com
              </a>
              .
            </p>
          </Section>
        </div>
      </main>
      <FooterSection />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">{title}</h2>
      <div className="space-y-0 text-[15px] leading-relaxed text-gray-600">{children}</div>
    </section>
  )
}
