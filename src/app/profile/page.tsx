'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { formatEther, encodeFunctionData } from 'viem'
import { CoinButton } from '@/components/ui/CoinButton'
import { StakingPanel } from '@/components/staking/StakingPanel'
import { LOCALPAY_ENABLED } from '@/config/features'
import { useFarcaster } from '@/providers/FarcasterProvider'
import { useQuarters } from '@/hooks/useQuarters'
import { useSwapEthForBloc } from '@/hooks/useSwapEthForBloc'
import { contracts, blocTokenAbi } from '@/config/contracts'

// 1 quarter = 250 BLOC
const QUARTER_AMOUNT = BigInt(250) * BigInt(10 ** 18)

export default function ProfilePage() {
  const [purchaseAmount, setPurchaseAmount] = useState(4) // quarters
  const [customAmount, setCustomAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false) // Swayze mode
  const [loseSuccess, setLoseSuccess] = useState(false)
  const [loseError, setLoseError] = useState<string | null>(null)

  // Farcaster context
  const { user: farcasterUser, isInFarcaster } = useFarcaster()

  // Get wallet address for API call
  const { address } = useAccount()

  // Quarters hook for reading balances
  const {
    isConnected,
    quarterBalance,
    formattedBlocBalance,
    formattedTimeBalance,
    refetchAll,
  } = useQuarters()

  // Swap hook for buying BLOC with ETH
  const {
    ethBalance,
    quote,
    isQuoting,
    quoteError,
    getQuote,
    isSwapPending,
    isSwapConfirming,
    isSwapSuccess,
    handleSwap,
    resetSwap,
    formatEthCost,
    formatBlocAmount,
  } = useSwapEthForBloc()

  // Lose quarter transaction hooks
  const {
    sendTransaction: sendLose,
    data: loseTxHash,
    isPending: isLosePending,
    reset: resetLose,
  } = useSendTransaction()

  const {
    isLoading: isLoseConfirming,
    isSuccess: isLoseSuccess,
  } = useWaitForTransactionReceipt({
    hash: loseTxHash,
  })

  // Wallet connection
  const { connect, connectors } = useConnect()

  // Get quote when amount changes
  const effectiveAmount = customAmount ? parseInt(customAmount) || 0 : purchaseAmount

  useEffect(() => {
    if (isConnected && effectiveAmount > 0) {
      getQuote(effectiveAmount)
    }
  }, [isConnected, effectiveAmount])

  // Refetch balances after successful swap
  useEffect(() => {
    if (isSwapSuccess) {
      refetchAll()
      resetSwap()
      setCustomAmount('')
    }
  }, [isSwapSuccess, refetchAll, resetSwap])

  // Handle successful lose quarter transaction
  useEffect(() => {
    if (isLoseSuccess && loseTxHash && address) {
      // Call backend to update pool balance
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/pool/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: address,
          quarters: 1,
          txHash: loseTxHash,
        }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to record deposit')
          return res.json()
        })
        .then(() => {
          setLoseSuccess(true)
          refetchAll()
          resetLose()
          // Clear success message after 3 seconds
          setTimeout(() => setLoseSuccess(false), 3000)
        })
        .catch((err) => {
          console.error('Failed to record deposit:', err)
          // Still refetch balances since on-chain transfer succeeded
          refetchAll()
          resetLose()
        })
    }
  }, [isLoseSuccess, loseTxHash, address, refetchAll, resetLose])

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


  const handleClaim = (found: number) => {
    // In real app, this would call the contract
    refetchAll()
  }

  const handleLose = () => {
    if (!isConnected || quarterBalance === 0) return

    setLoseError(null)

    // Encode transfer call: transfer 250 BLOC to PoolPayout contract
    const data = encodeFunctionData({
      abi: blocTokenAbi,
      functionName: 'transfer',
      args: [contracts.poolPayout, QUARTER_AMOUNT],
    })

    sendLose({
      to: contracts.blocToken,
      data,
    })
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
    if (effectiveAmount > 0 && isConnected) {
      handleSwap(effectiveAmount)
    }
  }

  const handleQuickSelect = (amount: number) => {
    setPurchaseAmount(amount)
    setCustomAmount('')
  }

  // Calculate lost quarters (every 8th quarter goes to the pool)
  const lostQuarters = Math.floor(effectiveAmount / 8)
  const receivedQuarters = effectiveAmount - lostQuarters
  const BLOC_PER_QUARTER = 250
  const lostBloc = lostQuarters * BLOC_PER_QUARTER
  const receivedBloc = receivedQuarters * BLOC_PER_QUARTER

  // Check if user has enough ETH
  const canAfford = !quote || !ethBalance ? true : ethBalance.value >= quote.ethRequired

  // Determine button state
  const isLoading = isSwapPending || isSwapConfirming || isQuoting
  const getButtonText = () => {
    if (!isConnected) return 'Connect Wallet'
    if (isQuoting) return 'Getting price...'
    if (isSwapPending || isSwapConfirming) return 'Swapping...'
    if (quoteError) return 'Price unavailable'
    if (!canAfford) return 'Insufficient ETH'
    if (quote) return `Buy with ${formatEthCost()} ETH`
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
              <div className="text-xs text-zinc-500 mt-2 space-y-0.5">
                <div>BLOC: {formattedBlocBalance}</div>
                <div>ETH: {ethBalance ? Number(formatEther(ethBalance.value)).toFixed(4) : '0'}</div>
              </div>
            )}
          </div>

          <div className="border-t border-[#27272a] pt-4">
            <div className="text-sm text-muted mb-3">Buy Quarters with ETH</div>

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
                  <span className={!canAfford && isConnected ? 'text-red-400' : ''}>
                    {isQuoting ? '...' : quote ? `${formatEthCost()} ETH` : '...'}
                  </span>
                </div>
                <div className="flex justify-between font-bold border-t border-zinc-700 pt-1 mt-1">
                  <span>You receive:</span>
                  <span className="text-gradient">{receivedBloc.toLocaleString()} BLOC</span>
                </div>
                {lostQuarters > 0 && (
                  <div className="flex justify-between text-yellow-500 mt-1">
                    <span>Lost to pool:</span>
                    <span>{lostBloc.toLocaleString()} BLOC</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={isConnected ? handleBuy : handleConnect}
              className={`btn btn-full ${!isConnected || (canAfford && !isLoading && !quoteError) ? 'btn-success' : 'btn-secondary'}`}
              disabled={isConnected && (effectiveAmount < 1 || isLoading || !canAfford || !!quoteError)}
            >
              {getButtonText()}
            </button>
            <p className="text-xs text-muted text-center mt-2">
              Swaps ETH → BLOC via Uniswap V4
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
              {loseSuccess && (
                <div className="text-sm text-green-400 mt-1">Quarter donated to pool!</div>
              )}
              {loseError && (
                <div className="text-sm text-red-400 mt-1">{loseError}</div>
              )}
            </div>
            <button
              className="btn btn-primary"
              onClick={handleLose}
              disabled={!isConnected || quarterBalance === 0 || isLosePending || isLoseConfirming}
            >
              {isLosePending || isLoseConfirming ? 'Sending...' : 'Lose 1Q'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
