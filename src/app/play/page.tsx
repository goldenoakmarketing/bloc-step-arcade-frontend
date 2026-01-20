'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type GameState = 'idle' | 'countdown' | 'playing' | 'paused' | 'gameover'

export default function PlayPage() {
  const [gameState, setGameState] = useState<GameState>('idle')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(900) // 15 min = 900 seconds
  const [combo, setCombo] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [hasPlayed, setHasPlayed] = useState(false) // Track if user actually played
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  // Mock quarter balance for development
  const [quarterBalance, setQuarterBalance] = useState(4)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatQuarters = (quarters: number) => {
    return `${quarters}Q`
  }

  // Game timer - ticks whether playing or not once started
  useEffect(() => {
    if (gameState !== 'countdown' && gameState !== 'playing' && gameState !== 'paused') return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame(false) // time ran out
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState])

  // Check for abandon (less than 1 minute of play)
  const checkAbandon = () => {
    const playDuration = Date.now() - startTimeRef.current
    const oneMinute = 60 * 1000
    return !hasPlayed || playDuration < oneMinute
  }

  const handleTap = useCallback(() => {
    if (gameState !== 'playing') return

    setHasPlayed(true)
    const points = 10 * (1 + Math.floor(combo / 5))
    setScore((prev) => prev + points)
    setCombo((prev) => prev + 1)

    if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current)
    comboTimeoutRef.current = setTimeout(() => setCombo(0), 2000)
  }, [gameState, combo])

  const startGame = () => {
    if (quarterBalance < 1) {
      alert('No quarters! Buy more to play.')
      return
    }

    // Deduct quarter
    setQuarterBalance((prev) => prev - 1)
    startTimeRef.current = Date.now()
    setHasPlayed(false)
    setScore(0)
    setCombo(0)
    setTimeLeft(900) // 15 minutes
    setGameState('playing')
  }

  const endGame = (manual: boolean = true) => {
    const wasAbandoned = checkAbandon()

    if (wasAbandoned && manual) {
      // Quarter goes to lost & found pool
      console.log('Game abandoned - quarter goes to Lost & Found')
    }

    setGameState('gameover')
    if (score > highScore) setHighScore(score)
  }

  const abandonGame = () => {
    // Explicitly abandon - quarter goes to pool
    console.log('Quarter returned to Lost & Found pool')
    setGameState('idle')
    // Don't refund the quarter - it goes to lost pool
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* HUD */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#27272a]">
        <div>
          <div className="text-xs text-muted">Score</div>
          <div className="text-xl font-bold text-gradient">{score.toLocaleString()}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-muted">Time Left</div>
          <div className={`text-xl font-bold ${timeLeft <= 60 ? 'text-red-500' : ''}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted">Best</div>
          <div className="text-xl font-bold">{highScore.toLocaleString()}</div>
        </div>
      </div>

      {/* Quarter indicator when playing */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="text-center py-2 border-b border-[#27272a] bg-zinc-900/50">
          <span className="text-xs text-muted">
            🪙 Using 1 Quarter • {formatQuarters(quarterBalance)} remaining
          </span>
        </div>
      )}

      {/* Combo */}
      {combo > 0 && gameState === 'playing' && (
        <div className="text-center py-2">
          <span className="badge">{combo}x Combo!</span>
        </div>
      )}

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {gameState === 'idle' && (
          <div className="card text-center max-w-sm w-full">
            <div className="text-6xl mb-6">🕹️</div>
            <h2 className="text-2xl font-bold mb-2">Ready?</h2>
            <div className="mb-6">
              <div className="text-muted text-sm">Quarter Balance</div>
              <div className="text-2xl font-bold text-gradient">{formatQuarters(quarterBalance)}</div>
            </div>
            <button
              onClick={startGame}
              className="btn btn-primary btn-lg btn-full"
              disabled={quarterBalance < 1}
            >
              Insert Quarter
            </button>
            <p className="text-xs text-muted mt-3">
              1 Quarter = 15 min session • Clock starts now
            </p>
          </div>
        )}

        {gameState === 'playing' && (
          <div
            onClick={handleTap}
            className="card-glow w-full max-w-sm aspect-square flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform"
          >
            <div className="text-center">
              <div className="text-8xl mb-4">👾</div>
              <p className="text-muted">Tap to score!</p>
              {!hasPlayed && (
                <p className="text-xs text-yellow-500 mt-2">Tap within 1 min or quarter is lost!</p>
              )}
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="card text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Game Over</h2>
            <div className="mb-6">
              <div className="text-muted text-sm">Final Score</div>
              <div className="text-4xl font-bold text-gradient">{score.toLocaleString()}</div>
            </div>
            {score >= highScore && score > 0 && (
              <div className="badge badge-success mb-4">New High Score!</div>
            )}
            <div className="space-y-3">
              <button onClick={startGame} className="btn btn-primary btn-full" disabled={quarterBalance < 1}>
                Insert Another Quarter
              </button>
              <button onClick={() => setGameState('idle')} className="btn btn-secondary btn-full">
                Exit
              </button>
            </div>
          </div>
        )}

        {gameState === 'paused' && (
          <div className="card text-center max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-2">Paused</h2>
            <p className="text-muted text-sm mb-4">Clock is still running!</p>
            <div className="text-3xl font-bold mb-6">{formatTime(timeLeft)}</div>
            <div className="space-y-3">
              <button onClick={() => setGameState('playing')} className="btn btn-primary btn-full">
                Resume
              </button>
              <button onClick={() => endGame(true)} className="btn btn-secondary btn-full">
                End Game
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {gameState === 'playing' && (
        <div className="flex justify-center gap-4 p-4 border-t border-[#27272a]">
          <button onClick={() => setGameState('paused')} className="btn btn-secondary">
            Pause
          </button>
          <button onClick={() => endGame(true)} className="btn btn-secondary">
            End
          </button>
        </div>
      )}
    </div>
  )
}
