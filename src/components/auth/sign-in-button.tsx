'use client'

import { createClient } from '@/lib/supabase/client'

interface SignInButtonProps {
  variant: 'hero' | 'nav'
}

export default function SignInButton({ variant }: SignInButtonProps) {
  const supabase = createClient()

  async function handleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    })
  }

  if (variant === 'nav') {
    return (
      <button
        onClick={handleSignIn}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8f8f8')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#ffffff')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#ffffff',
          border: '1px solid #dadce0',
          borderRadius: '4px',
          padding: '10px 16px',
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#3c4043',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        <GoogleG />
        Sign in with Google
      </button>
    )
  }

  // variant === 'hero' — large blue marketing CTA
  return (
    <button
      onClick={handleSignIn}
      className="w-full rounded-[10px] bg-[#1E40AF] px-7 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-blue-900"
    >
      Start Free Trial — 7 Days Free
    </button>
  )
}

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.805.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.165 6.656 3.58 9 3.58Z"
      />
    </svg>
  )
}
