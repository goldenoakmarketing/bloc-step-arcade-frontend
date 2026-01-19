'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { useAccount } from 'wagmi'

const navItems = [
  { href: '/', label: 'ARCADE' },
  { href: '/play', label: 'PLAY' },
  { href: '/leaderboard', label: 'HI-SCORES' },
  { href: '/profile', label: 'PROFILE' },
]

export function Header() {
  const pathname = usePathname()
  const { isConnected } = useAccount()

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-arcade-black via-arcade-black/95 to-transparent" />

      <div className="relative px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-2xl"
            >
              🕹️
            </motion.div>
            <span className="font-pixel text-xs sm:text-sm neon-text-pink hidden sm:block">
              BLOC STEP
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'px-4 py-2 font-pixel text-xs transition-all duration-200',
                    isActive
                      ? 'text-neon-cyan bg-arcade-purple/30'
                      : 'text-gray-400 hover:text-white hover:bg-arcade-dark'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="h-0.5 bg-neon-cyan mt-1"
                      style={{ boxShadow: '0 0 10px #00ffff' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Wallet */}
          <ConnectButton />
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex justify-center gap-1 mt-3 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'px-3 py-1.5 font-pixel text-[10px] whitespace-nowrap transition-all',
                  isActive
                    ? 'text-neon-cyan bg-arcade-purple/30 border border-neon-cyan'
                    : 'text-gray-500 border border-transparent'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
