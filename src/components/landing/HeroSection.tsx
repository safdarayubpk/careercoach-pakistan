'use client'

import { motion, useReducedMotion } from 'framer-motion'
import SignInButton from '@/components/auth/sign-in-button'

export default function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  const fadeUp = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 },
      }

  const fadeUpDelayed = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, delay: 0.15 },
      }

  return (
    <section className="bg-[#f8fafc] px-6 py-16 md:py-24">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 md:grid-cols-2">
        {/* Left column — pitch */}
        <motion.div {...fadeUp}>
          <div className="mb-4 inline-block rounded-full bg-[#dbeafe] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#1E40AF]">
            Built for Pakistan 🇵🇰
          </div>
          <h1 className="mb-4 text-4xl font-extrabold leading-tight text-gray-900">
            Ace Your Next Interview
            <br />
            <span className="text-[#1E40AF]">for PKR 999/month</span>
          </h1>
          <p className="mb-2 text-[15px] text-gray-600">
            Paste a job description → get tailored questions + instant AI feedback. In English or Urdu.
          </p>
          <p className="mb-6 text-[13px] text-gray-400">
            Join 500+ Pakistani professionals already practising smarter.
          </p>
          <SignInButton variant="hero" />
          <p className="mt-2.5 text-center text-[12px] text-gray-400">
            No credit card needed · Cancel anytime
          </p>
        </motion.div>

        {/* Right column — product preview card */}
        <motion.div {...fadeUpDelayed} className="rounded-2xl bg-[#1E40AF] p-6 text-white">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-white/60">
            Live Preview
          </p>
          <div className="mb-2.5 rounded-xl bg-white/10 p-3.5 text-[13px]">
            &ldquo;Tell me about your experience with React in a production environment.&rdquo;
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <p className="mb-1 text-[11px] text-white/60">AI Feedback</p>
            <p className="text-[13px] font-bold">Score: 8/10 · Strong answer ✓</p>
            <p className="mt-1 text-[11px] text-white/70">
              Clear structure, good examples. Add more on performance optimisation.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
