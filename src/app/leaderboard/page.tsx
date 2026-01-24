'use client'

import { useState } from 'react'

type LeaderboardType = 'lost' | 'staking' | 'time'

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'lost', label: 'Donations' },
  { id: 'staking', label: 'Staking' },
  { id: 'time', label: 'Time Played' },
]

// Leaderboard data - will come from backend
const leaderboardData: Record<LeaderboardType, { rank: number; name: string | null; type: string | null; anonymous: boolean; score: string }[]> = {
  lost: [],
  staking: [],
  time: [],
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('lost')
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

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Leaderboard</h1>
          <p className="text-muted text-sm">Top players</p>
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
          {entries.length === 0 ? (
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
              <div className="text-xl font-bold">--</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Your Score</div>
              <div className="text-xl font-bold text-gradient">--</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
