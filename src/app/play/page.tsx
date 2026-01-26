'use client'

import { useState, useCallback } from 'react'
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { GAMES, GameWrapper, getGameById } from '@/components/games'
import { useQuarters } from '@/hooks/useQuarters'
import { useArcadeTimer } from '@/contexts/ArcadeTimerContext'
import { contracts, blocTokenAbi } from '@/config/contracts'

// 1 quarter = 250 BLOC
const QUARTER_AMOUNT = BigInt(250) * BigInt(10 ** 18)

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>()

  const {
    isConnected,
    quarterBalance,
    refetchAll,
  } = useQuarters()

  const {
    timeRemaining,
    addTime,
    formatTime,
  } = useArcadeTimer()

  // Transaction hooks for inserting quarter (transfer BLOC to ArcadeVault)
  const {
    sendTransactionAsync,
    isPending: isSendPending,
    reset: resetSend,
  } = useSendTransaction()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
  } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  const isPurchasing = isSendPending || isConfirming

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  // Insert quarter - transfers 250 BLOC to ArcadeVault, then adds time
  const handleBuyTime = useCallback(async (): Promise<'started' | 'has-time' | 'failed'> => {
    // If already has time, don't need to insert another quarter
    if (timeRemaining > 0) return 'has-time'

    if (!isConnected) return 'failed'
    if (quarterBalance < 1) return 'failed'

    try {
      // Encode transfer call: transfer 250 BLOC to ArcadeVault
      const data = encodeFunctionData({
        abi: blocTokenAbi,
        functionName: 'transfer',
        args: [contracts.arcadeVault, QUARTER_AMOUNT],
      })

      // Send transaction and wait for hash
      const hash = await sendTransactionAsync({
        to: contracts.blocToken,
        data,
      })

      setPendingTxHash(hash)

      // Wait for confirmation by polling (simple approach)
      // In production, you might want to use useWaitForTransactionReceipt more elegantly
      const receipt = await waitForTransaction(hash)

      if (receipt.status === 'success') {
        // Add time to timer
        addTime()
        // Refetch BLOC balance so UI updates everywhere
        refetchAll()
        resetSend()
        setPendingTxHash(undefined)
        return 'started'
      } else {
        resetSend()
        setPendingTxHash(undefined)
        return 'failed'
      }
    } catch (error) {
      console.error('Insert quarter failed:', error)
      resetSend()
      setPendingTxHash(undefined)
      return 'failed'
    }
  }, [isConnected, quarterBalance, timeRemaining, sendTransactionAsync, addTime, refetchAll, resetSend])

  // Simple transaction wait helper
  async function waitForTransaction(hash: `0x${string}`): Promise<{ status: 'success' | 'reverted' }> {
    // Poll for receipt
    const maxAttempts = 60 // 60 seconds max
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      try {
        const response = await fetch(`https://mainnet.base.org`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionReceipt',
            params: [hash],
            id: 1,
          }),
        })
        const data = await response.json()
        if (data.result) {
          return {
            status: data.result.status === '0x1' ? 'success' : 'reverted',
          }
        }
      } catch (e) {
        // Continue polling
      }
    }
    throw new Error('Transaction confirmation timeout')
  }

  // If a game is selected, show it
  if (selectedGame) {
    const game = getGameById(selectedGame)
    if (!game) {
      setSelectedGame(null)
      return null
    }

    const GameComponent = game.component

    return (
      <GameWrapper
        gameId={game.meta.id}
        gameName={game.meta.name}
        gameIcon={game.meta.icon}
        onExit={() => setSelectedGame(null)}
        quarterBalance={quarterBalance}
        timeRemaining={timeRemaining}
        onBuyTime={handleBuyTime}
        isPurchasing={isPurchasing}
      >
        {(props) => <GameComponent {...props} />}
      </GameWrapper>
    )
  }

  // Game selection screen
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Arcade</h1>
          <p className="text-muted text-sm">Choose a game to play</p>
          {isConnected ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <div className="flex justify-center gap-3">
                <span className="badge">{formatQuarters(quarterBalance)} available</span>
                {timeRemaining > 0 && (
                  <span className="badge badge-success">{formatTime(timeRemaining)} remaining</span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <span className="badge bg-yellow-500/20 text-yellow-400 border-yellow-500/50">Connect wallet to play</span>
            </div>
          )}
        </div>

        {/* Game Grid */}
        <div className="grid grid-cols-2 gap-4">
          {GAMES.map(({ meta }) => (
            <button
              key={meta.id}
              onClick={() => setSelectedGame(meta.id)}
              className="card-glow text-left p-4 hover:scale-[1.02] transition-transform"
            >
              <div className={`
                w-12 h-12 rounded-xl mb-3
                bg-gradient-to-br ${meta.color}
                flex items-center justify-center text-2xl
              `}>
                {meta.icon}
              </div>
              <h3 className="font-bold mb-1">{meta.name}</h3>
              <p className="text-xs text-muted">{meta.description}</p>
            </button>
          ))}
        </div>

        {/* Coming Soon placeholder */}
        <div className="mt-6 text-center">
          <p className="text-muted text-sm">More games coming soon...</p>
        </div>

        {/* Quick Info */}
        <div className="card mt-6">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div className="text-sm">
              <p className="text-muted">
                <span className="text-white">1 quarter = 250 BLOC = 15 minutes</span> of arcade time.
                Play as many games as you want while time remains!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
