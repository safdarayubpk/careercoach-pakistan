import SetupForm from '@/components/session/setup-form'

export default function SetupPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">New Interview Session</h1>
      <p className="text-gray-500 mb-8">
        Configure your session and we&apos;ll generate tailored questions.
      </p>
      <SetupForm />
    </div>
  )
}
