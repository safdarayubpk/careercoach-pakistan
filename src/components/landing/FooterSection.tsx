export default function FooterSection() {
  return (
    <footer className="bg-[#111] px-8 py-6">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <span className="text-[13px] text-white/50">
          © 2026 CareerCoach Pakistan. All rights reserved.
        </span>
        <div className="flex gap-5">
          <a
            href="/privacy"
            className="text-[12px] text-white/40 no-underline transition-colors hover:text-white/60"
          >
            Privacy Policy
          </a>
          <a
            href="/terms"
            className="text-[12px] text-white/40 no-underline transition-colors hover:text-white/60"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  )
}
