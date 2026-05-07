'use client'

import { useState } from 'react'
import { scoreColor } from '@/lib/scores'

interface FeedbackJson {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Answer {
  question_id: string
  answer_text: string
  score: number | null
  feedback_json: unknown
}

interface QuestionWithAnswer {
  question: Question
  answer: Answer | null
}

interface Props {
  items: QuestionWithAnswer[]
}

export default function ReportAccordion({ items }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setExpandedIndex(prev => (prev === index ? null : index))
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const { question, answer } = item
        const isExpanded = expandedIndex === index
        const score = answer?.score ?? null
        const scoreClass = score !== null ? scoreColor(score) : 'text-gray-400'

        return (
          <div
            key={question.id}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            {/* Collapsed header — always visible */}
            <button
              onClick={() => toggle(index)}
              aria-expanded={isExpanded}
              className="flex min-h-[44px] w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                  {question.category}
                </span>
                <span className="truncate text-sm text-gray-800">{question.text}</span>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <span className={`text-sm font-semibold ${scoreClass}`}>
                  {score !== null ? `${score}/10` : '—'}
                </span>
                <span className="text-gray-400 text-xs" aria-hidden="true">{isExpanded ? '▴' : '▾'}</span>
              </div>
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                {/* Your Answer */}
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Your Answer
                  </p>
                  {answer ? (
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {answer.answer_text}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Not answered</p>
                  )}
                </div>

                {/* Feedback unavailable */}
                {answer && answer.score === null && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Feedback unavailable for this question.
                  </div>
                )}

                {/* Feedback available */}
                {answer && answer.feedback_json !== null && (() => {
                  const fb = answer.feedback_json as FeedbackJson
                  return (
                    <>
                      {fb.correct_points.length > 0 && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-green-700">
                            ✓ What you got right
                          </p>
                          <ul className="space-y-1">
                            {fb.correct_points.map((pt, i) => (
                              <li key={i} className="text-sm text-green-800">• {pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {fb.missing_points.length > 0 && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-red-700">
                            ✗ What was missing
                          </p>
                          <ul className="space-y-1">
                            {fb.missing_points.map((pt, i) => (
                              <li key={i} className="text-sm text-red-800">• {pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                          💡 Improve
                        </p>
                        <p className="text-sm text-blue-800">{fb.improve_tip}</p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
