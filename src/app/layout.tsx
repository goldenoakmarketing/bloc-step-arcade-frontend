import type { Metadata, Viewport } from 'next'
import { Web3Provider } from '@/providers/Web3Provider'
import { Header } from '@/components/layout/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bloc Step Arcade',
  description: 'Play games on Base blockchain',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#09090b',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <Header />
          <main className="pt-16">
            {children}
          </main>
        </Web3Provider>
      </body>
    </html>
  )
}
