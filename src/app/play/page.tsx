'use client'

import { useState, useCallback, useEffect } from 'react'
import { GAMES, GameWrapper, getGameById } from '@/components/games'
import { useQuarters } from '@/hooks/useQuarters'

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0) // Local time for gameplay

  const {
    isConnected,
    quarterBalance, // How many quarters user can buy (from BLOC balance)
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
    refetchAll,
    resetApprove,
    resetBuy,
    QUARTER_DURATION,
  } = useQuarters()

  const [isInserting, setIsInserting] = useState(false)

  // After successful buy, add time and reset states
  useEffect(() => {
    if (isBuySuccess && isInserting) {
      setTimeRemaining(prev => prev + QUARTER_DURATION) // Add 15 minutes
      refetchAll()
      resetBuy()
      resetApprove()
      setIsInserting(false)
    }
  }, [isBuySuccess, isInserting, refetchAll, resetBuy, resetApprove, QUARTER_DURATION])

  // After approval succeeds, automatically buy quarter
  useEffect(() => {
    if (isApproveSuccess && isInserting && !isBuyPending && !isBuyConfirming) {
      handleBuyQuarters(1)
    }
  }, [isApproveSuccess, isInserting, isBuyPending, isBuyConfirming, handleBuyQuarters])

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Compute insert quarter status for UI
  const getInsertStatus = (): 'idle' | 'approving' | 'confirming-approve' | 'buying' | 'confirming-buy' => {
    if (isApprovePending) return 'approving'
    if (isApproveConfirming) return 'confirming-approve'
    if (isBuyPending) return 'buying'
    if (isBuyConfirming) return 'confirming-buy'
    return 'idle'
  }

  // Insert quarter - triggers blockchain flow
  const handleBuyTime = useCallback(() => {
    if (!isConnected) return false
    if (!hasSufficientBalance(1)) return false
    if (isInserting) return false

    setIsInserting(true)

    if (needsApproval(1)) {
      handleApprove(1)
    } else {
      handleBuyQuarters(1)
    }

    return true // Return true to indicate flow started (actual time added after tx confirms)
  }, [isConnected, hasSufficientBalance, needsApproval, handleApprove, handleBuyQuarters, isInserting])

  // Update time remaining (called by GameWrapper)
  const handleTimeChange = useCallback((newTime: number) => {
    setTimeRemaining(newTime)
  }, [])

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
        onTimeChange={handleTimeChange}
        onBuyTime={handleBuyTime}
        isInsertingQuarter={isInserting}
        insertQuarterStatus={getInsertStatus()}
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
            <div className="mt-4 flex justify-center gap-3">
              <span className="badge">{formatQuarters(quarterBalance)} available</span>
              {timeRemaining > 0 && (
                <span className="badge badge-success">{formatTime(timeRemaining)} remaining</span>
              )}
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
                <span className="text-white">1 quarter = 15 minutes</span> of arcade time.
                Play as many games as you want while time remains!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
