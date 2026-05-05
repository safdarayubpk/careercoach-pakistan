import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SessionPlayer from '@/components/session/session-player'

interface Props {
  params: Promise<{ id: string }>
}

export default async function QuestionPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/app/dashboard')

  // Fetch session — verify ownership
  const { data: session } = await supabase
    .from('sessions')
    .select('id, role, level, interview_type, jd_text')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/app/dashboard')

  // Fetch all questions ordered by index
  const { data: questions } = await supabase
    .from('questions')
    .select('id, text, category, order_index')
    .eq('session_id', id)
    .order('order_index')

  const questionList = questions ?? []

  // Fetch answers for this session to determine progress
  const { data: answers } = await supabase
    .from('answers')
    .select('id')
    .eq('user_id', user.id)
    .in(
      'question_id',
      questionList.map(q => q.id)
    )

  const answeredCount = answers?.length ?? 0

  // All done — go to report
  if (answeredCount >= 10) {
    redirect(`/app/session/${id}/report`)
  }

  const currentQuestion = questionList.find(q => q.order_index === answeredCount)
  if (!currentQuestion) redirect('/app/dashboard')

  const progressPercent = Math.round(((answeredCount + 1) / 10) * 100)

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
          <span>Question {answeredCount + 1} of 10</span>
          <span className="font-medium text-[#1E40AF]">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[#1E40AF] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* JD pill */}
      {session.jd_text && (
        <div className="mb-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          ✓ Tailored to your JD
        </div>
      )}

      <SessionPlayer
        question={currentQuestion}
        session={{ id: session.id, role: session.role, level: session.level }}
        questionNumber={answeredCount + 1}
      />
    </div>
  )
}
