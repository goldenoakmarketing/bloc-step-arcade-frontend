'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { CRTScreen } from '@/components/ui/CRTScreen'
import { PixelBorder } from '@/components/ui/PixelBorder'
import { useLeaderboards, usePlayer } from '@/hooks/useApi'
import { clsx } from 'clsx'

type LeaderboardType = 'yeet' | 'staking' | 'time'

const leaderboardTabs: { id: LeaderboardType; label: string; icon: string }[] = [
  { id: 'yeet', label: 'YEET', icon: '🚀' },
  { id: 'staking', label: 'STAKE', icon: '💰' },
  { id: 'time', label: 'TIME', icon: '⏱️' },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('yeet')
  const { address } = useAccount()
  const { yeet, staking, time, isLoading } = useLeaderboards(10)
  const { data: player } = usePlayer()

  const leaderboardData = { yeet, staking, time }
  const entries = leaderboardData[activeTab].map((entry, index) => ({
    rank: entry.rank || index + 1,
    address: `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`,
    fullAddress: entry.walletAddress,
    username: entry.farcasterUsername,
    score: entry.scoreFormatted || entry.score,
    isCurrentUser: entry.walletAddress.toLowerCase() === address?.toLowerCase(),
  }))

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400'
      case 2:
        return 'text-gray-300'
      case 3:
        return 'text-amber-600'
      default:
        return 'text-gray-500'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '👑'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-pixel text-2xl md:text-3xl text-neon-yellow neon-text-yellow">
            HI-SCORES
          </h1>
          <p className="font-arcade text-gray-500 mt-2">
            Top players in the arcade
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {leaderboardTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 font-pixel text-xs transition-all',
                'border-2',
                activeTab === tab.id
                  ? 'border-neon-cyan bg-arcade-purple/30 text-neon-cyan'
                  : 'border-gray-700 text-gray-500 hover:border-gray-500'
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <CRTScreen className="p-4">
          <div className="cabinet-frame p-4">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-arcade-purple/30 mb-2">
              <span className="font-pixel text-[10px] text-gray-500 w-12">RANK</span>
              <span className="font-pixel text-[10px] text-gray-500 flex-1">PLAYER</span>
              <span className="font-pixel text-[10px] text-gray-500 text-right">SCORE</span>
            </div>

            {/* Entries */}
            <div className="space-y-1">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={clsx(
                    'flex items-center px-4 py-3 rounded',
                    entry.rank <= 3 && 'bg-arcade-purple/20',
                    entry.isCurrentUser && 'border border-neon-cyan'
                  )}
                >
                  {/* Rank */}
                  <div className={clsx('w-12 font-pixel text-sm', getRankColor(entry.rank))}>
                    {entry.rank <= 3 ? (
                      <span className="text-lg">{getRankIcon(entry.rank)}</span>
                    ) : (
                      <span>{getRankIcon(entry.rank)}</span>
                    )}
                  </div>

                  {/* Player */}
                  <div className="flex-1">
                    {entry.username ? (
                      <p className="font-arcade text-sm text-white">
                        @{entry.username}
                      </p>
                    ) : null}
                    <p className={clsx(
                      'font-arcade text-xs',
                      entry.username ? 'text-gray-600' : 'text-gray-400'
                    )}>
                      {entry.address}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={clsx(
                      'font-pixel text-sm',
                      entry.rank === 1 ? 'text-neon-yellow' : 'text-neon-green'
                    )}>
                      {entry.score}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="text-center py-12">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl inline-block"
                >
                  🎮
                </motion.span>
                <p className="font-arcade text-gray-500 mt-4">
                  Loading scores...
                </p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && entries.length === 0 && (
              <div className="text-center py-12">
                <span className="text-4xl">🏆</span>
                <p className="font-arcade text-gray-500 mt-4">
                  No scores yet. Be the first!
                </p>
              </div>
            )}
          </div>
        </CRTScreen>

        {/* Your Rank Card */}
        {address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <PixelBorder color="cyan" className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-pixel text-[10px] text-gray-500">YOUR RANK</p>
                  <p className="font-pixel text-lg text-neon-cyan">
                    {entries.find(e => e.isCurrentUser)?.rank
                      ? `#${entries.find(e => e.isCurrentUser)?.rank}`
                      : '--'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-pixel text-[10px] text-gray-500">
                    {activeTab === 'yeet' ? 'TOTAL YEETED' : activeTab === 'staking' ? 'STAKED' : 'TIME PLAYED'}
                  </p>
                  <p className="font-pixel text-lg text-neon-green">
                    {activeTab === 'yeet' && player?.stats.totalYeeted
                      ? Number(player.stats.totalYeeted).toLocaleString()
                      : activeTab === 'staking' && player?.cachedStakedBalance
                      ? Number(player.cachedStakedBalance).toLocaleString()
                      : activeTab === 'time' && player?.stats.totalTimeConsumed
                      ? player.stats.totalTimeConsumed
                      : '--'}
                  </p>
                </div>
              </div>
            </PixelBorder>
          </motion.div>
        )}
      </div>
    </div>
  )
}
