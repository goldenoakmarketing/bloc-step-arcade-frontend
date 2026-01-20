'use client'

import { useState } from 'react'
import { CoinButton } from '@/components/ui/CoinButton'

export default function ProfilePage() {
  const [purchaseAmount, setPurchaseAmount] = useState(4) // quarters
  const [customAmount, setCustomAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false) // Swayze mode

  // Mock data for development
  const [quarterBalance, setQuarterBalance] = useState(8)
  const stakedBalance = '10,000'
  const totalLost = '200' // quarters lost

  // Mock linked accounts - nameserver-based identity
  const linkedAccounts = {
    localpay: 'player.localpay', // User's .localpay name
    farcaster: '@player', // Farcaster username
    basens: null, // Not linked yet: would be 'player.base.eth'
  }

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  const formatTime = (quarters: number) => {
    const minutes = quarters * 15
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  // Calculate donation (1 in 8 goes to pool)
  const getDonationAmount = (quarters: number) => Math.floor(quarters / 8)

  const handleClaim = (found: number) => {
    setQuarterBalance(prev => prev + found)
    // In real app, this would call API
  }

  const handleLose = () => {
    if (quarterBalance > 0) {
      setQuarterBalance(prev => prev - 1)
      // In real app, this would add to lost pool
    }
  }

  const handleBuy = () => {
    const amount = customAmount ? parseInt(customAmount) : purchaseAmount
    if (amount > 0) {
      const donation = getDonationAmount(amount)
      const received = amount - donation
      setQuarterBalance(prev => prev + received)
      setCustomAmount('')
      // In real app: payment processing, donation goes to pool
    }
  }

  const handleQuickSelect = (amount: number) => {
    setPurchaseAmount(amount)
    setCustomAmount('')
  }

  const effectiveAmount = customAmount ? parseInt(customAmount) || 0 : purchaseAmount
  const donationAmount = getDonationAmount(effectiveAmount)

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] mx-auto mb-4 flex items-center justify-center text-2xl">
            {isAnonymous ? '👻' : '🎮'}
          </div>
          {isAnonymous ? (
            <>
              <h1 className="text-xl font-bold text-zinc-500 italic">Swayze</h1>
              <p className="text-muted text-sm">Identity hidden</p>
            </>
          ) : linkedAccounts.localpay ? (
            <>
              <h1 className="text-xl font-bold text-emerald-400">{linkedAccounts.localpay}</h1>
              <p className="text-muted text-sm">Primary identity</p>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Guest Player</h1>
              <p className="text-muted text-sm">Link an account to save progress</p>
            </>
          )}
        </div>

        {/* Linked Accounts */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Linked Accounts</h3>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                isAnonymous
                  ? 'bg-zinc-700 text-zinc-300'
                  : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {isAnonymous ? '👻 Swayze Mode' : 'Go Anonymous'}
            </button>
          </div>

          <div className="space-y-3">
            {/* Localpay */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 text-lg">●</span>
                <span className="text-sm">.localpay</span>
              </div>
              {linkedAccounts.localpay ? (
                <span className="text-emerald-400 text-sm font-medium">{linkedAccounts.localpay}</span>
              ) : (
                <button className="text-xs text-muted hover:text-white">Link</button>
              )}
            </div>

            {/* Farcaster */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-purple-400 text-lg">●</span>
                <span className="text-sm">Farcaster</span>
              </div>
              {linkedAccounts.farcaster ? (
                <span className="text-purple-400 text-sm font-medium">{linkedAccounts.farcaster}</span>
              ) : (
                <button className="text-xs text-muted hover:text-white">Link</button>
              )}
            </div>

            {/* Base ENS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 text-lg">●</span>
                <span className="text-sm">.base.eth</span>
              </div>
              {linkedAccounts.basens ? (
                <span className="text-blue-400 text-sm font-medium">{linkedAccounts.basens}</span>
              ) : (
                <button className="text-xs text-muted hover:text-white">Link</button>
              )}
            </div>
          </div>
        </div>

        {/* Quarter Balance */}
        <div className="card mb-4">
          <div className="text-center mb-6">
            <div className="text-sm text-muted mb-1">Quarter Balance</div>
            <div className="text-4xl font-bold text-gradient">{formatQuarters(quarterBalance)}</div>
            <div className="text-sm text-muted mt-1">{formatTime(quarterBalance)} playtime available</div>
          </div>

          <div className="border-t border-[#27272a] pt-4">
            <div className="text-sm text-muted mb-3">Buy Quarters</div>

            {/* Quick select buttons */}
            <div className="flex gap-2 mb-3">
              {[4, 20, 40].map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleQuickSelect(amount)}
                  className={purchaseAmount === amount && !customAmount ? 'tab tab-active flex-1' : 'tab flex-1'}
                >
                  {amount}Q
                </button>
              ))}
            </div>

            {/* Custom amount input */}
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                min="1"
                placeholder="Custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#8b5cf6]"
              />
              <span className="flex items-center text-sm text-muted">quarters</span>
            </div>

            {/* Purchase summary */}
            {effectiveAmount > 0 && (
              <div className="bg-zinc-900/50 rounded-lg p-3 mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted">Purchase:</span>
                  <span>{effectiveAmount}Q ({formatTime(effectiveAmount)} playtime)</span>
                </div>
                {donationAmount > 0 && (
                  <div className="flex justify-between mb-1 text-yellow-500">
                    <span>Donated to pool:</span>
                    <span>{donationAmount}Q (1 in 8)</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-1 mt-1">
                  <span>You receive:</span>
                  <span className="text-gradient">{effectiveAmount - donationAmount}Q</span>
                </div>
              </div>
            )}

            <button
              onClick={handleBuy}
              className="btn btn-success btn-full"
              disabled={effectiveAmount < 1}
            >
              Buy {effectiveAmount} Quarter{effectiveAmount !== 1 ? 's' : ''}
            </button>
            <p className="text-xs text-muted text-center mt-2">
              1 Quarter = 15 min session • Timer starts when you play
            </p>
          </div>
        </div>

        {/* Lost & Found */}
        <div className="card mb-4">
          <h3 className="font-bold mb-4 text-center">Lost & Found</h3>
          <div className="flex justify-center mb-2">
            <CoinButton onClaim={handleClaim} />
          </div>
          <p className="text-xs text-muted text-center">
            Check if someone left a quarter behind
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="stat-card">
            <div className="stat-label">Staked</div>
            <div className="stat-value">{stakedBalance}</div>
            <div className="text-xs text-muted">$BLOC</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Lost</div>
            <div className="stat-value">{totalLost}</div>
            <div className="text-xs text-muted">quarters</div>
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
                <div className="font-medium">Lose a Quarter</div>
                <div className="text-sm text-muted">Leave for others to find</div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleLose}
                disabled={quarterBalance === 0}
              >
                Lose 1Q
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
