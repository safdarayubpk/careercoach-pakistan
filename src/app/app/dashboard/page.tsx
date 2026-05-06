import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { computeAverage, scoreLabel, scoreColor } from '@/lib/scores'

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const name: string = user?.user_metadata?.full_name || user?.email || 'there'

  // 1. Fetch all sessions newest-first
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const sessionList = sessions ?? []
  const sessionIds = sessionList.map(s => s.id)

  let sessionsWithScore: Array<{
    id: string
    role: string
    level: string
    interview_type: string
    created_at: string
    overallScore: number | null
  }> = []

  if (sessionIds.length > 0) {
    // 2. Fetch all questions for those sessions
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id, session_id')
      .in('session_id', sessionIds)

    const questionsBySession = new Map<string, string[]>()
    for (const q of allQuestions ?? []) {
      const list = questionsBySession.get(q.session_id) ?? []
      list.push(q.id)
      questionsBySession.set(q.session_id, list)
    }

    const allQuestionIds = (allQuestions ?? []).map(q => q.id)

    // 3. Fetch all answers for those questions — guard empty .in()
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('question_id, score')
      .eq('user_id', user!.id)
      .in('question_id', allQuestionIds.length > 0 ? allQuestionIds : ['00000000-0000-0000-0000-000000000000'])

    const scoreByQuestion = new Map<string, number | null>()
    for (const a of allAnswers ?? []) {
      scoreByQuestion.set(a.question_id, a.score)
    }

    sessionsWithScore = sessionList.map(s => {
      const qIds = questionsBySession.get(s.id) ?? []
      const scores = qIds.map(qId => scoreByQuestion.get(qId) ?? null)
      return { ...s, overallScore: computeAverage(scores) }
    })
  }

  // Stats
  const totalSessions = sessionsWithScore.length
  const avgScore = computeAverage(sessionsWithScore.map(s => s.overallScore))
  const validScores = sessionsWithScore.map(s => s.overallScore).filter((s): s is number => s !== null)
  const bestScore = validScores.length > 0 ? Math.max(...validScores) : null

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {name}</h1>
        <Link
          href="/app/session/setup"
          className="rounded-md bg-[#1E40AF] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          + New Session
        </Link>
      </div>

      {totalSessions === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-gray-200 bg-white px-8 py-16 text-center">
          <div className="mb-4 text-5xl">🎯</div>
          <h2 className="mb-2 text-lg font-bold text-gray-900">Ready for your first interview?</h2>
          <p className="mb-6 text-sm text-gray-500">
            Pick a role, answer 10 tailored questions, and get instant AI feedback.
          </p>
          <Link
            href="/app/session/setup"
            className="inline-block rounded-md bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
          >
            Start Your First Interview →
          </Link>
        </div>
      ) : (
        <>
          {/* 3 stat cards */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">{totalSessions}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Sessions</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">
                {avgScore !== null ? avgScore : '—'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Avg Score</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
              <p className="text-3xl font-bold text-[#1E40AF]">
                {bestScore !== null ? bestScore : '—'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Best Score</p>
            </div>
          </div>

          {/* Session list */}
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Recent Sessions
          </h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {sessionsWithScore.map((session, index) => {
              const score = session.overallScore
              const scoreClass = score !== null ? scoreColor(score) : 'text-gray-400'
              const isLast = index === sessionsWithScore.length - 1

              return (
                <Link
                  key={session.id}
                  href={`/app/session/${session.id}/report`}
                  className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-blue-50 ${
                    !isLast ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{session.role}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {session.level} · {session.interview_type} · {formatDate(session.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-base font-bold ${scoreClass}`}>
                        {score !== null ? `${score}/10` : '—'}
                      </p>
                      {score !== null && (
                        <p className={`text-xs ${scoreClass}`}>{scoreLabel(score)}</p>
                      )}
                    </div>
                    <span className="text-gray-300">›</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
