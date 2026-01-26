'use client'

import { useState, useCallback } from 'react'
import { GAMES, GameWrapper, getGameById } from '@/components/games'
import { useQuarters } from '@/hooks/useQuarters'

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0) // Local time for gameplay
  const [quartersUsed, setQuartersUsed] = useState(0) // Track quarters used this session

  const {
    isConnected,
    quarterBalance, // How many quarters user can afford (from BLOC balance)
    QUARTER_DURATION,
  } = useQuarters()

  // Available quarters = what they can afford minus what they've used this session
  const availableQuarters = Math.max(0, quarterBalance - quartersUsed)

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Insert quarter - just track locally, no contract call
  // Returns 'started' if quarter inserted, 'has-time' if already has time, 'failed' otherwise
  const handleBuyTime = useCallback((): 'started' | 'has-time' | 'failed' => {
    // If already has time, don't need to insert another quarter
    if (timeRemaining > 0) return 'has-time'

    if (!isConnected) return 'failed'
    if (availableQuarters < 1) return 'failed'

    // Insert quarter locally - add time and track usage
    setQuartersUsed(prev => prev + 1)
    setTimeRemaining(prev => prev + QUARTER_DURATION)

    return 'started'
  }, [isConnected, availableQuarters, timeRemaining, QUARTER_DURATION])

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
        quarterBalance={availableQuarters}
        timeRemaining={timeRemaining}
        onTimeChange={handleTimeChange}
        onBuyTime={handleBuyTime}
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
              <span className="badge">{formatQuarters(availableQuarters)} available</span>
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
