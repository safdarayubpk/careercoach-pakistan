import LandingNav from '@/components/layout/landing-nav'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  )
}
