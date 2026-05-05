'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import QuestionCard from './question-card'
import AnswerForm from './answer-form'
import FeedbackView from './feedback-view'

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Session {
  id: string
  role: string
  level: string
}

interface FeedbackData {
  score: number
  correct_points: string[]
  missing_points: string[]
  improve_tip: string
  model_answer: string
}

interface Props {
  question: Question
  session: Session
  questionNumber: number
}

export default function SessionPlayer({ question, session, questionNumber }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [mode, setMode] = useState<'question' | 'feedback'>('question')
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [feedbackUnavailable, setFeedbackUnavailable] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmitAnswer(answerText: string) {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          sessionId: session.id,
          answerText,
        }),
      })

      const data = await res.json()

      if (data.error === 'feedback_unavailable') {
        setFeedbackUnavailable(true)
      } else if (res.ok) {
        setFeedback(data as FeedbackData)
      } else {
        setFeedbackUnavailable(true)
      }
      // Answer reached the server — transition to feedback view
      setMode('feedback')
    } catch {
      // Network error — answer was not saved, let user retry
      setSubmitError('Connection error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNext() {
    setMode('question')
    setFeedback(null)
    setFeedbackUnavailable(false)
    setSubmitError(null)
    router.refresh()
  }

  if (mode === 'feedback') {
    return (
      <FeedbackView
        feedback={feedback}
        unavailable={feedbackUnavailable}
        isLastQuestion={questionNumber === 10}
        onNext={handleNext}
      />
    )
  }

  return (
    <>
      <QuestionCard question={question} />
      <div className="mt-4">
        <AnswerForm onSubmit={handleSubmitAnswer} loading={submitting} />
        {submitError && (
          <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </p>
        )}
      </div>
    </>
  )
}
