'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CRTScreen } from '@/components/ui/CRTScreen'
import { PixelBorder } from '@/components/ui/PixelBorder'
import { clsx } from 'clsx'

type LeaderboardType = 'yeet' | 'staking' | 'time'

interface LeaderboardEntry {
  rank: number
  address: string
  username?: string
  score: string
  isCurrentUser?: boolean
}

// Mock data - replace with API calls
const mockLeaderboards: Record<LeaderboardType, LeaderboardEntry[]> = {
  yeet: [
    { rank: 1, address: '0x1234...5678', username: 'yeetmaster', score: '1,000,000' },
    { rank: 2, address: '0xabcd...efgh', username: 'blazer420', score: '750,000' },
    { rank: 3, address: '0x9876...5432', username: 'cryptokid', score: '500,000' },
    { rank: 4, address: '0xdead...beef', score: '250,000' },
    { rank: 5, address: '0xcafe...babe', username: 'moonboy', score: '100,000' },
    { rank: 6, address: '0x1111...2222', score: '75,000' },
    { rank: 7, address: '0x3333...4444', score: '50,000' },
    { rank: 8, address: '0x5555...6666', username: 'stacker', score: '25,000' },
    { rank: 9, address: '0x7777...8888', score: '10,000' },
    { rank: 10, address: '0x9999...0000', score: '5,000' },
  ],
  staking: [
    { rank: 1, address: '0xabcd...efgh', username: 'whale', score: '5,000,000' },
    { rank: 2, address: '0x1234...5678', username: 'hodler', score: '2,500,000' },
    { rank: 3, address: '0x9876...5432', score: '1,000,000' },
    { rank: 4, address: '0xdead...beef', username: 'diamond', score: '500,000' },
    { rank: 5, address: '0xcafe...babe', score: '250,000' },
  ],
  time: [
    { rank: 1, address: '0x9876...5432', username: 'gamer1', score: '48:32:15' },
    { rank: 2, address: '0x1234...5678', score: '36:15:42' },
    { rank: 3, address: '0xabcd...efgh', username: 'nolife', score: '24:00:00' },
    { rank: 4, address: '0xdead...beef', score: '12:30:00' },
    { rank: 5, address: '0xcafe...babe', score: '6:45:30' },
  ],
}

const leaderboardTabs: { id: LeaderboardType; label: string; icon: string }[] = [
  { id: 'yeet', label: 'YEET', icon: '🚀' },
  { id: 'staking', label: 'STAKE', icon: '💰' },
  { id: 'time', label: 'TIME', icon: '⏱️' },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('yeet')
  const entries = mockLeaderboards[activeTab]

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

            {/* Empty state */}
            {entries.length === 0 && (
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
                  #42
                </p>
              </div>
              <div className="text-right">
                <p className="font-pixel text-[10px] text-gray-500">YOUR SCORE</p>
                <p className="font-pixel text-lg text-neon-green">
                  1,337
                </p>
              </div>
            </div>
          </PixelBorder>
        </motion.div>
      </div>
    </div>
  )
}
