'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// import { ConnectButton } from '@/components/wallet/ConnectButton'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#09090b]/90 backdrop-blur border-b border-[#27272a]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Bloc Step
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white transition'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

{/* <ConnectButton /> - disabled for development */}
      </div>

      {/* Mobile nav */}
      <nav className="md:hidden flex justify-center gap-1 px-2 pb-3 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href
                ? 'tab tab-active text-xs px-3'
                : 'tab text-xs px-3'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
