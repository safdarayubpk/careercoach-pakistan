import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: Props) {
  await params // consume to avoid Next.js warning

  return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="mb-6 text-5xl">🎉</div>
      <h1 className="mb-3 text-2xl font-bold text-gray-900">Session Complete!</h1>
      <p className="mb-2 text-gray-500">You answered all 10 questions.</p>
      <p className="mb-8 text-sm text-gray-400">
        Your full report is being built in Phase 4.
      </p>
      <Link
        href="/app/dashboard"
        className="inline-block rounded-md bg-[#1E40AF] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        Back to Dashboard
      </Link>
    </div>
  )
}
