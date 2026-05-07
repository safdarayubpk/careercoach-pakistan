import AppNav from '@/components/layout/app-nav'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-[#1E40AF] focus:shadow-lg"
      >
        Skip to content
      </a>
      <AppNav />
      <main id="main-content" className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </>
  )
}
