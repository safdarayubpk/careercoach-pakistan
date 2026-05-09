import SignInButton from '@/components/auth/sign-in-button'

export default function LandingNav() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-[#1E40AF] px-6 py-3">
      <a href="/" className="py-2 text-lg font-bold text-white no-underline">
        CareerCoach PK
      </a>
      <div className="hidden items-center gap-6 text-sm md:flex">
        <a
          href="/#features"
          className="text-white/[85%] transition-colors hover:text-white no-underline"
        >
          Features
        </a>
        <a
          href="/#pricing"
          className="text-white/[85%] transition-colors hover:text-white no-underline"
        >
          Pricing
        </a>
      </div>
      <SignInButton variant="nav" />
    </nav>
  )
}
