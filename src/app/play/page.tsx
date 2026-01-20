'use client'

import { useState } from 'react'
import { GAMES, GameWrapper, getGameById } from '@/components/games'

export default function PlayPage() {
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [quarterBalance, setQuarterBalance] = useState(4)

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  const handleUseQuarter = () => {
    setQuarterBalance(prev => prev - 1)
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
        onUseQuarter={handleUseQuarter}
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
          <div className="mt-4">
            <span className="badge">{formatQuarters(quarterBalance)} available</span>
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
                Each game costs <span className="text-white">1 quarter</span> (15 minutes).
                Your high scores are saved locally.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
