import HeroSection from '@/components/landing/HeroSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import PricingSection from '@/components/landing/PricingSection'
import FooterSection from '@/components/landing/FooterSection'

export default function LandingPage() {
  return (
    <>
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>
      <FooterSection />
    </>
  )
}
