import SignInButton from '@/components/auth/sign-in-button'

export default function LandingNav() {
  return (
    <nav className="bg-[#1E40AF] text-white px-6 py-3 flex items-center justify-between">
      <span className="font-bold text-lg">CareerCoach PK</span>
      <div className="flex items-center gap-6 text-sm">
        <span className="opacity-60 cursor-not-allowed select-none">Features</span>
        <span className="opacity-60 cursor-not-allowed select-none">Pricing</span>
      </div>
      <SignInButton variant="nav" />
    </nav>
  )
}
