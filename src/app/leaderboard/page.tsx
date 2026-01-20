'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useLeaderboards, usePlayer } from '@/hooks/useApi'

type LeaderboardType = 'yeet' | 'staking' | 'time'

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'yeet', label: 'Yeet' },
  { id: 'staking', label: 'Staking' },
  { id: 'time', label: 'Time' },
]

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('yeet')
  const { address } = useAccount()
  const { yeet, staking, time, isLoading } = useLeaderboards(10)
  const { data: player } = usePlayer()

  const data = { yeet, staking, time }
  const entries = data[activeTab].map((entry, index) => ({
    rank: entry.rank || index + 1,
    address: `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`,
    username: entry.farcasterUsername,
    score: entry.scoreFormatted || entry.score,
    isCurrentUser: entry.walletAddress.toLowerCase() === address?.toLowerCase(),
  }))

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
          <p className="text-muted text-sm">Top players</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab tab-active' : 'tab'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="spinner mx-auto mb-3"></div>
              <p className="text-muted text-sm">Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-muted">No scores yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {entries.map((entry) => (
                <div
                  key={entry.address}
                  className={`leaderboard-row ${entry.isCurrentUser ? 'bg-[#8b5cf6]/10' : ''}`}
                >
                  <div className="w-12 text-lg">
                    {getRankDisplay(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.username && (
                      <div className="font-medium truncate">@{entry.username}</div>
                    )}
                    <div className="text-sm text-muted truncate">{entry.address}</div>
                  </div>
                  <div className="text-right font-bold">
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Stats */}
        {address && (
          <div className="card mt-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-xs text-muted">Your Rank</div>
                <div className="text-xl font-bold">
                  {entries.find(e => e.isCurrentUser)?.rank
                    ? `#${entries.find(e => e.isCurrentUser)?.rank}`
                    : '--'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">
                  {activeTab === 'yeet' ? 'Total Yeeted' : activeTab === 'staking' ? 'Staked' : 'Time Played'}
                </div>
                <div className="text-xl font-bold text-gradient">
                  {activeTab === 'yeet' && player?.stats.totalYeeted
                    ? Number(player.stats.totalYeeted).toLocaleString()
                    : activeTab === 'staking' && player?.cachedStakedBalance
                    ? Number(player.cachedStakedBalance).toLocaleString()
                    : activeTab === 'time' && player?.stats.totalTimeConsumed
                    ? player.stats.totalTimeConsumed
                    : '--'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
