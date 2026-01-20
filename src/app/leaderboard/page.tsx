'use client'

import { useState } from 'react'

type LeaderboardType = 'yeet' | 'staking' | 'time'

const tabs: { id: LeaderboardType; label: string }[] = [
  { id: 'yeet', label: 'Yeet' },
  { id: 'staking', label: 'Staking' },
  { id: 'time', label: 'Time' },
]

// Mock data for development
const mockData = {
  yeet: [
    { rank: 1, address: '0x1234...5678', username: 'yeetmaster', score: '1,000,000' },
    { rank: 2, address: '0xabcd...efgh', username: 'blazer', score: '750,000' },
    { rank: 3, address: '0x9876...5432', username: null, score: '500,000' },
    { rank: 4, address: '0xdead...beef', username: 'cryptokid', score: '250,000' },
    { rank: 5, address: '0xcafe...babe', username: null, score: '100,000' },
  ],
  staking: [
    { rank: 1, address: '0xabcd...efgh', username: 'whale', score: '5,000,000' },
    { rank: 2, address: '0x1234...5678', username: 'hodler', score: '2,500,000' },
    { rank: 3, address: '0x9876...5432', username: null, score: '1,000,000' },
  ],
  time: [
    { rank: 1, address: '0x9876...5432', username: 'gamer1', score: '48:32:15' },
    { rank: 2, address: '0x1234...5678', username: null, score: '36:15:42' },
    { rank: 3, address: '0xabcd...efgh', username: 'nolife', score: '24:00:00' },
  ],
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('yeet')
  const entries = mockData[activeTab]

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
          <div className="divide-y divide-[#27272a]">
            {entries.map((entry) => (
              <div key={entry.address} className="leaderboard-row">
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
