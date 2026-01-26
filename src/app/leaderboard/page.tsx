'use client'

import { useState } from 'react'
import { useLeaderboards, useStats, usePlayerRanks, usePlayer } from '@/hooks/useApi'

type LeaderboardType = 'lost' | 'staking' | 'time'

interface LeaderboardEntry {
  rank: number
  name: string | null
  type: string | null
  anonymous: boolean
  score: string
}

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'lost', label: 'Donations' },
  { id: 'staking', label: 'Staking' },
  { id: 'time', label: 'Time Played' },
]

const formatBlocAmount = (score: string) => {
  // Score is already in tokens (not wei), no need to divide by 1e18
  const num = Number(score)
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(0)
}

const formatTimeSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('lost')
  const { yeet, staking, time, isLoading } = useLeaderboards(20)
  const { data: stats } = useStats()
  const { data: playerRanks } = usePlayerRanks()
  const { data: playerData } = usePlayer()

  const leaderboardData: Record<LeaderboardType, LeaderboardEntry[]> = {
    lost: yeet.map(e => ({
      rank: e.rank,
      name: e.farcasterUsername || `${e.walletAddress.slice(0,6)}...${e.walletAddress.slice(-4)}`,
      type: e.farcasterUsername ? 'farcaster' : null,
      anonymous: false,
      score: `${e.score}Q`
    })),
    staking: staking.map(e => ({
      rank: e.rank,
      name: e.farcasterUsername || `${e.walletAddress.slice(0,6)}...${e.walletAddress.slice(-4)}`,
      type: e.farcasterUsername ? 'farcaster' : null,
      anonymous: false,
      score: formatBlocAmount(e.score)
    })),
    time: time.map(e => ({
      rank: e.rank,
      name: e.farcasterUsername || `${e.walletAddress.slice(0,6)}...${e.walletAddress.slice(-4)}`,
      type: e.farcasterUsername ? 'farcaster' : null,
      anonymous: false,
      score: formatTimeSeconds(Number(e.score))
    }))
  }

  const entries = leaderboardData[activeTab]

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getTabDescription = () => {
    switch (activeTab) {
      case 'lost':
        return 'Players who lost the most quarters for others to find'
      case 'staking':
        return 'Top $BLOC stakers'
      case 'time':
        return 'Most quarters spent playing'
    }
  }

  const getUserRank = (): number | null => {
    if (!playerRanks) return null
    switch (activeTab) {
      case 'lost':
        return playerRanks.yeetRank
      case 'staking':
        return playerRanks.stakingRank
      case 'time':
        return playerRanks.timePlayedRank
    }
  }

  const getUserScore = (): string => {
    if (!playerData) return '--'
    switch (activeTab) {
      case 'lost':
        return `${playerData.stats?.totalYeeted || '0'}Q`
      case 'staking':
        return formatBlocAmount(playerData.cachedStakedBalance || '0')
      case 'time':
        return formatTimeSeconds(Number(playerData.stats?.totalTimeConsumed || 0))
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
          <p className="text-muted text-sm">Top players</p>
        </div>

        {/* Total Donated Stat */}
        <div className="stat-card mb-6 text-center">
          <div className="stat-label">Total Donated</div>
          <div className="stat-value text-2xl text-gradient">{(stats?.totalDonated || 0).toLocaleString()}</div>
          <div className="text-xs text-muted">quarters to the pool</div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={activeTab === tab.id ? 'tab tab-active text-xs' : 'tab text-xs'}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted text-center mb-6">{getTabDescription()}</p>

        {/* List */}
        <div className="card">
          {isLoading ? (
            <div className="text-center py-8 text-muted">
              <p>Loading...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p>No entries yet</p>
              <p className="text-xs mt-1">Be the first on the leaderboard!</p>
            </div>
          ) : (
            <div className="divide-y divide-[#27272a]">
              {entries.map((entry, idx) => (
                <div key={idx} className="leaderboard-row">
                  <div className="w-12 text-lg">
                    {getRankDisplay(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    {entry.anonymous ? (
                      <div className="flex items-center gap-1.5 text-zinc-600">
                        <span>👻</span>
                        <span className="italic">Swayze</span>
                      </div>
                    ) : (
                      <div className="font-medium truncate flex items-center gap-1.5">
                        {entry.type === 'farcaster' && <span className="text-purple-400">{entry.name}</span>}
                        {entry.type === 'localpay' && <span className="text-emerald-400">{entry.name}</span>}
                        {entry.type === 'basens' && <span className="text-blue-400">{entry.name}</span>}
                        {!entry.type && <span className="text-zinc-400">{entry.name}</span>}
                      </div>
                    )}
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
        <div className="card mt-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-xs text-muted">Your Rank</div>
              <div className="text-xl font-bold">
                {getUserRank() ? `#${getUserRank()}` : '--'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Your Score</div>
              <div className="text-xl font-bold text-gradient">{getUserScore()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
