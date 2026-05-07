import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CareerCoach Pakistan — AI Interview Prep'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1E40AF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 64,
            fontWeight: 700,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          CareerCoach Pakistan
        </div>
        <div
          style={{
            color: 'rgba(255,255,255,0.85)',
            fontSize: 32,
            textAlign: 'center',
            marginBottom: 40,
          }}
        >
          AI Interview Prep — Tailored to Pakistani Job Seekers
        </div>
        <div
          style={{
            background: 'white',
            color: '#1E40AF',
            fontSize: 28,
            fontWeight: 700,
            padding: '16px 40px',
            borderRadius: 12,
          }}
        >
          PKR 999/month
        </div>
      </div>
    ),
    { ...size }
  )
}
