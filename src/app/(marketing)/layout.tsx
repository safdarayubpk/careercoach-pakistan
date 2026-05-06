import LandingNav from '@/components/layout/LandingNav'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LandingNav />
      {children}
    </>
  )
}
