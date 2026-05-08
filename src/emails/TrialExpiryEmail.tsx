import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface Props {
  firstName: string
  billingUrl: string
}

export default function TrialExpiryEmail({ firstName, billingUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your CareerCoach Pakistan free trial ends tomorrow</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>CareerCoach Pakistan</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={paragraph}>
              Your <strong>7-day free trial expires in 24 hours.</strong>
            </Text>

            <Text style={paragraph}>
              You&apos;ve been preparing for your next interview — don&apos;t lose access
              when you&apos;re just getting started.
            </Text>

            <Section style={ctaSection}>
              <Button href={billingUrl} style={button}>
                Subscribe Now — PKR 999/month
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={featuresHeading}>Why stay with CareerCoach?</Text>

            <Text style={featureItem}>✓ AI feedback on every answer</Text>
            <Text style={featureItem}>✓ Urdu voice support (بولیں)</Text>
            <Text style={featureItem}>✓ Questions tailored to your JD</Text>
            <Text style={featureItem}>
              ✓ <strong>PKR 999/month</strong> vs PKR 7,000/month for global tools
            </Text>

            <Hr style={divider} />

            <Text style={footer}>
              Questions? Just reply to this email.
              <br />— The CareerCoach Pakistan Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// --- Styles ---

const main: React.CSSProperties = {
  backgroundColor: '#f4f7fb',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container: React.CSSProperties = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const header: React.CSSProperties = {
  backgroundColor: '#1E40AF',
  borderRadius: '8px 8px 0 0',
  padding: '24px 32px',
}

const logo: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '20px',
  fontWeight: '700',
  margin: '0',
}

const content: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 8px 8px',
  padding: '32px',
}

const greeting: React.CSSProperties = {
  fontSize: '16px',
  color: '#111827',
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '24px 0',
}

const button: React.CSSProperties = {
  backgroundColor: '#1E40AF',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: '700',
  textDecoration: 'none',
  padding: '14px 28px',
  display: 'inline-block',
}

const divider: React.CSSProperties = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
}

const featuresHeading: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 12px',
}

const featureItem: React.CSSProperties = {
  fontSize: '14px',
  color: '#374151',
  margin: '0 0 8px',
}

const footer: React.CSSProperties = {
  fontSize: '13px',
  color: '#9ca3af',
  lineHeight: '1.6',
  margin: '0',
}
