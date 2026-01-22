'use client'

import { useState } from 'react'

type LeaderboardType = 'lost' | 'staking' | 'time'

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'lost', label: 'Donations' },
  { id: 'staking', label: 'Staking' },
  { id: 'time', label: 'Time Played' },
]

// Mock data for development
// Identity types: localpay (.localpay), farcaster (@user), basens (user.base.eth)
// anonymous = true means user chose to hide their identity (shows as Swayze)
const mockData = {
  lost: [
    { rank: 1, name: 'generous.localpay', type: 'localpay', anonymous: false, score: '1,000 Q' },
    { rank: 2, name: '@giver', type: 'farcaster', anonymous: false, score: '750 Q' },
    { rank: 3, name: null, type: null, anonymous: true, score: '500 Q' },
    { rank: 4, name: 'phil.base.eth', type: 'basens', anonymous: false, score: '250 Q' },
    { rank: 5, name: null, type: null, anonymous: true, score: '100 Q' },
  ],
  staking: [
    { rank: 1, name: 'whale.localpay', type: 'localpay', anonymous: false, score: '5M BLOC' },
    { rank: 2, name: null, type: null, anonymous: true, score: '2.5M BLOC' },
    { rank: 3, name: '@hodler', type: 'farcaster', anonymous: false, score: '1M BLOC' },
  ],
  time: [
    { rank: 1, name: 'gamer.base.eth', type: 'basens', anonymous: false, score: '200 Q' },
    { rank: 2, name: null, type: null, anonymous: true, score: '150 Q' },
    { rank: 3, name: '@dedicated', type: 'farcaster', anonymous: false, score: '100 Q' },
  ],
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('lost')
  const entries = mockData[activeTab]

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
        </div>

        {/* Your Stats - mock */}
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
