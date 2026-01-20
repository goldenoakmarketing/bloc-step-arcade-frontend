'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@/components/wallet/ConnectButton'

export default function HomePage() {
  const { isConnected } = useAccount()

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-gradient">Bloc Step</span> Arcade
          </h1>
          <p className="text-muted">
            Play games, earn rewards, climb the leaderboard
          </p>
        </div>

        {/* Main Card */}
        <div className="card mb-8">
          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-lg mb-6">Connect your wallet to start playing</p>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-4">
              <Link href="/play">
                <button className="btn btn-primary btn-lg btn-full">
                  Start Playing
                </button>
              </Link>
              <Link href="/leaderboard">
                <button className="btn btn-secondary btn-full">
                  View Leaderboard
                </button>
              </Link>
              <Link href="/profile">
                <button className="btn btn-secondary btn-full">
                  My Profile
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <div className="text-2xl mb-2">⏱️</div>
            <div className="stat-label">Buy Time</div>
            <p className="text-xs text-muted mt-1">Use $BLOC for playtime</p>
          </div>
          <div className="stat-card">
            <div className="text-2xl mb-2">🚀</div>
            <div className="stat-label">Yeet</div>
            <p className="text-xs text-muted mt-1">Burn for leaderboard</p>
          </div>
          <div className="stat-card">
            <div className="text-2xl mb-2">💰</div>
            <div className="stat-label">Stake</div>
            <p className="text-xs text-muted mt-1">Earn rewards</p>
          </div>
        </div>
      </div>
    </div>
  )
}
