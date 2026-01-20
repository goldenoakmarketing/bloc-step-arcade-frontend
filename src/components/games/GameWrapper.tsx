'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface GameProps {
  onScore: (points: number) => void
  onGameOver: () => void
  isPaused: boolean
  timeLeft: number
}

interface GameWrapperProps {
  gameId: string
  gameName: string
  gameIcon: string
  children: (props: GameProps) => React.ReactNode
  onExit: () => void
  quarterBalance: number
  onUseQuarter: () => void
}

interface ShareCardProps {
  gameName: string
  gameIcon: string
  score: number
  highScore: number
  isNewHighScore: boolean
  onClose: () => void
  onShare: () => void
}

function ShareCard({ gameName, gameIcon, score, highScore, isNewHighScore, onClose, onShare }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleShare = async () => {
    // Try native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${gameName} - Bloc Step Arcade`,
          text: `I scored ${score.toLocaleString()} on ${gameName}! ${isNewHighScore ? 'New high score!' : ''} Play at Bloc Step Arcade`,
          url: window.location.origin,
        })
      } catch (e) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      const text = `I scored ${score.toLocaleString()} on ${gameName}! ${isNewHighScore ? 'New high score!' : ''} Play at Bloc Step Arcade ${window.location.origin}`
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
    onShare()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Share Card */}
        <div
          ref={cardRef}
          className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 rounded-2xl p-6 border-2 border-purple-500 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">{gameIcon}</div>
            <h2 className="text-xl font-bold text-white">{gameName}</h2>
            <p className="text-purple-300 text-sm">Bloc Step Arcade</p>
          </div>

          {/* Score */}
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <div className="text-center">
              <div className="text-purple-300 text-sm mb-1">Score</div>
              <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {score.toLocaleString()}
              </div>
              {isNewHighScore && (
                <div className="mt-2 inline-block px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                  NEW HIGH SCORE!
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between text-sm mb-4">
            <div className="text-center flex-1">
              <div className="text-purple-300">Best</div>
              <div className="text-white font-bold">{highScore.toLocaleString()}</div>
            </div>
            <div className="text-center flex-1 border-l border-purple-700">
              <div className="text-purple-300">Rank</div>
              <div className="text-white font-bold">--</div>
            </div>
          </div>

          {/* Branding */}
          <div className="text-center text-purple-400 text-xs">
            blocstep.arcade
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 space-y-3">
          <button
            onClick={handleShare}
            className="btn btn-primary btn-full flex items-center justify-center gap-2"
          >
            <span>Share</span>
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-full"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

export function GameWrapper({
  gameId,
  gameName,
  gameIcon,
  children,
  onExit,
  quarterBalance,
  onUseQuarter
}: GameWrapperProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'gameover'>('ready')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes
  const [showShareCard, setShowShareCard] = useState(false)
  const [isNewHighScore, setIsNewHighScore] = useState(false)
  const lastTapRef = useRef<number>(0)
  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load high score from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`highscore_${gameId}`)
    if (saved) setHighScore(parseInt(saved))
  }, [gameId])

  // Timer - pauses when share card is shown
  useEffect(() => {
    if (gameState !== 'playing' || showShareCard) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleGameOver()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, showShareCard])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleScore = useCallback((points: number) => {
    setScore(prev => prev + points)
  }, [])

  const handleGameOver = useCallback(() => {
    const newHighScore = score > highScore
    if (newHighScore) {
      setHighScore(score)
      localStorage.setItem(`highscore_${gameId}`, score.toString())
    }
    setIsNewHighScore(newHighScore)
    setGameState('gameover')
    setShowShareCard(true)
  }, [score, highScore, gameId])

  const startGame = () => {
    if (quarterBalance < 1) return
    onUseQuarter()
    setScore(0)
    setTimeLeft(900)
    setIsNewHighScore(false)
    setGameState('playing')
  }

  const continueWithCredit = () => {
    if (quarterBalance < 1) return
    onUseQuarter()
    setTimeLeft(prev => prev + 900) // Add 15 minutes
  }

  const togglePause = () => {
    setGameState(prev => prev === 'playing' ? 'paused' : 'playing')
  }

  // Double-tap handler for timer
  const handleTimerTap = () => {
    const now = Date.now()
    const timeSinceLastTap = now - lastTapRef.current

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current)
        doubleTapTimeoutRef.current = null
      }
      if (quarterBalance >= 1 && gameState === 'playing') {
        continueWithCredit()
      }
    } else {
      // Single tap - wait to see if it's a double tap
      if (doubleTapTimeoutRef.current) {
        clearTimeout(doubleTapTimeoutRef.current)
      }
    }

    lastTapRef.current = now
  }

  const handleShareClose = () => {
    setShowShareCard(false)
  }

  const handleShareComplete = () => {
    setShowShareCard(false)
  }

  // Show share card during gameplay
  const openShareCard = () => {
    setShowShareCard(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Share Card Modal */}
      {showShareCard && (
        <ShareCard
          gameName={gameName}
          gameIcon={gameIcon}
          score={score}
          highScore={Math.max(score, highScore)}
          isNewHighScore={isNewHighScore}
          onClose={handleShareClose}
          onShare={handleShareComplete}
        />
      )}

      {/* HUD */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#27272a]">
        <div>
          <div className="text-xs text-muted">Score</div>
          <div className="text-xl font-bold text-gradient">{score.toLocaleString()}</div>
        </div>
        <div
          className="text-center cursor-pointer select-none"
          onClick={handleTimerTap}
          title={quarterBalance >= 1 ? "Double-tap to add 15 min" : "No quarters available"}
        >
          <div className="text-xs text-muted">{gameName}</div>
          <div className={`text-xl font-bold ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : ''}`}>
            {formatTime(timeLeft)}
          </div>
          {gameState === 'playing' && quarterBalance >= 1 && timeLeft <= 120 && (
            <div className="text-xs text-green-500">tap x2 for +15min</div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Best</div>
          <div className="text-xl font-bold">{highScore.toLocaleString()}</div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {gameState === 'ready' && (
          <div className="card text-center max-w-sm w-full">
            <div className="text-6xl mb-6">{gameIcon}</div>
            <h2 className="text-2xl font-bold mb-2">{gameName}</h2>
            <p className="text-muted text-sm mb-6">Insert a quarter to play</p>
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg btn-full"
              disabled={quarterBalance < 1}
            >
              Insert Quarter
            </button>
            <button
              onClick={onExit}
              className="btn btn-secondary btn-full mt-3"
            >
              Back to Games
            </button>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="w-full max-w-lg">
            {gameState === 'paused' && (
              <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center">
                <div className="card text-center">
                  <h2 className="text-2xl font-bold mb-2">Paused</h2>
                  <p className="text-muted text-sm mb-4">Timer paused</p>
                  <button onClick={togglePause} className="btn btn-primary btn-full">
                    Resume
                  </button>
                </div>
              </div>
            )}
            {children({
              onScore: handleScore,
              onGameOver: handleGameOver,
              isPaused: gameState === 'paused' || showShareCard,
              timeLeft,
            })}
          </div>
        )}

        {gameState === 'gameover' && !showShareCard && (
          <div className="card text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
            <div className="mb-6">
              <div className="text-muted text-sm">Final Score</div>
              <div className="text-4xl font-bold text-gradient">{score.toLocaleString()}</div>
            </div>
            {isNewHighScore && score > 0 && (
              <div className="badge badge-success mb-4">New High Score!</div>
            )}
            <button
              onClick={() => setShowShareCard(true)}
              className="btn btn-secondary btn-full mb-3"
            >
              Share Score
            </button>
            <button onClick={startGame} className="btn btn-primary btn-full" disabled={quarterBalance < 1}>
              Play Again (1Q)
            </button>
            <button onClick={onExit} className="btn btn-secondary btn-full mt-3">
              Back to Games
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      {gameState === 'playing' && !showShareCard && (
        <div className="flex justify-center gap-4 p-4 border-t border-[#27272a]">
          <button onClick={togglePause} className="btn btn-secondary">
            Pause
          </button>
          <button onClick={openShareCard} className="btn btn-secondary">
            Share
          </button>
          <button onClick={handleGameOver} className="btn btn-secondary">
            End Game
          </button>
        </div>
      )}
    </div>
  )
}
