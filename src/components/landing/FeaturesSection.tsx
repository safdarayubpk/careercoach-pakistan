'use client'

import { motion, useReducedMotion } from 'framer-motion'

const FEATURES = [
  {
    icon: '🎯',
    title: 'JD-Tailored Questions',
    description:
      'Paste any job description and get 10 questions tailored to that role, level, and tech stack.',
  },
  {
    icon: '⚡',
    title: 'Instant AI Feedback',
    description:
      'Powered by Groq — score, what you got right, what you missed, and a model answer in seconds.',
  },
  {
    icon: '🎤',
    title: 'Urdu Voice Input',
    description:
      "Answer in Urdu using your microphone. The only interview coach built for Pakistan's bilingual professionals.",
  },
  {
    icon: '📊',
    title: 'Progress Dashboard',
    description:
      'Track scores across sessions. See improvement over time in Technical, Behavioral, and System Design.',
  },
  {
    icon: '🏷️',
    title: 'PKR 999/month',
    description:
      '7x cheaper than Final Round AI. No dollar conversion. Local pricing for local professionals.',
  },
  {
    icon: '🔄',
    title: 'Unlimited Sessions',
    description:
      'Practice as many times as you want. New questions every session based on the same or different JD.',
  },
]

export default function FeaturesSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="features" className="bg-white px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        <div className="mb-9 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
            Features
          </p>
          <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
            Everything you need to land the job
          </h2>
          <p className="text-sm text-gray-500">
            Designed specifically for Pakistan&apos;s job market
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="rounded-xl border border-gray-200 p-5"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 16 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true },
                    transition: { duration: 0.4, delay: index * 0.05 },
                  })}
            >
              <div className="mb-2.5 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mb-1.5 text-sm font-bold text-gray-900">{feature.title}</h3>
              <p className="text-[13px] text-gray-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
