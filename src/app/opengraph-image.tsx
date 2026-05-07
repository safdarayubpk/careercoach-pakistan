import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CareerCoach Pakistan — AI Interview Prep'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
  let interBoldData: ArrayBuffer | null = null

  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap',
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)' } }
    ).then((res) => res.text())

    const ttfUrl = css.match(/src: url\((.+?)\) format\('truetype'\)/)?.[1]
    if (ttfUrl) {
      interBoldData = await fetch(ttfUrl).then((res) => res.arrayBuffer())
    }
  } catch {
    // Font fetch failed — render without custom font (graceful degradation)
  }

  const fonts: { name: string; data: ArrayBuffer; style: 'normal'; weight: 700 }[] = interBoldData
    ? [{ name: 'Inter', data: interBoldData, style: 'normal', weight: 700 as const }]
    : []

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
            fontFamily: 'Inter',
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
            fontFamily: 'Inter',
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
            fontFamily: 'Inter',
          }}
        >
          PKR 999/month
        </div>
      </div>
    ),
    { ...size, fonts }
  )
}
