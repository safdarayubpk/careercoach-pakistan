import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { computeAverage, scoreLabel, scoreColor } from '@/lib/scores'
import ReportAccordion from '@/components/session/report-accordion'
import { VALID_CATEGORIES, type Category } from '@/types/session'

interface Props {
  params: Promise<{ id: string }>
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/app/dashboard')

  // Fetch session — verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/app/dashboard')

  // Fetch questions ordered by index
  const { data: questionsData } = await supabase
    .from('questions')
    .select('id, text, category, order_index')
    .eq('session_id', id)
    .order('order_index')

  const questions = questionsData ?? []
  const questionIds = questions.map(q => q.id)

  // Fetch answers — guard against empty .in()
  const { data: answersData } = await supabase
    .from('answers')
    .select('question_id, answer_text, score, feedback_json')
    .eq('user_id', user.id)
    .in('question_id', questionIds.length > 0 ? questionIds : ['00000000-0000-0000-0000-000000000000'])

  const answers = answersData ?? []

  // Build map: questionId → answer
  const answerByQuestion = new Map(answers.map(a => [a.question_id, a]))

  // Join questions with answers
  const items = questions.map(q => ({
    question: q,
    answer: answerByQuestion.get(q.id) ?? null,
  }))

  const answeredCount = answers.length

  // Overall score
  const allScores = answers.map(a => a.score)
  const overallScore = computeAverage(allScores)

  // Per-category scores — only show categories that appear in this session
  const categoryScores = VALID_CATEGORIES.map(cat => {
    const catAnswers = items
      .filter(it => it.question.category === cat)
      .map(it => it.answer?.score ?? null)
    if (catAnswers.length === 0) return null // category not in this session
    return { category: cat, score: computeAverage(catAnswers) }
  }).filter((c): c is { category: Category; score: number | null } => c !== null)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            {session.role} · {session.level} · {session.interview_type} · {formatDate(session.created_at)}
          </p>
        </div>
        <Link
          href="/app/dashboard"
          className="shrink-0 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Overall score card */}
      <div className="mb-6 rounded-xl bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] p-6 text-center text-white">
        <div className="text-5xl font-bold leading-none">
          {overallScore !== null ? overallScore : '—'}
          {overallScore !== null && <span className="text-2xl opacity-60">/10</span>}
        </div>
        <div className="mt-2 text-sm opacity-90">
          {overallScore !== null ? scoreLabel(overallScore) : 'Score unavailable'}
        </div>
        <div className="mt-1 text-xs opacity-70">
          {answeredCount} of {questions.length} questions answered
        </div>
      </div>

      {/* Category cards */}
      {categoryScores.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3">
          {categoryScores.map((entry) => {
            const { category, score } = entry
            return (
            <div
              key={category}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {category}
              </p>
              <p className="text-3xl font-bold text-[#1E40AF]">
                {score !== null ? score : '—'}
              </p>
              {score !== null && (
                <p className={`mt-1 text-xs font-medium ${scoreColor(score)}`}>
                  {scoreLabel(score)}
                </p>
              )}
            </div>
            )
          })}
        </div>
      )}

      {/* Q&A Replay */}
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
        Question Breakdown
      </h2>
      <ReportAccordion items={items} />
    </div>
  )
}
