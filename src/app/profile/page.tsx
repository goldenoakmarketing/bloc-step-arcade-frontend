'use client'

import { useState } from 'react'

export default function ProfilePage() {
  const [purchaseAmount, setPurchaseAmount] = useState(60)

  // Mock data for development
  const timeBalance = 300
  const stakedBalance = '10,000'
  const totalYeeted = '50,000'

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] mx-auto mb-4 flex items-center justify-center text-2xl">
            🎮
          </div>
          <h1 className="text-xl font-bold">Guest Player</h1>
          <p className="text-muted text-sm">Connect wallet to save progress</p>
        </div>

        {/* Time Balance */}
        <div className="card mb-4">
          <div className="text-center mb-6">
            <div className="text-sm text-muted mb-1">Time Balance</div>
            <div className="text-4xl font-bold text-gradient">{formatTime(timeBalance)}</div>
          </div>

          <div className="border-t border-[#27272a] pt-4">
            <div className="text-sm text-muted mb-3">Purchase more time</div>
            <div className="flex gap-2 mb-4">
              {[60, 300, 600].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setPurchaseAmount(amount)}
                  className={purchaseAmount === amount ? 'tab tab-active flex-1' : 'tab flex-1'}
                >
                  {formatTime(amount)}
                </button>
              ))}
            </div>
            <button className="btn btn-success btn-full">
              Buy {formatTime(purchaseAmount)}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat-card">
            <div className="stat-label">Staked</div>
            <div className="stat-value">{stakedBalance}</div>
            <div className="text-xs text-muted">$BLOC</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Yeeted</div>
            <div className="stat-value">{totalYeeted}</div>
            <div className="text-xs text-muted">$BLOC</div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Stake $BLOC</div>
                <div className="text-sm text-muted">Earn rewards</div>
              </div>
              <button className="btn btn-success">Stake</button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Yeet $BLOC</div>
                <div className="text-sm text-muted">Burn for glory</div>
              </div>
              <button className="btn btn-primary">Yeet</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
