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
  dashboardUrl: string
}

export default function WelcomeEmail({ firstName, dashboardUrl }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your 7-day free trial has started — let&apos;s get you interview-ready</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logo}>CareerCoach Pakistan</Text>
          </Section>

          {/* Body */}
          <Section style={content}>
            <Text style={greeting}>Hi {firstName}, welcome aboard!</Text>

            <Text style={paragraph}>
              Your <strong>7-day free trial has started.</strong> No credit card needed —
              just start practising.
            </Text>

            <Text style={paragraph}>Here&apos;s how to get the most out of CareerCoach:</Text>

            <Text style={step}><strong>1.</strong> Paste a job description (optional but recommended)</Text>
            <Text style={step}><strong>2.</strong> Answer 10 AI-generated interview questions</Text>
            <Text style={step}><strong>3.</strong> Get instant feedback, score, and tips on every answer</Text>

            <Section style={ctaSection}>
              <Button href={dashboardUrl} style={button}>
                Start Your First Interview →
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={valueHeading}>Why CareerCoach Pakistan?</Text>
            <Text style={valueItem}>✓ Questions tailored to your JD and role</Text>
            <Text style={valueItem}>✓ Urdu voice input — answer in Urdu or English</Text>
            <Text style={valueItem}>✓ AI feedback from a senior interviewer perspective</Text>
            <Text style={valueItem}>
              ✓ <strong>PKR 999/month</strong> — vs PKR 7,000/month for global tools
            </Text>

            <Hr style={divider} />

            <Text style={footer}>
              Questions? Just reply to this email — we read every one.
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
  fontSize: '18px',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 16px',
}

const paragraph: React.CSSProperties = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 16px',
}

const step: React.CSSProperties = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 8px',
  paddingLeft: '4px',
}

const ctaSection: React.CSSProperties = {
  textAlign: 'center',
  margin: '28px 0',
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

const valueHeading: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 12px',
}

const valueItem: React.CSSProperties = {
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
