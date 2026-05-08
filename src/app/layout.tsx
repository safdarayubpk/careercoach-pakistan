import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'CareerCoach Pakistan — AI Interview Prep',
  description:
    'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
  openGraph: {
    title: 'CareerCoach Pakistan — AI Interview Prep',
    description:
      'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
    url: '/',
    siteName: 'CareerCoach Pakistan',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'CareerCoach Pakistan' }],
    type: 'website',
    locale: 'en_PK',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CareerCoach Pakistan — AI Interview Prep',
    description:
      'AI-powered interview preparation for Pakistani job seekers. Paste a JD, get tailored questions, receive instant feedback. PKR 999/month.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
