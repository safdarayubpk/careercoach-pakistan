'use client'

import { motion, useReducedMotion } from 'framer-motion'
import SignInButton from '@/components/auth/sign-in-button'

interface PricingRow {
  feature: string
  us: string
  usClass?: string
  finalRound: string
  finalRoundStrike?: boolean
  huru: string
  huruStrike?: boolean
  rowClass?: string
}

const ROWS: PricingRow[] = [
  {
    feature: 'Monthly Price',
    us: 'PKR 999',
    usClass: 'text-[15px] font-extrabold text-[#1E40AF]',
    finalRound: 'PKR 7,000',
    finalRoundStrike: true,
    huru: 'PKR 5,300',
    huruStrike: true,
  },
  {
    feature: 'Urdu Language',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
    rowClass: 'bg-gray-50',
  },
  {
    feature: 'JD-Tailored Questions',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
  },
  {
    feature: 'Built for Pakistan',
    us: '✅',
    finalRound: '❌',
    huru: '❌',
    rowClass: 'bg-gray-50',
  },
  {
    feature: 'Free Trial',
    us: '7 days, no card',
    usClass: 'text-[13px] font-bold text-green-600',
    finalRound: 'Limited',
    huru: 'Limited',
  },
]

export default function PricingSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section id="pricing" className="bg-[#f8fafc] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-4xl">
        <div className="mb-9 text-center">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#1E40AF]">
            Pricing
          </p>
          <h2 className="mb-2 text-3xl font-extrabold text-gray-900">
            Built for Pakistan. Priced for Pakistan.
          </h2>
          <p className="text-sm text-gray-500">
            Why pay in dollars when you don&apos;t have to?
          </p>
        </div>

        <motion.div
          className="overflow-x-auto"
          {...(prefersReducedMotion
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                viewport: { once: true },
                transition: { duration: 0.5 },
              })}
        >
          <table className="w-full min-w-[540px] overflow-hidden rounded-2xl bg-white shadow-sm">
            <caption className="sr-only">
              Pricing comparison: CareerCoach PK vs competitors
            </caption>
            <thead>
              <tr className="bg-[#1E40AF] text-white">
                <th scope="col" className="px-4 py-4 text-left text-[13px] font-semibold">Feature</th>
                <th scope="col" className="px-4 py-4 text-center text-[13px] font-semibold">
                  CareerCoach PK ⭐
                </th>
                <th scope="col" className="px-4 py-4 text-center text-[13px] font-semibold opacity-70">
                  Final Round AI
                </th>
                <th scope="col" className="px-4 py-4 text-center text-[13px] font-semibold opacity-70">
                  Huru.ai
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className={row.rowClass ?? ''}>
                  <th scope="row" className="border-b border-gray-100 px-4 py-3.5 text-[13px] font-semibold text-gray-700">
                    {row.feature}
                  </th>
                  <td
                    className={`border-b border-gray-100 px-4 py-3.5 text-center ${row.usClass ?? 'text-base'}`}
                  >
                    {row.us}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center text-[13px] text-gray-400">
                    {row.finalRoundStrike ? <del>{row.finalRound}</del> : row.finalRound}
                  </td>
                  <td className="border-b border-gray-100 px-4 py-3.5 text-center text-[13px] text-gray-400">
                    {row.huruStrike ? <del>{row.huru}</del> : row.huru}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <div className="mt-7 text-center">
          <div className="mx-auto max-w-xs">
            <SignInButton variant="hero" />
          </div>
          <p className="mt-2 text-[12px] text-gray-400">No credit card · Cancel anytime</p>
        </div>
      </div>
    </section>
  )
}
