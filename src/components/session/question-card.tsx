const TIPS: Record<string, string> = {
  Technical: 'Be specific about tools and tradeoffs. Mention real examples from your work.',
  Behavioral: 'Use STAR: Situation, Task, Action, Result.',
  'System Design': 'Start with requirements and scale. Then components, then tradeoffs.',
  Communication: 'One clear point, one concrete example. Keep it under 2 minutes.',
}

interface Question {
  id: string
  text: string
  category: string
  order_index: number
}

interface Props {
  question: Question
}

export default function QuestionCard({ question }: Props) {
  const tip = TIPS[question.category] ?? 'Take your time and think before answering.'

  return (
    <div>
      <div className="rounded-r-lg border-l-4 border-[#1E40AF] bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {question.category}
        </p>
        <p className="text-base leading-relaxed text-gray-900">
          &ldquo;{question.text}&rdquo;
        </p>
      </div>
      <div className="mt-3 rounded-lg border border-orange-200 bg-[#FFF7ED] px-4 py-3">
        <p className="mb-1 text-xs font-semibold text-orange-700">💡 TIP</p>
        <p className="text-sm text-orange-800">{tip}</p>
      </div>
    </div>
  )
}
