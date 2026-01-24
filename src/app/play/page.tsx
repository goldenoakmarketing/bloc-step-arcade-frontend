'use client'

import { useState, useCallback } from 'react'
import { GAMES, GameWrapper, getGameById } from '@/components/games'

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [quarterBalance, setQuarterBalance] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0) // Shared time across all games

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Buy time with a quarter (adds 15 minutes)
  const handleBuyTime = useCallback(() => {
    if (quarterBalance < 1) return false
    setQuarterBalance(prev => prev - 1)
    setTimeRemaining(prev => prev + 900) // Add 15 minutes
    return true
  }, [quarterBalance])

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
          <div className="mt-4 flex justify-center gap-3">
            <span className="badge">{formatQuarters(quarterBalance)} available</span>
            {timeRemaining > 0 && (
              <span className="badge badge-success">{formatTime(timeRemaining)} remaining</span>
            )}
          </div>
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
