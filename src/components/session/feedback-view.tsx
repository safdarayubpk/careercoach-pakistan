'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate, useReducedMotion } from 'framer-motion'

interface FeedbackData {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Props {
  feedback: FeedbackData | null
  unavailable: boolean
  isLastQuestion: boolean
  onNext: () => void
}

function scoreLabel(score: number): string {
  if (score >= 8) return 'Strong Answer'
  if (score >= 5) return 'Good Attempt'
  return 'Needs Work'
}

function AnimatedScore({ score }: { score: number }) {
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))

  useEffect(() => {
    if (prefersReducedMotion) {
      count.set(score)
      return
    }
    const controls = animate(count, score, { duration: 0.6, ease: 'easeOut' })
    return controls.stop
  }, [score, count, prefersReducedMotion])

  return <motion.span>{rounded}</motion.span>
}

export default function FeedbackView({
  feedback,
  unavailable,
  isLastQuestion,
  onNext,
}: Props) {
  const [modelOpen, setModelOpen] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  const nextLabel = isLastQuestion ? 'See Results →' : 'Next Question →'

  if (unavailable || !feedback) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Feedback unavailable. Your answer was saved.
        </div>
        <button
          onClick={onNext}
          className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          {nextLabel}
        </button>
      </div>
    )
  }

  const correctBase = 0.4
  const missingBase = correctBase + feedback.correct_points.length * 0.08 + 0.15
  const tipDelay = missingBase + feedback.missing_points.length * 0.08 + 0.1

  return (
    <div className="space-y-4">
      {/* Score card */}
      <div className="rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] p-6 text-center text-white">
        <div className="text-5xl font-bold leading-none">
          <AnimatedScore score={feedback.score} />
          <span className="text-2xl opacity-70">/10</span>
        </div>
        <div className="mt-2 text-sm opacity-90">{scoreLabel(feedback.score)}</div>
      </div>

      {/* Correct points */}
      {feedback.correct_points.length > 0 && (
        <motion.div
          className="rounded-lg border border-green-200 bg-green-50 p-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: correctBase }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
            ✓ What you got right
          </p>
          <ul className="space-y-1">
            {feedback.correct_points.map((point, i) => (
              <motion.li
                key={i}
                className="text-sm text-green-800"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: correctBase + i * 0.08,
                }}
              >
                • {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Missing points */}
      {feedback.missing_points.length > 0 && (
        <motion.div
          className="rounded-lg border border-red-200 bg-red-50 p-4"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: missingBase }}
        >
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
            ✗ What was missing
          </p>
          <ul className="space-y-1">
            {feedback.missing_points.map((point, i) => (
              <motion.li
                key={i}
                className="text-sm text-red-800"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  ease: 'easeOut',
                  delay: missingBase + i * 0.08,
                }}
              >
                • {point}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Improve tip */}
      <motion.div
        className="rounded-lg border border-blue-200 bg-blue-50 p-4"
        initial={prefersReducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: tipDelay }}
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-700">
          💡 Improve
        </p>
        <p className="text-sm text-blue-800">{feedback.improve_tip}</p>
      </motion.div>

      {/* Model answer toggle */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <button
          onClick={() => setModelOpen(!modelOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <span>▶ See model answer</span>
          <span className="text-gray-400">{modelOpen ? '▲' : '▼'}</span>
        </button>
        {modelOpen && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3 text-sm leading-relaxed text-gray-700">
            {feedback.model_answer}
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full rounded-md bg-[#1E40AF] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        {nextLabel}
      </button>
    </div>
  )
}
