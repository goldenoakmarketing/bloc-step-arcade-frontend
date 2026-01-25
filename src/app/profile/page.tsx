'use client'

import { useState, useEffect } from 'react'
import { useConnect } from 'wagmi'
import { CoinButton } from '@/components/ui/CoinButton'
import { StakingPanel } from '@/components/staking/StakingPanel'
import { LOCALPAY_ENABLED } from '@/config/features'
import { useFarcaster } from '@/providers/FarcasterProvider'
import { useQuarters } from '@/hooks/useQuarters'
import { formatUnits } from 'viem'

export default function ProfilePage() {
  const [purchaseAmount, setPurchaseAmount] = useState(4) // quarters
  const [customAmount, setCustomAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false) // Swayze mode

  // Farcaster context
  const { user: farcasterUser, isInFarcaster } = useFarcaster()

  // Quarters hook for wallet interaction
  const {
    isConnected,
    quarterBalance,
    blocBalance,
    formattedBlocBalance,
    formattedTimeBalance,
    isApprovePending,
    isApproveConfirming,
    isApproveSuccess,
    isBuyPending,
    isBuyConfirming,
    isBuySuccess,
    handleApprove,
    handleBuyQuarters,
    needsApproval,
    hasSufficientBalance,
    getQuarterCost,
    refetchAll,
    resetApprove,
    resetBuy,
    QUARTER_AMOUNT,
  } = useQuarters()

  // Wallet connection
  const { connect, connectors } = useConnect()

  // Refetch data after successful transactions
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAll()
      resetApprove()
    }
  }, [isApproveSuccess, refetchAll, resetApprove])

  useEffect(() => {
    if (isBuySuccess) {
      refetchAll()
      resetBuy()
      setCustomAmount('')
    }
  }, [isBuySuccess, refetchAll, resetBuy])

  const totalLost = '0'

  // Linked accounts - Farcaster comes from SDK, others from backend
  const linkedAccounts = {
    localpay: null as string | null,
    farcaster: farcasterUser?.username ? `@${farcasterUser.username}` : null,
    basens: null as string | null,
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

  // Calculate donation (1 in 8 goes to pool) - this happens in the contract via yeet
  const getDonationAmount = (quarters: number) => Math.floor(quarters / 8)

  const handleClaim = (found: number) => {
    // In real app, this would call the contract
    refetchAll()
  }

  const handleLose = () => {
    // In real app, this would call the yeet contract
  }

  const handleConnect = () => {
    // Try Farcaster connector first, then injected
    const farcasterConnector = connectors.find(c => c.name.toLowerCase().includes('farcaster'))
    const connector = farcasterConnector || connectors[0]
    if (connector) {
      connect({ connector })
    }
  }

  const handleBuy = () => {
    const amount = customAmount ? parseInt(customAmount) : purchaseAmount
    if (amount > 0 && isConnected) {
      if (needsApproval(amount)) {
        handleApprove(amount)
      } else {
        handleBuyQuarters(amount)
      }
    }
  }

  const handleQuickSelect = (amount: number) => {
    setPurchaseAmount(amount)
    setCustomAmount('')
  }

  const effectiveAmount = customAmount ? parseInt(customAmount) || 0 : purchaseAmount
  const donationAmount = getDonationAmount(effectiveAmount)
  const totalCost = getQuarterCost(effectiveAmount)
  const formattedCost = formatUnits(totalCost, 18)
  const canAfford = hasSufficientBalance(effectiveAmount)
  const needsApprovalForAmount = needsApproval(effectiveAmount)

  // Determine button state
  const isLoading = isApprovePending || isApproveConfirming || isBuyPending || isBuyConfirming
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet'
    if (isApprovePending || isApproveConfirming) return 'Approving...'
    if (isBuyPending || isBuyConfirming) return 'Buying...'
    if (!canAfford) return 'Insufficient BLOC'
    if (needsApprovalForAmount) return `Approve ${formattedCost} BLOC`
    return `Buy ${effectiveAmount} Quarter${effectiveAmount !== 1 ? 's' : ''}`
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          {farcasterUser?.pfpUrl && !isAnonymous ? (
            <img
              src={farcasterUser.pfpUrl}
              alt="Profile"
              className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] mx-auto mb-4 flex items-center justify-center text-2xl">
              {isAnonymous ? '👻' : '🎮'}
            </div>
          )}
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
          ) : farcasterUser?.displayName || farcasterUser?.username ? (
            <>
              <h1 className="text-xl font-bold text-purple-400">
                {farcasterUser.displayName || `@${farcasterUser.username}`}
              </h1>
              {farcasterUser.displayName && farcasterUser.username && (
                <p className="text-muted text-sm">@{farcasterUser.username}</p>
              )}
              {!farcasterUser.displayName && (
                <p className="text-muted text-sm">Farcaster user</p>
              )}
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
                <span className={LOCALPAY_ENABLED ? "text-emerald-400 text-lg" : "text-emerald-800 text-lg"}>●</span>
                <span className="text-sm">.localpay</span>
              </div>
              {!LOCALPAY_ENABLED ? (
                <span className="text-emerald-700 text-sm">coming soon</span>
              ) : linkedAccounts.localpay ? (
                <span className="text-emerald-400 text-sm font-medium">{linkedAccounts.localpay}</span>
              ) : (
                <button className="text-xs text-muted hover:text-white">Link</button>
              )}
            </div>

            {/* Farcaster */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={linkedAccounts.farcaster ? "text-purple-400 text-lg" : "text-purple-800 text-lg"}>●</span>
                <span className="text-sm">Farcaster</span>
              </div>
              {linkedAccounts.farcaster ? (
                <span className="text-purple-400 text-sm font-medium">{linkedAccounts.farcaster}</span>
              ) : isInFarcaster ? (
                <span className="text-purple-700 text-sm">No username</span>
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
            <div className="text-sm text-muted mt-1">{formattedTimeBalance} playtime available</div>
            {isConnected && (
              <div className="text-xs text-zinc-500 mt-2">
                BLOC Balance: {formattedBlocBalance}
              </div>
            )}
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
                max="100"
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
                <div className="flex justify-between mb-1">
                  <span className="text-muted">Cost:</span>
                  <span className={!canAfford && isConnected ? 'text-red-400' : ''}>{formattedCost} BLOC</span>
                </div>
                {donationAmount > 0 && (
                  <div className="flex justify-between mb-1 text-yellow-500">
                    <span>Yeet trigger:</span>
                    <span>Every 8th quarter</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-1 mt-1">
                  <span>You receive:</span>
                  <span className="text-gradient">{effectiveAmount}Q</span>
                </div>
              </div>
            )}

            <button
              onClick={isConnected ? handleBuy : handleConnect}
              className={`btn btn-full ${!isConnected || (canAfford && !isLoading) ? 'btn-success' : 'btn-secondary'}`}
              disabled={isConnected && (effectiveAmount < 1 || isLoading || !canAfford)}
            >
              {getButtonText()}
            </button>
            <p className="text-xs text-muted text-center mt-2">
              1 Quarter = 250 BLOC = 15 min session
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

        {/* Staking Panel */}
        <div className="mb-4">
          <StakingPanel />
        </div>

        {/* Stats */}
        <div className="stat-card mb-4">
          <div className="stat-label">Total Lost</div>
          <div className="stat-value">{totalLost}</div>
          <div className="text-xs text-muted">quarters</div>
        </div>

        {/* Actions */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Lose a Quarter</div>
              <div className="text-sm text-muted">Leave for others to find</div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleLose}
              disabled={!isConnected || quarterBalance === 0}
            >
              Lose 1Q
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
