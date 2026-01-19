import type { Metadata, Viewport } from 'next'
import { Web3Provider } from '@/providers/Web3Provider'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title: 'BLOC STEP ARCADE',
  description: 'Retro arcade gaming on Base blockchain',
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0f',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-arcade-black grid-bg">
        <Web3Provider>
          <Header />
          <main className="flex-1 pt-24 md:pt-20">
            {children}
          </main>
          <Footer />
        </Web3Provider>
      </body>
    </html>
  )
}
