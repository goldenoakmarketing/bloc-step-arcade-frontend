import type { Metadata, Viewport } from 'next'
import { Web3Provider } from '@/providers/Web3Provider'
import { FarcasterProvider } from '@/providers/FarcasterProvider'
import { Header } from '@/components/layout/Header'
import { OnChatWidget } from '@/components/chat/OnChatWidget'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bloc Step Arcade',
  description: 'Play games on Base blockchain',
  other: {
    'base:app_id': '697650c088e3bac59cf3d85c',
  },
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
        <FarcasterProvider>
          <Web3Provider>
            <main className="pb-20">
              {children}
            </main>
            <Header />
            <OnChatWidget />
          </Web3Provider>
        </FarcasterProvider>
      </body>
    </html>
  )
}
