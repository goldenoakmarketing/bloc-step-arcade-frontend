'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { CRTScreen } from '@/components/ui/CRTScreen'
import { ArcadeButton } from '@/components/ui/ArcadeButton'
import { PixelBorder } from '@/components/ui/PixelBorder'
import { NeonText } from '@/components/ui/NeonText'
import { ConnectButton } from '@/components/wallet/ConnectButton'

export default function ProfilePage() {
  const { isConnected, address } = useAccount()
  const [purchaseAmount, setPurchaseAmount] = useState(60)

  // Mock data - replace with real data
  const stats = {
    timeBalance: 300,
    stakedBalance: '10,000',
    totalYeeted: '50,000',
    gamesPlayed: 42,
    highScore: 999999,
    rank: 42,
  }

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <PixelBorder color="pink" className="p-8 text-center max-w-md">
          <span className="text-5xl">👤</span>
          <h2 className="font-pixel text-lg text-neon-pink mt-4">
            CONNECT WALLET
          </h2>
          <p className="font-arcade text-gray-400 mt-2 mb-6">
            View your arcade profile
          </p>
          <ConnectButton />
        </PixelBorder>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-block p-4 rounded-full bg-arcade-dark border-4 border-neon-pink mb-4"
               style={{ boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)' }}>
            <span className="text-5xl">🎮</span>
          </div>

          <h1 className="font-pixel text-sm text-white mb-2">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </h1>

          <p className="font-arcade text-gray-500">
            Player since Jan 2024
          </p>
        </motion.div>

        {/* Time Balance Card */}
        <CRTScreen className="p-6 mb-6">
          <div className="text-center">
            <p className="font-pixel text-xs text-gray-500 mb-2">
              ARCADE TIME BALANCE
            </p>
            <p className="font-pixel text-4xl text-neon-cyan neon-text-cyan">
              {formatTime(stats.timeBalance)}
            </p>

            {/* Purchase Time */}
            <div className="mt-6 pt-6 border-t border-arcade-purple/30">
              <p className="font-arcade text-sm text-gray-400 mb-4">
                Purchase more time with $BLOC
              </p>

              <div className="flex justify-center gap-2 mb-4">
                {[60, 300, 600].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPurchaseAmount(amount)}
                    className={`px-4 py-2 font-pixel text-xs border-2 transition-all
                      ${purchaseAmount === amount
                        ? 'border-neon-cyan bg-arcade-purple/30 text-neon-cyan'
                        : 'border-gray-700 text-gray-500 hover:border-gray-500'
                      }`}
                  >
                    {formatTime(amount)}
                  </button>
                ))}
              </div>

              <ArcadeButton variant="success" fullWidth>
                BUY {formatTime(purchaseAmount)} TIME
              </ArcadeButton>
            </div>
          </div>
        </CRTScreen>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <PixelBorder color="green" className="p-4 text-center">
            <p className="font-pixel text-[10px] text-gray-500">STAKED</p>
            <p className="font-pixel text-lg text-neon-green">{stats.stakedBalance}</p>
            <p className="font-arcade text-xs text-gray-600">$BLOC</p>
          </PixelBorder>

          <PixelBorder color="pink" className="p-4 text-center">
            <p className="font-pixel text-[10px] text-gray-500">YEETED</p>
            <p className="font-pixel text-lg text-neon-pink">{stats.totalYeeted}</p>
            <p className="font-arcade text-xs text-gray-600">$BLOC</p>
          </PixelBorder>

          <PixelBorder color="cyan" className="p-4 text-center">
            <p className="font-pixel text-[10px] text-gray-500">GAMES</p>
            <p className="font-pixel text-lg text-neon-cyan">{stats.gamesPlayed}</p>
            <p className="font-arcade text-xs text-gray-600">played</p>
          </PixelBorder>

          <PixelBorder color="yellow" className="p-4 text-center">
            <p className="font-pixel text-[10px] text-gray-500">HI-SCORE</p>
            <p className="font-pixel text-lg text-neon-yellow">{stats.highScore}</p>
            <p className="font-arcade text-xs text-gray-600">points</p>
          </PixelBorder>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <PixelBorder color="green" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-pixel text-sm text-neon-green">STAKE $BLOC</p>
                <p className="font-arcade text-xs text-gray-500">Earn rewards</p>
              </div>
              <ArcadeButton variant="success" size="sm">
                STAKE
              </ArcadeButton>
            </div>
          </PixelBorder>

          <PixelBorder color="pink" className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-pixel text-sm text-neon-pink">YEET $BLOC</p>
                <p className="font-arcade text-xs text-gray-500">Burn for glory</p>
              </div>
              <ArcadeButton variant="danger" size="sm">
                YEET
              </ArcadeButton>
            </div>
          </PixelBorder>
        </div>

        {/* Rank Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <div className="inline-block p-6 bg-arcade-dark rounded-lg border-2 border-arcade-purple">
            <p className="font-pixel text-xs text-gray-500">GLOBAL RANK</p>
            <p className="font-pixel text-4xl text-neon-yellow neon-text-yellow mt-2">
              #{stats.rank}
            </p>
            <p className="font-arcade text-sm text-gray-500 mt-2">
              Top 5%
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
