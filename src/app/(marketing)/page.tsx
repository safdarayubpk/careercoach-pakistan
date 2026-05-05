import SignInButton from '@/components/auth/sign-in-button'

export default function LandingPage() {
  return (
    <main className="flex-1 flex items-center">
      <div className="max-w-5xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left column — pitch + CTA */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
              Land Your Dream Job
              <br />
              <span className="text-[#1E40AF]">with AI-Powered Prep</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Paste a job description → get tailored interview questions +
              instant AI feedback. Built for Pakistan&apos;s job market.
            </p>
            <SignInButton variant="hero" />
            <p className="mt-3 text-sm text-gray-400">
              7 days free &middot; No credit card needed
            </p>
          </div>

          {/* Right column — static product preview */}
          <div className="bg-[#1E40AF] rounded-xl p-6 text-white">
            <p className="text-sm font-semibold text-blue-200 mb-3">
              Mock Interview Preview
            </p>
            <div className="bg-white/10 rounded-lg p-4 mb-3">
              <p className="text-sm">
                &ldquo;Tell me about your experience with React and how you&apos;ve
                used it in a production environment.&rdquo;
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-blue-200 font-medium mb-1">
                AI Feedback
              </p>
              <p className="text-sm text-white">Score: 8/10 &middot; Strong answer</p>
              <p className="text-xs text-blue-200 mt-1">
                Clear structure, relevant examples. Add more on performance
                optimisation.
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
